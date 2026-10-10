# Cotejo por hash del candidato del whitepaper

Hecho el 2026-10-02 por el coordinador (Sonnet 5.5, Claude Code), con `sha256sum`.

| Archivo | Bytes | SHA-256 |
|---|---|---|
| `bot-lus-lore/notas/2026-09-30_operacion-unidad/entrega-temis/loop-bunny-whitepaper/whitepaper.md` (original, se conserva) | 36.674 | `85d8d2c1ef7687edf8bea0f2c1852d18c7b5377fc12c6a9ba35e43440a60f811` |
| `whitepaper/whitepaper.md` al crear este proyecto (copia) | 36.674 | `85d8d2c1ef7687edf8bea0f2c1852d18c7b5377fc12c6a9ba35e43440a60f811` |

Coinciden. El hash también coincide con el `whitepaperSha256` que registró el loop de Bunny en `revision-metodo-fin.json` (copiado en esta carpeta).

El archivo `2026-09-30_temis-revivido-para-leer-con-francisco.md` (tres copias idénticas de 32.216 bytes, `3e53de15d16a586d…`, y una anterior de 28.230 bytes, `194b59c2871bcba8…`) es otro documento, anterior al candidato. No es el punto de partida.

A partir de esta copia, `whitepaper/whitepaper.md` cambia con cada corrección; el hash vigente y la lista de cambios van en el recibo del tramo que lo toca.
