'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { generateKeyPairSync } = require('node:crypto');
const cf = require('../src/canonical.js');
const f = require('../src/firma.js');
const c = require('../src/cadena.js');

function par() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  return { privateKey, hex: Buffer.from(publicKey.export({ format: 'jwk' }).x, 'base64url').toString('hex') };
}
const alice = par();
const bob = par();
const op = par();
const carol = par();

const EXP = 'exp-0001';
const ANCLA = 'G' + 'A'.repeat(55);
const OTRA_CUENTA = 'G' + 'B'.repeat(55);
const firma = (kp, cuerpo) => ({ clave_publica: kp.hex, firma: f.firmar(kp.privateKey, f.sobreDeFirma(cuerpo)) });
const entrada = (cuerpo, firmantes) => ({ digest: cf.digest(cuerpo), cuerpo, firmas: firmantes.map((k) => firma(k, cuerpo)) });

const L = (o) => c.construirLinea({ expediente_id: EXP, hito: null, version: 1, anterior: null, contenido: {}, anula: null, ...o });
const acuerdoCuerpo = () => L({
  evento: 'acuerdo',
  contenido: {
    partes: [{ id: 'alice', clave_publica: alice.hex }, { id: 'bob', clave_publica: bob.hex }],
    operador: op.hex,
    cuenta_ancla: ANCLA,
  },
});

// Un libro es la lista de transacciones exitosas con MEMO_HASH, en orden de ledger, como las devuelve Horizon.
const libroDe = (digests, extra = {}) => digests.map((d, i) => ({ hash: `tx${i}`, ledger: 1000 + i, indice: 0, exito: true, memo: d, fuente: ANCLA, ...extra }));

// Arma un expediente con acuerdo firmado por ambos; devuelve helpers para encadenar lineas.
function expediente() {
  const entradas = [];
  const acuerdo = acuerdoCuerpo();
  entradas.push(entrada(acuerdo, [alice, bob]));
  let cabeza = cf.digest(acuerdo);
  const declaraciones = {};
  return {
    entradas,
    dec: (hito) => declaraciones[hito],
    cabeza: () => cabeza,
    // agrega una linea valida (encadenada a la cabeza) y avanza la cabeza
    linea(o, firmantes) {
      const cuerpo = L({ anterior: cabeza, ...o });
      entradas.push(entrada(cuerpo, firmantes));
      cabeza = cf.digest(cuerpo);
      if (o.evento === 'declaracion') declaraciones[o.hito] = cf.digest(cuerpo);
      return cuerpo;
    },
    // agrega una linea con anterior explicito sin avanzar la cabeza
    suelta(o, firmantes) {
      const cuerpo = L(o);
      entradas.push(entrada(cuerpo, firmantes));
      if (o.evento === 'declaracion' && !declaraciones[o.hito]) declaraciones[o.hito] = cf.digest(cuerpo);
      return cuerpo;
    },
    reconstruir(extra = {}) {
      const orden = extra.orden || entradas.map((e) => e.digest);
      return c.reconstruir({ libro: libroDe(orden), archivo: extra.archivo || entradas });
    },
  };
}
const estatus = (rec, cuerpo) => rec.lineas.find((l) => l.digest === cf.digest(cuerpo))?.estatus;

test('el acuerdo firmado por las dos partes deja el expediente acordado', () => {
  const x = expediente();
  const rec = x.reconstruir();
  assert.equal(rec.expedientes[EXP].estado, 'acordado');
  assert.equal(rec.lineas[0].estatus, 'vigente');
});

test('un acuerdo con una sola firma no abre el expediente', () => {
  const acuerdo = acuerdoCuerpo();
  const e = entrada(acuerdo, [alice]);
  const rec = c.reconstruir({ libro: libroDe([e.digest]), archivo: [e] });
  assert.equal(rec.lineas[0].estatus, 'firmas_insuficientes');
  assert.equal(rec.expedientes[EXP], undefined);
});

