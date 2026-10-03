<p align="center"><img src="assets/cover.png" alt="TEMIS: Verifiable agreements by milestones, anchored on Stellar" width="100%"></p>

<h1 align="center">TEMIS</h1>

<p align="center"><img alt="Status: testnet MVP" src="https://img.shields.io/badge/status-testnet%20MVP-2F7F79"><img alt="License: review only" src="https://img.shields.io/badge/license-review--only-B8975A"><img alt="Suite: 153 tests" src="https://img.shields.io/badge/suite-153%20tests-0B1F3A"><img alt="Stellar" src="https://img.shields.io/badge/network-Stellar-7D00FF"></p>

TEMIS is a testnet MVP for recording bilateral milestone agreements: the parties sign and countersign canonical agreement and milestone records, while their hashes are anchored on Stellar so an independent reviewer can reconstruct the recorded sequence. The idea originated with Francisco Toro in 2019 to 2020 with Pablo Guzmán; RUC-D is by Francisco Toro and Andrés Peña.

<details>
<summary>Read in English</summary>

### Why

<details><summary>The problem and the change TEMIS explores</summary>

The original Not Ponzi concept describes a lawyer who prepares the agreement without hourly billing, receives a small share if it is fulfilled, and assumes defense costs if it is breached. The whitepaper locates the record-keeping problem in the gap after signing: requests, deliveries, notices, and each party's records can diverge, making later reconstruction costly. TEMIS explores a structured record of what the parties agreed to do at each milestone and what each party recorded afterward. It can make reconstruction easier to inspect; it does not decide who is right.
</details>

### What it is

<details><summary>Scope and boundaries</summary>

TEMIS is a validation and evidence-recording layer for bilateral agreements organized by milestones. It is not a judge, arbitrator, insurer, or DAO. It does not promise that a record has legal evidentiary value. It does not replace a lawyer or notary, guarantee performance, enforce an obligation, collect a debt, or pay for a breach. The current work is an MVP exercised with fictional data on Stellar testnet; a TEMIS service, client, pilot, and mainnet deployment are not present in the sources.
</details>

### How it works

<details><summary>Agreement, records, signatures, chain, Stellar, and payments</summary>

1. A legal professional prepares a versioned agreement with two parties, milestones, required evidence, and deadlines. Each party keeps its copy and can sign, declare, accept, challenge, or correct its own record as the rules allow. The professional drafts or reviews; the operator records and anchors but does not adjudicate; a technical verifier checks a report against supplied material; an independent third party can reconstruct from public history. The body is kept off-chain in party copies; TEMIS computes a digest over the canonical TEMIS-CF-1 form: UTF-8 byte ordering for keys, no duplicate keys, NFC text, no unnecessary escapes, declared fixed-point number scale, and SHA-256.
2. Each party signs the version digest and relevant milestone lines with ed25519. The second signature countersigns the same content. A signature supports technical integrity and control of a key; it does not establish civil identity, free consent, or an advanced electronic signature under Chilean law.
3. Each event is a line in an append-only record. For a given agreement, milestone, and version, `first-write-wins`: the first accepted line is the one that determines state. Corrections are new lines that identify the earlier line as annulled. If the winning line is later annulled, the state is empty; a losing duplicate does not become active.
4. The digest of each line is anchored in a classic Stellar transaction using `MEMO_HASH`. The agreement body and evidence are not put on-chain. A memo hash shows that a digest was included in a ledger transaction, not what the underlying document says or whether its claims are true.
5. Technical services may be paid per use through x402. `/verify` checks a payment authorization; `/settle` submits and checks settlement. TEMIS keeps a durable, append-only payment facts table keyed to the payment obligation so a retry can return the recorded result instead of charging again. The tested idempotency scenario showed one facilitator call and one real testnet credit; edge cases can still be marked `uncertain` or `conflict` and require reconciliation.
6. A third party can rebuild the record from the complete public account history, published specification, agreement copy, and relevant digests, then compare it with a party's copy. This needs a complete history archive; Horizon's explorer alone is not the stated reconstruction source.

