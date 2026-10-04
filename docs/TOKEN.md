# $TEMIS token: testnet experiment and design study

## Status and RUC-D reading

$TEMIS on testnet is a proof of concept for a payment method in TEMIS's lawyer marketplace, where people and lawyers would match and pay for services. The same payment could also use USDC or XLM, so $TEMIS is not the only path. The marketplace is a product direction, not built. The classic Stellar asset was issued on testnet on 3 October 2026 to test payment mechanics; this does not establish demand, a price, a sale, liquidity or a promise of value.

The original Not Ponzi idea is by Francisco Toro with Pablo Guzmán; the RUC-D framework behind TEMIS's economy is by Francisco Toro and Andrés Peña. RUC-D orders the work before tokenomics: institutional relationship, resource or flow, actors and rights, rules and authorities, proof and verifiers, architecture, then tokenomics last. The study treats “no token” as a valid outcome for production. The testnet asset is a payment-method proof of concept, not the study's recommendation for a production token.

## Four candidate designs in study A

| Candidate | Proposed function | Assessment in the RUC-D study |
| --- | --- | --- |
| A. None | No token; use a service fee and anchored digests | Recommended for the current evidence. No supply or token rights are created. |
| B. Capacity unit | Pay for verified professional or technical capacity, issued against verified settlement and burned on use | Could avoid tying supply to disputes, but risks creating exclusion rights and a revocable permission rather than a durable right. |
| C. Agreement seal | Represent uniqueness and provenance of an agreement version | Duplicates the existing digest anchor; transferability could bind a tradable object to personal data, while a non-transferable seal is already a record rather than a token. |
| D. Professional reputation | Score a professional's work | Not recommended: it indirectly scores dispute outcomes, persists after exit, and concentrates scoring power in the operator. |

The testnet issue implements none of these as a production utility. It tests classic-asset issuance, allocations, issuer locking, and claimable-balance vesting mechanics.

## Fixed testnet allocation

The manifest records a total fixed supply of 100,000,000 TEMIS with seven decimal places. The configuration assigns the following shares. The one-token vesting demonstration was taken from the liquidity bucket; it is a test balance, not a liquidity pool or market.

| Bucket | Allocation | TEMIS | Testnet implementation / condition |
| --- | ---: | ---: | --- |
| Treasury | 25% | 25,000,000 | Separate treasury account |
| Ecosystem | 35% | 35,000,000 | Separate ecosystem account; future allocation is not a built marketplace |
| Liquidity reserve | 10% | 10,000,000 | Separate account; no pool or offers. A 1 TEMIS vesting demonstration was drawn from this bucket |
| Advisers | 10% | 10,000,000 | Separate advisers account |
| Contingency | 5% | 5,000,000 | Separate contingency account |
| Founders | 15% | 15,000,000 | 12-month cliff, then 36 monthly claimable balances |
| **Total** | **100%** | **100,000,000** | Fixed issue; no issuance formula based on case or dispute counts |

The manifest's independently read testnet balances show the one-token demonstration outside the liquidity account and 9,999,999 TEMIS remaining there. The demonstration's early claim failed with `claimClaimableBalanceCannotClaim`; its later claim succeeded. The test confirms those transactions and does not establish a real vesting entitlement.

### Founder vesting

The test configuration starts 3 October 2026, has a 12-month cliff, then 36 monthly claimable-balance tranches through 3 September 2030. On testnet the schedules are represented by 72 claimable balances. The testnet schedule does not establish a mainnet allocation.

## Technical design and observed checks

- **Asset:** classic Stellar asset code `TEMIS`, issued on Stellar testnet.
- **Supply:** one fixed issue of 100,000,000.0000000 TEMIS. The manifest stores 1,000,000,000,000,000 stroops, consistent with seven decimal places.
- **Issuer:** issuer master weight and thresholds set to zero, no additional signers. The issuer is locked after distribution.
- **Flags:** `AUTH_REQUIRED`, `AUTH_REVOCABLE`, `AUTH_IMMUTABLE`, and `CLAWBACK_ENABLED` are all false. The experiment has no authorization gate and no clawback control.
- **Distribution:** separate accounts for treasury, ecosystem, liquidity, advisers, contingency, founders, and the test account. The manifest and testnet verifier record the balances.
- **Vesting:** claimable balances with time predicates, rather than a linear-vesting contract. The source study notes that these unlock in discrete tranches and that claiming requires a trustline.

The token receipt reports an independent Horizon read confirming the locked issuer, flags, total supply, bucket balances, 72 vesting balances, and no issuer balance. These are testnet facts. They do not prove mainnet configuration or audit the future use of any bucket.

## Supply constraint and incentive boundary

Supply must not depend on the number of disputes. A dispute-linked emission would reward conflict and would make the asset's supply rise with adverse cases, contrary to the whitepaper's stated incentive to charge for performance rather than dispute. The testnet configuration is fixed-supply and is not a formula that mints against cases. There is no tribunal, juror staking, arbitration, dispute yield, or performance coverage in the built TEMIS MVP.

## Financing study F1: alternatives and risk

Study F1 recommends considering non-dilutive financing such as the Stellar Community Fund before any token sale. It describes grants and hackathon funding as alternatives to taking money in exchange for tokens. Its warning is that selling now would conflict with the RUC-D order and with the lack of evidence for live marketplace demand; the testnet payment proof of concept does not establish that demand or support a sale. It also flags the risk of creating a 15% founder reserve before the treasury, ecosystem demand, and record-archive stewardship have working governance. No sale plan is implemented here.

The study's financing references, including grant amounts and program details, were consulted on 3 October 2026 in the source study and were not independently rechecked for this repository. This document does not present them as a currently available offer.

## What study B says worked and failed

Study B is a research synthesis, not a new audit of the projects it discusses. It reports these design lessons:

- **Kleros / PNK:** stake is used to secure juror selection and governance; the study's lesson is to separate a token's economic function from the service fee. It does not provide verified market metrics here.
- **Aragon Court / ANJ:** the study cites Aragon's announced ANJ-to-ANT merger and later statements that the court effort failed and was sunset. It describes subsidy dependence and fragmented security as failure patterns; one subsidy account is marked partial because it relies on an aggregator.
- **UMA:** bonds and escalation separate the ordinary path from contested cases. The study notes that a majority mechanism is not a legal judgment or accredited timestamp, so this is not a TEMIS feature.
- **Reality.eth:** an external arbitrator can serve as a backstop without a native token; some app observations in the study are marked partial.
- **Jur / JUR:** a fee and dispute-governance token is described, but the source access and evidence are partial and do not establish mature organic demand.
- **EAS and Gitcoin Passport:** attestations and reputation or eligibility checks can exist without a native token. This supports the possibility that a record can work without issuing one.
- **RetroPGF and reputation systems:** the study reports that funding based only on popularity or metrics can be distorted and that non-transferable reputation is an alternative to a tradable score.
- **Stellar examples:** the study contrasts a utility token with a purpose-bound regulated asset such as BENJI; it emphasizes an identified issuer and a real off-chain product rather than speculative issuance.

The study's external references and their limits are kept with the research record; partial or unverified sources remain qualified as such. These comparisons are lessons proposed by the study, not proof that any mechanism will work for TEMIS.

## Marketplace direction is not built

The product direction is a marketplace where people match with lawyers and pay for their services. That marketplace, its professional catalog, and its access-control layer are not built in this MVP. The lawyer assumes the client's risk in the underlying model; the TEMIS layer only records and validates and does not act as an insurer or promise coverage. Whether an arrangement like this qualifies as insurance under Chile's DFL 251 requires review by a lawyer. TEMIS is not a judge, guarantor, DAO, or marketplace operator.

## Legal limits

The tokenomics studies identify unresolved legal questions in Chile and other jurisdictions, including possible securities, consumer, tax, financial-services, and insurance treatment. The source material does not provide a competent legal opinion. Testnet issuance does not resolve the classification of a future mainnet asset or sale.

Nothing is issued on mainnet or sold without review by a lawyer. No price, liquidity, return, exchange listing, market, or investment value is promised or implied by this experiment.

## Marketplace economy: proposed flows, not operating fees

The marketplace is a product direction only. Study E1 proposes the payment map below for a future marketplace; it is a design study, not a tariff sheet or a live service. The underlying Not Ponzi model is that a lawyer prepares the agreement without hourly billing, receives a small share if it is fulfilled, and bears the cost of defending the client if it is breached. Source: TEMIS marketplace economy study E1, opened 3 October 2026; product limits are also described in [How it works](./HOW_IT_WORKS.md) and [Legal limits](./LEGAL_AND_LIMITS.md), opened 3 October 2026.

| Payer to recipient | What it would pay for | When | Status |
| --- | --- | --- | --- |
| Client to notary or identity verifier | Opening a file and checking identity | At onboarding | E1 proposal; not built or priced |
| Client to TEMIS operator | File opening, milestone closure, and technical anchoring | On the corresponding event | E1 proposal; not built or priced |
| Client to lawyer | The small success share in the Not Ponzi concept | Only if the agreement is fulfilled | Product concept; percentage and collection method are unmeasured |
| Lawyer to marketplace operator | Matching commission for obtaining the engagement | On acceptance or settlement, timing unresolved | E1 proposal; not a current fee |
| Lawyer to the operator or independent verifier | Technical reconstruction or a report | Per query | E1 proposal; fee and payer details remain undecided |
| Parties to notary or expert | Work to reconstruct evidence for a proceeding | If needed in a dispute | External professional fee; no amount established |

E1 gives a purely illustrative rental example: 0.2 UF-equivalent for onboarding, 1 USDC for opening the file, 0.5 USDC per anchor across four milestones, a 2% lawyer share, a 15% matching commission taken from that share, and 20 UF-equivalent for dispute work. None is an observed price, quote, commitment, or production tariff. The study establishes no real market price, dispute rate, or willingness to pay. The 20 UF dispute fee and collecting the lawyer's share when accepting a guarantee are not adopted here: they conflict with the product concept that the lawyer earns a small percentage if the agreement is fulfilled and bears the defense cost if it is breached. The collection point and how that cost is borne need a coherent contract and legal review before a pilot. Source: E1, opened 3 October 2026; no real pricing was verified.

On the fulfillment path, the parties pay only for agreed professional and technical services; if the agreement is fulfilled, the lawyer's success share becomes payable under the eventual contract. On the breach path, TEMIS can record the event and support later reconstruction; it does not adjudicate, collect, reimburse, or fund a defense. Under the product concept, the lawyer bears the defense cost. The design does not charge for declaring a milestone unfulfilled or challenged, and a dispute must not generate token issuance, yield, or platform income. Sources: E1 and first-wave studies A and B, opened 3 October 2026; see [How it works](./HOW_IT_WORKS.md) and [Legal limits](./LEGAL_AND_LIMITS.md), opened 3 October 2026.

## Professional profiles and the proposed MCP

A professional profile should distinguish claims by who verifies them. E1 proposes checking legal qualification and current eligibility against the competent official source, with voluntary bar membership shown separately rather than required universally. A signing key proves control of that key, not civil identity, qualification, ethics, or service quality. A future profile could show declared jurisdiction and specialty, verified credential issuer and validity, voluntary membership, and consented work aggregates. It should not publish client names, agreement contents, evidence, or literal disciplinary records on chain. These are proposed fields and checks, not an existing directory or verification service. Source: E1, opened 3 October 2026; signature and privacy limits are also described in [How it works](./HOW_IT_WORKS.md) and [Legal limits](./LEGAL_AND_LIMITS.md), opened 3 October 2026.