test('hito abierto, declarado, aceptado y cerrado como cumplido', () => {
  const x = expediente();
  x.linea({ hito: 'h1', evento: 'hito_abierto' }, [op]);
  x.linea({ hito: 'h1', evento: 'declaracion', contenido: { parte: 'alice' } }, [alice]);
  assert.equal(x.reconstruir().expedientes[EXP].hitos.h1.estado, 'declarado_por_una_parte');
  x.linea({ hito: 'h1', evento: 'contraste', contenido: { parte: 'bob', accion: 'aceptar', declaracion: x.dec('h1') } }, [bob]);
  assert.equal(x.reconstruir().expedientes[EXP].hitos.h1.estado, 'acordado');
  x.linea({ hito: 'h1', evento: 'cierre', contenido: { resultado: 'cumplido' } }, [op]);
  assert.equal(x.reconstruir().expedientes[EXP].hitos.h1.estado, 'cumplido');
});

test('sin respuesta de la otra parte el cierre es cumplido_no_confirmado, un estado distinto y mas debil', () => {
  const x = expediente();
  x.linea({ hito: 'h1', evento: 'hito_abierto' }, [op]);
  x.linea({ hito: 'h1', evento: 'declaracion', contenido: { parte: 'alice' } }, [alice]);
  x.linea({ hito: 'h1', evento: 'cierre', contenido: { resultado: 'cumplido_no_confirmado' } }, [op]);
  assert.equal(x.reconstruir().expedientes[EXP].hitos.h1.estado, 'cumplido_no_confirmado');
});

test('un cierre cumplido sin contraste aceptado no tiene respaldo y no cambia el estado', () => {
  const x = expediente();
  x.linea({ hito: 'h1', evento: 'hito_abierto' }, [op]);
  x.linea({ hito: 'h1', evento: 'declaracion', contenido: { parte: 'alice' } }, [alice]);
  const cierre = x.linea({ hito: 'h1', evento: 'cierre', contenido: { resultado: 'cumplido' } }, [op]);
  const rec = x.reconstruir();
  assert.equal(estatus(rec, cierre), 'cierre_sin_respaldo');
  assert.equal(rec.expedientes[EXP].hitos.h1.estado, 'declarado_por_una_parte');
});

test('la impugnacion deja el hito impugnado', () => {
  const x = expediente();
  x.linea({ hito: 'h1', evento: 'hito_abierto' }, [op]);
  x.linea({ hito: 'h1', evento: 'declaracion', contenido: { parte: 'alice' } }, [alice]);
  x.linea({ hito: 'h1', evento: 'contraste', contenido: { parte: 'bob', accion: 'impugnar', declaracion: x.dec('h1') } }, [bob]);
  assert.equal(x.reconstruir().expedientes[EXP].hitos.h1.estado, 'impugnado');
});

test('corregir es anular y escribir otra linea: la anulada deja de contar', () => {
  const x = expediente();
  x.linea({ hito: 'h1', evento: 'hito_abierto' }, [op]);
  const mala = x.linea({ hito: 'h1', evento: 'declaracion', contenido: { parte: 'alice', nota: 'error' } }, [alice]);
  x.linea({ hito: 'h1', evento: 'anulacion', version: 1, anula: cf.digest(mala) }, [alice]);
  let rec = x.reconstruir();
  assert.equal(estatus(rec, mala), 'anulada');
  assert.equal(rec.expedientes[EXP].hitos.h1.estado, 'abierto');
  x.linea({ hito: 'h1', evento: 'declaracion', version: 2, contenido: { parte: 'alice', nota: 'corregida' } }, [alice]);
  rec = x.reconstruir();
  assert.equal(rec.expedientes[EXP].hitos.h1.estado, 'declarado_por_una_parte');
});

test('first-write-wins: de dos escrituras de la misma clave cuenta la primera del libro', () => {
  const x = expediente();
  x.linea({ hito: 'h1', evento: 'hito_abierto' }, [op]);
  const cabeza = x.cabeza();
  const primera = x.suelta({ hito: 'h1', evento: 'declaracion', anterior: cabeza, contenido: { parte: 'alice', n: 1 } }, [alice]);
  const segunda = x.suelta({ hito: 'h1', evento: 'declaracion', anterior: cabeza, contenido: { parte: 'alice', n: 2 } }, [alice]);
  const rec = x.reconstruir();
  assert.equal(estatus(rec, primera), 'vigente');
  assert.equal(estatus(rec, segunda), 'perdedora');
});

