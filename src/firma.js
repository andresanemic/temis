'use strict';

// TEMIS-CF-1, capa de firma: sobre canonico, etiqueta de contexto, ed25519
// con verificacion estricta y estado de acuerdo. Ver tramos/1/forma-canonica.md.

const crypto = require('node:crypto');
const cf = require('./canonical.js');

const P = (1n << 255n) - 19n;
const L = (1n << 252n) + 27742317777372353535851937790883648493n;
const ETIQUETA = Buffer.from('TEMIS-FIRMA-1', 'utf8');
const SPKI_ED25519 = Buffer.from('302a300506032b6570032100', 'hex');

class ErrorFirma extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorFirma';
  }
}

function fallar(mensaje) {
  throw new ErrorFirma(mensaje);
}

// --- aritmetica modular (BigInt) -------------------------------------------

function reducir(a, m) {
  return ((a % m) + m) % m;
}

function potenciaMod(base, exponente, m) {
  let r = 1n;
  let b = reducir(base, m);
  let e = exponente;
  while (e > 0n) {
    if (e & 1n) r = (r * b) % m;
    b = (b * b) % m;
    e >>= 1n;
  }
  return r;
}

function inversoMod(a, m) {
  let [r0, r1] = [reducir(a, m), m];
  let [s0, s1] = [1n, 0n];
  while (r1 !== 0n) {
    const q = r0 / r1;
    [r0, r1] = [r1, r0 - q * r1];
    [s0, s1] = [s1, s0 - q * s1];
  }
  return reducir(s0, m);
}

const D = reducir(-121665n * inversoMod(121666n, P), P);
const RAIZ_DE_MENOS_UNO = potenciaMod(2n, (P - 1n) / 4n, P);

// -x^2 + y^2 = 1 + d*x^2*y^2, con p = 5 (mod 8): x = (u/v)^((p+3)/8),
// corregido con sqrt(-1) si hace falta. null si y no corresponde a un punto.
function coordenadaX(y) {
  const y2 = (y * y) % P;
  const u = reducir(y2 - 1n, P);
  const v = reducir(D * y2 + 1n, P);
  if (v === 0n) return null;
  const xx = (u * inversoMod(v, P)) % P;
  let x = potenciaMod(xx, (P + 3n) / 8n, P);
  if (reducir(x * x - xx, P) !== 0n) x = (x * RAIZ_DE_MENOS_UNO) % P;
  if (reducir(x * x - xx, P) !== 0n) return null;
  return x;
}

// Coordenadas extendidas (X, Y, Z, T) con x = X/Z, y = Y/Z, T = XY/Z.
function puntoDesdeY(y) {
  const x = coordenadaX(y);
  if (x === null) return null;
  return { X: x, Y: y, Z: 1n, T: (x * y) % P };
}

function duplicar(Q) {
  const A = (Q.X * Q.X) % P;
  const B = (Q.Y * Q.Y) % P;
  const C = (2n * Q.Z * Q.Z) % P;
  const Dd = reducir(-A, P);
  const E = reducir((Q.X + Q.Y) * (Q.X + Q.Y) - A - B, P);
  const G = reducir(Dd + B, P);
  const F = reducir(G - C, P);
  const H = reducir(Dd - B, P);
  return { X: (E * F) % P, Y: (G * H) % P, Z: (F * G) % P, T: (E * H) % P };
}

function multiplicarPor8(Q) {
  return duplicar(duplicar(duplicar(Q)));
}

function esIdentidad(Q) {
  return Q.X % P === 0n && reducir(Q.Y - Q.Z, P) === 0n;
}

// --- formatos hex ----------------------------------------------------------

function esHex(texto, largo) {
  return typeof texto === 'string' && texto.length === largo && /^[0-9a-f]+$/.test(texto);
}

// Bytes en orden little-endian (ed25519) a entero: el primer byte es el menos
// significativo.
function leNumero(buf) {
  let n = 0n;
  for (let i = buf.length - 1; i >= 0; i -= 1) n = (n << 8n) | BigInt(buf[i]);
  return n;
}

// Coordenada y: 255 bits little-endian, sin el bit de signo (que codifica el
// signo de x, no parte de la coordenada).
const SIN_BIT_DE_SIGNO = (1n << 255n) - 1n;

function leCoordenada(buf) {
  return leNumero(buf) & SIN_BIT_DE_SIGNO;
}

// --- API --------------------------------------------------------------------

