'use strict';
// Anclaje de una linea en Stellar: una transaccion clasica con MEMO_HASH = digest de la linea.
// La operacion es un bumpSequence a 0, que no cambia nada en la cuenta: la transaccion existe para llevar el memo.
// El kernel de Vespi no se usa aqui: este adaptador es de TEMIS y solo habla con Horizon.
const sdk = require('@stellar/stellar-sdk');

const RED = { passphrase: sdk.Networks.TESTNET, horizon: 'https://horizon-testnet.stellar.org', caip2: 'stellar:testnet' };
const HEX64 = /^[0-9a-f]{64}$/;

class ErrorAncla extends Error {
  constructor(mensaje) { super(mensaje); this.name = 'ErrorAncla'; }
}

// Construye (sin firmar ni enviar) la transaccion de anclaje de un digest.
function construirTransaccionAncla({ cuenta, digest, passphrase = RED.passphrase, fee = '100' }) {
  if (typeof digest !== 'string' || !HEX64.test(digest)) throw new ErrorAncla('el digest debe ser 64 hexadecimales en minuscula');
  return new sdk.TransactionBuilder(cuenta, { fee, networkPassphrase: passphrase })
    .addOperation(sdk.Operation.bumpSequence({ bumpTo: '0' }))
    .addMemo(sdk.Memo.hash(digest))
    .setTimeout(120)
    .build();
}

// Un registro de transaccion de Horizon -> una fila del libro { hash, ledger, indice, exito, memo, fuente }.
// memo es el digest en hexadecimal si la transaccion lleva MEMO_HASH, o null.
function filaDeLibro(registro) {
  const token = BigInt(registro.paging_token);
  const ledger = Number(registro.ledger_attr ?? (token >> 32n));
  const indice = Number((token >> 12n) & 0xfffffn);
  const memo = registro.memo_type === 'hash' && typeof registro.memo === 'string'
    ? Buffer.from(registro.memo, 'base64').toString('hex')
    : null;
  // fuente: la cuenta que origina la transaccion; el acuerdo declara cual cuenta ancla vale
  return { hash: registro.hash, ledger, indice, exito: registro.successful === true, memo, fuente: registro.source_account ?? null };
}

async function anclar({ servidor, par, digest, passphrase = RED.passphrase }) {
  const cuenta = await servidor.loadAccount(par.publicKey());
  const tx = construirTransaccionAncla({ cuenta, digest, passphrase });
  tx.sign(par);
  const r = await servidor.submitTransaction(tx);
  return { hash: r.hash, ledger: r.ledger, successful: r.successful === true };
}

// El historial publico de la cuenta ancla, de la primera transaccion a la ultima, como filas del libro.
async function leerLibro({ servidor, cuenta }) {
  const filas = [];
  let pagina = await servidor.transactions().forAccount(cuenta).order('asc').limit(200).call();
  for (;;) {
    for (const r of pagina.records) filas.push(filaDeLibro(r));
    if (pagina.records.length < 200) break;
    pagina = await pagina.next();
    if (!pagina.records.length) break;
  }
  return filas;
}

module.exports = { RED, ErrorAncla, construirTransaccionAncla, filaDeLibro, anclar, leerLibro };
