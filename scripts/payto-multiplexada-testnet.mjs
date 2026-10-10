// Paso 5 del §17: la prueba de la `payTo` multiplexada. Un payload con destino multiplexado (direccion M) contra `/verify`
// y `/settle` del facilitador x402 de testnet. Sale positivo o negativo y en los dos casos el documento dice lo mismo.
// Hay un control: el mismo pago con `payTo` normal (G) contra `/verify`, para saber que el arnes funciona y que un negativo
// con M es del destino multiplexado y no de la corrida. Escribe tramos/4/payto-multiplexada.json. Solo testnet, cuentas de fantasia.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { x402Client } from '@x402/core/client';
import { HTTPFacilitatorClient } from '@x402/core/server';
import { createEd25519Signer } from '@x402/stellar';
import { ExactStellarScheme } from '@x402/stellar/exact/client';

const require = createRequire(import.meta.url);
const sdk = require('@stellar/stellar-sdk');
const { RED, cuentaConUsdc } = require('./lib/testnet.cjs');

const SALIDA = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'tramos', '4');
const FACILITADOR = process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator';
const IMPORTE = '100000';

const requisitos = (payTo) => ({
  scheme: 'exact',
  network: RED.caip2,
  asset: RED.contratoUsdc,
  amount: IMPORTE,
  payTo,
  maxTimeoutSeconds: 120,
  extra: { areFeesSponsored: true },
});

async function payload(pagador, req) {
  const firmante = createEd25519Signer(pagador.secret(), RED.caip2);
  const cliente = new x402Client().register('stellar:*', new ExactStellarScheme(firmante, { url: RED.rpc }));
  const pr = { x402Version: 2, resource: { url: 'https://temis.invalid/prueba-payto', description: 'prueba de payTo multiplexada', mimeType: 'application/json' }, accepts: [req] };
  return cliente.createPaymentPayload(pr);
}

const conservar = (x) => JSON.parse(JSON.stringify(x, (k, v) => (typeof v === 'bigint' ? String(v) : v)));

async function intentar(etiqueta, fn) {
  try {
    return { etiqueta, ok: true, respuesta: conservar(await fn()) };
  } catch (e) {
    return { etiqueta, ok: false, error: String(e?.message ?? e), nombre: e?.name ?? null, detalle: conservar({ codigo: e?.errorReason ?? e?.reason ?? null, mensaje: e?.errorMessage ?? null }) };
  }
}

async function main() {
  const facilitador = new HTTPFacilitatorClient({ url: FACILITADOR });
  console.log('cuentas de fantasia en testnet…');
  const pagador = await cuentaConUsdc({ usdc: '2' });
  const receptor = await cuentaConUsdc({ usdc: '0' });
  const idMux = '987654321';
  const muxed = new sdk.MuxedAccount(new sdk.Account(receptor.publicKey(), '0'), idMux).accountId();
  console.log('pagador', pagador.publicKey(), '| receptor', receptor.publicKey(), '| multiplexada', muxed);

  const resultado = {
    fecha: new Date().toISOString(),
    facilitador: FACILITADOR,
    red: RED.caip2,
    pagador: pagador.publicKey(),
    receptor: receptor.publicKey(),
    multiplexada: muxed,
    id_multiplexado: idMux,
    pasos: [],
  };

  // Control: payTo normal contra /verify (no liquida).
  const reqG = requisitos(receptor.publicKey());
  const pasoControl = await intentar('control: payTo G, construir payload y /verify', async () => {
    const p = await payload(pagador, reqG);
    return facilitador.verify(p, reqG);
  });
  resultado.pasos.push(pasoControl);
  console.log('control /verify G ->', JSON.stringify(pasoControl).slice(0, 300));

  // Prueba: payTo multiplexada.
  const reqM = requisitos(muxed);
  let pM = null;
  const construir = await intentar('prueba: payTo M, construir el payload', async () => {
    pM = await payload(pagador, reqM);
    return { construido: true, tiene_authorization: Boolean(pM?.payload) };
  });
  resultado.pasos.push(construir);
  console.log('construir payload M ->', JSON.stringify(construir).slice(0, 300));
  if (construir.ok) {
    const v = await intentar('prueba: payTo M, /verify', () => facilitador.verify(pM, reqM));
    resultado.pasos.push(v);
    console.log('/verify M ->', JSON.stringify(v).slice(0, 300));
    if (v.ok && v.respuesta?.isValid === true) {
      const s = await intentar('prueba: payTo M, /settle', () => facilitador.settle(pM, reqM));
      resultado.pasos.push(s);
      console.log('/settle M ->', JSON.stringify(s).slice(0, 400));
    }
  }

  const verificoM = resultado.pasos.find((p) => p.etiqueta === 'prueba: payTo M, /verify');
  const settleM = resultado.pasos.find((p) => p.etiqueta === 'prueba: payTo M, /settle');
  resultado.resultado = settleM?.ok && settleM.respuesta?.success === true
    ? 'positivo: el facilitador verifico y liquido un pago con payTo multiplexada'
    : verificoM?.ok && verificoM.respuesta?.isValid === true
      ? 'parcial: /verify acepto la payTo multiplexada pero /settle no la liquido'
      : 'negativo: la payTo multiplexada no pasa por el facilitador (ver cada paso)';
  fs.mkdirSync(SALIDA, { recursive: true });
  fs.writeFileSync(path.join(SALIDA, 'payto-multiplexada.json'), `${JSON.stringify(resultado, null, 2)}\n`);
  console.log('RESULTADO:', resultado.resultado);
}

main().catch((e) => { console.error('FALLO:', e.stack || e.message); process.exit(1); });
