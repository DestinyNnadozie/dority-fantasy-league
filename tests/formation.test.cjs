const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const repo = process.env.TEST_PROJECT || path.resolve(__dirname, '..');
const root = process.env.TEST_SOURCE_ROOT || repo;
const ts = require(path.join(repo, 'node_modules/typescript'));
function load(file, mocks={}) {
  const exports={};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:name=>{assert.ok(name in mocks,name);return mocks[name];}});
  return exports;
}
const {restoreSavedSquad,pitchOrder}=load('lib/squad/formation.ts');
function squad(formation) {
  const [d,m,f]=formation.split('-').map(Number);
  return ['GK',...Array(d).fill('DEF'),...Array(m).fill('MID'),...Array(f).fill('FWD'),'GK','DEF','DEF','MID','MID','FWD'].map((position,i)=>({id:'p'+i,position,slot:i<9?'STARTING':'BENCH',isCaptain:i===1,price:100,teamName:['PSG','Lyon','Marseille','Monaco'][i%4],status:'available'}));
}
for(const formation of ['3-3-2','3-4-1','4-3-1','4-2-2','2-4-2','3-2-3']) {
  test('restores '+formation+' with exact starters, bench and captain',()=>{
    const saved=squad(formation);
    // A bench player arrives earlier in the array than an actual starter.
    saved.unshift(saved.splice(10,1)[0]);
    const restored=restoreSavedSquad(saved);
    assert.equal(restored.formation,formation);
    for(let i=0;i<saved.length;i++) {
      assert.equal(restored.picks[i].id,saved[i].id);
      assert.equal(restored.picks[i].slot,saved[i].slot);
      assert.equal(restored.picks[i].isCaptain,saved[i].isCaptain);
    }
    assert.equal(restored.picks[0].pitchKey,'BENCH-0');
  });
}
test('substitution persists even when array order differs from pitch slots',()=>{
  const {picks}=restoreSavedSquad(squad('4-3-1'));
  const starter=picks.find(p=>p.position==='DEF'&&p.slot==='STARTING');
  const sub=picks.find(p=>p.position==='DEF'&&p.slot==='BENCH');
  const slot=starter.slot,key=starter.pitchKey;
  starter.slot=sub.slot;starter.pitchKey=sub.pitchKey;starter.isCaptain=false;
  sub.slot=slot;sub.pitchKey=key;sub.isCaptain=true;
  const reloaded=restoreSavedSquad([...picks].sort((a,b)=>pitchOrder(a)-pitchOrder(b)));
  assert.equal(reloaded.formation,'4-3-1');
  assert.equal(reloaded.picks.find(p=>p.id===sub.id).pitchKey,key);
  assert.equal(reloaded.picks.find(p=>p.id===sub.id).isCaptain,true);
  assert.equal(reloaded.picks.find(p=>p.id===starter.id).slot,'BENCH');
});

function apiFixture(fail=false) {
  const players=squad('4-3-1');
  let stored=players.map((p,i)=>({playerId:p.id,slot:p.slot,isCaptain:p.isCaptain,isViceCaptain:false,squadOrder:i+1}));
  let bank=1500;
  const db={
    team:{findUnique:async()=>({id:'team',name:'Team',picks:stored.map(p=>({...p,player:players.find(x=>x.id===p.playerId)}))}),update:async({data})=>{bank=data.bank;}},
    schoolPlayer:{findMany:async()=>players},
    playerGameweekStat:{findMany:async()=>[]},
    squadPick:{findMany:async()=>stored.map(p=>({...p,player:players.find(x=>x.id===p.playerId)})),deleteMany:async()=>{stored=[];},createMany:async({data})=>{if(fail)throw Error('Database write failed');stored=data;}},
    $transaction:async f=>{const previous=structuredClone(stored),previousBank=bank;try{return await f(db);}catch(e){stored=previous;bank=previousBank;throw e;}}
  };
  const route=load('app/api/team/picks/route.ts',{
    'next/server':{NextResponse:{json:(body,opts)=>({body,status:opts?.status||200})}},
    '@/lib/db':{prisma:db},'@/lib/auth/session':{readSession:async()=>({id:'user'})},
    '@/lib/gameweek':{assertPicksEditable:async()=>({id:2}),getCurrentGameweek:async()=>({id:2})}
  });
  return {route,players,getStored:()=>stored};
}
test('save then fetch restores a 4-3-1 squad',async()=>{
  const {route,getStored}=apiFixture();
  const incoming=structuredClone(getStored());
  const res=await route.PUT({json:async()=>({picks:incoming})});
  assert.equal(res.status,200);
  const data=(await route.GET()).body;
  const saved=data.team.picks.map(p=>({...p.player,slot:p.slot,isCaptain:p.isCaptain}));
  assert.equal(restoreSavedSquad(saved).formation,'4-3-1');
  assert.equal(saved.filter(p=>p.slot==='BENCH').length,6);
});
test('failed save retains the previously saved squad',async()=>{
  const {route,getStored}=apiFixture(true);
  const before=JSON.stringify(getStored());
  const res=await route.PUT({json:async()=>({picks:structuredClone(getStored())})});
  assert.equal(res.status,400);
  assert.equal(JSON.stringify(getStored()),before);
});
