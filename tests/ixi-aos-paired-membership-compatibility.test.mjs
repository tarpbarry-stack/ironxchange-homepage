import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import test from "node:test";
import { createIXIAosEditSession, createIXIAosObjectUpdateCommand, acceptIXIAosCanonicalObject } from "../components/ixi-aos/card-runtime/IXIAosFoundationEngine.mjs";
import { commitMosObjectCommand, fetchMosObject } from "../lib/mos/ixiMosBrowserGatewayClient.js";
import { assertAosObjectMutationRequest } from "../lib/server/aos/ixiAosObjectMutationPolicy.mjs";

const coreRoot = process.env.IXI_CORE_CONTRACT_ROOT;
test("paired classification survives response loss, reads persisted state, and rejects another Entity", {
  skip: coreRoot ? false : "Run the required paired gate with IXI_CORE_CONTRACT_ROOT."
}, async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ixi-classification-paired-"));
  process.env.IXI_MOS_DATA_ROOT = path.join(root, "mos");
  process.env.IXI_MOS_SQLITE_PATH = path.join(root, "mos", "aos.sqlite");
  process.env.IXI_MOS_STORAGE_PROVIDER = "sqlite";
  process.env.IXI_PASSPORT_DATA_FILE = path.join(root, "passports.json");
  process.env.AWS_EC2_METADATA_DISABLED = "true";
  process.env.IXI_MOS_INTERNAL_SECRET = "isolated-classification-test-secret";
  process.env.IXI_MOS_INTERNAL_AUTH_ENFORCE = "true";
  const require = createRequire(path.join(path.resolve(coreRoot), "package.json"));
  const { ensureAosAccount } = require("./mos/accounts/aosAccountService.js");
  const { provisionAosObject } = require("./mos/provisioning/aosObjectProvisioningService.js");
  const { listObjects, getObject } = require("./mos/objects/objectService.js");
  const { readPassportRecords } = require("./passport/passportRegistry.js");
  const { getMosSqliteStore } = require("./mos/storage/sqliteStore.js");
  const { buildCanonicalRequest } = require("./mos/security/internalRequestAuthService.js");
  // External authority persistence is stubbed; signed auth, Entity membership,
  // the Object route, idempotency, SQLite writes, and GET readback are real.
  require("./authority/IXIAuthorityDynamoStore.js").getCurrentPolicyRecord = async () => null;
  const owner = ensureAosAccount({ ownerUserId: "classification-owner", displayName: "Owner Entity" });
  const other = ensureAosAccount({ ownerUserId: "classification-other", displayName: "Other Entity" });
  const member = provisionAosObject({ commandId: "existing-generic-member", entityId: owner.entity.entityId,
    objectType: "generic", displayName: "Customer chosen name", actorId: "classification-owner" }).object;
  const census = () => ({ identities: listObjects({ status: null }).map(object => [object.objectId, object.identities]),
    passports: readPassportRecords() });
  const before = census();
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
  let principalId = "classification-owner", entityId = owner.entity.entityId, loseResponse = true;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    const relativePath = String(url).replace(/^\/api\/aos\/mos/, "");
    const method = options.method || "GET";
    const body = options.body ? JSON.parse(options.body) : undefined;
    const normalizedHeaders = Object.fromEntries(Object.entries(options.headers || {}).map(([key, value]) => [key.toLowerCase(), value]));
    assertAosObjectMutationRequest({ method, path: relativePath, body, headers: normalizedHeaders });
    const targetPath = `/mos/v1${relativePath}`, timestamp = String(Date.now()), requestId = crypto.randomUUID();
    const signature = crypto.createHmac("sha256", process.env.IXI_MOS_INTERNAL_SECRET)
      .update(buildCanonicalRequest({ timestamp, requestId, method, targetPath, principalId, entityId,
        bodyString: options.body || "" })).digest("hex");
    const response = await originalFetch(`http://127.0.0.1:${server.address().port}${targetPath}`, {
      ...options, headers: { ...options.headers,
        "x-ixi-internal-signature-version": "v1", "x-ixi-internal-timestamp": timestamp,
        "x-ixi-internal-request-id": requestId, "x-ixi-internal-principal-id": principalId,
        "x-ixi-internal-entity-id": entityId, "x-ixi-internal-signature": signature,
        ...(body?.expectedRevision != null ? { "if-match": String(body.expectedRevision) } : {}) }
    });
    calls.push({ method, status: response.status, body });
    if (method === "PATCH" && response.ok && loseResponse) {
      loseResponse = false;
      await response.arrayBuffer();
      throw new Error("Controlled loss after durable save");
    }
    return response;
  };
  const session = createIXIAosEditSession(member);
  const command = createIXIAosObjectUpdateCommand({ session, draft: { ...session.draft, objectType: "person" },
    commandId: "classify-once" });
  await assert.rejects(commitMosObjectCommand(command), { code: "MOS_GATEWAY_NETWORK_ERROR" });
  assert.equal(getObject(member.objectId).objectType, "person");
  const saved = await commitMosObjectCommand(command);
  const canonical = acceptIXIAosCanonicalObject(command, saved);
  assert.equal(canonical.objectType, "person");
  assert.equal(canonical.revision, member.revision + 1);
  assert.equal(saved.replayed, true);
  assert.deepEqual(calls.map(call => [call.method, call.status]), [["PATCH", 200], ["PATCH", 200], ["GET", 200]]);
  assert.deepEqual(census(), before);
  const persistedBeforeDeniedRequest = getObject(member.objectId);
  principalId = "classification-other";
  entityId = other.entity.entityId;
  const forbiddenSession = createIXIAosEditSession(canonical);
  const forbidden = createIXIAosObjectUpdateCommand({ session: forbiddenSession,
    draft: { ...forbiddenSession.draft, displayName: "Unauthorized edit" }, commandId: "foreign-edit" });
  await assert.rejects(commitMosObjectCommand(forbidden), error => [403, 404].includes(error.status));
  await assert.rejects(fetchMosObject(member.objectId), error => [403, 404].includes(error.status));
  assert.deepEqual(getObject(member.objectId), persistedBeforeDeniedRequest);
});
