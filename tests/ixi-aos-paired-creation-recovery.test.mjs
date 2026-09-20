import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import test from "node:test";
import * as client from "../lib/mos/ixiAosCreationClient.mjs";
import { createAosDraftId, isAosDraftId } from "../lib/mos/ixiAosProvisioningContract.js";
import { getAosChildCreationContract } from "../lib/mos/IXIAosChildCreationContract.mjs";
import { createAosRailOrderKey } from "../lib/mos/IXIAosMembershipBridge.mjs";
import { getAosTemplateNumber } from "../lib/mos/ixiAosSystemObjectTemplateContract.mjs";
import { getAosHierarchyDisplayName } from "../lib/mos/ixiAosHierarchyContract.mjs";
import { moveObjectToWorkspaceSurface } from "../components/ixi-chassis/IXIWorkspacePlacementEngine.js";
import { preserveOpenInventoryTransactions } from "../lib/listings/IXIInventorySession.mjs";

const coreRoot = process.env.IXI_CORE_CONTRACT_ROOT;
test("real signed creation routes recover response loss and a refreshed workspace without duplicate identity", {
  skip: coreRoot ? false : "Run with the required paired IX-Core checkout."
}, async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "aos-create-paired-"));
  process.env.IXI_MOS_DATA_ROOT = path.join(root, "mos");
  process.env.IXI_MOS_STORAGE_PROVIDER = "sqlite";
  process.env.IXI_PASSPORT_DATA_FILE = path.join(root, "passports.json");
  process.env.IXI_MOS_INTERNAL_SECRET = "isolated-creation-paired-secret";
  process.env.IXI_MOS_INTERNAL_AUTH_ENFORCE = "true";
  process.env.AWS_EC2_METADATA_DISABLED = "true";
  const require = createRequire(path.join(coreRoot, "package.json"));
  require("./authority/IXIAuthorityDynamoStore.js").getCurrentPolicyRecord = async () => null;
  require("./authority/IXIAuthorityDynamoStore.js").getCurrentPolicyRecords = async ids => ids.map(() => null);
  const { ensureAosAccount } = require("./mos/accounts/aosAccountService.js");
  const { provisionAosObject } = require("./mos/provisioning/aosObjectProvisioningService.js");
  const { listObjects, getObject } = require("./mos/objects/objectService.js");
  const { listRelationships } = require("./mos/relationships/relationshipService.js");
  const { getMosSqliteStore } = require("./mos/storage/sqliteStore.js");
  const { readPassportRecords } = require("./passport/passportRegistry.js");
  const { buildCanonicalRequest } = require("./mos/security/internalRequestAuthService.js");
  const owner = ensureAosAccount({ ownerUserId: "creation-owner", displayName: "Owner Entity" });
  const other = ensureAosAccount({ ownerUserId: "creation-other", displayName: "Other Entity" });
  const parentReceipt = provisionAosObject({ commandId: "workforce-root", entityId: owner.entity.entityId,
    objectType: "system-index", displayName: "Customer workforce", actorId: "creation-owner",
    metadata: { systemIndexMembershipPolicy: { schema: "aos.system-index-membership.v1", enabled: true,
      defaultWorkspaceHome: false, allowedObjectTypes: ["person"], allowedDefinitionIds: [] } } });
  const parent = { ...parentReceipt.object, passportId: parentReceipt.passport.passportId };
  const express = require("express");
  const app = express();
  app.use(express.json());
  app.use("/mos/v1", require("./mos/routes/mosRouter.js").mosRouter);
  const server = await new Promise(resolve => { const listening = app.listen(0, "127.0.0.1", () => resolve(listening)); });
  const originalFetch = globalThis.fetch;
  t.after(async () => {
    globalThis.fetch = originalFetch;
    await new Promise(resolve => server.close(resolve));
    getMosSqliteStore().close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  let principalId = "creation-owner", entityId = owner.entity.entityId, loseResponse = false;
  globalThis.fetch = async (url, options = {}) => {
    const targetPath = `/mos/v1${String(url).replace(/^\/api\/aos\/mos/, "")}`;
    const timestamp = String(Date.now()), requestId = crypto.randomUUID(), method = options.method || "GET";
    const signature = crypto.createHmac("sha256", process.env.IXI_MOS_INTERNAL_SECRET).update(buildCanonicalRequest({
      timestamp, requestId, method, targetPath, principalId, entityId, bodyString: options.body || ""
    })).digest("hex");
    const response = await originalFetch(`http://127.0.0.1:${server.address().port}${targetPath}`, { ...options,
      headers: { ...options.headers, "x-ixi-internal-signature-version": "v1", "x-ixi-internal-timestamp": timestamp,
        "x-ixi-internal-request-id": requestId, "x-ixi-internal-principal-id": principalId,
        "x-ixi-internal-entity-id": entityId, "x-ixi-internal-signature": signature } });
    if (targetPath.endsWith("/objects/create") && response.ok && loseResponse) {
      loseResponse = false; await response.arrayBuffer(); throw new Error("Response lost after complete save");
    }
    return response;
  };
  const census = () => ({ objects: listObjects({ status: null }).map(object => [object.objectId, object.identities]),
    passports: readPassportRecords(), relationships: listRelationships({ entityId: owner.entity.entityId }) });
  const input = { entityId, draftId: "aos-draft:lost-response", objectType: "person", displayName: "Colleague",
    membership: { parentObjectId: parent.objectId, parentPassportId: parent.passportId } };
  loseResponse = true;
  await assert.rejects(client.createAndAttachAosObject(input), { code: "AOS_CREATION_NETWORK_UNCONFIRMED" });
  const afterSave = census();
  const pending = await client.listAosCreationCommands();
  assert.equal(pending.commands.length, 1);
  const saved = await client.resumeAosCreation(pending.commands[0].commandId, entityId);
  assert.deepEqual(census(), afterSave);
  assert.equal(saved.object.objectType, "person");
  await client.acknowledgeAosCreation(saved.commandId);
  const interruptedInput = { ...input, commandId: "manual:aos-draft:before-passport", draftId: "aos-draft:before-passport" };
  const interrupted = spawnSync(process.execPath, ["-e", `
    require('./mos/provisioning/aosObjectPassportService').ensurePassportForAosObject = () => { throw new Error('Passport storage interrupted'); };
    require('./mos/provisioning/aosCreationCommandService').createAndAttachAosObject(${JSON.stringify(interruptedInput)}, {
      principal: { entityId: ${JSON.stringify(entityId)}, principalId: 'creation-owner' }, authorize: async () => {}
    }).then(() => process.exit(1)).catch(() => process.exit(75));
  `], { cwd: coreRoot, env: process.env, encoding: "utf8" });
  assert.equal(interrupted.status, 75, interrupted.stderr);
  const partial = (await client.listAosCreationCommands()).commands.find(item => item.commandId === interruptedInput.commandId);
  assert.ok(partial?.objectId, "Creator must be able to find a birth interrupted before Passport creation");
  const beforeIdentityRecovery = listObjects({ status: null }).map(object => object.objectId);
  const completedBirth = await client.resumeAosCreation(partial.commandId, entityId);
  assert.equal(completedBirth.object.objectId, partial.objectId);
  assert.equal(completedBirth.object.metadata.transactEligible, true);
  assert.deepEqual(listObjects({ status: null }).map(object => object.objectId), beforeIdentityRecovery);
  await client.acknowledgeAosCreation(partial.commandId);
  const beforeDenied = census();
  principalId = "creation-other"; entityId = other.entity.entityId;
  assert.deepEqual((await client.listAosCreationCommands()).commands, []);
  await assert.rejects(client.resumeAosCreation(saved.commandId, entityId), error => [403, 404].includes(error.status));
  await assert.rejects(client.createAndAttachAosObject({ ...input, entityId, draftId: "aos-draft:foreign" }), error => [403, 404, 409].includes(error.status));
  assert.deepEqual(census(), beforeDenied);
  principalId = "creation-owner"; entityId = owner.entity.entityId;

  // Execute the production creation hook with controlled React state storage.
  // Backend auth, provisioning, SQLite, Passport, membership and environment
  // readback remain real. Only the workspace-layout failure is injected here.
  const source = fs.readFileSync(new URL("../components/ixi-mos/object-creation/useIXIMosObjectCreation.js", import.meta.url), "utf8")
    .replace(/^import[\s\S]*?from\s+["'][^"']+["'];\s*/gm, "")
    .replace("export default function", "function");
  const environment = async () => {
    const response = await globalThis.fetch("/api/aos/mos/aos/environment", { method: "POST",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ownerUserId: principalId }) });
    const payload = await response.json();
    assert.equal(response.status, 200, JSON.stringify(payload));
    return payload.environment;
  };
  const dependencies = { useRef: value => ({ current: value }), useState: value => [value, () => {}],
    useEffect: () => {}, useCallback: fn => fn, ...client, createAosDraftId, isAosDraftId,
    getAosChildCreationContract, createAosRailOrderKey, getAosTemplateNumber, getAosHierarchyDisplayName,
    moveObjectToWorkspaceSurface, preserveOpenInventoryTransactions, loadIXIMosEnvironment: environment,
    updateMosObject: () => { throw new Error("Unexpected Object update"); },
    deleteMosObject: () => { throw new Error("Unexpected Object deletion"); } };
  const useCreation = new Function(...Object.keys(dependencies), `${source}\nreturn useIXIMosObjectCreation;`)(...Object.values(dependencies));
  let placements = { board: [] }, displayed = [], refuseLayout = true;
  const makeHook = () => useCreation({ entityId, userId: principalId, workspacePlacements: placements,
    setWorkspacePlacements: next => { placements = next; },
    setAosObjects: update => { displayed = typeof update === "function" ? update(displayed) : update; },
    setSystemIndexes: () => {}, saveWorkspaceLayout: async () => { if (refuseLayout) throw new Error("Layout unavailable"); } });
  const hook = makeHook();
  const draft = hook.createChildContainerDraft({ container: parent,
    template: { templateSlug: "universal-object-007", templateNumber: 7, definitionId: "presentation-must-not-decide" } });
  const draftObject = draft.object || draft;
  assert.equal(draftObject.objectType, "person");
  assert.equal(draftObject.definitionId, null);
  const id = draftObject.objectId;
  await assert.rejects(hook.saveMosObjectName({ objectId: id, displayName: "Interrupted colleague", objectType: "person" }), /Layout unavailable/);
  const beforeRecovery = census();
  const retained = (await client.listAosCreationCommands()).commands.find(item => item.draftId === id);
  assert.ok(retained?.objectId);
  refuseLayout = false;
  const reloadedHook = makeHook();
  const recovered = await reloadedHook.finishPendingCreation(retained.commandId);
  assert.equal(recovered.object.objectId, retained.objectId);
  assert.equal(getObject(retained.objectId).objectType, "person");
  assert.deepEqual(census(), beforeRecovery);
  assert.ok(placements.board.includes(retained.objectId));
  assert.ok(displayed.some(object => object.objectId === retained.objectId));
  assert.equal(displayed.some(object => object.objectId === id), false);
  assert.deepEqual((await client.listAosCreationCommands()).commands, []);
});
