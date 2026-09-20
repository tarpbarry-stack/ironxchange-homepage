import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import { moveObjectToWorkspaceSurface } from "../components/ixi-chassis/IXIWorkspacePlacementEngine.js";
import {
  getAosMembershipObjectIds,
  getAosRailProjectionObjectIds
} from "../lib/mos/IXIAosMembershipBridge.mjs";
import {
  createAosWorkspaceSessionController,
  locateWorkspaceObject,
  workspacePlacementsFromSession
} from "../components/ixi-mos/workspace/IXIAosWorkspaceSessionController.mjs";
import { isAosToolbarSurface } from "../components/ixi-mos/workspace/IXIAosToolbarModel.mjs";
import { pinSystemIndexToBoard } from "../components/ixi-mos/workspace/IXIAosSystemIndexPlacement.mjs";

const coreRoot = process.env.IXI_CORE_CONTRACT_ROOT;

test("paired frontend and signed HTTP SQLite backend recover failed operations", {
  skip: coreRoot ? false : "Run the required paired gate with IXI_CORE_CONTRACT_ROOT."
}, async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ixi-paired-session-"));
  process.env.IXI_MOS_DATA_ROOT = path.join(root, "mos");
  process.env.IXI_MOS_SQLITE_PATH = path.join(root, "mos", "ixi-aos.sqlite");
  process.env.IXI_MOS_STORAGE_PROVIDER = "sqlite";
  process.env.IXI_PASSPORT_DATA_FILE = path.join(root, "passports.json");
  process.env.AWS_EC2_METADATA_DISABLED = "true";
  process.env.IXI_MOS_INTERNAL_SECRET = "isolated-paired-session-test-secret";
  process.env.IXI_MOS_INTERNAL_AUTH_ENFORCE = "true";
  const require = createRequire(path.join(path.resolve(coreRoot), "package.json"));
  const { ensureAosAccount } = require("./mos/accounts/aosAccountService.js");
  const { provisionAosObject } = require("./mos/provisioning/aosObjectProvisioningService.js");
  const { listObjects } = require("./mos/objects/objectService.js");
  const { readPassportRecords } = require("./passport/passportRegistry.js");
  const { getMosSqliteStore } = require("./mos/storage/sqliteStore.js");
  const { buildCanonicalRequest } = require("./mos/security/internalRequestAuthService.js");
  // Authority persistence is the only external dependency replaced in this
  // fixture. Signed request validation and account membership remain real.
  require("./authority/IXIAuthorityDynamoStore.js").getCurrentPolicyRecord = async () => null;
  require("./authority/IXIAuthorityDynamoStore.js").getCurrentPolicyRecords = async ids => ids.map(() => null);
  const express = require("express");
  const app = express();
  app.use(express.json());
  app.use("/mos/v1", require("./mos/routes/mosRouter.js").mosRouter);
  const server = await new Promise(resolve => {
    const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
  });
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    getMosSqliteStore().close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  let sequence = 0;
  const commandId = prefix => prefix + "-" + (++sequence);
  const census = () => ({
    objects: listObjects({ status: null }),
    passports: readPassportRecords()
  });
  const surfaces = { board: [], indexEquipment: [], pocketLeft: [], pocketRight: [] };
  async function fixture() {
    const principalId = commandId("owner");
    const account = ensureAosAccount({
      ownerUserId: principalId,
      displayName: "Isolated paired release test"
    });
    const context = {
      principalId,
      entityId: account.entity.entityId,
      tenantId: account.account.tenantId,
      sharedAuthorized: false
    };
    const create = name => provisionAosObject({
      commandId: commandId("create"), entityId: context.entityId,
      objectType: "customer-defined", displayName: name, actorId: context.principalId
    }).object.objectId;
    const A = create("A"), B = create("B");
    const calls = [], errors = [];
    async function send(method, targetPath, body) {
      const timestamp = String(Date.now()), requestId = crypto.randomUUID();
      const bodyString = body === undefined ? "" : JSON.stringify(body);
      const signature = crypto.createHmac("sha256", process.env.IXI_MOS_INTERNAL_SECRET)
        .update(buildCanonicalRequest({ timestamp, requestId, method, targetPath,
          principalId, entityId: context.entityId, bodyString })).digest("hex");
      const response = await fetch(`http://127.0.0.1:${server.address().port}${targetPath}`, {
        method,
        headers: {
          "content-type": "application/json",
          "x-ixi-internal-signature-version": "v1",
          "x-ixi-internal-timestamp": timestamp,
          "x-ixi-internal-request-id": requestId,
          "x-ixi-internal-principal-id": principalId,
          "x-ixi-internal-entity-id": context.entityId,
          "x-ixi-internal-signature": signature,
          ...(body?.commandId ? { "idempotency-key": body.commandId } : {}),
          ...(body?.expectedRevision != null ? { "if-match": String(body.expectedRevision) } : {})
        },
        ...(body === undefined ? {} : { body: bodyString })
      });
      const result = await response.json();
      if (!response.ok) {
        const failure = result.error || result;
        throw Object.assign(new Error(failure.message || "Session request failed"), {
          status: response.status, code: failure.code, details: failure.details
        });
      }
      return result;
    }
    const transport = {
      open: request => send("POST", "/mos/v1/aos/workspace-sessions", request),
      read: request => send("GET", `/mos/v1/aos/workspace-sessions/${request.sessionId}?placementScope=personal`),
      command: request => {
        calls.push(structuredClone(request));
        return send("POST", `/mos/v1/aos/workspace-sessions/${request.sessionId}/commands`, request);
      },
      end: request => send("POST", `/mos/v1/aos/workspace-sessions/${request.sessionId}/end`, request)
    };
    const make = (overrides = {}) => createAosWorkspaceSessionController({
      transport: { ...transport, ...overrides }, createCommandId: commandId,
      onError: error => errors.push(error.code), initialSurfaces: surfaces
    });
    const first = make();
    await first.open({ workspaceId: "aos-work" });
    await first.admitObjects([A, B].map((objectId, visualOrder) => ({
      objectId, surfaceId: "board", visualOrder, operatingState: "operating"
    })));
    const second = make();
    await second.open({ workspaceId: "aos-work" });
    return { A, B, first, second, make, transport, calls, errors, context, create };
  }

  await t.test("toolbar docking and Return survive a fresh client without changing canonical Objects or Passports", async () => {
    const f = await fixture();
    const before = census();
    const origin = structuredClone(f.first.readSession().objects[f.A].sessionOrigin);
    for (const side of ["left", "right"]) {
      const surface = `rail:aos-${side}`;
      const operation = f.first.persistLayout(moveObjectToWorkspaceSurface({
        placements: f.first.readPlacements(), objectId: f.A, targetSurface: surface
      }), { objectIds: [f.A] });
      await operation.completion;
      assert.equal(f.first.readSession().objects[f.A].currentPlacement.operatingState, "preview");
    }
    const refreshed = f.make();
    await refreshed.open({ workspaceId: "aos-work" });
    assert.deepEqual(refreshed.readPlacements()["rail:aos-right"], [f.A]);
    const boarded = refreshed.persistLayout(moveObjectToWorkspaceSurface({
      placements: refreshed.readPlacements(), objectId: f.A, targetSurface: "board"
    }), { objectIds: [f.A] });
    await boarded.completion;
    const nextClient = f.make();
    await nextClient.open({ workspaceId: "aos-work" });
    await nextClient.undo(nextClient.readSession().objects[f.A].returnSnapshot.operationId);
    assert.deepEqual(nextClient.readPlacements()["rail:aos-right"], [f.A]);
    assert.equal(nextClient.readSession().objects[f.B].currentPlacement.surfaceId, "board");
    assert.deepEqual(nextClient.readSession().objects[f.A].sessionOrigin, origin);
    assert.deepEqual(census(), before);
  });

  // Execute the production page handlers, including their page-level guards and
  // Return references. Controller-only tests missed a guard that silently blocked
  // Board after Recall. These plain functions are read from the page, not copied
  // into a separate test implementation.
  const workPage = fs.readFileSync(new URL("../pages/aos/work.js", import.meta.url), "utf8");
  // Run the actual startup effect against persisted sessions. An older page's
  // unconditional pin moved a docked index during the live mixed-version audit.
  const pinMarker = workPage.indexOf("  const equipmentObjectId = aosWorkspaceAdmission.resolveObjectId(");
  const pinStart = workPage.lastIndexOf("useEffect(() => {", pinMarker) + "useEffect(() => {".length;
  const pinEnd = workPage.indexOf("\n}, [", pinMarker);
  assert.ok(pinMarker >= 0 && pinStart < pinMarker && pinEnd > pinMarker);
  const runPagePin = new Function(
    "workspaceSessionControllerRef", "aosWorkspaceAdmission", "equipmentWorkspaceIndex",
    "workspaceSessionReady", "locateWorkspaceObject", "isAosToolbarSurface",
    "pinSystemIndexToBoard", "aosWorkspaceSession", "equipmentBoardPinKeyRef", "createMosCommandId",
    workPage.slice(pinStart, pinEnd)
  );
  await t.test("real page startup preserves every parked index after refresh and still repairs invalid nesting", async () => {
    const f = await fixture(), before = census();
    let client = f.first;
    const runStartup = current => runPagePin(
      { current }, { resolveObjectId: value => value }, { objectId: f.A }, true,
      locateWorkspaceObject, isAosToolbarSurface, pinSystemIndexToBoard,
      current.readSession(), { current: "" }, commandId
    );
    for (const surface of ["rail:aos-left", "rail:aos-right", "pocketLeft", "pocketLeft2", "stackTop", "pocketRight", "pocketRight2", "stackBottom"]) {
      await client.persistLayout(moveObjectToWorkspaceSurface({
        placements: client.readPlacements(), objectId: f.A, targetSurface: surface
      }), { objectIds: [f.A] }).completion;
      client = f.make();
      await client.open({ workspaceId: "aos-work" });
      const saved = client.readSession(), commandsBeforeStartup = f.calls.length;
      runStartup(client);
      await client.whenIdle();
      assert.equal(f.calls.length, commandsBeforeStartup, `${surface}: startup must not issue a move`);
      assert.deepEqual(client.readSession(), saved);
      assert.equal(locateWorkspaceObject(client.readPlacements(), f.A).surfaceId, surface);
    }
    await client.persistLayout(moveObjectToWorkspaceSurface({
      placements: client.readPlacements(), objectId: f.A, targetSurface: `container:${f.B}`
    }), { objectIds: [f.A] }).completion;
    runStartup(client);
    await client.whenIdle();
    assert.equal(locateWorkspaceObject(client.readPlacements(), f.A).surfaceId, "board");
    assert.deepEqual(census(), before);
  });

  const commandStart = workPage.indexOf("function getDirectContainerChildIds(");
  const commandEnd = workPage.indexOf("function moveMachineToContainer(", commandStart);
  assert.ok(commandStart >= 0 && commandEnd > commandStart);
  const bindPageCommands = new Function(
    "equipmentIndex", "aosWorkspaceAdmission", "aosWorkspaceObjectRegistry",
    "aosRelationships", "aosRailProjections", "aosWorkspaceSession",
    "workspaceSessionControllerRef", "containerReturnSnapshotsRef",
    "createMosCommandId", "moveObjectToWorkspaceSurface", "getListingId",
    "getAosMembershipObjectIds", "getAosRailProjectionObjectIds",
    workPage.slice(commandStart, commandEnd) +
      "\nreturn { board: boardContainerChildren, recall: recallContainerChildren, undo: returnContainerChildren };"
  );

  await t.test("page folders repeat Board and Recall, preserve Return, and keep working after refresh", async () => {
    const f = await fixture();
    const folders = [
      { objectId: f.create("Equipment"), indexId: "equipment", children: [f.A] },
      { objectId: f.create("Workforce"), children: [f.B] },
      { objectId: f.create("Locations"), children: [f.create("Existing location")] }
    ];
    const home = folder => folder.indexId === "equipment" ? "indexEquipment" : `container:${folder.objectId}`;
    const objectsById = new Map(listObjects({ status: null }).map(object => [object.objectId, object]));
    const admission = {
      objectsById,
      resolveObjectId: value => objectsById.has(value) ? value : ""
    };
    const projections = Object.fromEntries(folders.map(folder => [folder.objectId, {
      members: folder.children.map(objectId => ({ objectId }))
    }]));
    const equipment = { ...folders[0], items: folders[0].children.map(objectId => ({ objectId })) };
    const makePage = controller => {
      const snapshots = { current: {} };
      return () => bindPageCommands(
        equipment, admission, objectsById, [], projections, controller.readSession(),
        { current: controller }, snapshots, commandId, moveObjectToWorkspaceSurface,
        item => item?.id || "", getAosMembershipObjectIds, getAosRailProjectionObjectIds
      );
    };
    await f.first.admitObjects(folders.flatMap((folder, visualOrder) => [
      { objectId: folder.objectId, surfaceId: "board", visualOrder, operatingState: "operating" },
      ...folder.children.map(objectId => ({ objectId, surfaceId: home(folder), visualOrder: 0, operatingState: "tucked" }))
    ]));
    let page = makePage(f.first);
    // Start with Recall, including existing board members. Every folder now has
    // the same saved Return state that locked the deployed user's folders.
    for (const folder of folders) await page().recall(folder);
    const before = census();
    const origins = Object.fromEntries(Object.entries(f.first.readSession().objects)
      .map(([id, record]) => [id, record.sessionOrigin]));

    for (let cycle = 0; cycle < 3; cycle += 1) {
      for (const folder of folders) {
        await page().board(folder);
        for (const id of folder.children) assert.equal(f.first.readSession().objects[id].currentPlacement.surfaceId, "board", `cycle ${cycle}: ${folder.objectId} Board`);
        await page().recall(folder);
        for (const id of folder.children) assert.equal(f.first.readSession().objects[id].currentPlacement.surfaceId, home(folder), `cycle ${cycle}: ${folder.objectId} Recall`);
      }
    }

    // A redundant Recall must retain the preceding movement's Return snapshot.
    const selected = folders[0];
    await page().recall(selected);
    await page().undo(selected);
    assert.equal(f.first.readSession().objects[f.A].currentPlacement.surfaceId, "board");
    await page().recall(selected);
    const refreshed = f.make();
    await refreshed.open({ workspaceId: "aos-work" });
    page = makePage(refreshed);
    for (const folder of folders) {
      await page().board(folder);
      await page().board(folder);
      await page().undo(folder);
      for (const id of folder.children) assert.equal(refreshed.readSession().objects[id].currentPlacement.surfaceId, home(folder), "repeated Board retains Return after refresh");
      await page().board(folder);
      await page().recall(folder);
    }
    // One existing machine can appear in Equipment and Locations. Alternating
    // those folders must keep one operating Object and honor the last command.
    folders[2].children.push(f.A);
    projections[folders[2].objectId].members.push({ objectId: f.A });
    await page().board(folders[0]);
    await page().board(folders[2]);
    assert.equal(refreshed.readPlacements().board.filter(id => id === f.A).length, 1);
    await page().recall(folders[0]);
    assert.equal(refreshed.readSession().objects[f.A].currentPlacement.surfaceId, "indexEquipment");
    await page().board(folders[2]);
    assert.equal(refreshed.readSession().objects[f.A].currentPlacement.surfaceId, "board");
    await page().recall(folders[2]);
    assert.equal(refreshed.readSession().objects[f.A].currentPlacement.surfaceId, home(folders[2]));
    assert.deepEqual(Object.fromEntries(Object.entries(refreshed.readSession().objects)
      .map(([id, record]) => [id, record.sessionOrigin])), origins);
    assert.deepEqual(census(), before);
  });

  await t.test("stale movement hydrates all authoritative placements without undoing a rejected command", async () => {
    const f = await fixture(), before = census();
    await f.second.persistLayout({ ...surfaces, board: [f.A], pocketLeft: [f.B] }, { objectIds: [f.B] }).completion;
    const operation = f.first.persistLayout({ ...surfaces, board: [f.B], indexEquipment: [f.A] }, { objectIds: [f.A] });
    await assert.rejects(operation.completion, { code: "WORKSPACE_SESSION_REVISION_CONFLICT" });
    await f.first.whenIdle();
    assert.deepEqual(f.first.readPlacements(), workspacePlacementsFromSession(f.second.readSession(), surfaces));
    assert.equal(f.calls.some(call => call.commandType === "objects.undo"), false);
    assert.equal(f.errors.includes("WORKSPACE_RETURN_SNAPSHOT_MISMATCH"), false);
    assert.deepEqual(census(), before);
  });

  await t.test("newer queued gestures survive reconciliation while unrelated remote moves stay intact", async () => {
    const f = await fixture();
    let release, entered;
    const waiting = new Promise(resolve => { release = resolve; });
    const started = new Promise(resolve => { entered = resolve; });
    let once = true;
    const client = f.make({ command: async request => {
      if (once && request.commandType === "objects.move") {
        once = false; entered(); await waiting;
      }
      return f.transport.command(request);
    }});
    await client.open({ workspaceId: "aos-work" });
    const older = client.persistLayout({ ...surfaces, board: [f.B], indexEquipment: [f.A] }, { objectIds: [f.A] });
    const rejected = assert.rejects(older.completion, { code: "WORKSPACE_SESSION_REVISION_CONFLICT" });
    await started;
    const newer = client.persistLayout({ ...surfaces, board: [f.B], pocketRight: [f.A] }, { objectIds: [f.A] });
    await f.second.persistLayout({ ...surfaces, board: [f.A], pocketLeft: [f.B] }, { objectIds: [f.B] }).completion;
    release();
    await rejected;
    await newer.completion;
    assert.deepEqual(client.readPlacements().pocketLeft, [f.B]);
    assert.deepEqual(client.readPlacements().pocketRight, [f.A]);
    assert.deepEqual(client.readPlacements().board, []);
    assert.deepEqual(client.readPlacements(), workspacePlacementsFromSession(client.readSession(), surfaces));
  });

  await t.test("two lost responses recover a committed move without fabricating compensation", async () => {
    const f = await fixture(), before = census();
    let lose = true;
    const client = f.make({ command: async request => {
      const response = await f.transport.command(request);
      if (lose && request.commandType === "objects.move") {
        throw Object.assign(new Error("response lost"), { code: "NETWORK_ERROR" });
      }
      return response;
    }});
    await client.open({ workspaceId: "aos-work" });
    await assert.rejects(client.persistLayout({ ...surfaces, board: [f.B], indexEquipment: [f.A] }, { objectIds: [f.A] }).completion, /response lost/);
    lose = false;
    assert.deepEqual(client.readPlacements().indexEquipment, [f.A]);
    const moveCalls = f.calls.filter(call => call.commandType === "objects.move");
    assert.equal(moveCalls.length, 2);
    assert.equal(moveCalls[0].commandId, moveCalls[1].commandId);
    assert.equal(f.calls.some(call => call.commandType === "objects.undo"), false);
    assert.deepEqual(census(), before);
  });

  await t.test("rejected Recall restores authoritative placement", async () => {
    const f = await fixture();
    const client = f.make({ command: request => {
      if (request.commandType === "objects.recall") {
        return Promise.reject(Object.assign(new Error("denied"), { status: 403, code: "TEST_DENIED" }));
      }
      return f.transport.command(request);
    }});
    await client.open({ workspaceId: "aos-work" });
    await client.persistLayout({ ...surfaces, board: [f.B], indexEquipment: [f.A] }, { objectIds: [f.A] }).completion;
    await assert.rejects(client.recall([f.A]), /denied/);
    assert.deepEqual(client.readPlacements().indexEquipment, [f.A]);
  });

  await t.test("a new process reads durable placement and a refreshed controller can Return", async () => {
    const f = await fixture(), before = census();
    const moved = f.first.persistLayout({ ...surfaces, board: [f.B], indexEquipment: [f.A] }, { objectIds: [f.A] });
    await moved.completion;
    const input = { sessionId: f.first.readSession().sessionId, context: f.context };
    const script = "const service=require(process.argv[1]);process.stdout.write(JSON.stringify(service.getWorkspaceSession(JSON.parse(process.argv[2]))));";
    const durable = JSON.parse(execFileSync(process.execPath, [
      "-e", script, path.join(coreRoot, "mos/workspaces/sessionPlacementService.js"), JSON.stringify(input)
    ], { env: process.env, encoding: "utf8" }));
    assert.equal(durable.objects[f.A].currentPlacement.surfaceId, "indexEquipment");
    const refreshed = f.make();
    await refreshed.open({ workspaceId: "aos-work" });
    await refreshed.undo(moved.operationId);
    assert.deepEqual(refreshed.readPlacements().board, [f.A, f.B]);
    assert.deepEqual(census(), before);
  });
});
