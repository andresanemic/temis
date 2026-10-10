'use strict';
// Corrida de punta a punta de TEMIS en Stellar testnet con datos sinteticos.
// Camino legitimo: alta, firmas, anclaje, hito, correccion, aceptacion, cierre, hito sin respuesta, impugnacion,
// first-write-wins y controversia. Camino adversarial: ocho lineas que deben ser rechazadas, una por cada motivo.
// Escribe el archivo (cuerpos y firmas) y el libro publico en datos/e2e/ y un recibo en tramos/3/.
// Solo testnet. Las claves de la corrida viven en .claves/ (fuera de git). No usa dinero real ni datos de personas.
const fs = require('node:fs');
const path = require('node:path');
const { generateKeyPairSync, createPrivateKey } = require('node:crypto');
const sdk = require('@stellar/stellar-sdk');
const cf = require('../src/canonical.js');
const f = require('../src/firma.js');
const cad = require('../src/cadena.js');
const ancla = require('../src/ancla.js');

const RAIZ = path.join(__dirname, '..');
const CLAVES = path.join(RAIZ, '.claves', 'claves.json');
const SALIDA = path.join(RAIZ, 'datos', 'e2e');
const EXP = process.env.TEMIS_EXPEDIENTE || `exp-${Date.now().toString(36)}`;

const aTexto = (x) => JSON.stringify(x, (k, v) => (typeof v === 'bigint' ? `@@${v}@@` : v)).replace(/"@@(-?\d+)@@"/g, '$1');

function parEd25519() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  return { hex: Buffer.from(publicKey.export({ format: 'jwk' }).x, 'base64url').toString('hex'), privada: privateKey.export({ format: 'pem', type: 'pkcs8' }) };
}
function cargarClaves() {
  if (fs.existsSync(CLAVES)) return JSON.parse(fs.readFileSync(CLAVES, 'utf8'));
  const k = {
    ancla: sdk.Keypair.random().secret(), ajena: sdk.Keypair.random().secret(),
    alice: parEd25519(), bob: parEd25519(), operador: parEd25519(), carol: parEd25519(), creadas: new Date().toISOString(),
  };
  fs.mkdirSync(path.dirname(CLAVES), { recursive: true });
  fs.writeFileSync(CLAVES, JSON.stringify(k, null, 2));
  return k;
}
const privada = (p) => createPrivateKey(p.privada);

async function fondear(servidor, par) {
  try { await servidor.loadAccount(par.publicKey()); } catch {
    const r = await fetch(`https://friendbot.stellar.org?addr=${par.publicKey()}`);
    if (!r.ok) throw new Error(`friendbot ${r.status}`);
    console.log('cuenta fondeada en testnet:', par.publicKey());
  }
}

