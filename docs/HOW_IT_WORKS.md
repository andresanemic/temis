# How TEMIS works

## Scope

TEMIS is described as a versioned record for bilateral agreements organized by milestones. The source material distinguishes the intended workflow from the limited implementation exercised in testnet. The MVP covered tests 0 to 8 with fictional data; it does not provide a live legal service.

## Participants and rights

| Participant | Intended role | What the record can show | Boundary |
| --- | --- | --- | --- |
| Party A and Party B | Sign the agreement and milestone statements, respond, accept, or challenge | Which keys signed which digests and in what recorded order | A key is not a civil identity or proof of free consent |
| Legal professional | Prepare or review the agreement and be identified in it | The professional named in the agreement record | TEMIS does not replace the professional's work |
| TEMIS operator | Coordinate the record, anchor line digests, and maintain payment facts | The anchor account's public write sequence | The operator is not a judge; a single anchor account is a trust and key-management risk |
| Internal TEMIS verifier | Compare a report with a document package | A technical match or mismatch for the inputs supplied | It does not certify truth or legal sufficiency |
| Technical provider | Deliver a paid report or other bounded service | The report and payment references included in the record | Provider quality and contractual remedies remain external |
| x402 facilitator | Verify authorization and submit a settlement | The settlement result returned by the facilitator and ledger | Settlement does not mean the recipient is satisfied |
| Independent third-party reviewer | Reconstruct from public history and compare a party copy | The sequence recoverable from the complete archive and specification | This depends on a complete history archive and a copy for comparison |

## Canonical record: TEMIS-CF-1

The agreement body stays off-chain in copies held by the parties and operator. The canonicalization rules exist so independent implementations can calculate the same digest from the same document: JSON keys sorted by their UTF-8 bytes, duplicate keys rejected, text normalized to NFC, unnecessary escapes removed, numbers expressed as fixed point at a declared scale, and SHA-256 as the digest. The digest is 32 bytes and fits Stellar `MEMO_HASH`. The whitepaper says the canonical form is paired with test vectors. The Vespi kernel's generic JSON canonicalizer is not the TEMIS-CF-1 form.

Each version has its own digest. A signature applies to a digest, not to a mutable document name. The agreement body and attached evidence are not published in Stellar transactions.

## Walkthrough: two parties and one milestone

Example: Party A agrees to deliver one design package to Party B by a stated date, and the agreement requires a delivery receipt as evidence. This is an illustrative example of the documented workflow, not a real client or a testnet agreement.

1. **Prepare.** A legal professional drafts the agreement and milestone requirements. TEMIS assigns an opaque agreement identifier and version. Each party receives a copy. At this step the off-chain body, evidence requirement, and deadline are written; no network fact proves their truth.
2. **Sign the version.** Each party signs the TEMIS-CF-1 digest using ed25519. The second signature countersigns the same version digest. The record becomes agreed only with both signatures. The network receives a classic Stellar transaction whose `MEMO_HASH` contains the digest. This anchors the digest in ledger history; it does not publish or validate the body, prove identity, timestamp the document through an accredited provider, or establish legal enforceability.
3. **Open the milestone.** The record writes the milestone identifier, required evidence digest or reference, and deadline. The line itself may be signed and anchored. A ledger entry proves that this line was written in an account sequence; it does not prove the deadline is fair or that the milestone is feasible.
4. **Declare performance.** Party A submits a delivery statement and evidence, signs the relevant digest, and anchors the record line. The resulting state is `declared_by_one_party` (the user-facing whitepaper calls it “declared by one party”). This proves a signed statement was recorded, not that delivery actually occurred.
5. **Respond.** Party B may accept, challenge, or not respond. Acceptance and challenge are recorded as signed lines. Silence is represented by the later recorded close, not by a transaction from Party B. A challenge records disagreement; it does not resolve it.
6. **Close.** With both parties' signatures, the milestone can close as `fulfilled`. If one party does not respond, the operator may record `fulfilled_unconfirmed`, a weaker, visibly distinct status. The distinction preserves the asymmetry in the record; it does not cure the missing response.
7. **Correct.** A correction is another line that identifies the prior line as annulled. The old line remains in history. The replacement line is evaluated under the chain rules. A correction changes the reconstructed active view; it does not erase the original write.
8. **Record non-performance or dispute.** An overdue milestone can be recorded as unfulfilled with the supporting statement and evidence. Parties may open a controversy record naming who activated it, the appointed professional, and a conflict disclosure. TEMIS records the event; it does not demand performance, prosecute, adjudicate, collect, or pay.
9. **Reconstruct.** A reviewer reads the complete history archive for the anchor account, identifies the relevant ledger transactions and memo hashes, applies the published canonicalization and chain rules, and compares the reconstructed lines and bodies with a party's copy. Differences must be reported. The reviewer needs the complete history; an explorer page alone is insufficient.

