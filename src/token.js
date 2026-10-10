'use strict';

const STROOPS = 10000000n;
const BLOQUEADAS = ['authRequired', 'authRevocable', 'authImmutable', 'clawbackEnabled'];

function enteroPositivo(valor, nombre) {
  if (typeof valor !== 'string' || !/^(0|[1-9]\d*)$/.test(valor)) throw new Error(`${nombre} debe ser un entero de stroops en texto`);
  const entero = BigInt(valor);
  if (entero <= 0n) throw new Error(`${nombre} debe ser mayor que cero`);
  return entero;
}

function validarConfig(cfg) {
  if (!cfg || typeof cfg !== 'object') throw new Error('configuración inválida');
  if (cfg.red !== 'testnet') throw new Error('la configuración solo admite testnet');
  if (typeof cfg.code !== 'string' || !/^[A-Z0-9]{1,12}$/.test(cfg.code)) throw new Error('código de activo inválido');
  if (!cfg.issuer || typeof cfg.issuer !== 'string') throw new Error('falta la cuenta emisora');
  enteroPositivo(cfg.totalStroops, 'oferta');
  if (cfg.supplyFromDisputes || (cfg.supplyModel && cfg.supplyModel !== 'fixed')) throw new Error('la oferta debe ser fija y ajena a disputas');
  for (const flag of BLOQUEADAS) if (cfg.flags?.[flag] !== false) throw new Error(`bandera prohibida activa o ausente: ${flag}`);
  if (!cfg.vesting || typeof cfg.vesting.inicio !== 'string' || Number.isNaN(Date.parse(cfg.vesting.inicio)) || !Number.isInteger(cfg.vesting.cliffMeses) || cfg.vesting.cliffMeses < 0 || !Number.isInteger(cfg.vesting.tramos) || cfg.vesting.tramos < 1) throw new Error('configuración de vesting inválida');
  if (!Number.isInteger(cfg.vesting.demoMinutos) || cfg.vesting.demoMinutos < 1 || !cfg.buckets[cfg.vesting.demoDesde] || cfg.vesting.demoDesde === 'fundadores' || cfg.vesting.respaldoDias !== 180) throw new Error('la demo o el respaldo de vesting no cumplen la configuración requerida');
  const entradas = Object.entries(cfg.buckets ?? {});
  if (!entradas.length) throw new Error('faltan cubetas');
  let suma = 0;
  const cuentas = [cfg.issuer];
  for (const [nombre, bucket] of entradas) {
    if (!Number.isInteger(bucket.porcentaje) || bucket.porcentaje < 0 || bucket.porcentaje > 100) throw new Error(`porcentaje inválido: ${nombre}`);
    suma += bucket.porcentaje;
    if (bucket.cuenta) cuentas.push(bucket.cuenta);
  }
  if (suma !== 100) throw new Error('los porcentajes de cubetas deben sumar 100');
  if (!entradas.some(([nombre, bucket]) => nombre !== 'fundadores' && bucket.porcentaje > 0)) throw new Error('se necesita otra cubeta para absorber redondeos de stroops');
  const fundadores = cfg.buckets.fundadores?.fundadores;
  if (!fundadores || Object.keys(fundadores).length !== 2 || Object.values(fundadores).some((p) => p !== 50)) throw new Error('la cubeta de fundadores debe repartirse 50/50');
  const total = BigInt(cfg.totalStroops);
  if ((total * BigInt(cfg.buckets.fundadores.porcentaje) / 100n) % 2n !== 0n) throw new Error('la cubeta de fundadores no se puede dividir 50/50 en stroops');
  for (const nombre of Object.keys(fundadores)) cuentas.push(nombre);
  if (new Set(cuentas).size !== cuentas.length) throw new Error('códigos y cuentas deben ser únicos');
  if (cuentas.includes(cfg.code)) throw new Error('el código del activo no puede repetirse como cuenta');
  return true;
}

