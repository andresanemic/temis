'use strict';
// Paso 7 del §17: idempotencia durable del pago. Una liquidacion se cobra una sola vez, aunque se reintente,
// aunque se reinicie el proceso, aunque dos procesos la intenten a la vez y aunque la entrega del servicio falle
// despues de cobrar. Un cobro cuyo resultado se perdio no se reintenta a ciegas: queda `incierto` hasta que alguien
// reconcilia contra la red (whitepaper §4.4 y §14).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { abrirTablaPagos, claveDe } = require('../src/pagos.js');

const HIJO = path.join(__dirname, 'fixtures', 'pagos-hijo.js');
const dirTemp = (t) => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'temis-pagos-'));
  t.after(() => fs.rmSync(d, { recursive: true, force: true }));
  return d;
};
const CLAVE = { acuerdo: 'exp-0001', capacidad: 'ancla', pago: 'auth-0001' };

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

test('la clave de un pago es un digest estable de (acuerdo, capacidad, pago) y exige los tres', () => {
  assert.match(claveDe(CLAVE), /^[0-9a-f]{64}$/);
  assert.equal(claveDe(CLAVE), claveDe({ ...CLAVE }));
  assert.notEqual(claveDe(CLAVE), claveDe({ ...CLAVE, pago: 'auth-0002' }));
  assert.notEqual(claveDe(CLAVE), claveDe({ ...CLAVE, acuerdo: 'exp-0002' }));
  assert.notEqual(claveDe(CLAVE), claveDe({ ...CLAVE, capacidad: 'otra' }));
  assert.throws(() => claveDe({ acuerdo: 'exp-0001', capacidad: 'ancla' }), /pago/);
  assert.throws(() => claveDe({ ...CLAVE, pago: '' }), /pago/);
});

test('liquidar ejecuta una vez y el reintento devuelve el mismo resultado sin ejecutar', async (t) => {
  const tabla = abrirTablaPagos(dirTemp(t));
  let cobros = 0;
  const cobrar = async () => { cobros += 1; return { tx: 'abc123', ledger: 77 }; };
  const a = await tabla.liquidar(CLAVE, cobrar);
  assert.equal(a.estado, 'liquidado');
  assert.equal(a.nueva, true);
  assert.deepEqual(a.resultado, { tx: 'abc123', ledger: 77 });
  const b = await tabla.liquidar(CLAVE, cobrar);
  assert.equal(b.estado, 'liquidado');
  assert.equal(b.nueva, false);
  assert.deepEqual(b.resultado, a.resultado);
  assert.equal(cobros, 1);
});

test('dos pagos distintos no se pisan', async (t) => {
  const tabla = abrirTablaPagos(dirTemp(t));
  let cobros = 0;
  const cobrar = async () => { cobros += 1; return { tx: `t${cobros}` }; };
  await tabla.liquidar(CLAVE, cobrar);
  await tabla.liquidar({ ...CLAVE, pago: 'auth-0002' }, cobrar);
  assert.equal(cobros, 2);
});

test('sobrevive al reinicio: otra instancia sobre el mismo directorio ve lo liquidado y no cobra de nuevo', async (t) => {
  const dir = dirTemp(t);
  await abrirTablaPagos(dir).liquidar(CLAVE, async () => ({ tx: 'abc123' }));
  let cobros = 0;
  const r = await abrirTablaPagos(dir).liquidar(CLAVE, async () => { cobros += 1; return { tx: 'otro' }; });
  assert.equal(r.estado, 'liquidado');
  assert.equal(r.nueva, false);
  assert.deepEqual(r.resultado, { tx: 'abc123' });
  assert.equal(cobros, 0);
});

test('un cobro que falla queda incierto: no se reintenta a ciegas y se reconcilia con la red', async (t) => {
  const tabla = abrirTablaPagos(dirTemp(t));
  let cobros = 0;
  const falla = async () => { cobros += 1; throw new Error('se corto la respuesta del facilitador'); };
  const a = await tabla.liquidar(CLAVE, falla);
  assert.equal(a.estado, 'incierto');
  assert.match(a.error, /se corto la respuesta/);
  const b = await tabla.liquidar(CLAVE, async () => { cobros += 1; return { tx: 'no debe cobrar' }; });
  assert.equal(b.estado, 'incierto');
  assert.equal(b.nueva, false);
  assert.equal(cobros, 1, 'un cobro incierto no se reintenta sin reconciliar');

  const cobrado = await tabla.resolver(CLAVE, { tx: 'hallada-en-horizon', ledger: 90 });
  assert.equal(cobrado.estado, 'liquidado');
  assert.deepEqual(cobrado.resultado, { tx: 'hallada-en-horizon', ledger: 90 });
  const c = await tabla.liquidar(CLAVE, async () => { cobros += 1; return { tx: 'no' }; });
  assert.equal(c.estado, 'liquidado');
  assert.equal(cobros, 1);
});