test('el orden del libro decide, no el orden en que llegan al archivo', () => {
  const x = expediente();
  x.linea({ hito: 'h1', evento: 'hito_abierto' }, [op]);
  const cabeza = x.cabeza();
  const primera = x.suelta({ hito: 'h1', evento: 'declaracion', anterior: cabeza, contenido: { parte: 'alice', n: 1 } }, [alice]);
  const segunda = x.suelta({ hito: 'h1', evento: 'declaracion', anterior: cabeza, contenido: { parte: 'alice', n: 2 } }, [alice]);
  const archivoAlReves = [...x.entradas].reverse();
  const rec = c.reconstruir({ libro: libroDe(x.entradas.map((e) => e.digest)), archivo: archivoAlReves });
  assert.equal(estatus(rec, primera), 'vigente');
  assert.equal(estatus(rec, segunda), 'perdedora');
});

test('anular a la ganadora deja la clave vacia y no reabre a la perdedora', () => {
  const x = expediente();
  x.linea({ hito: 'h1', evento: 'hito_abierto' }, [op]);
  const cabeza = x.cabeza();
  const ganadora = x.suelta({ hito: 'h1', evento: 'declaracion', anterior: cabeza, contenido: { parte: 'alice', n: 1 } }, [alice]);
  const perdedora = x.suelta({ hito: 'h1', evento: 'declaracion', anterior: cabeza, contenido: { parte: 'alice', n: 2 } }, [alice]);
  x.linea({ hito: 'h1', evento: 'anulacion', anterior: cf.digest(ganadora), anula: cf.digest(ganadora) }, [alice]);
  const rec = x.reconstruir();
  assert.equal(estatus(rec, ganadora), 'anulada');
  assert.equal(estatus(rec, perdedora), 'perdedora');
  assert.equal(rec.expedientes[EXP].hitos.h1.estado, 'abierto');
});

test('una linea con anterior que no es la cabeza queda fuera de cadena y no abre estado', () => {
  const x = expediente();
  x.linea({ hito: 'h1', evento: 'hito_abierto' }, [op]);
  const huerfana = x.suelta({ hito: 'h1', evento: 'declaracion', anterior: 'ab'.repeat(32), contenido: { parte: 'alice' } }, [alice]);
  const rec = x.reconstruir();
  assert.equal(estatus(rec, huerfana), 'fuera_de_cadena');
  assert.equal(rec.expedientes[EXP].hitos.h1.estado, 'abierto');
});

test('un digest anclado cuyo cuerpo no esta en el archivo queda sin_cuerpo', () => {
  const x = expediente();
  x.linea({ hito: 'h1', evento: 'hito_abierto' }, [op]);
  const archivoSinUltima = x.entradas.slice(0, -1);
  const rec = c.reconstruir({ libro: libroDe(x.entradas.map((e) => e.digest)), archivo: archivoSinUltima });
  assert.equal(rec.lineas[1].estatus, 'sin_cuerpo');
  assert.equal(rec.expedientes[EXP].hitos.h1, undefined);
});

test('un cuerpo cuyo digest no coincide con el que declara el archivo se rechaza', () => {
  const x = expediente();
  const hito = x.linea({ hito: 'h1', evento: 'hito_abierto' }, [op]);
  const entradas = x.entradas.map((e) => (e.digest === cf.digest(hito)
    ? { ...e, cuerpo: { ...e.cuerpo, contenido: { alterado: true } } }
    : e));
  const rec = c.reconstruir({ libro: libroDe(x.entradas.map((e) => e.digest)), archivo: entradas });
  assert.equal(rec.lineas[1].estatus, 'digest_no_coincide');
});

test('una anulacion sin firma valida no anula nada', () => {
  const x = expediente();
  x.linea({ hito: 'h1', evento: 'hito_abierto' }, [op]);
  const decl = x.linea({ hito: 'h1', evento: 'declaracion', contenido: { parte: 'alice' } }, [alice]);
  const anulacion = x.linea({ hito: 'h1', evento: 'anulacion', anula: cf.digest(decl) }, [carol]);
  const rec = x.reconstruir();
  assert.equal(estatus(rec, anulacion), 'anulacion_no_valida');
  assert.equal(estatus(rec, decl), 'vigente');
});

test('una declaracion firmada por quien no es parte no cuenta', () => {
  const x = expediente();
  x.linea({ hito: 'h1', evento: 'hito_abierto' }, [op]);
  const decl = x.linea({ hito: 'h1', evento: 'declaracion', contenido: { parte: 'alice' } }, [carol]);
  const rec = x.reconstruir();
  assert.equal(estatus(rec, decl), 'firmas_insuficientes');
  assert.equal(rec.expedientes[EXP].hitos.h1.estado, 'abierto');
});

