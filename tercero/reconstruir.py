"""Reconstruccion independiente del expediente a partir del libro de Horizon
y del archivo. Implementa el orden de evaluacion de tramos/2/cadena.md.

No usa nada de src/, test/, vectores/ ni scripts/.
"""

import base64
import json
import sys

import canon

CUENTA_ANCLA = "GDWWBZGPISWYOOKFWXU42MVSSZSXVTTVZW6RMVVFF4GKJ6PXIHOX342H"

EVENTOS = {"acuerdo", "hito_abierto", "declaracion", "contraste", "cierre",
           "anulacion", "incumplimiento", "controversia"}

HEX = set("0123456789abcdef")


def es_digest(x):
    return isinstance(x, str) and len(x) == 64 and all(c in HEX for c in x)


def es_clave(x):
    return es_digest(x)


def es_cuenta_stellar(x):
    if not (isinstance(x, str) and len(x) == 56 and x.startswith("G")):
        return False
    import base64 as b64
    try:
        crudo = b64.b32decode(x)
    except Exception:
        return False
    return len(crudo) == 35 and crudo[0] == 6 << 3


def cargar_libro(ruta):
    crudo = json.load(open(ruta, encoding="utf-8"))
    libro = []
    for r in crudo["_embedded"]["records"]:
        libro.append({
            "hash": r["hash"],
            "ledger": r["ledger"],
            "indice": int(r["source_account_sequence"]),
            "exito": r["successful"],
            "memo_type": r.get("memo_type"),
            "memo_b64": r.get("memo"),
            "fuente": r["source_account"],
            "paging_token": r["paging_token"],
        })
    return libro


def cargar_archivo(ruta):
    crudo = canon.desde_json_bytes(open(ruta, "rb").read())
    salida = []
    for e in crudo:
        d_calc = canon.digest(e["cuerpo"])
        salida.append({
            "digest": e["digest"],
            "cuerpo": e["cuerpo"],
            "firmas": e["firmas"],
            "digest_calculado": d_calc,
            "coincide": d_calc == e["digest"],
        })
    return salida


# --------------------------------------------------------------------------
# validacion del cuerpo de una linea
# --------------------------------------------------------------------------

def validar_cuerpo(c):
    if not isinstance(c, dict):
        return "el cuerpo no es un objeto"
    if c.get("forma") != canon.FORMA:
        return "forma distinta de TEMIS-CF-1"
    if not isinstance(c.get("expediente_id"), str) or not c["expediente_id"]:
        return "expediente_id no es cadena"
    hito = c.get("hito", "<ausente>")
    if hito == "<ausente>":
        return "falta hito"
    if hito is None:
        if c.get("tipo") != "expediente":
            return "tipo incoherente con hito nulo"
    else:
        if not isinstance(hito, str) or hito == "":
            return "hito no es cadena no vacia"
        if c.get("tipo") != "hito":
            return "tipo incoherente con hito presente"
    if c.get("evento") not in EVENTOS:
        return "evento desconocido"
    v = c.get("version", "<ausente>")
    if v == "<ausente>" or isinstance(v, bool) or not isinstance(v, int):
        return "version no es entero"
    if v < 1:
        return "version menor que 1"
    for campo in ("anterior", "anula"):
        if campo not in c:
            return "falta " + campo
        x = c[campo]
        if x is not None and not es_digest(x):
            return campo + " no es null ni digest de 64 hex minusculos"
    if not isinstance(c.get("contenido"), dict):
        return "contenido no es objeto"
    if c["evento"] == "acuerdo":
        cont = c["contenido"]
        partes = cont.get("partes")
        if not (isinstance(partes, list) and len(partes) == 2):
            return "acuerdo sin dos partes"
        claves = []
        for p in partes:
            if not isinstance(p, dict) or not isinstance(p.get("id"), str):
                return "parte sin id"
            if not es_clave(p.get("clave_publica")):
                return "parte con clave publica invalida"
            claves.append(p["clave_publica"])
        if claves[0] == claves[1]:
            return "acuerdo con dos partes de la misma clave"
        if not es_clave(cont.get("operador")):
            return "acuerdo sin operador valido"
        if not es_cuenta_stellar(cont.get("cuenta_ancla")):
            return "acuerdo sin cuenta_ancla valida"
    return None


