# TEMIS
## Capa de validación legal para acuerdos bilaterales por hitos

*Para leer Andrés y Francisco Toro Fierro y decidir si revive y qué se construye. 1 de octubre de 2026.*

Nada de esto está aprobado. El documento propone; la decisión la firman los dos.

**Estado al 2 de octubre de 2026.** Este texto parte del candidato recuperado el 1 de octubre (SHA-256 `85d8d2c1…`, ver `fuente/cotejo-hash.md`) y se reconcilió con el alcance del acuerdo del proyecto (`acuerdo.md`): el MVP cubre las pruebas 0 a 8 del §17, con datos sintéticos y en testnet. Cada afirmación sobre el kernel de Vespi se cita ahora con archivo y línea (`tramos/0/kernel-citado.md`), y las afirmaciones sobre Stellar, x402 y las normas chilenas se cotejaron contra su texto oficial el 2 de octubre (`tramos/0/fuentes.md`). Donde el cotejo corrigió al candidato, el cambio está en `tramos/0/cambios-whitepaper.md`. Sigue pendiente la revisión de una persona jurídica competente sobre el §10; hasta entonces el §10 no se presenta como guía fiable.

**Actualización del 3 de octubre de 2026.** Las pruebas 5 a 8 del §17 se corrieron en testnet y sus resultados, con hashes donde hubo transacción, están en el §17 y en `tramos/4/`. Las pruebas 0 a 8 del MVP del acuerdo se corrieron una vez cada una, con datos de fantasía y con los límites que declara el §17.1. No cambia lo que no se afirma: no hay piloto, cliente, mainnet ni datos de personas reales; falta la revisión de una persona jurídica competente sobre el §10 y el certificado de Andrés.

## 1. Qué es, en una página

TEMIS hace una sola cosa: dejar por escrito, con firma y con una huella que un tercero puede comprobar, qué se comprometió a hacer cada parte y qué pasó con cada hito.

No es una notaría. No es un juzgado. No es una aseguradora. Es la preparación del acuerdo y el registro de los hechos que después deciden si hubo o no incumplimiento.

El origen es de Francisco, en el Blockchain Lab UAI, en el documento Not Ponzi: el abogado no cobra por horas, prepara el contrato y recibe un porcentaje pequeño del monto si el acuerdo se cumple; si se incumple, asume el costo de la defensa. El nombre no es decorativo. Es el incentivo y también es la promesa.

Lo que este documento propone es TEMIS como proyecto funcional del proyecto Vespi, el programa que coordina proyectos funcionales y cuyo kernel es la base técnica sobre la que corre cada uno. Tres piezas. El kernel de Vespi (candidato 0.1.3), que aporta autorización acotada, operaciones con recibo y un ejemplo de conector de pagos, leídos y citados con archivo y línea el 2 de octubre (§4.5). Stellar, para el anclaje de integridad. Y x402 sobre Stellar, para los servicios técnicos que se pagan por uso: el adaptador de ejemplo del kernel pagó 0,01 USDC en testnet el 2 de octubre de 2026 a través del facilitador real, con recibo verificado y la transacción confirmada por separado en Horizon (§9). Es un solo pago, en testnet, y no prueba un servicio de TEMIS.

La ley chilena de protección de datos e interoperabilidad entra como marco de cumplimiento del registro y, más adelante, como un sector que TEMIS podría servir. No es el producto, y conviene no confundirlo con el producto.

## 2. El problema

Entre que dos partes firman y que una de ellas incumple hay un tramo que hoy nadie registra. El contrato está en un PDF, los avisos por correo, las entregas por chat, las planillas que cada uno mantiene con su propio criterio. Cuando aparece el conflicto hay que reconstruir qué se pidió, qué se entregó, quién lo sabía y cuándo. Esa reconstrucción es la parte cara del litigio, y casi siempre se hace con los documentos de la parte que tuvo mejor archivo.

TEMIS mete orden en ese tramo. No cambia quién tiene razón: cambia cuánto cuesta saber qué pasó.

## 3. Los actores

- **Dos partes**, que firman y pagan.
- **Un profesional jurídico** —un abogado, un estudio— que prepara o revisa el acuerdo y queda identificado en él.
- **El operador**: TEMIS, sobre el kernel de Vespi. Coordina, no juzga, no representa.
- **El verificador de TEMIS**: no es una persona. Es una capacidad del operador que aplica un recibo a un paquete documental y devuelve sí o no. No califica, no certifica y no es notario.
- **Proveedores técnicos externos**: un perito contador, un notario, un laboratorio. Cobran su trabajo y lo cobran por x402.
- **El tercero verificador**: una persona externa, sin interés en el acuerdo, que reconstruye el registro desde el historial público de la cadena. Es el único que no necesita permiso para mirar.

Que haya dos verificadores no es una duplicación: uno mira hacia adentro (¿este informe calza con este paquete?) y el otro hacia afuera (¿qué dice la cadena?). Se nombran distinto porque responden a preguntas distintas.

**Facturación.** El operador factura a las partes el servicio por acuerdo gestionado; el profesional factura su honorario a la parte que lo contrata. Quien emite la factura es un dato operativo, no del diseño.

## 4. La arquitectura, en cinco piezas

### 4.1 El acuerdo, versionado

El objeto central es el **expediente**: un acuerdo con partes identificadas, una lista de hitos y, por hito, la evidencia que se exige. El expediente tiene versiones. Cada versión tiene un digest. Firmar es firmar el digest de una versión.

Hay dos copias del cuerpo, una por parte, y una para el operador. El cuerpo nunca se publica. A la cadena va sólo el digest.

Y el digest tiene que ser el mismo para todos siempre. Se calcula sobre una forma canónica única, que hay que escribir antes del primer expediente y que después no se cambia: JSON con claves ordenadas por sus bytes en UTF-8, sin claves duplicadas, sin espacios superfluos, texto normalizado a NFC sin escapes que no hagan falta, números en punto fijo con una escala declarada de antemano. El algoritmo es SHA-256, que no es arbitrario: son los 32 bytes que caben en `MEMO_HASH`.

