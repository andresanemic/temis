// Verifica una emisión pública en Horizon sin cargar llaves.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { registroDeActivo, unixDePredicado, verificarEmision, planDeReparto } from '../src/token.js';

const require = createRequire(import.meta.url);
const sdk = require('@stellar/stellar-sdk');
const FRASE_TESTNET = 'Test SDF Network ; September 2015';
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = JSON.parse(fs.readFileSync(path.join(RAIZ, 'tokenomics', 'token-config.temis.json'), 'utf8'));
const MANIFEST_DEFAULT = path.join(RAIZ, 'tramos', '5', 'token.json');
const HORIZON = 'https://horizon-testnet.stellar.org';

function stroops(monto) {
  const [u, f = ''] = String(monto).split('.');
  return (BigInt(u) * 10000000n + BigInt(f.padEnd(7, '0') || '0')).toString();
}

function ofertaDesdeActivo(activo) {
  const partes = [
    ...Object.values(activo.balances ?? {}),
    activo.claimable_balances_amount ?? '0',
    activo.liquidity_pools_amount ?? '0',
    activo.contracts_amount ?? '0',
  ];
  return partes.reduce((suma, monto) => suma + BigInt(stroops(monto)), 0n).toString();
}

function predicadoHorizon(valor) {
  const t = unixDePredicado(valor?.not);
  return t === undefined ? null : { tipo: 'not', predicado: { tipo: 'before_absolute_time', unix: Number(t) } };
}

async function registrosCompletos(consumidor) {
  const primero = await consumidor.call();
  const records = [...(primero.records ?? [])];
  let pagina = primero;
  while (typeof pagina.next === 'function' && (pagina.records ?? []).length > 0) {
    pagina = await pagina.next();
    records.push(...(pagina.records ?? []));
  }
  return records;
}

