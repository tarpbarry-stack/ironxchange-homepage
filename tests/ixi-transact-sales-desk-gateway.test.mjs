import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
const require=createRequire(import.meta.url);
const { mutationOriginIsValid }=require("../lib/ixi-authority/ixiAuthorityProxy.js");
const source=fs.readFileSync(new URL("../pages/api/ixi/sales-desk/[...path].js",import.meta.url),"utf8").replace(/^import .*;\n/gm,"").replace(/^export const config=.*;$/gm,"").replace("export function createSalesDeskHandler","function createSalesDeskHandler").replace("export default createSalesDeskHandler();","return createSalesDeskHandler;");
const factory=new Function("mutationOriginIsValid",source)(mutationOriginIsValid);
const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(body){this.body=body;return this;}});
const request=(method="GET",path=["bootstrap"])=>({method,query:{path},headers:{host:"ixi.test",origin:"https://ixi.test"}});

test("Sales Desk verifies session and company server-side and never forwards browser authority",async()=>{
  let upstream;
  const handler=factory({sessionFor:async()=>({userId:"verified-owner"}),contextFor:async()=>({entityId:"verified-company"}),request:async input=>{upstream=input;return {ok:true};}});
  const req=request();req.query.entityId="other-company";req.query.principalId="other-user";
  const res=response();await handler(req,res);
  assert.equal(res.code,200);assert.equal(upstream.entityId,"verified-company");assert.equal(upstream.principalId,"verified-owner");assert.equal(upstream.path,"/sales-desk/bootstrap");assert.match(res.headers["Cache-Control"],/private, no-store/);
});
test("anonymous, denied membership and cross-origin requests cannot read or write sales records",async()=>{
  let called=0;
  for(const status of [401,403]) {
    const handler=factory({sessionFor:async()=>{throw Object.assign(new Error("Denied"),{status});},contextFor:async()=>({}),request:async()=>{called++;}});
    const res=response();await handler(request(),res);assert.equal(res.code,status);
  }
  const handler=factory({sessionFor:async()=>{called++;},contextFor:async()=>({}),request:async()=>{called++;}});
  const req=request("POST",["commands"]);req.headers.origin="https://other.test";
  const res=response();await handler(req,res);assert.equal(res.code,403);assert.equal(called,0);
});
test("unsupported routes and identity mutations do not reach IX-Core",async()=>{
  let called=0;const handler=factory({sessionFor:async()=>{called++;},contextFor:async()=>({}),request:async()=>{called++;}});
  for(const path of [["objects","provision"],["records","other"],["records","contacts","..","commands"]]) {
    const res=response();await handler(request("POST",path),res);assert.equal(res.code,405);
  }
  assert.equal(called,0);
});
test("save envelopes preserve retries and revision checks; errors remain visible",async()=>{
  let upstream;const deps={sessionFor:async()=>({userId:"owner"}),contextFor:async()=>({entityId:"company"}),request:async input=>{upstream=input;throw Object.assign(new Error("Record changed"),{status:409,code:"SALES_REVISION_CONFLICT"});}};
  const req=request("POST",["commands"]);req.body={commandId:"stable-save",revision:3,kind:"contacts",record:{id:"contact-one",name:"Customer"}};
  const res=response();await factory(deps)(req,res);
  assert.deepEqual(upstream.body,req.body);assert.equal(res.code,409);assert.equal(res.body.error.code,"SALES_REVISION_CONFLICT");
});
test("selected companies remain subject to core membership checks",async()=>{
  let upstream;const handler=factory({sessionFor:async()=>({userId:"verified-user"}),contextFor:async()=>{throw new Error('Must not provision company');},request:async input=>{upstream=input;throw Object.assign(new Error('Company denied'),{status:403});}});
  const req=request();req.query.company='someone-elses-company';const res=response();await handler(req,res);assert.equal(res.code,403);assert.equal(upstream.principalId,'verified-user');assert.equal(upstream.entityId,'someone-elses-company');
});
test("invitation acceptance uses verified session email and never browser-provided claims",async()=>{
  let upstream;const handler=factory({sessionFor:async()=>({userId:'verified-user',currentUser:{attributes:{email:'actual@example.test',emailVerified:false}}}),contextFor:async()=>{throw new Error('No owner lookup for invitation acceptance');},request:async input=>{upstream=input;return {ok:true};}});
  const req=request('POST',['invitations','accept']);req.body={entityId:'company',id:'invite',token:'secret',email:'spoofed@example.test',verifiedEmail:true,role:'owner'};const res=response();await handler(req,res);
  assert.equal(upstream.entityId,'');assert.equal(upstream.body.email,'actual@example.test');assert.equal(upstream.body.verifiedEmail,false);assert.equal(upstream.body.role,undefined);
});
test("catalog and deal financials require fresh core authorization before loading data",async()=>{
  let loaded=0;const handler=factory({sessionFor:async()=>({userId:'user'}),contextFor:async()=>({entityId:'company'}),request:async()=>{throw Object.assign(new Error('Seat revoked'),{status:403});},inventoryFor:async()=>{loaded++;},financialFor:async()=>{loaded++;}});
  for(const path of [['inventory'],['financial','deal-id']]){const res=response();await handler(request('GET',path),res);assert.equal(res.code,403);}assert.equal(loaded,0);
});

