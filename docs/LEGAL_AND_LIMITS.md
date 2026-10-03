# Legal framework and limits

## Chilean provisions cited by the whitepaper

This summary reports what the supplied whitepaper says about Chilean law. It is not legal advice, and the whitepaper itself states that its legal section has not been reviewed by a competent legal professional. This repository does not claim that TEMIS complies with any law or that a court will accept a TEMIS record as evidence.

**Electronic signatures and dates.** The whitepaper cites Law 19.799, article 2(g), for the definition of an advanced electronic signature as one certified by an accredited provider. It cites article 5 for the evidentiary treatment of a private document signed with an advanced electronic signature and notes that this does not establish its date unless an accredited provider's electronic timestamp is present. The whitepaper expressly distinguishes an ed25519 signature and a Stellar ledger close from those legal mechanisms. TEMIS does not claim its signatures are advanced electronic signatures or that its anchor is an accredited timestamp.

**Health data example.** The whitepaper cites Law 20.584, article 13, including rules it describes for third-party access with authorization and access by lawyers or prosecutors with prior authorization from the competent judge and a connection to their work. It also cites transitional article 3 of Law 21.668 on updating the relevant regulation. The status of that update was not confirmed in the source materials. TEMIS is not presented as a channel for accessing clinical records; the whitepaper describes it only as a possible record of who requested access, with what authorization, and when.

**Data protection reform.** The whitepaper states that Law 21.719 was published on 13 December 2024 with deferred entry into force on 1 December 2026, and that Bulletin 18.623-07 proposed moving that date to 1 December 2027 but remained a bill at the time of the source check on 2 October 2026. It references provisions on processors, high-risk impact assessments, sensitive data, rights claims, and biometrics. The date and bill status are reproduced from the supplied source and have not been independently rechecked for this repository.

**Insurance and the proposed lawyer model.** The underlying Not Ponzi concept describes a lawyer who prepares an agreement without hourly billing, receives a small share if it is fulfilled, and assumes the cost of defending the client if it is breached. In that proposal the lawyer takes on risk, which is why the concept can be described as making the lawyer act like the client's insurer. This describes the lawyer's proposed economic role; it does not make TEMIS an insurer or give TEMIS a duty to cover a breach. The whitepaper quotes article 4 of DFL 251 regarding who may conduct insurance business in Chile and says TEMIS v1 offers no breach coverage. If an arrangement of this kind qualifies as insurance, a lawyer must review it under DFL 251 before it is offered. The repository does not offer insurance, guarantee performance, or promise to pay for a breach.

## What TEMIS does not claim

- An ed25519 signature establishes a civil identity, legal capacity, free consent, or advanced electronic signature status.
- A Stellar `MEMO_HASH` proves the contents or truth of the document, provides an accredited timestamp, or gives automatic legal evidentiary value.
- A technically reconstructed record determines breach, fault, entitlement, or admissibility in court.
- A token's testnet issuance determines its classification under securities, financial, consumer, tax, or other laws.
- The MVP is legally compliant, production-ready, or reviewed by a lawyer.

## Open legal questions

- What form of signature, identity verification, informed consent, and professional supervision would be appropriate for any real deployment?
- Which retention, deletion, access, correction, and data-controller rules apply to agreement bodies and supporting evidence in each sector?
- What legal effect, if any, would courts or counterparties give to a TEMIS record and its testnet-derived workflow?
- What licensing or insurance structure would be required if a future service offered performance coverage or dispute resolution?
- What legal, tax, consumer, and financial rules would apply before any $TEMIS issuance on mainnet or sale?
- What is the current implementation status of the cited health-data regulation and the proposed change to Law 21.719's commencement date?

No mainnet issuance or token sale should occur without review by a lawyer. The token document states this condition explicitly; this repository makes no claim that such review has happened.

## Español

### Normas chilenas citadas por el whitepaper

Este resumen informa lo que el whitepaper suministrado dice sobre la legislación chilena. No es asesoría legal, y el propio whitepaper dice que una persona competente en derecho no ha revisado su sección jurídica. Este repositorio no afirma que TEMIS cumpla una ley ni que un tribunal vaya a admitir como prueba un registro TEMIS.

