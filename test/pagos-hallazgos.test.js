'use strict';
// Hallazgos de la verificacion aparte del modulo de pagos (Advisor, 2026-10-03). Cada prueba reproduce un camino que la
// primera version no cubria: un cobrador lento o tardio, un candado viejo, una entrega concurrente, un texto en NFD.
// Las 11 pruebas de test/pagos.test.js siguen siendo el contrato base; estas son lo que ellas no cubrian.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { abrirTablaPagos, claveDe } = require('../src/pagos.js');

const HIJO = path.join(__dirname, 'fixtures', 'pagos-hijo.js');
const CLAVE = { acuerdo: 'exp-0001', capacidad: 'ancla', pago: 'auth-0001' };
const dirTemp = (t) => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'temis-pagos-h-'));
  t.after(() => fs.rmSync(d, { recursive: true, force: true }));
  return d;
};
function correrHijo(dir, modo, extra = []) {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, [HIJO, dir, modo, ...extra], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { err += d; });
    p.on('close', (codigo) => {
      let json = null;
      try { json = JSON.parse(out.trim().split('\n').filter(Boolean).pop()); } catch { json = null; }
      resolve({ codigo, json, err });
    });
  });
}
const diferido = () => {
  let resolver;
  let rechazar;
  const promesa = new Promise((res, rej) => { resolver = res; rechazar = rej; });
  return { promesa, resolver, rechazar };
};
const T0 = 1_800_000_000_000;

test('un cobro lento que falla tarde no deshace lo que el operador ya resolvio como liquidado', async (t) => {
  const dir = dirTemp(t);
  const lento = diferido();
  const t1 = abrirTablaPagos(dir, { ahora: () => T0, ttlMs: 30000 });
  const primera = t1.liquidar(CLAVE, () => lento.promesa);
  const t2 = abrirTablaPagos(dir, { ahora: () => T0 + 120000, ttlMs: 30000 });
  assert.equal((await t2.liquidar(CLAVE, async () => ({ tx: 'no' }))).estado, 'incierto');
  assert.equal((await t2.resolver(CLAVE, { tx: 'TX-REAL', ledger: 5 })).estado, 'liquidado');
  lento.rechazar(new Error('timeout tardio'));
  await primera;
  const final = await t2.liquidar(CLAVE, async () => ({ tx: 'no' }));
  assert.equal(final.estado, 'liquidado', 'el fallo tardio no baja un liquidado a incierto');
  assert.equal(final.resultado.tx, 'TX-REAL');
  await assert.rejects(() => t2.resolver(CLAVE, { cobrado: false }), /liquidado/);
});

test('si la red decia que no se cobro y el primer cobro llega despues, el doble cobro queda a la vista y no se pierde ninguno', async (t) => {
  const dir = dirTemp(t);
  const lento = diferido();
  const t1 = abrirTablaPagos(dir, { ahora: () => T0, ttlMs: 30000 });
  const primera = t1.liquidar(CLAVE, () => lento.promesa);
  const t2 = abrirTablaPagos(dir, { ahora: () => T0 + 120000, ttlMs: 30000 });
  assert.equal((await t2.liquidar(CLAVE, async () => ({ tx: 'no' }))).estado, 'incierto');
  assert.equal((await t2.resolver(CLAVE, { cobrado: false })).estado, 'libre');
  const segundo = await t2.liquidar(CLAVE, async () => ({ tx: 'TX-2' }));
  assert.equal(segundo.estado, 'liquidado');
  assert.equal(segundo.nueva, true);
  lento.resolver({ tx: 'TX-1' });
  await primera;
  let ejecuciones = 0;
  const final = await t2.liquidar(CLAVE, async () => { ejecuciones += 1; return { tx: 'no' }; });
  assert.equal(final.estado, 'conflicto', 'dos cobros confirmados para un mismo pago es un conflicto, no un liquidado');
  assert.deepEqual(final.cobros.map((c) => c.resultado.tx).sort(), ['TX-1', 'TX-2']);
  assert.equal(ejecuciones, 0, 'un conflicto no se cobra otra vez');
});

test('el fallo tardio de un cobro viejo no pisa la reserva del cobro nuevo que sigue en curso', async (t) => {
  const dir = dirTemp(t);
  const viejo = diferido();
  const nuevo = diferido();
  const t1 = abrirTablaPagos(dir, { ahora: () => T0, ttlMs: 30000 });
  const primera = t1.liquidar(CLAVE, () => viejo.promesa);
  const t2 = abrirTablaPagos(dir, { ahora: () => T0 + 120000, ttlMs: 30000 });
  await t2.liquidar(CLAVE, async () => ({ tx: 'no' }));
  await t2.resolver(CLAVE, { cobrado: false });
  const segunda = t2.liquidar(CLAVE, () => nuevo.promesa);
  viejo.rechazar(new Error('fallo tardio del cobro viejo'));
  await primera;
  const t3 = abrirTablaPagos(dir, { ahora: () => T0 + 120000, ttlMs: 30000 });
  const medio = await t3.liquidar(CLAVE, async () => ({ tx: 'no' }));
  assert.equal(medio.estado, 'en_curso', 'el cobro nuevo sigue en curso');
  nuevo.resolver({ tx: 'TX-NUEVO' });
  assert.equal((await segunda).estado, 'liquidado');
  assert.equal((await t3.liquidar(CLAVE, async () => ({ tx: 'no' }))).resultado.tx, 'TX-NUEVO');
});