test("owner discovery remains available during the backward-compatible backend rollout",async()=>{
  const calls=[];const handler=factory({sessionFor:async()=>({userId:'owner'}),contextFor:async()=>({entityId:'actual-company'}),request:async input=>{calls.push(input);if(input.path==='/sales-desk/companies')throw Object.assign(new Error('Entity required'),{code:'IXI_INTERNAL_ENTITY_REQUIRED',status:401});return {ok:true,context:{entityId:'actual-company',company:'Company',role:'owner'}};}});
  const res=response();await handler(request('GET',['companies']),res);assert.equal(res.code,200);assert.equal(res.body.companies[0].entityId,'actual-company');assert.equal(calls[1].principalId,'owner');assert.equal(calls[1].entityId,'actual-company');
});

test('calendar ranges, scopes and revision envelopes remain subject to authenticated core authority',async()=>{
  const calls=[];const handler=factory({sessionFor:async()=>({userId:'rep'}),contextFor:async()=>({entityId:'company'}),request:async input=>{calls.push(input);return {ok:true};}});
  const req=request('GET',['calendar']);Object.assign(req.query,{from:'2026-09-01',to:'2026-09-30',scope:'team',zone:'America/Chicago',includeCompleted:'true',principalId:'owner'});const res=response();await handler(req,res);
  assert.equal(res.code,200);assert.equal(calls[0].principalId,'rep');assert.match(calls[0].path,/scope=team/);assert.match(calls[0].path,/zone=America%2FChicago/);
  const preview=request('POST',['calendar','preview']);preview.body={kind:'tasks',record:{id:'task',dueDate:'2026-09-20'},revision:2};await handler(preview,response());assert.deepEqual(calls[1].body,preview.body);
});
test('inquiry sync forwards only the verified source page and cannot accept forged browser rows',async()=>{
  const calls=[];let sourceActor;
  const handler=factory({sessionFor:async()=>({userId:'owner'}),contextFor:async()=>({entityId:'company'}),request:async input=>{calls.push(input);return input.path==='/sales-desk/context' ? {context:{canManageTeam:true,canWrite:true,ownerUserId:'actual-seller'}} : {ok:true,results:[]};},inquiriesFor:async(actor,input)=>{sourceActor=actor;assert.deepEqual(input,{page:2,until:'2026-09-17T12:00:00Z'});return {rows:[{sourceId:'verified-source'}],issues:[],page:2,totalPages:2,total:30,until:input.until};}});
  const req=request('POST',['inquiries','sync']);req.body={page:2,until:'2026-09-17T12:00:00Z',rows:[{sourceId:'forged',buyer:{name:'Spoofed'}}],providerUserId:'other'};const res=response();await handler(req,res);
  assert.equal(res.code,200);assert.equal(sourceActor.ownerUserId,'actual-seller');assert.deepEqual(calls[1].body,{rows:[{sourceId:'verified-source'}]});
  const blocked=response();await handler(request('POST',['intake']),blocked);assert.equal(blocked.code,405);
});

test('manual inquiries preserve retry payloads and use freshly verified server authority',async()=>{
  let upstream;const handler=factory({sessionFor:async()=>({userId:'verified-rep'}),contextFor:async()=>({entityId:'verified-company'}),request:async input=>{upstream=input;return {ok:true};}});
  const req=request('POST',['inquiries','manual']);req.body={commandId:'stable-inquiry',source:'Phone call',contactId:'customer',title:'Loader inquiry',schedule:{dueDate:'2026-10-12'}};
  req.query.principalId='owner';req.query.entityId='other';const res=response();await handler(req,res);
  assert.equal(res.code,200);assert.equal(upstream.principalId,'verified-rep');assert.equal(upstream.entityId,'verified-company');assert.equal(upstream.path,'/sales-desk/inquiries/manual');assert.deepEqual(upstream.body,req.body);
  req.headers.origin='https://other.test';const denied=response();await handler(req,denied);assert.equal(denied.code,403);
});