El kernel no la trae: su `canonicalize` ordena las claves con `Array.prototype.sort()`, que compara por unidades de código UTF-16, y no normaliza a NFC ni fija una escala numérica (`src/receipt.js:21-29`), así que su digest no sirve para el expediente de TEMIS. Esa forma canónica se publica con dos vectores de prueba, para que dos implementaciones den el mismo digest sobre el mismo expediente. No es un detalle de implementación: es lo único que hace que una firma sea comparable con otra firma hecha por otro software.

### 4.2 Firma y contrafirma

Cada parte firma con ed25519, la misma familia que usa Stellar. Un hito firmado por una parte queda *pendiente de la otra*. Cuando las dos firman, queda *acordado*.

Esto es atestación, no verificación por re-ejecución. Una firma no se recalcula: alguien afirma que es suya. Es un régimen de confianza distinto del del resto del documento, y conviene no mezclarlos. Si el proyecto dijera «todo es verificable», esa frase sería condicional y habría que decir dónde termina.

Y sin rodeos: **una firma ed25519 no es una firma electrónica avanzada** en el sentido del art. 2 letra g) de la Ley 19.799, que exige prestador acreditado. Tampoco es un fechado. El cierre de ledger sí da una hora que un tercero puede consultar y contrastar, y eso no es lo mismo: no viene de un prestador acreditado y no da fe de la fecha en el sentido del art. 5. Lo que la firma da es integridad y autoría técnica del firmante.

### 4.3 El anclaje en Stellar

El anclaje es una transacción clásica con `MEMO_HASH`. La inmutabilidad no la da el contrato, la da el historial: una corrección es una línea nueva que declara anulada la anterior y apunta a ella.

Cuatro decisiones que importan:

1. **No hay contrato Soroban.** Una transacción de contrato no puede llevar memo —tiene que ir en `MEMO_NONE`— y el almacenamiento de contrato tiene TTL: cuando una entrada llega a cero queda archivada, restaurarla cuesta renta y una vez restaurada se puede modificar o borrar. El historial del ledger no tiene nada de eso. Se sacrifica la atomicidad de varias escrituras; a cambio no hay renta, no hay archivado y no hay contrato que señalar.

2. **First-write-wins, con la clave escrita.** Para la clave (expediente, hito, versión) sólo cuenta la primera línea que la red acepta; las siguientes se registran pero no abren estado. Sin esa regla, una línea anulada por la vía legítima y una línea duplicada se ven iguales para el tercero. Si la línea que ganó se anula después, ese hito queda vacío y marcado como vacío: **no reabre a la perdedora.** Reabrir sería inventar la causalidad que el registro no tiene.

3. **Una sola cuenta ancla, y eso es un riesgo asumido.** Da orden total, que es justo lo que se necesita, y a cambio quien tenga esa clave puede escribir una anulación falsa y cambiar la secuencia vigente sin alterar ningún hash. La firma de las partes no lo impide, porque la anulación también va firmada. La defensa no es criptográfica: es de cotejo. El tercero reconstruye desde el historial completo y lo compara con la copia que tiene cada parte; si no coinciden, hay que decirlo. La rotación de la clave se hace con una línea firmada por la clave vieja y por la nueva, que es lo que permite demostrar continuidad a un tercero; si la clave vieja está perdida, la rotación es una discontinuidad y también hay que anclarla como tal.

4. **El archivo del historial es una dependencia de producto.** El verificador no puede usar un explorador como única fuente: necesita el historial completo —stellar-core con `pwbd`, o un archivo público— y hay que decir quién lo hospeda. Mientras no haya dueño, no hay tercer verificador: sólo hay la palabra del operador.

El costo de red es despreciable: el mínimo es 100 stroops por operación, 0,00001 XLM, y sube con la congestión. Pero ese no es el costo de TEMIS. El costo real es la custodia del cuerpo, que no está en la cadena.

### 4.4 Los servicios pagados con x402

x402 sirve para pagar por uso, no para pagar un contrato. El recurso es una capacidad; el que paga es el operador o el estudio; el que cobra es el proveedor.

El caso canónico: el estudio pide a un perito una verificación técnica de un paquete documental y recibe un informe ligado a ese paquete. Eso se paga con x402. El acceso a los propios datos y los derechos legales **no** se pagan por ahí: van por el conducto que corresponde.

En Stellar, el esquema `exact` de x402 funciona sólo con activos SEP-41. SEP-41 no es sólo el contrato de activo: cualquier token de contrato que implemente la interfaz sirve, y el despliegue de referencia usa el contrato de activo de USDC. Los activos clásicos no sirven.

El flujo por defecto es *sponsored*: el cliente no firma una transacción, firma una *authorization entry*, que autoriza esa invocación concreta y vence por número de ledger, y el facilitador pone las tasas, reconstruye la transacción y la envía. La especificación contempla también firma completa de la transacción, sin patrocinio de tasas y sólo con cuentas G; la implementación de referencia la tiene declarada como trabajo futuro, así que ese camino no está probado aquí y un estudio sin cuenta patrocinada tendría que resolverlo por otro lado.

Hay dos endpoints: `/verify`, que es de sólo lectura y no escribe nada, y `/settle`, que es el que compromete.

El flujo por defecto es *autorización*: se verifica, se ejecuta el recurso, y recién después se liquida. La especificación de `exact` admite además el flujo *upfront*, que liquida antes de ejecutar, y lo recomienda para un recurso que puede tardar más que la ventana de validez de la autorización; no lo declara en el documento de Stellar, donde solo aparece `extra.areFeesSponsored`. Para una capacidad cuyo resultado no se puede devolver, TEMIS propone usar *upfront*: eso es una propuesta de TEMIS, no una razón que dé la especificación. Acota el problema de perder la respuesta después de pagar; no lo elimina, y la especificación aclara que bajo *upfront* un fallo del manejador deja al cliente cobrado sin entrega y que no define reembolso. Sobre la tabla de pagos: la especificación general exige que los métodos cuyo reenvío no se distingue del original «MUST deduplicate settlements atomically across every process serving `/settle`»; el documento de Stellar no dice si su método es de esos. Que la tabla sea **durable** y esté ligada a un acuerdo y a una capacidad es una decisión de diseño de este proyecto, no una regla del protocolo.