## Chain rules

- A line has a canonical body and digest, a prior-line reference where required, signatures, event type, agreement and milestone identifiers, version, and anchor reference as specified by the record format.
- The ordering key is the anchor account's accepted sequence, with ledger position used where available to order transactions in a shared ledger. The historical write order is not proof of causal order or legitimacy.
- `first-write-wins` applies to the key (agreement, milestone, version): only the first accepted line opens state; later lines remain in history but do not replace it merely by being later.
- An annulment is a new line that points to the line it annuls. The source line is not removed from history.
- If the winning line is annulled, the slot becomes empty. The chain does not promote a losing duplicate.
- The source receipt describes eleven distinct statuses exercised in the integration run; they are event and validation outcomes, not eleven judicial conclusions. User-facing milestone outcomes in the recorded example were fulfilled, fulfilled-unconfirmed, and challenged.
- A controversy record does not change milestone status. The deadline itself is not modeled as a self-executing ledger event; `fulfilled_unconfirmed` is an operator-recorded close when there is no response.
- A single anchor account provides a total write sequence but gives its key holder the ability to write misleading annulments. Part signatures do not prevent a falsely signed operator annulment. Key rotation requires a line signed by old and new keys; if the old key is lost, continuity is visibly broken.

## x402 payments: flow, table, guarantees, and limits

x402 pays for a technical capability, not for the underlying agreement or legal rights. The described Stellar `exact` scheme uses SEP-41 assets; classic Stellar assets are not supported by that scheme. The documented default path is sponsored authorization: the client signs an authorization entry with a ledger expiry, and a facilitator supplies fees, reconstructs, and submits the transaction. A full-transaction signing path is described as future work in the cited reference implementation and was not tested here.

| Stage / durable fact | Meaning | What it guarantees in the observed design | What it does not guarantee |
| --- | --- | --- | --- |
| `/verify` | Read-only check of authorization and payment parameters | A valid response for the authorization submitted | No settlement has occurred; no service quality or delivery is established |
| Obligation reservation | Durable, atomic claim keyed to the obligation being paid | Competing processes cannot both own the same reservation in the tested table design | It depends on filesystem hard-link support (NTFS, ext4, APFS); directory entry durability is not forced to disk |
| Execution / delivery | Provider performs the capability | The service is attempted once per recorded obligation and can be requested again with the same identifier | A process crash can interrupt delivery; x402 does not guarantee a refund |
| `/settle` and ledger check | Facilitator submits and polls to `SUCCESS` or `FAILED` | A settlement result is recorded as a new immutable fact | A service already delivered cannot be reversed if settlement later fails |
| Retry / reconciliation | Read existing facts and determine whether the same obligation was paid | A retry after a known settlement returns the existing result instead of calling the facilitator again | A slow settlement arriving after a “not paid” reconciliation can create `conflict`; this is detected, not prevented, and needs human reconciliation |
| Receipt references | TEMIS stores the transaction hash and operation index with the milestone receipt | A reviewer can locate and inspect the intended payment operation | The payment cannot be tagged with the agreement ID in the on-chain payment memo; an event alone does not prove the operation type |

