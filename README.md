[![TEMIS: verifiable agreements by milestones, anchored on Stellar](./assets/cover.png)](./assets/cover.png)

# TEMIS

<p align="center">
  <a href="#english"><img src="https://img.shields.io/badge/status-testnet_MVP-D7B698?style=for-the-badge&labelColor=07111A" alt="Status: testnet MVP"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-review--only-D7B698?style=for-the-badge&labelColor=07111A" alt="License: review only"></a>
  <a href="./docs/HOW_IT_WORKS.md"><img src="https://img.shields.io/badge/suite-153_tests-D7B698?style=for-the-badge&labelColor=07111A" alt="Suite: 153 tests"></a>
  <a href="./docs/EVIDENCE.md"><img src="https://img.shields.io/badge/testnet-every_hash_listed-E0C170?style=for-the-badge&labelColor=07111A" alt="Every testnet transaction is listed"></a>
  <a href="https://github.com/andresanemic/vespi"><img src="https://img.shields.io/badge/built_with-Vespi_%C2%B7_Lore_Plugin_%C2%B7_Stellar-E0C170?style=for-the-badge&labelColor=07111A" alt="Built with Vespi, Lore Plugin and Stellar"></a>
</p>

<p align="center">
  <b>TEMIS makes the commitments of a bilateral agreement checkable by a third party.</b><br><br>
  The parties sign and countersign each milestone, the digest of every record is anchored on Stellar, and someone who was not there can rebuild what happened.
</p>

<p align="center">
  <b>Do you build on Stellar, or are you judging Find Your Way or Meridian? This is for you.</b><br>
  TEMIS is the first real operation built with <a href="https://github.com/andresanemic/vespi">Vespi</a> and <a href="https://github.com/andresanemic/lore-plugin">Lore Plugin</a> working together: a testnet MVP with fictional data, with its evidence open for you to recheck.
</p>

<p align="center">
  This repository holds the documentation, the evidence and the token study. The code is not in it yet: it opens during the judging period, under a license that lets you read and clone it to evaluate it.
</p>

---

<details>
<summary><b>Read in English</b></summary>

<a id="english"></a>

**TEMIS keeps an agreement checkable after the signing, when the parties' records start to diverge.**

> **The unit is not the contract. The unit is the milestone, and what each party recorded about it.**

TEMIS is a validation layer for bilateral agreements organized by milestones. Signing a contract, or even notarizing it, does not make anyone comply with it, and when the parties disagree the cost of reconstructing what happened is what keeps most people from asking for legal support at all. TEMIS does not decide who is right. It makes the sequence of what was agreed and what each party recorded afterwards something anyone can inspect.

**Why.** The original concept, Not Ponzi, by Francisco Toro with Pablo Guzmán (2019 to 2020), imagined a lawyer who prepares the agreement without hourly billing, takes a small share if it is fulfilled and carries the cost of the defense if it is breached. The problem the whitepaper isolates is the stretch after the signing: requests, deliveries, notices and each party's own records drift apart, and reconstructing them later is expensive. TEMIS is built on that problem. The RUC-D framework behind its economy is by Francisco Toro and Andrés Peña.

**If you are judging Find Your Way or Meridian, start here.**

