"""Canonicalizador TEMIS-CF-1 y ed25519 (RFC 8032), escritos desde cero.

Implementado solo con la biblioteca estandar de Python, leyendo unicamente
tramos/1/forma-canonica.md y tramos/2/cadena.md. No lee nada de src/.

Nucleo de la forma canonica:
  - lector JSON estricto (rechaza lo que la especificacion manda rechazar)
  - salida sin espacio en blanco, claves ordenadas por bytes UTF-8,
    cadenas NFC, enteros int64 en forma minima
  - digest = SHA-256 sobre los bytes UTF-8 de la forma canonica, hex minusculo
"""

import hashlib
import json
import unicodedata

UNICODE_VERSION = unicodedata.unidata_version

FORMA = "TEMIS-CF-1"
ETIQUETA_FIRMA = b"TEMIS-FIRMA-1\x00"
INT64_MIN = -(2**63)
INT64_MAX = 2**63 - 1

HEX64 = set("0123456789abcdef")


class CanonError(ValueError):
    pass


# --------------------------------------------------------------------------
# lector estricto
# --------------------------------------------------------------------------

_ESPACIOS = " \t\n\r"


class _Lector:
    def __init__(self, texto):
        self.t = texto
        self.i = 0
        self.n = len(texto)

    def error(self, msg):
        raise CanonError("%s (offset %d)" % (msg, self.i))

    def saltar(self):
        while self.i < self.n and self.t[self.i] in _ESPACIOS:
            self.i += 1

    def fin(self):
        self.saltar()
        if self.i != self.n:
            self.error("texto sobrante tras el valor")

    def peek(self):
        return self.t[self.i] if self.i < self.n else ""

    def valor(self):
        self.saltar()
        c = self.peek()
        if c == "":
            self.error("entrada terminada antes de un valor")
        if c == "{":
            return self.objeto()
        if c == "[":
            return self.arreglo()
        if c == '"':
            return self.cadena()
        if c == "-" or c.isdigit():
            return self.numero()
        for lit, val in (("true", True), ("false", False), ("null", None)):
            if self.t.startswith(lit, self.i):
                despues = self.t[self.i + len(lit):self.i + len(lit) + 1]
                if despues and (despues.isalnum() or despues == "_"):
                    continue
                self.i += len(lit)
                return val
        self.error("token inesperado %r" % c)

    def objeto(self):
        self.i += 1  # {
        pares = []
        vistas = set()
        self.saltar()
        if self.peek() == "}":
            self.i += 1
            return self._cerrar_objeto(pares)
        while True:
            self.saltar()
            if self.peek() != '"':
                self.error("se esperaba una clave de objeto")
            k = self.cadena()
            if k in vistas:
                self.error("clave duplicada %r" % k)
            vistas.add(k)
            self.saltar()
            if self.peek() != ":":
                self.error("se esperaba ':'")
            self.i += 1
            pares.append((k, self.valor()))
            self.saltar()
            c = self.peek()
            if c == ",":
                self.i += 1
                self.saltar()
                if self.peek() == "}":
                    self.error("coma final")
                continue
            if c == "}":
                self.i += 1
                return self._cerrar_objeto(pares)
            self.error("se esperaba ',' o '}'")

    def _cerrar_objeto(self, pares):
        return ("__obj__", pares)

    def arreglo(self):
        self.i += 1  # [
        items = []
        self.saltar()
        if self.peek() == "]":
            self.i += 1
            return ("__arr__", items)
        while True:
            items.append(self.valor())
            self.saltar()
            c = self.peek()
            if c == ",":
                self.i += 1
                self.saltar()
                if self.peek() == "]":
                    self.error("coma final")
                continue
            if c == "]":
                self.i += 1
                return ("__arr__", items)
            self.error("se esperaba ',' o ']'")

    def numero(self):
        inicio = self.i
        if self.peek() == "-":
            self.i += 1
        if self.i >= self.n or not self.t[self.i].isdigit() or not self.t[self.i].isascii():
            self.error("numero mal formado")
        if self.t[self.i] == "0":
            self.i += 1
            if self.i < self.n and self.t[self.i].isascii() and self.t[self.i].isdigit():
                self.error("cero a la izquierda")
        else:
            while self.i < self.n and self.t[self.i].isascii() and self.t[self.i].isdigit():
                self.i += 1
        if self.i < self.n and self.t[self.i] in ".eE+":
            self.error("solo se admiten enteros (sin fraccion ni exponente)")
        lexema = self.t[inicio:self.i]
        valor = int(lexema)
        if lexema == "-0":
            self.error("se rechaza -0")
        if not (INT64_MIN <= valor <= INT64_MAX):
            self.error("entero fuera del rango int64")
        return valor

    def cadena(self):
        self.i += 1  # comilla de apertura
        partes = []
        while True:
            if self.i >= self.n:
                self.error("cadena sin cerrar")
            c = self.t[self.i]
            if c == '"':
                self.i += 1
                return _normalizar_cadena("".join(partes))
            if c == "\\":
                self.i += 1
                if self.i >= self.n:
                    self.error("escape truncado")
                e = self.t[self.i]
                simples = {'"': '"', "\\": "\\", "/": "/", "b": "\b",
                           "f": "\f", "n": "\n", "r": "\r", "t": "\t"}
                if e in simples:
                    partes.append(simples[e])
                    self.i += 1
                elif e == "u":
                    hexa = self.t[self.i + 1:self.i + 5]
                    if len(hexa) != 4 or any(h not in "0123456789abcdefABCDEF" for h in hexa):
                        self.error("escape \\u mal formado")
                    cp = int(hexa, 16)
                    if 0xD800 <= cp <= 0xDBFF:
                        if self.t[self.i + 5:self.i + 7] != "\\u":
                            self.error("sustituto alto sin sustituto bajo")
                        hexb = self.t[self.i + 7:self.i + 11]
                        if len(hexb) != 4 or any(h not in "0123456789abcdefABCDEF" for h in hexb):
                            self.error("escape \\u mal formado")
                        bajo = int(hexb, 16)
                        if not (0xDC00 <= bajo <= 0xDFFF):
                            self.error("sustituto alto mal emparejado")
                        cp = 0x10000 + ((cp - 0xD800) << 10) + (bajo - 0xDC00)
                        self.i += 10
                    elif 0xDC00 <= cp <= 0xDFFF:
                        self.error("sustituto suelto")
                    self.i += 5
                    partes.append(chr(cp))
                else:
                    self.error("escape desconocido \\%s" % e)
                continue
            if ord(c) <= 0x1F:
                self.error("control sin escapar en cadena")
            partes.append(c)
            self.i += 1