function sobreDeFirma(cuerpo) {
  if (cuerpo === null || typeof cuerpo !== 'object' || Array.isArray(cuerpo)) {
    fallar('el cuerpo debe ser un objeto');
  }
  if (cuerpo.forma !== 'TEMIS-CF-1') fallar(`forma desconocida: ${String(cuerpo.forma)}`);
  if (cuerpo.tipo !== 'expediente' && cuerpo.tipo !== 'hito') {
    fallar(`tipo desconocido: ${String(cuerpo.tipo)}`);
  }
  if (typeof cuerpo.expediente_id !== 'string' || cuerpo.expediente_id.length === 0) {
    fallar('expediente_id debe ser una cadena no vacia');
  }
  const version = cuerpo.version;
  if (typeof version === 'bigint') {
    if (version < 1n || version > 2n ** 63n - 1n) fallar('version debe ser un entero >= 1');
  } else if (typeof version === 'number') {
    if (!Number.isSafeInteger(version) || version < 1) fallar('version debe ser un entero >= 1');
  } else {
    fallar('version debe ser un entero >= 1');
  }
  return {
    digest: cf.digest(cuerpo),
    expediente_id: cuerpo.expediente_id,
    forma: 'TEMIS-CF-1',
    tipo: cuerpo.tipo,
    version,
  };
}

function mensajeAFirmar(sobre) {
  return Buffer.concat([ETIQUETA, Buffer.from([0x00]), Buffer.from(cf.canonicalizar(sobre), 'utf8')]);
}

function firmar(clavePrivada, sobre) {
  return crypto.sign(null, mensajeAFirmar(sobre), clavePrivada).toString('hex');
}

// Nunca lanza: devuelve {ok:true} o {ok:false, motivo}.
function verificar(clavePublicaHex, sobre, firmaHex) {
  try {
    if (!esHex(clavePublicaHex, 64) || !esHex(firmaHex, 128)) {
      return { ok: false, motivo: 'formato' };
    }
    const clave = Buffer.from(clavePublicaHex, 'hex');
    const firma = Buffer.from(firmaHex, 'hex');

    const y = leCoordenada(clave.subarray(0, 32));
    if (y >= P) return { ok: false, motivo: 'clave_no_canonica' };
    const punto = puntoDesdeY(y);
    if (punto === null) return { ok: false, motivo: 'clave_no_valida' };
    if (esIdentidad(multiplicarPor8(punto))) return { ok: false, motivo: 'clave_orden_pequeno' };

    const R = leCoordenada(firma.subarray(0, 32));
    if (R >= P) return { ok: false, motivo: 'R_no_canonica' };
    const S = leNumero(firma.subarray(32, 64));
    if (S >= L) return { ok: false, motivo: 'S_fuera_de_rango' };

    const publica = crypto.createPublicKey({
      key: Buffer.concat([SPKI_ED25519, clave]), format: 'der', type: 'spki',
    });
    const buena = crypto.verify(null, mensajeAFirmar(sobre), publica, firma);
    return buena ? { ok: true } : { ok: false, motivo: 'firma_invalida' };
  } catch (e) {
    return { ok: false, motivo: 'firma_invalida' };
  }
}

function estadoDeAcuerdo(argumento) {
  if (argumento === null || typeof argumento !== 'object') fallar('se esperaba {cuerpo, sobre, firmas}');
  const { cuerpo, sobre, firmas } = argumento;

  if (cuerpo === null || typeof cuerpo !== 'object' || Array.isArray(cuerpo)) {
    fallar('el cuerpo debe ser un objeto');
  }
  const partes = cuerpo.partes;
  if (!Array.isArray(partes) || partes.length !== 2) {
    fallar('un expediente declara exactamente dos partes');
  }
  const claves = partes.map((parte) => {
    if (parte === null || typeof parte !== 'object' || Array.isArray(parte)) fallar('parte invalida');
    if (typeof parte.clave_publica !== 'string' || parte.clave_publica.length === 0) {
      fallar('cada parte declara clave_publica');
    }
    return parte.clave_publica;
  });
  if (claves[0] === claves[1]) fallar('las dos partes deben tener claves distintas');

  const esperado = sobreDeFirma(cuerpo);
  if (cf.canonicalizar(sobre) !== cf.canonicalizar(esperado)) {
    fallar('el sobre no corresponde al cuerpo');
  }
  if (!Array.isArray(firmas)) fallar('firmas debe ser una lista');

  const firmantes = [];
  const rechazadas = [];
  for (const entrada of firmas) {
    if (entrada === null || typeof entrada !== 'object') fallar('firma invalida');
    const clave = entrada.clave_publica;
    if (firmantes.includes(clave)) continue;
    if (!claves.includes(clave)) {
      rechazadas.push({ clave, motivo: 'no_parte' });
      continue;
    }
    const r = verificar(clave, sobre, entrada.firma);
    if (r.ok) {
      firmantes.push(clave);
    } else if (!rechazadas.some((x) => x.clave === clave)) {
      rechazadas.push({ clave, motivo: r.motivo });
    }
  }

  return { estado: firmantes.length === 2 ? 'acordado' : 'pendiente', firmantes, rechazadas };
}

module.exports = {
  ErrorFirma,
  sobreDeFirma,
  mensajeAFirmar,
  firmar,
  verificar,
  estadoDeAcuerdo,
};