E1 and F2 describe a read-only MCP for profiles as a possible query layer: a person or authorized agent could request a professional's verified profile and a link to independently checkable public anchors, subject to the professional's explicit, revocable consent. It should return only allowlisted structured fields; it should not store case files, decide matches, act as a credit bureau, or expose private client data. A query fee could be charged separately, but no fee or payment integration has been chosen. The profile MCP is not built. F2 marks direct verification of W3C Verifiable Credentials 2.0 as [COULD NOT OPEN]; this document therefore makes no claim that a particular VC standard, issuer, or revocation service is available for TEMIS. Sources: E1 and F2, opened 3 October 2026; F2's source-access limit is retained.

## Service marketplace precedents and failure patterns

E1's comparisons are design lessons, not a new audit of these services. Upwork and Fiverr combine matching, payment protection, platform-controlled disputes, and profile reputation; their deposits protect payment arrangements, not professional work quality. UpCounsel is a closer legal-marketplace comparison for matching, but E1 found no verified performance-guarantee deposit in the sources it reviewed. LegalZoom sells document and compliance services and is not an equivalent lawyer marketplace. Source: E1, opened 3 October 2026; its comparison limits apply.

For dispute systems, first-wave study B reports that Aragon Court ended after the project said it had failed to launch a court system; its subsidy and fragmented-security experience warns against rewarding supply without organic demand. UMA separates ordinary cases from bonded escalation; Reality.eth can use an external arbitrator without a native token. Neither makes its mechanism a court judgment or accredited legal timestamp. Study B also describes Kleros as using PNK for juror selection and governance, while EAS and Gitcoin Passport show that attestations or eligibility checks can exist without a native token. These comparisons do not prove that a mechanism will work for TEMIS. Source: first-wave study B, opened 3 October 2026; partial and unverified observations remain qualified as in that study.

Recurring risks relevant to TEMIS are subsidized supply without paying demand, platform capture of disputes, reputations that can be bought or moved without verifiable provenance, and mistaking a deposit for a real quality guarantee. Legal disputes remain outside the platform; the record can reduce reconstruction work but cannot decide liability. Profiles and history should be portable, with published rules for admission, suspension, exit, and appeal. Sources: E1 and first-wave studies A and B, opened 3 October 2026; see [How it works](./HOW_IT_WORKS.md), opened 3 October 2026.

## Payment media and the role of $TEMIS

The testnet asset is a proof of concept for a possible payment medium, not an investment instrument or production utility. A service could also be paid for with USDC or XLM. The current asset is a classic Stellar asset; the documented Stellar x402 `exact` path supports SEP-41 tokens and not classic assets, so the existing $TEMIS asset is not itself an x402 integration. No marketplace payment path is built. Sources: token testnet record and technical study C, opened 3 October 2026; [How it works](./HOW_IT_WORKS.md), opened 3 October 2026.

| Payment medium | What it could offer in a future marketplace | What it does not solve or adds as a constraint |
| --- | --- | --- |
| $TEMIS | A project-specific payment path explored by the testnet proof of concept | The current asset has no price, sale, liquidity, or production use; it is classic and cannot use the documented Stellar x402 `exact` path |
| USDC | A payment unit suitable for the documented Stellar x402 path when represented as a supported SEP-41 asset | It depends on an external asset issuer and does not create demand for TEMIS or build the marketplace |
| XLM | The network's native asset can be used for a direct Stellar payment | The service would be denominated in XLM unless a conversion rule is added; the studies did not assess exchange-rate treatment |

These are functional comparisons, not recommendations to buy or hold an asset. More ambitious token roles suggested in E1, such as a lawyer's guarantee deposit, prepaid service credit, or revocable membership seal, are not features of the current asset or marketplace MVP. They are unproven options that could create financial, legal, exclusion, or conflict-of-interest risks. E1 ultimately recommends no production token until a measurable problem remains that ordinary fees or existing payment rails cannot solve. Sources: E1, F1, and technical study C, opened 3 October 2026; first-wave study A, opened 3 October 2026.

## Design constraints and Chilean legal review

- **Supply and disputes:** supply for any TEMIS instrument must not depend on the number of disputes. Dispute-linked issuance, rewards, or yield would pay for conflict and contradict the stated incentive to earn from fulfillment. Sources: whitepaper position summarized in [Legal limits](./LEGAL_AND_LIMITS.md) and first-wave studies A and B, opened 3 October 2026.
- **Risk allocation:** the proposed lawyer earns a small share if the agreement is fulfilled and bears the defense cost if it is breached. TEMIS records and verifies technical material; it does not promise payment, insure, guarantee performance, or decide disputes. Any future design must clarify who drafts, who undertakes the guarantee, who represents the client, who pays costs, and how conflicts are disclosed. Sources: E1, first-wave study A, and [Legal limits](./LEGAL_AND_LIMITS.md), opened 3 October 2026.
- **Chilean insurance law:** the studies identify article 4 of DFL 251 as a material boundary if a future arrangement qualifies as insurance. A qualified Chilean lawyer must review the actual contract, compensation, risk bearer, and service structure before any guarantee or coverage is offered. This document does not make a legal classification. Sources: study D and E1, opened 3 October 2026; [Legal limits](./LEGAL_AND_LIMITS.md), opened 3 October 2026.
- **Professional conduct, privacy, and financial regulation:** before a pilot, a lawyer should review professional admission and advertising rules, conflicts of interest, personal-data handling and deletion, consumer obligations, and whether the marketplace or payment flow triggers financial-service or other authorization requirements. The research does not resolve these questions. Sources: studies D and E1, opened 3 October 2026; [Legal limits](./LEGAL_AND_LIMITS.md), opened 3 October 2026.

## RUC-D assessment of the proposed marketplace

