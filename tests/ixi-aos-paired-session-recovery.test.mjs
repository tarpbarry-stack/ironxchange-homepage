import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import {
  createAosWorkspaceSessionController,
  workspacePlacementsFromSession
} from "../components/ixi-mos/workspace/IXIAosWorkspaceSessionController.mjs";

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
    return { A, B, first, second, make, transport, calls, errors, context };
  }

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
