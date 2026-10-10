'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { generateKeyPairSync, sign } = require('node:crypto');
const cf = require('../src/canonical.js');
const f = require('../src/firma.js');

const L = (1n << 252n) + 27742317777372353535851937790883648493n;
const P = (1n << 255n) - 19n;

function par() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const x = publicKey.export({ format: 'jwk' }).x;
  const hex = Buffer.from(x, 'base64url').toString('hex');
  return { privateKey, hex };
}
const alice = par();
const bob = par();
const carol = par();

const cuerpo = (extra = {}) => ({
  forma: 'TEMIS-CF-1',
  tipo: 'expediente',
  expediente_id: 'exp-0001',
  version: 2n,
  anterior: null,
  partes: [
    { id: 'alice', clave_publica: alice.hex },
    { id: 'bob', clave_publica: bob.hex },
  ],
  ...extra,
});
const sobreDe = (c) => f.sobreDeFirma(c);
const firmaDe = (kp, sobre) => f.firmar(kp.privateKey, sobre);

const leBytes = (n, bytes) => {
  const b = Buffer.alloc(bytes);
  let x = n;
  for (let i = 0; i < bytes; i++) { b[i] = Number(x & 0xffn); x >>= 8n; }
  return b;
};
const leNum = (buf) => [...buf].reduceRight((acc, byte) => (acc << 8n) | BigInt(byte), 0n);

test('el sobre lleva forma, tipo, expediente_id, version y el digest del cuerpo', () => {
  const c = cuerpo();
  const s = sobreDe(c);
  assert.deepEqual(Object.keys(s).sort(), ['digest', 'expediente_id', 'forma', 'tipo', 'version']);
  assert.equal(s.digest, cf.digest(c));
  assert.equal(s.forma, 'TEMIS-CF-1');
});

test('un cuerpo sin forma TEMIS-CF-1 no tiene sobre', () => {
  assert.throws(() => sobreDe(cuerpo({ forma: 'OTRA' })), f.ErrorFirma);
  const sinForma = cuerpo(); delete sinForma.forma;
  assert.throws(() => sobreDe(sinForma), f.ErrorFirma);
});

test('firma y verificacion de ida y vuelta; formatos hex en minuscula', () => {
  const s = sobreDe(cuerpo());
  const firma = firmaDe(alice, s);
  assert.match(firma, /^[0-9a-f]{128}$/);
  assert.match(alice.hex, /^[0-9a-f]{64}$/);
  assert.deepEqual(f.verificar(alice.hex, s, firma), { ok: true });
});

test('cambiar un bit del digest rompe la verificacion', () => {
  const s = sobreDe(cuerpo());
  const firma = firmaDe(alice, s);
  const digest = (s.digest[0] === '0' ? '1' : '0') + s.digest.slice(1);
  assert.equal(f.verificar(alice.hex, { ...s, digest }, firma).ok, false);
});

test('la firma esta atada a expediente, version y tipo (no se reusa en otro lugar)', () => {
  const s = sobreDe(cuerpo());
  const firma = firmaDe(alice, s);
  assert.equal(f.verificar(alice.hex, { ...s, expediente_id: 'exp-0002' }, firma).ok, false);
  assert.equal(f.verificar(alice.hex, { ...s, version: 4n }, firma).ok, false);
  assert.equal(f.verificar(alice.hex, { ...s, tipo: 'hito' }, firma).ok, false);
});

test('la firma de una parte no vale como firma de la otra', () => {
  const s = sobreDe(cuerpo());
  const firma = firmaDe(alice, s);
  assert.equal(f.verificar(bob.hex, s, firma).ok, false);
});

test('la etiqueta de contexto importa: una firma ed25519 del sobre sin etiqueta no verifica', () => {
  const s = sobreDe(cuerpo());
  const sinEtiqueta = sign(null, Buffer.from(cf.canonicalizar(s), 'utf8'), alice.privateKey).toString('hex');
  assert.equal(f.verificar(alice.hex, s, sinEtiqueta).ok, false);
});

test('estado: una firma da pendiente, las dos dan acordado', () => {
  const c = cuerpo(); const s = sobreDe(c);
  const fa = { clave_publica: alice.hex, firma: firmaDe(alice, s) };
  const fb = { clave_publica: bob.hex, firma: firmaDe(bob, s) };
  assert.equal(f.estadoDeAcuerdo({ cuerpo: c, sobre: s, firmas: [fa] }).estado, 'pendiente');
  const ok = f.estadoDeAcuerdo({ cuerpo: c, sobre: s, firmas: [fa, fb] });
  assert.equal(ok.estado, 'acordado');
  assert.deepEqual([...ok.firmantes].sort(), [alice.hex, bob.hex].sort());
});

