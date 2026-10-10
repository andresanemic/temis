'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const config = require('../tokenomics/token-config.temis.json');
const ejecutarEmision = import('../scripts/token-testnet.mjs').then((m) => m.ejecutarEmision);

function adaptadorFalso({ passphrase = 'Test SDF Network ; September 2015', fallarEn } = {}) {
  const llamadas = [];
  return {
    llamadas,
    passphrase,
    async crearCuentas() { return Object.fromEntries(['issuer', 'distribuidora', 'tesoreria', 'ecosistema', 'liquidez', 'asesores', 'contingencia', 'andres', 'francisco', 'prueba'].map((x) => [x, { publicKey: `G${x}`, secret: `S${'A'.repeat(55)}` }])); },
    async ejecutarPaso(paso, indice) { llamadas.push(paso.tipo); if (indice === fallarEn) { fallarEn = undefined; throw new Error('fallo simulado'); } return { hash: `hash-${indice}`, ledger: indice, hora: '2026-10-03T00:00:00.000Z' }; },
    async reclamarTemprano() { throw new Error('too_early'); },
    async verificarEmision() { return { ok: true, comprobaciones: [{ nombre: 'red simulada', ok: true, detalle: 'lectura inyectada' }] }; },
  };
}

test('el ejecutor reanuda sin repetir pasos completados y no filtra secretos al recibo', async () => {
  const root = fs.mkdtempSync(path.join(__dirname, 'tmp-token-'));
  try {
    const stateFile = path.join(root, 'state.json');
    const outputFile = path.join(root, 'token.json');
    const consola = [];
    const adapter = adaptadorFalso({ fallarEn: 2 });
    await assert.rejects(ejecutarEmision.then((run) => run({ adaptador: adapter, config, stateFile, outputFile, logger: (x) => consola.push(x), ahora: () => new Date('2026-10-03T00:00:00.000Z'), ejecutarSpawn: () => ({ status: 0 }) })), /fallo simulado/);
    const count = adapter.llamadas.length;
    await ejecutarEmision.then((run) => run({ adaptador: adapter, config, stateFile, outputFile, logger: (x) => consola.push(x), ahora: () => new Date('2026-10-03T00:00:00.000Z'), ejecutarSpawn: () => ({ status: 0 }) }));
    const segunda = adapter.llamadas.slice(count);
    assert.equal(segunda.includes('fondeo'), false);
    assert.equal(segunda.includes('emision'), true);
    const countCompleta = adapter.llamadas.length;
    await ejecutarEmision.then((run) => run({ adaptador: adapter, config, stateFile, outputFile, logger: (x) => consola.push(x), ahora: () => new Date('2026-10-03T00:00:00.000Z'), ejecutarSpawn: () => ({ status: 0 }) }));
    assert.equal(consola.join('\n').match(/S[A-Z2-7]{55}/g), null);
    assert.deepEqual(adapter.llamadas.slice(countCompleta), []);
    assert.equal(JSON.parse(fs.readFileSync(stateFile, 'utf8')).reclamoTemprano.correcto, true);
    const configCambiada = structuredClone(config);
    configCambiada.vesting.demoMinutos += 1;
    await assert.rejects(ejecutarEmision.then((run) => run({ adaptador: adapter, config: configCambiada, stateFile, outputFile })), /configuración cambió/);
    const archivos = [];
    function recorrer(dir) {
      for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
        const archivo = path.join(dir, entrada.name);
        if (entrada.isDirectory()) recorrer(archivo);
        else archivos.push(archivo);
      }
    }
    recorrer(root);
    for (const archivo of archivos) assert.equal(fs.readFileSync(archivo, 'utf8').match(/S[A-Z2-7]{55}/g), null, `secreto detectado en ${path.basename(archivo)}`);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('el ejecutor rechaza una frase de red distinta antes de operar', async () => {
  const root = fs.mkdtempSync(path.join(__dirname, 'tmp-token-net-'));
  const adapter = adaptadorFalso({ passphrase: 'Public Global Stellar Network ; September 2015' });
  try {
    await assert.rejects(ejecutarEmision.then((run) => run({ adaptador: adapter, config, stateFile: path.join(root, 'state.json'), outputFile: path.join(root, 'token.json') })), /solo testnet/);
    assert.equal(adapter.llamadas.length, 0);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('guardarJson reintenta un rename que Windows rechaza de forma transitoria (EPERM, EBUSY) y no deja el archivo temporal', async () => {
  const fs = require('node:fs');
  const os = require('node:os');
  const path = require('node:path');
  const { guardarJson } = await import('../scripts/token-testnet.mjs');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'temis-rename-'));
  const destino = path.join(dir, 'estado.json');
  const real = fs.renameSync;
  let intentos = 0;
  fs.renameSync = (a, b) => { intentos += 1; if (intentos <= 3) { const e = new Error('rename bloqueado'); e.code = intentos === 2 ? 'EBUSY' : 'EPERM'; throw e; } return real(a, b); };
  try {
    guardarJson(destino, { ok: true }, undefined, () => ({ status: 0 }));
  } finally { fs.renameSync = real; }
  assert.equal(intentos, 4, 'reintenta hasta que el sistema deja renombrar');
  assert.deepEqual(JSON.parse(fs.readFileSync(destino, 'utf8')), { ok: true });
  assert.deepEqual(fs.readdirSync(dir), ['estado.json'], 'sin temporales');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('registrosCompletos termina cuando Horizon devuelve una pagina vacia (su enlace next existe siempre)', async () => {
  const { registrosCompletos } = await import('../scripts/token-testnet.mjs');
  let llamadas = 0;
  const pagina = (records) => ({ records, next: async () => { llamadas += 1; if (llamadas > 20) throw new Error('bucle: sigue pidiendo paginas vacias'); return pagina(llamadas === 1 ? [{ id: 'b' }] : []); } });
  const consumidor = { call: async () => pagina([{ id: 'a' }]) };
  const todos = await registrosCompletos(consumidor);
  assert.deepEqual(todos.map((r) => r.id), ['a', 'b']);
  assert.ok(llamadas <= 3);
});

test('resultadoDeXdr nombra el resultado de la operacion fallida que Horizon deja en la transaccion (reclamo temprano rechazado)', async () => {
  const { resultadoDeXdr } = await import('../scripts/token-testnet.mjs');
  // resultado real de testnet: un reclamo de balance antes de su hora
  assert.equal(resultadoDeXdr('AAAAAAAAAGT/////AAAAAQAAAAAAAAAP/////gAAAAA='), 'claimClaimableBalanceCannotClaim');
  assert.equal(resultadoDeXdr('no es xdr'), null);
  assert.equal(resultadoDeXdr(undefined), null);
});
