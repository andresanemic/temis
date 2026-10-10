'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const token = require('../src/token.js');

const base = {
  red: 'testnet',
  code: 'TEMIS',
  issuer: 'issuer',
  totalStroops: '1000000000000000',
  flags: { authRequired: false, authRevocable: false, authImmutable: false, clawbackEnabled: false },
  vesting: { inicio: '2024-01-31T00:00:00.000Z', cliffMeses: 12, tramos: 36, respaldoDias: 180, demoMinutos: 4, demoDesde: 'liquidez' },
  buckets: {
    distribuidora: { porcentaje: 0, cuenta: 'distribuidora' },
    tesoreria: { porcentaje: 25, cuenta: 'tesoreria' },
    ecosistema: { porcentaje: 35, cuenta: 'ecosistema' },
    liquidez: { porcentaje: 10, cuenta: 'liquidez' },
    asesores: { porcentaje: 10, cuenta: 'asesores' },
    contingencia: { porcentaje: 5, cuenta: 'contingencia' },
    fundadores: { porcentaje: 15, fundadores: { andres: 50, francisco: 50 } },
  },
};

test('la configuración valida porcentajes enteros, oferta fija y roles únicos', () => {
  assert.equal(token.validarConfig(base), true);
  assert.equal(token.planDeReparto(base).tesoreria, '250000000000000');
  assert.equal(token.planDeReparto(base).andres, '75000000000000');
  assert.equal(token.planDeReparto(base).francisco, '75000000000000');
  assert.equal(token.planDeReparto(base).prueba, '10000000');
  assert.equal(BigInt(token.planDeReparto(base).liquidez) + BigInt(token.planDeReparto(base).prueba), 100000000000000n);
  const conResto = structuredClone(base);
  conResto.totalStroops = '1000000000000001';
  const reparto = token.planDeReparto(conResto);
  assert.equal(Object.values(reparto).reduce((s, x) => s + BigInt(x), 0n), BigInt(conResto.totalStroops));
});

test('el calendario reparte en 36 tramos, absorbe resto y respeta meses UTC', () => {
  assert.throws(() => token.calendarioDeVesting({ total: 100, inicio: '2024-01-31T00:00:00Z', cliffMeses: 12, tramos: 36 }), /entero de stroops/);
  const lista = token.calendarioDeVesting({ total: '100', inicio: '2024-01-31T00:00:00Z', cliffMeses: 12, tramos: 36 });
  assert.equal(lista.length, 36);
  assert.equal(lista[0].monto, '2');
  assert.equal(lista.at(-1).monto, '30');
  assert.equal(lista.reduce((s, x) => s + BigInt(x.monto), 0n), 100n);
  assert.equal(lista[0].fecha, '2025-01-31T00:00:00.000Z');
  assert.equal(lista[1].fecha, '2025-02-28T00:00:00.000Z');
  assert.equal(lista.at(-1).fecha, '2027-12-31T00:00:00.000Z');
  assert.equal(token.calendarioDeVesting({ total: '100', inicio: '2024-02-29T00:00:00Z', cliffMeses: 12, tramos: 36 })[0].fecha, '2025-02-28T00:00:00.000Z');
});

test('el plan de operaciones bloquea al emisor al final y no genera clawback', () => {
  const cuentas = Object.fromEntries(Object.keys(base.buckets).map((x) => [x, `G${x}`]));
  cuentas.andres = 'Gandres';
  cuentas.francisco = 'Gfrancisco';
  cuentas.prueba = 'Gprueba';
  const pasos = token.planDeOperaciones(base, cuentas);
  const cierres = pasos.filter((p) => p.tipo === 'bloquear-emisor');
  assert.equal(cierres.length, 1);
  assert.equal(pasos.at(-1).tipo, 'bloquear-emisor');
  assert.ok(pasos.findIndex((p) => p.tipo === 'balance-prueba-vesting') < pasos.findIndex((p) => p.tipo === 'balance-vesting'));
  assert.equal(pasos.slice(0, -1).some((p) => p.tipo === 'emision'), true);
  assert.ok(pasos.find((p) => p.tipo === 'trustlines').cuentas.includes('Gdistribuidora'));
  assert.ok(pasos.find((p) => p.tipo === 'trustlines').cuentas.includes('Gprueba'));
  assert.ok(pasos.find((p) => p.tipo === 'trustlines').cuentas.includes('Gandres'));
  assert.ok(pasos.find((p) => p.tipo === 'trustlines').cuentas.includes('Gfrancisco'));
  assert.equal(pasos.find((p) => p.tipo === 'balance-prueba-vesting').desdeRol, 'prueba');
  assert.equal(JSON.stringify(pasos).toLowerCase().includes('clawback'), false);
});

