import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const runtimeModules = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const playwrightUrl = runtimeModules
  ? pathToFileURL(path.join(runtimeModules, "playwright/index.js")).href
  : "playwright";
let chromium = null;
try {
  const playwright = await import(playwrightUrl);
  chromium = (playwright["module.exports"] || playwright.default)?.chromium || null;
} catch {
  chromium = null;
}

const root = path.resolve(new URL("../..", import.meta.url).pathname);
const controllerPath = path.join(
  root,
  "components/ixi-mos/workspace/IXIAosWorkspaceSessionController.mjs"
);
const enginePath = path.join(
  root,
  "components/ixi-mos/workspace/IXIAosSessionPlacementEngine.mjs"
);

const harness = `<!doctype html>
<meta charset="utf-8">
<title>IXI AOS Session Commercial Browser Proof</title>
<style>
body{font:15px system-ui;background:#101311;color:#f4f5f4;margin:24px}button{margin:4px;padding:8px 12px}.card,.preview{border:1px solid #ffc400;padding:10px;margin:8px}.preview{display:inline-block;border-style:dashed}.metric{display:inline-block;margin-right:22px}#status{color:#ffc400}
</style>
<h1>Star & Sons / Wichita Falls</h1>
<div id="status">starting</div>
<div class="metric">Objects <b id="object-count">3</b></div>
<div class="metric">Passports <b id="passport-count">3</b></div>
<div id="session"></div><div id="context"></div><div id="surface"></div>
<button id="connect">Connect Wichita Falls</button>
<button id="equipment">Call Equipment</button>
<button id="wichita">Call Wichita Falls</button>
<button id="recall">Recall to start</button>
<button id="move">Move to board</button>
<button id="return">Return operation</button>
<section id="operating"></section>
<section id="previews">
  <div class="preview" data-owner="object_equipment" data-object-id="object_ripper">Equipment preview · IXI_RIPPER</div>
  <div class="preview" data-owner="object_wichita" data-object-id="object_ripper">Wichita Falls preview · IXI_RIPPER</div>
</section>
<script type="module">
import { createAosWorkspaceSessionController } from "/controller.mjs";
const R="object_ripper", E="object_equipment", W="object_wichita";
const passports={[R]:"IXI_RIPPER",[E]:"IXI_EQUIPMENT",[W]:"IXI_WICHITA"};
const scope=new URLSearchParams(location.search).get("placementScope")||"personal";
let sequence=0;
let session=JSON.parse(sessionStorage.getItem("ixi-browser-session")||"null");
let relationships=JSON.parse(sessionStorage.getItem("ixi-browser-relationships")||"[]");
const clone=value=>JSON.parse(JSON.stringify(value));
const save=()=>sessionStorage.setItem("ixi-browser-session",JSON.stringify(session));
const stamp=()=>\`2026-09-07T19:\${String(++sequence).padStart(2,"0")}:00.000Z\`;
function envelope(){return {ok:true,result:{changed:true,session:clone(session)},replayed:false}}
const transport={
  async open(request){
    if(request.placementScope==="shared") {const error=new Error("Shared scope denied");error.code="WORKSPACE_SHARED_SCOPE_DENIED";error.status=403;throw error}
    if(!session){session={sessionId:"session_browser_commercial",tenantId:"tenant_star",entityId:"entity_star",workspaceId:request.workspaceId,placementScope:"personal",scopeOwnerId:"principal_employee_1",sharedScopeId:null,status:"active",revision:0,objects:{},startedAt:"2026-09-07T19:00:00.000Z",updatedAt:"2026-09-07T19:00:00.000Z",expiresAt:"2026-09-08T19:00:00.000Z",endedAt:null};save();return {ok:true,result:{created:true,resumed:false,session:clone(session)},replayed:false}}
    return {ok:true,result:{created:false,resumed:true,session:clone(session)},replayed:false}
  },
  async read(){return {ok:true,session:clone(session)}},
  async command(request){
    if(request.expectedRevision!==session.revision){const error=new Error("revision conflict");error.code="WORKSPACE_SESSION_REVISION_CONFLICT";error.status=409;throw error}
    const p=request.payload||{}, id=p.objectId, now=stamp();
    if(request.commandType==="object.admit") session.objects[id]={objectId:id,sessionOrigin:{surfaceId:p.surfaceId,visualOrder:p.visualOrder,operatingState:p.operatingState},currentPlacement:{surfaceId:p.surfaceId,visualOrder:p.visualOrder,operatingState:p.operatingState},activeSummonedContext:p.activeSummonedContext||null,returnSnapshot:null,admittedAt:now,updatedAt:now};
    else if(request.commandType==="object.snapshot.capture") session.objects[id].returnSnapshot={operationId:p.operationId,placement:clone(session.objects[id].currentPlacement),capturedAt:now};
    else if(request.commandType==="object.move") session.objects[id].currentPlacement={surfaceId:p.surfaceId,visualOrder:p.visualOrder,operatingState:p.operatingState};
    else if(request.commandType==="object.recall") session.objects[id].currentPlacement=clone(session.objects[id].sessionOrigin);
    else if(request.commandType==="object.undo"){session.objects[id].currentPlacement=clone(session.objects[id].returnSnapshot.placement);session.objects[id].returnSnapshot=null}
    else if(request.commandType==="summon.set") session.objects[id].activeSummonedContext=p.activeSummonedContext||null;
    else if(request.commandType==="surface.reorder") p.orderedObjectIds.forEach((objectId,index)=>session.objects[objectId].currentPlacement.visualOrder=index);
    session.revision+=1;session.updatedAt=now;save();return envelope();
  },
  async end(){session.status="ended";session.revision+=1;save();return envelope()}
};
let counter=0,lastOperationId=null;
const controller=createAosWorkspaceSessionController({transport,createCommandId:prefix=>\`\${prefix}:browser:\${++counter}\`,initialSurfaces:{board:[],indexEquipment:[],[\`container:\${E}\`]:[],[\`container:\${W}\`]:[]},relationshipTransport:async request=>{
  if(request.memberPassportId!==passports[R]||request.parentPassportId!==passports[W]) throw new Error("Passport evidence mismatch");
  const relationship={relationshipId:"relationship_ripper_wichita",behaviorId:"aos.rail-membership.v1",sourceObjectId:R,sourcePassportId:passports[R],targetObjectId:W,targetPassportId:passports[W],revision:1,status:"active"};
  relationships=[relationship];sessionStorage.setItem("ixi-browser-relationships",JSON.stringify(relationships));return {ok:true,relationship};
}});
function moveOnly(target){const current=controller.readPlacements();Object.keys(current).forEach(key=>current[key]=(current[key]||[]).filter(id=>id!==R));current[target]=[...(current[target]||[]),R];return current}
function render(){const state=controller.readSession(), record=state.objects[R];document.querySelector("#session").textContent=\`Session: \${state.sessionId} · revision \${state.revision}\`;document.querySelector("#context").textContent=\`Context: \${record?.activeSummonedContext||"none"}\`;document.querySelector("#surface").textContent=\`Surface: \${record?.currentPlacement?.surfaceId||"none"}\`;document.querySelector("#operating").innerHTML=record?\`<article class="card operating-card" data-object-id="\${R}" data-passport-id="\${passports[R]}">Ripper · \${passports[R]}</article>\`:""}
async function place(target,context){const op=controller.persistLayout(moveOnly(target),{objectIds:[R]});lastOperationId=op.operationId;await op.completion;await controller.summon(R,context);render()}
window.browserReady=(async()=>{try{await controller.open({workspaceId:"aos-work",placementScope:scope,sharedScopeId:scope==="shared"?"dispatch":null});await controller.admitObjects([{objectId:E,surfaceId:"board",visualOrder:0,operatingState:"operating"},{objectId:W,surfaceId:"board",visualOrder:1,operatingState:"operating"},{objectId:R,surfaceId:"indexEquipment",visualOrder:0,operatingState:"tucked",activeSummonedContext:E}]);render();document.querySelector("#status").textContent="ready"}catch(error){document.querySelector("#status").textContent=error.code||error.message}})();
document.querySelector("#connect").onclick=async()=>{const op=controller.connect({nextPlacements:moveOnly(\`container:\${W}\`),objectId:R,relationship:{parentObjectId:W,parentPassportId:passports[W],memberObjectId:R,memberPassportId:passports[R],orderKey:"000100"}});lastOperationId=op.operationId;await op.completion;await controller.summon(R,W);render()};
document.querySelector("#equipment").onclick=()=>place(\`container:\${E}\`,E);
document.querySelector("#wichita").onclick=()=>place(\`container:\${W}\`,W);
document.querySelector("#recall").onclick=async()=>{const result=await controller.recall([R]);lastOperationId=result.operationId;render()};
document.querySelector("#move").onclick=()=>place("board",null);
document.querySelector("#return").onclick=async()=>{await controller.undo(lastOperationId);render()};
window.evidence=()=>({sessionId:controller.readSession().sessionId,revision:controller.readSession().revision,record:clone(controller.readSession().objects[R]),relationships:clone(relationships),objectCount:Number(document.querySelector("#object-count").textContent),passportCount:Number(document.querySelector("#passport-count").textContent),previewCount:document.querySelectorAll(\`.preview[data-object-id="\${R}"]\`).length,operatingCount:document.querySelectorAll(\`.operating-card[data-object-id="\${R}"]\`).length});
</script>`;