test('estado: la misma clave dos veces cuenta una', () => {
  const c = cuerpo(); const s = sobreDe(c);
  const fa = { clave_publica: alice.hex, firma: firmaDe(alice, s) };
  const r = f.estadoDeAcuerdo({ cuerpo: c, sobre: s, firmas: [fa, fa] });
  assert.equal(r.estado, 'pendiente');
  assert.equal(r.firmantes.length, 1);
});

test('estado: la firma de un tercero se reporta y no cuenta', () => {
  const c = cuerpo(); const s = sobreDe(c);
  const fa = { clave_publica: alice.hex, firma: firmaDe(alice, s) };
  const fc = { clave_publica: carol.hex, firma: firmaDe(carol, s) };
  const r = f.estadoDeAcuerdo({ cuerpo: c, sobre: s, firmas: [fa, fc] });
  assert.equal(r.estado, 'pendiente');
  assert.deepEqual(r.rechazadas.map((x) => x.motivo), ['no_parte']);
});

test('estado: la contrafirma sobre otro digest no completa el acuerdo', () => {
  const c = cuerpo(); const s = sobreDe(c);
  const otro = sobreDe(cuerpo({ version: 3n }));
  const fa = { clave_publica: alice.hex, firma: firmaDe(alice, s) };
  const fbMala = { clave_publica: bob.hex, firma: firmaDe(bob, otro) };
  const r = f.estadoDeAcuerdo({ cuerpo: c, sobre: s, firmas: [fa, fbMala] });
  assert.equal(r.estado, 'pendiente');
  assert.equal(r.rechazadas[0].clave, bob.hex);
});

test('estado: una v4 con el mismo contenido que la v2 no hereda la firma de la v2', () => {
  const v2 = cuerpo(); const s2 = sobreDe(v2);
  const fa2 = { clave_publica: alice.hex, firma: firmaDe(alice, s2) };
  const v4 = cuerpo({ version: 4n });
  const s4 = sobreDe(v4);
  const fb4 = { clave_publica: bob.hex, firma: firmaDe(bob, s4) };
  assert.equal(f.estadoDeAcuerdo({ cuerpo: v4, sobre: s4, firmas: [fa2, fb4] }).estado, 'pendiente');
});

test('el expediente exige exactamente dos partes con claves distintas', () => {
  const mismaClave = cuerpo({ partes: [{ id: 'a', clave_publica: alice.hex }, { id: 'b', clave_publica: alice.hex }] });
  assert.throws(() => f.estadoDeAcuerdo({ cuerpo: mismaClave, sobre: sobreDe(mismaClave), firmas: [] }), f.ErrorFirma);
  const una = cuerpo({ partes: [{ id: 'a', clave_publica: alice.hex }] });
  assert.throws(() => f.estadoDeAcuerdo({ cuerpo: una, sobre: sobreDe(una), firmas: [] }), f.ErrorFirma);
});

test('estado: el sobre debe corresponder al cuerpo', () => {
  const c = cuerpo();
  const ajeno = sobreDe(cuerpo({ version: 9n }));
  assert.throws(() => f.estadoDeAcuerdo({ cuerpo: c, sobre: ajeno, firmas: [] }), f.ErrorFirma);
});

test('verificacion estricta: S + L (maleabilidad) se rechaza', () => {
  const s = sobreDe(cuerpo());
  const firma = Buffer.from(firmaDe(alice, s), 'hex');
  const S = leNum(firma.subarray(32));
  const maleada = Buffer.concat([firma.subarray(0, 32), leBytes(S + L, 32)]);
  const r = f.verificar(alice.hex, s, maleada.toString('hex'));
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'S_fuera_de_rango');
});

test('verificacion estricta: clave de orden pequeno (identidad) se rechaza', () => {
  const s = sobreDe(cuerpo());
  const firma = firmaDe(alice, s);
  const identidad = '01' + '00'.repeat(31);
  const r = f.verificar(identidad, s, firma);
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'clave_orden_pequeno');
});

test('verificacion estricta: clave con codificacion no canonica (y >= p) se rechaza', () => {
  const s = sobreDe(cuerpo());
  const firma = firmaDe(alice, s);
  const noCanonica = leBytes(P + 1n, 32).toString('hex');
  const r = f.verificar(noCanonica, s, firma);
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'clave_no_canonica');
});

test('verificacion estricta: R con codificacion no canonica se rechaza', () => {
  const s = sobreDe(cuerpo());
  const firma = Buffer.from(firmaDe(alice, s), 'hex');
  const R = leBytes(P + 1n, 32);
  const r = f.verificar(alice.hex, s, Buffer.concat([R, firma.subarray(32)]).toString('hex'));
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'R_no_canonica');
});

test('formatos invalidos se rechazan con motivo, sin lanzar', () => {
  const s = sobreDe(cuerpo());
  assert.equal(f.verificar('xyz', s, 'ab').ok, false);
  assert.equal(f.verificar(alice.hex, s, 'AB'.repeat(64)).ok, false);
  assert.equal(f.verificar(alice.hex.toUpperCase(), s, firmaDe(alice, s)).ok, false);
});
