const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const repo=path.resolve(__dirname,'..');
const initial=require('../data/table.json');
const code=ts.transpileModule(fs.readFileSync(path.join(repo,'app/api/table/route.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;
function setup(role='ADMIN',fail=false){
  let stored=[];
  const db={clubStanding:{findMany:async()=>stored,upsert:args=>args},$transaction:async operations=>{
    if(fail)throw {code:'P2021'};
    stored=operations.map(o=>({...o.create}));
  }};
  const exports={};
  const deps={'next/server':{NextResponse:{json:(body,opts)=>({body,status:opts?.status||200})}},'@/lib/db':{prisma:db},'@/data/table.json':initial,'@/lib/auth/session':{readSession:async()=>role?{role}:null}};
  vm.runInNewContext(code,{exports,console:{error(){}},require:name=>{assert.ok(name in deps,name);return deps[name];}});
  return {route:exports,rows:()=>stored};
}
test('save persists all clubs and subsequent load returns sorted database rows',async()=>{
  const {route,rows}=setup();
  const table=initial.map(r=>({...r,pts:r.team==='PSG'?50:r.pts}));
  const response=await route.PUT({json:async()=>({table})});
  assert.equal(response.status,200);
  assert.equal(rows().length,4);
  assert.equal(response.body.table[0].team,'PSG');
  assert.equal((await route.GET()).body.table[0].pts,50);
});
test('empty database displays bundled standings without a write',async()=>{
  const {route,rows}=setup();
  assert.equal((await route.GET()).body.table.length,4);
  assert.equal(rows().length,0);
});
test('unauthorized saves never write',async()=>{
  for(const role of [null,'STUDENT']){
    const {route,rows}=setup(role);
    assert.equal((await route.PUT({json:async()=>({table:initial})})).status,403);
    assert.equal(rows().length,0);
  }
});
test('invalid or incomplete input cannot overwrite standings',async()=>{
  for(const table of [[],initial.slice(1),initial.map(r=>({...r,team:'PSG'})),initial.map(r=>({...r,pts:-1})),initial.map(r=>({...r,gf:1.5}))]){
    const {route,rows}=setup();
    assert.equal((await route.PUT({json:async()=>({table})})).status,400);
    assert.equal(rows().length,0);
  }
});
test('missing database table gives setup error rather than permission error',async()=>{
  const {route,rows}=setup('ADMIN',true);
  const result=await route.PUT({json:async()=>({table:initial})});
  assert.equal(result.status,503);
  assert.match(result.body.error,/db:club-table/);
  assert.equal(rows().length,0);
});
