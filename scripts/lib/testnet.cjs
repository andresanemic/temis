'use strict';
// Ayudas de testnet para los scripts de prueba de TEMIS. Solo testnet, solo cuentas de fantasia.
// Una cuenta con USDC de testnet se arma igual que la corrida real del 2026-10-02: friendbot (XLM), linea de confianza
// y un pago por ruta XLM -> USDC en el DEX de testnet. Nada de esto toca mainnet ni dinero real.
const sdk = require('@stellar/stellar-sdk');

const RED = {
  passphrase: sdk.Networks.TESTNET,
  horizon: 'https://horizon-testnet.stellar.org',
  rpc: 'https://soroban-testnet.stellar.org',
  caip2: 'stellar:testnet',
  emisorUsdc: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  contratoUsdc: 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA',
};
const USDC = new sdk.Asset('USDC', RED.emisorUsdc);
const horizon = () => new sdk.Horizon.Server(RED.horizon);
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

async function friendbot(cuenta) {
  const r = await fetch(`https://friendbot.stellar.org?addr=${cuenta}`);
  if (!r.ok) throw new Error(`friendbot ${r.status}: ${(await r.text()).slice(0, 120)}`);
}

async function enviar(servidor, par, operaciones) {
  const cuenta = await servidor.loadAccount(par.publicKey());
  const b = new sdk.TransactionBuilder(cuenta, { fee: '10000', networkPassphrase: RED.passphrase });
  for (const op of operaciones) b.addOperation(op);
  const tx = b.setTimeout(120).build();
  tx.sign(par);
  return servidor.submitTransaction(tx);
}

// Una cuenta nueva con linea de confianza a USDC y, si se pide, un saldo de USDC comprado en el DEX.
async function cuentaConUsdc({ usdc = '0', confianza = true } = {}) {
  const servidor = horizon();
  const par = sdk.Keypair.random();
  await friendbot(par.publicKey());
  if (confianza) await enviar(servidor, par, [sdk.Operation.changeTrust({ asset: USDC })]);
  if (Number(usdc) > 0) {
    await enviar(servidor, par, [sdk.Operation.pathPaymentStrictReceive({
      sendAsset: sdk.Asset.native(), sendMax: '2000', destination: par.publicKey(), destAsset: USDC, destAmount: String(usdc), path: [],
    })]);
  }
  return par;
}

module.exports = { RED, USDC, horizon, dormir, friendbot, enviar, cuentaConUsdc };