def firmas_validas(entrada, cuerpo):
    """Devuelve (claves con firma criptograficamente valida, firmas no_parte, motivos)."""
    sobre = canon.sobre_de_firma(cuerpo, entrada["digest_calculado"])
    msg = canon.mensaje_firmado(sobre)
    validas, externas, motivos = [], [], []
    vistos = set()
    for f in entrada["firmas"]:
        if not isinstance(f, dict):
            motivos.append("firma no es objeto")
            continue
        pub = f.get("clave_publica")
        sig = f.get("firma")
        if not es_clave(pub):
            motivos.append("clave publica de firma mal formada")
            continue
        ok, motivo = canon.verificar(pub, sig, msg)
        if ok:
            if pub not in vistos:
                validas.append(pub)
                vistos.add(pub)
        else:
            if pub in externos:
                pass
            externas.append((pub, motivo))
            motivos.append("%s: %s" % (pub[:12], motivo))
    return validas, externas, motivos


def id_de_parte(acuerdo, clave):
    for p in acuerdo["contenido"]["partes"]:
        if p["clave_publica"] == clave:
            return p["id"]
    return None


def autor_de(cuerpo, validas, acuerdo):
    """'operador', 'parte:<clave>', 'partes', 'ninguno'."""
    ev = cuerpo["evento"]
    cont = cuerpo["contenido"]
    op = acuerdo["contenido"]["operador"]
    partes = [p["clave_publica"] for p in acuerdo["contenido"]["partes"]]
    if ev == "acuerdo":
        return "partes"
    if ev in ("hito_abierto", "cierre", "incumplimiento"):
        return "operador:" + op
    if ev in ("declaracion", "contraste"):
        nombre = cont.get("parte")
        if not isinstance(nombre, str):
            return "ninguno"
        for p in acuerdo["contenido"]["partes"]:
            if p["id"] == nombre:
                return "parte:" + p["clave_publica"]
        return "ninguno"
    if ev == "controversia":
        dentro = [k for k in validas if k in partes]
        if len(dentro) == 1:
            return "parte:" + dentro[0]
        if len(dentro) > 1:
            return "parte:" + dentro[0]
        return "ninguno"
    if ev == "anulacion":
        return "autor_del_objetivo"
    return "ninguno"


# --------------------------------------------------------------------------

