'use strict';
// Proceso hijo de las pruebas de pagos: intenta liquidar el mismo pago desde otro proceso.
//   node pagos-hijo.js <dir> cobrar <archivoContador>   cobra con retardo y deja una linea en el contador por cada efecto real
//   node pagos-hijo.js <dir> morir                      muere a mitad del cobro, con la reserva ya tomada
const fs = require('node:fs');
const { abrirTablaPagos } = require('../../src/pagos.js');

const [, , dir, modo, contador, pago] = process.argv;
const CLAVE = { acuerdo: 'exp-0001', capacidad: 'ancla', pago: pago || 'auth-0001' };
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const tabla = abrirTablaPagos(dir);
  if (modo === 'morir') {
    await tabla.liquidar(CLAVE, async () => { process.exit(3); });
    return;
  }
  let ejecuto = false;
  const r = await tabla.liquidar(CLAVE, async () => {
    ejecuto = true;
    await dormir(150);
    fs.appendFileSync(contador, `cobro ${process.pid}\n`);
    return { tx: `tx-${process.pid}` };
  });
  console.log(JSON.stringify({ ejecuto, estado: r.estado, nueva: r.nueva }));
})().catch((e) => { console.error(e.stack); process.exit(1); });