test('el plan rechaza direcciones públicas repetidas entre roles', () => {
  const cuentas = Object.fromEntries([...Object.keys(base.buckets), 'andres', 'francisco', 'prueba', 'issuer'].map((x) => [x, `G${x}`]));
  cuentas.ecosistema = cuentas.tesoreria;
  assert.throws(() => token.planDeOperaciones(base, cuentas), /direcciones públicas únicas/);
});

test('el verificador detecta emisor, banderas, oferta, cubetas, vesting y firmantes', () => {
  const comprobaciones = token.verificarEmision({ cuentaEmisora: {}, activo: {}, saldos: {}, balancesReclamables: [] }, base).comprobaciones;
  for (const n of ['emisora bloqueada', 'banderas del emisor', 'oferta total', 'saldos por cubeta', 'vesting de fundadores', 'sin saldo propio']) {
    assert.ok(comprobaciones.some((x) => x.nombre === n));
  }
  const predicado = token.predicadoDeTramo('2030-01-01T00:00:00Z', 180);
  assert.equal(predicado.respaldo.predicado.unix - predicado.principal.predicado.unix, 180 * 86400);
});

test('la configuración rechaza porcentajes, fundadores, flags, códigos y oferta variable inválidos', () => {
  const cambios = [
    (c) => { c.buckets.tesoreria.porcentaje = 24; },
    (c) => { c.buckets.fundadores.fundadores.francisco = 49; },
    (c) => { c.flags.authRequired = true; },
    (c) => { c.flags.authRevocable = true; },
    (c) => { c.flags.authImmutable = true; },
    (c) => { c.flags.clawbackEnabled = true; },
    (c) => { c.buckets.ecosistema.cuenta = 'tesoreria'; },
    (c) => { c.code = 'BAD CODE'; },
    (c) => { c.buckets.tesoreria.cuenta = 'TEMIS'; },
    (c) => { c.supplyFromDisputes = true; },
    (c) => { c.totalStroops = 1000000000000000; },
    (c) => { c.totalStroops = '1000000000.5'; },
    (c) => { c.red = 'mainnet'; },
  ];
  for (const cambiar of cambios) {
    const cfg = structuredClone(base);
    cambiar(cfg);
    assert.throws(() => token.validarConfig(cfg), (e) => e instanceof Error && !/is not a function/.test(e.message));
  }
});

function lecturasBuenas() {
  const reparto = token.planDeReparto(base);
  const balancesReclamables = [];
  for (const fundador of ['andres', 'francisco']) {
    const calendario = token.calendarioDeVesting({ total: reparto[fundador], inicio: base.vesting.inicio, cliffMeses: 12, tramos: 36 });
    for (const tramo of calendario) {
      balancesReclamables.push({ fundador, stroops: tramo.monto, fecha: tramo.fecha, reclamantes: token.serializarReclamantes(fundador, `G${fundador}`, 'Gtesoreria', tramo.fecha) });
    }
  }
  return {
    consultadoEn: '2024-01-01T00:00:00.000Z',
    cuentaEmisora: { account_id: 'Gissuer', masterWeight: 0, thresholds: { low_threshold: 0, med_threshold: 0, high_threshold: 0 }, signers: [{ key: 'Gissuer', weight: 0 }], assetBalanceStroops: '0' },
    activo: { amount: base.totalStroops, flags: { auth_required: false, auth_revocable: false, auth_immutable: false, clawback_enabled: false } },
    saldos: reparto,
    balancesReclamables,
  };
}