**Sobre etiquetar el pago.** Como una transacción de contrato no puede llevar memo, desde el protocolo 23 el destino puede ser una cuenta multiplexada. Pero la especificación exige que el argumento `to` sea exactamente el `payTo` declarado. La consecuencia práctica es la que importa: **no se puede etiquetar el pago con el identificador del expediente.** La etiqueta no la pone el pago; la pone TEMIS, guardando el hash de la transacción y el índice de la operación en el recibo del hito.

Y un detalle que se lleva por delante la idea de «mira el evento»: desde el protocolo 23, una operación clásica y una invocación del contrato de activo pueden emitir el mismo evento, y nada dentro del evento dice cuál fue. La conclusión no cambia: **un evento no prueba cómo se hizo un pago.** Hay que leer el tipo de la operación en la transacción. TEMIS guarda el hash y el índice de operación, que es lo que después se puede verificar.

### 4.5 El adaptador sobre el kernel de Vespi

Lo que sigue se leyó en el árbol del kernel el 2 de octubre de 2026, en el commit `581a65c` (candidato 0.1.3), y cada afirmación trae su archivo y línea en `tramos/0/kernel-citado.md`. Antes de este tramo eran un reporte de otro agente. Una huella acredita que un archivo no cambió; no acredita qué contiene ni qué le falta, y por eso se citó el contenido.

El kernel aporta cuatro cosas que este diseño usa:

- **Autoridad** (`grantSpend`, `sufficient`; `src/authority.js:4-9`, `:41-93`): límites de activo, importe, destinatario y expiración. Un permiso de gasto acotado, no un saldo ni una custodia.
- **Operaciones** (`createOperation`, `runOperation`, `pauseOperation`, `resumeOperation`; `src/operation.js:284`, `:427`, `:389`, `:405`): estados, solicitud de decisión, ejecución y verificación. Además de lo que el candidato listaba, trae autoridad de varias personas (`authority.signers`) y una lista de quién puede pausar (`authority.pausers`).
- **Recibos** (`buildReceipt`, `verifyReceipt`, `anchorReceipt`; `src/receipt.js:283`, `:93`, `:170`): digest SHA-256 de un JSON de claves ordenadas, y un anclaje con tres estados atado al digest de su propio recibo (`:69-90`).
- **Un ejemplo de conector de pagos** en `demo/x402/capability.js:281`, con una capacidad de plan de marketing que paga 0,01 USDC. Vive fuera de `src/`; el kernel no importa x402.

Y le faltan cuatro cosas, confirmadas en el código:

- **Ninguna firma.** El único uso de `node:crypto` en `src/` es `createHash('sha256')`. No hay ed25519 ni clave privada, y el digest del recibo no va firmado. Sin firma, el producto no tiene a quién preguntarle quién escribió. Es la pieza que decide si TEMIS existe.
- **Ninguna cadena.** El cuerpo del recibo (`src/receipt.js:301-322`) no tiene un campo que apunte al recibo anterior; `resumeFromReceipts` (`src/continuity.js:46`) recibe una lista suelta y descarta los que no verifican. Una corrección no es una escritura: no hay anulación.
- **Ninguna regla de «no se cuenta dos veces» durable.** La idempotencia del ejemplo son dos conjuntos en memoria: `seenPayments`, con tope de 10.000 claves (`demo/x402/idempotency.js:3-4`, `:11`), y `consumedTransactions` (`demo/x402/capability.js:20`, `:129-134`). No sobreviven a una caída ni sirven entre dos procesos.
- **Ninguna continuidad durable.** La exclusión de una operación es una bandera en memoria (`op.inFlight`, `src/operation.js:307`, `:394`, `:429-434`), y `src/` no escribe archivos.

Renombrar el estado en memoria no produce continuidad. Eso hay que decirlo porque es el punto donde un proyecto de este tipo se vende solo.

## 5. El recorrido completo

1. **Alta.** El profesional redacta el acuerdo. El sistema crea el expediente con identificador opaco y versión 1. Cada parte recibe su copia.
2. **Firma del acuerdo.** Cada parte firma el digest de la versión 1. El registro queda *acordado* cuando están las dos firmas. En ese momento se publica el anclaje: una transacción clásica con el `MEMO_HASH` del digest.
3. **Hito abierto.** El sistema crea el primer hito con su evidencia exigida y su plazo. El plazo vence solo.
4. **Declaración.** Una parte declara que el hito se cumplió y adjunta la evidencia. Queda *declarado por una parte*.
5. **Contraste.** La otra parte acepta, impugna o no responde. El sistema distingue los tres desenlaces: *acordado*, *impugnado*, *sin respuesta*.
6. **Cierre del hito.** Con dos firmas, el hito se cierra como *cumplido* y se ancla su digest. Sin respuesta de la otra parte, se cierra como *cumplido no confirmado*: un estado distinto, más débil, marcado como tal para siempre.
7. **Corrección.** Si alguien se equivoca, no se edita: se escribe una línea nueva que declara anulada la anterior. La línea anulada deja de contar. Se ancla otra vez.
8. **Incumplimiento.** Si un hito vence incumplido, se abre un registro de incumplimiento con la evidencia de la parte cumplidora. Acá TEMIS no hace nada más: no exige, no prosecuta, no cobra.
9. **Controversia.** Las partes la activan. TEMIS registra quién la activa, qué profesional se designa y con qué control de conflictos. El sistema exige que se declare el conflicto de interés, no que no exista.
10. **Reconstrucción.** El tercero verificador toma el hash del recibo, recorre el historial completo, aplica first-write-wins, descarta las líneas anuladas y obtiene la secuencia de hitos vigente. Necesita el archivo completo, no un explorador. Y necesita su copia: si el historial y la copia de la parte no coinciden, no hay registro confiable y hay que decirlo.

## 6. Cuándo falla

Seis fallas, porque una propuesta que sólo describe el camino feliz es propaganda.