For the full walkthrough, payment limits, state rules, and public reconstruction inputs, see [How it works](docs/HOW_IT_WORKS.md).
</details>

### Evidence

<details><summary>What was exercised and what was found</summary>

The source receipts describe the MVP tests 0 to 8 with fictional data on Stellar testnet. A third-party reconstruction matched 22 of 22 recorded statuses and the three milestone outcomes in one run. It also exposed a copy-comparison defect involving missing and altered bodies, which was corrected. A later payment-table review found race, retry, and recovery defects; the final design records immutable facts and surfaces unresolved cases instead of claiming they cannot happen. Testnet work also exercised payment-to address and operation-type probes, an idempotent payment, and competing anchors. The 153-test suite is reported by the project receipts. These are bounded test results, not production or legal validation.

Transaction hashes, Horizon links, receipt summaries, and reproduction notes are in [Evidence](docs/EVIDENCE.md).
</details>

### The economy and the $TEMIS token

<details><summary>Testnet experiment and limits</summary>

$TEMIS was issued as a testnet mechanics experiment after the tokenomics study concluded that no measured economic problem currently justified a token. The manifest records a fixed supply of 100,000,000 TEMIS, a locked issuer, no authorization or clawback flags, and allocations to treasury (25%), ecosystem (35%), liquidity reserve (10%), advisers (10%), contingency (5%), and founders (15%, split 50/50 between Andrés Peña and Francisco Toro in the test configuration). Founder vesting is represented by a 12-month cliff followed by 36 monthly claimable balances. Francisco's account is a test slot: his real tranches exist only on mainnet if he accepts them in writing. There is no price, sale, pool, liquidity, or promise of value or return. Under RUC-D, tokenomics comes last, after institutional relations, resources, rights, rules, verification, and architecture. The studies discuss a possible lawyer marketplace and separately examine guarantees; no lawyer or guarantor marketplace is built. See [Token](docs/TOKEN.md).
</details>

### What we do not claim

<details><summary>Claims outside the evidence</summary>

TEMIS does not determine truth, legal responsibility, consent, identity, or evidentiary admissibility. A Stellar anchor is not a legal timestamp. Testnet results do not demonstrate mainnet operation, production readiness, customer demand, multiple facilitators, or real-world outcomes. A third-party reconstruction result applies to one recorded run and its published inputs. The token experiment does not establish a market, utility in production, price, liquidity, investment value, or a legal classification. Chilean legal material in the whitepaper has not been reviewed by a competent legal professional.
</details>

### How to review this project

<details><summary>Repository contents and project relationships</summary>