test('el contraste debe venir de la otra parte, no de quien declaro', () => {
  const x = expediente();
  x.linea({ hito: 'h1', evento: 'hito_abierto' }, [op]);
  x.linea({ hito: 'h1', evento: 'declaracion', contenido: { parte: 'alice' } }, [alice]);
  const propio = x.linea({ hito: 'h1', evento: 'contraste', contenido: { parte: 'alice', accion: 'aceptar', declaracion: x.dec('h1') } }, [alice]);
  const rec = x.reconstruir();
  assert.equal(estatus(rec, propio), 'firmas_insuficientes');
  assert.equal(rec.expedientes[EXP].hitos.h1.estado, 'declarado_por_una_parte');
});

test('una linea de un expediente sin acuerdo valido no abre nada', () => {
  const huerfana = L({ evento: 'hito_abierto', hito: 'h1' });
  const e = entrada(huerfana, [op]);
  const rec = c.reconstruir({ libro: libroDe([e.digest]), archivo: [e] });
  assert.equal(rec.lineas[0].estatus, 'sin_acuerdo');
  assert.equal(rec.expedientes[EXP], undefined);
});

test('las transacciones fallidas y las que no llevan memo se ignoran', () => {
  const x = expediente();
  const libro = [
    { hash: 'f0', ledger: 999, indice: 0, exito: false, memo: x.entradas[0].digest, fuente: ANCLA },
    { hash: 'f1', ledger: 1000, indice: 0, exito: true, memo: null, fuente: ANCLA },
    ...libroDe(x.entradas.map((e) => e.digest)).map((t) => ({ ...t, ledger: t.ledger + 10 })),
  ];
  const rec = c.reconstruir({ libro, archivo: x.entradas });
  assert.equal(rec.lineas.length, 1);
  assert.equal(rec.expedientes[EXP].estado, 'acordado');
});

test('el libro se ordena por (ledger, indice) aunque llegue desordenado', () => {
  const x = expediente();
  x.linea({ hito: 'h1', evento: 'hito_abierto' }, [op]);
  const libro = libroDe(x.entradas.map((e) => e.digest)).reverse();
  const rec = c.reconstruir({ libro, archivo: x.entradas });
  assert.equal(rec.expedientes[EXP].hitos.h1.estado, 'abierto');
});

test('cotejo con la copia de una parte: coincide, o dice exactamente que difiere', () => {
  const x = expediente();
  x.linea({ hito: 'h1', evento: 'hito_abierto' }, [op]);
  x.linea({ hito: 'h1', evento: 'declaracion', contenido: { parte: 'alice' } }, [alice]);
  const rec = x.reconstruir();
  assert.deepEqual(c.compararConCopia(rec, x.entradas), { coincide: true, diferencias: [] });
  const copiaCorta = x.entradas.slice(0, -1);
  const r = c.compararConCopia(rec, copiaCorta);
  assert.equal(r.coincide, false);
  assert.ok(r.diferencias.some((d) => d.digest === x.entradas[x.entradas.length - 1].digest && d.tipo === 'falta_en_la_copia'));
  const extra = entrada(L({ evento: 'hito_abierto', hito: 'h9', anterior: 'cd'.repeat(32) }), [op]);
  const r2 = c.compararConCopia(rec, [...x.entradas, extra]);
  assert.ok(r2.diferencias.some((d) => d.digest === extra.digest && d.tipo === 'falta_en_el_historial'));
});

test('la reconstruccion es determinista y no modifica sus entradas', () => {
  const x = expediente();
  x.linea({ hito: 'h1', evento: 'hito_abierto' }, [op]);
  const libro = libroDe(x.entradas.map((e) => e.digest));
  const antes = JSON.stringify([libro, x.entradas], (k, v) => (typeof v === 'bigint' ? String(v) + 'n' : v));
  const r1 = c.reconstruir({ libro, archivo: x.entradas });
  const r2 = c.reconstruir({ libro, archivo: x.entradas });
  assert.deepEqual(r1, r2);
  assert.equal(JSON.stringify([libro, x.entradas], (k, v) => (typeof v === 'bigint' ? String(v) + 'n' : v)), antes);
});