**Una de las dos partes deja de escribir.** Es la más probable y la más silenciosa: no hay conflicto, no hay caída, la auditoría pasa, y el expediente es un relato unilateral con sello criptográfico que hace que la asimetría parezca bilateral. La mitigación es de diseño y no técnica: *declarado por una parte* y *acordado* son estados distintos y se ven distintos. El sistema no arregla la falta de una parte; deja de esconderla.

**Pago ok y respuesta perdida.** Ocurre con el flujo *upfront*. La regla de negocio es que el pago compra el procesamiento y que la reentrega se pide al proveedor con el mismo identificador, sin pagar dos veces. Requiere la tabla durable de pagos liquidados.

**El servicio se entrega y la liquidación falla.** En el flujo por defecto x402 verifica, entrega y recién después liquida. Si la liquidación falla después de entregar el resultado, no hay reversión: x402 no devuelve un servicio ya entregado. Por eso el recurso tiene que poder pedirse otra vez sin pagar dos veces.

**El proveedor entrega un resultado inválido.** El verificador de TEMIS aplica el recibo al paquete y devuelve sí o no. Si no calza, no se acepta. El dinero no lo devuelve TEMIS —eso no lo puede hacer sin ser él un seguro—: se devuelve por la vía contractual con el proveedor, que es una promesa del proveedor, no del sistema.

**Alguien edita el archivo.** Sin firma no hay defensa. Con firma, la línea editada no verifica. El hash cambia, y eso es lo que se detecta.

**Alguien borra la custodia.** Si el cuerpo desaparece y no hay copia, el anclaje no sirve: prueba la integridad de un hash, no que el documento exista. Por eso hay dos copias.

## 7. Quién firma, quién paga, quién verifica

| Actor | Qué firma | Qué paga | Qué verifica | Estado real de esa fila |
|---|---|---|---|---|
| Parte A | el digest de versión y de hito | honorario y fee | sus propias declaraciones | es diseño; no existe |
| Parte B | ídem | ídem | ídem | es diseño; no existe |
| Profesional | el acuerdo que redactó | nada | la completitud formal | es un profesional real, no el sistema |
| Operador TEMIS | el anclaje | infraestructura y fee | el recibo, el estado y la idempotencia | el anclaje (`src/ancla.js`) y la idempotencia durable (`src/pagos.js`) están construidos y probados en testnet con datos de fantasía; el operador como servicio no existe |
| Verificador de TEMIS | nada | nada | el informe contra el paquete | es diseño; no existe |
| Proveedor técnico | el informe que entrega | nada | lo que se le pagó | fuera del sistema |
| Facilitador x402 | la transacción reconstruida | las tasas | la autorización y los balances | liquidaciones reales en testnet de 0,01 USDC verificadas en Horizon (2026-10-02 y, en la prueba 7, 2026-10-03); no es un servicio de TEMIS |
| Tercero verificador | nada | nada | el historial público | condicional: si alguien hospeda el archivo |

Las filas de las partes y del verificador son el producto que se quiere construir y no existen hoy; el profesional es una persona real. Del operador están construidos el anclaje y la idempotencia durable del pago; el operador como servicio no existe. La tabla dice qué debería pasar; el §9 dice qué hay.

## 8. Qué hace cada pieza y qué no

| Pieza | Acredita | No acredita |
|---|---|---|
| Firma ed25519 | que el firmante controlaba la clave y que el contenido no cambió | identidad civil, consentimiento jurídico, ausencia de coacción |
| `MEMO_HASH` en el ledger | que existió un digest, en ese ledger, en ese orden | qué dice el documento, dónde está, quién lo escribió |
| Cierre de ledger | una hora que se puede citar y contestar | fechado de prestador acreditado, valor de fecha |
| Secuencia de cuenta | orden de escritura de una cuenta | orden causal, legitimidad de un hito |
| Contrato SEP-41 | que hubo una transferencia por contrato | consentimiento |
| x402 `/verify` | que la autorización es válida y no está vencida | que se haya liquidado |
| x402 `/settle` | que la transacción se envió y se sondeó hasta `SUCCESS` o `FAILED` (el documento de Stellar lo pide así) | que la contraparte esté satisfecha |
| Evento de transferencia | que hubo un movimiento | cómo se hizo el pago |
| Recibo del kernel | qué se decidió y con qué evidencia | quién es el autor de esa evidencia |
| `grantSpend` del kernel | que el gasto estaba dentro del permiso | que el gasto sea justo o legítimo |

## 9. Qué está construido y qué es diseño

| Cosa | Estado |
|---|---|
| Kernel: autorización, operaciones, recibos, ejemplo de conector de pagos | construido; leído y citado con archivo y línea el 2026-10-02 (`tramos/0/kernel-citado.md`) |
| Que el kernel no tenga firma, cadena, idempotencia durable ni continuidad | comprobado en el código el 2026-10-02 (`tramos/0/kernel-citado.md`) |
| Ejemplo x402 del kernel | construido en testnet; es una capacidad de plan de marketing, no de TEMIS |
| x402 en vivo: 402 real, firma, facilitador, liquidación, verificación | una liquidación en testnet del 2026-10-02 con el adaptador reparado: recibo `verified`, solo `external anchor` en `notCovered`, y la transacción confirmada por separado en Horizon (`demo/x402/receipts/live-testnet-2026-10-02.json` del kernel). Antes hubo una del 2026-09-23 (corrida 002). Tres liquidaciones en testnet (2026-09-23, 2026-10-02 y la prueba 7 del 2026-10-03), cada una con un pagador de fantasía; ninguna es un servicio de TEMIS |
| Forma canónica, digest, firma, contrafirma, cadena, anulación | construido y probado (`src/canonical.js`, `src/firma.js`, `src/cadena.js`): 117 pruebas; una corrida real en testnet con 23 transacciones y la reconstrucción por un tercero independiente con 22 de 22 estatus coincidentes (`tramos/1` a `tramos/3`) |
| Anclaje de una línea en Stellar | construido (`src/ancla.js`): una transacción clásica con `MEMO_HASH` del digest de la línea; usado en las corridas de los tramos 3 y 4 |
| Idempotencia durable del pago | construida (`src/pagos.js`, registro de solo creación en archivos, con reserva atómica entre procesos) y probada en vivo: un reintento no vuelve a llamar al facilitador y la red muestra un solo abono (`tramos/4/idempotencia.json`). Detecta el doble cobro y no lo evita: ver el siguiente renglón |
| Continuidad del adaptador | no construida más allá de esa tabla: nada despierta un proceso caído. Un cobro cuyo resultado se perdió queda `incierto` hasta que alguien lo reconcilia contra la red; y si dos cobros llegan a confirmarse (por ejemplo, un cobrador más lento que el plazo cuando alguien ya había reconciliado «no cobrado»), la tabla marca `conflicto`: lo detecta, no lo evita, y lo decide una persona. Los relojes de los procesos que comparten la tabla tienen que estar razonablemente de acuerdo |
| Verificador de informes, catálogo de servicios, control de acceso por rol | diseño diferido; no existe |
| Retención por sector y reglas de admisión y salida | diseño diferido; depende de un reglamento que no se leyó |