async function leerLecturas(servidor, emisor, direcciones, config) {
  const asset = new sdk.Asset(config.code, emisor);
  const [cuentaEmisora, activo, tenedores, reclamables] = await Promise.all([
    servidor.loadAccount(emisor),
    servidor.assets().forCode(config.code).forIssuer(emisor).call(),
    servidor.accounts().forAsset(asset).limit(200).call(),
    registrosCompletos(servidor.claimableBalances().asset(asset).limit(200)),
  ]);
  const pesoMaestro = cuentaEmisora.signers.find((s) => s.key === emisor)?.weight ?? 0;
  const balanceDe = (cuenta) => cuenta.balances.find((b) => b.asset_code === config.code && b.asset_issuer === emisor)?.balance ?? '0';
  const titulares = tenedores.records.map((cuenta) => ({ id: cuenta.account_id, monto: stroops(balanceDe(cuenta)) })).filter((x) => BigInt(x.monto) > 0n);
  const esperado = planDeReparto(config);
  const saldos = {};
  const usados = new Set();
  for (const rol of Object.keys(config.buckets)) {
    if (rol === 'fundadores' || config.buckets[rol].porcentaje === 0) continue;
    const idManifest = direcciones?.[rol];
    const tenedor = idManifest ? titulares.find((x) => x.id === idManifest) : titulares.find((x) => !usados.has(x.id) && x.monto === esperado[rol]);
    if (tenedor) usados.add(tenedor.id);
    saldos[rol] = tenedor?.monto ?? '';
  }
  const porCuenta = new Map();
  for (const balance of reclamables) {
    const candidatos = balance.claimants.filter((c) => unixDePredicado(c.predicate?.not) !== undefined);
    if (candidatos.length !== 2) continue;
    const hora = (c) => unixDePredicado(c.predicate.not);
    const ordenados = candidatos.toSorted((a, b) => hora(a) - hora(b));
    const principal = direcciones?.tesoreria
      ? candidatos.find((c) => c.destination !== direcciones.tesoreria) ?? ordenados[0]
      : ordenados[0];
    const respaldo = direcciones?.tesoreria
      ? candidatos.find((c) => c.destination === direcciones.tesoreria) ?? candidatos.find((c) => c.destination !== principal.destination)
      : candidatos.find((c) => c.destination !== principal.destination);
    const monto = stroops(balance.amount);
    if (monto === '10000000') continue;
    const grupo = porCuenta.get(principal.destination) ?? [];
    grupo.push({ fundador: '', stroops: monto, fecha: new Date(unixDePredicado(principal.predicate?.not) * 1000).toISOString(), reclamantes: [{ cuenta: principal.destination, predicado: predicadoHorizon(principal.predicate) }, { cuenta: respaldo?.destination, predicado: predicadoHorizon(respaldo?.predicate) }] });
    porCuenta.set(principal.destination, grupo);
  }
  const grupos = [...porCuenta.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const rolesFounder = direcciones?.andres && direcciones?.francisco
    ? [['andres', direcciones.andres], ['francisco', direcciones.francisco]]
    : [['andres', grupos[0]?.[0]], ['francisco', grupos[1]?.[0]]];
  const balancesReclamables = [];
  for (const [rol, direccion] of rolesFounder) {
    const grupo = porCuenta.get(direccion) ?? [];
    grupo.forEach((balance) => balancesReclamables.push({ ...balance, fundador: rol }));
    saldos[rol] = grupo.reduce((n, b) => (BigInt(n) + BigInt(b.stroops)).toString(), '0');
  }
  const direccionPrueba = direcciones?.prueba;
  let saldoPrueba = BigInt(direccionPrueba ? (titulares.find((x) => x.id === direccionPrueba)?.monto ?? '0') : '0');
  if (!direccionPrueba) saldoPrueba = BigInt(titulares.find((x) => x.monto === '10000000')?.monto ?? '0');
  for (const balance of reclamables) {
    if (balance.asset !== `${config.code}:${emisor}`) continue;
    if (balance.claimants.some((c) => direccionPrueba ? c.destination === direccionPrueba : stroops(balance.amount) === '10000000')) saldoPrueba += BigInt(stroops(balance.amount));
  }
  saldos.prueba = saldoPrueba.toString();
  return {
    consultadoEn: new Date().toISOString(),
    cuentaEmisora: { account_id: emisor, masterWeight: pesoMaestro, thresholds: cuentaEmisora.thresholds, signers: cuentaEmisora.signers, assetBalanceStroops: stroops(balanceDe(cuentaEmisora)) },
    activo: { supplyStroops: ofertaDesdeActivo(registroDeActivo(activo)), flags: registroDeActivo(activo).flags }, saldos, balancesReclamables,
  };
}

function imprimir(resultado) {
  const ancho = Math.max(...resultado.comprobaciones.map((x) => x.nombre.length), 14);
  console.log(`${'Comprobación'.padEnd(ancho)} | Estado | Detalle`);
  console.log(`${'-'.repeat(ancho)}-+--------+--------`);
  for (const fila of resultado.comprobaciones) console.log(`${fila.nombre.padEnd(ancho)} | ${fila.ok ? 'PASA' : 'FALLA'}  | ${fila.detalle}`);
  console.log(`\nResultado: ${resultado.ok ? 'verificado' : 'no verificado'}`);
}

async function main() {
  const args = process.argv.slice(2);
  const valor = (nombre) => { const i = args.indexOf(nombre); return i < 0 ? null : args[i + 1]; };
  const manifiestoSolicitado = valor('--manifest');
  const manifestPath = manifiestoSolicitado ?? MANIFEST_DEFAULT;
  const candidato = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : null;
  const emisor = valor('--issuer') ?? candidato?.direcciones?.issuer;
  if (!emisor) throw new Error('indica --issuer G... o proporciona tramos/5/token.json');
  if (manifiestoSolicitado && candidato?.direcciones?.issuer !== emisor) throw new Error('el manifiesto no corresponde a la emisora indicada');
  const manifest = candidato?.direcciones?.issuer === emisor ? candidato : null;
  if (manifest && (manifest.red !== 'testnet' || manifest.fraseRed !== FRASE_TESTNET)) throw new Error('el manifiesto no declara la red de testnet esperada');
  const servidor = new sdk.Horizon.Server(HORIZON);
  const emision = await leerLecturas(servidor, emisor, manifest?.direcciones, CONFIG);
  const resultado = verificarEmision(emision, CONFIG);
  imprimir(resultado);
  process.exitCode = resultado.ok ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(`FALLO: ${e.message}`); process.exitCode = 1; });
}

export { leerLecturas };
