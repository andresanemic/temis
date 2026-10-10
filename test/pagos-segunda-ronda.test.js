'use strict';
// Segunda verificacion independiente del modulo de pagos (Advisor, 2026-10-03). Lo que la reescritura como registro de
// solo creacion todavia dejaba: un orden raro de intentos que tapaba un segundo cobro posible, hechos ilegibles leidos como
// si fueran un estado, el borrado del temporal que podia lanzar despues de crear, y dos cobros distintos del mismo intento.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { abrirTablaPagos, claveDe, ErrorPagos } = require('../src/pagos.js');

const CLAVE = { acuerdo: 'exp-0001', capacidad: 'ancla', pago: 'auth-0001' };
const dirTemp = (t) => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'temis-pagos-r2-'));
  t.after(() => fs.rmSync(d, { recursive: true, force: true }));
  return d;
};
const diferido = () => {
  let resolver;
  let rechazar;
  const promesa = new Promise((res, rej) => { resolver = res; rechazar = rej; });
  return { promesa, resolver, rechazar };
};
const T0 = 1_800_000_000_000;

test('un intento posterior que fallo no se pierde cuando llega tarde el cobro del primero: queda avisado y se puede reconciliar', async (t) => {
  const dir = dirTemp(t);
  const lento = diferido();
  const t1 = abrirTablaPagos(dir, { ahora: () => T0, ttlMs: 30000 });
  const primera = t1.liquidar(CLAVE, () => lento.promesa);
  const t2 = abrirTablaPagos(dir, { ahora: () => T0 + 120000, ttlMs: 30000 });
  await t2.liquidar(CLAVE, async () => ({ tx: 'no' }));
  await t2.resolver(CLAVE, { cobrado: false });
  const segundo = await t2.liquidar(CLAVE, async () => { throw new Error('timeout del facilitador'); });
  assert.equal(segundo.estado, 'incierto');
  lento.resolver({ tx: 'TX-1' });
  await primera;
  const visto = await t2.liquidar(CLAVE, async () => ({ tx: 'no' }));
  assert.equal(visto.estado, 'liquidado');
  assert.deepEqual(visto.resultado, { tx: 'TX-1' });
  assert.ok(visto.alerta, 'un intento posterior sin cerrar puede haber cobrado: el liquidado lo avisa');
  assert.deepEqual(visto.sin_cerrar, [2]);
  // el operador puede reconciliar ese intento aunque haya otro confirmado
  const r = await t2.resolver(CLAVE, { tx: 'TX-2' }, { intento: 2 });
  assert.equal(r.estado, 'conflicto');
  assert.deepEqual((await t2.liquidar(CLAVE, async () => ({ tx: 'no' }))).cobros.map((c) => c.resultado.tx).sort(), ['TX-1', 'TX-2']);
});

test('cerrar el intento posterior como no cobrado quita el aviso', async (t) => {
  const dir = dirTemp(t);
  const lento = diferido();
  const t1 = abrirTablaPagos(dir, { ahora: () => T0, ttlMs: 30000 });
  const primera = t1.liquidar(CLAVE, () => lento.promesa);
  const t2 = abrirTablaPagos(dir, { ahora: () => T0 + 120000, ttlMs: 30000 });
  await t2.liquidar(CLAVE, async () => ({ tx: 'no' }));
  await t2.resolver(CLAVE, { cobrado: false });
  await t2.liquidar(CLAVE, async () => { throw new Error('timeout'); });
  lento.resolver({ tx: 'TX-1' });
  await primera;
  assert.equal((await t2.resolver(CLAVE, { cobrado: false }, { intento: 2 })).estado, 'liquidado');
  const limpio = await t2.liquidar(CLAVE, async () => ({ tx: 'no' }));
  assert.equal(limpio.estado, 'liquidado');
  assert.equal(limpio.alerta ?? null, null);
});

test('si el operador reconcilia con un hash y el cobrador tardio informa otro para el mismo intento, es un conflicto', async (t) => {
  const dir = dirTemp(t);
  const lento = diferido();
  const t1 = abrirTablaPagos(dir, { ahora: () => T0, ttlMs: 30000 });
  const primera = t1.liquidar(CLAVE, () => lento.promesa);
  const t2 = abrirTablaPagos(dir, { ahora: () => T0 + 120000, ttlMs: 30000 });
  await t2.liquidar(CLAVE, async () => ({ tx: 'no' }));
  await t2.resolver(CLAVE, { tx: 'X' });
  lento.resolver({ tx: 'Y' });
  await primera;
  const f = await t2.liquidar(CLAVE, async () => ({ tx: 'no' }));
  assert.equal(f.estado, 'conflicto');
  assert.deepEqual(f.cobros.map((c) => c.resultado.tx).sort(), ['X', 'Y']);
});

