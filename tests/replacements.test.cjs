const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const repo = process.env.TEST_PROJECT || path.resolve(__dirname, '..');
const root = process.env.TEST_SOURCE_ROOT || repo;
const ts = require(path.join(repo, 'node_modules/typescript'));
function load(file, mocks = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText, { exports, require: name => { assert.ok(name in mocks, name); return mocks[name]; } });
  return exports;
}
const { planReplacements } = load('lib/squad/replacements.ts');
const player = (id, changes = {}) => ({ id, position: 'DEF', price: 100, status: 'available', teamName: 'PSG', ...changes });
const pick = (id, changes = {}) => ({ playerId: id, purchasePrice: 100, slot: 'STARTING', squadOrder: 2, isCaptain: true, ...changes });

test('replacement preserves historical input, slot, captain and budget; rejects ineligible candidates', () => {
  const picks = [pick('old'), pick('owned', { isCaptain: false })];
  const players = [player('old', { status: 'retired' }), player('owned'),
    player('wrong-position', { position: 'FWD' }), player('injured', { status: 'injured' }),
    player('expensive', { price: 3001 }), player('icon', { teamName: 'Icons' }), player('new', { price: 95 })];
  const result = planReplacements(picks, players);
  assert.equal(result.picks[0].playerId, 'new');
  assert.equal(result.picks[0].isCaptain, true);
  assert.equal(result.picks[0].squadOrder, 2);
  assert.equal(result.bank, 2805);
  assert.equal(picks[0].playerId, 'old');
});

test('club cap excludes otherwise eligible players', () => {
  const retained = ['a','b','c','d'];
  const result = planReplacements([pick('old'), ...retained.map(id => pick(id))],
    [player('old', {status:'retired'}), ...retained.map(id => player(id)), player('blocked'), player('new', {teamName:'Lyon'})]);
  assert.equal(result.picks[0].playerId, 'new');
});

test('multiple replacements backtrack to respect budget without duplicates', () => {
  const result = planReplacements([pick('oldDef'), pick('oldMid'), pick('kept')], [
    player('oldDef', {status:'retired',price:200}), player('oldMid', {status:'retired',position:'MID',price:100}),
    player('kept', {price:2800,position:'GK'}), player('costly', {price:150}), player('cheap', {price:50}),
    player('mid', {position:'MID',price:100})
  ]);
  assert.equal(result.picks[0].playerId, 'cheap');
  assert.equal(result.picks[1].playerId, 'mid');
  assert.equal(result.bank, 50);
});

test('no candidates returns no plan', () => {
  assert.equal(planReplacements([pick('old')], [player('old', {status:'retired'})]), null);
});

test('Icon fills the same position when all regular alternatives breach club limits', () => {
  const retained = ['a', 'b', 'c', 'd'];
  const result = planReplacements([pick('old'), ...retained.map(id => pick(id))], [
    player('old', {status:'retired'}), ...retained.map(id => player(id)),
    player('regular'), player('icon', {teamName:'Icons'})
  ]);
  assert.equal(result.picks[0].playerId, 'icon');
  assert.equal(result.picks[0].isCaptain, true);
});

test('regular combinations are exhausted before an Icon fallback', () => {
  const result = planReplacements([pick('oldDef'), pick('oldMid'), pick('kept')], [
    player('oldDef', {status:'retired',price:200}), player('oldMid', {status:'retired',position:'MID'}),
    player('kept', {price:2800,position:'GK'}), player('costly', {price:150}), player('cheap', {price:50}),
    player('mid', {position:'MID',price:100}), player('iconMid', {teamName:'Icons',position:'MID',price:10})
  ]);
  assert.equal(result.picks[0].playerId, 'cheap');
  assert.equal(result.picks[1].playerId, 'mid');
});

test('Icon fallback still obeys availability, position, budget, club cap and uniqueness', () => {
  for (const change of [{status:'retired'}, {status:'injured'}, {position:'GK'}, {price:3001}]) {
    assert.equal(planReplacements([pick('old')], [player('old',{status:'retired'}),player('icon',{teamName:'Icons',...change})]), null);
  }
  assert.equal(planReplacements([pick('old'),pick('icon')], [player('old',{status:'retired'}),player('icon',{teamName:'Icons'})]), null);
  const retained = ['a','b','c','d'];
  assert.equal(planReplacements([pick('old'),...retained.map(id=>pick(id))], [player('old',{status:'retired'}),...retained.map(id=>player(id,{teamName:'Icons'})),player('extra',{teamName:'Icons'})]), null);
});

test('delete archives only the player; denies non-admin and missing player', async () => {
  let role = 'STUDENT';
  let found = true;
  const updates = [];
  const route = load('app/api/admin/players/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => ({body,status:options?.status || 200}) } },
    '@/lib/auth/session': { readSession: async () => ({role}) },
    '@/lib/db': { prisma: { schoolPlayer: {
      findUnique: async () => found ? {id:'old'} : null,
      update: async args => { updates.push(args); }
    } } }
  });
  const req = {json:async()=>({id:'old'})};
  assert.equal((await route.DELETE(req)).status, 403);
  role = 'ADMIN';
  assert.equal((await route.DELETE(req)).status, 200);
  assert.equal(updates[0].data.status, 'retired');
  assert.equal(Object.keys(updates[0].data).length, 1);
  found = false;
  assert.equal((await route.DELETE(req)).status, 404);
  assert.equal(updates.length, 1);
});
