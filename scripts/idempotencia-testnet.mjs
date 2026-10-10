// Paso 7 del §17, en vivo: reintentar una liquidacion y comprobar que cobra una vez, incluida la que falla despues de entregar
// el servicio. El cobro pasa por la tabla durable de src/pagos.js y el facilitador x402 de testnet. Se cuentan las llamadas al
// facilitador y, al final, los pagos reales de la cuenta pagadora a la receptora en Horizon: tiene que ser uno.
// Ademas se documenta, aparte, que hace el facilitador si se le reenvia el mismo payload sin pasar por la tabla.
// Escribe tramos/4/idempotencia.json. Solo testnet, cuentas de fantasia.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { x402Client } from '@x402/core/client';
import { HTTPFacilitatorClient } from '@x402/core/server';
import { createEd25519Signer } from '@x402/stellar';
import { ExactStellarScheme } from '@x402/stellar/exact/client';

const require = createRequire(import.meta.url);
const sdk = require('@stellar/stellar-sdk');
const { RED, cuentaConUsdc, dormir } = require('./lib/testnet.cjs');
const { abrirTablaPagos } = require('../src/pagos.js');

const SALIDA = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'tramos', '4');
const FACILITADOR = process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator';
const conservar = (x) => JSON.parse(JSON.stringify(x, (k, v) => (typeof v === 'bigint' ? String(v) : v)));

async function main() {
  const facilitador = new HTTPFacilitatorClient({ url: FACILITADOR });
  console.log('cuentas de fantasia en testnet…');
  const pagador = await cuentaConUsdc({ usdc: '2' });
  const receptor = await cuentaConUsdc({ usdc: '0' });
  const req = { scheme: 'exact', network: RED.caip2, asset: RED.contratoUsdc, amount: '100000', payTo: receptor.publicKey(), maxTimeoutSeconds: 120, extra: { areFeesSponsored: true } };
  const firmante = createEd25519Signer(pagador.secret(), RED.caip2);
  const cliente = new x402Client().register('stellar:*', new ExactStellarScheme(firmante, { url: RED.rpc }));
  const pago = await cliente.createPaymentPayload({ x402Version: 2, resource: { url: 'https://temis.invalid/idempotencia', description: 'prueba de idempotencia', mimeType: 'application/json' }, accepts: [req] });

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'temis-idem-'));
  const tabla = abrirTablaPagos(dir);
  const clave = { acuerdo: 'exp-idempotencia-vivo', capacidad: 'pago-de-hito', pago: 'h1:honorario' }; // la obligacion que se paga, no la autorizacion (§14)
  let llamadas = 0;
  const liquidarEnLaRed = async () => {
    llamadas += 1;
    const v = await facilitador.verify(pago, req);
    if (!v.isValid) throw new Error(`verify rechazo: ${v.invalidReason}`);
    const s = await facilitador.settle(pago, req);
    if (!s.success) throw new Error(`settle rechazo: ${s.errorReason ?? JSON.stringify(s)}`);
    return { tx: s.transaction, red: s.network, pagador: s.payer };
  };

  const pasos = [];
  const registrar = (nombre, dato) => { pasos.push({ nombre, ...conservar(dato) }); console.log(nombre, JSON.stringify(conservar(dato)).slice(0, 260)); };

  const a = await tabla.liquidar(clave, liquidarEnLaRed);
  registrar('1. primera liquidacion', { estado: a.estado, nueva: a.nueva, resultado: a.resultado, llamadas_al_facilitador: llamadas });
  if (a.estado !== 'liquidado') throw new Error(`la primera liquidacion no quedo liquidada: ${JSON.stringify(a)}`);

  const b = await tabla.liquidar(clave, liquidarEnLaRed);
  registrar('2. reintento de la misma liquidacion', { estado: b.estado, nueva: b.nueva, mismo_resultado: JSON.stringify(b.resultado) === JSON.stringify(a.resultado), llamadas_al_facilitador: llamadas });

  const e1 = await tabla.entregar(clave, async () => { throw new Error('el servicio se cayo despues de cobrar'); });
  registrar('3. la entrega falla despues de cobrar', { estado: e1.estado, error: e1.error, llamadas_al_facilitador: llamadas });
  const c = await tabla.liquidar(clave, liquidarEnLaRed);
  registrar('4. se reintenta el cobro tras el fallo de entrega', { estado: c.estado, nueva: c.nueva, llamadas_al_facilitador: llamadas });
  const e2 = await tabla.entregar(clave, async () => ({ servicio: 'plan entregado' }));
  registrar('5. la entrega se reintenta y sale', { estado: e2.estado, resultado: e2.resultado, llamadas_al_facilitador: llamadas });

  // Lo que dice la red: cuantos pagos de USDC hay de la pagadora a la receptora.
  await dormir(4000);
  const servidor = new sdk.Horizon.Server(RED.horizon);
  const efectos = await servidor.effects().forAccount(receptor.publicKey()).order('asc').limit(50).call();
  const abonos = efectos.records.filter((e) => e.type === 'account_credited' && e.asset_code === 'USDC');
  registrar('6. abonos de USDC a la receptora en Horizon', { abonos: abonos.length, importes: abonos.map((e) => e.amount) });

  // Aparte: que hace el facilitador si se le reenvia el mismo payload sin la tabla.
  let reenvio;
  try {
    const s2 = await facilitador.settle(pago, req);
    reenvio = { ok: true, respuesta: conservar(s2) };
  } catch (e) {
    reenvio = { ok: false, error: String(e?.message ?? e), razon: e?.errorReason ?? null };
  }
  registrar('7. aparte: reenvio directo del mismo payload al /settle, sin la tabla', reenvio);
  await dormir(4000);
  const efectos2 = await servidor.effects().forAccount(receptor.publicKey()).order('asc').limit(50).call();
  const abonos2 = efectos2.records.filter((e) => e.type === 'account_credited' && e.asset_code === 'USDC');
  registrar('8. abonos de USDC tras el reenvio directo', { abonos: abonos2.length });

  const resultado = {
    fecha: new Date().toISOString(),
    facilitador: FACILITADOR,
    pagador: pagador.publicKey(),
    receptor: receptor.publicKey(),
    llamadas_al_facilitador_con_la_tabla: llamadas,
    abonos_en_la_red_con_la_tabla: abonos.length,
    cobra_una_vez: llamadas === 1 && abonos.length === 1 && b.nueva === false && c.nueva === false && e2.estado === 'entregado',
    el_facilitador_sin_tabla: abonos2.length === 1 ? 'no cobro de nuevo (la autorizacion no se puede reutilizar)' : `cobro ${abonos2.length} veces`,
    pasos,
  };
  fs.mkdirSync(SALIDA, { recursive: true });
  fs.writeFileSync(path.join(SALIDA, 'idempotencia.json'), `${JSON.stringify(resultado, null, 2)}\n`);
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('RESULTADO: cobra una vez =', resultado.cobra_una_vez, '| sin tabla:', resultado.el_facilitador_sin_tabla);
  process.exit(resultado.cobra_una_vez ? 0 : 1);
}

main().catch((e) => { console.error('FALLO:', e.stack || e.message); process.exit(1); });