function planDeReparto(cfg) {
  validarConfig(cfg);
  const total = BigInt(cfg.totalStroops);
  const salida = {};
  let totalCubetas = 0n;
  let ajuste = null;
  for (const [nombre, bucket] of Object.entries(cfg.buckets)) {
    const monto = (total * BigInt(bucket.porcentaje)) / 100n;
    totalCubetas += monto;
    if (nombre === 'fundadores') {
      for (const [fundador, porcentaje] of Object.entries(bucket.fundadores)) salida[fundador] = ((monto * BigInt(porcentaje)) / 100n).toString();
    } else if (bucket.porcentaje > 0) {
      salida[nombre] = monto.toString();
      ajuste = nombre;
    }
  }
  salida[ajuste] = (BigInt(salida[ajuste]) + total - totalCubetas).toString();
  const fuenteDemo = cfg.vesting.demoDesde;
  if (BigInt(salida[fuenteDemo] ?? '0') < STROOPS) throw new Error('la cubeta elegida no alcanza para reservar 1 TEMIS para la demo');
  salida[fuenteDemo] = (BigInt(salida[fuenteDemo]) - STROOPS).toString();
  salida.prueba = STROOPS.toString();
  return salida;
}

function fechaValida(valor) {
  const fecha = valor instanceof Date ? new Date(valor) : new Date(valor);
  if (Number.isNaN(fecha.getTime())) throw new Error('fecha inválida');
  return fecha;
}

function sumarMeses(fecha, meses) {
  const año = fecha.getUTCFullYear();
  const mes = fecha.getUTCMonth() + meses;
  const destinoAño = año + Math.floor(mes / 12);
  const destinoMes = ((mes % 12) + 12) % 12;
  const dia = Math.min(fecha.getUTCDate(), new Date(Date.UTC(destinoAño, destinoMes + 1, 0)).getUTCDate());
  return new Date(Date.UTC(destinoAño, destinoMes, dia, fecha.getUTCHours(), fecha.getUTCMinutes(), fecha.getUTCSeconds(), fecha.getUTCMilliseconds()));
}

function calendarioDeVesting({ total, inicio, cliffMeses, tramos }) {
  if (typeof total !== 'string' && typeof total !== 'bigint') throw new Error('monto debe ser un entero de stroops');
  const montoTotal = typeof total === 'bigint' ? total : enteroPositivo(total, 'monto');
  if (!Number.isInteger(cliffMeses) || cliffMeses < 0 || !Number.isInteger(tramos) || tramos < 1) throw new Error('cliff y cantidad de tramos inválidos');
  const base = fechaValida(inicio);
  const ordinario = montoTotal / BigInt(tramos);
  let acumulado = 0n;
  return Array.from({ length: tramos }, (_, i) => {
    const monto = i === tramos - 1 ? montoTotal - acumulado : ordinario;
    acumulado += monto;
    return { indice: i + 1, monto: monto.toString(), fecha: sumarMeses(base, cliffMeses + i).toISOString() };
  });
}

function predicadoDeTramo(fecha, respaldoDias = 180) {
  const principal = Math.floor(fechaValida(fecha).getTime() / 1000);
  if (!Number.isInteger(respaldoDias) || respaldoDias < 0) throw new Error('días de respaldo inválidos');
  const respaldo = principal + respaldoDias * 86400;
  return {
    principal: { tipo: 'not', predicado: { tipo: 'before_absolute_time', unix: principal } },
    respaldo: { tipo: 'not', predicado: { tipo: 'before_absolute_time', unix: respaldo } },
  };
}

function serializarReclamantes(fundador, cuentaFundador, cuentaRespaldo, fecha, respaldoDias = 180) {
  const predicados = predicadoDeTramo(fecha, respaldoDias);
  return [
    { rol: fundador, cuenta: cuentaFundador, predicado: predicados.principal },
    { rol: 'tesoreria', cuenta: cuentaRespaldo, predicado: predicados.respaldo },
  ];
}