The marketplace adds layers to the existing agreement record. In E1's RUC-D reading, the agreement file is excludable and has low subtractability; public digests and anchors are non-subtractable and tend toward a public good; professional time is scarce and excludable; the operator's accounts, keys, and hosting are controlled infrastructure; and membership, ranking, or reputation would be designed scarcity whose rules the operator could change. Admission, exit, and appeal have no assigned community provider yet. These are design classifications, not evidence of an operating marketplace. Source: E1 and first-wave study A, opened 3 October 2026.

The proposed rights bundle is asymmetric. Clients need access to their copies and the ability to declare, confirm, or challenge their own milestones. Lawyers need access to engagements, payment for fulfilled work, and a fair appeal route if excluded. Notaries and independent verifiers need scoped access and payment for work, without control of outcomes. The operator would collect fees and manage admission, formats, and infrastructure, giving it practical exclusion power. It must not decide legal disputes or be the only verifier of its own records. Source: E1, opened 3 October 2026; existing record limits are in [How it works](./HOW_IT_WORKS.md), opened 3 October 2026.

Extraction and provision are not balanced by fees alone. The operator, lawyer, notary, and verifier may collect fees; clients provide agreement data and evidence, while professionals, notaries, and verifiers provide legal work, public attestation, and reconstruction. Hosting and preserving the full history, moderation, and appeals still need named owners and funding. The main RUC-D risk is under-provision together with enclosure: an operator could close access to the professional directory or trap reputation history. Published entry criteria, appeal, and portable records are proposed safeguards, not implemented guarantees. Source: E1 and first-wave study A, opened 3 October 2026.

## MVP exclusions and open research

The marketplace MVP described in these studies would not issue a dispute-linked token, sell insurance or breach coverage, adjudicate disputes, sell ranking priority, create transferable reputation, put client information or case contents on chain, or let the operator control admission and appeals without a published process. A marketplace, lawyer catalog, profile MCP, escrow, professional credential integration, and marketplace payment flow are not built. The current testnet token implements no deposit, prepaid credit, membership, yield, or governance function. Sources: E1, F2, first-wave studies A and B, opened 3 October 2026; [How it works](./HOW_IT_WORKS.md), opened 3 October 2026.

Before a pilot, research still needs to measure willingness to pay, actual marketplace fees, fulfillment and dispute rates, the lawyer's expected defense cost, the source and update process for professional credentials, data-retention and appeal rules, and Chilean legal classification of the proposed guarantee and payment arrangements. These quantities were not verified in the studies. Their figures remain illustrative, and the marketplace remains unbuilt. Sources: E1, F1, F2, and study D, opened 3 October 2026.

Published sources do not verify the current availability or revocation service of a Chilean lawyer credential issuer, a deployed TEMIS professional-profile MCP, or an operating Chilean legal marketplace with a performance-guarantee deposit. F2 marks direct verification of W3C VC Data Model 2.0 as [COULD NOT OPEN]; no claim of standard-specific availability is made here. Sources: E1 and F2, opened 3 October 2026.
## Español

### Estado y lectura desde RUC-D

$TEMIS en testnet es una prueba de concepto de un medio de pago para el marketplace de abogados de TEMIS, donde las personas y los abogados podrían emparejarse y pagar por servicios. El mismo pago también podría hacerse con USDC o XLM, así que $TEMIS no es el único camino. El marketplace es una dirección de producto, no está construido. El activo clásico de Stellar se emitió en testnet el 3 de octubre de 2026 para probar la mecánica de pago; esto no demuestra demanda, precio, venta, liquidez ni promesa de valor.

La idea original Not Ponzi es de Francisco Toro con Pablo Guzmán; el marco RUC-D detrás de la economía de TEMIS es de Francisco Toro y Andrés Peña. RUC-D ordena el trabajo antes de la tokenomics: relación institucional, recurso o flujo, actores y derechos, reglas y autoridades, pruebas y verificadores, arquitectura, y tokenomics al final. El estudio considera válido concluir que no corresponde tener token para producción. El activo de testnet es una prueba de concepto del medio de pago, no la recomendación del estudio para un token de producción.

### Cuatro diseños candidatos del estudio A

| Candidato | Función propuesta | Evaluación del estudio RUC-D |
| --- | --- | --- |
| A. Ninguno | No emitir token; usar una tarifa de servicio y digests anclados | Recomendado para la evidencia actual. No crea oferta ni derechos de token. |
| B. Unidad de capacidad | Pagar capacidad profesional o técnica verificada, emitir contra liquidación verificada y quemar al usarla | Podría evitar ligar la oferta a disputas, pero arriesga crear derechos de exclusión y un permiso revocable en vez de un derecho duradero. |
| C. Sello de acuerdo | Representar unicidad y procedencia de una versión del acuerdo | Duplica el anclaje digest existente; su transferibilidad podría vincular un activo negociable a datos personales, mientras que un sello intransferible ya es un registro, no un token. |
| D. Reputación profesional | Puntuar el trabajo de un profesional | No recomendado: puntúa indirectamente resultados de disputas, persiste tras la salida y concentra la facultad de puntuar en el operador. |

La emisión en testnet no implementa ninguno de estos diseños como utilidad de producción. Prueba la emisión de un activo clásico, su asignación, el bloqueo de la emisora y la mecánica de vesting con balances reclamables.

### Asignación fija de testnet

El manifiesto registra una oferta fija total de 100.000.000 TEMIS con siete decimales. La configuración asigna estas proporciones. La demostración de vesting de un token salió de la cubeta de liquidez; es un saldo de prueba, no un pool ni un mercado.

| Cubeta | Asignación | TEMIS | Implementación en testnet o condición |
| --- | ---: | ---: | --- |
| Tesorería | 25% | 25.000.000 | Cuenta de tesorería separada |
| Ecosistema | 35% | 35.000.000 | Cuenta de ecosistema separada; una futura asignación no es un marketplace construido |
| Reserva de liquidez | 10% | 10.000.000 | Cuenta separada; sin pool ni ofertas. Se usó 1 TEMIS para la demostración de vesting |
| Asesores | 10% | 10.000.000 | Cuenta separada de asesores |
| Contingencia | 5% | 5.000.000 | Cuenta separada de contingencia |
| Fundadores | 15% | 15.000.000 | Cliff de 12 meses y luego 36 balances reclamables mensuales |
| **Total** | **100%** | **100.000.000** | Emisión fija; no hay fórmula de emisión según cantidad de casos o disputas |