test('un hecho ilegible no se lee como un estado: la tabla se detiene y nombra el archivo', async (t) => {
  const dir = dirTemp(t);
  const tabla = abrirTablaPagos(dir);
  await tabla.liquidar(CLAVE, async () => ({ tx: 'ok' }));
  const clave = claveDe(CLAVE);
  const archivo = path.join(dir, `${clave}.resultado-1.json`);
  fs.writeFileSync(archivo, 'esto no es json');
  await assert.rejects(() => tabla.liquidar(CLAVE, async () => ({ tx: 'no' })), (e) => e instanceof ErrorPagos && e.codigo === 'HECHO_ILEGIBLE' && e.message.includes('resultado-1'));
  await assert.rejects(() => tabla.resolver(CLAVE, { cobrado: false }), (e) => e.codigo === 'HECHO_ILEGIBLE');
  await assert.rejects(() => tabla.entregar(CLAVE, async () => ({})), (e) => e.codigo === 'HECHO_ILEGIBLE');
});

test('una reserva joven con contenido ilegible no se toma por abandonada', async (t) => {
  const dir = dirTemp(t);
  const clave = claveDe(CLAVE);
  fs.writeFileSync(path.join(dir, `${clave}.reserva-1.json`), '');
  let cobros = 0;
  await assert.rejects(() => abrirTablaPagos(dir, { ahora: () => Date.now() + 10 * 365 * 24 * 3600 * 1000 }).liquidar(CLAVE, async () => { cobros += 1; return {}; }), (e) => e.codigo === 'HECHO_ILEGIBLE');
  assert.equal(cobros, 0);
});

test('una entrega ya registrada cuyo archivo se corrompio no se vuelve a ejecutar', async (t) => {
  const dir = dirTemp(t);
  const tabla = abrirTablaPagos(dir);
  await tabla.liquidar(CLAVE, async () => ({ tx: 'abc' }));
  await tabla.entregar(CLAVE, async () => ({ servicio: 'plan' }));
  const clave = claveDe(CLAVE);
  fs.writeFileSync(path.join(dir, `${clave}.entrega-resultado-1.json`), '{truncado');
  let entregas = 0;
  await assert.rejects(() => tabla.entregar(CLAVE, async () => { entregas += 1; return {}; }), (e) => e.codigo === 'HECHO_ILEGIBLE');
  assert.equal(entregas, 0);
});

test('si borrar el temporal falla despues de crear el hecho, el cobro igual queda liquidado y no se pierde', async (t) => {
  const dir = dirTemp(t);
  const tabla = abrirTablaPagos(dir);
  const original = fs.rmSync;
  fs.rmSync = (p, o) => {
    if (String(p).endsWith('.tmp')) { const e = new Error('busy'); e.code = 'EBUSY'; throw e; }
    return original(p, o);
  };
  let cobros = 0;
  try {
    const r = await tabla.liquidar(CLAVE, async () => { cobros += 1; return { tx: 'abc' }; });
    assert.equal(r.estado, 'liquidado');
    const e = await tabla.entregar(CLAVE, async () => ({ servicio: 'plan' }));
    assert.equal(e.estado, 'entregado');
  } finally {
    fs.rmSync = original;
  }
  assert.equal(cobros, 1);
  assert.equal((await abrirTablaPagos(dir).entregar(CLAVE, async () => ({ servicio: 'otro' }))).nueva, false);
});

test('un error de ejecutar que se parece al propio de la tabla se trata como un fallo del cobro, no se relanza', async (t) => {
  const tabla = abrirTablaPagos(dirTemp(t));
  const r = await tabla.liquidar(CLAVE, async () => { throw new ErrorPagos('de una tabla anidada', { codigo: 'RESULTADO_NO_REGISTRADO' }); });
  assert.equal(r.estado, 'incierto');
  assert.match(r.error, /tabla anidada/);
});

test('al abrir la tabla se barren los temporales viejos y se respetan los recientes', (t) => {
  const dir = dirTemp(t);
  const viejo = path.join(dir, 'x.reserva-1.json.1.aa.tmp');
  const reciente = path.join(dir, 'x.reserva-2.json.1.bb.tmp');
  fs.writeFileSync(viejo, '');
  fs.writeFileSync(reciente, '');
  const hace = new Date(Date.now() - 3 * 3600 * 1000);
  fs.utimesSync(viejo, hace, hace);
  abrirTablaPagos(dir);
  assert.equal(fs.existsSync(viejo), false);
  assert.equal(fs.existsSync(reciente), true);
});
