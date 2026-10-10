// Emisión de $TEMIS en testnet. Las llaves y el estado durable quedan fuera del repositorio.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { registroDeActivo, unixDePredicado, validarConfig, planDeReparto, calendarioDeVesting, planDeOperaciones, verificarEmision } from '../src/token.js';

const require = createRequire(import.meta.url);
const sdk = require('@stellar/stellar-sdk');
const RED = { passphrase: 'Test SDF Network ; September 2015', horizon: 'https://horizon-testnet.stellar.org' };
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = path.join(RAIZ, 'tokenomics', 'token-config.temis.json');
const SALIDA = path.join(RAIZ, 'tramos', '5', 'token.json');
const NOMBRES = ['issuer', 'distribuidora', 'tesoreria', 'ecosistema', 'liquidez', 'asesores', 'contingencia', 'andres', 'francisco', 'prueba'];

export function permisosPrivados(archivo, directorio = false, ejecutarSpawn = spawnSync) {
  try { fs.chmodSync(archivo, directorio ? 0o700 : 0o600); } catch { /* Windows puede aplicar ACL en vez de bits POSIX. */ }
  if (process.platform === 'win32' && process.env.USERNAME) {
    const usuario = process.env.USERDOMAIN ? `${process.env.USERDOMAIN}\\${process.env.USERNAME}` : process.env.USERNAME;
    ejecutarSpawn('icacls', [archivo, '/inheritance:r', '/grant:r', `${usuario}:${directorio ? '(OI)(CI)(F)' : '(F)'}`], { windowsHide: true, stdio: 'ignore' });
  }
}

// Windows rechaza a veces un rename por un instante (antivirus o indexador abriendo el archivo recien escrito): se reintenta.
function renombrarConReintentos(origen, destino) {
  for (let intento = 1; ; intento += 1) {
    try { fs.renameSync(origen, destino); return; } catch (error) {
      if (!(['EPERM', 'EBUSY', 'EACCES'].includes(error && error.code)) || intento >= 12) throw error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, Math.min(40 * intento, 400));
    }
  }
}

// Todo lo que no es una salida publica (modo 0o644) es privado: en Windows la carpeta privada quita la herencia de permisos, asi que un
// archivo temporal nuevo sin permisos explicitos no se puede ni renombrar (EPERM). El estado reanudable tambien va con permisos propios.
export function guardarJson(archivo, valor, modo, ejecutarSpawn = spawnSync) {
  const privado = modo !== 0o644;
  fs.mkdirSync(path.dirname(archivo), { recursive: true, mode: privado ? 0o700 : 0o755 });
  if (privado) permisosPrivados(path.dirname(archivo), true, ejecutarSpawn);
  const temporal = `${archivo}.${process.pid}.tmp`;
  fs.writeFileSync(temporal, `${JSON.stringify(valor, null, 2)}\n`, { mode: modo ?? 0o600 });
  if (privado) permisosPrivados(temporal, false, ejecutarSpawn);
  renombrarConReintentos(temporal, archivo);
  if (privado) permisosPrivados(archivo, false, ejecutarSpawn);
}

function cuentaActual(cuentas) {
  return Object.fromEntries(Object.entries(cuentas).map(([rol, cuenta]) => [rol, typeof cuenta === 'string' ? cuenta : cuenta.publicKey]));
}