def reconstruir(libro, archivo, cuenta_esperada=CUENTA_ANCLA):
    arch_por_declarado = {}
    arch_por_calculado = {}
    for e in archivo:
        arch_por_declarado.setdefault(e["digest"], e)
        arch_por_calculado.setdefault(e["digest_calculado"], e)

    lineas = []          # una por transaccion procesable
    por_digest = {}      # digest -> registro de linea aceptada
    claves = {}          # (exp, hito, version, evento) -> digest ganador
    acuerdos = {}        # exp -> cuerpo del acuerdo vigente
    procesados = []

    for tx in libro:
        reg = {
            "hash": tx["hash"], "ledger": tx["ledger"], "indice": tx["indice"],
            "fuente": tx["fuente"], "memo_b64": tx["memo_b64"],
            "memo_type": tx["memo_type"], "exito": tx["exito"],
            "estatus": None, "detalle": "", "digest": None, "cuerpo": None,
            "firmas": [], "no_parte": [], "procesada": False,
        }
        lineas.append(reg)

        if not tx["exito"]:
            reg["estatus"] = "no_procesada"
            reg["detalle"] = "transaccion fallida"
            continue
        if tx["memo_type"] != "hash":
            reg["estatus"] = "no_procesada"
            reg["detalle"] = "memo_type %s, no es hash" % tx["memo_type"]
            continue
        try:
            bruto = base64.b64decode(tx["memo_b64"], validate=True)
        except Exception as exc:
            reg["estatus"] = "no_procesada"
            reg["detalle"] = "memo no es base64 valido: %s" % exc
            continue
        if len(bruto) != 32:
            reg["estatus"] = "no_procesada"
            reg["detalle"] = "memo de %d bytes, no 32" % len(bruto)
            continue

        d = bruto.hex()
        reg["digest"] = d
        reg["procesada"] = True

        # 1. sin_cuerpo
        entrada = arch_por_declarado.get(d)
        if entrada is None:
            reg["estatus"] = "sin_cuerpo"
            alt = arch_por_calculado.get(d)
            if alt is not None:
                reg["detalle"] = ("el archivo trae un cuerpo cuyo digest calculado es "
                                  "este, pero lo declara como %s" % alt["digest"])
            else:
                reg["detalle"] = "ninguna entrada del archivo declara este digest"
            continue

        # 2. digest_no_coincide
        if not entrada["coincide"]:
            reg["estatus"] = "digest_no_coincide"
            reg["detalle"] = ("la entrada declara %s pero mi canonicalizador da %s"
                              % (entrada["digest"], entrada["digest_calculado"]))
            reg["cuerpo"] = entrada["cuerpo"]
            continue

        cuerpo = entrada["cuerpo"]
        reg["cuerpo"] = cuerpo
        reg["firmas"] = entrada["firmas"]

        # 3. cuerpo_invalido
        problema = validar_cuerpo(cuerpo)
        if problema:
            reg["estatus"] = "cuerpo_invalido"
            reg["detalle"] = problema
            continue

        exp = cuerpo["expediente_id"]
        ev = cuerpo["evento"]

        # 4. sin_acuerdo
        if ev != "acuerdo" and exp not in acuerdos:
            reg["estatus"] = "sin_acuerdo"
            reg["detalle"] = "el expediente %s no tiene un acuerdo vigente anterior" % exp
            continue
        if ev == "acuerdo" and exp in acuerdos:
            pass  # un segundo acuerdo del mismo expediente: lo trata regla 8

        acuerdo = cuerpo if ev == "acuerdo" else acuerdos[exp]

        # 5. cuenta_no_autorizada
        if tx["fuente"] != acuerdo["contenido"]["cuenta_ancla"]:
            reg["estatus"] = "cuenta_no_autorizada"
            reg["detalle"] = ("la transaccion salio de %s y el acuerdo declara %s"
                              % (tx["fuente"], acuerdo["contenido"]["cuenta_ancla"]))
            continue

        validas, externas, motivos = firmas_validas(entrada, cuerpo)
        partes = {p["clave_publica"]: p["id"]
                  for p in acuerdo["contenido"]["partes"]}
        op = acuerdo["contenido"]["operador"]
        # una firma criptograficamente valida de una clave que no es parte ni
        # operador se reporta como no_parte y no cuenta (forma-canonica.md)
        reg["no_parte"] = [k for k in validas
                           if k not in partes and k != op]
        reg["firmas_validas"] = validas
        reg["motivos_firma"] = motivos

        # 6. firmas_insuficientes / anulacion_no_valida
        if ev == "anulacion":
            objetivo = por_digest.get(cuerpo["anula"]) if cuerpo["anula"] else None
            problemas = []
            if objetivo is None:
                problemas.append("el objetivo %s no es una linea aceptada"
                                 % str(cuerpo["anula"])[:12])
            else:
                oc = objetivo["cuerpo"]
                if oc["expediente_id"] != exp:
                    problemas.append("el objetivo es de otro expediente")
                if oc["hito"] != cuerpo["hito"]:
                    problemas.append("el objetivo es de otro hito")
                if oc["evento"] in ("acuerdo", "anulacion"):
                    problemas.append("el objetivo es un acuerdo o una anulacion")
                if objetivo["estatus"] != "vigente":
                    problemas.append("el objetivo ya no esta vigente (%s)"
                                     % objetivo["estatus"])
                autor = objetivo["autor"]
                if autor is None or not autor.startswith("parte:") \
                        and autor != "operador:" + op:
                    problemas.append("el autor del objetivo no es determinable")
                elif autor.startswith("parte:"):
                    needed = [autor[6:]]
                else:
                    needed = [op]
                if not any(k in validas for k in needed):
                    problemas.append("falta la firma de %s, que es el autor de lo anulado"
                                     % (autor[6:12] if autor.startswith("parte:")
                                        else "el operador"))
            if problemas:
                reg["estatus"] = "anulacion_no_valida"
                reg["detalle"] = "; ".join(problemas)
                continue
            reg["detalle"] = "anulacion valida de %s" % cuerpo["anula"][:12]
        else:
            required = []
            if ev == "acuerdo":
                required = [p["clave_publica"] for p in cuerpo["contenido"]["partes"]]
            elif ev == "controversia":
                required = None  # basta una parte
            else:
                a = autor_de(cuerpo, validas, acuerdo)
                if a.startswith("operador:"):
                    required = [op]
                elif a.startswith("parte:"):
                    required = [a[6:]]
                else:
                    required = [("__imposible__",)]
            if required is None:
                dentro = [k for k in validas if k in partes]
                if not dentro:
                    reg["estatus"] = "firmas_insuficientes"
                    reg["detalle"] = "ninguna parte firma; " + ("; ".join(motivos) or "-")
                    continue
            else:
                faltan = [k for k in required if k not in validas]
                if faltan:
                    etiquetas = [partes.get(k, k[:12] + " (fuera de partes)")
                                 for k in faltan]
                    reg["estatus"] = "firmas_insuficientes"
                    reg["detalle"] = "falta la firma de %s; %s" % (
                        ", ".join(etiquetas), "; ".join(motivos) or "-")
                    continue

            # el contraste exige ademas que quien responde sea la otra parte
            if ev == "contraste":
                cont = cuerpo["contenido"]
                acc = cont.get("accion")
                if acc not in ("aceptar", "impugnar") or not es_digest(cont.get("declaracion")):
                    reg["estatus"] = "contraste_sin_objetivo"
                    reg["detalle"] = ("contenido.accion=%r y contenido.declaracion=%r no "
                                      "forman un contraste bien formado"
                                      % (acc, str(cont.get("declaracion"))[:12]))
                    continue
                decl = por_digest.get(cont["declaracion"])
                autor_decl = decl["autor"] if decl else None
                el_que_responde = autor_de(cuerpo, validas, acuerdo)
                if decl is None or autor_decl is None or not autor_decl.startswith("parte:"):
                    reg["estatus"] = "firmas_insuficientes"
                    reg["detalle"] = "la declaracion citada no es una linea de parte aceptada"
                    continue
                if el_que_responde == "parte:" + autor_decl[6:]:
                    reg["estatus"] = "firmas_insuficientes"
                    reg["detalle"] = "quien responde es la misma parte que declaro"
                    continue

        # 7. contraste_sin_objetivo
        if ev == "contraste":
            cont = cuerpo["contenido"]
            decl = por_digest.get(cont.get("declaracion"))
            vigente_decl = declaracion_vigente(por_digest, cuerpo["hito"])
            if decl is None or decl["cuerpo"]["evento"] != "declaracion":
                reg["estatus"] = "contraste_sin_objetivo"
                reg["detalle"] = ("contenido.declaracion=%s no es una declaracion aceptada"
                                  % str(cont.get("declaracion"))[:12])
                continue
            if decl["cuerpo"]["hito"] != cuerpo["hito"]:
                reg["estatus"] = "contraste_sin_objetivo"
                reg["detalle"] = "la declaracion citada es de otro hito"
                continue
            if vigente_decl is None or cont["declaracion"] != vigente_decl["digest"]:
                reg["estatus"] = "contraste_sin_objetivo"
                reg["detalle"] = ("apunta a %s pero la declaracion vigente del hito es %s"
                                  % (cont["declaracion"][:12],
                                     vigente_decl["digest"][:12] if vigente_decl else "ninguna"))
                continue

        # 8. perdedora (se evalúa antes que la cadena)
        k = (exp, cuerpo["hito"], cuerpo["version"], ev)
        if k in claves:
            reg["estatus"] = "perdedora"
            reg["detalle"] = "la clave %r ya la gano %s" % (k, claves[k][:12])
            continue

        # 9. fuera_de_cadena
        anterior = cuerpo["anterior"]
        if ev == "acuerdo":
            if anterior is not None:
                reg["estatus"] = "fuera_de_cadena"
                reg["detalle"] = "un acuerdo exige anterior null"
                continue
        else:
            ant = por_digest.get(anterior) if anterior else None
            if anterior is None or ant is None or ant["cuerpo"]["expediente_id"] != exp:
                reg["estatus"] = "fuera_de_cadena"
                reg["detalle"] = ("anterior=%s no es una linea aceptada de %s"
                                  % (str(anterior)[:12], exp))
                continue

        # 10. cierre_sin_respaldo
        if ev == "cierre":
            problema = cierre_sin_respaldo(cuerpo, por_digest)
            if problema:
                reg["estatus"] = "cierre_sin_respaldo"
                reg["detalle"] = problema
                continue

        # 11. vigente
        reg["estatus"] = "vigente"
        reg["detalle"] = reg["detalle"] or "aceptada"
        if ev == "anulacion":
            objetivo = por_digest[cuerpo["anula"]]
            objetivo["estatus"] = "anulada"
            objetivo["anulada_por"] = d
            reg["detalle"] = "anulacion valida de %s" % cuerpo["anula"][:12]

        reg["autor"] = autor_de(cuerpo, validas, acuerdo)
        reg["firmas_validas"] = validas
        por_digest[d] = reg
        claves[k] = d
        if ev == "acuerdo":
            acuerdos[exp] = cuerpo
        procesados.append(reg)

    return lineas