test('construirLinea rechaza lo que no es una linea bien formada', () => {
  assert.throws(() => c.construirLinea({ expediente_id: EXP, hito: 'h1', version: 0, evento: 'declaracion', anterior: null, contenido: {}, anula: null }), c.ErrorCadena);
  assert.throws(() => c.construirLinea({ expediente_id: EXP, hito: 'h1', version: 1, evento: 'inventado', anterior: null, contenido: {}, anula: null }), c.ErrorCadena);
  assert.throws(() => c.construirLinea({ expediente_id: '', hito: 'h1', version: 1, evento: 'declaracion', anterior: null, contenido: {}, anula: null }), c.ErrorCadena);
  const l = c.construirLinea({ expediente_id: EXP, hito: null, version: 1, evento: 'acuerdo', anterior: null, contenido: {}, anula: null });
  assert.equal(l.forma, 'TEMIS-CF-1');
  assert.equal(l.tipo, 'expediente');
  assert.equal(c.construirLinea({ expediente_id: EXP, hito: 'h1', version: 1, evento: 'declaracion', anterior: null, contenido: {}, anula: null }).tipo, 'hito');
});

// --- hallazgos de la verificacion del coordinador (2026-10-02): lo que las pruebas del implementador no cubrian ---

test('una anulacion que apunta a un digest inexistente no es valida', () => {
  const x = expediente();
  x.linea({ hito: 'h1', evento: 'hito_abierto' }, [op]);
  const a = x.linea({ hito: 'h1', evento: 'anulacion', anula: 'ef'.repeat(32) }, [alice]);
  assert.equal(estatus(x.reconstruir(), a), 'anulacion_no_valida');
});

test('no se puede anular el acuerdo: el expediente sigue acordado y la linea del acuerdo vigente', () => {
  const x = expediente();
  const acuerdoDigest = x.entradas[0].digest;
  const a = x.linea({ evento: 'anulacion', hito: null, anula: acuerdoDigest }, [alice]);
  const rec = x.reconstruir();
  assert.equal(estatus(rec, a), 'anulacion_no_valida');
  assert.equal(rec.lineas[0].estatus, 'vigente');
  assert.equal(rec.expedientes[EXP].estado, 'acordado');
});

test('no se puede anular una anulacion', () => {
  const x = expediente();
  x.linea({ hito: 'h1', evento: 'hito_abierto' }, [op]);
  const decl = x.linea({ hito: 'h1', evento: 'declaracion', contenido: { parte: 'alice' } }, [alice]);
  const anula1 = x.linea({ hito: 'h1', evento: 'anulacion', anula: cf.digest(decl) }, [alice]);
  const anula2 = x.linea({ hito: 'h1', evento: 'anulacion', version: 2, anula: cf.digest(anula1) }, [alice]);
  const rec = x.reconstruir();
  assert.equal(estatus(rec, anula2), 'anulacion_no_valida');
  assert.equal(estatus(rec, anula1), 'vigente');
  assert.equal(estatus(rec, decl), 'anulada');
});

test('una anulacion de un hito no anula lineas de otro hito', () => {
  const x = expediente();
  x.linea({ hito: 'h1', evento: 'hito_abierto' }, [op]);
  x.linea({ hito: 'h2', evento: 'hito_abierto' }, [op]);
  const d1 = x.linea({ hito: 'h1', evento: 'declaracion', contenido: { parte: 'alice' } }, [alice]);
  const a = x.linea({ hito: 'h2', evento: 'anulacion', anula: cf.digest(d1) }, [alice]);
  const rec = x.reconstruir();
  assert.equal(estatus(rec, a), 'anulacion_no_valida');
  assert.equal(estatus(rec, d1), 'vigente');
});

test('un incumplimiento firmado solo por el operador no pisa un cierre respaldado', () => {
  const x = expediente();
  x.linea({ hito: 'h1', evento: 'hito_abierto' }, [op]);
  x.linea({ hito: 'h1', evento: 'declaracion', contenido: { parte: 'alice' } }, [alice]);
  x.linea({ hito: 'h1', evento: 'contraste', contenido: { parte: 'bob', accion: 'aceptar', declaracion: x.dec('h1') } }, [bob]);
  x.linea({ hito: 'h1', evento: 'cierre', contenido: { resultado: 'cumplido' } }, [op]);
  x.linea({ hito: 'h1', evento: 'incumplimiento' }, [op]);
  assert.equal(x.reconstruir().expedientes[EXP].hitos.h1.estado, 'cumplido');
});

