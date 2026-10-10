'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const sdk = require('@stellar/stellar-sdk');
const a = require('../src/ancla.js');

const DIGEST = '37e86a542730a4a6'.repeat(4);

test('la transaccion de anclaje lleva MEMO_HASH igual al digest y una sola operacion sin efecto', () => {
  const par = sdk.Keypair.random();
  const cuenta = new sdk.Account(par.publicKey(), '100');
  const tx = a.construirTransaccionAncla({ cuenta, digest: DIGEST });
  assert.equal(tx.memo.type, 'hash');
  assert.equal(Buffer.from(tx.memo.value).toString('hex'), DIGEST);
  assert.equal(tx.operations.length, 1);
  assert.equal(tx.operations[0].type, 'bumpSequence');
  assert.equal(tx.operations[0].bumpTo, '0');
  assert.equal(tx.networkPassphrase, sdk.Networks.TESTNET);
});

test('el digest debe ser 64 hexadecimales en minuscula', () => {
  const cuenta = new sdk.Account(sdk.Keypair.random().publicKey(), '1');
  for (const malo of ['', 'xyz', DIGEST.toUpperCase(), DIGEST.slice(1), DIGEST + '0', null]) {
    assert.throws(() => a.construirTransaccionAncla({ cuenta, digest: malo }), a.ErrorAncla);
  }
});

test('la transaccion firmada se puede serializar y volver a leer con su memo', () => {
  const par = sdk.Keypair.random();
  const tx = a.construirTransaccionAncla({ cuenta: new sdk.Account(par.publicKey(), '7'), digest: DIGEST });
  tx.sign(par);
  const de = sdk.TransactionBuilder.fromXDR(tx.toXDR(), sdk.Networks.TESTNET);
  assert.equal(Buffer.from(de.memo.value).toString('hex'), DIGEST);
  assert.equal(de.signatures.length, 1);
});

test('un registro de Horizon con MEMO_HASH se vuelve una fila del libro con el digest en hexadecimal', () => {
  const ledger = 4988161n;
  const token = (ledger << 32n) | (3n << 12n);
  const fila = a.filaDeLibro({
    hash: 'ab'.repeat(32), paging_token: token.toString(), ledger_attr: 4988161, successful: true,
    memo_type: 'hash', memo: Buffer.from(DIGEST, 'hex').toString('base64'), source_account: 'GAAA',
  });
  assert.deepEqual(fila, { hash: 'ab'.repeat(32), ledger: 4988161, indice: 3, exito: true, memo: DIGEST, fuente: 'GAAA' });
});

test('un registro sin MEMO_HASH, o fallido, no abre estado', () => {
  const base = { hash: 'cd'.repeat(32), paging_token: ((10n << 32n) | (1n << 12n)).toString(), ledger_attr: 10 };
  assert.equal(a.filaDeLibro({ ...base, successful: true, memo_type: 'none' }).memo, null);
  assert.equal(a.filaDeLibro({ ...base, successful: true, memo_type: 'text', memo: 'hola' }).memo, null);
  assert.equal(a.filaDeLibro({ ...base, successful: false, memo_type: 'hash', memo: Buffer.from(DIGEST, 'hex').toString('base64') }).exito, false);
});
