const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const repo = path.resolve(__dirname, '..');
const stage = path.join(__dirname, 'points-fix');
const ts = require(path.join(repo, 'node_modules/typescript'));
function load(file, mocks = {}) {
  const staged = path.join(stage, file);
  const source = fs.readFileSync(fs.existsSync(staged) ? staged : path.join(repo, file), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  vm.runInNewContext(output, { exports, URL, console: { error() {} }, require(name) {
    if (name in mocks) return mocks[name];
    throw new Error('Unexpected dependency: ' + name);
  } });
  return exports;
}
const response = { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } };
const rules = load('lib/scoring/rules.ts');
function fixture() {
  const player = (id, teamName = 'Lyon') => ({ id, firstName: id, lastName: 'Player', position: 'DEF', teamName });
  const players = [player('noble'), player('other'), player('icon', 'Icons'), player('negative'), player('unscored')];
  const stat = (id, gameweekId, values) => ({ id: id + gameweekId, playerId: id, gameweekId, minutes: 45, goals: 0, assists: 0, cleanSheet: false, yellowCards: 0, redCards: 0, ownGoals: 0, saves: 0, penaltySaves: 0, penaltyMisses: 0, bonus: 0, rawPoints: 0, ...values });
  const stats = [stat('noble', 1, { goals: 9, assists: 9, yellowCards: 1, redCards: 1 }), stat('other', 1, { rawPoints: 5 }), stat('icon', 1, { rawPoints: 200 }), stat('negative', 1, { rawPoints: -2 }), stat('noble', 2, { rawPoints: 10 })];
  const picks = [{ playerId: 'noble', slot: 'STARTING', isCaptain: true }, { playerId: 'other', slot: 'STARTING' }, { playerId: 'icon', slot: 'BENCH' }, { playerId: 'unscored', slot: 'STARTING' }].map(p => ({ ...p, player: players.find(x => x.id === p.playerId) }));
  const scores = [{ teamId: 'team', gameweekId: 1, transferHits: 4, finalPoints: -4 }, { teamId: 'team', gameweekId: 2, transferHits: 0, finalPoints: 10 }];
  const team = { id: 'team', name: 'Test team', picks, gameweekScores: [scores[0]], overallPoints: 6 };
  const filter = (where) => stats.filter(s => (!where.gameweekId || s.gameweekId === where.gameweekId) && (!where.playerId || (typeof where.playerId === 'string' ? s.playerId === where.playerId : where.playerId.in.includes(s.playerId))));
  const db = {
    gameweek: { findUnique: async ({ where }) => where.id === 1 ? { id: 1 } : null },
    playerGameweekStat: {
      count: async ({ where }) => filter(where).length,
      findMany: async ({ where, include }) => filter(where).map(s => include ? { ...s, player: players.find(p => p.id === s.playerId) } : s),
      findUnique: async ({ where }) => filter(where.playerId_gameweekId)[0] || null,
      update: async ({ where, data }) => Object.assign(stats.find(s => s.id === where.id), data),
      upsert: async ({ where, create, update }) => {
        const existing = filter(where.playerId_gameweekId)[0];
        if (existing) return Object.assign(existing, update);
        const added = stat(create.playerId, create.gameweekId, create);
        stats.push(added);
        return added;
      },
      groupBy: async ({ where, take }) => {
        assert.equal(where.player.OR[1].teamName.not, 'Icons');
        const sums = {};
        for (const s of filter(where)) {
          if (players.find(p => p.id === s.playerId).teamName.toLowerCase() === 'icons') continue;
          sums[s.playerId] = (sums[s.playerId] || 0) + s.rawPoints;
        }
        return Object.entries(sums).sort((a, b) => b[1] - a[1]).slice(0, take).map(([playerId, rawPoints]) => ({ playerId, _sum: { rawPoints } }));
      }
    },
    team: { findMany: async () => [team], findUnique: async () => team, count: async () => 1, update: async ({ data }) => Object.assign(team, data) },
    teamGameweekScore: {
      upsert: async ({ where, update }) => Object.assign(scores.find(s => s.gameweekId === where.teamId_gameweekId.gameweekId), update),
      aggregate: async () => ({ _sum: { finalPoints: scores.reduce((sum, s) => sum + s.finalPoints, 0) } })
    },
    squadPick: { groupBy: async () => [] },
    schoolPlayer: { findMany: async ({ where }) => where?.teamName ? players.filter(p => p.teamName.toLowerCase() === 'icons') : players }
  };
  db.$transaction = async callback => callback(db);
  return { db, stats, scores, team };
}
function mocks(db, session = { id: 'user', role: 'ADMIN' }) {
  return { '@/lib/db': { prisma: db }, '@/lib/auth/session': { readSession: async () => session }, '@/lib/gameweek': { getCurrentGameweek: async () => ({ id: 1, name: 'Gameweek 1' }) }, 'next/server': response };
}
test('calculation persists screenshot stats, updates captain/team totals and is repeatable', async () => {
  const { db, stats, scores, team } = fixture();
  const scoring = load('lib/scoring/calculateGameweek.ts', { ...mocks(db), './rules': rules });
  const route = load('app/api/admin/gameweeks/[id]/calculate/route.ts', { ...mocks(db), '@/lib/scoring/calculateGameweek': scoring });
  for (let i = 0; i < 2; i++) {
    const result = await route.POST({ url: 'http://localhost/api/admin/gameweeks/1/calculate?playerId=noble' }, { params: Promise.resolve({ id: '1' }) });
    assert.equal(result.status, 200);
    assert.equal(result.body.playersCalculated, 1);
    assert.equal(stats[0].rawPoints, 78);
    assert.equal(stats[1].rawPoints, 5);
    assert.equal(scores[0].finalPoints, 157);
    assert.equal(team.overallPoints, 167);
  }
  const popular = await load('app/api/popular/route.ts', mocks(db)).GET();
  assert.equal(popular.body.gwPts[0].points, 78);
  assert.equal(popular.body.seasonPts[0].points, 88);
  assert.equal(popular.body.gwPts.some(p => p.id === 'icon'), false);
  assert.equal(popular.body.gwPts.find(p => p.id === 'negative').points, -2);
  const squad = await load('app/api/team/picks/route.ts', mocks(db)).GET();
  assert.equal(squad.body.team.picks[0].player.gwPoints, 78);
  assert.equal(squad.body.team.picks[3].player.gwPoints, 0);
  const publicTeam = await load('app/api/team/[id]/route.ts', mocks(db)).GET({}, { params: Promise.resolve({ id: 'team' }) });
  assert.equal(publicTeam.body.team.picks[0].player.gwPoints, 78);
  assert.equal(publicTeam.body.team.picks[2].player.gwPoints, 20);
  assert.equal(publicTeam.body.team.picks[3].player.gwPoints, 0);
  assert.equal(publicTeam.body.team.gameweekName, 'Gameweek 1');
  assert.equal(publicTeam.body.team.overallPoints, 167);
  const total = await load('app/api/team/score/route.ts', mocks(db)).GET();
  assert.equal(total.body.gameweekPoints, 157);
  assert.equal(total.body.overall, 167);
});
test('calculation rejects unauthorized, invalid, missing gameweek and unsaved stats', async () => {
  for (const [session, id, playerId, expected] of [[null, '1', 'noble', 403], [{ role: 'STUDENT' }, '1', 'noble', 403], [{ role: 'ADMIN' }, 'abc', 'noble', 400], [{ role: 'ADMIN' }, '99', 'noble', 404], [{ role: 'TEACHER' }, '1', 'missing', 400]]) {
    const { db } = fixture();
    const route = load('app/api/admin/gameweeks/[id]/calculate/route.ts', { ...mocks(db, session), '@/lib/scoring/calculateGameweek': { calculateGameweek() { assert.fail('Must not calculate'); } } });
    const result = await route.POST({ url: `http://localhost/?playerId=${playerId}` }, { params: Promise.resolve({ id }) });
    assert.equal(result.status, expected);
    assert.ok(result.body.error);
  }
});
test('failed scoring is never reported as success', async () => {
  const { db } = fixture();
  const route = load('app/api/admin/gameweeks/[id]/calculate/route.ts', { ...mocks(db), '@/lib/scoring/calculateGameweek': { calculateGameweek() { throw new Error('Unavailable'); } } });
  const result = await route.POST({ url: 'http://localhost/?playerId=noble' }, { params: Promise.resolve({ id: '1' }) });
  assert.equal(result.status, 500);
  assert.equal(result.body.ok, undefined);
});
test('saved stats load for editing, and missing stats return null', async () => {
  const { db } = fixture();
  const route = load('app/api/admin/stats/route.ts', mocks(db));
  assert.equal((await route.GET({ url: 'http://localhost/?playerId=noble&gameweekId=1' })).body.stats.goals, 9);
  assert.equal((await route.GET({ url: 'http://localhost/?playerId=missing&gameweekId=1' })).body.stats, null);
});

test('Icons get a fixed 20 every week, even without minutes; captain doubles and recalculation never accumulates', async () => {
  const { db, stats, team, scores } = fixture();
  team.picks.forEach(p => { p.isCaptain = p.playerId === 'icon'; if (p.isCaptain) p.slot = 'STARTING'; });
  stats.find(s => s.playerId === 'icon').minutes = 0;
  const scoring = load('lib/scoring/calculateGameweek.ts', { ...mocks(db), './rules': rules });
  for (let i = 0; i < 2; i++) {
    await scoring.calculateGameweek(1, 'icon');
    assert.equal(stats.find(s => s.playerId === 'icon').rawPoints, 20);
    assert.equal(scores[0].finalPoints, 41);
  }
  await scoring.calculateGameweek(2, 'icon');
  assert.equal(stats.find(s => s.playerId === 'icon' && s.gameweekId === 2).rawPoints, 20);
});