def _normalizar_cadena(s):
    for ch in s:
        cat = unicodedata.category(ch)
        if cat == "Cn":
            raise CanonError("punto de codigo sin asignar U+%04X" % ord(ch))
        if cat == "Cs":
            raise CanonError("sustituto suelto U+%04X" % ord(ch))
    return unicodedata.normalize("NFC", s)


def leer(texto):
    """Devuelve el valor leido por el lector estricto de CF-1."""
    if texto.startswith("\ufeff"):
        raise CanonError("BOM")
    l = _Lector(texto)
    v = l.valor()
    l.fin()
    return v


def leer_bytes(b):
    if b.startswith(b"\xef\xbb\xbf"):
        raise CanonError("BOM")
    try:
        return leer(b.decode("utf-8"))
    except UnicodeDecodeError as exc:
        raise CanonError("UTF-8 invalido: %s" % exc)


def _a_python(v):
    if type(v) is tuple and v[0] == "__obj__":
        return {k: _a_python(x) for k, x in v[1]}
    if type(v) is tuple and v[0] == "__arr__":
        return [_a_python(x) for x in v[1]]
    return v


def desde_json(texto):
    """Atajo: lee con el lector estricto y devuelve el valor de Python."""
    return _a_python(leer(texto))


def desde_json_bytes(b):
    return _a_python(leer_bytes(b))


# --------------------------------------------------------------------------
# forma canonica
# --------------------------------------------------------------------------

_ESCAPES = {"\b": "\\b", "\t": "\\t", "\n": "\\n", "\f": "\\f", "\r": "\\r"}


def _escapar(s):
    out = ['"']
    for ch in s:
        if ch == '"':
            out.append('\\"')
        elif ch == "\\":
            out.append("\\\\")
        elif ch in _ESCAPES:
            out.append(_ESCAPES[ch])
        elif ord(ch) <= 0x1F:
            out.append("\\u%04x" % ord(ch))
        else:
            out.append(ch)
    out.append('"')
    return "".join(out)


def _canon(v):
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, int):
        if not (INT64_MIN <= v <= INT64_MAX):
            raise CanonError("entero fuera de rango int64 en la salida")
        return str(v)
    if isinstance(v, str):
        return _escapar(v)
    if isinstance(v, dict):
        claves = [_normalizar_cadena(k) for k in v.keys()]
        if len(set(claves)) != len(claves):
            raise CanonError("claves duplicadas tras NFC")
        pares = sorted(zip(claves, [_canon(v[k]) for k in v.keys()]),
                       key=lambda kv: kv[0].encode("utf-8"))
        return "{" + ",".join(_escapar(k) + ":" + val for k, val in pares) + "}"
    if isinstance(v, (list, tuple)):
        return "[" + ",".join(_canon(x) for x in v) + "]"
    raise CanonError("tipo no canonizable: %r" % type(v))