export async function ejecutarEmision({ adaptador, config, stateFile, outputFile, ahora = () => new Date(), logger = () => {}, reclamarDemo = false, ejecutarSpawn = spawnSync }) {
  if (!adaptador || adaptador.passphrase !== RED.passphrase) throw new Error('solo testnet: la frase de red no coincide con Test SDF Network ; September 2015');
  validarConfig(config);
  if (reclamarDemo) {
    if (typeof adaptador.reclamarDemo !== 'function') throw new Error('el adaptador no permite reclamar la demo');
    return adaptador.reclamarDemo();
  }

  const configHash = createHash('sha256').update(JSON.stringify(config)).digest('hex');
  let estado = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : null;
  if (estado && estado.configHash !== configHash) throw new Error('la configuración cambió desde la última ejecución; no se reanuda una emisión con otro plan');
  if (!estado) {
    const creadas = await adaptador.crearCuentas(NOMBRES);
    const cuentas = creadas?.cuentas ?? creadas;
    estado = { version: 1, configHash, cuentas: cuentaActual(cuentas), recibosFondeo: creadas?.recibosFondeo ?? [], completados: {}, reclamoTemprano: null };
    guardarJson(stateFile, estado, undefined, ejecutarSpawn);
  }
  if (!estado.inicioDemo) { estado.inicioDemo = ahora().toISOString(); guardarJson(stateFile, estado, undefined, ejecutarSpawn); }
  const pasos = planDeOperaciones(config, estado.cuentas, { inicio: config.vesting.inicio, ahora: estado.inicioDemo });
  async function comprobarReclamoTemprano(paso) {
    try {
      await adaptador.reclamarTemprano(estado.cuentas.prueba, paso);
      estado.reclamoTemprano = { correcto: false, motivo: 'el reclamo temprano fue aceptado' };
      guardarJson(stateFile, estado, undefined, ejecutarSpawn);
      throw new Error('el reclamo temprano de la demo fue aceptado y debía fallar');
    } catch (error) {
      if (/debía fallar/.test(error.message)) throw error;
      if (!/too_early|op_not_authorized/.test(error?.message ?? String(error))) throw error;
      estado.reclamoTemprano = { correcto: true, resultado: String(error?.message ?? error), ...(error.transaccion ? { transaccion: error.transaccion } : {}) };
      guardarJson(stateFile, estado, undefined, ejecutarSpawn);
    }
  }
  for (let i = 0; i < pasos.length; i += 1) {
    const clave = String(i);
    const paso = pasos[i];
    if (estado.completados[clave]) {
      if (paso.tipo === 'balance-prueba-vesting' && !estado.reclamoTemprano) await comprobarReclamoTemprano(paso);
      continue;
    }
    const recibo = await adaptador.ejecutarPaso(paso, i, estado.cuentas);
    estado.completados[clave] = { tipo: paso.tipo, recibos: recibo?.recibos ?? (recibo ? [recibo] : []) };
    guardarJson(stateFile, estado, undefined, ejecutarSpawn);
    logger(`paso ${i + 1}/${pasos.length}: ${paso.tipo}`);
    if (paso.tipo === 'balance-prueba-vesting') await comprobarReclamoTemprano(paso);
  }

  const lecturas = await adaptador.leerEmision?.(estado.cuentas, config, ahora());
  const verificacion = adaptador.verificarEmision
    ? await adaptador.verificarEmision(lecturas, config, ahora())
    : lecturas ? verificarEmision(lecturas, config) : { ok: false, comprobaciones: [{ nombre: 'lecturas Horizon', ok: false, detalle: 'el adaptador no entregó lecturas para verificar' }] };
  const calendario = Object.fromEntries(['andres', 'francisco'].map((rol) => [rol, calendarioDeVesting({ total: planDeReparto(config)[rol], inicio: config.vesting.inicio, cliffMeses: config.vesting.cliffMeses, tramos: config.vesting.tramos })]));
  const recibos = [...(estado.recibosFondeo ?? []), ...Object.values(estado.completados).flatMap((x) => x.recibos), estado.reclamoTemprano?.transaccion].filter(Boolean);
  const manifest = {
    red: 'testnet', fraseRed: RED.passphrase, codigo: config.code,
    direcciones: estado.cuentas, transacciones: recibos.map(({ hash, ledger, hora, exito }) => ({ hash, ledger, hora, ...(exito === undefined ? {} : { exito }) })),
    ofertaStroops: config.totalStroops, ofertaTemis: montoDesdeStroops(config.totalStroops),
    reservaDemo: { stroops: '10000000', cubeta: config.vesting.demoDesde }, calendarioVesting: calendario,
    reclamoTempranoDemo: estado.reclamoTemprano, comprobaciones: verificacion.comprobaciones,
    verificado: verificacion.ok, consultadoEn: ahora().toISOString(),
    notaFrancisco: 'La cuenta francisco es una ranura de prueba. Sus tramos reales solo existen en mainnet cuando Francisco los acepte por escrito.',
  };
  guardarJson(outputFile, manifest, 0o644, ejecutarSpawn);
  if (!verificacion.ok) throw new Error('la emisión terminó, pero las comprobaciones independientes no coinciden; revisa token.json');
  return manifest;
}

