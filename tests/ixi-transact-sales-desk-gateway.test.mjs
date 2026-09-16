import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
const require=createRequire(import.meta.url);
const { mutationOriginIsValid }=require("../lib/ixi-authority/ixiAuthorityProxy.js");
const source=fs.readFileSync(new URL("../pages/api/ixi/sales-desk/[...path].js",import.meta.url),"utf8").replace(/^import .*;\n/gm,"").replace("export function createSalesDeskHandler","function createSalesDeskHandler").replace("export default createSalesDeskHandler();","return createSalesDeskHandler;");
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