Un hash de archivo acredita integridad del archivo, no su contenido. Reabrir el árbol y citar archivo y línea es parte del trabajo, no un detalle.

## 10. El marco chileno

**Firma y fecha.** La Ley 19.799, artículo 2 letra g), define firma electrónica avanzada como la certificada por un prestador acreditado. El artículo 5 dice que el documento privado suscrito con firma electrónica avanzada tiene el valor probatorio del instrumento público, pero que **no hace fe respecto de su fecha** salvo que conste un fechado electrónico de prestador acreditado. Una firma en blockchain no es por sí sola firma avanzada y un anclaje no es un sellado de tiempo acreditado. TEMIS no promete fuerza probatoria automática.

**Los datos.** La Ley 20.584, artículo 13, es el ejemplo más duro de un sector regulado. Ahí hay ocho letras de acceso y dos importan. La letra b) da a un tercero debidamente autorizado por el titular, mediante poder simple ante notario o firmado por un sistema electrónico que garantice la autenticidad conforme a la 19.799. La letra d) da a abogados y fiscales **previa autorización del juez competente**, y sólo cuando la información se vincula con las investigaciones o defensas que tienen a su cargo. El artículo tercero transitorio de la Ley 21.668, publicada el 28 de mayo de 2024, dio al Ministerio de Salud dieciocho meses para actualizar el reglamento del artículo 13; si se publicó y qué dice, este documento no lo comprobó hoy: el estudio de leyes del acuerdo de Vespi anotó el 27 de septiembre que no aparecía publicado y que la Superintendencia seguía citando el Decreto 41 de 2012, y esa es la última consulta.

La conclusión de diseño es la que importa: TEMIS no es el mecanismo de acceso a la ficha clínica. Es, en un sector así, el lugar donde queda registrado quién pidió, con qué autorización y en qué momento. El permiso es limitado, no autoriza reutilización y no vuelve gratis a nadie.

**La reforma de datos.** La Ley 21.719 se publicó el 13 de diciembre de 2024 y su texto vigente (versión consolidada del 5 de febrero de 2026) tiene vigencia diferida al 1 de diciembre de 2026: «entrarán en vigencia el día primero del mes vigésimo cuarto posterior a la publicación de esta ley en el Diario Oficial». El 1 de septiembre de 2026 el Ejecutivo ingresó el Boletín 18.623-07, que la posterga al 1 de diciembre de 2027; sigue en primer trámite en el Senado según las fuentes consultadas el 2 de octubre y es un proyecto, no una ley. Si el proyecto prospera, cambia la fecha en que cambia el marco completo; hasta entonces rige la del texto publicado. Contiene el artículo 15 bis, sobre tratamiento por un tercero encargado; el 15 ter, sobre evaluación de impacto previa al inicio cuando el tratamiento probablemente sea de alto riesgo; el 16, sobre datos sensibles; el 16 bis, cuya letra d) comprende el tratamiento necesario «para la formulación, ejercicio o defensa de un derecho ante los tribunales de justicia o un órgano administrativo»; y el 16 ter, sobre datos biométricos, que sólo admite las hipótesis del 16 bis.

Dos consecuencias. La primera: defender un derecho es una de las hipótesis que la propia ley reconoce, y eso importa más para TEMIS que cualquier otra cosa del texto. La segunda: TEMIS no necesita biometría en la primera versión, y una wallet que autentica localmente no convierte a TEMIS en un sistema biométrico.

**Los seguros.** Acá hay que ser tajante, y por eso va con el texto del artículo y no con mi interpretación. El artículo 4 del DFL 251 dice: «El comercio de asegurar riesgos a base de primas, sólo podrá hacerse en Chile por sociedades anónimas nacionales de seguros y reaseguros, que tengan por objeto exclusivo el desarrollo de dicho giro y las actividades que sean afines o complementarias a éste, que autorice la Superintendencia mediante norma de carácter general.» Un contrato que promete cubrir el incumplimiento a cambio de una comisión es una promesa de seguro. TEMIS, en su primera versión, **no ofrece ninguna cobertura** y no la ofrece con otro nombre: su módulo de cumplimiento no promete pagar nada.

La salida, si algún día se quiere cobertura de verdad, está en el inciso tercero del mismo artículo: cualquier persona natural o jurídica puede contratar libremente en el extranjero toda clase de seguros, salvo los obligatorios y los del decreto ley 3.500. O sea: asegurador licenciado, o contrato con uno extranjero. Y la calificación de si esto es o no una operación de seguros, y de qué contrato sirve, es de un abogado que cobre por eso, no de este documento.

## 11. Gobernanza por capas

RUC-D ordena el proyecto distinguiendo recursos, actores y derechos por capa. Esto es diseño inspirado en RUC-D; no es demostración de su tesis.

| Capa | Recursos | Actores | Derechos |
|---|---|---|---|
| Acuerdos | el expediente y sus versiones | las partes, el profesional | escribir, leer lo propio, corregir |
| Prueba | digests y anclas | cualquiera | verificar sin permiso |
| Servicios | las capacidades pagadas | operador, proveedor | cobrar por lo entregado; no al dato ajeno |
| Infraestructura | cuentas ancla, claves, fondos | operador | retirar, rotar, congelar |
| Comunidad | reglas de admisión y salida | cualquiera que cumpla | apelar una exclusión |