async function main() {
  const claves = cargarClaves();
  const par = sdk.Keypair.fromSecret(claves.ancla);
  const parAjena = sdk.Keypair.fromSecret(claves.ajena);
  const servidor = new sdk.Horizon.Server(ancla.RED.horizon);
  await fondear(servidor, par);
  await fondear(servidor, parAjena);

  const archivo = [];
  const anclajes = [];
  const estado = { cabeza: null };
  const L = (o) => cad.construirLinea({ expediente_id: EXP, hito: null, version: 1, anterior: estado.cabeza, contenido: {}, anula: null, ...o });
  const firma = (cuerpo, quien) => ({ clave_publica: claves[quien].hex, firma: f.firmar(privada(claves[quien]), f.sobreDeFirma(cuerpo)) });

  // avanza: la linea entra a la cadena (las rechazadas no se citan). desde: cuenta que ancla. omitir: no va al archivo.
  // adulterar: el archivo trae un cuerpo distinto del anclado.
  async function emitir(cuerpo, firmantes, { avanza = true, desde = par, omitir = false, adulterar = false, nota = null } = {}) {
    const digest = cf.digest(cuerpo);
    if (!omitir) {
      const cuerpoArchivo = adulterar ? { ...cuerpo, contenido: { ...cuerpo.contenido, alterado: true } } : cuerpo;
      archivo.push({ digest, cuerpo: cuerpoArchivo, firmas: firmantes.map((q) => firma(cuerpoArchivo, q)) });
    }
    const r = await ancla.anclar({ servidor, par: desde, digest });
    anclajes.push({ digest, evento: cuerpo.evento, hito: cuerpo.hito, version: cuerpo.version, hash: r.hash, ledger: r.ledger, nota });
    console.log(`  anclada ${cuerpo.evento}${cuerpo.hito ? ' ' + cuerpo.hito : ''} v${cuerpo.version}${nota ? ' [' + nota + ']' : ''} -> ${r.hash.slice(0, 12)}… ledger ${r.ledger}`);
    if (avanza) estado.cabeza = digest;
    return cuerpo;
  }

  console.log(`expediente ${EXP}`);
  await emitir(L({ evento: 'acuerdo', anterior: null, contenido: { partes: [{ id: 'alice', clave_publica: claves.alice.hex }, { id: 'bob', clave_publica: claves.bob.hex }], operador: claves.operador.hex, cuenta_ancla: par.publicKey(), sector: 'sintetico' } }), ['alice', 'bob']);

  // h1: declaracion con error, correccion por anulacion de su autora, nueva declaracion, aceptacion y cierre
  await emitir(L({ hito: 'h1', evento: 'hito_abierto', contenido: { evidencia_exigida: 'informe sintetico' } }), ['operador']);
  const mala = await emitir(L({ hito: 'h1', evento: 'declaracion', contenido: { parte: 'alice', nota: 'declaracion con un error' } }), ['alice']);
  await emitir(L({ hito: 'h1', evento: 'anulacion', anula: cf.digest(mala), contenido: { motivo: 'correccion' } }), ['alice']);
  const buena = await emitir(L({ hito: 'h1', evento: 'declaracion', version: 2, contenido: { parte: 'alice', nota: 'declaracion corregida' } }), ['alice']);
  await emitir(L({ hito: 'h1', evento: 'contraste', contenido: { parte: 'bob', accion: 'aceptar', declaracion: cf.digest(buena) } }), ['bob']);
  await emitir(L({ hito: 'h1', evento: 'cierre', contenido: { resultado: 'cumplido' } }), ['operador']);
  // h2: una parte declara y la otra no responde
  await emitir(L({ hito: 'h2', evento: 'hito_abierto', contenido: { evidencia_exigida: 'entrega sintetica' } }), ['operador']);
  await emitir(L({ hito: 'h2', evento: 'declaracion', contenido: { parte: 'bob', nota: 'entregado' } }), ['bob']);
  await emitir(L({ hito: 'h2', evento: 'cierre', contenido: { resultado: 'cumplido_no_confirmado' } }), ['operador']);
  // h3: dos escrituras de la misma clave con la misma cita (first-write-wins) y una impugnacion
  await emitir(L({ hito: 'h3', evento: 'hito_abierto', contenido: {} }), ['operador']);
  const citaH3 = estado.cabeza;
  const d3 = await emitir(L({ hito: 'h3', evento: 'declaracion', anterior: citaH3, contenido: { parte: 'alice', n: 1 } }), ['alice']);
  await emitir(L({ hito: 'h3', evento: 'declaracion', anterior: citaH3, contenido: { parte: 'alice', n: 2 } }), ['alice'], { avanza: false, nota: 'perdedora esperada' });
  await emitir(L({ hito: 'h3', evento: 'contraste', contenido: { parte: 'bob', accion: 'impugnar', declaracion: cf.digest(d3) } }), ['bob']);
  await emitir(L({ evento: 'controversia', version: 1, contenido: { activada_por: 'bob', profesional: 'por designar', conflicto_declarado: true } }), ['bob']);

  // Camino adversarial: cada linea de abajo debe ser rechazada con su propio motivo; ninguna entra a la cadena.
  console.log('lineas adversariales');
  const cita = estado.cabeza;
  const A = { avanza: false };
  await emitir(L({ hito: 'h4', evento: 'hito_abierto', anterior: cita }), ['operador'], { ...A, desde: parAjena, nota: 'cuenta_no_autorizada esperada' });
  await emitir(L({ hito: 'h3', evento: 'declaracion', version: 2, anterior: cita, contenido: { parte: 'alice', n: 3 } }), ['carol'], { ...A, nota: 'firmas_insuficientes esperada' });
  await emitir(L({ hito: 'h3', evento: 'anulacion', anterior: cita, anula: cf.digest(d3) }), ['bob'], { ...A, nota: 'anulacion_no_valida esperada' });
  await emitir(L({ hito: 'h5', evento: 'hito_abierto', anterior: 'ab'.repeat(32) }), ['operador'], { ...A, nota: 'fuera_de_cadena esperada' });
  await emitir(L({ hito: 'h6', evento: 'hito_abierto', anterior: cita }), ['operador'], { ...A, omitir: true, nota: 'sin_cuerpo esperada' });
  await emitir(L({ hito: 'h3', evento: 'cierre', version: 2, anterior: cita, contenido: { resultado: 'cumplido' } }), ['operador'], { ...A, nota: 'cierre_sin_respaldo esperada' });
  await emitir(L({ hito: 'h1', evento: 'contraste', version: 2, anterior: cita, contenido: { parte: 'bob', accion: 'aceptar' } }), ['bob'], { ...A, nota: 'contraste_sin_objetivo esperada' });
  await emitir(L({ hito: 'h7', evento: 'hito_abierto', anterior: cita }), ['operador'], { ...A, adulterar: true, nota: 'digest_no_coincide esperada' });

  fs.mkdirSync(SALIDA, { recursive: true });
  const libro = await ancla.leerLibro({ servidor, cuenta: par.publicKey() });
  const libroAjeno = await ancla.leerLibro({ servidor, cuenta: parAjena.publicKey() });
  const propios = new Set(anclajes.map((a) => a.digest));
  const libroDelExpediente = [...libro, ...libroAjeno].filter((t) => t.memo && propios.has(t.memo));
  const rec = cad.reconstruir({ libro: libroDelExpediente, archivo });
  const copia = cad.compararConCopia(rec, archivo);

  fs.writeFileSync(path.join(SALIDA, 'archivo.json'), aTexto(archivo));
  fs.writeFileSync(path.join(SALIDA, 'libro.json'), JSON.stringify(libro, null, 2));
  fs.writeFileSync(path.join(SALIDA, 'libro-cuenta-ajena.json'), JSON.stringify(libroAjeno, null, 2));
  const porDigest = new Map(anclajes.map((a) => [a.digest, a]));
  const resumen = {
    fecha: new Date().toISOString(),
    red: ancla.RED.caip2,
    expediente_id: EXP,
    cuenta_ancla: par.publicKey(),
    cuenta_ajena: parAjena.publicKey(),
    anclajes,
    estados: JSON.parse(aTexto(rec.expedientes)),
    estatus_de_lineas: rec.lineas.map((l) => ({ evento: porDigest.get(l.digest)?.evento, hito: porDigest.get(l.digest)?.hito, nota: porDigest.get(l.digest)?.nota, estatus: l.estatus, hash: l.hash, ledger: l.ledger })),
    cotejo_con_la_copia: copia,
  };
  const dirRecibo = path.join(RAIZ, 'tramos', '3');
  fs.mkdirSync(dirRecibo, { recursive: true });
  fs.writeFileSync(path.join(dirRecibo, `corrida-${EXP}.json`), JSON.stringify(resumen, null, 2));
  const conteo = {};
  for (const l of rec.lineas) conteo[l.estatus] = (conteo[l.estatus] || 0) + 1;
  console.log(JSON.stringify({ expediente: rec.expedientes[EXP], estatus: conteo, cotejo: copia }, (k, v) => (typeof v === 'bigint' ? Number(v) : v), 2));
  console.log('archivo y libro en datos/e2e/; recibo en tramos/3/');
}
main().catch((e) => { console.error('E2E_FALLA:', e && e.message ? e.message : e); process.exit(1); });