test('un incumplimiento sin cierre previo si deja el hito incumplido', () => {
  const x = expediente();
  x.linea({ hito: 'h1', evento: 'hito_abierto' }, [op]);
  x.linea({ hito: 'h1', evento: 'incumplimiento' }, [op]);
  assert.equal(x.reconstruir().expedientes[EXP].hitos.h1.estado, 'incumplido');
});

// --- hallazgos del Advisor (segundo punto fijo, 2026-10-02) ---

function conDeclaracion() {
  const x = expediente();
  x.linea({ hito: 'h1', evento: 'hito_abierto' }, [op]);
  const decl = x.linea({ hito: 'h1', evento: 'declaracion', contenido: { parte: 'alice' } }, [alice]);
  return { x, decl };
}

test('solo el autor de una linea puede anularla: la otra parte no anula una impugnacion', () => {
  const { x } = conDeclaracion();
  const imp = x.linea({ hito: 'h1', evento: 'contraste', contenido: { parte: 'bob', accion: 'impugnar', declaracion: x.dec('h1') } }, [bob]);
  const an = x.linea({ hito: 'h1', evento: 'anulacion', anula: cf.digest(imp) }, [alice]);
  const rec = x.reconstruir();
  assert.equal(estatus(rec, an), 'anulacion_no_valida');
  assert.equal(estatus(rec, imp), 'vigente');
  assert.equal(rec.expedientes[EXP].hitos.h1.estado, 'impugnado');
});

test('el operador no anula una linea de una parte, ni una parte una del operador', () => {
  const { x, decl } = conDeclaracion();
  const porOperador = x.suelta({ hito: 'h1', evento: 'anulacion', anterior: x.cabeza(), anula: cf.digest(decl) }, [op]); // linea rechazada: la cadena no la cita
  assert.equal(estatus(x.reconstruir(), porOperador), 'anulacion_no_valida');
  const inc = x.linea({ hito: 'h1', evento: 'incumplimiento' }, [op]);
  const porParte = x.suelta({ hito: 'h1', evento: 'anulacion', version: 2, anterior: x.cabeza(), anula: cf.digest(inc) }, [bob]);
  const rec = x.reconstruir();
  assert.equal(estatus(rec, porParte), 'anulacion_no_valida');
  assert.equal(estatus(rec, inc), 'vigente');
});

test('el autor si anula lo suyo', () => {
  const { x, decl } = conDeclaracion();
  const an = x.linea({ hito: 'h1', evento: 'anulacion', anula: cf.digest(decl) }, [alice]);
  const rec = x.reconstruir();
  assert.equal(estatus(rec, an), 'vigente');
  assert.equal(estatus(rec, decl), 'anulada');
});

test('un contraste sin declaracion, o que apunta a otra, no tiene objetivo', () => {
  const { x } = conDeclaracion();
  const sin = x.linea({ hito: 'h1', evento: 'contraste', contenido: { parte: 'bob', accion: 'aceptar' } }, [bob]);
  const otra = x.linea({ hito: 'h1', evento: 'contraste', version: 2, contenido: { parte: 'bob', accion: 'aceptar', declaracion: 'ab'.repeat(32) } }, [bob]);
  const rec = x.reconstruir();
  assert.equal(estatus(rec, sin), 'contraste_sin_objetivo');
  assert.equal(estatus(rec, otra), 'contraste_sin_objetivo');
  assert.equal(rec.expedientes[EXP].hitos.h1.estado, 'declarado_por_una_parte');
});

test('un cierre cumplido no se apoya en la aceptacion de otra declaracion', () => {
  const x = expediente();
  x.linea({ hito: 'h1', evento: 'hito_abierto' }, [op]);
  const d1 = x.linea({ hito: 'h1', evento: 'declaracion', contenido: { parte: 'alice', n: 1 } }, [alice]);
  x.linea({ hito: 'h1', evento: 'contraste', contenido: { parte: 'bob', accion: 'aceptar', declaracion: cf.digest(d1) } }, [bob]);
  x.linea({ hito: 'h1', evento: 'declaracion', version: 2, contenido: { parte: 'alice', n: 2 } }, [alice]);
  const cierre = x.linea({ hito: 'h1', evento: 'cierre', contenido: { resultado: 'cumplido' } }, [op]);
  assert.equal(estatus(x.reconstruir(), cierre), 'cierre_sin_respaldo');
});

