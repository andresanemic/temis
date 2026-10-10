'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createRequire } = require('node:module');
const { pathToFileURL: urlFor } = require('node:url');

const nodeRequire = createRequire(__filename);
const sdk = nodeRequire('@stellar/stellar-sdk');
const config = nodeRequire('../tokenomics/token-config.temis.json');

function fakeHorizon() {
  const accounts = new Map();
  const trustlines = new Set();
  const balances = new Map();
  const claims = [];
  const transactions = [];
  const submitted = [];
  let submitAttempts = 0;
  let failOnAttempt = null;
  let claimId = 0;
  const get = (key) => {
    let value = balances.get(key);
    if (!value) { value = new Map(); balances.set(key, value); }
    return value;
  };
  const amount = (value) => `${(BigInt(value) / 10000000n).toString()}.${String(BigInt(value) % 10000000n).padStart(7, '0')}`;
  const server = {
    async loadAccount(id) {
      const state = accounts.get(id);
      if (!state) throw new Error(`Not Found: ${id}`);
      const account = new sdk.Account(id, String(state.sequence));
      account.account_id = id;
      account.signers = state.signers;
      account.thresholds = state.thresholds;
      account.balances = [...get(id)].map(([asset, value]) => {
        const [asset_code, asset_issuer] = asset.split(':');
        return { asset_code, asset_issuer, balance: amount(value) };
      });
      return account;
    },
    async submitTransaction(tx) {
      submitAttempts += 1;
      if (submitAttempts === failOnAttempt) { failOnAttempt = null; throw new Error('corte simulado antes de aceptación'); }
      const source = tx.source;
      const signature = tx.signatures[0]?.signature();
      const secret = keySecrets.get(source);
      assert.ok(secret, `cuenta de origen reconocida: ${source}`);
      assert.ok(signature && sdk.Keypair.fromSecret(secret).verify(Buffer.from(tx.hash()), signature), `firma válida de ${source}`);
      const op = tx.operations[0];
      submitted.push({ source, op, hash: Buffer.from(tx.hash()).toString('hex') });
      const sourceState = accounts.get(source);
      sourceState.sequence += 1;
      if (op.type === 'claimClaimableBalance') return { hash: Buffer.from(tx.hash()).toString('hex'), ledger: submitted.length, created_at: '2026-10-03T00:00:00.000Z', successful: false, result_codes: { operations: ['op_not_authorized'] } };
      const asset = op.asset ? `${op.asset.code}:${op.asset.issuer}` : `TEMIS:${issuerId}`;
      if (op.type === 'changeTrust') {
        trustlines.add(source);
      } else if (op.type === 'payment') {
        assert.ok(trustlines.has(op.destination), `trustline creada para ${op.destination}`);
        const units = BigInt(op.amount.replace('.', ''));
        const from = get(source); const to = get(op.destination);
        if (source !== issuerId) from.set(asset, (from.get(asset) ?? 0n) - units);
        to.set(asset, (to.get(asset) ?? 0n) + units);
      } else if (op.type === 'createClaimableBalance') {
        const units = BigInt(op.amount.replace('.', ''));
        const from = get(source);
        from.set(asset, (from.get(asset) ?? 0n) - units);
        claims.push({ id: `${'0'.repeat(8)}${Buffer.alloc(32, ++claimId).toString('hex')}`, asset, amount: op.amount, claimants: op.claimants.map((c) => ({ destination: c.destination, predicate: { not: { abs_before: c.predicate._value._value._value.toString() } } })) });
      } else if (op.type === 'setOptions') {
        const state = accounts.get(source);
        if (op.masterWeight === 0) { state.masterWeight = 0; state.signers = state.signers.map((signer) => ({ ...signer, weight: 0 })); }
        if (op.lowThreshold === 0) state.thresholds = { low_threshold: 0, med_threshold: 0, high_threshold: 0 };
      }
      const receipt = { hash: Buffer.from(tx.hash()).toString('hex'), ledger: submitted.length, created_at: '2026-10-03T00:00:00.000Z', successful: true };
      transactions.push({ account: source, ...receipt });
      return receipt;
    },
    transactions() {
      return {
        forAccount(id) { return { order() { return { limit() { return { async call() { return { records: transactions.filter((x) => x.account === id) }; } }; } }; } }; },
        transaction(hash) { return { async call() { const tx = transactions.find((x) => x.hash === hash); if (!tx) throw new Error('Not Found'); return tx; } }; },
      };
    },
    assets() {
      return {
        forCode() {
          return {
            forIssuer() {
              return {
                async call() {
                  const aggregate = new Map();
                  for (const values of balances.values()) for (const [asset, value] of values) aggregate.set(asset, (aggregate.get(asset) ?? 0n) + value);
                  for (const claim of claims) aggregate.set(claim.asset, (aggregate.get(claim.asset) ?? 0n) + BigInt(claim.amount.replace('.', '')));
                  const supply = [...aggregate.values()].reduce((sum, value) => sum + value, 0n);
                  return { amount: amount(supply), balances: { authorized: amount(supply - claims.reduce((sum, row) => sum + BigInt(row.amount.replace('.', '')), 0n)) }, claimable_balances_amount: amount(claims.reduce((sum, row) => sum + BigInt(row.amount.replace('.', '')), 0n)), flags: { auth_required: false, auth_revocable: false, auth_immutable: false, clawback_enabled: false } };
                },
              };
            },
          };
        },
      };
    },
    accounts() {
      return { forAsset() { return { limit() { return this; }, async call() {
        const records = [];
        for (const [id, values] of balances) {
          const token = [...values].find(([key, value]) => key === `TEMIS:${issuerId}` && value > 0n);
          if (token) records.push({ account_id: id, balances: [{ asset_code: 'TEMIS', asset_issuer: issuerId, balance: amount(token[1]) }] });
        }
        return { records };
      } }; } };
    },
    claimableBalances() {
      let claimant;
      let assetFilter;
      const page = (records, start, size) => ({
        records: records.slice(start, start + size),
        ...(start + size < records.length ? { next: async () => page(records, start + size, size) } : {}),
      });
      let size = 15;
      return {
        claimant(id) { claimant = id; return this; },
        asset(value) { assetFilter = `${value.code}:${value.issuer}`; return this; },
        limit(value) { size = Math.min(value, 15); return this; },
        async call() { return page(claims.filter((row) => (!claimant || row.claimants.some((c) => c.destination === claimant)) && (!assetFilter || row.asset === assetFilter)), 0, size); },
      };
    },
  };
  const keySecrets = new Map();
  let issuerId;
  const friendbot = async (id) => {
    accounts.set(id, { sequence: 0, masterWeight: 1, thresholds: { low_threshold: 1, med_threshold: 1, high_threshold: 1 }, signers: [{ key: id, weight: 1 }] });
    const receipt = { hash: `friend-${id}`, ledger: 1, created_at: '2026-10-03T00:00:00.000Z' };
    transactions.push({ account: id, ...receipt });
    return receipt;
  };
  return { server, friendbot, accounts, submitted, claims, transactions, failAt(value) { failOnAttempt = value; }, get submitAttempts() { return submitAttempts; }, register(keys) { for (const [role, key] of Object.entries(keys)) { keySecrets.set(key.publicKey, key.secret); if (role === 'issuer') issuerId = key.publicKey; } } };
}