Los saldos de testnet leídos de forma independiente que aparecen en el manifiesto muestran el token usado en la demostración fuera de la cuenta de liquidez, con 9.999.999 TEMIS restantes allí. La reclamación temprana de demostración falló con `claimClaimableBalanceCannotClaim`; la reclamación posterior tuvo éxito. La prueba confirma esas transacciones, no un derecho real de vesting.

### Vesting de fundadores

La configuración de prueba comienza el 3 de octubre de 2026, tiene un cliff de 12 meses y luego 36 tramos mensuales de balances reclamables, hasta el 3 de septiembre de 2030. En testnet, los calendarios se representan mediante 72 balances reclamables. El calendario de testnet no establece una asignación en mainnet.

### Diseño técnico y comprobaciones observadas

- **Activo:** activo clásico de Stellar con código `TEMIS`, emitido en testnet.
- **Oferta:** emisión única fija de 100.000.000,0000000 TEMIS. El manifiesto guarda 1.000.000.000.000.000 stroops, consistente con siete decimales.
- **Emisora:** peso maestro y umbrales en cero, sin firmantes adicionales. La emisora queda bloqueada después de distribuir.
- **Banderas:** `AUTH_REQUIRED`, `AUTH_REVOCABLE`, `AUTH_IMMUTABLE` y `CLAWBACK_ENABLED` están en falso. El experimento no tiene filtro de autorización ni control de clawback.
- **Distribución:** cuentas separadas para tesorería, ecosistema, liquidez, asesores, contingencia, fundadores y la cuenta de prueba. El manifiesto y el verificador de testnet registran los saldos.
- **Vesting:** balances reclamables con predicados de tiempo, no un contrato de vesting lineal. El estudio indica que se desbloquean en tramos discretos y que para reclamarlos se necesita una trustline.

El recibo del token informa una lectura independiente desde Horizon que confirmó la emisora bloqueada, las banderas, la oferta total, los saldos de las cubetas, 72 balances de vesting y saldo cero en la emisora. Son hechos de testnet. No demuestran la configuración de mainnet ni auditan el uso futuro de ninguna cubeta.

### Restricción de oferta e incentivos

La oferta no puede depender del número de disputas. Una emisión ligada a disputas premiaría el conflicto y haría crecer la oferta junto con casos adversos, en contra del incentivo declarado por el whitepaper de cobrar por el cumplimiento y no por la controversia. La configuración de testnet tiene oferta fija y no acuña según el número de casos. El MVP construido no tiene tribunal, staking de jurados, arbitraje, rendimiento por disputas ni cobertura de cumplimiento.

### Estudio F1 de financiamiento: alternativas y riesgos

El estudio F1 recomienda considerar financiamiento no dilutivo, como el Stellar Community Fund, antes de cualquier venta de tokens. Describe subvenciones y fondos para hackatones como alternativas a recibir dinero a cambio de tokens. Su advertencia es que vender hoy contradice el orden RUC-D y la falta de evidencia de demanda del marketplace en vivo; la prueba de concepto del pago en testnet no demuestra esa demanda ni respalda una venta. También señala el riesgo de crear una reserva de fundadores de 15% antes de contar con gobernanza operativa para la tesorería, la demanda del ecosistema y la custodia del archivo del historial. Aquí no se implementa ningún plan de venta.

Las referencias de financiamiento del estudio, incluidos montos de subvenciones y detalles de programas, se consultaron el 3 de octubre de 2026 en el estudio fuente y no se volvieron a comprobar para este repositorio. Este documento no las presenta como una oferta disponible actualmente.

### Qué indica el estudio B que funcionó y falló

El estudio B es una síntesis de investigación, no una auditoría nueva de los proyectos citados. Informa estas lecciones de diseño:

- **Kleros / PNK:** se usa staking para la selección de jurados y gobernanza; la lección del estudio es separar la función económica de un token de la tarifa del servicio. Aquí no presenta métricas de mercado comprobadas.
- **Aragon Court / ANJ:** el estudio cita la fusión ANJ-ANT anunciada por Aragon y declaraciones posteriores de que el esfuerzo del tribunal fracasó y terminó. Describe la dependencia de subsidios y la fragmentación de seguridad como patrones de falla; una fuente sobre subsidios está marcada como parcial por venir de un agregador.
- **UMA:** los bonos y la escalada separan el recorrido normal de los casos disputados. El estudio señala que un mecanismo de mayoría no es un juicio legal ni un fechado acreditado, por lo que no es una función de TEMIS.
- **Reality.eth:** un árbitro externo puede servir de respaldo sin token nativo; algunas observaciones de la aplicación en el estudio están marcadas como parciales.
- **Jur / JUR:** describe un token de tarifas y gobernanza de disputas, pero el acceso a las fuentes es parcial y no acredita una demanda orgánica madura.
- **EAS y Gitcoin Passport:** las atestaciones y las comprobaciones de reputación o elegibilidad pueden existir sin token nativo. Esto respalda que un registro puede funcionar sin emitir uno.
- **RetroPGF y sistemas de reputación:** el estudio informa que el financiamiento basado solo en popularidad o métricas puede distorsionarse y que la reputación intransferible es una alternativa a un puntaje negociable.
- **Ejemplos de Stellar:** el estudio contrasta un token de utilidad con un activo regulado de propósito definido como BENJI; destaca un emisor identificado y un producto real fuera de la cadena en vez de una emisión especulativa.

