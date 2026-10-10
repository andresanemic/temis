# Emisión experimental de $TEMIS

La emisión propuesta es fija y solo usa Stellar testnet. No tiene precio, mercado, venta ni promesas. La cubeta de liquidez queda reservada, sin pool ni ofertas. Ejecuta `node scripts/token-testnet.mjs --plan` para ver las operaciones sin conectarse a la red. `--inicio 2026-10-03T00:00:00Z` permite parametrizar el instante de origen del vesting y de la demo.

La prueba de vesting reserva 1 TEMIS dentro de la cubeta del 10 % de liquidez y lo mantiene en una cuenta testigo. La oferta emitida sigue sumando 100.000.000 TEMIS; no se acuña una unidad adicional.

`node scripts/token-testnet.mjs` crea las cuentas, las fondea con Friendbot y ejecuta la emisión. Guarda las llaves en `~/.temis-testnet/keys.json` y el estado reanudable en `~/.temis-testnet/token-state.json`. Puedes cambiar esa carpeta con `TEMIS_KEYS_DIR`. El recibo público se escribe en `tramos/5/token.json`. El script no imprime llaves secretas.

`node scripts/token-verify.mjs` verifica el recibo y `node scripts/token-verify.mjs --issuer G...` consulta Horizon para una emisora indicada. El verificador no carga llaves. `node scripts/token-testnet.mjs --reclamar-demo` intenta reclamar la demo una vez que haya vencido su predicado.

La frase de red se comprueba antes de operar y el único endpoint configurado es testnet. Nada de este flujo se ejecuta en mainnet. No se hospeda ni publica `stellar.toml.borrador`. La cuenta `francisco` es una ranura de prueba generada para testnet; los tramos reales de Francisco solo existen en mainnet cuando él los acepte por escrito.