function montoDesdeStroops(stroops) {
  const valor = BigInt(stroops);
  return `${valor / 10000000n}.${String(valor % 10000000n).padStart(7, '0')}`;
}

function stroopsDesdeMonto(monto) {
  const [unidades, fraccion = ''] = String(monto).split('.');
  if (!/^\d+$/.test(unidades) || !/^\d{0,7}$/.test(fraccion)) throw new Error(`monto Horizon inválido: ${monto}`);
  return (BigInt(unidades) * 10000000n + BigInt(fraccion.padEnd(7, '0') || '0')).toString();
}

function ofertaDesdeActivo(activo) {
  const partes = [
    ...Object.values(activo.balances ?? {}),
    activo.claimable_balances_amount ?? '0',
    activo.liquidity_pools_amount ?? '0',
    activo.contracts_amount ?? '0',
  ];
  return partes.reduce((suma, monto) => suma + BigInt(stroopsDesdeMonto(monto)), 0n).toString();
}

// Horizon deja el motivo de una operacion fallida en result_xdr de la transaccion (no en result_codes): se decodifica su nombre.
export function resultadoDeXdr(resultXdr) {
  try {
    const r = sdk.xdr.TransactionResult.fromXDR(String(resultXdr), 'base64');
    const operacion = r.result().results()[0].tr();
    const nombre = operacion.switch().name;
    const detalle = operacion[nombre + 'Result']?.();
    return detalle ? detalle.switch().name : null;
  } catch { return null; }
}

// Horizon entrega SIEMPRE un enlace next, aun en la ultima pagina: se termina cuando una pagina viene vacia.
export async function registrosCompletos(consumidor) {
  const primero = await consumidor.call();
  const records = [...(primero.records ?? [])];
  let pagina = primero;
  while (typeof pagina.next === 'function' && (pagina.records ?? []).length > 0) {
    pagina = await pagina.next();
    records.push(...(pagina.records ?? []));
  }
  return records;
}

function predicadoDesdeHorizon(valor) {
  const predicado = unixDePredicado(valor?.not);
  if (predicado === undefined) return null;
  const unix = Number(predicado);
  return { tipo: 'not', predicado: { tipo: 'before_absolute_time', unix } };
}

function predicadoSdk(dato) {
  if (dato.tipo === 'not') return sdk.Claimant.predicateNot(predicadoSdk(dato.predicado));
  if (dato.tipo === 'before_absolute_time') return sdk.Claimant.predicateBeforeAbsoluteTime(String(dato.unix));
  throw new Error(`predicado no reconocido: ${dato.tipo}`);
}

function reclamantesSdk(items) {
  return items.map((item) => new sdk.Claimant(item.cuenta, predicadoSdk(item.predicado)));
}