1. **What it is.** A versioned record of an agreement and its milestones, signed by both parties with ed25519, whose digests are anchored on Stellar so an independent reader can rebuild the sequence.
2. **Why it belongs on Stellar.** Every record line is anchored in a classic Stellar transaction with a `MEMO_HASH`, and the payments for technical services use x402. All of it ran on testnet and every transaction hash is listed in [`docs/EVIDENCE.md`](./docs/EVIDENCE.md).
3. **Check it yourself.** Open any hash in Horizon testnet, for example [the idempotent x402 payment](https://horizon-testnet.stellar.org/transactions/5495a053cfde91f2ac2dd4eece581fc628072416cf9007d6ca78ab3becf4273a), and compare its memo with the digest in the receipts. The steps are in [How to recheck a transaction](./docs/EVIDENCE.md#how-to-recheck-a-transaction).
4. **See that a third party rebuilt it.** An agent with no access to the code rebuilt the record from Horizon alone: 22 of 22 statuses matched, and it found a defect no test had seen, which was corrected.
5. **What we do not claim.** No mainnet, no legal value, no production readiness. It is listed under *What it does not do, and what is not verified*.

## In one minute

Two parties agree to something that happens in steps. Today each keeps its own version of what was requested, delivered and answered, and when something goes wrong those versions have to be compared by hand, with a lawyer's hours attached to every comparison.

TEMIS starts from the milestone. A legal professional prepares the agreement and its milestones, each party signs the same digest, and every later event (a delivery, an acceptance, a challenge, a correction) is a signed line in an append-only record. The digest of each line is anchored on Stellar, so nobody can quietly change what was recorded without the anchored history disagreeing.

A concrete case, the way the documentation walks through it: Party A agrees to deliver a design package to Party B by a date, and the agreement requires a delivery receipt as evidence. Both sign the version. Party A declares the delivery and signs it; Party B accepts, or challenges, or says nothing. The record shows which of those happened and in what order. If B stays silent, the operator closes it as `fulfilled_unconfirmed`, a visibly weaker status than `fulfilled`. The body of the agreement never goes on the network; only its digest does.

## Why TEMIS, and not a notarized PDF

A notarized contract proves a document existed. It does not keep the performance of that document legible. What takes time, and usually gets skipped, is the record around the milestones:

| You need | What TEMIS gives you | Where it lives |
|---|---|---|
| The same text for both parties | A canonical form, TEMIS-CF-1, so independent implementations compute the same SHA-256 from the same document | [`docs/HOW_IT_WORKS.md`](./docs/HOW_IT_WORKS.md) |
| Both parties committed to it | An ed25519 signature on the version digest and a countersignature on the same content | [`docs/HOW_IT_WORKS.md`](./docs/HOW_IT_WORKS.md) |
| One answer when two records collide | An append-only chain with `first-write-wins`: the first accepted line fixes the state, and corrections are new lines that annul the earlier one | [`docs/HOW_IT_WORKS.md`](./docs/HOW_IT_WORKS.md) |
| Proof that a record existed at that point of the history | An anchor of each digest in a Stellar transaction with `MEMO_HASH` | [`docs/EVIDENCE.md`](./docs/EVIDENCE.md) |
| Paying for technical services without paying twice | x402 payments per use, with a durable table of payment facts, so a retry returns the recorded result instead of charging again | [`docs/HOW_IT_WORKS.md`](./docs/HOW_IT_WORKS.md) |
| Someone outside to verify it | A third party that rebuilds the record from the public history, the published rules and a copy of the agreement | [`docs/EVIDENCE.md`](./docs/EVIDENCE.md) |

**What TEMIS is not.** It is not a judge, an arbitrator, an insurer or a DAO. It does not promise that a record has evidentiary value, it does not replace a lawyer or a notary, it does not guarantee that anyone performs, and it does not collect debts or pay for breaches. A signature supports the integrity of a record and control of a key, not civil identity or free consent.

**Where this is going.** TEMIS is one of the ten functional projects built on Vespi. The whitepaper and the studies discuss a marketplace of lawyers and guarantors on top of the record. It is a direction under study, not something built.

## How it works

```
  party A ──signs──┐                                   ┌── party B
                   ▼                                   ▼
           version digest (TEMIS-CF-1, SHA-256)  ◄─ countersignature
                   │
                   ▼
   append-only record: declare · accept · challenge · correct · close
                   │             first-write-wins, corrections annul
                   ▼
   digest of each line ──► Stellar transaction with MEMO_HASH
                   │
                   ▼
   a third party rebuilds the sequence from the public history
   and compares it with a party's copy
```

| Who | Role | What the record can show | Boundary |
|---|---|---|---|
| Party A and Party B | Sign, declare, accept or challenge | Which keys signed which digests, and in what order | A key is not a civil identity |
| Legal professional | Prepares or reviews the agreement | The professional named in it | TEMIS does not replace their work |
| TEMIS operator | Records and anchors; keeps the payment facts | The anchor account's public write sequence | Not a judge; a single anchor account is a trust and key risk |
| Technical verifier | Compares a report with a document package | A match or mismatch for the inputs supplied | Does not certify truth |
| Independent reviewer | Rebuilds from the public history | The sequence the archive allows | Needs the complete history and a copy to compare |

The step by step, the chain rules, the payment table and its limits, and what a third party needs in order to verify, are in [`docs/HOW_IT_WORKS.md`](./docs/HOW_IT_WORKS.md).

## Evidence you can open

The MVP ran tests 0 to 8 with fictional data on Stellar testnet. The corrected run of the whole lifecycle has 23 transactions, 22 of them carrying a `MEMO_HASH`.

- **A third party rebuilt it.** An agent with no access to the code reconstructed the record from Horizon alone: 22 of 22 statuses matched and the three milestone outcomes matched. It also found a defect in how a copy is compared with the history, with missing and altered bodies, and it was corrected.
- **The payment table was reviewed and it held up.** A later review found race, retry and recovery defects. The final design records immutable facts and surfaces what is unresolved, instead of claiming it cannot happen.
- **Other probes.** Payment to a muxed address, the operation type, one idempotent payment and competing anchors, all on testnet.
- **A suite of 153 tests**, reported by the project receipts.

Every transaction hash, grouped by what it demonstrates, with its Horizon link, is in [`docs/EVIDENCE.md`](./docs/EVIDENCE.md). These are bounded test results, not production or legal validation.

## The economy and the $TEMIS token

$TEMIS exists as a testnet mechanics experiment. The tokenomics study, done with the RUC-D framework, concluded that no measured economic problem justifies a token today, so the token was issued without value, price, liquidity or sale. Under RUC-D the token comes last, after the institutions, resources, rights, rules, verification and architecture it would serve.

| Bucket | Share | Note |
|---|---|---|
| Treasury | 25% | |
| Ecosystem | 35% | |
| Liquidity reserve | 10% | Reserved. There is no pool and no offer |
| Advisers | 10% | |
| Contingency | 5% | |
| Founders | 15% | Split 50/50 between Andrés Peña and Francisco Toro in the test configuration; 12-month cliff, then 36 monthly claimable balances |

The asset is classic, with a fixed supply of 100,000,000, a locked issuer and no authorization or clawback flags. Francisco's account is a test slot: his real tranches exist only on mainnet, and only if he accepts them in writing. Nothing is issued on mainnet or sold without a lawyer's review. The design, the four candidate designs, the financing study and what past projects teach are in [`docs/TOKEN.md`](./docs/TOKEN.md).

## TEMIS, Vespi and Lore Plugin

[Lore Plugin](https://github.com/andresanemic/lore-plugin) prepares the ground: the criterion of the project, the routing that opens the right one for each task, and the coordinator's method. [Vespi](https://github.com/andresanemic/vespi) operates on it: operations under an authority a person grants, verification apart from execution, and receipts. TEMIS was the first real operation the whole system ran, and an independent advisor model reviewed its design before it was fixed.

## What it does not do, and what is not verified

TEMIS does not determine truth, legal responsibility, consent, identity or admissibility. A Stellar anchor is not a legal timestamp. Testnet results do not show mainnet operation, production readiness, customer demand, several facilitators or real-world outcomes, and the third-party reconstruction applies to one recorded run and its published inputs. The token experiment does not establish a market, a price, liquidity, investment value or a legal classification. The Chilean legal material in the whitepaper has not been reviewed by a competent legal professional; see [`docs/LEGAL_AND_LIMITS.md`](./docs/LEGAL_AND_LIMITS.md).

## How to review this project

Today this repository holds documentation, testnet evidence, token records and a review-only [LICENSE](./LICENSE). It does not hold source code: [`CODE_NOT_INCLUDED.md`](./CODE_NOT_INCLUDED.md) says why and when. The code opens during the judging period so the jury and the community can read and clone it to evaluate it, not to modify it. The license is proprietary, it is not approved by the OSI, and it is a working draft that a lawyer must review. More repositories for Vespi's functional projects will follow, without code at first, each explaining the why, the how and the what.

## Author

**Andrés Peña Mellado**, Digital Art Director & Creative Developer working across AI agents, Web3, design and research. Repository authority: `andresanemic`.

[<img src="./assets/icons/v2/telegram.svg" width="28" alt="Telegram">](https://t.me/andresanemic) &nbsp;&nbsp; [<picture><source media="(prefers-color-scheme: dark)" srcset="./assets/icons/v2/x-dark.svg"><img src="./assets/icons/v2/x.svg" width="28" alt="X"></picture>](https://x.com/andresanemic) &nbsp;&nbsp; [<img src="./assets/icons/v2/linkedin.svg" width="28" alt="LinkedIn">](https://www.linkedin.com/in/andresanemic/)

---

[How it works](./docs/HOW_IT_WORKS.md) · [Evidence](./docs/EVIDENCE.md) · [Token](./docs/TOKEN.md) · [Legal and limits](./docs/LEGAL_AND_LIMITS.md) · [Code not included](./CODE_NOT_INCLUDED.md) · [Review-only license](./LICENSE) · [Vespi](https://github.com/andresanemic/vespi) · [Lore Plugin](https://github.com/andresanemic/lore-plugin)

</details>

<details>
<summary><b>Leer en español</b></summary>

<a id="espanol"></a>

**TEMIS mantiene verificable un acuerdo después de la firma, cuando los registros de las partes empiezan a divergir.**

> **La unidad no es el contrato. La unidad es el hito, y lo que cada parte registró sobre él.**

TEMIS es una capa de validación para acuerdos bilaterales organizados por hitos. Firmar un contrato, o incluso notarizarlo, no hace que nadie lo cumpla, y cuando las partes discrepan el costo de reconstruir lo ocurrido es lo que aleja a la mayoría de pedir apoyo jurídico. TEMIS no decide quién tiene razón. Hace que la secuencia de lo acordado y de lo que cada parte registró después sea algo que cualquiera puede inspeccionar.

**Por qué.** El concepto original, Not Ponzi, de Francisco Toro con Pablo Guzmán (2019 a 2020), imaginaba a un abogado que prepara el acuerdo sin cobrar por hora, recibe un porcentaje pequeño si se cumple y asume el costo de la defensa si se incumple. El problema que aísla el whitepaper es el tramo posterior a la firma: las solicitudes, entregas, avisos y registros de cada parte se separan, y reconstruirlos después sale caro. TEMIS se construye sobre ese problema. El marco RUC-D detrás de su economía es de Francisco Toro y Andrés Peña.

**Si estás evaluando Find Your Way o Meridian, empieza aquí.**

1. **Qué es.** Un registro versionado de un acuerdo y sus hitos, firmado por ambas partes con ed25519, cuyos digests se anclan en Stellar para que un lector independiente pueda reconstruir la secuencia.
2. **Por qué pertenece a Stellar.** Cada línea del registro se ancla en una transacción clásica de Stellar con un `MEMO_HASH`, y los pagos de los servicios técnicos usan x402. Todo corrió en testnet y cada hash de transacción está listado en [`docs/EVIDENCE.md`](./docs/EVIDENCE.md).
3. **Compruébalo tú.** Abre cualquier hash en Horizon testnet, por ejemplo [el pago x402 idempotente](https://horizon-testnet.stellar.org/transactions/5495a053cfde91f2ac2dd4eece581fc628072416cf9007d6ca78ab3becf4273a), y compara su memo con el digest de los recibos. Los pasos están en [Cómo volver a comprobar una transacción](./docs/EVIDENCE.md#cómo-volver-a-comprobar-una-transacción).
4. **Mira que un tercero lo reconstruyó.** Un agente sin acceso al código reconstruyó el registro solo desde Horizon: coincidieron 22 de 22 estatus y encontró un defecto que ninguna prueba había visto, que se corrigió.
5. **Qué no afirmamos.** Ni mainnet, ni valor legal, ni preparación para producción. Está en *Lo que todavía no hace, y lo que no está verificado*.

## En un minuto

Dos partes acuerdan algo que ocurre por etapas. Hoy cada una guarda su propia versión de lo que se pidió, se entregó y se respondió, y cuando algo sale mal esas versiones hay que compararlas a mano, con horas de abogado en cada comparación.

TEMIS parte del hito. Un profesional jurídico prepara el acuerdo y sus hitos, cada parte firma el mismo digest, y cada evento posterior (una entrega, una aceptación, una impugnación, una corrección) es una línea firmada en un registro de solo anexado. El digest de cada línea se ancla en Stellar, de modo que nadie puede cambiar en silencio lo registrado sin que el historial anclado lo contradiga.

Un caso concreto, como lo recorre la documentación: la parte A acuerda entregar un paquete de diseño a la parte B en una fecha, y el acuerdo exige un comprobante de entrega como evidencia. Ambas firman la versión. A declara la entrega y la firma; B la acepta, la impugna o no responde. El registro muestra cuál de esas cosas ocurrió y en qué orden. Si B calla, el operador lo cierra como `fulfilled_unconfirmed`, un estatus visiblemente más débil que `fulfilled`. El cuerpo del acuerdo nunca va a la red; solo su digest.

## Por qué TEMIS, y no un PDF notarizado

Un contrato notarizado prueba que un documento existió. No mantiene legible el cumplimiento de ese documento. Lo que toma tiempo, y suele omitirse, es el registro alrededor de los hitos:

| Necesitas | Qué te da TEMIS | Dónde vive |
|---|---|---|
| El mismo texto para ambas partes | Una forma canónica, TEMIS-CF-1, para que implementaciones independientes calculen el mismo SHA-256 del mismo documento | [`docs/HOW_IT_WORKS.md`](./docs/HOW_IT_WORKS.md) |
| Que ambas partes se comprometan | Una firma ed25519 sobre el digest de la versión y una contrafirma sobre el mismo contenido | [`docs/HOW_IT_WORKS.md`](./docs/HOW_IT_WORKS.md) |
| Una sola respuesta cuando dos registros chocan | Una cadena de solo anexado con `first-write-wins`: la primera línea aceptada fija el estado y las correcciones son líneas nuevas que anulan la anterior | [`docs/HOW_IT_WORKS.md`](./docs/HOW_IT_WORKS.md) |
| Prueba de que un registro existía en ese punto del historial | Un anclaje de cada digest en una transacción de Stellar con `MEMO_HASH` | [`docs/EVIDENCE.md`](./docs/EVIDENCE.md) |
| Pagar servicios técnicos sin pagar dos veces | Pagos x402 por uso, con una tabla durable de hechos de pago, para que un reintento devuelva el resultado registrado en vez de cobrar de nuevo | [`docs/HOW_IT_WORKS.md`](./docs/HOW_IT_WORKS.md) |
| Que alguien externo lo verifique | Un tercero que reconstruye el registro desde el historial público, las reglas publicadas y una copia del acuerdo | [`docs/EVIDENCE.md`](./docs/EVIDENCE.md) |

**Qué no es TEMIS.** No es un juez, un árbitro, una aseguradora ni una DAO. No promete que un registro tenga valor probatorio, no reemplaza a un abogado ni a un notario, no garantiza que alguien cumpla, y no cobra deudas ni paga por incumplimientos. Una firma respalda la integridad de un registro y el control de una clave, no la identidad civil ni el consentimiento libre.

**Hacia dónde va.** TEMIS es uno de los diez proyectos funcionales construidos sobre Vespi. El whitepaper y los estudios discuten un marketplace de abogados y garantes sobre el registro. Es una dirección en estudio, no algo construido.

## Cómo funciona

```
  parte A ──firma──┐                                  ┌── parte B
                   ▼                                  ▼
           digest de la versión (TEMIS-CF-1, SHA-256) ◄─ contrafirma
                   │
                   ▼
   registro de solo anexado: declarar · aceptar · impugnar · corregir · cerrar
                   │         first-write-wins, las correcciones anulan
                   ▼
   digest de cada línea ──► transacción de Stellar con MEMO_HASH
                   │
                   ▼
   un tercero reconstruye la secuencia desde el historial público
   y la compara con la copia de una parte
```

| Quién | Rol | Qué puede mostrar el registro | Límite |
|---|---|---|---|
| Parte A y parte B | Firman, declaran, aceptan o impugnan | Qué claves firmaron qué digests, y en qué orden | Una clave no es una identidad civil |
| Profesional jurídico | Prepara o revisa el acuerdo | El profesional nombrado en él | TEMIS no reemplaza su trabajo |
| Operador de TEMIS | Registra y ancla; mantiene los hechos de pago | La secuencia pública de escrituras de la cuenta de anclaje | No es un juez; una sola cuenta de anclaje es un riesgo de confianza y de custodia de la clave |
| Verificador técnico | Compara un informe con un paquete de documentos | Coincidencia o diferencia sobre lo recibido | No certifica la verdad |
| Revisor independiente | Reconstruye desde el historial público | La secuencia que permite el archivo | Necesita el historial completo y una copia para comparar |

El paso a paso, las reglas de la cadena, la tabla de pagos y sus límites, y lo que necesita un tercero para verificar, están en [`docs/HOW_IT_WORKS.md`](./docs/HOW_IT_WORKS.md).

## Evidencia que puedes abrir

El MVP corrió las pruebas 0 a 8 con datos de fantasía en Stellar testnet. La corrida corregida de todo el ciclo tiene 23 transacciones, 22 de ellas con un `MEMO_HASH`.

- **Un tercero lo reconstruyó.** Un agente sin acceso al código reconstruyó el registro solo desde Horizon: coincidieron 22 de 22 estatus y los tres resultados de hito. También encontró un defecto en cómo se compara una copia con el historial, con cuerpos ausentes y alterados, y se corrigió.
- **La tabla de pagos se revisó y aguantó.** Una revisión posterior encontró defectos de concurrencia, reintento y recuperación. El diseño final registra hechos inmutables y expone lo que queda sin resolver, en vez de afirmar que no puede ocurrir.
- **Otras pruebas.** Pago a una dirección multiplexada, el tipo de operación, un pago idempotente y anclajes en competencia, todo en testnet.
- **Una suite de 153 pruebas**, reportada por los recibos del proyecto.

Cada hash de transacción, agrupado por lo que demuestra, con su enlace a Horizon, está en [`docs/EVIDENCE.md`](./docs/EVIDENCE.md). Son resultados acotados, no validación legal ni preparación para producción.

## La economía y el token $TEMIS

$TEMIS existe como un experimento de mecánica en testnet. El estudio de tokenomics, hecho con el marco RUC-D, concluyó que hoy ningún problema económico medido justifica un token, así que el token se emitió sin valor, precio, liquidez ni venta. En RUC-D el token va al final, después de las instituciones, recursos, derechos, reglas, verificación y arquitectura a las que serviría.

| Cubeta | Parte | Nota |
|---|---|---|
| Tesorería | 25% | |
| Ecosistema | 35% | |
| Reserva de liquidez | 10% | Reservada. No hay pool ni ofertas |
| Asesores | 10% | |
| Contingencia | 5% | |
| Fundadores | 15% | Divididos 50/50 entre Andrés Peña y Francisco Toro en la configuración de prueba; cliff de 12 meses y luego 36 balances reclamables mensuales |

El activo es clásico, con una oferta fija de 100.000.000, una emisora bloqueada y sin banderas de autorización ni clawback. La cuenta de Francisco es una ranura de prueba: sus tramos reales solo existen en mainnet, y solo si él los acepta por escrito. Nada se emite en mainnet ni se vende sin la revisión de un abogado. El diseño, los cuatro diseños candidatos, el estudio de financiamiento y lo que enseñan proyectos anteriores están en [`docs/TOKEN.md`](./docs/TOKEN.md).

## TEMIS, Vespi y Lore Plugin

[Lore Plugin](https://github.com/andresanemic/lore-plugin) prepara el terreno: el criterio del proyecto, el enrutamiento que abre el criterio correcto para cada tarea y el método del coordinador. [Vespi](https://github.com/andresanemic/vespi) opera sobre él: operaciones bajo una autoridad que concede una persona, verificación aparte de la ejecución y recibos. TEMIS fue la primera operación real que corrió todo el sistema, y un modelo asesor independiente revisó su diseño antes de fijarlo.

## Lo que todavía no hace, y lo que no está verificado

TEMIS no determina la verdad, la responsabilidad legal, el consentimiento, la identidad ni la admisibilidad. Un anclaje en Stellar no es un fechado legal. Los resultados en testnet no muestran operación en mainnet, preparación para producción, demanda de clientes, varios facilitadores ni resultados en el mundo real, y la reconstrucción de un tercero corresponde a una corrida y a sus datos publicados. El experimento del token no establece un mercado, un precio, liquidez, valor de inversión ni una clasificación jurídica. El material jurídico chileno del whitepaper no ha sido revisado por una persona competente en derecho; consulta [`docs/LEGAL_AND_LIMITS.md`](./docs/LEGAL_AND_LIMITS.md).

## Cómo revisar este proyecto

Hoy este repositorio contiene documentación, evidencia de testnet, registros del token y una [LICENSE](./LICENSE) de solo revisión. No contiene código fuente: [`CODE_NOT_INCLUDED.md`](./CODE_NOT_INCLUDED.md) explica por qué y cuándo. El código se abre durante el periodo de los jueces para que el jurado y la comunidad lo lean y lo clonen para evaluarlo, no para modificarlo. La licencia es propietaria, no está aprobada por la OSI y es un borrador de trabajo que debe revisar una persona abogada. Vendrán más repositorios de los proyectos funcionales de Vespi, sin código al principio, cada uno explicando el porqué, el cómo y el qué.

## Autor

**Andrés Peña Mellado**, Digital Art Director & Creative Developer que trabaja entre agentes de IA, Web3, diseño e investigación. Autoridad del repositorio: `andresanemic`.

[<img src="./assets/icons/v2/telegram.svg" width="28" alt="Telegram">](https://t.me/andresanemic) &nbsp;&nbsp; [<picture><source media="(prefers-color-scheme: dark)" srcset="./assets/icons/v2/x-dark.svg"><img src="./assets/icons/v2/x.svg" width="28" alt="X"></picture>](https://x.com/andresanemic) &nbsp;&nbsp; [<img src="./assets/icons/v2/linkedin.svg" width="28" alt="LinkedIn">](https://www.linkedin.com/in/andresanemic/)

---

[Cómo funciona](./docs/HOW_IT_WORKS.md) · [Evidencia](./docs/EVIDENCE.md) · [Token](./docs/TOKEN.md) · [Marco legal y límites](./docs/LEGAL_AND_LIMITS.md) · [Código no incluido](./CODE_NOT_INCLUDED.md) · [Licencia de solo revisión](./LICENSE) · [Vespi](https://github.com/andresanemic/vespi) · [Lore Plugin](https://github.com/andresanemic/lore-plugin)

</details>
