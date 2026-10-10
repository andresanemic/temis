'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const vectores = require('../vectores/cf1.json');
const cf = require('../src/canonical.js');

console.log(`# Unicode del motor: ${process.versions.unicode}`);

for (const v of vectores.positivos) {
  test(`vector positivo: ${v.nombre}`, () => {
    const bytes = cf.bytesCanonicosDeTexto(v.texto);
    assert.equal(Buffer.from(bytes).toString('hex'), v.canonicoHex);
    assert.equal(cf.digestDeTexto(v.texto), v.digest);
    // El digest es SHA-256 de los bytes canonicos, no de otra cosa.
    assert.equal(createHash('sha256').update(bytes).digest('hex'), v.digest);
  });
}

for (const n of vectores.negativos) {
  test(`vector negativo se rechaza: ${n.nombre}`, () => {
    assert.throws(() => cf.parseTexto(n.texto), (e) => e instanceof cf.ErrorCF1);
  });
}

test('el orden de insercion de las claves no cambia el digest', () => {
  const a = cf.digestDeTexto('{"b":1,"a":2,"c":[1,2]}');
  const b = cf.digestDeTexto('{"c":[1,2],"a":2,"b":1}');
  assert.equal(a, b);
});

test('el orden de un arreglo si importa', () => {
  assert.notEqual(cf.digestDeTexto('[1,2]'), cf.digestDeTexto('[2,1]'));
});

test('NFD y NFC dan el mismo digest', () => {
  assert.equal(cf.digestDeTexto('{"k":"caf\\u00e9"}'), cf.digestDeTexto('{"k":"cafe\\u0301"}'));
});

test('el lector entrega enteros como BigInt', () => {
  const v = cf.parseTexto('{"a":9223372036854775807}');
  assert.equal(typeof v.a, 'bigint');
  assert.equal(v.a, 9223372036854775807n);
});

test('canonicalizar un valor en memoria da lo mismo que el texto equivalente', () => {
  const valor = { b: [1n, 2n], a: 'x', c: null, d: true };
  assert.equal(cf.canonicalizar(valor), '{"a":"x","b":[1,2],"c":null,"d":true}');
  assert.equal(cf.digest(valor), cf.digestDeTexto('{"d":true,"c":null,"b":[1,2],"a":"x"}'));
});

test('canonicalizar rechaza lo que el lector no produciria', () => {
  assert.throws(() => cf.canonicalizar({ a: 1.5 }), cf.ErrorCF1);
  assert.throws(() => cf.canonicalizar({ a: NaN }), cf.ErrorCF1);
  assert.throws(() => cf.canonicalizar({ a: undefined }), cf.ErrorCF1);
  assert.throws(() => cf.canonicalizar({ a: () => 1 }), cf.ErrorCF1);
  assert.throws(() => cf.canonicalizar({ a: 2n ** 63n }), cf.ErrorCF1);
  assert.throws(() => cf.canonicalizar({ a: 1e21 }), cf.ErrorCF1);
});

test('un Number entero seguro se acepta como el BigInt equivalente', () => {
  assert.equal(cf.canonicalizar({ a: 12 }), cf.canonicalizar({ a: 12n }));
});

test('el digest es de 32 bytes en 64 hexadecimales en minuscula', () => {
  assert.match(cf.digestDeTexto('{}'), /^[0-9a-f]{64}$/);
});

test('el orden por bytes UTF-8 gana sobre el orden UTF-16', () => {
  const salida = cf.canonicalizar({ '\u{10000}': 1, '': 2 });
  assert.ok(salida.indexOf('') < salida.indexOf('\u{10000}'));
});