export function crearAdaptadorReal({ dirLlaves, servidor = new sdk.Horizon.Server(RED.horizon), passphrase = RED.passphrase, solicitarFriendbot, ejecutarSpawn = spawnSync }) {
  let pares = {};
  // Al reanudar no se llama a crearCuentas: las llaves se cargan del archivo privado antes de firmar.
  function cargarPares() {
    if (Object.keys(pares).length === 0 && fs.existsSync(archivoLlaves)) {
      const guardadas = JSON.parse(fs.readFileSync(archivoLlaves, 'utf8'));
      pares = Object.fromEntries(Object.entries(guardadas).map(([rol, k]) => [rol, sdk.Keypair.fromSecret(k.secret)]));
    }
    return pares;
  }
  const archivoLlaves = path.join(dirLlaves, 'keys.json');
  const guardarPrivado = (archivo, valor) => guardarJson(archivo, valor, 0o600, ejecutarSpawn);
  function guardarLlaves() {
    guardarPrivado(archivoLlaves, Object.fromEntries(Object.entries(pares).map(([rol, par]) => [rol, { publicKey: par.publicKey(), secret: par.secret() }])));
  }
  async function enviar(rol, operaciones, memo, idempotencyKey) {
    const dirTransacciones = path.join(dirLlaves, 'transacciones');
    fs.mkdirSync(dirTransacciones, { recursive: true, mode: 0o700 });
    const reciboPath = path.join(dirTransacciones, `${idempotencyKey}.json`);
    const xdrPath = path.join(dirTransacciones, `${idempotencyKey}.xdr`);
    if (fs.existsSync(reciboPath)) return JSON.parse(fs.readFileSync(reciboPath, 'utf8'));
    const par = cargarPares()[rol];
    if (!par) throw new Error(`no existe una llave Stellar para el rol emisor de la transacción: ${rol}`);
    let construido;
    if (fs.existsSync(xdrPath)) construido = sdk.TransactionBuilder.fromXDR(fs.readFileSync(xdrPath, 'utf8'), passphrase);
    else {
      const cuenta = await servidor.loadAccount(par.publicKey());
      const tx = new sdk.TransactionBuilder(cuenta, { fee: '10000', networkPassphrase: passphrase });
      for (const op of operaciones) tx.addOperation(op);
      construido = tx.addMemo(sdk.Memo.text(memo.slice(0, 28))).setTimeout(120).build();
      construido.sign(par);
      fs.writeFileSync(xdrPath, construido.toXDR(), { mode: 0o600, flag: 'wx' });
    }
    const hash = Buffer.from(construido.hash()).toString('hex');
    let recibido;
    try { recibido = await servidor.submitTransaction(construido); }
    catch (error) {
      try { recibido = await servidor.transactions().transaction(hash).call(); }
      catch { error.transactionHash = hash; throw error; }
    }
    if (recibido.successful === false) {
      const error = new Error('la transacción fue registrada como fallida en Horizon');
      error.transactionHash = hash;
      error.resultado = resultadoDeXdr(recibido.result_xdr) ?? recibido.result_codes?.operations?.[0];
      error.transaccion = { hash, ledger: recibido.ledger, hora: recibido.created_at, exito: false };
      throw error;
    }
    const comprobante = { hash: recibido.hash ?? hash, ledger: recibido.ledger, hora: recibido.created_at ?? new Date().toISOString() };
    guardarPrivado(reciboPath, comprobante);
    try { fs.rmSync(xdrPath, { force: true }); } catch { /* el recibo permite reanudar sin repetir el envío */ }
    return comprobante;
  }
  async function amigo(publicKey) {
    if (solicitarFriendbot) return solicitarFriendbot(publicKey);
    const respuesta = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`);
    if (!respuesta.ok) throw new Error(`friendbot ${respuesta.status}: ${(await respuesta.text()).slice(0, 120)}`);
    const cuerpo = await respuesta.text();
    let dato = {};
    try { dato = JSON.parse(cuerpo); } catch { dato.hash = cuerpo.match(/[0-9a-f]{64}/i)?.[0]; }
    if (!dato.hash) dato = await buscarFondeo(publicKey);
    if (!dato.hash) throw new Error(`Friendbot no devolvió ni Horizon encontró el hash de fondeo para ${publicKey}`);
    return { hash: dato.hash, ledger: dato.ledger, hora: dato.created_at ?? new Date().toISOString() };
  }
  async function buscarFondeo(publicKey) {
    const pagina = await servidor.transactions().forAccount(publicKey).order('asc').limit(5).call();
    const transaccion = pagina.records[0];
    return transaccion ? { hash: transaccion.hash, ledger: transaccion.ledger, created_at: transaccion.created_at } : {};
  }
  return {
    passphrase,
    async crearCuentas(nombres) {
      if (fs.existsSync(archivoLlaves)) {
        const guardadas = JSON.parse(fs.readFileSync(archivoLlaves, 'utf8'));
        pares = Object.fromEntries(Object.entries(guardadas).map(([rol, k]) => [rol, sdk.Keypair.fromSecret(k.secret)]));
        for (const rol of nombres) if (!pares[rol]) throw new Error(`falta la cuenta ${rol} en keys.json; no se regeneran llaves parcialmente`);
      } else {
        pares = Object.fromEntries(nombres.map((rol) => [rol, sdk.Keypair.random()]));
        guardarLlaves();
      }
      const archivoFondeos = path.join(dirLlaves, 'token-fondeos.json');
      const recibosGuardados = fs.existsSync(archivoFondeos) ? JSON.parse(fs.readFileSync(archivoFondeos, 'utf8')) : {};
      for (const rol of nombres) {
        if (recibosGuardados[rol]?.hash) continue;
        let recibo;
        try {
          await servidor.loadAccount(pares[rol].publicKey());
          recibo = await buscarFondeo(pares[rol].publicKey());
        } catch {
          recibo = await amigo(pares[rol].publicKey());
        }
        if (!recibo?.hash) throw new Error(`no se pudo recuperar el hash del fondeo de ${rol}`);
        recibosGuardados[rol] = { rol, hash: recibo.hash, ledger: recibo.ledger, hora: recibo.created_at ?? recibo.hora ?? new Date().toISOString() };
        guardarPrivado(archivoFondeos, recibosGuardados);
      }
      return { cuentas: Object.fromEntries(Object.entries(pares).map(([rol, par]) => [rol, par.publicKey()])), recibosFondeo: Object.values(recibosGuardados) };
    },
    async ejecutarPaso(paso, indice, cuentas) {
      cargarPares();
      const asset = new sdk.Asset('TEMIS', cuentas.issuer);
      const recibos = [];
      const operar = async (rol, op, sufijo = '') => {
        const subIndice = recibos.length;
        const llave = `${indice}-${subIndice}-${paso.tipo}`;
        const memoUnico = `temis:${createHash('sha256').update(llave).digest('hex').slice(0, 22)}`;
        recibos.push(await enviar(rol, [op], `${memoUnico}${sufijo}`, llave));
      };
      if (paso.tipo === 'fondeo') return { recibos: [] };
      if (paso.tipo === 'trustlines') {
        for (const destino of paso.cuentas) {
          const rol = paso.rolesPorCuenta?.[destino] ?? Object.keys(cuentas).find((x) => cuentas[x] === destino);
          if (!rol || !pares[rol]) throw new Error(`trustline sin rol propietario con llave: ${destino}`);
          await operar(rol, sdk.Operation.changeTrust({ asset, limit: montoDesdeStroops(paso.limiteStroops) }));
        }
      } else if (paso.tipo === 'emision' || paso.tipo === 'reparto') {
        const origen = paso.tipo === 'emision' ? 'issuer' : 'distribuidora';
        await operar(origen, sdk.Operation.payment({ destination: paso.hacia, asset, amount: montoDesdeStroops(paso.stroops) }));
      } else if (paso.tipo === 'balance-vesting' || paso.tipo === 'balance-prueba-vesting') {
        const fecha = Math.floor(new Date(paso.fecha).getTime() / 1000);
        await operar(paso.desdeRol ?? 'distribuidora', sdk.Operation.createClaimableBalance({ asset, amount: montoDesdeStroops(paso.stroops), claimants: reclamantesSdk(paso.reclamantes) }), `-${fecha}`);
      } else if (paso.tipo === 'quitar-firmante') {
        await operar('issuer', sdk.Operation.setOptions({ signer: { ed25519PublicKey: paso.firmante, weight: 0 } }));
      } else if (paso.tipo === 'bloquear-emisor') {
        await operar('issuer', sdk.Operation.setOptions({ masterWeight: 0, lowThreshold: 0, medThreshold: 0, highThreshold: 0 }));
      }
      return { recibos };
    },
    async reclamarTemprano(publicKey, paso) {
      cargarPares();
      const balances = await registrosCompletos(servidor.claimableBalances().claimant(publicKey).limit(200));
      const balance = balances.find((r) => r.asset === `TEMIS:${pares.issuer.publicKey()}`);
      if (!balance) throw new Error('no se encontró el balance reclamable demo');
      try { await enviar('prueba', [sdk.Operation.claimClaimableBalance({ balanceId: balance.id })], 'temis:demo-temprano', 'demo-early'); }
      catch (e) {
        const resultado = e.resultado ?? e.response?.data?.extras?.result_codes?.operations?.[0];
        if (resultado === 'op_not_authorized' || /CannotClaim/.test(String(resultado))) {
          try { fs.rmSync(path.join(dirLlaves, 'transacciones', 'demo-early.xdr'), { force: true }); } catch { /* el intento temprano quedó rechazado en Horizon */ }
          const temprano = new Error(`too_early:${resultado}`);
          temprano.transaccion = e.transaccion ?? { hash: e.transactionHash, ledger: null, hora: new Date().toISOString(), exito: false };
          throw temprano;
        }
        throw e;
      }
      throw new Error('el reclamo temprano se aceptó');
    },
    async reclamarDemo() {
      const guardadas = JSON.parse(fs.readFileSync(archivoLlaves, 'utf8'));
      pares = Object.fromEntries(Object.entries(guardadas).map(([rol, k]) => [rol, sdk.Keypair.fromSecret(k.secret)]));
      const balances = await registrosCompletos(servidor.claimableBalances().claimant(pares.prueba.publicKey()).limit(200));
      const balance = balances.find((r) => r.asset === `TEMIS:${pares.issuer.publicKey()}`);
      if (!balance) throw new Error('no se encontró el balance reclamable demo');
      return enviar('prueba', [sdk.Operation.claimClaimableBalance({ balanceId: balance.id })], 'temis:demo-reclamo', 'demo-claim');
    },
    async leerEmision(cuentas, config, consultadoEn = new Date()) {
      const idEmisor = cuentas.issuer;
      const [cuentaEmisora, activo] = await Promise.all([
        servidor.loadAccount(idEmisor),
        servidor.assets().forCode(config.code).forIssuer(idEmisor).call(),
      ]);
      const pesoMaestro = cuentaEmisora.signers.find((s) => s.key === idEmisor)?.weight ?? 0;
      const saldos = {};
      const assetBalance = (cuenta) => cuenta.balances.find((b) => b.asset_code === config.code && b.asset_issuer === idEmisor)?.balance ?? '0';
      for (const rol of Object.keys(config.buckets)) {
        if (rol === 'fundadores' || config.buckets[rol].porcentaje === 0) continue;
        const account = await servidor.loadAccount(cuentas[rol]);
        saldos[rol] = stroopsDesdeMonto(assetBalance(account));
      }
      const balancesReclamables = [];
      for (const fundador of ['andres', 'francisco']) {
        const balances = await registrosCompletos(servidor.claimableBalances().claimant(cuentas[fundador]).limit(200));
        for (const balance of balances) {
          if (balance.asset !== `${config.code}:${idEmisor}`) continue;
          const principal = balance.claimants.find((c) => c.destination === cuentas[fundador]);
          const respaldo = balance.claimants.find((c) => c.destination === cuentas.tesoreria);
          if (!principal || !respaldo) continue;
          balancesReclamables.push({
            fundador, stroops: stroopsDesdeMonto(balance.amount),
            fecha: new Date(unixDePredicado(principal.predicate?.not) * 1000).toISOString(),
            reclamantes: [
              { cuenta: cuentas[fundador], predicado: predicadoDesdeHorizon(principal.predicate) },
              { cuenta: cuentas.tesoreria, predicado: predicadoDesdeHorizon(respaldo.predicate) },
            ],
          });
        }
      }
      const cuentaPrueba = await servidor.loadAccount(cuentas.prueba);
      let balancePrueba = BigInt(stroopsDesdeMonto(assetBalance(cuentaPrueba)));
      const balancesDemo = await registrosCompletos(servidor.claimableBalances().claimant(cuentas.prueba).limit(20));
      for (const balance of balancesDemo) if (balance.asset === `${config.code}:${idEmisor}`) balancePrueba += BigInt(stroopsDesdeMonto(balance.amount));
      saldos.prueba = balancePrueba.toString();
      for (const fundador of ['andres', 'francisco']) {
        saldos[fundador] = balancesReclamables.filter((b) => b.fundador === fundador).reduce((s, b) => (BigInt(s) + BigInt(b.stroops)).toString(), '0');
      }
      return {
        consultadoEn: consultadoEn.toISOString(),
        cuentaEmisora: {
          account_id: cuentaEmisora.account_id, masterWeight: pesoMaestro,
          thresholds: cuentaEmisora.thresholds, signers: cuentaEmisora.signers,
          assetBalanceStroops: stroopsDesdeMonto(assetBalance(cuentaEmisora)),
        },
        activo: { supplyStroops: ofertaDesdeActivo(registroDeActivo(activo)), flags: registroDeActivo(activo).flags },
        saldos, balancesReclamables,
      };
    },
  };
}

function imprimirPlan(config) {
  const roles = Object.fromEntries(NOMBRES.map((rol) => [rol, `<cuenta ${rol}>`]));
  const pasos = planDeOperaciones(config, roles, { inicio: config.vesting.inicio });
  console.log(JSON.stringify({ red: 'testnet', código: config.code, ofertaStroops: config.totalStroops, pasos }, null, 2));
}

async function main() {
  const args = process.argv.slice(2);
  const config = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
  const inicioIndice = args.indexOf('--inicio');
  if (inicioIndice >= 0) {
    const inicio = new Date(args[inicioIndice + 1]);
    if (Number.isNaN(inicio.getTime())) throw new Error('--inicio requiere una fecha ISO válida');
    config.vesting.inicio = inicio.toISOString();
  }
  if (args.includes('--plan')) return imprimirPlan(config);
  const dirLlaves = path.resolve(process.env.TEMIS_KEYS_DIR || path.join(os.homedir(), '.temis-testnet'));
  const adaptador = crearAdaptadorReal({ dirLlaves });
  if (adaptador.passphrase !== RED.passphrase) throw new Error('solo testnet');
  if (args.includes('--reclamar-demo')) {
    const resultado = await adaptador.reclamarDemo();
    if (fs.existsSync(SALIDA)) {
      const manifiesto = JSON.parse(fs.readFileSync(SALIDA, 'utf8'));
      const recibo = { hash: resultado.hash, ledger: resultado.ledger, hora: resultado.created_at ?? new Date().toISOString() };
      manifiesto.reclamoExitosoDemo = recibo;
      manifiesto.transacciones.push(recibo);
      guardarJson(SALIDA, manifiesto, 0o644);
    }
    console.log(`reclamo demo confirmado: ${resultado.hash}`);
    return;
  }
  const resultado = await ejecutarEmision({ adaptador, config, stateFile: path.join(dirLlaves, 'token-state.json'), outputFile: SALIDA, logger: console.log });
  console.log(JSON.stringify({ archivo: SALIDA, verificado: resultado.verificado, notaFrancisco: resultado.notaFrancisco }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(`FALLO: ${e.stack ?? e.message}`); process.exitCode = 1; });
}