test('si la red confirma que no se cobro, el pago queda libre y puede reintentarse una vez', async (t) => {
  const tabla = abrirTablaPagos(dirTemp(t));
  await tabla.liquidar(CLAVE, async () => { throw new Error('timeout'); });
  const libre = await tabla.resolver(CLAVE, { cobrado: false });
  assert.equal(libre.estado, 'libre');
  let cobros = 0;
  const r = await tabla.liquidar(CLAVE, async () => { cobros += 1; return { tx: 'segunda-vez' }; });
  assert.equal(r.estado, 'liquidado');
  assert.equal(r.nueva, true);
  assert.equal(cobros, 1);
  await assert.rejects(() => tabla.resolver(CLAVE, { cobrado: false }), /liquidado/);
});

test('resolver exige un pago incierto: no reescribe lo ya liquidado ni lo inexistente', async (t) => {
  const tabla = abrirTablaPagos(dirTemp(t));
  await assert.rejects(() => tabla.resolver(CLAVE, { cobrado: false }), /no existe/);
  await tabla.liquidar(CLAVE, async () => ({ tx: 'ok' }));
  await assert.rejects(() => tabla.resolver(CLAVE, { tx: 'otra' }), /liquidado/);
  await assert.rejects(() => tabla.resolver(CLAVE, {}), /tx|cobrado/);
});

test('la entrega que falla despues de cobrar se reintenta sin cobrar otra vez', async (t) => {
  const tabla = abrirTablaPagos(dirTemp(t));
  let cobros = 0;
  let entregas = 0;
  await tabla.liquidar(CLAVE, async () => { cobros += 1; return { tx: 'abc123' }; });
  const a = await tabla.entregar(CLAVE, async () => { entregas += 1; throw new Error('el servicio se cayo'); });
  assert.equal(a.estado, 'entrega_pendiente');
  assert.match(a.error, /se cayo/);
  const b = await tabla.entregar(CLAVE, async () => { entregas += 1; return { servicio: 'plan' }; });
  assert.equal(b.estado, 'entregado');
  assert.deepEqual(b.resultado, { servicio: 'plan' });
  const c = await tabla.entregar(CLAVE, async () => { entregas += 1; return { servicio: 'otro' }; });
  assert.equal(c.estado, 'entregado');
  assert.equal(c.nueva, false);
  assert.deepEqual(c.resultado, { servicio: 'plan' });
  assert.equal(cobros, 1);
  assert.equal(entregas, 2);
  const otra = await tabla.liquidar(CLAVE, async () => { cobros += 1; return { tx: 'no' }; });
  assert.equal(otra.estado, 'liquidado');
  assert.equal(cobros, 1);
});

test('no se entrega lo que no esta liquidado', async (t) => {
  const tabla = abrirTablaPagos(dirTemp(t));
  await assert.rejects(() => tabla.entregar(CLAVE, async () => ({})), /liquidado/);
  await tabla.liquidar(CLAVE, async () => { throw new Error('x'); });
  await assert.rejects(() => tabla.entregar(CLAVE, async () => ({})), /liquidado/);
});

test('una reserva abandonada (el proceso murio a mitad del cobro) pasa a incierta pasado el plazo, no antes', async (t) => {
  const dir = dirTemp(t);
  const h = await correrHijo(dir, 'morir');
  assert.notEqual(h.codigo, 0, 'el hijo muere a mitad del cobro');
  const antes = await abrirTablaPagos(dir, { ahora: () => Date.now() }).liquidar(CLAVE, async () => ({ tx: 'no debe cobrar' }));
  assert.equal(antes.estado, 'en_curso');
  assert.equal(antes.nueva, false);
  const despues = await abrirTablaPagos(dir, { ahora: () => Date.now() + 120000, ttlMs: 30000 }).liquidar(CLAVE, async () => ({ tx: 'no debe cobrar' }));
  assert.equal(despues.estado, 'incierto');
  assert.equal(despues.nueva, false);
  assert.match(despues.error, /reserva|abandon/i);
});

test('carrera real entre procesos: ocho intentan cobrar el mismo pago y cobra exactamente uno', async (t) => {
  const dir = dirTemp(t);
  const contador = path.join(dir, 'cobros.log');
  const hijos = await Promise.all(Array.from({ length: 8 }, () => correrHijo(dir, 'cobrar', [contador])));
  for (const h of hijos) assert.equal(h.codigo, 0, h.err);
  const ejecutaron = hijos.filter((h) => h.json.ejecuto === true);
  assert.equal(ejecutaron.length, 1, 'solo un proceso ejecuta el cobro');
  for (const h of hijos.filter((x) => x.json.ejecuto !== true)) {
    assert.equal(h.json.nueva, false);
    assert.ok(['en_curso', 'liquidado'].includes(h.json.estado), `estado del perdedor: ${h.json.estado}`);
  }
  assert.equal(fs.readFileSync(contador, 'utf8').trim().split('\n').length, 1, 'el efecto externo ocurrio una sola vez');
  const final = await abrirTablaPagos(dir).liquidar(CLAVE, async () => ({ tx: 'no' }));
  assert.equal(final.estado, 'liquidado');
  assert.equal(final.nueva, false);
});