test('el verificador acepta lecturas coherentes e identifica cada manipulación', () => {
  const buenas = lecturasBuenas();
  assert.equal(token.verificarEmision(buenas, base).ok, true);
  const mutaciones = [
    (x) => { x.cuentaEmisora.masterWeight = 1; },
    (x) => { x.activo.flags.clawback_enabled = true; },
    (x) => { x.activo.amount = '1'; },
    (x) => { x.saldos.ecosistema = '1'; },
    (x) => { x.consultadoEn = '2030-01-01T00:00:00.000Z'; },
    (x) => { x.balancesReclamables.pop(); },
    (x) => { x.cuentaEmisora.assetBalanceStroops = '1'; },
    (x) => { x.cuentaEmisora.signers.push({ key: 'Gextra', weight: 1 }); },
  ];
  for (const mutar of mutaciones) {
    const lectura = structuredClone(buenas);
    mutar(lectura);
    assert.equal(token.verificarEmision(lectura, base).ok, false);
  }
});

test('el desbloqueo de la prueba de vesting se cuenta desde el momento de crearla, no desde el inicio del calendario de fundadores', () => {
  const cuentas = Object.fromEntries(['issuer', 'distribuidora', 'tesoreria', 'ecosistema', 'liquidez', 'asesores', 'contingencia', 'andres', 'francisco', 'prueba'].map((r) => [r, `G${r}`]));
  const ahora = '2026-10-03T17:00:00.000Z';
  const pasos = token.planDeOperaciones(base, cuentas, { inicio: "2024-01-31T00:00:00.000Z", ahora });
  const demo = pasos.find((p) => p.tipo === 'balance-prueba-vesting');
  assert.equal(demo.fecha, '2026-10-03T17:04:00.000Z', 'ahora + demoMinutos, aunque el inicio del calendario ya haya pasado');
  assert.ok(Date.parse(demo.fecha) > Date.parse(ahora), 'el desbloqueo queda en el futuro de quien lo crea');
  const fundador = pasos.find((p) => p.tipo === 'balance-vesting');
  if (fundador) assert.ok(Date.parse(fundador.fecha) > Date.parse('2024-01-31T00:00:00.000Z'));
});

test('unixDePredicado lee la hora de un predicado como la entrega Horizon (abs_before ISO y abs_before_epoch) y como la arma el SDK', () => {
  assert.equal(token.unixDePredicado({ abs_before: '2027-10-03T00:00:00Z', abs_before_epoch: '1822521600' }), 1822521600);
  assert.equal(token.unixDePredicado({ abs_before: '2027-10-03T00:00:00Z' }), 1822521600);
  assert.equal(token.unixDePredicado({ abs_before: '1822521600' }), 1822521600);
  assert.equal(token.unixDePredicado({ before_absolute_time: '1822521600' }), 1822521600);
  assert.equal(token.unixDePredicado({}), undefined);
  assert.equal(token.unixDePredicado(undefined), undefined);
});

test('verificarEmision acepta las banderas como las entrega Horizon (auth_clawback_enabled) y el registro del activo se saca de la pagina', () => {
  const l = lecturasBuenas();
  l.activo.flags = { auth_required: false, auth_revocable: false, auth_immutable: false, auth_clawback_enabled: false };
  const r = token.verificarEmision(l, base);
  assert.equal(r.comprobaciones.find((c) => c.nombre === 'banderas del emisor').ok, true);
  l.activo.flags = { auth_required: false, auth_revocable: false, auth_immutable: false, auth_clawback_enabled: true };
  assert.equal(token.verificarEmision(l, base).comprobaciones.find((c) => c.nombre === 'banderas del emisor').ok, false, 'clawback activado debe fallar');
  assert.deepEqual(token.registroDeActivo({ records: [{ asset_code: 'TEMIS' }] }), { asset_code: 'TEMIS' });
  assert.deepEqual(token.registroDeActivo({ asset_code: 'TEMIS' }), { asset_code: 'TEMIS' });
  assert.deepEqual(token.registroDeActivo({ records: [] }), {});
});