Las referencias externas del estudio y sus límites se conservan en el registro de investigación; las fuentes parciales o no verificadas se mantienen calificadas. Estas comparaciones son lecciones propuestas por el estudio, no pruebas de que un mecanismo funcione para TEMIS.

### La dirección marketplace no está construida

La dirección de producto es un marketplace donde las personas se emparejan con abogados y pagan por sus servicios. El marketplace, su catálogo profesional y su capa de control de acceso no están construidos en este MVP. En el modelo de fondo, la persona abogada asume el riesgo del cliente; la capa TEMIS solo registra y valida y no actúa como aseguradora ni promete cobertura. Si un acuerdo de este tipo califica como seguro bajo el DFL 251 de Chile, lo debe revisar una persona abogada. TEMIS no es juez, garante, DAO ni operador del marketplace.

### Límites legales

Los estudios de tokenomics identifican preguntas jurídicas abiertas en Chile y otras jurisdicciones, entre ellas el posible tratamiento como valor, y las normas de consumo, tributarias, financieras y de seguros. Las fuentes no contienen una opinión jurídica de una persona competente. La emisión en testnet no resuelve la clasificación de un activo futuro en mainnet ni de una venta.

No se emite nada en mainnet ni se vende sin revisión de una persona abogada. El token no tiene precio, venta ni liquidez y no promete valor, rendimiento, listado en una plataforma de intercambio, mercado ni valor de inversión.

### Economía del marketplace: flujos propuestos, no tarifas vigentes

El marketplace es solo una dirección de producto. El estudio E1 propone este mapa de pagos para un marketplace futuro; es un estudio de diseño, no una lista de tarifas ni la descripción de un servicio activo. El modelo Not Ponzi de base es que la persona abogada prepara el acuerdo sin cobrar por hora, recibe una parte pequeña si se cumple y asume el costo de defender al cliente si se incumple. Fuente: estudio de economía del marketplace de TEMIS E1, abierto el 3 de octubre de 2026; los límites actuales del producto también se describen en [Cómo funciona](./HOW_IT_WORKS.md) y [Marco legal y límites](./LEGAL_AND_LIMITS.md), consultados el 3 de octubre de 2026.

| Quién paga a quién | Qué pagaría | Cuándo | Estado |
| --- | --- | --- | --- |
| Cliente a notario o verificador de identidad | Apertura del expediente y revisión de identidad | Al iniciar | Propuesta de E1; no está construida ni tiene precio |
| Cliente al operador de TEMIS | Apertura del expediente, cierre de hitos y anclaje técnico | En el evento correspondiente | Propuesta de E1; no está construida ni tiene precio |
| Cliente a persona abogada | La pequeña parte por éxito del concepto Not Ponzi | Solo si se cumple el acuerdo | Concepto de producto; porcentaje y forma de cobro no están medidos |
| Persona abogada al operador del marketplace | Comisión de matching por conseguir el encargo | Al aceptar o liquidar, fecha sin resolver | Propuesta de E1; no es tarifa vigente |
| Persona abogada al operador o al verificador independiente | Reconstrucción técnica o informe | Por consulta | Propuesta de E1; monto y detalles del pagador siguen sin decidir |
| Partes a notario o perito | Trabajo para reconstruir evidencia para un procedimiento | Si hace falta en una disputa | Tarifa de profesional externo; no se estableció monto |

El ejemplo de arriendo de E1 usa cifras puramente ilustrativas: 0,2 UF-equivalente por alta, 1 USDC por abrir el expediente, 0,5 USDC por anclaje en cuatro hitos, una parte de 2% para la persona abogada, una comisión de matching de 15% tomada de esa parte y 20 UF-equivalente por trabajo de disputa. Ninguna cifra es precio observado, cotización, compromiso ni tarifa de producción. El estudio no establece precio real de mercado, tasa de disputas ni disposición a pagar. Los 20 UF por disputa y cobrar la parte de la persona abogada al aceptar una garantía no se adoptan aquí: entran en conflicto con el concepto de producto, según el cual la persona abogada recibe un porcentaje pequeño si se cumple el acuerdo y asume el costo de defensa si se incumple. El momento del cobro y la forma de asumir ese costo requieren un contrato coherente y revisión jurídica antes de cualquier piloto. Fuente: E1, abierto el 3 de octubre de 2026; no se verificó ningún precio real.

En el camino de cumplimiento, las partes pagan solo los servicios profesionales y técnicos acordados; si se cumple el acuerdo, la parte por éxito de la persona abogada vence según el contrato futuro. En el camino de incumplimiento, TEMIS puede registrar el evento y facilitar la reconstrucción posterior; no juzga, cobra, reembolsa ni financia la defensa. Según el concepto de producto, la persona abogada asume el costo de defensa. El diseño no cobra por declarar un hito incumplido o impugnado, y una disputa no debe generar emisión de tokens, rendimiento ni ingresos para la plataforma. Fuentes: E1 y estudios A y B de la primera ola, abiertos el 3 de octubre de 2026; consulta [Cómo funciona](./HOW_IT_WORKS.md) y [Marco legal y límites](./LEGAL_AND_LIMITS.md), consultados el 3 de octubre de 2026.

### Perfiles profesionales y MCP propuesto

El perfil debe distinguir las afirmaciones según quién las verifica. E1 propone comprobar la habilitación jurídica en la fuente oficial competente y mostrar por separado la colegiatura voluntaria, sin exigirla como condición universal. La firma de una persona profesional demuestra control de esa clave, no identidad civil, habilitación, ética ni calidad del servicio. Un perfil futuro podría mostrar jurisdicción y especialidad declaradas, entidad emisora y vigencia de credenciales verificadas, colegiatura voluntaria y agregados de trabajo con consentimiento. No debe publicar en cadena nombres de clientes, contenido de acuerdos, evidencia ni registros disciplinarios literales. Son campos y verificaciones propuestas, no un directorio ni servicio existente. Fuente: E1, abierto el 3 de octubre de 2026; los límites de firmas y privacidad también aparecen en [Cómo funciona](./HOW_IT_WORKS.md) y [Marco legal y límites](./LEGAL_AND_LIMITS.md), consultados el 3 de octubre de 2026.