test('una aceptacion y una impugnacion vigentes sobre la misma declaracion: impugnado, y el cierre cumplido no pasa', () => {
  const { x } = conDeclaracion();
  x.linea({ hito: 'h1', evento: 'contraste', contenido: { parte: 'bob', accion: 'aceptar', declaracion: x.dec('h1') } }, [bob]);
  x.linea({ hito: 'h1', evento: 'contraste', version: 2, contenido: { parte: 'bob', accion: 'impugnar', declaracion: x.dec('h1') } }, [bob]);
  const cierre = x.linea({ hito: 'h1', evento: 'cierre', contenido: { resultado: 'cumplido' } }, [op]);
  const rec = x.reconstruir();
  assert.equal(estatus(rec, cierre), 'cierre_sin_respaldo');
  assert.equal(rec.expedientes[EXP].hitos.h1.estado, 'impugnado');
});

test('cumplido_no_confirmado exige que la otra parte no haya respondido', () => {
  const { x } = conDeclaracion();
  x.linea({ hito: 'h1', evento: 'contraste', contenido: { parte: 'bob', accion: 'impugnar', declaracion: x.dec('h1') } }, [bob]);
  const cierre = x.linea({ hito: 'h1', evento: 'cierre', contenido: { resultado: 'cumplido_no_confirmado' } }, [op]);
  assert.equal(estatus(x.reconstruir(), cierre), 'cierre_sin_respaldo');
});

test('un cuerpo mal formado no es una linea: evento desconocido, version como texto, hito vacio, contenido que no es objeto', () => {
  const x = expediente();
  const base = L({ evento: 'hito_abierto', hito: 'h1', anterior: x.cabeza() });
  const malos = [
    { ...base, evento: 'inventado' },
    { ...base, evento: null },
    { ...base, version: '01' },
    { ...base, hito: '' },
    { ...base, contenido: [] },
  ];
  for (const cuerpo of malos) {
    const e = { digest: cf.digest(cuerpo), cuerpo, firmas: [] };
    const rec = c.reconstruir({ libro: libroDe([x.entradas[0].digest, e.digest]), archivo: [x.entradas[0], e] });
    assert.equal(rec.lineas[1].estatus, 'cuerpo_invalido', JSON.stringify(cuerpo, (k, v) => (typeof v === 'bigint' ? String(v) : v)));
  }
});

test('una linea de una parte que cita una linea anterior que no es la ultima sigue en cadena si es de su expediente', () => {
  const x = expediente();
  const abierto = x.linea({ hito: 'h1', evento: 'hito_abierto' }, [op]);
  x.linea({ hito: 'h2', evento: 'hito_abierto' }, [op]); // el operador intercala una linea ajena
  const decl = x.suelta({ hito: 'h1', evento: 'declaracion', anterior: cf.digest(abierto), contenido: { parte: 'alice' } }, [alice]);
  const rec = x.reconstruir();
  assert.equal(estatus(rec, decl), 'vigente');
  assert.equal(rec.expedientes[EXP].hitos.h1.estado, 'declarado_por_una_parte');
});

test('el libro trae de donde vino cada transaccion y solo cuenta la cuenta ancla que declara el acuerdo', () => {
  const x = expediente();
  x.linea({ hito: 'h1', evento: 'hito_abierto' }, [op]);
  const ajena = x.suelta({ hito: 'h1', evento: 'declaracion', anterior: x.cabeza(), contenido: { parte: 'alice' } }, [alice]);
  const libro = libroDe(x.entradas.map((e) => e.digest)).map((t) => (t.memo === cf.digest(ajena) ? { ...t, fuente: OTRA_CUENTA } : t));
  const rec = c.reconstruir({ libro, archivo: x.entradas });
  assert.equal(estatus(rec, ajena), 'cuenta_no_autorizada');
  assert.equal(rec.expedientes[EXP].hitos.h1.estado, 'abierto');
});

test('un acuerdo anclado desde otra cuenta que la que declara no abre el expediente', () => {
  const x = expediente();
  const libro = libroDe(x.entradas.map((e) => e.digest), { fuente: OTRA_CUENTA });
  const rec = c.reconstruir({ libro, archivo: x.entradas });
  assert.equal(rec.lineas[0].estatus, 'cuenta_no_autorizada');
  assert.equal(rec.expedientes[EXP], undefined);
});