function planDeOperaciones(cfg, cuentas, opciones = {}) {
  validarConfig(cfg);
  const direcciones = Object.entries(cuentas).filter(([, valor]) => typeof valor === 'string').map(([, valor]) => valor);
  if (new Set(direcciones).size !== direcciones.length) throw new Error('se requieren direcciones públicas únicas por rol');
  const plan = planDeReparto(cfg);
  const pasos = [{ tipo: 'fondeo', roles: Object.keys(cuentas) }];
  const trust = Object.keys(cfg.buckets).filter((n) => n !== 'fundadores' && cfg.buckets[n].porcentaje > 0);
  const propietariosTrust = [...trust.map((n) => [n, cuentas[n] ?? cfg.buckets[n].cuenta]), ['distribuidora', cuentas.distribuidora], ['andres', cuentas.andres], ['francisco', cuentas.francisco], ['prueba', cuentas.prueba]].filter(([, direccion]) => Boolean(direccion));
  const rolesPorCuenta = Object.fromEntries(propietariosTrust.map(([rol, direccion]) => [direccion, rol]));
  pasos.push({ tipo: 'trustlines', cuentas: [...new Set(propietariosTrust.map(([, direccion]) => direccion))], rolesPorCuenta, limiteStroops: cfg.totalStroops });
  pasos.push({ tipo: 'emision', desde: cuentas.issuer, hacia: cuentas.distribuidora, stroops: cfg.totalStroops, codigo: cfg.code });
  for (const [rol, stroops] of Object.entries(plan)) {
    if (rol === 'andres' || rol === 'francisco') continue;
    pasos.push({ tipo: 'reparto', desde: cuentas.distribuidora, hacia: cuentas[rol] ?? cfg.buckets[rol]?.cuenta, rol, stroops, codigo: cfg.code });
  }
  const inicio = opciones.inicio ?? cfg.vesting?.inicio ?? new Date().toISOString();
  const calendario = calendarioDeVesting({ total: plan.andres, inicio, cliffMeses: cfg.vesting?.cliffMeses ?? 12, tramos: cfg.vesting?.tramos ?? 36 });
  // La prueba de vesting se cuenta desde el momento en que se crea (opciones.ahora), no desde el inicio del calendario de los fundadores:
  // si ese inicio ya pasó, un desbloqueo calculado desde él ya estaría vencido y el reclamo temprano de la demo prosperaría.
  const baseDemo = opciones.ahora ?? new Date().toISOString();
  const desbloqueoDemo = new Date(fechaValida(baseDemo).getTime() + (cfg.vesting?.demoMinutos ?? 4) * 60000).toISOString();
  pasos.push({ tipo: 'balance-prueba-vesting', desde: cuentas.prueba, desdeRol: 'prueba', fundador: 'prueba', stroops: String(STROOPS), fecha: desbloqueoDemo, reclamantes: serializarReclamantes('prueba', cuentas.prueba, cuentas.tesoreria, desbloqueoDemo, cfg.vesting.respaldoDias) });
  for (const fundador of ['andres', 'francisco']) {
    const vesting = calendarioDeVesting({ total: plan[fundador], inicio, cliffMeses: cfg.vesting?.cliffMeses ?? 12, tramos: cfg.vesting?.tramos ?? 36 });
    vesting.forEach((tramo) => pasos.push({ tipo: 'balance-vesting', desde: cuentas.distribuidora, fundador, stroops: tramo.monto, fecha: tramo.fecha, reclamantes: serializarReclamantes(fundador, cuentas[fundador], cuentas.tesoreria, tramo.fecha, cfg.vesting.respaldoDias) }));
  }
  for (const firmante of cuentas.firmantesExtra ?? []) pasos.push({ tipo: 'quitar-firmante', cuenta: cuentas.issuer, firmante });
  pasos.push({ tipo: 'bloquear-emisor', cuenta: cuentas.issuer, masterWeight: 0, lowThreshold: 0, medThreshold: 0, highThreshold: 0, firmantesExtra: [] });
  return pasos;
}