function serveFile(res, file, contentType) {
  res.writeHead(200, { "Content-Type": contentType, "Cache-Control": "no-store" });
  res.end(fs.readFileSync(file));
}

test("Star & Sons/Wichita Falls browser story uses one identity and session-only placement", async t => {
  if (!chromium) {
    t.skip("Playwright and a Chromium executable are required for the commercial browser gate.");
    return;
  }
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, "http://127.0.0.1").pathname;
    if (pathname === "/controller.mjs") return serveFile(res, controllerPath, "text/javascript");
    if (pathname === "/IXIAosSessionPlacementEngine.mjs") return serveFile(res, enginePath, "text/javascript");
    res.writeHead(200, { "Content-Type": "text/html", "Cache-Control": "no-store" });
    res.end(harness);
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.IXI_BROWSER_EXECUTABLE_PATH || undefined
    });
  } catch (error) {
    if (/Executable doesn't exist|browser executable/i.test(String(error?.message || error))) {
      t.skip("A Chromium executable is required for the commercial browser gate.");
      return;
    }
    throw error;
  }
  t.after(() => browser.close());
  const context = await browser.newContext();
  const page = await context.newPage();
  const base = `http://127.0.0.1:${server.address().port}`;
  await page.goto(`${base}/harness`);
  await page.waitForFunction(() => document.querySelector("#status")?.textContent === "ready");

  const baseline = await page.evaluate(() => window.evidence());
  assert.equal(baseline.objectCount, 3);
  assert.equal(baseline.passportCount, 3);
  assert.equal(baseline.previewCount, 2);
  assert.equal(baseline.operatingCount, 1);
  assert.equal(baseline.record.sessionOrigin.surfaceId, "indexEquipment");

  await page.click("#connect");
  await page.waitForFunction(() => window.evidence().relationships.length === 1);
  const connected = await page.evaluate(() => window.evidence());
  assert.equal(connected.record.objectId, "object_ripper");
  assert.equal(connected.relationships[0].sourcePassportId, "IXI_RIPPER");
  assert.equal(connected.objectCount, baseline.objectCount);
  assert.equal(connected.passportCount, baseline.passportCount);
  assert.equal(connected.previewCount, 2);
  assert.equal(connected.operatingCount, 1);

  await page.click("#equipment");
  await page.waitForFunction(() => window.evidence().record.activeSummonedContext === "object_equipment");
  await page.click("#wichita");
  await page.waitForFunction(() => window.evidence().record.activeSummonedContext === "object_wichita");
  await page.click("#recall");
  await page.waitForFunction(() => window.evidence().record.currentPlacement.surfaceId === "indexEquipment");

  await page.click("#move");
  await page.waitForFunction(() => window.evidence().record.currentPlacement.surfaceId === "board");
  await page.click("#return");
  await page.waitForFunction(() => window.evidence().record.currentPlacement.surfaceId === "indexEquipment");

  const beforeRefresh = await page.evaluate(() => window.evidence());
  await page.reload();
  await page.waitForFunction(() => document.querySelector("#status")?.textContent === "ready");
  const refreshed = await page.evaluate(() => window.evidence());
  assert.equal(refreshed.sessionId, beforeRefresh.sessionId);
  assert.equal(refreshed.record.sessionOrigin.surfaceId, "indexEquipment");
  assert.equal(refreshed.objectCount, baseline.objectCount);
  assert.equal(refreshed.passportCount, baseline.passportCount);

  const results = path.join(root, "test-results");
  fs.mkdirSync(results, { recursive: true });
  await page.screenshot({
    path: path.join(results, "aos-session-commercial-browser.png"),
    fullPage: true
  });
  fs.writeFileSync(
    path.join(results, "aos-session-commercial-browser.json"),
    `${JSON.stringify(refreshed, null, 2)}\n`
  );

  const denied = await context.newPage();
  await denied.goto(`${base}/harness?placementScope=shared&sharedScopeId=dispatch`);
  await denied.waitForFunction(() => document.querySelector("#status")?.textContent !== "starting");
  assert.equal(await denied.textContent("#status"), "WORKSPACE_SHARED_SCOPE_DENIED");
});