This repository currently contains documentation, testnet evidence, token records, and a review-only [LICENSE](LICENSE); it does not contain source code. Repository authority is Andrés Peña (`andresanemic`). More repositories for Vespi's functional projects are expected. TEMIS source code will open during the judges' review period under the review-only license so judges and the community can evaluate it. This license is proprietary and is not OSI-approved. TEMIS is the first real operation built with [Vespi](https://github.com/andresanemic/vespi) and [Lore Plugin](https://github.com/andresanemic/lore-plugin). See [Code not included](CODE_NOT_INCLUDED.md), [How it works](docs/HOW_IT_WORKS.md), [Evidence](docs/EVIDENCE.md), [Token](docs/TOKEN.md), and [Legal and limits](docs/LEGAL_AND_LIMITS.md).
</details>

</details>

<details>
<summary>Leer en español</summary>

### Por qué

<details><summary>El problema y el cambio que explora TEMIS</summary>

El concepto original Not Ponzi describe a un abogado que prepara el acuerdo sin cobrar por hora, recibe un porcentaje pequeño si se cumple y asume el costo de la defensa si se incumple. El whitepaper ubica el problema de registro en el tramo posterior a la firma: las solicitudes, entregas, avisos y registros de cada parte pueden divergir y hacer costosa la reconstrucción posterior. TEMIS explora un registro estructurado de lo que las partes acordaron hacer en cada hito y de lo que cada una registró después. Puede facilitar la inspección de lo ocurrido; no decide quién tiene razón.
</details>

### Qué es

<details><summary>Alcance y límites</summary>

TEMIS es una capa de validación y registro de evidencia para acuerdos bilaterales organizados por hitos. La idea original fue de Francisco Toro entre 2019 y 2020, junto con Pablo Guzmán; RUC-D es de Francisco Toro y Andrés Peña. TEMIS no es un juez, árbitro, aseguradora ni DAO. No promete que un registro tenga valor probatorio. No reemplaza a un abogado ni a un notario, no garantiza el cumplimiento, no exige una obligación, no cobra deudas ni paga por incumplimientos. El trabajo actual es un MVP probado con datos de fantasía en Stellar testnet; las fuentes no registran un servicio TEMIS, cliente, piloto ni despliegue en mainnet.
</details>

### Cómo funciona

<details><summary>Acuerdo, registros, firmas, cadena, Stellar y pagos</summary>

1. Un profesional jurídico prepara una versión del acuerdo con dos partes, hitos, evidencia exigida y plazos. Cada parte conserva su copia y puede firmar, declarar, aceptar, impugnar o corregir su propio registro según las reglas. El profesional redacta o revisa; el operador registra y ancla, pero no juzga; un verificador técnico compara un informe con el material recibido; un tercero independiente puede reconstruir desde el historial público. El cuerpo queda fuera de la cadena, en copias de las partes; TEMIS calcula un digest sobre la forma canónica TEMIS-CF-1: claves ordenadas por bytes UTF-8, sin claves duplicadas, texto NFC, sin escapes innecesarios, escala declarada para números de punto fijo y SHA-256.
2. Cada parte firma con ed25519 el digest de la versión y las líneas de los hitos pertinentes. La segunda firma contrafirma el mismo contenido. La firma respalda integridad técnica y control de una clave; no prueba identidad civil, consentimiento libre ni una firma electrónica avanzada conforme a la ley chilena.
3. Cada evento es una línea en un registro de solo anexado. Para cada acuerdo, hito y versión, `first-write-wins`: la primera línea aceptada determina el estado. Las correcciones son líneas nuevas que identifican la anterior como anulada. Si después se anula la línea ganadora, el estado queda vacío; una línea duplicada perdedora no se activa.
4. El digest de cada línea se ancla en una transacción clásica de Stellar con `MEMO_HASH`. El cuerpo del acuerdo y la evidencia no se publican en la cadena. Un memo hash muestra que un digest se incluyó en una transacción del ledger, no qué dice el documento ni si sus afirmaciones son ciertas.
5. Los servicios técnicos pueden pagarse por uso mediante x402. `/verify` comprueba una autorización de pago; `/settle` envía la liquidación y consulta su resultado. TEMIS mantiene una tabla durable de hechos de pago, de solo creación, asociada a la obligación para que un reintento pueda devolver el resultado registrado sin volver a cobrar. La prueba de idempotencia mostró una llamada al facilitador y un abono real en testnet; algunos casos límite aún pueden quedar `incierto` o `conflicto` y necesitan conciliación.
6. Un tercero puede reconstruir el registro con el historial público completo de la cuenta, la especificación publicada, una copia del acuerdo y los digests pertinentes, y compararlo con la copia de una parte. Esto requiere un archivo completo del historial; el explorador Horizon por sí solo no es la fuente de reconstrucción indicada.

Consulta [Cómo funciona](docs/HOW_IT_WORKS.md) para ver el recorrido completo, los límites de los pagos, las reglas de estado y los datos públicos de reconstrucción.
</details>

### Evidencia

<details><summary>Qué se probó y qué se encontró</summary>

Los recibos describen las pruebas 0 a 8 del MVP con datos de fantasía en Stellar testnet. Una reconstrucción de un tercero coincidió en 22 de 22 estatus registrados y en los tres resultados de hito de una corrida. También encontró un defecto en la comparación entre copia e historial por cuerpos ausentes o alterados, que se corrigió. Una revisión posterior de la tabla de pagos encontró defectos de concurrencia, reintento y recuperación; el diseño final registra hechos inmutables y expone casos pendientes de resolución, sin afirmar que sean imposibles. En testnet también se probaron la dirección de pago multiplexada, el tipo de operación, un pago idempotente y anclajes en competencia. Los recibos del proyecto reportan una suite de 153 pruebas. Son resultados acotados, no validación legal ni preparación para producción.

Los hashes, enlaces a Horizon, resúmenes de recibos y notas para recomprobar están en [Evidencia](docs/EVIDENCE.md).
</details>

### La economía y el token $TEMIS

<details><summary>Experimento en testnet y límites</summary>

$TEMIS se emitió como experimento de mecánica en testnet después de que el estudio de tokenomics concluyera que no hay un problema económico medido que justifique hoy un token. El manifiesto registra una oferta fija de 100.000.000 TEMIS, una emisora bloqueada, sin banderas de autorización ni clawback, y asignaciones a tesorería (25%), ecosistema (35%), reserva de liquidez (10%), asesores (10%), contingencia (5%) y fundadores (15%, divididos 50/50 entre Andrés Peña y Francisco Toro en la configuración de prueba). El vesting de fundadores usa un cliff de 12 meses seguido de 36 balances reclamables mensuales. La cuenta de Francisco es una ranura de prueba: sus tramos reales solo existen en mainnet si él los acepta por escrito. No hay precio, venta, pool, liquidez ni promesa de valor o rendimiento. En RUC-D, la tokenomics va al final, después de las relaciones institucionales, recursos, derechos, reglas, verificación y arquitectura. Los estudios analizan un marketplace posible de abogados y, por separado, conceptos de garantía; no hay un marketplace de abogados o garantes construido. Consulta [Token](docs/TOKEN.md).
</details>

### Lo que no afirmamos

<details><summary>Afirmaciones que la evidencia no respalda</summary>

TEMIS no determina la verdad, responsabilidad legal, consentimiento, identidad ni admisibilidad probatoria. Un anclaje en Stellar no es un fechado legal. Los resultados en testnet no demuestran operación en mainnet, preparación para producción, demanda de clientes, múltiples facilitadores ni resultados en el mundo real. La reconstrucción de un tercero corresponde a una corrida y a sus datos publicados. El experimento del token no establece mercado, utilidad en producción, precio, liquidez, valor de inversión ni clasificación jurídica. El material jurídico chileno del whitepaper no ha sido revisado por una persona competente en derecho.
</details>

### Cómo revisar este proyecto

<details><summary>Contenido del repositorio y relación entre proyectos</summary>

Este repositorio contiene actualmente documentación, evidencia de testnet y registros del token, además de una [LICENSE](LICENSE) de solo revisión; no contiene código fuente. La autoridad del repositorio es Andrés Peña (`andresanemic`). Se esperan más repositorios de proyectos funcionales de Vespi. El código fuente de TEMIS se abrirá durante el periodo de revisión de los jueces bajo la licencia de solo revisión para que el jurado y la comunidad lo evalúen. Esta licencia es propietaria y no está aprobada por OSI. TEMIS es la primera operación real construida con [Vespi](https://github.com/andresanemic/vespi) y [Lore Plugin](https://github.com/andresanemic/lore-plugin). Consulta [Código no incluido](CODE_NOT_INCLUDED.md), [Cómo funciona](docs/HOW_IT_WORKS.md), [Evidencia](docs/EVIDENCE.md), [Token](docs/TOKEN.md) y [Marco legal y límites](docs/LEGAL_AND_LIMITS.md).
</details>

</details>