function verificarEmision(lecturas, cfg) {
  const expected = planDeReparto(cfg);
  const resultados = [];
  const agregar = (nombre, ok, detalle) => resultados.push({ nombre, ok: Boolean(ok), detalle: String(detalle) });
  const emisor = lecturas.cuentaEmisora ?? {};
  const t = emisor.thresholds ?? {};
  const extra = (emisor.signers ?? []).filter((s) => s.key !== emisor.account_id);
  const bloqueada = emisor.masterWeight === 0 && [t.low_threshold ?? 0, t.med_threshold ?? 0, t.high_threshold ?? 0].every((x) => x === 0) && extra.length === 0;
  agregar('emisora bloqueada', bloqueada, `master=${emisor.masterWeight}; umbrales=${JSON.stringify(t)}; firmantes_extra=${extra.length}`);
  const flags = lecturas.activo?.flags ?? {};
  const flagsOk = ['auth_required', 'auth_revocable', 'auth_immutable', 'clawback_enabled', 'auth_clawback_enabled'].every((f) => flags[f] === undefined || flags[f] === false || flags[f] === 0);
  agregar('banderas del emisor', flagsOk, JSON.stringify(flags));
  const oferta = String(lecturas.activo?.amount ?? lecturas.activo?.supplyStroops ?? '');
  agregar('oferta total', oferta === String(cfg.totalStroops), `esperada=${cfg.totalStroops}; leída=${oferta}`);
  const saldos = lecturas.saldos ?? {};
  const cuentasOk = Object.entries(expected).every(([rol, monto]) => String(saldos[rol] ?? '') === monto);
  agregar('saldos por cubeta', cuentasOk, `esperados=${JSON.stringify(expected)}; leídos=${JSON.stringify(saldos)}`);
  const fuenteDemo = cfg.vesting.demoDesde;
  const bucketDemo = BigInt(saldos[fuenteDemo] ?? 0) + BigInt(saldos.prueba ?? 0);
  const bucketPlan = BigInt(expected[fuenteDemo]) + STROOPS;
  agregar('demo dentro de su cubeta', bucketDemo === bucketPlan, `cubeta=${fuenteDemo}; esperado=${bucketPlan}; leído=${bucketDemo}`);
  let vestingOk = true;
  const balances = lecturas.balancesReclamables ?? [];
  const consultadoEn = fechaValida(lecturas.consultadoEn ?? new Date()).getTime() / 1000;
  for (const fundador of ['andres', 'francisco']) {
    const propios = balances.filter((b) => b.fundador === fundador).sort((a, b) => Date.parse(a.fecha) - Date.parse(b.fecha));
    const suma = propios.reduce((n, b) => n + BigInt(b.stroops ?? 0), 0n);
    const target = BigInt(expected[fundador]);
    if (suma !== target) vestingOk = false;
    const calendario = calendarioDeVesting({ total: String(target), inicio: cfg.vesting?.inicio, cliffMeses: cfg.vesting?.cliffMeses ?? 12, tramos: cfg.vesting?.tramos ?? 36 });
    for (let i = 0; i < propios.length; i += 1) {
      const balance = propios[i];
      const esperado = calendario[i];
      if (!esperado || balance.fecha !== esperado.fecha || balance.stroops !== esperado.monto) vestingOk = false;
      const p = predicadoDeTramo(esperado?.fecha ?? balance.fecha);
      if (JSON.stringify(balance.reclamantes?.[0]?.predicado) !== JSON.stringify(p.principal) || JSON.stringify(balance.reclamantes?.[1]?.predicado) !== JSON.stringify(p.respaldo)) vestingOk = false;
      if (p.principal.predicado.unix < consultadoEn || p.respaldo.predicado.unix < consultadoEn) vestingOk = false;
    }
    if (propios.length !== (cfg.vesting?.tramos ?? 36)) vestingOk = false;
  }
  agregar('vesting de fundadores', vestingOk, `balances=${balances.length}`);
  const sinSaldo = String(emisor.assetBalanceStroops ?? '') === '0';
  agregar('sin saldo propio', sinSaldo, `saldo=${emisor.assetBalanceStroops ?? 0}`);
  return { ok: resultados.every((x) => x.ok), comprobaciones: resultados };
}

// Horizon entrega el predicado como { abs_before: ISO, abs_before_epoch: unix }; el SDK lo arma con segundos unix: se lee de ambas formas.
function unixDePredicado(no) {
  if (!no || typeof no !== 'object') return undefined;
  const epoca = no.abs_before_epoch ?? no.before_absolute_time;
  if (epoca !== undefined && /^[0-9]+$/.test(String(epoca))) return Number(epoca);
  const crudo = no.abs_before;
  if (crudo === undefined) return undefined;
  if (/^[0-9]+$/.test(String(crudo))) return Number(crudo);
  const ms = Date.parse(String(crudo));
  return Number.isNaN(ms) ? undefined : Math.floor(ms / 1000);
}

// Horizon entrega /assets como una pagina de registros: el registro del activo es el primero.
function registroDeActivo(pagina) {
  if (pagina && Array.isArray(pagina.records)) return pagina.records[0] ?? {};
  return pagina ?? {};
}

module.exports = { registroDeActivo, unixDePredicado, validarConfig, planDeReparto, calendarioDeVesting, predicadoDeTramo, serializarReclamantes, planDeOperaciones, verificarEmision };