E1 y F2 describen un MCP de solo lectura para perfiles como posible capa de consulta: una persona o agente autorizado podría solicitar el perfil verificado de un profesional y un enlace a anclajes públicos comprobables de forma independiente, con consentimiento expreso y revocable del profesional. Debería devolver solo campos estructurados permitidos; no almacenar expedientes, decidir emparejamientos, actuar como buró de crédito ni exponer datos privados de clientes. Se podría cobrar aparte por consulta, pero no se ha elegido tarifa ni integración de pago. El MCP de perfiles no está construido. F2 marca la verificación directa de W3C Verifiable Credentials 2.0 como [NO PUDE ABRIRLA]; por eso no se afirma que TEMIS tenga disponible un estándar, emisor o servicio de revocación específico. Fuentes: E1 y F2, abiertos el 3 de octubre de 2026; se conserva el límite de acceso a fuentes informado por F2.

### Antecedentes y fallas de marketplaces de servicios

Las comparaciones de E1 son lecciones de diseño, no una auditoría nueva de esos servicios. Upwork y Fiverr combinan matching, protección de pagos, disputas controladas por la plataforma y reputación en perfiles; sus depósitos protegen arreglos de pago, no la calidad del trabajo profesional. UpCounsel es una comparación más cercana para matching jurídico, pero E1 no encontró un depósito de garantía de desempeño verificado en las fuentes revisadas. LegalZoom vende documentos y servicios de cumplimiento, por lo que no equivale a un marketplace de abogados. Fuente: E1, abierto el 3 de octubre de 2026; aplican los límites de comparación del estudio.

Sobre sistemas de disputas, el estudio B de la primera ola informa que Aragon Court terminó después de que el proyecto dijera que no logró lanzar un sistema de tribunales; su experiencia con subsidios y seguridad fragmentada advierte contra recompensar oferta sin demanda orgánica. UMA separa los casos normales de la escalada con bonos; Reality.eth puede usar un árbitro externo sin token nativo. Ninguno convierte su mecanismo en un fallo judicial ni en un fechado jurídico acreditado. El estudio B también describe que Kleros usa PNK para selección de jurados y gobernanza, mientras EAS y Gitcoin Passport muestran que las atestaciones o comprobaciones de elegibilidad pueden existir sin token propio. Estas comparaciones no prueban que un mecanismo vaya a funcionar para TEMIS. Fuente: estudio B de la primera ola, abierto el 3 de octubre de 2026; las observaciones parciales y no verificadas conservan la calificación del estudio.

Los riesgos recurrentes relevantes para TEMIS son una oferta subsidiada sin demanda que pague, la captura de disputas por la plataforma, reputaciones que se puedan comprar o mover sin procedencia verificable y confundir un depósito con una garantía real de calidad. Las disputas legales siguen fuera de la plataforma; el registro puede reducir el trabajo de reconstrucción, pero no decide responsabilidad. Los perfiles y el historial deberían ser portables, con reglas publicadas para admisión, suspensión, salida y apelación. Fuentes: E1 y estudios A y B de la primera ola, abiertos el 3 de octubre de 2026; consulta [Cómo funciona](./HOW_IT_WORKS.md), consultado el 3 de octubre de 2026.

### Medios de pago y papel de $TEMIS

El activo de testnet es una prueba de concepto de un posible medio de pago, no un instrumento de inversión ni una utilidad de producción. Un servicio también podría pagarse con USDC o XLM. El activo actual es clásico de Stellar; el camino documentado `exact` de x402 admite tokens SEP-41 y no activos clásicos, así que el $TEMIS existente no es en sí una integración x402. No hay un flujo de pago del marketplace construido. Fuentes: registro del token de testnet y estudio técnico C, abiertos el 3 de octubre de 2026; [Cómo funciona](./HOW_IT_WORKS.md), consultado el 3 de octubre de 2026.

| Medio de pago | Qué podría ofrecer en un marketplace futuro | Qué no resuelve o qué condición añade |
| --- | --- | --- |
| $TEMIS | Medio de pago propio del proyecto que se puede probar en testnet | El activo actual no tiene precio, venta, liquidez ni uso productivo; es clásico y no admite el camino documentado `exact` de x402 en Stellar |
| USDC | Unidad de pago adecuada para el camino documentado de x402 en Stellar si se representa como activo SEP-41 admitido | Depende de un emisor externo y no crea demanda de TEMIS ni construye el marketplace |
| XLM | El activo nativo de la red puede usarse en un pago directo de Stellar | El servicio estaría denominado en XLM salvo que se añada una regla de conversión; los estudios no evaluaron ese tratamiento |

Son comparaciones funcionales, no recomendaciones de comprar o mantener activos. Las funciones más ambiciosas sugeridas en E1, como depósito de garantía de la persona abogada, crédito prepago de servicios o sello revocable de membresía, no son funciones del activo actual ni del MVP del marketplace. Son opciones no probadas que podrían crear riesgos financieros, jurídicos, de exclusión o conflicto de interés. E1 finalmente recomienda no tener token de producción hasta que quede un problema medible que las tarifas normales o los medios de pago existentes no resuelvan. Fuentes: E1, F1 y estudio técnico C, abiertos el 3 de octubre de 2026; estudio A de la primera ola, abierto el 3 de octubre de 2026.

### Restricciones de diseño y revisión jurídica en Chile

