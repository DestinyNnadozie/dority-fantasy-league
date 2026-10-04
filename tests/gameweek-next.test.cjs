const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const repo = process.env.TEST_PROJECT || path.resolve(__dirname, '..');
const ts = require(path.join(repo, 'node_modules/typescript'));
const source = process.env.TEST_ROUTE || path.join(repo, 'app/api/admin/gameweeks/next/route.ts');
const code = ts.transpileModule(fs.readFileSync(source, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;

function setup(fixtures, role = 'ADMIN') {
  const writes = [];
  const prisma = {
    gameweek: {
      findFirst: async () => ({ id: 3, name: 'Gameweek 3' }),
      create: async ({ data }) => { writes.push(['create', data]); return data; },
      update: async (args) => { writes.push(['finish', args]); }
    },
    fixture: { findMany: async ({ where }) => {
      assert.equal(where.gameweekId, 3);
      return fixtures.filter(f => f.gameweekId === where.gameweekId);
    } },
    squadPick: {
      findMany: async () => [{ teamId: 'team', playerId: 'player', slot: 'STARTING', squadOrder: 1, isCaptain: true, isViceCaptain: false, purchasePrice: 100 }],
      createMany: async ({ data }) => { writes.push(['picks', data]); }
    }
  };
  const exports = {};
  prisma.$transaction = async callback => callback(prisma);
  const mocks = {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } },
    '@/lib/db': { prisma },
    '@/lib/scoring/calculateGameweek': { calculateGameweek: async (id, playerId, tx) => {
      assert.equal(id, 4);
      assert.equal(tx, prisma);
      writes.push(['score', id]);
    } },
    '@/lib/auth/session': { readSession: async () => role ? { role } : null }
  };
  vm.runInNewContext(code, { exports, require: name => {
    assert.ok(name in mocks, 'Unexpected dependency: ' + name);
    return mocks[name];
  } });
  return { post: exports.POST, writes };
}

test('database scores including 0-0 allow next GW and carry squad forward', async () => {
  const { post, writes } = setup([{ gameweekId: 3, homeGoals: 0, awayGoals: 0 }, { gameweekId: 2, homeGoals: null, awayGoals: null }]);
  const result = await post();
  assert.equal(result.status, 200);
  assert.equal(result.body.gameweek.id, 4);
  assert.equal(writes.find(w => w[0] === 'picks')[1][0].gameweekId, 4);
  assert.equal(writes.find(w => w[0] === 'finish')[1].data.status, 'FINISHED');
  assert.equal(writes.find(w => w[0] === 'score')[1], 4);
});

test('missing fixtures or either missing score block creation without writes', async () => {
  for (const fixtures of [[], [{ gameweekId: 3, homeGoals: null, awayGoals: 0 }], [{ gameweekId: 3, homeGoals: 2, awayGoals: null }]]) {
    const { post, writes } = setup(fixtures);
    assert.equal((await post()).status, 400);
    assert.equal(writes.length, 0);
  }
});

test('non-admin cannot create gameweek', async () => {
  const { post, writes } = setup([], 'STUDENT');
  assert.equal((await post()).status, 403);
  assert.equal(writes.length, 0);
});