test('un acuerdo sin cuenta ancla valida no es un acuerdo', () => {
  const sin = L({ evento: 'acuerdo', contenido: { partes: [{ id: 'alice', clave_publica: alice.hex }, { id: 'bob', clave_publica: bob.hex }], operador: op.hex } });
  const e = entrada(sin, [alice, bob]);
  const rec = c.reconstruir({ libro: libroDe([e.digest]), archivo: [e] });
  assert.equal(rec.lineas[0].estatus, 'cuerpo_invalido');
  assert.equal(rec.expedientes[EXP], undefined);
});

test('el orden de evaluacion esta fijado: perdedora va antes que cierre_sin_respaldo', () => {
  const { x } = conDeclaracion();
  x.linea({ hito: 'h1', evento: 'contraste', contenido: { parte: 'bob', accion: 'aceptar', declaracion: x.dec('h1') } }, [bob]);
  const cabeza = x.cabeza();
  x.suelta({ hito: 'h1', evento: 'cierre', anterior: cabeza, contenido: { resultado: 'cumplido' } }, [op]);
  const segundo = x.suelta({ hito: 'h1', evento: 'cierre', anterior: cabeza, contenido: { resultado: 'cumplido_no_confirmado' } }, [op]);
  assert.equal(estatus(x.reconstruir(), segundo), 'perdedora');
});

test('una anulada conserva su clave: una linea posterior con la misma clave es perdedora', () => {
  const { x, decl } = conDeclaracion();
  x.linea({ hito: 'h1', evento: 'anulacion', anula: cf.digest(decl) }, [alice]);
  const mismaClave = x.linea({ hito: 'h1', evento: 'declaracion', contenido: { parte: 'alice', n: 9 } }, [alice]);
  assert.equal(estatus(x.reconstruir(), mismaClave), 'perdedora');
});

// --- hallazgos del tercero independiente (segunda corrida, 2026-10-02) ---

test('el contenido de cada evento tiene su forma: un cierre sin resultado valido, un contraste sin accion valida, una declaracion sin parte', () => {
  const x = expediente();
  x.linea({ hito: 'h1', evento: 'hito_abierto' }, [op]);
  const cabeza = x.cabeza();
  const casos = [
    x.suelta({ hito: 'h1', evento: 'cierre', anterior: cabeza, contenido: { resultado: 'inventado' } }, [op]),
    x.suelta({ hito: 'h1', evento: 'cierre', anterior: cabeza, version: 2, contenido: {} }, [op]),
    x.suelta({ hito: 'h1', evento: 'contraste', anterior: cabeza, contenido: { parte: 'bob', accion: 'quizas', declaracion: 'ab'.repeat(32) } }, [bob]),
    x.suelta({ hito: 'h1', evento: 'declaracion', anterior: cabeza, contenido: {} }, [alice]),
  ];
  const rec = x.reconstruir();
  for (const cuerpo of casos) assert.equal(estatus(rec, cuerpo), 'cuerpo_invalido', cuerpo.evento);
});

test('el cotejo con la copia marca una linea anclada cuyo cuerpo no esta en la copia, aunque el archivo con que se reconstruyo tampoco lo tuviera', () => {
  const x = expediente();
  x.linea({ hito: 'h1', evento: 'hito_abierto' }, [op]);
  const sinCuerpo = x.linea({ hito: 'h2', evento: 'hito_abierto' }, [op]);
  const archivo = x.entradas.filter((e) => e.digest !== cf.digest(sinCuerpo));
  const rec = c.reconstruir({ libro: libroDe(x.entradas.map((e) => e.digest)), archivo });
  assert.equal(rec.lineas[2].estatus, 'sin_cuerpo');
  const r = c.compararConCopia(rec, archivo);
  assert.equal(r.coincide, false);
  assert.deepEqual(r.diferencias, [{ digest: cf.digest(sinCuerpo), tipo: 'falta_en_la_copia' }]);
});

test('el cotejo con la copia marca un cuerpo alterado bajo el digest anclado', () => {
  const x = expediente();
  const hito = x.linea({ hito: 'h1', evento: 'hito_abierto' }, [op]);
  const copia = x.entradas.map((e) => (e.digest === cf.digest(hito) ? { ...e, cuerpo: { ...e.cuerpo, contenido: { alterado: true } } } : e));
  const rec = x.reconstruir();
  const r = c.compararConCopia(rec, copia);
  assert.equal(r.coincide, false);
  assert.deepEqual(r.diferencias, [{ digest: cf.digest(hito), tipo: 'cuerpo_alterado' }]);
});