The live testnet idempotency receipt reports one facilitator call, one actual credit, and a delivery retry without a second charge. Direct replay of the same payload to `/settle` was rejected by simulation. The scenario was run once with one facilitator and fictional data. It does not validate the untested case where delivery succeeds and settlement then fails, every timing race, or production reliability. A durable table charges the same recorded obligation once in the tested path; `uncertain` or `conflict` states are explicit limits, not an automatic recovery promise.

## What a third party can verify

Public inputs named by the sources are: the complete Stellar history for the anchor account; ledger transactions and their `MEMO_HASH` values; the published canonicalization and chain specifications; agreement and line digests; signatures and public keys; and a party's off-chain copy for comparison. The integration receipt reports 22 of 22 status matches with an independent reconstruction and matching outcomes for three milestones in one run. It also reports one signature from an unrelated third party that was not counted as a party signature. That run does not establish civil identity, complete archive availability, account-key ownership beyond what the agreement declares, truth of evidence, legal effect, or correctness for every possible input.

## Sources and status names

This guide follows the supplied TEMIS whitepaper and receipts for milestone outcomes (`fulfilled`, `fulfilled_unconfirmed`, `challenged`, `unfulfilled`), chain behavior, signatures, anchors, x402, and reconstruction. The whitepaper and receipts do not define a stable public catalogue of exactly ten named status values. Therefore this document does not invent one; implementation-level validation statuses are treated as distinct from the milestone outcomes above.

## A narrated example, from agreement to review

The following scenario is fictional and illustrates the specified workflow. It is not a transcript from a running TEMIS interface. The outcome labels are the labels used by the documented record; no extra fields or command output are implied.

Two parties agree that Party A will deliver a design package and that Party B will acknowledge receipt. A legal professional writes the deadline and the evidence requirement into the agreement. Both parties keep the off-chain document and sign the same TEMIS-CF-1 digest. The network receives only the digest anchor.

```text
Illustrative record · fictional data
Agreement version: signed by Party A and Party B
Milestone: design package delivery
Evidence reference: delivery receipt
```

Party A then signs a delivery declaration. If Party B confirms, the documented close is `fulfilled`. If Party B remains silent, silence is not represented as Party B's transaction; the operator can record `fulfilled_unconfirmed`. If Party B challenges the declaration, that records disagreement and does not resolve it. A correction adds a new line that annuls an earlier line while leaving the original in the history.

```text
Both parties confirm: fulfilled
No response from Party B: fulfilled_unconfirmed
Party B challenges: challenged
```

These are concise illustrations of the documented states, not raw tool output. The technical verifier can compare supplied digests and records. An independent reviewer needs the complete account history, the published rules and a party's copy to reconstruct and compare. Neither step decides whether delivery was legally sufficient or whether the evidence is true.

## Español

### Alcance

TEMIS se describe como un registro versionado para acuerdos bilaterales organizados por hitos. Las fuentes distinguen el recorrido previsto de la implementación limitada que se probó en testnet. El MVP cubrió las pruebas 0 a 8 con datos de fantasía; no presta un servicio jurídico en operación.

### Participantes y derechos

| Participante | Función prevista | Qué puede mostrar el registro | Límite |
| --- | --- | --- | --- |
| Parte A y Parte B | Firmar el acuerdo y las declaraciones de hitos, responder, aceptar o impugnar | Qué claves firmaron qué digests y en qué orden registrado | Una clave no prueba identidad civil ni consentimiento libre |
| Profesional jurídico | Preparar o revisar el acuerdo e identificarse en él | El profesional nombrado en el registro del acuerdo | TEMIS no reemplaza su trabajo |
| Operador TEMIS | Coordinar el registro, anclar digests y mantener los hechos de pago | La secuencia pública de escritura de la cuenta ancla | No es juez; una cuenta ancla única conlleva riesgos de confianza y custodia de claves |
| Verificador interno | Comparar un informe con un paquete documental | Coincidencia o diferencia técnica para los datos recibidos | No certifica verdad ni suficiencia jurídica |
| Proveedor técnico | Entregar un informe u otro servicio acotado y pagado | El informe y las referencias de pago incluidas en el registro | La calidad y los remedios contractuales quedan fuera del sistema |
| Facilitador x402 | Verificar la autorización y enviar una liquidación | El resultado de liquidación informado por el facilitador y el ledger | Liquidar no significa que el destinatario esté satisfecho |
| Tercero independiente | Reconstruir desde el historial público y comparar una copia | La secuencia recuperable del archivo completo y de la especificación | Requiere un archivo íntegro del historial y una copia para cotejar |