test('un candado ajeno en el directorio no impide ni pierde un cobro', async (t) => {
  const dir = dirTemp(t);
  const clave = claveDe(CLAVE);
  fs.writeFileSync(path.join(dir, `${clave}.json.lock`), '');
  fs.writeFileSync(path.join(dir, `${clave}.lock`), '');
  const r = await abrirTablaPagos(dir).liquidar(CLAVE, async () => ({ tx: 'cobrado-igual' }));
  assert.equal(r.estado, 'liquidado');
  assert.deepEqual(r.resultado, { tx: 'cobrado-igual' });
  assert.equal((await abrirTablaPagos(dir).liquidar(CLAVE, async () => ({ tx: 'no' }))).nueva, false);
});

test('dos entregas a la vez entregan una vez, y una entrega fallida no pisa una exitosa', async (t) => {
  const tabla = abrirTablaPagos(dirTemp(t));
  await tabla.liquidar(CLAVE, async () => ({ tx: 'abc' }));
  const lenta = diferido();
  let entregas = 0;
  const e1 = tabla.entregar(CLAVE, async () => { entregas += 1; return lenta.promesa; });
  const e2 = await tabla.entregar(CLAVE, async () => { entregas += 1; return { servicio: 'duplicado' }; });
  assert.equal(e2.estado, 'entrega_en_curso');
  assert.equal(e2.nueva, false);
  lenta.resolver({ servicio: 'plan' });
  assert.equal((await e1).estado, 'entregado');
  const e3 = await tabla.entregar(CLAVE, async () => { entregas += 1; throw new Error('no debe correr'); });
  assert.equal(e3.estado, 'entregado');
  assert.equal(e3.nueva, false);
  assert.deepEqual(e3.resultado, { servicio: 'plan' });
  assert.equal(entregas, 1);
});

test('una entrega que se perdio a mitad se puede volver a intentar pasado el plazo', async (t) => {
  const dir = dirTemp(t);
  const colgada = diferido();
  const t1 = abrirTablaPagos(dir, { ahora: () => T0, ttlMs: 30000 });
  await t1.liquidar(CLAVE, async () => ({ tx: 'abc' }));
  t1.entregar(CLAVE, () => colgada.promesa);
  const t2 = abrirTablaPagos(dir, { ahora: () => T0 + 120000, ttlMs: 30000 });
  const r = await t2.entregar(CLAVE, async () => ({ servicio: 'plan' }));
  assert.equal(r.estado, 'entregado');
  assert.equal(r.nueva, true);
});

test('un resolver sobre lo liquidado no borra la entrega ya registrada', async (t) => {
  const tabla = abrirTablaPagos(dirTemp(t));
  await tabla.liquidar(CLAVE, async () => ({ tx: 'abc' }));
  await tabla.entregar(CLAVE, async () => ({ servicio: 'plan' }));
  await assert.rejects(() => tabla.resolver(CLAVE, { cobrado: false }), /liquidado/);
  const e = await tabla.entregar(CLAVE, async () => ({ servicio: 'otro' }));
  assert.equal(e.estado, 'entregado');
  assert.equal(e.nueva, false);
});

test('la clave normaliza el texto: el mismo pago escrito en NFC y en NFD es el mismo', () => {
  const nfc = { acuerdo: 'exp-é', capacidad: 'ancla', pago: 'honorario:señal' };
  const nfd = { acuerdo: nfc.acuerdo.normalize('NFD'), capacidad: 'ancla', pago: nfc.pago.normalize('NFD') };
  assert.notEqual(nfc.pago, nfd.pago);
  assert.equal(claveDe(nfc), claveDe(nfd));
});

test('estres entre procesos con un candado viejo en el directorio: en cada ronda cobra uno solo', async (t) => {
  const dir = dirTemp(t);
  let dobles = 0;
  for (let ronda = 0; ronda < 8; ronda += 1) {
    const pago = `ronda-${ronda}`;
    const clave = claveDe({ acuerdo: 'exp-0001', capacidad: 'ancla', pago });
    const viejo = path.join(dir, `${clave}.json.lock`);
    fs.writeFileSync(viejo, '');
    const hace = new Date(Date.now() - 60000);
    fs.utimesSync(viejo, hace, hace);
    const contador = path.join(dir, `cobros-${ronda}.log`);
    const hijos = await Promise.all(Array.from({ length: 10 }, () => correrHijo(dir, 'cobrar', [contador, pago])));
    for (const h of hijos) assert.equal(h.codigo, 0, h.err);
    const cobros = fs.existsSync(contador) ? fs.readFileSync(contador, 'utf8').trim().split('\n').length : 0;
    if (cobros !== 1) dobles += 1;
  }
  assert.equal(dobles, 0, 'ninguna ronda cobro dos veces ni cero');
});