test('permisosPrivados pide herencia completa para directorios en Windows', async () => {
  if (process.platform !== 'win32' || !process.env.USERNAME) return;
  const { permisosPrivados } = await import(urlFor(path.join(__dirname, '..', 'scripts', 'token-testnet.mjs')));
  const llamadas = [];
  permisosPrivados(path.join(os.tmpdir(), 'directorio-temis-prueba'), true, (...args) => llamadas.push(args));
  assert.equal(llamadas.length, 1);
  assert.equal(llamadas[0][0], 'icacls');
  assert.equal(llamadas[0][1][3], `${process.env.USERDOMAIN ? `${process.env.USERDOMAIN}\\` : ''}${process.env.USERNAME}:(OI)(CI)(F)`);
});

test('el adaptador real ejecuta el plan completo con cada operación firmada por su rol', async () => {
  const { crearAdaptadorReal } = await import(urlFor(path.join(__dirname, '..', 'scripts', 'token-testnet.mjs')));
  assert.equal(typeof crearAdaptadorReal, 'function');
  assert.equal(typeof sdk.Account, 'function');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'temis-real-'));
  const fake = fakeHorizon();
  try {
    const adapter = crearAdaptadorReal({ dirLlaves: root, servidor: fake.server, solicitarFriendbot: fake.friendbot, ejecutarSpawn: () => ({ status: 0 }) });
    const created = await adapter.crearCuentas(['issuer', 'distribuidora', 'tesoreria', 'ecosistema', 'liquidez', 'asesores', 'contingencia', 'andres', 'francisco', 'prueba']);
    const keys = JSON.parse(fs.readFileSync(path.join(root, 'keys.json'), 'utf8'));
    fake.register(keys);
    const plan = require('../src/token.js').planDeOperaciones(config, created.cuentas, { inicio: config.vesting.inicio });
    assert.equal(plan.length, 83);
    const marcador = '<cuenta tesoreria>';
    const cuentaSinLlave = sdk.Keypair.random().publicKey();
    await assert.rejects(adapter.ejecutarPaso({ tipo: 'trustlines', cuentas: [cuentaSinLlave], limiteStroops: config.totalStroops }, 1, { ...created.cuentas, [marcador]: cuentaSinLlave }), /sin rol propietario/);
    fake.failAt(fake.submitAttempts + 2);
    await assert.rejects(adapter.ejecutarPaso(plan[1], 1, created.cuentas), /corte simulado/);
    assert.equal(fake.submitted.length, 1, 'el primer destino de trustline quedó confirmado');
    await adapter.ejecutarPaso(plan[1], 1, created.cuentas);
    assert.equal(fake.submitted.length, 9, 'reanudar reutiliza recibo y XDR sin duplicar la primera trustline; termina las ocho restantes');
    for (const [index, step] of plan.entries()) {
      await adapter.ejecutarPaso(step, index, created.cuentas);
      if (step.tipo === 'balance-prueba-vesting') await assert.rejects(adapter.reclamarTemprano(created.cuentas.prueba, step), /too_early/);
    }
    const readings = await adapter.leerEmision(created.cuentas, config, new Date('2026-10-03T00:00:00.000Z'));
    const verification = require('../src/token.js').verificarEmision(readings, config);
    assert.equal(verification.ok, true, JSON.stringify(verification.comprobaciones));
    const { leerLecturas } = await import(urlFor(path.join(__dirname, '..', 'scripts', 'token-verify.mjs')));
    const independiente = require('../src/token.js').verificarEmision(await leerLecturas(fake.server, created.cuentas.issuer, created.cuentas, config), config);
    assert.equal(independiente.ok, true, JSON.stringify(independiente.comprobaciones));
    assert.equal(fake.submitted.length, 91);
    assert.deepEqual(fake.submitted.filter((row) => row.op.type === 'changeTrust').map((row) => row.op.limit), Array(9).fill('100000000.0000000'));
    const bloqueo = fake.submitted.filter((row) => row.op.type === 'setOptions' && row.op.masterWeight === 0);
    assert.equal(bloqueo.length, 1);
    assert.equal(fake.submitted.at(-1).op.type, 'setOptions', 'el bloqueo de la emisora cierra el plan');
    assert.deepEqual([bloqueo[0].op.lowThreshold, bloqueo[0].op.medThreshold, bloqueo[0].op.highThreshold], [0, 0, 0]);
    assert.ok(fake.submitted.filter((row) => row.op.type === 'payment').every((row) => row.source === (row.op.destination === created.cuentas.distribuidora ? created.cuentas.issuer : created.cuentas.distribuidora)));
    assert.ok(fake.submitted.filter((row) => row.op.type === 'createClaimableBalance').every((row) => row.source === (row.op.amount === '1.0000000' ? created.cuentas.prueba : created.cuentas.distribuidora)));
    for (const { op } of fake.submitted.filter((row) => row.op.type === 'createClaimableBalance')) {
      assert.equal(op.claimants.length, 2);
      assert.equal(op.claimants[0].predicate._arm, 'notPredicate');
      assert.equal(op.claimants[0].predicate._value._arm, 'absBefore');
      assert.equal(op.claimants[1].destination, created.cuentas.tesoreria, 'la tesorería respalda cada balance');
      assert.equal(op.claimants[1].predicate._arm, 'notPredicate');
      const primary = BigInt(op.claimants[0].predicate._value._value._value.toString());
      const backup = BigInt(op.claimants[1].predicate._value._value._value.toString());
      assert.equal(backup - primary, 180n * 86400n);
    }
    assert.equal(fake.claims.length, 73);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('un adaptador nuevo que reanuda (sin crearCuentas) carga las llaves guardadas antes de firmar', async () => {
  const { crearAdaptadorReal } = await import(urlFor(path.join(__dirname, '..', 'scripts', 'token-testnet.mjs')));
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'temis-resume-'));
  const fake = fakeHorizon();
  try {
    const primero = crearAdaptadorReal({ dirLlaves: root, servidor: fake.server, solicitarFriendbot: fake.friendbot, ejecutarSpawn: () => ({ status: 0 }) });
    const created = await primero.crearCuentas(['issuer', 'distribuidora', 'tesoreria', 'ecosistema', 'liquidez', 'asesores', 'contingencia', 'andres', 'francisco', 'prueba']);
    fake.register(JSON.parse(fs.readFileSync(path.join(root, 'keys.json'), 'utf8')));
    const segundo = crearAdaptadorReal({ dirLlaves: root, servidor: fake.server, solicitarFriendbot: fake.friendbot, ejecutarSpawn: () => ({ status: 0 }) });
    const plan = require('../src/token.js').planDeOperaciones(config, created.cuentas, { inicio: config.vesting.inicio });
    // sin cargar llaves esto falla con TypeError; con ellas firma y avanza
    const recibo = await segundo.ejecutarPaso(plan[1], 1, created.cuentas);
    assert.ok(recibo);
    await assert.rejects(segundo.reclamarTemprano(created.cuentas.prueba, plan[plan.length - 1]), (e) => !(e instanceof TypeError));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
