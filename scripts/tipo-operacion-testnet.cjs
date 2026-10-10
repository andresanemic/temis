'use strict';
// Paso 6 del §17: la prueba del tipo de operacion. Un mismo pago de 0,01 USDC se hace de las dos maneras posibles,
// como operacion clasica `payment` y como invocacion del contrato de activo (`transfer`, que es lo que hace x402),
// y se lee en cada transaccion el tipo de operacion y los eventos. La pregunta: ¿alcanza un evento para saber como
// se hizo el pago? Escribe el resultado en tramos/4/tipo-operacion.json. Solo testnet, cuentas de fantasia.
const fs = require('node:fs');
const path = require('node:path');
const sdk = require('@stellar/stellar-sdk');
const { RED, USDC, horizon, dormir, cuentaConUsdc, enviar } = require('./lib/testnet.cjs');

const MONTO_ATOMICO = 100000n; // 0,01 USDC con siete decimales
const SALIDA = path.join(__dirname, '..', 'tramos', '4');

async function esperarTx(rpc, hash) {
  for (let i = 0; i < 40; i += 1) {
    const r = await rpc.getTransaction(hash);
    if (r.status !== 'NOT_FOUND') return r;
    await dormir(1500);
  }
  throw new Error(`la transaccion ${hash} no aparecio en el RPC`);
}

// Los eventos de una transaccion, normalizados a texto para poder compararlos sin mirar el XDR.
function eventosDe(r) {
  const lista = [];
  const crudos = [];
  const meta = r.resultMetaXdr;
  const m = typeof meta === 'string' ? sdk.xdr.TransactionMeta.fromXDR(meta, 'base64') : meta;
  const v = m.switch();
  if (v === 4) {
    const v4 = m.v4();
    for (const e of v4.events()) crudos.push(e.event());
    for (const op of v4.operations()) for (const e of op.events()) crudos.push(e);
  } else if (v === 3) {
    const soroban = m.v3().sorobanMeta();
    if (soroban) for (const e of soroban.events()) crudos.push(e);
  }
  for (const e of crudos) {
    const cuerpo = e.body().v0();
    lista.push({
      tipo: e.type().name,
      contrato: e.contractId() ? sdk.StrKey.encodeContract(e.contractId()) : null,
      topics: cuerpo.topics().map((t) => String(sdk.scValToNative(t))),
      datos: String(sdk.scValToNative(cuerpo.data())),
    });
  }
  return lista;
}

async function main() {
  const servidor = horizon();
  const rpc = new sdk.rpc.Server(RED.rpc);
  console.log('cuentas de fantasia en testnet…');
  const pagador = await cuentaConUsdc({ usdc: '2' });
  const receptor = await cuentaConUsdc({ usdc: '0' });
  console.log('pagador', pagador.publicKey(), 'receptor', receptor.publicKey());

  // A. operacion clasica
  const clasica = await enviar(servidor, pagador, [sdk.Operation.payment({ destination: receptor.publicKey(), asset: USDC, amount: '0.0100000' })]);
  console.log('clasica ->', clasica.hash);

  // B. invocacion del contrato de activo
  const contrato = new sdk.Contract(RED.contratoUsdc);
  const cuenta = await rpc.getAccount(pagador.publicKey());
  const armada = new sdk.TransactionBuilder(cuenta, { fee: '10000', networkPassphrase: RED.passphrase })
    .addOperation(contrato.call('transfer', new sdk.Address(pagador.publicKey()).toScVal(), new sdk.Address(receptor.publicKey()).toScVal(), sdk.nativeToScVal(MONTO_ATOMICO, { type: 'i128' })))
    .setTimeout(120)
    .build();
  const preparada = await rpc.prepareTransaction(armada);
  preparada.sign(pagador);
  const enviada = await rpc.sendTransaction(preparada);
  if (enviada.status === 'ERROR') throw new Error(`sendTransaction: ${JSON.stringify(enviada.errorResult)}`);
  const contratoTx = await esperarTx(rpc, enviada.hash);
  if (contratoTx.status !== 'SUCCESS') throw new Error(`la invocacion no tuvo exito: ${contratoTx.status}`);
  console.log('contrato ->', enviada.hash);

  // Lo que se lee de cada una
  const lectura = {};
  for (const [nombre, hash] of [['clasica', clasica.hash], ['contrato', enviada.hash]]) {
    const ops = await (await fetch(`${RED.horizon}/transactions/${hash}/operations`)).json();
    const tx = await esperarTx(rpc, hash);
    lectura[nombre] = {
      hash,
      ledger: tx.ledger,
      operaciones: ops._embedded.records.map((o) => ({ tipo: o.type, funcion: o.function ?? null })),
      eventos: eventosDe(tx),
    };
  }
  const transfers = (nombre) => lectura[nombre].eventos.filter((e) => e.topics[0] === 'transfer');
  const norm = (e) => JSON.stringify({ topics: e.topics, datos: e.datos, contrato: e.contrato });
  const a = transfers('clasica').map(norm);
  const b = transfers('contrato').map(norm);
  const eventoIgual = a.length === 1 && b.length === 1 && a[0] === b[0];
  const resultado = {
    fecha: new Date().toISOString(),
    red: RED.caip2,
    importe_atomico: String(MONTO_ATOMICO),
    pagador: pagador.publicKey(),
    receptor: receptor.publicKey(),
    lectura,
    eventos_transfer_clasica: a.length,
    eventos_transfer_contrato: b.length,
    evento_transfer_identico: eventoIgual,
    tipos_distintos: lectura.clasica.operaciones[0].tipo !== lectura.contrato.operaciones[0].tipo,
    conclusion: eventoIgual
      ? 'El evento de transferencia es identico en los dos pagos; solo el tipo de la operacion en la transaccion dice como se hizo. Un evento no prueba el tipo de pago.'
      : 'Los eventos de transferencia difieren entre los dos pagos; ver `lectura` para saber en que. Esto cambia la afirmacion del whitepaper y hay que corregirlo.',
  };
  fs.mkdirSync(SALIDA, { recursive: true });
  fs.writeFileSync(path.join(SALIDA, 'tipo-operacion.json'), `${JSON.stringify(resultado, null, 2)}\n`);
  console.log(JSON.stringify({ tipos: [lectura.clasica.operaciones[0].tipo, lectura.contrato.operaciones[0].tipo], eventoIgual, a: a[0], b: b[0] }, null, 1));
}

main().catch((e) => { console.error('FALLO:', e.stack || e.message); process.exit(1); });
