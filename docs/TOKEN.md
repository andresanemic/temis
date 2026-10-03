# $TEMIS token: testnet experiment and design study

## Status and RUC-D reading

$TEMIS is a classic Stellar asset issued on testnet on 3 October 2026 as a mechanics experiment. The project receipts say this decision followed the tokenomics study and changed the earlier whitepaper statement that no token would be issued in v1. The issue is not evidence of an economic need: the RUC-D study found no measured economic problem that a token solved better than fees or x402.

RUC-D orders the work before tokenomics: institutional relationship, resource or flow, actors and rights, rules and authorities, proof and verifiers, architecture, then tokenomics only if a measured economic problem remains. The study treats “no token” as a valid outcome. The token was nevertheless issued in testnet because the project owner directed its creation for the MVP, explicitly as a mechanics experiment with no value, price, liquidity, sale, or promise. This distinction matters: issuance is a recorded experiment, not the study's recommendation for a production token.

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
| Founders | 15% | 15,000,000 | 7,500,000 each for Andrés Peña and Francisco Toro in the configuration, split 50/50 |
| **Total** | **100%** | **100,000,000** | Fixed issue; no issuance formula based on case or dispute counts |

The manifest's independently read testnet balances show the one-token demonstration outside the liquidity account and 9,999,999 TEMIS remaining there. The demonstration's early claim failed with `claimClaimableBalanceCannotClaim`; its later claim succeeded. The test confirms those transactions and does not establish a real vesting entitlement.

### Founder vesting and Francisco's test slot

The test configuration starts 3 October 2026, has a 12-month cliff, then 36 monthly claimable-balance tranches through 3 September 2030. The reserve is split 50/50 between Andrés and Francisco. On testnet the two schedules are represented by 72 claimable balances. Francisco's test account is only a slot: his real tranches exist only on mainnet if he accepts them in writing. The testnet schedule does not prove his acceptance or create a mainnet allocation.

## Technical design and observed checks

- **Asset:** classic Stellar asset code `TEMIS`, issued on Stellar testnet.
- **Supply:** one fixed issue of 100,000,000.0000000 TEMIS. The manifest stores 1,000,000,000,000,000 stroops, consistent with seven decimal places.
- **Issuer:** issuer master weight and thresholds set to zero, no additional signers. The issuer is locked after distribution.
- **Flags:** `AUTH_REQUIRED`, `AUTH_REVOCABLE`, `AUTH_IMMUTABLE`, and `CLAWBACK_ENABLED` are all false. The experiment has no authorization gate and no clawback control.
- **Distribution:** separate accounts for treasury, ecosystem, liquidity, advisers, contingency, Andrés, Francisco's test slot, and the test account. The manifest and testnet verifier record the balances.
- **Vesting:** claimable balances with time predicates, rather than a linear-vesting contract. The source study notes that these unlock in discrete tranches and that claiming requires a trustline.

The token receipt reports an independent Horizon read confirming the locked issuer, flags, total supply, bucket balances, 72 vesting balances, and no issuer balance. These are testnet facts. They do not prove mainnet configuration or audit the future use of any bucket.

## Supply constraint and incentive boundary

Supply must not depend on the number of disputes. A dispute-linked emission would reward conflict and would make the asset's supply rise with adverse cases, contrary to the whitepaper's stated incentive to charge for performance rather than dispute. The testnet configuration is fixed-supply and is not a formula that mints against cases. There is no tribunal, juror staking, arbitration, dispute yield, or performance coverage in the built TEMIS MVP.

## Financing study F1: alternatives and risk

Study F1 recommends considering non-dilutive financing such as the Stellar Community Fund before any token sale. It describes grants and hackathon funding as alternatives to taking money in exchange for tokens. Its own warning is that selling now would conflict with the RUC-D order and with the lack of measured demand or an economic problem that fees do not solve. It also flags the risk of creating a 15% founder reserve before the treasury, ecosystem demand, and record-archive stewardship have working governance. No sale plan is implemented here.

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

The cited external materials and limits are recorded in `_fuentes/estudios/B-antecedentes.md`; partial or unverified sources remain qualified as such. These comparisons are lessons proposed by the study, not proof that any mechanism will work for TEMIS.

## Marketplace direction is not built

The sources discuss a possible lawyer marketplace and separately examine guarantee concepts and a Vespi marketplace for workers and verifiers. They do not establish a TEMIS marketplace of lawyers and guarantors. A marketplace, professional catalog, access-control layer, coverage, and legal guarantees are not built in this MVP. TEMIS currently does not act as an insurer, judge, guarantor, DAO, or marketplace operator.

## Legal limits

The tokenomics studies identify unresolved legal questions in Chile and other jurisdictions, including possible securities, consumer, tax, financial-services, and insurance treatment. The source material does not provide a competent legal opinion. Testnet issuance does not resolve the classification of a future mainnet asset or sale.

Nothing is issued on mainnet or sold without review by a lawyer. No price, liquidity, return, exchange listing, market, or investment value is promised or implied by this experiment.

## Español

### Estado y lectura desde RUC-D

$TEMIS es un activo clásico de Stellar emitido en testnet el 3 de octubre de 2026 como experimento de mecánica. Los recibos del proyecto dicen que esta decisión siguió al estudio de tokenomics y cambió la declaración anterior del whitepaper de no emitir un token en la primera versión. La emisión no demuestra una necesidad económica: el estudio RUC-D no encontró un problema económico medido que un token resolviera mejor que las tarifas o x402.

