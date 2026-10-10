'use strict';
// Paso 8 del §17: first-write-wins con dos escrituras REALMENTE concurrentes del mismo expediente, en testnet.
// Dos procesos distintos anclan, a la vez y desde la misma cuenta ancla, dos lineas que compiten por la misma clave
// (expediente, hito, version) y citan la misma linea anterior. La red las ordena como quiera; la regla del whitepaper es que
// solo cuenta la primera que la red acepta. Se comprueba que (a) las dos quedan en el historial, (b) la reconstruccion declara
// ganadora a la primera por (ledger, indice) y perdedora a la otra, calculado aparte por este script desde el libro crudo, y
// (c) dos reconstrucciones del mismo libro, con el libro en orden distinto, dan lo mismo.
// Uso: node scripts/carrera-testnet.cjs [rondas]. Escribe tramos/4/carrera.json. Solo testnet, cuentas y datos de fantasia.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { generateKeyPairSync } = require('node:crypto');
const sdk = require('@stellar/stellar-sdk');
const cf = require('../src/canonical.js');
const f = require('../src/firma.js');
const cad = require('../src/cadena.js');
const ancla = require('../src/ancla.js');
const { friendbot, dormir } = require('./lib/testnet.cjs');

const SALIDA = path.join(__dirname, '..', 'tramos', '4');

// ---------- proceso hijo: ancla un digest cuando llegue la hora de arranque ----------
async function hijo(rutaConfig) {
  const cfg = JSON.parse(fs.readFileSync(rutaConfig, 'utf8'));
  const par = sdk.Keypair.fromSecret(cfg.secreto);
  const servidor = new sdk.Horizon.Server(ancla.RED.horizon);
  const espera = cfg.arranque_ms - Date.now();
  if (espera > 0) await dormir(espera);
  const inicio = Date.now();
  let intentos = 0;
  for (;;) {
    intentos += 1;
    try {
      const r = await ancla.anclar({ servidor, par, digest: cfg.digest });
      console.log(JSON.stringify({ digest: cfg.digest, hash: r.hash, ledger: r.ledger, intentos, ms: Date.now() - inicio }));
      return;
    } catch (e) {
      const motivo = JSON.stringify(e?.response?.data?.extras?.result_codes ?? e?.message ?? String(e));
      if (intentos >= 8) { console.log(JSON.stringify({ digest: cfg.digest, error: motivo, intentos })); process.exit(2); }
      if (!/bad_seq/.test(motivo)) await dormir(500);
    }
  }
}

// ---------- proceso padre ----------
const par = () => {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  return { privateKey, hex: Buffer.from(publicKey.export({ format: 'jwk' }).x, 'base64url').toString('hex') };
};

function lanzarHijo(secreto, digest, arranque_ms) {
  return new Promise((resolve) => {
    const ruta = path.join(os.tmpdir(), `temis-carrera-${process.pid}-${digest.slice(0, 8)}.json`);
    fs.writeFileSync(ruta, JSON.stringify({ secreto, digest, arranque_ms }));
    const p = spawn(process.execPath, [__filename, 'hijo', ruta], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { err += d; });
    p.on('close', (codigo) => {
      fs.rmSync(ruta, { force: true });
      let json = null;
      try { json = JSON.parse(out.trim().split('\n').pop()); } catch { /* sin salida */ }
      resolve({ codigo, json, err: err.slice(0, 300) });
    });
  });
}