def canonico(valor):
    """Forma canonica CF-1 como texto."""
    return _canon(valor)


def bytes_canonicos(valor):
    return canonico(valor).encode("utf-8")


def digest(valor):
    """SHA-256 de los bytes UTF-8 de la forma canonica, 64 hex minusculos."""
    return hashlib.sha256(bytes_canonicos(valor)).hexdigest()


def sobre_de_firma(cuerpo, digest_cuerpo):
    """Sobre canonico: {digest, expediente_id, forma, tipo, version} en CF-1."""
    return {
        "digest": digest_cuerpo,
        "expediente_id": cuerpo["expediente_id"],
        "forma": cuerpo["forma"],
        "tipo": cuerpo["tipo"],
        "version": cuerpo["version"],
    }


def mensaje_firmado(sobre):
    return ETIQUETA_FIRMA + bytes_canonicos(sobre)


# --------------------------------------------------------------------------
# ed25519 (RFC 8032), aritmetica entera y hashlib
# --------------------------------------------------------------------------

_P = 2**255 - 19
_L = 2**252 + 27742317777372353535851937790883648493
_D = (-121665 * pow(121666, _P - 2, _P)) % _P


def _x_recuperar(y, signo):
    if y >= _P:
        return None
    yy = (y * y) % _P
    num = (yy - 1) % _P
    den = (_D * yy + 1) % _P
    if den == 0:
        return None
    x2 = (num * pow(den, _P - 2, _P)) % _P
    if x2 == 0:
        return None if signo else 0
    x = pow(x2, (_P + 3) // 8, _P)
    if (x * x - x2) % _P != 0:
        x = (x * pow(2, (_P - 1) // 4, _P)) % _P
    if (x * x - x2) % _P != 0:
        return None
    if (x & 1) != signo:
        x = _P - x
    return x


def _decodificar(b32):
    if len(b32) != 32:
        return None
    y = int.from_bytes(b32, "little")
    signo = (y >> 255) & 1
    y &= (1 << 255) - 1
    x = _x_recuperar(y, signo)
    if x is None:
        return None
    return (x, y, 1, (x * y) % _P)


def _codificar(Pt):
    zi = pow(Pt[2], _P - 2, _P)
    x = (Pt[0] * zi) % _P
    y = (Pt[1] * zi) % _P
    return ((y | ((x & 1) << 255))).to_bytes(32, "little")


def _sumar(Pt, Q):
    a = ((Pt[1] - Pt[0]) * (Q[1] - Q[0])) % _P
    b = ((Pt[1] + Pt[0]) * (Q[1] + Q[0])) % _P
    c = (2 * Pt[3] * Q[3] * _D) % _P
    d = (2 * Pt[2] * Q[2]) % _P
    e = b - a
    f = d - c
    g = d + c
    h = b + a
    return ((e * f) % _P, (g * h) % _P, (f * g) % _P, (e * h) % _P)


_By = (4 * pow(5, _P - 2, _P)) % _P
_Bx = _x_recuperar(_By, 0)
B = (_Bx, _By, 1, (_Bx * _By) % _P)
IDENTIDAD = (0, 1, 1, 0)


def _escalar(Pt, e):
    R = IDENTIDAD
    Q = Pt
    while e > 0:
        if e & 1:
            R = _sumar(R, Q)
        Q = _sumar(Q, Q)
        e >>= 1
    return R


def verificar(clave_pub_hex, firma_hex, mensaje=b""):
    """Verificacion ed25519 estricta. Devuelve (ok, motivo)."""
    if len(clave_pub_hex) != 64 or any(c not in HEX64 for c in clave_pub_hex):
        return False, "clave publica no es 64 hex minusculo"
    if len(firma_hex) != 128 or any(c not in HEX64 for c in firma_hex):
        return False, "firma no es 128 hex minusculo"
    pub = bytes.fromhex(clave_pub_hex)
    sig = bytes.fromhex(firma_hex)
    A = _decodificar(pub)
    if A is None:
        return False, "A no canonica (y >= p o x no recuperable)"
    R = _decodificar(sig[:32])
    if R is None:
        return False, "R no canonica"
    S = int.from_bytes(sig[32:], "little")
    if S >= _L:
        return False, "S >= L"
    if _codificar(_escalar(A, 8)) == _codificar(IDENTIDAD):
        return False, "A de orden no pequeno"
    k = int.from_bytes(
        hashlib.sha512(sig[:32] + pub + mensaje).digest(), "little") % _L
    if _codificar(_escalar(B, S)) != _codificar(_sumar(R, _escalar(A, k))):
        return False, "la ecuacion de verificacion no se cumple"
    return True, "ok"