De ahí salen cinco acuerdos que este proyecto necesita y que no son código: admisión, revisión, custodia, reclamaciones, conflictos de interés y salida. No se propone DAO ni token: un token especulativo en un proyecto que se llama Not Ponzi sería una contradicción con nombre propio.

Y una cosa que este documento se quita de encima. La tabla anterior no inventa plazos. El reglamento que los fijaría para el sector sanitario es uno que no se comprobó. Así que la regla por defecto es más simple y más conservadora: en la primera versión **no se borra nada por regla propia**; la retención la declara el sector o el contrato, y si nadie la declara, se retiene indefinidamente. Con eso el proyecto no depende de un reglamento que nadie ha leído.

## 12. La economía, sin números inventados

No hay ni una cifra de demanda en este documento, y tampoco cotizaciones. Lo que hay es la estructura, que se puede escribir sin inventar nada.

Not Ponzi cobra un porcentaje α del monto M del acuerdo, sólo si se cumple: ingreso α·M en el camino feliz. Si hay incumplimiento, el profesional asume un costo de defensa D. El margen esperado por acuerdo es (1−p)·α·M − p·D, donde p es la probabilidad de disputa. El equilibrio p* = α·M / (α·M + D) no se calcula aquí, porque α, M y p no están medidos.

Lo que sí se puede decir es la forma de la sensibilidad: el equilibrio sube con el monto y con el porcentaje, y baja con el costo de defensa. Un acuerdo pequeño con defensa cara nunca funciona con este modelo. Eso es aritmética, no una previsión.

Hay cinco líneas de dinero que no se deben mezclar:

1. **Honorario jurídico**, del profesional, se paga en cumplimiento.
2. **Servicio del operador**, por acuerdo gestionado. **No está validado**: nadie ha dicho que lo pague nadie.
3. **Procesamiento por x402**, por uso, a un proveedor externo.
4. **Custodia y red**, costo del operador; escala con los hitos y con los años de retención.
5. **Cobertura de riesgo**, que en v1 es cero y no se vende.

El error fácil es mirar la quinta línea y creer que el producto la incluye. No la incluye.

Lo que hay que medir antes de fijar cualquier tarifa: cuántos hitos tiene un acuerdo real, cuánto se tarda en cerrar un hito, qué pasa con el registro cuando una parte no responde, y qué pagarían de verdad un estudio y su cliente por la reconstrucción. Ninguna de esas cuatro tiene respuesta hoy.

## 13. El incentivo y el nombre

El mecanismo de Not Ponzi alinea a las tres partes, y es lo mejor del diseño original: el profesional cobra por el cumplimiento, no por el conflicto. Lo que lo arruinaría es cualquier regla que haga crecer el ingreso con la cantidad de disputas. Por eso la regla es dura y es la primera: **la oferta de cualquier instrumento financiero de TEMIS no puede ser función del número de casos.**

También al revés: este modelo tiene un techo. Si la tasa de cumplimiento de los acuerdos baja, el modelo se rompe, y no hay token, contrato ni blockchain que lo arregle. Eso es una restricción de negocio y conviene verla de entrada.

## 14. Las amenazas

Cada una con su qué, porque una lista que sólo advierte no es una lista.

- **Asimetría de escritura.** Qué se hace: *declarado por una parte* y *acordado* son estados distintos y se ven distintos en el recibo. No se arregla la falta de una parte; se deja de esconderla.
- **Clave de la cuenta ancla comprometida.** Qué se hace: el tercero compara el historial reconstruido contra la copia de cada parte; si no coinciden, lo declara. La rotación se ancla con firma de la clave vieja y la nueva.
- **Custodia perdida.** Qué se hace: dos copias, una por parte. Con eso se recupera; sin eso, la ancla no sirve y hay que decirlo.
- **Dependencia del facilitador.** Qué se hace: se documenta que es un tercero con su propia configuración y sus propias claves, y se puede autoconfacilitar. El riesgo es de disponibilidad, no de confianza: el facilitador verifica contra la red, no contra TEMIS.
- **Reintento doble.** Qué se hace: tabla durable de pagos liquidados, con clave por acuerdo y por capacidad.
- **Vencimiento por ledger.** Qué se hace: ventana de autorización holgada y reintento con un pago nuevo, que se rechaza por la tabla de idempotencia, no por la cadena.
- **Un hash no es anonimización.** Qué se hace: identificador de expediente opaco y no correlacionable, y cuenta ancla distinta por cliente si el volumen lo justifica.
- **Presión legal.** Qué se hace: el documento no promete valor probatorio y lo dice en la primera página del marco legal. La defensa es no haber prometido.

## 15. El token

**Actualización del 3 de octubre de 2026.** Andrés decidió crear $TEMIS para el MVP, solo en testnet. El estudio de tokenomics con el marco RUC-D que lo acompaña concluyó que hoy el problema económico de TEMIS no está medido, así que el token se emitió como un experimento de mecánica, sin valor, sin precio, sin liquidez y sin venta: oferta fija de 100.000.000, emisora bloqueada, sin banderas ni clawback, cubetas visibles y vesting de fundadores con balances reclamables. La evidencia está en `tramos/5/`. Las tres razones de abajo siguen en pie para cualquier emisión con valor, y la restricción de que la oferta no puede ser función del número de disputas se cumple por construcción: la oferta es fija.

Andrés preguntó si TEMIS puede tener token propio. Puede: Stellar emite activos. La pregunta correcta es si conviene.

La respuesta es que **no en la primera versión**, por tres razones concretas. La primera es que no hay registro construido ni volumen, así que un token sería una promesa sin nada detrás. La segunda es regulatoria y no es opinable: un instrumento cuyo valor depende del resultado de una disputa se parece a un valor asegurador, y eso es materia de la regulación de seguros que se acaba de ver. La tercera es de nombre: emitir algo que crece con el conflicto es la única forma de hacer falsa la palabra Not Ponzi.