def declaracion_vigente(por_digest, hito):
    candidatas = [r for r in por_digest.values()
                  if r["estatus"] == "vigente"
                  and r["cuerpo"]["evento"] == "declaracion"
                  and r["cuerpo"]["hito"] == hito]
    if not candidatas:
        return None
    candidatas.sort(key=lambda r: (r["ledger"], r["indice"]))
    return candidatas[-1]


def respuestas_vigentes(por_digest, hito, digest_decl):
    salida = []
    for r in por_digest.values():
        if r["estatus"] != "vigente":
            continue
        c = r["cuerpo"]
        if c["evento"] != "contraste" or c["hito"] != hito:
            continue
        if c["contenido"].get("declaracion") == digest_decl:
            salida.append(r)
    return salida


def cierre_sin_respaldo(cuerpo, por_digest):
    resultado = cuerpo["contenido"].get("resultado")
    decl = declaracion_vigente(por_digest, cuerpo["hito"])
    if decl is None:
        return "cierre sin declaracion vigente en el hito"
    resp = respuestas_vigentes(por_digest, cuerpo["hito"], decl["digest"])
    acepta = [r for r in resp if r["cuerpo"]["contenido"].get("accion") == "aceptar"]
    impugna = [r for r in resp if r["cuerpo"]["contenido"].get("accion") == "impugnar"]
    if resultado == "cumplido":
        if not acepta and impugna:
            return ("cierre 'cumplido' sin aceptacion y con una impugnacion vigente "
                    "a la declaracion %s" % decl["digest"][:12])
        return None
    if resultado == "cumplido_no_confirmado":
        if resp:
            return ("cierre 'cumplido_no_confirmado' con %d respuesta(s) a la "
                    "declaracion %s" % (len(resp), decl["digest"][:12]))
        return None
    return None