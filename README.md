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
  Review the documentation, evidence and token study here; <a href="./CODE_NOT_INCLUDED.md">code availability and review terms</a> are explained separately.
</p>

---

<details>
<summary><b>Read in English</b></summary>

<a id="english"></a>

**Why.** The original concept, Not Ponzi, by Francisco Toro with Pablo Guzmán (2019 to 2020), imagined a lawyer who prepares the agreement without hourly billing, takes a small share if it is fulfilled and carries the cost of the defense if it is breached. The RUC-D framework behind TEMIS's economy is by Francisco Toro and Andrés Peña.

**If you are judging Find Your Way or Meridian, start here.**

1. **What it is.** See the milestone-based model in [How it works](#how-it-works).
2. **Why Stellar.** See the anchors and testnet evidence in [Evidence you can open](#evidence-you-can-open).
3. **Check it yourself.** Follow [How to recheck a transaction](./docs/EVIDENCE.md#how-to-recheck-a-transaction).
4. **Independent reconstruction.** See the [reconstruction evidence](#evidence-you-can-open).
5. **What we do not claim.** See [what remains unverified](#what-it-does-not-do-and-what-is-not-verified).

## In one minute

TEMIS transforms lawyers into insurers: in the underlying model, a lawyer prepares an agreement without hourly billing, receives a small percentage if it is fulfilled, and assumes the cost of the defense if it is breached, taking on the client's risk.

> **The unit is not the contract. The unit is the milestone, and what each party recorded about it.**

When each party keeps its own version of requests, deliveries and replies, reconstructing what happened after a disagreement takes time and legal support. TEMIS is a validation layer for bilateral agreements: both parties sign the same version digest, later events become signed lines in an append-only record, and each line's digest is anchored on Stellar. The [documented walkthrough](./docs/HOW_IT_WORKS.md#walkthrough-two-parties-and-one-milestone) gives the concrete case and its limits.

## Why TEMIS, and not a notarized PDF

A notarized contract proves a document existed; it does not record what happened at each milestone. The model, signatures, chain rules, payment flow and verification boundaries are in [`docs/HOW_IT_WORKS.md`](./docs/HOW_IT_WORKS.md). TEMIS is one of Vespi's ten functional projects; a marketplace where people match with lawyers and pay for their services remains a product direction, as described in [`docs/TOKEN.md`](./docs/TOKEN.md).

## How it works

The sequence from agreement signatures through milestone events, Stellar anchors and independent review is described in [`docs/HOW_IT_WORKS.md`](./docs/HOW_IT_WORKS.md).

## Evidence you can open

The testnet evidence, including the third-party reconstruction, suite results, payment review and transaction links, is grouped in [`docs/EVIDENCE.md`](./docs/EVIDENCE.md).

## The economy and the $TEMIS token

$TEMIS on testnet is a proof of concept for a payment method in TEMIS's lawyer marketplace; the same payment could also use USDC or XLM, so $TEMIS is not the only path. The marketplace is not built. The token has no price, sale, liquidity or promise of value, and under RUC-D the token layer remains last. Nothing goes to mainnet or is sold without a lawyer's review. Its study, design, allocation and limits are in [`docs/TOKEN.md`](./docs/TOKEN.md).

## TEMIS, Vespi and Lore Plugin

[Lore Plugin](https://github.com/andresanemic/lore-plugin) prepares the ground: the criterion of the project, the routing that opens the right one for each task, and the coordinator's method. [Vespi](https://github.com/andresanemic/vespi) operates on it: operations under an authority a person grants, verification apart from execution, and receipts. TEMIS was the first real operation the whole system ran, and an independent advisor model reviewed its design before it was fixed.

## What it does not do, and what is not verified

TEMIS's underlying model makes the lawyer the party that assumes the client's risk; the TEMIS layer only records and validates. TEMIS itself is not an insurer and promises no coverage. If an arrangement like this qualifies as insurance under Chile's DFL 251, a lawyer must review it. TEMIS is not a judge, arbitrator or DAO; it does not replace a lawyer or notary, determine truth, legal responsibility, consent, identity or admissibility, guarantee performance, collect debts or pay for breaches. A signature supports record integrity and key control, but does not establish civil identity or free consent; a Stellar anchor is not a legal timestamp or a guarantee of evidentiary value. Testnet results do not establish mainnet operation, production readiness, customer demand, multiple facilitators or real-world outcomes; the independent reconstruction covers one run and its published inputs. The token has no price, sale or liquidity and promises no value or legal classification. The whitepaper's Chilean legal material has not had competent legal review; see [`docs/LEGAL_AND_LIMITS.md`](./docs/LEGAL_AND_LIMITS.md).

## How to review this project

Today this repository holds documentation, testnet evidence, token records and a review-only [LICENSE](./LICENSE). It does not hold source code: [`CODE_NOT_INCLUDED.md`](./CODE_NOT_INCLUDED.md) explains why and when it opens for reading and cloning during the judging period, for evaluation rather than modification. The license is proprietary, is not approved by the OSI, and is a working draft for a lawyer to review. More repositories for Vespi's functional projects will follow, without code at first, each explaining the why, the how and the what.

## Author

**Andrés Peña Mellado**, Digital Art Director & Creative Developer working across AI agents, Web3, design and research. Repository authority: `andresanemic`.

[<img src="./assets/icons/v2/telegram.svg" width="28" alt="Telegram">](https://t.me/andresanemic) &nbsp;&nbsp; [<picture><source media="(prefers-color-scheme: dark)" srcset="./assets/icons/v2/x-dark.svg"><img src="./assets/icons/v2/x.svg" width="28" alt="X"></picture>](https://x.com/andresanemic) &nbsp;&nbsp; [<img src="./assets/icons/v2/linkedin.svg" width="28" alt="LinkedIn">](https://www.linkedin.com/in/andresanemic/)

---

[How it works](./docs/HOW_IT_WORKS.md) · [Evidence](./docs/EVIDENCE.md) · [Token](./docs/TOKEN.md) · [Legal and limits](./docs/LEGAL_AND_LIMITS.md) · [Code not included](./CODE_NOT_INCLUDED.md) · [Review-only license](./LICENSE) · [Vespi](https://github.com/andresanemic/vespi) · [Lore Plugin](https://github.com/andresanemic/lore-plugin)

</details>

<details>
<summary><b>Leer en español</b></summary>

<a id="espanol"></a>

**Por qué.** El concepto original, Not Ponzi, de Francisco Toro con Pablo Guzmán (2019 a 2020), imaginaba a un abogado que prepara el acuerdo sin cobrar por hora, recibe un porcentaje pequeño si se cumple y asume el costo de la defensa si se incumple. El marco RUC-D detrás de la economía de TEMIS es de Francisco Toro y Andrés Peña.

**Si estás evaluando Find Your Way o Meridian, empieza aquí.**

1. **Qué es.** Consulta el modelo organizado por hitos en [Cómo funciona](#cómo-funciona).
2. **Por qué Stellar.** Consulta los anclajes y las pruebas de testnet en [Evidencia que puedes abrir](#evidencia-que-puedes-abrir).
3. **Compruébalo tú.** Sigue [Cómo volver a comprobar una transacción](./docs/EVIDENCE.md#cómo-volver-a-comprobar-una-transacción).
4. **Reconstrucción independiente.** Consulta la [evidencia de reconstrucción](#evidencia-que-puedes-abrir).
5. **Qué no afirmamos.** Consulta [lo que no está verificado](#lo-que-todavía-no-hace-y-lo-que-no-está-verificado).

## En un minuto

TEMIS transforma abogados en aseguradoras: en el modelo de fondo, una persona abogada prepara un acuerdo sin cobrar por hora, recibe un porcentaje pequeño si se cumple y asume el costo de la defensa si se incumple, por lo que carga con el riesgo de su cliente.

> **La unidad no es el contrato. La unidad es el hito, y lo que cada parte registró sobre él.**

Cuando cada parte guarda su propia versión de las solicitudes, entregas y respuestas, reconstruir lo ocurrido tras un desacuerdo toma tiempo y apoyo jurídico. TEMIS es una capa de validación para acuerdos bilaterales: ambas partes firman el mismo digest de versión, los eventos posteriores quedan en líneas firmadas de solo anexado y el digest de cada línea se ancla en Stellar. El [recorrido documentado](./docs/HOW_IT_WORKS.md#recorrido-dos-partes-y-un-hito) desarrolla el caso concreto y sus límites.

## Por qué TEMIS, y no un PDF notarizado

Un contrato notarizado prueba que existió un documento; no registra lo ocurrido en cada hito. El modelo, las firmas, las reglas de cadena, el flujo de pagos y los límites de verificación están en [`docs/HOW_IT_WORKS.md`](./docs/HOW_IT_WORKS.md). TEMIS es uno de los diez proyectos funcionales de Vespi; un marketplace donde las personas se emparejan con abogados y pagan por sus servicios sigue siendo una dirección de producto, descrita en [`docs/TOKEN.md`](./docs/TOKEN.md).

## Cómo funciona

El recorrido desde las firmas del acuerdo hasta los eventos del hito, los anclajes en Stellar y la revisión independiente se describe en [`docs/HOW_IT_WORKS.md`](./docs/HOW_IT_WORKS.md).

## Evidencia que puedes abrir

La evidencia de testnet, incluida la reconstrucción de terceros, los resultados de la suite, la revisión de pagos y los enlaces a las transacciones, está agrupada en [`docs/EVIDENCE.md`](./docs/EVIDENCE.md).

## La economía y el token $TEMIS

$TEMIS en testnet es una prueba de concepto de un medio de pago para el marketplace de abogados de TEMIS; el mismo pago también podría hacerse con USDC o XLM, así que $TEMIS no es el único camino. El marketplace no está construido. El token no tiene precio, venta ni liquidez y no promete valor; bajo RUC-D, la capa del token sigue yendo al final. Nada va a mainnet ni se vende sin revisión de una persona abogada. Su estudio, diseño, asignación y límites están en [`docs/TOKEN.md`](./docs/TOKEN.md).

## TEMIS, Vespi y Lore Plugin

[Lore Plugin](https://github.com/andresanemic/lore-plugin) prepara el terreno: el criterio del proyecto, el enrutamiento que abre el criterio correcto para cada tarea y el método del coordinador. [Vespi](https://github.com/andresanemic/vespi) opera sobre él: operaciones bajo una autoridad que concede una persona, verificación aparte de la ejecución y recibos. TEMIS fue la primera operación real que corrió todo el sistema, y un modelo asesor independiente revisó su diseño antes de fijarlo.

## Lo que todavía no hace, y lo que no está verificado

El modelo de fondo de TEMIS hace que la persona abogada asuma el riesgo de su cliente; la capa TEMIS solo registra y valida. TEMIS en sí no es una aseguradora ni promete cobertura. Si un acuerdo de este tipo califica como seguro bajo el DFL 251 de Chile, lo debe revisar una persona abogada. TEMIS no es juez, árbitro ni DAO; no reemplaza a una persona abogada ni a un notario, no determina la verdad, la responsabilidad legal, el consentimiento, la identidad ni la admisibilidad, no garantiza el cumplimiento, no cobra deudas ni paga por incumplimientos. Una firma respalda la integridad del registro y el control de la clave, pero no establece identidad civil ni consentimiento libre; un anclaje en Stellar no es un fechado legal ni garantiza valor probatorio. Los resultados en testnet no establecen operación en mainnet, preparación para producción, demanda de clientes, varios facilitadores ni resultados reales; la reconstrucción independiente cubre una corrida y sus datos publicados. El token no establece una clasificación jurídica. El material jurídico chileno del whitepaper no ha tenido revisión jurídica competente; consulta [`docs/LEGAL_AND_LIMITS.md`](./docs/LEGAL_AND_LIMITS.md).

## Cómo revisar este proyecto

Hoy este repositorio contiene documentación, evidencia de testnet, registros del token y una [LICENSE](./LICENSE) de solo revisión. No contiene código fuente: [`CODE_NOT_INCLUDED.md`](./CODE_NOT_INCLUDED.md) explica por qué y cuándo se abre para lectura y clonación durante el periodo de evaluación, para evaluarlo y no modificarlo. La licencia es propietaria, no está aprobada por la OSI y es un borrador de trabajo para revisión jurídica. Vendrán más repositorios de los proyectos funcionales de Vespi, sin código al principio, cada uno explicando el porqué, el cómo y el qué.

## Autor

**Andrés Peña Mellado**, Digital Art Director & Creative Developer que trabaja entre agentes de IA, Web3, diseño e investigación. Autoridad del repositorio: `andresanemic`.

[<img src="./assets/icons/v2/telegram.svg" width="28" alt="Telegram">](https://t.me/andresanemic) &nbsp;&nbsp; [<picture><source media="(prefers-color-scheme: dark)" srcset="./assets/icons/v2/x-dark.svg"><img src="./assets/icons/v2/x.svg" width="28" alt="X"></picture>](https://x.com/andresanemic) &nbsp;&nbsp; [<img src="./assets/icons/v2/linkedin.svg" width="28" alt="LinkedIn">](https://www.linkedin.com/in/andresanemic/)

---

[Cómo funciona](./docs/HOW_IT_WORKS.md) · [Evidencia](./docs/EVIDENCE.md) · [Token](./docs/TOKEN.md) · [Marco legal y límites](./docs/LEGAL_AND_LIMITS.md) · [Código no incluido](./CODE_NOT_INCLUDED.md) · [Licencia de solo revisión](./LICENSE) · [Vespi](https://github.com/andresanemic/vespi) · [Lore Plugin](https://github.com/andresanemic/lore-plugin)

</details>