**Firmas electrónicas y fechas.** El whitepaper cita la Ley 19.799, artículo 2 letra g), para definir la firma electrónica avanzada como aquella certificada por un prestador acreditado. Cita el artículo 5 respecto del valor probatorio de un documento privado suscrito con firma electrónica avanzada y señala que eso no acredita su fecha salvo que conste un fechado electrónico de un prestador acreditado. El whitepaper distingue expresamente entre una firma ed25519, el cierre de un ledger de Stellar y esos mecanismos jurídicos. TEMIS no afirma que sus firmas sean firmas electrónicas avanzadas ni que su anclaje sea un fechado acreditado.

**Ejemplo de datos de salud.** El whitepaper cita la Ley 20.584, artículo 13, incluidas las reglas que describe para el acceso de terceros con autorización y el acceso por abogados o fiscales con autorización previa del juez competente y relación con su labor. También cita el artículo tercero transitorio de la Ley 21.668 sobre la actualización del reglamento pertinente. Las fuentes no confirmaron el estado de esa actualización. TEMIS no se presenta como canal de acceso a fichas clínicas; el whitepaper lo describe solo como un posible registro de quién pidió acceso, con qué autorización y cuándo.

**Reforma de protección de datos.** El whitepaper indica que la Ley 21.719 se publicó el 13 de diciembre de 2024 y entraría en vigor de forma diferida el 1 de diciembre de 2026; también dice que el Boletín 18.623-07 proponía trasladar esa fecha al 1 de diciembre de 2027, pero seguía siendo un proyecto al momento de consultar las fuentes el 2 de octubre de 2026. Menciona normas sobre encargados del tratamiento, evaluaciones de impacto de alto riesgo, datos sensibles, ejercicio de derechos y biometría. La fecha y el estado del proyecto se reproducen de la fuente suministrada y no se volvieron a comprobar para este repositorio.

**Seguros y modelo propuesto para profesionales.** El concepto Not Ponzi describe a una persona abogada que prepara el acuerdo sin cobrar por hora, recibe una parte pequeña si se cumple y asume el costo de defender al cliente si se incumple. En esa propuesta, la persona abogada asume un riesgo; por eso puede decirse que actúa como aseguradora de su cliente. Esto describe el papel económico propuesto para esa persona, no convierte a TEMIS en aseguradora ni impone a TEMIS la obligación de cubrir un incumplimiento. El whitepaper cita el artículo 4 del DFL 251 sobre quién puede desarrollar actividades de seguros en Chile y dice que TEMIS v1 no ofrece cobertura por incumplimiento. Si un arreglo de este tipo califica como seguro, una persona abogada debe revisarlo bajo el DFL 251 antes de ofrecerlo. El repositorio no ofrece seguros, garantiza el cumplimiento ni promete pagar por un incumplimiento.

### Lo que TEMIS no afirma

- Una firma ed25519 acredita identidad civil, capacidad jurídica, consentimiento libre o calidad de firma electrónica avanzada.
- Un `MEMO_HASH` de Stellar prueba el contenido o verdad del documento, proporciona un fechado acreditado o le da valor probatorio jurídico automático.
- Reconstruir técnicamente un registro determina incumplimiento, culpa, derechos o admisibilidad ante un tribunal.
- Emitir un token en testnet determina su clasificación conforme a normas de valores, financieras, de consumo, tributarias u otras.
- El MVP cumple la ley, está listo para producción o fue revisado por un abogado.

### Preguntas jurídicas abiertas

- ¿Qué forma de firma, verificación de identidad, consentimiento informado y supervisión profesional sería adecuada para un despliegue real?
- ¿Qué reglas de retención, eliminación, acceso, corrección y tratamiento aplican a los cuerpos de acuerdos y a la evidencia en cada sector?
- ¿Qué efecto jurídico, si alguno, darían los tribunales o las contrapartes a un registro TEMIS y a su flujo probado en testnet?
- ¿Qué licencia o estructura de seguros se necesitaría si un servicio futuro ofreciera cobertura de cumplimiento o resolución de controversias?
- ¿Qué normas jurídicas, tributarias, de consumo y financieras aplicarían antes de emitir $TEMIS en mainnet o venderlo?
- ¿Cuál es el estado actual de la regulación de datos de salud citada y del cambio propuesto a la fecha de entrada en vigor de la Ley 21.719?

No se debe emitir en mainnet ni vender tokens sin revisión de una persona abogada. El documento del token establece esta condición; el repositorio no afirma que esa revisión ya haya ocurrido.
