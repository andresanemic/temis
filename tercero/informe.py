"""Salida de la reconstruccion: tabla, estados y comparacion con la copia."""

import sys

import canon
import reconstruir


def estado_hito(lineas, hito):
    """cadena.md, 'Estado de un hito'."""
    vivas = [r for r in lineas
             if r["cuerpo"] and r["cuerpo"]["hito"] == hito
             and r["estatus"] == "vigente"]
    if not any(r["cuerpo"]["evento"] == "hito_abierto" for r in vivas):
        return None, ["sin hito_abierto vigente: el hito no existe"]
    por_digest = {r["digest"]: r for r in lineas
                  if r["cuerpo"] and r["estatus"] == "vigente"}
    decls = [r for r in vivas if r["cuerpo"]["evento"] == "declaracion"]
    decls.sort(key=lambda r: (r["ledger"], r["indice"]))
    decl_vig = decls[-1] if decls else None
    cierres = [r for r in vivas if r["cuerpo"]["evento"] == "cierre"
               and r["cuerpo"]["contenido"].get("resultado") in
               ("cumplido", "cumplido_no_confirmado")]
    notas = []
    if cierres:
        cierres.sort(key=lambda r: (r["ledger"], r["indice"]))
        return cierres[-1]["cuerpo"]["contenido"]["resultado"], [
            "cierre %s en %s" % (cierres[-1]["cuerpo"]["contenido"]["resultado"],
                                 cierres[-1]["digest"][:12])]
    if any(r["cuerpo"]["evento"] == "incumplimiento" for r in vivas):
        return "incumplido", ["linea de incumplimiento vigente"]
    if decl_vig is None:
        return "abierto", ["sin declaracion vigente"]
    resp = [r for r in vivas if r["cuerpo"]["evento"] == "contraste"
            and r["cuerpo"]["contenido"].get("declaracion") == decl_vig["digest"]]
    notas.append("declaracion vigente %s" % decl_vig["digest"][:12])
    resp.sort(key=lambda r: (r["ledger"], r["indice"]))
    if any(r["cuerpo"]["contenido"]["accion"] == "impugnar" for r in resp):
        return "impugnado", notas + ["impugnacion vigente"]
    if any(r["cuerpo"]["contenido"]["accion"] == "aceptar" for r in resp):
        return "acordado", notas + ["aceptacion vigente"]
    return "declarado_por_una_parte", notas + ["sin respuestas vigentes"]


def main():
    libro = reconstruir.cargar_libro("tercero/libro-horizon.json")
    archivo = reconstruir.cargar_archivo("datos/e2e/archivo.json")
    lineas = reconstruir.reconstruir(libro, archivo)

    anclados = {r["digest"] for r in lineas if r["procesada"]}
    print("### TRANSACCIONES DE LA CUENTA ANCLA")
    for i, r in enumerate(lineas):
        c = r["cuerpo"]
        d = r["digest"]
        etiqueta = "%d %s v%s %s" % (i, (c["hito"] or "expediente"), c["version"],
                                     c["evento"]) if c else "sin cuerpo"
        print("| %d | %d | %s | `%s` | %s | %s |" % (
            i + 1, r["ledger"], d[:16] + "…" if d else "—", etiqueta,
            r["estatus"], r["detalle"]))

    print()
    print("### CUERPOS DEL ARCHIVO QUE NO APARECEN EN EL HISTORIAL")
    falta = []
    for i, e in enumerate(archivo):
        if e["digest"] in anclados:
            continue
        c = e["cuerpo"]
        falta.append((i, e))
        print("- entrada #%d declara %s (mi calculo da %s): %s v%s %s"
              % (i, e["digest"][:16], e["digest_calculado"][:16],
                 c["hito"] or "expediente", c["version"], c["evento"]))
    if not falta:
        print("(ninguno)")

    print()
    print("### MEMOS DEL HISTORIAL SIN CUERPO EN EL ARCHIVO")
    for r in lineas:
        if r["estatus"] == "sin_cuerpo":
            print("- ledger %d, digest %s" % (r["ledger"], r["digest"]))

    print()
    print("### ESTADOS DE HITO")
    hitos = set()
    for r in lineas:
        if r["cuerpo"] and r["cuerpo"]["hito"]:
            hitos.add(r["cuerpo"]["hito"])
    for e in archivo:
        if e["cuerpo"].get("hito"):
            hitos.add(e["cuerpo"]["hito"])
    for h in sorted(hitos):
        est, notas = estado_hito(lineas, h)
        print("- %s: %s   (%s)" % (h, est or "no existe", "; ".join(notas)))

    print()
    print("### FIRMAS")
    for i, r in enumerate(lineas):
        if not r["cuerpo"]:
            continue
        v = r.get("firmas_validas", [])
        np = r.get("no_parte", [])
        print("- #%d %s v%s %s: validas=%s no_parte=%s"
              % (i + 1, r["cuerpo"]["hito"] or "exp", r["cuerpo"]["version"],
                 r["cuerpo"]["evento"],
                 [k[:10] for k in v] or "-", [k[:10] for k in np] or "-"))

    print()
    print("### ANTERIOR INVALIDO")
    for e in archivo:
        a = e["cuerpo"].get("anterior")
        if a is not None and not reconstruir.es_digest(a):
            print("- %s anterior=%r (long %d, no es digest de 64 hex)"
                  % (e["digest"][:12], a, len(a) if isinstance(a, str) else -1))


if __name__ == "__main__":
    main()