Si algún día se decide, el camino no es un token inventado. Stellar tiene una propuesta de estándar para activos regulados, SEP-57 o T-REX, que está en estado *Draft* (versión 0.4.0, actualizada el 8 de septiembre de 2026) y se declara basada en ERC-3643: registro de identidad on-chain, módulos de cumplimiento enchufables, congelamiento y recuperación de cuentas perdidas. Que exista una herramienta pública que genere esos contratos no se verificó en este pase. Ese sería el camino técnico serio para un token regulado, y siendo un borrador hay que releerlo antes de apoyarse en él. Lo que no se hace es emitir sin emisión, sin capital y sin emisario identificado, que es exactamente como aparece un scam.

Y una restricción que no es negociable: la oferta no puede ser función del número de disputas.

## 16. Cómo mutaría Lore Plugin

Andrés dijo que si algo de TEMIS obliga a mutar el kit, es un hallazgo. Hay dos, y son de clases distintas. Esto es una propuesta con su prueba de ausencia, no una campaña para un corte.

**Hallazgo 1, disciplina general: falta forma canónica publicada.** El kit no publica la forma en que un cuerpo debe escribirse, así que dos implementaciones independientes del mismo cuerpo no se pueden comparar, y sin comparación no hay verificación entre implementaciones. *Prueba que no existe: dos implementaciones independientes del mismo cuerpo y una prueba de concordancia publicada.* TEMIS necesita esto para su propia forma canónica, así que no es un lujo de este proyecto: es lo mismo que necesita cualquier cuerpo que otro tenga que verificar.

**Hallazgo 2, disciplina general: falta un canal de aviso con destinatario.** El kit actúa en el momento de la escritura y cuando la sesión se aparta, y el resultado de una rotura de invariante queda en la cola de auditoría, que es donde nadie mira. *Prueba que no existe: un invariante del proyecto se rompe y el aviso llega a una persona en vez de quedar en la cola.*

**Lo que TEMIS necesita y no es del núcleo.** Retención declarada, firma y contrafirma, y una primitiva de cadena ordenada. La retención es una obligación legal con plazos, y una hipótesis científica no tiene plazos de retención. Va en la capacidad de TEMIS, no en el núcleo: si entra, todo proyecto no regulado hereda un bloque vacío que hay que llenar.

## 17. Cómo se prueba

En orden, y sin saltos:

0. **Reabrir el kernel y citar.** Archivo y línea por cada capacidad y por cada ausencia del §4.5. Sin esto, el §4.5 es un reporte de otro agente y no una base de diseño.
1. **Forma canónica publicada** con dos vectores de prueba, antes del primer expediente.
2. **Firma y contrafirma**, con la línea de §4.5 cerrada, antes que cualquier prueba de red.
3. **Datos sintéticos** de permisos, concurrencia y reconciliación. Nada real, nada de personas.
4. **Testnet de punta a punta**: alta, firma, anclaje, hito, impugnación, corrección, disputa, reconstrucción por un tercero que no participó.
5. **Prueba de la `payTo` multiplexada**, en testnet: un payload con destino multiplexado contra `/verify` y `/settle`. Sale positivo o negativo, y en los dos casos el documento dice lo mismo.
6. **Prueba del tipo de operación**: un pago hecho de las dos maneras y leer el tipo en cada transacción, para confirmar que un evento no alcanza como prueba.
7. **Prueba de idempotencia**: reintentar una liquidación y comprobar que cobra una vez, incluida la que falla después de entregar el servicio. (Lo que se corrió el 3 de octubre fue la entrega que falla después de cobrar; ver el §17.1.)
8. **Prueba de first-write-wins** con dos escrituras concurrentes del mismo expediente.
9. **Prueba de la pérdida de respuesta** del proveedor.
10. **Prueba de rotación de clave ancla**: que un tercero siga reconstruyendo antes y después.
11. **Un piloto**, sólo después, y sólo con autorización expresa.

Alcance del MVP (`acuerdo.md`): las pruebas 0 a 8. La 9 (pérdida de respuesta del proveedor) queda pendiente hasta que haya más de un proveedor, y la 10 (rotación de la clave ancla) hasta que haya una operación que la presione. La 11 queda fuera. Este documento no declara viabilidad.

### 17.1 Qué pasó con las pruebas 0 a 8 (estado al 3 de octubre de 2026)

Las pruebas 0 a 4 están en `tramos/0` a `tramos/3`. Las pruebas 5 a 8 se corrieron el 3 de octubre en Stellar testnet, con cuentas y datos de fantasía, y cada resultado está en `tramos/4/`:

- **Prueba 5, `payTo` multiplexada: negativa.** Con una `payTo` multiplexada (dirección `M…` sobre la cuenta receptora), el payload se construye, pero el facilitador x402 lo rechaza en `/verify` con `invalid_exact_stellar_payload_event_wrong_to`. El dato es ese código; que el evento de la transferencia salga con la cuenta `G` de base y no coincida con el destino declarado es la lectura del código, no algo que la corrida muestre. Un control con la `payTo` normal (`G`) pasó `/verify`, de modo que el negativo es del destino multiplexado y no de la corrida. No se liquidó nada con la multiplexada. La conclusión es la que ya decía el §4.4: no se puede etiquetar el pago con el identificador del expediente; la etiqueta la pone TEMIS guardando el hash de la transacción y el índice de la operación (`tramos/4/payto-multiplexada.json`).
- **Prueba 6, tipo de operación: confirmada.** Un pago de 0,01 USDC se hizo de las dos maneras. Como operación clásica `payment` (transacción `a7b8393c…`, ledger 4995969) y como invocación del contrato de activo (`invoke_host_function`, transacción `44e0f752…`, ledger 4995970). El evento de transferencia es idéntico en los dos (mismos temas, mismo importe, mismo contrato); solo el tipo de operación de la transacción dice cómo se hizo. Un evento no prueba el tipo de pago (`tramos/4/tipo-operacion.json`).
- **Prueba 7, idempotencia: pasa.** Con el cobro pasando por la tabla durable, un reintento de la misma liquidación devuelve el resultado anterior sin llamar al facilitador, una entrega que falla después de cobrar se reintenta sin cobrar otra vez, y Horizon muestra un solo abono de 0,01 USDC (transacción `5495a053…`). Aparte, reenviar el mismo payload directamente al `/settle` del facilitador sin la tabla fue rechazado por simulación (`invalid_exact_stellar_payload_simulation_failed`) y no hubo un segundo abono; la lectura es que la autorización ya estaba consumida, y el dato no prueba esa causa. Eso no sustituye la tabla, que cubre lo que el facilitador no ve (un cobro cuyo resultado se perdió se marca `incierto` y no se reintenta a ciegas). La tabla es un registro de solo creación (cada hecho es un archivo nuevo, nunca se reescribe), sin candados, y la clave es la obligación que se paga y no la autorización. Un verificador independiente encontró en su primera versión caminos con doble cobro, un cobro lento que pisaba el estado y una entrega duplicada; se corrigieron con la prueba en rojo primero y la tabla se rediseñó. Se probó además, en pruebas locales (`test/`, no en testnet), con ocho procesos que intentan el mismo cobro a la vez y con rondas de estrés con un archivo `.lock` residual del diseño anterior en el directorio: cobra uno (`tramos/4/idempotencia.json`, `test/pagos.test.js`).
- **Prueba 8, first-write-wins con escrituras concurrentes: pasa.** Tres rondas reales: dos procesos anclan a la vez, desde la misma cuenta, dos líneas que compiten por la misma clave y citan la misma línea anterior. La red las ordena como quiere (ganó la escritura A una vez y la B dos) y en las tres rondas la perdedora fue la que tuvo que reintentar por colisión de secuencia (unos seis ledgers después), de modo que el desempate lo resolvió el reintento y no dos transacciones aceptadas en el mismo cierre; la reconstrucción declara vigente a la primera por (ledger, índice), calculada aparte desde el libro crudo, perdedora a la otra, y da lo mismo con el libro en orden inverso. En ninguna ronda las dos cayeron en el mismo ledger, así que el desempate por índice dentro de un ledger no se ejercitó en vivo; está cubierto por las pruebas unitarias de la cadena (`tramos/4/carrera.json`).

Lo que estas pruebas no dicen: la prueba 5 es un facilitador, un pagador y una `payTo` multiplexada, y solo `/verify`: no se corrió `/settle` con la multiplexada, así que «no se puede etiquetar el pago» es lo que se observó en ese facilitador y no una derivación de la especificación; la prueba 7 no cubrió el caso inverso del §17 (la liquidación que falla después de entregar el servicio), sino la entrega que falla después de cobrar, y los caminos `incierto` y `conflicto` de la tabla se ejercitan en pruebas locales y no en testnet; no hay mainnet ni servicio operando; la autenticidad de las firmas de las transacciones de Stellar no se verificó en la reconstrucción independiente; la prueba 7 usa un solo facilitador y un solo pagador; y las pruebas 9 y 10 siguen pendientes por su condición de entrada.

## 18. Lo que solo deciden Andrés y Francisco

Tres cosas, y para las tres este documento ya trae una propuesta por si quieren aceptarla sin discutirla.

**El primer cliente y el primer flujo.** La propuesta es un acuerdo entre dos partes con un solo hito de pago, con un estudio jurídico como contraparte. Si quieren otro, se cambia el flujo, no la arquitectura.

**Quién contrata y quién paga.** La propuesta es que las partes paguen el honorario en cumplimiento y que el operador cobre un fee por acuerdo gestionado. El honorario en cumplimiento es el que hace que el mecanismo no sea un ponzi, así que no propongo cambiarlo. Que el fee esté sin validar es lo primero que hay que medir.

**Si la cobertura entra o no.** La propuesta es que no entre en la primera versión, y que si entra sea con un asegurador licenciado o un contrato extranjero, calificado por un abogado. Cualquier otra cosa es una promesa que el proyecto no puede cumplir con su nombre.

Y una cuarta que no es de este documento: si TEMIS entra a la lista de proyectos de Vespi, es uno más o desplaza a otro. La lista no se lee acá porque está fuera de esta carpeta; la trae el coordinador.

## 19. Fuentes

**Stellar, documentación oficial:** transacciones y memos (`MEMO_HASH` de 32 bytes); interacción con contratos (`InvokeHostFunctionOp` único por transacción, sin memo, `MEMO_NONE`); fees y límites de recursos (mínimo de 100 stroops por operación); archivado de estado (`Persistent` e `Instance` se archivan al llegar a cero TTL, `Temporary` se borra; restaurar cuesta renta y una entrada restaurada se puede modificar); Stellar Asset Contract e interfaz SEP-41; [aviso de seguridad sobre memos y autorizaciones de Soroban](https://github.com/stellar/stellar-core/security/advisories/GHSA-3p8h-7v82-ffvq).

**x402 v2:** [esquema `exact`](https://github.com/x402-foundation/x402/blob/main/specs/schemes/exact/scheme_exact.md) · [`exact` en Stellar](https://github.com/x402-foundation/x402/blob/main/specs/schemes/exact/scheme_exact_stellar.md) · [transporte HTTP v2](https://github.com/x402-foundation/x402/blob/main/specs/transports-v2/http.md) · [especificación general v2](https://github.com/x402-foundation/x402/blob/main/specs/x402-specification-v2.md) · [redes y activos soportados](https://docs.x402.org/core-concepts/network-and-token-support) · [SEP-57 T-REX](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0057.md)

**Normas chilenas:** [Ley 19.799](https://www.bcn.cl/leychile/navegar?idNorma=196640) · [Ley 20.584](https://www.bcn.cl/leychile/navegar?idNorma=1039348) · [Ley 21.668](https://www.bcn.cl/leychile/navegar?idNorma=1203827) · [Ley 21.719](https://www.bcn.cl/leychile/navegar?idNorma=1209272) · [DFL 251](https://www.bcn.cl/leychile/navegar?idNorma=5201)

Fecha de consulta de las fuentes de Stellar y de las normas chilenas: 2 de octubre de 2026; el cotejo y los pasajes están en `tramos/0/fuentes.md`. El documento histórico de Not Ponzi se cita por medio del relevo de un agente anterior y este pase no lo reabrió. El kernel de Vespi sí se reabrió y se cita con archivo y línea en `tramos/0/kernel-citado.md`.