- **Oferta y disputas:** la oferta de cualquier instrumento de TEMIS no debe depender del número de disputas. Una emisión, recompensa o rendimiento ligado a disputas pagaría por el conflicto y contradiría el incentivo declarado de obtener ingresos por cumplimiento. Fuentes: postura del whitepaper resumida en [Marco legal y límites](./LEGAL_AND_LIMITS.md) y estudios A y B de la primera ola, abiertos el 3 de octubre de 2026.
- **Distribución del riesgo:** la persona abogada propuesta recibe una parte pequeña si se cumple el acuerdo y asume el costo de defensa si se incumple. TEMIS registra y verifica material técnico; no promete pagar, asegurar, garantizar cumplimiento ni decidir disputas. Un diseño futuro debe aclarar quién redacta, quién asume la garantía, quién representa al cliente, quién paga los costos y cómo se declaran conflictos. Fuentes: E1, estudio A de la primera ola y [Marco legal y límites](./LEGAL_AND_LIMITS.md), consultados el 3 de octubre de 2026.
- **Ley chilena de seguros:** los estudios identifican el artículo 4 del DFL 251 como límite relevante si un arreglo futuro califica como seguro. Una persona abogada competente en Chile debe revisar el contrato, la compensación, quién asume el riesgo y la estructura del servicio antes de ofrecer cualquier garantía o cobertura. Este documento no hace una calificación jurídica. Fuentes: estudio D y E1, abiertos el 3 de octubre de 2026; [Marco legal y límites](./LEGAL_AND_LIMITS.md), consultado el 3 de octubre de 2026.
- **Conducta profesional, privacidad y regulación financiera:** antes de un piloto, una persona abogada debe revisar las reglas de admisión y publicidad profesionales, conflictos de interés, tratamiento y eliminación de datos personales, obligaciones de consumo y si el marketplace o el flujo de pago activa requisitos financieros u otras autorizaciones. La investigación no resuelve estas preguntas. Fuentes: estudios D y E1, abiertos el 3 de octubre de 2026; [Marco legal y límites](./LEGAL_AND_LIMITS.md), consultado el 3 de octubre de 2026.

### Evaluación RUC-D del marketplace propuesto

El marketplace agrega capas al registro de acuerdos existente. Según la lectura RUC-D de E1, el expediente es excluible y poco sustraíble; los digests y anclajes públicos no son sustraíbles y tienden a ser un bien público; el tiempo profesional es escaso y excluible; las cuentas, claves y alojamiento del operador son infraestructura controlada; y membresía, ranking o reputación serían escasez de diseño cuyas reglas podría cambiar el operador. La capa comunitaria para admisión, salida y apelación aún no tiene proveedor asignado. Son clasificaciones de diseño, no evidencia de un marketplace activo. Fuente: E1 y estudio A de la primera ola, abiertos el 3 de octubre de 2026.

El haz de derechos propuesto es asimétrico. Los clientes necesitan acceso a sus copias y poder declarar, confirmar o impugnar sus hitos. Las personas abogadas necesitan acceso a sus encargos, pago por trabajo cumplido y una vía justa de apelación si se les excluye. Notarios y verificadores independientes necesitan acceso acotado y pago, sin control de resultados. El operador cobraría tarifas y gestionaría admisión, formatos e infraestructura, por lo que tendría poder práctico de exclusión. No debe decidir disputas legales ni ser el único verificador de sus propios registros. Fuente: E1, abierto el 3 de octubre de 2026; los límites actuales del registro están en [Cómo funciona](./HOW_IT_WORKS.md), consultado el 3 de octubre de 2026.

La extracción y la provisión no se equilibran solo con tarifas. El operador, la persona abogada, el notario y el verificador podrían cobrar; los clientes aportan datos y evidencias, mientras profesionales, notarios y verificadores aportan trabajo jurídico, atestación pública y reconstrucción. Aún faltan responsables designados y fondos para alojar y conservar todo el historial, moderar y mantener un proceso de apelación. El principal riesgo RUC-D es la subprovisión junto con el cercamiento: el operador podría cerrar el directorio profesional o retener el historial de reputación. Los criterios de entrada publicados, la apelación y los registros portables son salvaguardas propuestas, no garantías implementadas. Fuente: E1 y estudio A de la primera ola, abiertos el 3 de octubre de 2026.

### Exclusiones del MVP y estudios pendientes

El MVP de marketplace descrito en estos estudios no emitiría un token ligado a disputas, no vendería seguros ni cobertura de incumplimiento, no resolvería disputas, no vendería prioridad en rankings, no crearía reputación transferible, no pondría datos de clientes o contenido de expedientes en cadena y no dejaría que el operador controlara admisiones y apelaciones sin proceso publicado. No están construidos el marketplace, un catálogo de abogados, perfiles, el MCP, escrow, integración de credenciales profesionales ni pagos del marketplace. El token actual de testnet no implementa depósito, crédito prepago, membresía, rendimiento ni gobernanza. Fuentes: E1, F2 y estudios A y B de la primera ola, abiertos el 3 de octubre de 2026; [Cómo funciona](./HOW_IT_WORKS.md), consultado el 3 de octubre de 2026.

Antes de un piloto falta medir disposición a pagar, tarifas reales, tasas de cumplimiento y disputa, costo esperado de defensa de una persona abogada, fuente y proceso de actualización de credenciales, reglas de retención de datos y apelación, y clasificación jurídica en Chile de garantías y pagos propuestos. Los estudios no verificaron estas cantidades. Sus cifras siguen siendo ilustrativas y el marketplace continúa sin construirse. Fuentes: E1, F1, F2 y estudio D, abiertos el 3 de octubre de 2026.

Las fuentes publicadas no verifican la disponibilidad actual ni el servicio de revocación de un emisor chileno de credenciales para abogados, un MCP de perfiles profesionales TEMIS desplegado ni un marketplace jurídico chileno activo con depósito de garantía de cumplimiento. F2 marca la verificación directa de W3C VC Data Model 2.0 como [NO PUDE ABRIRLA]; aquí no se afirma disponibilidad de un estándar específico. Fuentes: E1 y F2, abiertos el 3 de octubre de 2026.