### Registro canónico: TEMIS-CF-1

El cuerpo del acuerdo queda fuera de la cadena, en copias de las partes y del operador. Las reglas de canonicalización permiten que implementaciones independientes calculen el mismo digest a partir del mismo documento: claves JSON ordenadas por sus bytes UTF-8, rechazo de claves duplicadas, texto normalizado a NFC, eliminación de escapes innecesarios, números de punto fijo con escala declarada y SHA-256. El digest tiene 32 bytes y cabe en `MEMO_HASH` de Stellar. El whitepaper indica que la forma canónica tiene vectores de prueba. El canonicalizador JSON genérico del kernel de Vespi no es la forma TEMIS-CF-1.

Cada versión tiene su propio digest. Una firma se aplica a un digest, no al nombre mutable de un documento. El cuerpo del acuerdo y sus anexos probatorios no se publican en transacciones de Stellar.

### Recorrido: dos partes y un hito

Ejemplo: la Parte A acuerda entregar un paquete de diseño a la Parte B antes de una fecha determinada, y el acuerdo exige un comprobante de entrega. Es un ejemplo ilustrativo del recorrido descrito, no un cliente real ni un acuerdo de testnet.

1. **Preparación.** Un profesional jurídico redacta el acuerdo y los requisitos del hito. TEMIS asigna un identificador opaco y una versión. Cada parte recibe una copia. Aquí se escriben fuera de la red el cuerpo, la evidencia exigida y el plazo; ningún dato de red demuestra que sean verdaderos.
2. **Firma de la versión.** Cada parte firma con ed25519 el digest TEMIS-CF-1. La segunda firma contrafirma el mismo digest de versión. El registro queda acordado solo cuando hay ambas firmas. La red recibe una transacción clásica de Stellar cuyo `MEMO_HASH` contiene el digest. Esto ancla el digest en el historial del ledger; no publica ni valida el cuerpo, no prueba identidad, no fecha el documento mediante un prestador acreditado ni determina su exigibilidad jurídica.
3. **Apertura del hito.** El registro escribe el identificador del hito, el digest o referencia de la evidencia exigida y el plazo. La línea puede firmarse y anclarse. Una entrada del ledger prueba que esa línea se escribió en la secuencia de una cuenta; no prueba que el plazo sea justo ni que el hito sea factible.
4. **Declaración de cumplimiento.** La Parte A envía una declaración de entrega y evidencia, firma el digest pertinente y ancla la línea. El estado resultante es `declared_by_one_party` («declarado por una parte» en el whitepaper). Prueba que se registró una declaración firmada, no que la entrega ocurriera.
5. **Respuesta.** La Parte B puede aceptar, impugnar o no responder. La aceptación y la impugnación quedan en líneas firmadas. El silencio se representa mediante el cierre registrado después, no con una transacción de la Parte B. Una impugnación registra el desacuerdo; no lo resuelve.
6. **Cierre.** Con la firma de ambas partes, el hito puede cerrarse como `fulfilled` («cumplido»). Si una parte no responde, el operador puede registrar `fulfilled_unconfirmed` («cumplido no confirmado»), un estado más débil y visiblemente distinto. Esta distinción conserva la asimetría en el registro; no reemplaza la respuesta ausente.
7. **Corrección.** La corrección es otra línea que identifica como anulada a la línea anterior. La línea original permanece en el historial. La nueva se evalúa según las reglas de cadena. La corrección cambia la vista activa reconstruida; no borra la escritura original.
8. **Registro de incumplimiento o controversia.** Un hito vencido puede registrarse como incumplido junto con la declaración y evidencia de respaldo. Las partes pueden abrir una controversia con quién la activó, el profesional designado y una declaración de conflicto. TEMIS registra el evento; no exige cumplimiento, acusa, juzga, cobra ni paga.
9. **Reconstrucción.** Un tercero consulta el archivo completo del historial de la cuenta ancla, identifica las transacciones y los memo hashes pertinentes, aplica las reglas publicadas de canonicalización y cadena, y compara las líneas y cuerpos reconstruidos con la copia de una parte. Debe informar las diferencias. Necesita el historial completo; una página del explorador no basta.