RUC-D ordena el trabajo antes de la tokenomics: relación institucional, recurso o flujo, actores y derechos, reglas y autoridades, pruebas y verificadores, arquitectura, y solo entonces tokenomics si persiste un problema económico medido. El estudio considera válido concluir que no corresponde tener token. Aun así, se emitió en testnet porque el dueño del proyecto instruyó crear el activo para el MVP, explícitamente como experimento de mecánica sin valor, precio, liquidez, venta ni promesa. La diferencia importa: la emisión es un experimento registrado, no la recomendación del estudio para un token de producción.

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
| Fundadores | 15% | 15.000.000 | 7.500.000 para Andrés Peña y 7.500.000 para Francisco Toro en la configuración, divididos 50/50 |
| **Total** | **100%** | **100.000.000** | Emisión fija; no hay fórmula de emisión según cantidad de casos o disputas |

Los saldos de testnet leídos de forma independiente que aparecen en el manifiesto muestran el token usado en la demostración fuera de la cuenta de liquidez, con 9.999.999 TEMIS restantes allí. La reclamación temprana de demostración falló con `claimClaimableBalanceCannotClaim`; la reclamación posterior tuvo éxito. La prueba confirma esas transacciones, no un derecho real de vesting.

### Vesting de fundadores y ranura de prueba de Francisco

La configuración de prueba comienza el 3 de octubre de 2026, tiene un cliff de 12 meses y luego 36 tramos mensuales de balances reclamables, hasta el 3 de septiembre de 2030. La reserva se divide 50/50 entre Andrés y Francisco. En testnet, ambos calendarios se representan mediante 72 balances reclamables. La cuenta de Francisco es solo una ranura de prueba: sus tramos reales existen en mainnet únicamente si él los acepta por escrito. El calendario de testnet no prueba su aceptación ni crea una asignación en mainnet.

### Diseño técnico y comprobaciones observadas

- **Activo:** activo clásico de Stellar con código `TEMIS`, emitido en testnet.
- **Oferta:** emisión única fija de 100.000.000,0000000 TEMIS. El manifiesto guarda 1.000.000.000.000.000 stroops, consistente con siete decimales.
- **Emisora:** peso maestro y umbrales en cero, sin firmantes adicionales. La emisora queda bloqueada después de distribuir.
- **Banderas:** `AUTH_REQUIRED`, `AUTH_REVOCABLE`, `AUTH_IMMUTABLE` y `CLAWBACK_ENABLED` están en falso. El experimento no tiene filtro de autorización ni control de clawback.
- **Distribución:** cuentas separadas para tesorería, ecosistema, liquidez, asesores, contingencia, Andrés, la ranura de Francisco y la cuenta de prueba. El manifiesto y el verificador de testnet registran los saldos.
- **Vesting:** balances reclamables con predicados de tiempo, no un contrato de vesting lineal. El estudio indica que se desbloquean en tramos discretos y que para reclamarlos se necesita una trustline.

El recibo del token informa una lectura independiente desde Horizon que confirmó la emisora bloqueada, las banderas, la oferta total, los saldos de las cubetas, 72 balances de vesting y saldo cero en la emisora. Son hechos de testnet. No demuestran la configuración de mainnet ni auditan el uso futuro de ninguna cubeta.

### Restricción de oferta e incentivos

La oferta no puede depender del número de disputas. Una emisión ligada a disputas premiaría el conflicto y haría crecer la oferta junto con casos adversos, en contra del incentivo declarado por el whitepaper de cobrar por el cumplimiento y no por la controversia. La configuración de testnet tiene oferta fija y no acuña según el número de casos. El MVP construido no tiene tribunal, staking de jurados, arbitraje, rendimiento por disputas ni cobertura de cumplimiento.

### Estudio F1 de financiamiento: alternativas y riesgos

El estudio F1 recomienda considerar financiamiento no dilutivo, como el Stellar Community Fund, antes de cualquier venta de tokens. Describe subvenciones y fondos para hackatones como alternativas a recibir dinero a cambio de tokens. Su advertencia es que vender hoy contradice el orden RUC-D y la falta de demanda medida o de un problema económico que las tarifas no resuelvan. También señala el riesgo de crear una reserva de fundadores de 15% antes de contar con gobernanza operativa para la tesorería, la demanda del ecosistema y la custodia del archivo del historial. Aquí no se implementa ningún plan de venta.

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

Los materiales externos citados y sus límites se registran en `_fuentes/estudios/B-antecedentes.md`; las fuentes parciales o no verificadas se mantienen calificadas. Estas comparaciones son lecciones propuestas por el estudio, no pruebas de que un mecanismo funcione para TEMIS.

### La dirección marketplace no está construida

Las fuentes analizan un posible marketplace de abogados y, por separado, conceptos de garantía y un marketplace de trabajadores y verificadores de Vespi. No establecen que exista un marketplace TEMIS de abogados y garantes. Un marketplace, catálogo profesional, capa de control de acceso, cobertura y garantías jurídicas no están construidos en este MVP. TEMIS no actúa hoy como aseguradora, juez, garante, DAO ni operador de marketplace.

### Límites legales

Los estudios de tokenomics identifican preguntas jurídicas abiertas en Chile y otras jurisdicciones, entre ellas el posible tratamiento como valor, y las normas de consumo, tributarias, financieras y de seguros. Las fuentes no contienen una opinión jurídica de una persona competente. La emisión en testnet no resuelve la clasificación de un activo futuro en mainnet ni de una venta.

No se emite nada en mainnet ni se vende sin revisión de una persona abogada. Este experimento no promete ni implica precio, liquidez, rendimiento, listado en una plataforma de intercambio, mercado ni valor de inversión.
