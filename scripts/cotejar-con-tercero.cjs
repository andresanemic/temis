'use strict';
// Cruza, por hash de transaccion, el estatus que asigna src/cadena.js con el que asigno un tercero independiente
// (tercero/reconstruccion.md, tabla de la seccion 4). Uso: node scripts/cotejar-con-tercero.cjs <expediente>
const fs = require('node:fs');
const path = require('node:path');
const cf = require('../src/canonical.js');
const cad = require('../src/cadena.js');

const RAIZ = path.join(__dirname, '..');
const exp = process.argv[2];
if (!exp) throw new Error('falta el id del expediente');
const corrida = JSON.parse(fs.readFileSync(path.join(RAIZ, 'tramos', '3', `corrida-${exp}.json`), 'utf8'));
const archivo = cf.parseTexto(fs.readFileSync(path.join(RAIZ, 'datos', 'e2e', 'archivo.json'), 'utf8'));
const libroAncla = JSON.parse(fs.readFileSync(path.join(RAIZ, 'datos', 'e2e', 'libro.json'), 'utf8'));
const libroAjeno = JSON.parse(fs.readFileSync(path.join(RAIZ, 'datos', 'e2e', 'libro-cuenta-ajena.json'), 'utf8'));
const propios = new Set(corrida.anclajes.map((a) => a.digest));
const hacia = (libro) => libro.filter((t) => t.memo && propios.has(t.memo));

// Lo que ve un tercero que solo lee el historial de la cuenta ancla.
const soloAncla = cad.reconstruir({ libro: hacia(libroAncla), archivo });
// Lo que ve quien reune tambien transacciones de otras cuentas.
const todas = cad.reconstruir({ libro: [...hacia(libroAncla), ...hacia(libroAjeno)], archivo });

const md = fs.readFileSync(path.join(RAIZ, 'tercero', 'reconstruccion.md'), 'utf8');
const filas = [...md.matchAll(/^\|\s*\d+\s*\|\s*\d+\s*\|\s*`([0-9a-f]{12})`[^\n]*?\*\*([a-z_]+)\*\*/gm)].map((m) => ({ prefijo: m[1], estatus: m[2] }));

let iguales = 0;
const distintos = [];
for (const fila of filas) {
  const mia = soloAncla.lineas.find((l) => l.hash.startsWith(fila.prefijo));
  if (!mia) { distintos.push({ ...fila, mia: '(no esta en mi libro)' }); continue; }
  if (mia.estatus === fila.estatus) iguales += 1; else distintos.push({ ...fila, mia: mia.estatus });
}
const cotejo = cad.compararConCopia(soloAncla, archivo);
const resumen = {
  filas_del_tercero: filas.length, iguales, distintos,
  estatus_solo_cuenta_ancla: soloAncla.lineas.reduce((a, l) => ({ ...a, [l.estatus]: (a[l.estatus] || 0) + 1 }), {}),
  estatus_con_cuentas_ajenas: todas.lineas.reduce((a, l) => ({ ...a, [l.estatus]: (a[l.estatus] || 0) + 1 }), {}),
  hitos: JSON.parse(JSON.stringify(soloAncla.expedientes[exp].hitos, (k, v) => (typeof v === 'bigint' ? Number(v) : v))),
  cotejo_con_el_archivo: cotejo,
};
console.log(JSON.stringify(resumen, null, 2));
fs.writeFileSync(path.join(RAIZ, 'tramos', '3', `cruce-con-tercero-${exp}.json`), JSON.stringify(resumen, null, 2));
process.exit(distintos.length === 0 ? 0 : 1);