### Reglas de la cadena

- Una línea tiene un cuerpo canónico y digest, una referencia a una línea anterior cuando se exige, firmas, tipo de evento, identificadores del acuerdo y hito, versión y referencia de anclaje según el formato del registro.
- La clave de orden es la secuencia aceptada de la cuenta ancla, y se usa la posición en el ledger cuando está disponible para ordenar transacciones dentro de un mismo ledger. El orden histórico de escritura no prueba causalidad ni legitimidad.
- `first-write-wins` aplica a la clave (acuerdo, hito, versión): solo la primera línea aceptada abre estado; las siguientes permanecen en el historial, pero no lo reemplazan por ser posteriores.
- Una anulación es una línea nueva que apunta a la línea anulada. La línea original no se elimina del historial.
- Si se anula la línea ganadora, el espacio queda vacío. La cadena no promueve una copia duplicada perdedora.
- El recibo de la corrida integrada describe once estatus distintos ejercitados; son resultados de eventos y validaciones, no once conclusiones judiciales. Los resultados de hito en el ejemplo registrado fueron cumplido, cumplido no confirmado e impugnado.
- Una controversia no cambia el estado del hito. El plazo no se modela como evento automático del ledger; `fulfilled_unconfirmed` es un cierre que registra el operador cuando no hay respuesta.
- Una sola cuenta ancla entrega una secuencia total, pero su clave permite escribir anulaciones engañosas. Las firmas de las partes no impiden una anulación del operador con firma falsa. Para rotar la clave se necesita una línea firmada por la clave anterior y la nueva; si se pierde la anterior, la continuidad queda interrumpida y debe mostrarse.

### Pagos x402: recorrido, tabla, garantías y límites

x402 paga por una capacidad técnica, no por el acuerdo ni por derechos jurídicos. El esquema `exact` de Stellar descrito usa activos SEP-41; no admite activos clásicos de Stellar. El recorrido predeterminado documentado usa autorización patrocinada: el cliente firma una autorización con vencimiento por número de ledger y un facilitador aporta las tasas, reconstruye y envía la transacción. La firma de la transacción completa aparece como trabajo futuro en la implementación de referencia citada y no se probó aquí.

| Etapa o hecho durable | Significado | Qué respalda el diseño observado | Qué no garantiza |
| --- | --- | --- | --- |
| `/verify` | Comprobación de solo lectura de autorización y parámetros de pago | Una respuesta válida para la autorización enviada | No hubo liquidación; no acredita calidad ni entrega del servicio |
| Reserva de obligación | Reclamo durable y atómico, asociado a la obligación que se paga | En el diseño probado, dos procesos no pueden reservar a la vez la misma obligación | Depende de soporte de enlaces duros en el sistema de archivos (NTFS, ext4, APFS); no fuerza a disco la entrada del directorio |
| Ejecución o entrega | El proveedor realiza la capacidad | Se intenta el servicio una vez por obligación registrada y se puede pedir de nuevo con el mismo identificador | Una caída puede interrumpir la entrega; x402 no promete reembolso |
| `/settle` y consulta del ledger | El facilitador envía la transacción y consulta hasta `SUCCESS` o `FAILED` | El resultado de liquidación se registra como un hecho nuevo e inmutable | No se puede revertir un servicio ya entregado si luego falla la liquidación |
| Reintento o conciliación | Lee los hechos existentes y determina si se pagó la obligación | Un reintento posterior a una liquidación conocida devuelve el resultado guardado, sin otra llamada al facilitador | Una liquidación lenta posterior a una conciliación de «no pagado» puede dejar `conflict`; se detecta, no se evita, y requiere conciliación humana |
| Referencias del recibo | TEMIS guarda el hash de transacción y el índice de operación en el recibo del hito | Un tercero puede localizar y revisar la operación de pago pertinente | El memo del pago no puede etiquetarse con el ID del acuerdo; un evento por sí solo no prueba el tipo de operación |