async function ronda(numero) {
  const servidor = new sdk.Horizon.Server(ancla.RED.horizon);
  const cuentaAncla = sdk.Keypair.random();
  await friendbot(cuentaAncla.publicKey());
  const alice = par(); const bob = par(); const operador = par();
  const EXP = `carrera-${Date.now().toString(36)}-${numero}`;
  const firma = (cuerpo, k) => ({ clave_publica: k.hex, firma: f.firmar(k.privateKey, f.sobreDeFirma(cuerpo)) });
  const archivo = [];
  let cabeza = null;
  const L = (o) => cad.construirLinea({ expediente_id: EXP, hito: null, version: 1, anterior: cabeza, contenido: {}, anula: null, ...o });
  const sembrar = async (cuerpo, firmantes) => {
    const digest = cf.digest(cuerpo);
    archivo.push({ digest, cuerpo, firmas: firmantes.map((k) => firma(cuerpo, k)) });
    await ancla.anclar({ servidor, par: cuentaAncla, digest });
    cabeza = digest;
    return cuerpo;
  };
  await sembrar(L({ evento: 'acuerdo', anterior: null, contenido: { partes: [{ id: 'alice', clave_publica: alice.hex }, { id: 'bob', clave_publica: bob.hex }], operador: operador.hex, cuenta_ancla: cuentaAncla.publicKey(), sector: 'sintetico' } }), [alice, bob]);
  await sembrar(L({ hito: 'h1', evento: 'hito_abierto', contenido: {} }), [operador]);

  // Las dos lineas que compiten: misma clave, misma cita, contenido distinto.
  const cita = cabeza;
  const A = L({ hito: 'h1', evento: 'declaracion', anterior: cita, contenido: { parte: 'alice', n: 1, nota: 'escritura A' } });
  const B = L({ hito: 'h1', evento: 'declaracion', anterior: cita, contenido: { parte: 'alice', n: 2, nota: 'escritura B' } });
  for (const c of [A, B]) archivo.push({ digest: cf.digest(c), cuerpo: c, firmas: [firma(c, alice)] });

  const arranque = Date.now() + 4000;
  const [ra, rb] = await Promise.all([
    lanzarHijo(cuentaAncla.secret(), cf.digest(A), arranque),
    lanzarHijo(cuentaAncla.secret(), cf.digest(B), arranque),
  ]);
  if (!ra.json?.hash || !rb.json?.hash) throw new Error(`una escritura no se ancló: A=${JSON.stringify(ra)} B=${JSON.stringify(rb)}`);

  await dormir(2000);
  const libro = await ancla.leerLibro({ servidor, cuenta: cuentaAncla.publicKey() });
  const propios = new Set(archivo.map((e) => e.digest));
  const delExpediente = libro.filter((t) => t.memo && propios.has(t.memo));
  const rec = cad.reconstruir({ libro: delExpediente, archivo });
  const recInverso = cad.reconstruir({ libro: [...delExpediente].reverse(), archivo });

  const dA = cf.digest(A);
  const dB = cf.digest(B);
  const txA = delExpediente.find((t) => t.memo === dA);
  const txB = delExpediente.find((t) => t.memo === dB);
  // El ganador esperado, calculado aqui desde el libro crudo, sin pasar por la reconstruccion.
  const antes = (x, y) => (x.ledger !== y.ledger ? x.ledger < y.ledger : x.indice < y.indice);
  const esperada = antes(txA, txB) ? dA : dB;
  const estatus = (r, d) => r.lineas.find((l) => l.digest === d)?.estatus;
  const resultado = {
    ronda: numero,
    expediente: EXP,
    cuenta_ancla: cuentaAncla.publicKey(),
    escritura_A: { digest: dA, ...ra.json, orden_en_red: { ledger: txA.ledger, indice: txA.indice } },
    escritura_B: { digest: dB, ...rb.json, orden_en_red: { ledger: txB.ledger, indice: txB.indice } },
    mismo_ledger: txA.ledger === txB.ledger,
    ganadora_esperada: esperada === dA ? 'A' : 'B',
    estatus_A: estatus(rec, dA),
    estatus_B: estatus(rec, dB),
    estatus_A_libro_invertido: estatus(recInverso, dA),
    estatus_B_libro_invertido: estatus(recInverso, dB),
  };
  resultado.ok = estatus(rec, esperada) === 'vigente'
    && estatus(rec, esperada === dA ? dB : dA) === 'perdedora'
    && resultado.estatus_A === resultado.estatus_A_libro_invertido
    && resultado.estatus_B === resultado.estatus_B_libro_invertido;
  console.log(`ronda ${numero}: gana ${resultado.ganadora_esperada} (A ledger ${txA.ledger}/${txA.indice}, B ledger ${txB.ledger}/${txB.indice}; intentos A=${ra.json.intentos} B=${rb.json.intentos}) -> A ${resultado.estatus_A}, B ${resultado.estatus_B}, ok=${resultado.ok}`);
  return resultado;
}

async function main() {
  const rondas = Number(process.argv[2] || 3);
  const resultados = [];
  for (let i = 1; i <= rondas; i += 1) resultados.push(await ronda(i));
  const resumen = {
    fecha: new Date().toISOString(),
    red: ancla.RED.caip2,
    rondas: resultados.length,
    todas_ok: resultados.every((r) => r.ok),
    ganan_A: resultados.filter((r) => r.ganadora_esperada === 'A').length,
    ganan_B: resultados.filter((r) => r.ganadora_esperada === 'B').length,
    en_el_mismo_ledger: resultados.filter((r) => r.mismo_ledger).length,
    resultados,
  };
  fs.mkdirSync(SALIDA, { recursive: true });
  fs.writeFileSync(path.join(SALIDA, 'carrera.json'), `${JSON.stringify(resumen, null, 2)}\n`);
  console.log(JSON.stringify({ rondas: resumen.rondas, todas_ok: resumen.todas_ok, ganan_A: resumen.ganan_A, ganan_B: resumen.ganan_B, mismo_ledger: resumen.en_el_mismo_ledger }));
  process.exit(resumen.todas_ok ? 0 : 1);
}

if (process.argv[2] === 'hijo') hijo(process.argv[3]).catch((e) => { console.error(e.stack); process.exit(1); });
else main().catch((e) => { console.error('FALLO:', e.stack || e.message); process.exit(1); });
