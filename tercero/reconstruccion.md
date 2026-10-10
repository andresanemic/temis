# Reconstrucción independiente del expediente `exp-murckqaa`

Tercero verificador. Segunda corrida. No leí nada de `src/`, `test/`, `vectores/`
ni `scripts/`; no usé código, estado ni claves del sistema que registró el
acuerdo.

**Entradas usadas, y solo estas:**

- `tramos/1/forma-canonica.md` (especificación pública de la forma canónica).
- `tramos/2/cadena.md` (reglas públicas de lectura del registro).
- `datos/e2e/archivo.json` (el archivo del acuerdo).
- Historial público en Horizon testnet de `GDWWBZGPISWYOOKFWXU42MVSSZSXVTTVZW6RMVVFF4GKJ6PXIHOX342H`
  (23 registros; la página siguiente con el cursor final viene vacía, así que el
  historial está completo).
- Los dos archivos auxiliares que están dentro de `datos/e2e/` (`libro.json`,
  `libro-cuenta-ajena.json`), solo como cotejo, y los señalo donde los usé.

**Lo que escribí:** `tercero/canon.py` (canonicalizador CF-1, digest SHA-256 y
verificador ed25519 escritos desde cero), `tercero/reconstruir.py`,
`tercero/informe.py`, `tercero/libro-horizon.json` (copia cruda del fetch).

---

## 1. Herramientas propias, y si las verifiqué

### Canonicalizador y digest — sí, y con pruebas

`tercero/canon.py` implementa el lector JSON estricto y la salida canónica de
CF-1 tal como los describe `forma-canonica.md`. Lo probé contra vectores que
escribí yo mismo a partir del texto de la especificación:

| prueba | resultado |
|---|---|
| `{"b":1,"a":2}` → `{"a":2,"b":1}` | ok |
| orden de claves por bytes UTF-8 (`a` < `á` = `c3a1` < `\u0800` = `e0a080`) | ok |
| NFC: `"a\u0301"` → `"á"` | ok |
| `/` no se escapa, `"` y `\` sí, U+0071 literal, U+0001 → `\u0001` | ok |
| rechaza coma final, `01`, `-0`, `1e3`, `1.0`, clave duplicada, texto sobrante, `NaN`, sustituto suelto, control sin escapar, entero fuera de int64 | 11/11 |

### Firmas ed25519 — sí las verifiqué

Implementé ed25519 (RFC 8032) en Python puro, con la verificación estricta que
pide `forma-canonica.md`: `S < L`, `A` y `R` en codificación canónica
(`y < p`), y `A` de orden no pequeño (`8·A ≠ identidad`). Comprobaciones que
hice sobre mi propio verificador:

- **Derivación de clave pública**: desde la clave secreta del vector 1 de
  RFC 8031/8032 obtengo exactamente `d75a9801…07 511a`. Confirma la
  aritmética de puntos y el escalado.
- **Firma válida**: los vectores 1, 2 y 3 de RFC 8032 verifican `ok`.
- **Negativos**: mensaje alterado → *la ecuación de verificación no se cumple*;
  firma con `S ≥ L` → rechazado; clave nula → *A de orden no pequeño*.

Así que **sí**: las 22 firmas del archivo están verificadas criptográficamente
contra el sobre `"TEMIS-FIRMA-1\0"` + bytes canónicos de
`{digest, expediente_id, forma, tipo, version}`. Resultado: **21 de 22 firmas
verifican**. La única firma que verifica pero **no cuenta** es la de la entrada
`9a28e0111f…` (`h3 v2 declaracion`), firmada por `e830e3b73aa3…`, una clave
que no está en `partes` ni es el operador: es `no_parte`.

---

## 2. Estado del expediente

El expediente **existe**: hay un `acuerdo v1` vigente y bien formado.

- `expediente_id`: `exp-murckqaa`
- `partes`: `alice` (`db714013f3…3a150`) y `bob` (`2047b67e9b…288e`)
- `operador`: `ad1eeb089b…97e4b`
- `cuenta_ancla` declarada: `GDWWBZGPISWYOOKFWXU42MVSSZSXVTTVZW6RMVVFF4GKJ6PXIHOX342H` — **coincide** con la cuenta cuyo historial me dieron.
- Una `controversia v1` vigente (`5437bd6c52…aca4f`, activada por `bob`).
- Cadena: 15 líneas aceptadas (13 vigentes + 1 vigente anulada + 1 anulada),
  más 7 líneas ancladas que no cuentan y 1 transacción sin cuerpo.

**Aviso sobre «estado del expediente»:** `cadena.md` §58 dice que
`reconstruir` devuelve `expedientes[id].estado`, pero **no define en ningún
lado qué valores puede tomar ese estado**. Solo define el estado de una línea
(§30) y el estado de un hito (§52). No inventé un valor: doy arriba lo que sí
es determinable (acuerdo vigente, partes, operador, controversia activa) y los
estados por hito abajo.

**Sobre la «cabeza de la cadena»:** `cadena.md` §48 dice explícitamente que la
cadena **no tiene cabeza**. Es el conjunto de líneas aceptadas, y una línea
puede citar como `anterior` cualquiera de ellas, no necesariamente la última.
No existe regla de «la última gana»: lo único que resuelve el orden es
*first-write-wins* por clave `(expediente_id, hito, version, evento)` (§41) y el
estado por hito. La línea aceptada más reciente por ledger es la `controversia`
en el ledger 4989057, pero que sea la última en el libro no le da ningún estado
particular.

---

## 3. Estado de cada hito

| hito | estado | por qué |
|---|---|---|
| `h1` | **`cumplido`** | cierre `v1` `cumplido` (`de14d004a3…`) vigente: la declaración vigente del hito es `9a7064608e…` (`v2`) y tiene una aceptación vigente (`29017d4262…`, bob) |
| `h2` | **`cumplido_no_confirmado`** | cierre `v1` (`d12e7f60d5…`) vigente; la declaración vigente `29563abc5a…` no tiene respuestas, así que el cierre tiene respaldo |
| `h3` | **`impugnado`** | el cierre `v2` (`8fc22253de…`) es `cierre_sin_respaldo`; sin cierre ni incumplimiento, la declaración vigente `bf71e3237c…` tiene una impugnación vigente (`5bd4e63a1e…`, bob) y ninguna aceptación |
| `h4` | **no existe** | su único `hito_abierto` (`17ba0bfbe0…`) **no está en el historial de la cuenta ancla** (ver §6) |
| `h5` | **no existe** | su `hito_abierto` (`5ab2f75fe0…`) es `fuera_de_cadena`: su `anterior` es `abababab…`, un digest de 64 hex que no es ninguna línea aceptada del expediente |
| `h7` | **no existe** | su `hito_abierto` (`2ff737191b…`) es `digest_no_coincide`: el cuerpo del archivo no tiene el digest que la transacción ancló |

El detalle que importa de `h1`: la `declaracion v1` (`e8e84befbe…`) **fue
anulada** por `5483bed05c…`, firmada por `alice`, que es la autora de esa línea y
no el acuerdo ni otra anulación. La anulación es válida, así que la `v1` conserva
su clave `(exp-murckqaa, h1, 1, declaracion)` — una `declaracion h1 v1` futura
seguiría siendo `perdedora` — pero deja de contar para el estado del hito. La
`v2` es la que cuenta.

---

## 4. Tabla de todas las transacciones de la cuenta

23 registros en total. Los 22 con `memo_type: "hash"` y `successful: true` se
procesan con el orden de evaluación de `cadena.md` §30; el primero no entra al
libro (ver nota al pie).

| # | ledger | hash tx | hito | línea | digest del memo | estatus | por qué |
|---|---|---|---|---|---|---|---|
| 1 | 4989041 | `7d03141c7024` | — | — | — | **no procesada** | `memo_type: "none"`; además su `fuente` es `GC5QT3B2…`, no la cuenta ancla |
| 2 | 4989043 | `c4c3e3a0857b` | — | acuerdo v1 | `e38cb619e1` | **vigente** | cuerpo bien formado, cuenta ancla declarada = la de la tx, firmado por las dos partes |
| 3 | 4989044 | `0a3fa813db9d` | `h1` | hito_abierto v1 | `08e09bbf44` | **vigente** | firma del operador; `anterior` = el acuerdo |
| 4 | 4989045 | `9901e04a88d3` | `h1` | declaracion v1 | `e8e84befbe` | **anulada** | vigente al anclarse; la deja sin efecto la anulación del #5 |
| 5 | 4989046 | `436b3c757bfb` | `h1` | anulacion v1 | `5483bed05c` | **vigente** | firma `alice`, autora de la línea anulada; objetivo vigente, mismo expediente e hito, no es acuerdo ni anulación |
| 6 | 4989047 | `a574a1ee6389` | `h1` | declaracion v2 | `9a7064608e` | **vigente** | firmada por `alice`, la parte nombrada |
| 7 | 4989048 | `8ec19d65a616` | `h1` | contraste v1 | `29017d4262` | **vigente** | `aceptar` de `bob`, la parte contraria a la de la declaración `9a7064608e…`, que es la vigente |
| 8 | 4989049 | `65f8d09694a3` | `h1` | cierre v1 | `de14d004a3` | **vigente** | `cumplido` con aceptación vigente y sin impugnación → con respaldo |
| 9 | 4989050 | `149072fbad72` | `h2` | hito_abierto v1 | `7ab2f63b` | **vigente** | firma del operador |
| 10 | 4989051 | `a53030f21bd6` | `h2` | declaracion v1 | `29563abc5a` | **vigente** | firmada por `bob` |
| 11 | 4989052 | `9b44bd038cfb` | `h2` | cierre v1 | `d12e7f60d5` | **vigente** | `cumplido_no_confirmado` sin respuestas a la declaración vigente → con respaldo |
| 12 | 4989053 | `d5ab4540688e` | `h3` | hito_abierto v1 | `ee5cefc7d9` | **vigente** | firma del operador |
| 13 | 4989054 | `8899960a63f1` | `h3` | declaracion v1 | `bf71e3237c` | **vigente** | firmada por `alice`; gana la clave `(exp-murckqaa, h3, 1, declaracion)` |
| 14 | 4989055 | `497e993973bc` | `h3` | declaracion v1 | `94f80b67bf` | **perdedora** | regla 8: la clave ya la ganó `bf71e3237c…` en el #13. Se evalúa antes que la cadena |
| 15 | 4989056 | `6e5277d64a61` | `h3` | contraste v1 | `5bd4e63a1e` | **vigente** | `impugnar` de `bob` (la contraria a `alice`), apunta a la declaración vigente `bf71e3237c…` |
| 16 | 4989057 | `9b8f5259c456` | — | controversia v1 | `5437bd6c52` | **vigente** | firmada por una de las partes (`bob`); `hito` nulo y `tipo` `expediente`, coherente |
| 17 | 4989059 | `34ee18dbdaba` | `h3` | declaracion v2 | `9a28e0111f` | **firmas_insuficientes** | regla 6: la firma es criptográficamente válida pero de `e830e3b73a…`, fuera de `partes` → `no_parte`, no cuenta; falta la firma de `alice` |
| 18 | 4989060 | `8ae6018de254` | `h3` | anulacion v1 | `1335b000c8` | **anulacion_no_valida** | regla 6: la firma es la de `bob`, y la autora de `bf71e3237c…` es `alice`; el objetivo no puede anularlo |
| 19 | 4989061 | `ee2e49487718` | `h5` | hito_abierto v1 | `5ab2f75fe0` | **fuera_de_cadena** | regla 9: `anterior` = `abababab…` (64 hex válido) no es ninguna línea aceptada del expediente |
| 20 | 4989062 | `4db430c5204a` | — | — | `d5b3142e97` | **sin_cuerpo** | regla 1: ninguna entrada del archivo declara ese digest, y ningún cuerpo del archivo lo tiene como digest calculado |
| 21 | 4989063 | `5c6472c9d5d3` | `h3` | cierre v2 | `8fc22253de` | **cierre_sin_respaldo** | regla 10: `cumplido` sin aceptación y con una impugnación vigente (`5bd4e63a1e…`) a la declaración vigente `bf71e3237c…` |
| 22 | 4989064 | `ba28ca142683` | `h1` | contraste v2 | `16f352d86a` | **contraste_sin_objetivo** | regla 7: `contenido.declaracion` no está, así que no apunta a la declaración vigente del hito |
| 23 | 4989065 | `675cda89adba` | `h7` | hito_abierto v1 | `2ff737191b` | **digest_no_coincide** | regla 2: la entrada declara `2ff737191b…` y mi canonicalizador da `6603d29b70…` |

Recuento: 13 vigentes, 1 vigente-anulada, 1 anulada, y una de cada estatus
`perdedora`, `firmas_insuficientes`, `anulacion_no_valida`,
`fuera_de_cadena`, `sin_cuerpo`, `cierre_sin_respaldo`,
`contraste_sin_objetivo`, `digest_no_coincide`; 1 no procesada.

**Sobre la fila 1.** Horizon devuelve en `/accounts/{id}/transactions` toda
transacción *que referencia* la cuenta, no solo las que ella envía. La
transacción del ledger 4989041 aparece ahí pero su `fuente` es
`GC5QT3B2JEYTWUDDFJ7DTSPG3UT7NSIZ4VWDYVIPDXDNJGYESVEAXQJF`. Como no trae
memo, `cadena.md` ni siquiera la procesa. Lo dejo anotado porque confirma que
filtrar por cuenta de origen no era cosmético: en otra corrida, con un libro
distinto, esa misma regla habría producido `cuenta_no_autorizada` para la fila
`h4` del §6.

---

## 5. Cuerpos del archivo que NO aparecen en el historial — `falta_en_el_historial`

**Uno de los 22.** Con la definición de `cadena.md` §60 (*la copia trae un
cuerpo cuyo digest no está anclado*):

| digest declarado (y recalculado por mí) | línea | por qué no está en el historial |
|---|---|---|
| `17ba0bfbe03612c3a69e0e8aaf0ff7eaa7529aa3fd461a07a37d6242628287a6` | `h4 v1 hito_abierto` | la cuenta ancla no lo ancló |

Sobre este caso hay que ser preciso, porque hay dos lecturas posibles y
convergen en lo mismo para el estado, pero no en el nombre:

- Con **mi** libro (solo el historial de la cuenta ancla, que es lo que se me
  pidió) la línea simplemente no está: es **`falta_en_el_historial`**, y por eso
  `h4` no existe.
- Si esa transacción estuviera en el libro, `cadena.md` §15 + regla 5 la
  marcarían **`cuenta_no_autorizada`**. Y así es de hecho: dentro de
  `datos/e2e/` hay un archivo `libro-cuenta-ajena.json` que registra esa
  transacción en el ledger 4989058 con el mismo digest pero **`fuente`
  `GBLGGBD744UYUO6VPGTNQHAR67YJ6LDH57PNNBLPVUQDUUDVGVB7Z4W2`**, que no es la
  cuenta ancla. No usé ese archivo para construir nada —solo lo uso aquí como
  indicio de qué pasó— pero explica el hueco: el ledger 4989058 falta entre
  4989057 y 4989059 en el historial de la cuenta ancla.

Esto no lo verifiqué en Horizon: no consulté Horizon para esa cuenta ajena,
porque el encargo era leer el historial de la cuenta ancla. Queda dicho.

## 6. Memos del historial sin cuerpo en el archivo — `falta_en_la_copia`

**Uno de los 22:** el digest `d5b3142e9708da9989af5c91eec5f27282fe6d36c8d0445f7d2145c8ad03ecd3`
(ledger 4989062, tx `4db430c5204abd5595f3ca316c8737c9d006268060790721a0d387ff893f6478`)
está anclado en la cadena y no hay ningún cuerpo suyo en el archivo. Estatus
`sin_cuerpo`. **No puedo decir qué línea era** —solo que alguien la ancló y
que el archivo no la publica—.

## 7. ¿Coincide el archivo con el historial?

**No.** Faltan las dos cosas y ademas hay un cuerpo alterado:

| diferencia | tipo `cadena.md` §60 | qué es |
|---|---|---|
| `d5b3142e97…` | `falta_en_la_copia` | anclada en la cadena, sin cuerpo en el archivo |
| `17ba0bfbe0…` | `falta_en_el_historial` | cuerpo en el archivo, no anclada por la cuenta ancla |
| `2ff737191b…` | (no es un tipo de §60; es regla 2) | anclada, pero el cuerpo del archivo **no** tiene el digest anclado: recalcula `6603d29b70…` |

El último es el más grave: significa que el archivo publica, bajo un digest que
la cadena reconoce, un cuerpo que **nadie** firmó tal como está. Cualquiera
puede tomar ese cuerpo, cambiarle una clave y colgarlo de la misma entrada; la
cadena no lo detecta porque solo ve el digest del memo. Sea lo que sea que
`6603d29b70…` sea, esa línea **no** abrió el hito `h7`.

La consecuencia que `cadena.md` §60 ya anticipa, y que confirmo: **no hay
registro confiable.** El archivo no es una copia fiel del historial y no debe
usarse como tal.

---

## 8. Ambigüedades que encontré, y cómo las resolví

Las cinco. En ninguna el resultado cambia si se lee al revés, pero las reglas
no lo dicen y prefiero dejarlo escrito:

1. **«el digest no está en el archivo» (regla 1) — ¿busco por digest declarado
   o por el que recalculo?** `cadena.md` §60 define `falta_en_el_historial`
   sobre el digest de la copia, y tu encargo (c) me pedía buscar por el digest
   *calculado por mi canonicalizador*. Calculé los 22 digests: **21 coinciden
   con los declarados** y solo el de `h7` no. Busqué primero por digest
   declarado (que es la clave del archivo) y después revisé si algún cuerpo
   *calculado* empataba con algún memo. Ninguno lo hacía, así que el criterio no
   cambió ningún estatus. Si el criterio fuera «calculado», la fila 23 sería
   `sin_cuerpo` en vez de `digest_no_coincide`, y `h7` seguiría sin existir.

2. **¿Cuenta una línea anulada como «línea aceptada» para la regla 9
   (`fuera_de_cadena`)?** §48 llama «aceptadas» a las líneas aceptadas y §46
   dice que una vigente *pasa a* anulada, así que puede leerse en los dos
   sentidos. Lo comprobé: la única línea que cita a la línea anulada
   (`e8e84befbe…`) como `anterior` es la propia anulación que la anula, y esa se
   evalúa antes de que su objetivo cambie de estatus. **Ninguna lectura cambia
   nada.**

3. **`h1 v2 contraste` (fila 22) — ¿`contraste_sin_objetivo` o
   `cuerpo_invalido`?** Su `contenido` no trae `declaracion`. La tabla de §19
   exige `contenido.accion` **y** `contenido.declaracion` para un `contraste`,
   lo que empujaría a `cuerpo_invalido` (regla 3); pero la lista de la regla 3
   es explícita y no incluye requisitos de contenido por evento, lo que empuja a
   `contraste_sin_objetivo` (regla 7). Elegí regla 7 por esa lista cerrada. Con
   cualquiera de las dos no es vigente y no cuenta para `h1`.

4. **`contenido.resultado` de un `cierre` distinto de `cumplido` y
   `cumplido_no_confirmado`.** La regla 10 solo define el respaldo para esos
   dos valores, y §52 solo define el estado del hito para ellos dos. Aquí solo
   aparecen esos dos valores, así que no me pasó — pero si alguien publica un
   `cierre` con otro resultado, las reglas no dicen ni si cuenta ni qué estado
   produce.

5. **«el resultado de un cierre válido gana» (§52) — ¿gana el último o cualquiera
   que sea válido?** Si dos cierres válidos coexistieran, la regla no ordena.
   Aquí no hay dos cierres vigentes en un mismo hito (`h3` tuvo dos, pero el
   segundo es `cierre_sin_respaldo`), así que no decidí nada. Tomé el último por
   libro.

Añado una observacion que no es ambigüedad sino una laguna: **`estado` del
expediente** (§58) se devuelve pero nunca se define (§2).

---

## 9. Qué no pude verificar, y por qué

- **Que el operador controle la cuenta ancla.** `cadena.md` §15 lo dice de
  entrada: el vínculo entre la clave del operador (`ad1eeb089b…`) y la cuenta
  Stellar no se puede probar con datos públicos. Las firmas ed25519 que verifiqué
  son de claves ed25519 declaradas en los cuerpos; **no** son firmas de la
  cuenta Stellar. Nada de lo que verifiqué dice quién-controla la cuenta.

- **Que el archivo no haya sido editado.** Verifiqué que cada digest del archivo
  **reproduce** el cuerpo tal como está ahora, no que el cuerpo sea el que se
  firmó en su momento. Las 21 firmas que verifican sí prueban el digest
  recalculado, y eso es lo que las ata; para la entrada `2ff737191b…` no hay
  firma que ata nada, porque el sobre exige el digest y el digest del cuerpo no
  es el anclado.

- **La transacción del ledger 4989058** (el `hito_abierto` de `h4`): sé por el
  archivo `libro-cuenta-ajena.json` que salió de
  `GBLGGBD744UYUO6VPGTNQHAR67YJ6LDH57PNNBLPVUQDUUDVGVB7Z4W2`. **No lo confirmé
  en Horizon**, porque el encargo era no usar otras URLs y el historial que me
  diste es el de la cuenta ancla. Si querés que lo confirme, es una consulta
  más.

- **La versión de Unicode.** `forma-canonica.md` §10 declara que no se fija
  ninguna y que lo «asignado» es el del motor. Mi lector corrió con Unicode
  **16.0.0** (`unicodedata.unidata_version`, impreso por el propio script). No
  hay forma de fijar el del motor de ellos, así que el rechazo de puntos de
  código sin asignar **puede diferir** entre mi corrida y la de ellos. En este
  archivo no hubo diferencias: los 22 cuerpos son ASCII y ninguno tiene puntos
  de código sin asignar.

- **El índice dentro del ledger.** `cadena.md` §32 ordena por `(ledger, indice)`
  y Horizon no expone el índice de una transacción dentro de su ledger. Usé el
  orden en que Horizon devuelve los registros —que es lo que me pediste—, con
  `source_account_sequence` como desempate. En esta cuenta hay **una sola
  transacción por ledger**, así que los dos criterios coinciden.

- **El contenido de la línea `sin_cuerpo`.** El digest `d5b3142e97…` está
  anclado y no hay cuerpo. No puedo saber qué evento era, de qué hito, ni si
  habría cambiado algún estado. Lo dejo como hueco, no como línea inocua.

- **El significado de `abababab…`** como `anterior` de `h5` (fila 19): es un
  digest de 64 hex bien formado, así que pasó el formato de la regla 3 y cayó en
  `fuera_de_cadena` por la regla 9. No sé si fue un intento de colgar una línea
  de un digest inexistente o un error de tecleo. No lo doy por bueno ni por
  malicioso.

---

## 10. Conclusión corta

1. El expediente `exp-murckqaa` **existe**: acuerdo `v1` vigente, partes `alice` y `bob`, operador `ad1eeb089b…`, cuenta ancla declarada igual a la que me diste, una `controversia v1` vigente.
2. Estados: **`h1` cumplido**, **`h2` cumplido_no_confirmado**, **`h3` impugnado**, y **`h4`, `h5`, `h7` no existen**.
3. El archivo **no coincide** con el historial: falta un cuerpo anclado (`d5b3142e97…`, `falta_en_la_copia`), sobra un cuerpo no anclado por la cuenta ancla (`17ba0bfbe0…`, `h4`, `falta_en_el_historial`), y un tercer cuerpo está **alterado** (`2ff737191b…` recalcula `6603d29b70…`, `digest_no_coincide`).
4. Por lo tanto, según `cadena.md` §60, **no hay registro confiable**: el archivo no sirve como copia fiel.
5. Verifiqué las 22 firmas ed25519 con un verificador propio (RFC 8032, estricto): **21 verifican**; la de `9a28e0111f…` verifica pero es `no_parte` y no cuenta.
6. 7 de las 22 líneas ancladas no cuentan, cada una con su estatus, y ninguna por ambigüedad mía.
7. Lo que no pude verificar está en §9, y lo más importante: **nada de lo verificado dice quién controla la cuenta ancla**.
8. Cinco ambigüedades documentadas en §8; ninguna cambia el resultado.
9. La cadena **no tiene cabeza** (`cadena.md` §48): lo que resuelve el orden es *first-write-wins* por clave y el estado por hito, no «la última gana».
10. Reproducible con `python tercero/informe.py`, sobre `tercero/canon.py` + `tercero/reconstruir.py` escritos desde cero.