El recibo de idempotencia en testnet informa una llamada al facilitador, un abono real y un reintento de entrega sin segundo cobro. Un reenvío directo del mismo payload a `/settle` fue rechazado por simulación. El escenario se ejecutó una vez con un facilitador y datos de fantasía. No valida el caso no probado en que la entrega ocurre y después falla la liquidación, todas las carreras posibles ni la confiabilidad en producción. La tabla durable cobra una vez la misma obligación registrada en el recorrido probado; los estados `incierto` o `conflict` son límites explícitos, no una promesa de recuperación automática.

### Qué puede verificar un tercero

Los datos públicos nombrados por las fuentes son: el historial completo de Stellar para la cuenta ancla; las transacciones del ledger y sus valores `MEMO_HASH`; las especificaciones publicadas de canonicalización y cadena; los digests del acuerdo y de las líneas; las firmas y claves públicas; y una copia fuera de la cadena para cotejar. El recibo integrado informa 22 de 22 estatus coincidentes con una reconstrucción independiente y resultados coincidentes para tres hitos en una corrida. También indica que una de las 22 firmas era de un tercero ajeno y no se contó como firma de una parte. Esa corrida no prueba identidad civil, disponibilidad del archivo completo, titularidad de la cuenta más allá de lo declarado en el acuerdo, verdad de la evidencia, efecto jurídico ni corrección para cualquier entrada.

### Fuentes y nombres de estatus

Esta guía sigue el whitepaper y los recibos de TEMIS suministrados en cuanto a resultados de hitos (`fulfilled`, `fulfilled_unconfirmed`, `challenged`, `unfulfilled`), comportamiento de la cadena, firmas, anclajes, x402 y reconstrucción. El whitepaper y los recibos no definen un catálogo público estable de exactamente diez estatus con nombre. Por eso no invento uno; los estados internos de validación se distinguen de los resultados de hitos anteriores.

### Ejemplo narrado: del acuerdo a la revisión

El escenario es ficticio e ilustra el recorrido especificado. No es una transcripción de una interfaz TEMIS en operación. Las etiquetas corresponden a los estados documentados; no se simulan campos ni salidas de comandos.

Dos partes acuerdan que la Parte A entregará un paquete de diseño y que la Parte B confirmará la recepción. Una persona abogada escribe el plazo y la evidencia exigida en el acuerdo. Ambas partes conservan el documento fuera de la cadena y firman el mismo digest TEMIS-CF-1. La red recibe solo el anclaje del digest.

```text
Registro ilustrativo · datos ficticios
Versión del acuerdo: firmada por la Parte A y la Parte B
Hito: entrega de paquete de diseño
Referencia de evidencia: comprobante de entrega
```

Después, la Parte A firma una declaración de entrega. Si la Parte B confirma, el cierre documentado es `fulfilled`. Si guarda silencio, ese silencio no se representa como una transacción de la Parte B; el operador puede registrar `fulfilled_unconfirmed`. Si la Parte B impugna la declaración, queda anotado el desacuerdo, pero no se resuelve. Una corrección agrega una línea que anula una anterior y deja la original en el historial.

```text
Ambas partes confirman: fulfilled
La Parte B no responde: fulfilled_unconfirmed
La Parte B impugna: challenged
```

Son ejemplos breves de los estados documentados, no salida cruda de una herramienta. El verificador técnico puede comparar digests y registros recibidos. Un tercero independiente necesita el historial completo de la cuenta, las reglas publicadas y una copia de una parte para reconstruir y comparar. Ninguno de esos pasos decide si la entrega fue jurídicamente suficiente o si la evidencia es verdadera.
