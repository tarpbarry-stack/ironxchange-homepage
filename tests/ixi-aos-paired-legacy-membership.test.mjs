import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { buildAosCanonicalAdmission, normalizeIxCoreAdmissionEnvelope } from "../lib/mos/ixiAosCanonicalAdmission.mjs";
import { getAosMembershipObjectIds, getAosRailProjectionObjectIds } from "../lib/mos/IXIAosMembershipBridge.mjs";

const coreRoot = process.env.IXI_CORE_CONTRACT_ROOT;
const repo = fileURLToPath(new URL("../", import.meta.url));

// Compile the real registry and its local dependencies. React and all membership,
// identity and presentation code remain real; no registry results are mocked.
function loadRegistry() {
  const require = createRequire(import.meta.url);
  const { transformSync } = require("next/dist/build/swc");
  const modules = new Map();
  function load(full) {
    if (modules.has(full)) return modules.get(full).exports;
    const module = { exports: {} };
    modules.set(full, module);
    const compiled = transformSync(fs.readFileSync(full, "utf8"), {
      filename: full, jsc: { parser: { syntax: "ecmascript" }, target: "es2022" },
      module: { type: "commonjs" }
    });
    const sourceRequire = createRequire(full);
    new Function("require", "module", "exports", compiled.code)(name => {
      if (name.startsWith(".")) {
        const target = path.resolve(path.dirname(full), name);
        const resolved = ["", ".js", ".mjs"].map(ext => target + ext)
          .find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
        if (resolved) return load(resolved);
      }
      return sourceRequire(name);
    }, module, module.exports);
    return module.exports;
  }
  return load(path.join(repo, "components/ixi-mos/workspace/useIXIAosWorkspaceRegistry.js")).default;
}

test("signed bootstrap, rendered previews and BOARD selection agree on persisted legacy membership", {
  skip: coreRoot ? false : "Run the required paired gate with IXI_CORE_CONTRACT_ROOT."
}, async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ixi-legacy-membership-"));
  process.env.IXI_MOS_DATA_ROOT = path.join(root, "mos");
  process.env.IXI_MOS_SQLITE_PATH = path.join(root, "mos", "aos.sqlite");
  process.env.IXI_MOS_STORAGE_PROVIDER = "sqlite";
  process.env.IXI_PASSPORT_DATA_FILE = path.join(root, "passports.json");
  process.env.AWS_EC2_METADATA_DISABLED = "true";
  process.env.IXI_MOS_INTERNAL_SECRET = "isolated-legacy-membership-secret";
  process.env.IXI_MOS_INTERNAL_AUTH_ENFORCE = "true";
  const require = createRequire(import.meta.url);
  const coreRequire = createRequire(path.join(path.resolve(coreRoot), "package.json"));
  // Only external authority persistence is replaced. Signed authentication,
  // account membership, bootstrap, canonical admission and SQLite are real.
  coreRequire("./authority/IXIAuthorityDynamoStore.js").getCurrentPolicyRecord = async () => null;
  const { ensureAosAccount } = coreRequire("./mos/accounts/aosAccountService.js");
  const { provisionAosObject } = coreRequire("./mos/provisioning/aosObjectProvisioningService.js");
  const { listObjects } = coreRequire("./mos/objects/objectService.js");
  const { createObjectRelationship, endObjectRelationship, listRelationships } = coreRequire("./mos/relationships/relationshipService.js");
  const { updateJsonFile } = coreRequire("./mos/storage/jsonStore.js");
  const { MOS_PATHS } = coreRequire("./mos/storage/mosPaths.js");
  const { readPassportRecords } = coreRequire("./passport/passportRegistry.js");
  const { getMosSqliteStore } = coreRequire("./mos/storage/sqliteStore.js");
  const { buildCanonicalRequest } = coreRequire("./mos/security/internalRequestAuthService.js");
  const principalId = "legacy-membership-owner";
  const { entity } = ensureAosAccount({ ownerUserId: principalId, displayName: "Isolated membership audit" });
  const express = coreRequire("express");
  const app = express();
  app.use(express.json());
  app.use("/mos/v1", coreRequire("./mos/routes/mosRouter.js").mosRouter);
  const server = await new Promise(resolve => { const listening = app.listen(0, "127.0.0.1", () => resolve(listening)); });
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    getMosSqliteStore().close();
    fs.rmSync(root, { recursive: true, force: true });
  });
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const useRegistry = loadRegistry();
  const page = fs.readFileSync(path.join(repo, "pages/aos/work.js"), "utf8");
  const start = page.indexOf("function getDirectContainerChildIds(");
  const end = page.indexOf("/* ---------- UNIVERSAL AOS SESSION BOARD", start);
  assert.ok(start >= 0 && end > start);
  const bindChildren = new Function("aosRelationships", "aosRailProjections", "aosWorkspaceAdmission",
    "aosWorkspaceObjectRegistry", "getAosMembershipObjectIds", "getAosRailProjectionObjectIds",
    page.slice(start, end) + "\nreturn getDirectContainerChildIds;");
  async function bootstrap() {
    const method = "GET", targetPath = "/mos/v1/aos/work-bootstrap";
    const timestamp = String(Date.now()), requestId = crypto.randomUUID();
    const signature = crypto.createHmac("sha256", process.env.IXI_MOS_INTERNAL_SECRET)
      .update(buildCanonicalRequest({ timestamp, requestId, method, targetPath,
        principalId, entityId: entity.entityId, bodyString: "" })).digest("hex");
    const response = await fetch(`http://127.0.0.1:${server.address().port}${targetPath}`, { headers: {
      "x-ixi-internal-signature-version": "v1", "x-ixi-internal-timestamp": timestamp,
      "x-ixi-internal-request-id": requestId, "x-ixi-internal-principal-id": principalId,
      "x-ixi-internal-entity-id": entity.entityId, "x-ixi-internal-signature": signature
    } });
    const body = await response.json();
    assert.equal(response.status, 200, JSON.stringify(body));
    return body;
  }
  const census = () => ({ objects: listObjects({ status: null }), passports: readPassportRecords(),
    relationships: listRelationships({ status: null }) });
  const cases = [
    { name: "corroborated legacy alone remains visible", expected: true },
    { name: "governed membership in another container suppresses the stale preview", governed: "other", expected: false },
    { name: "legacy and governed membership in the same container deduplicate", governed: "same", expected: true },
    { name: "two governed containers retain the same Object and Passport", governed: "both", expected: true },
    { name: "ended legacy membership stays absent", endLegacy: true, expected: false },
    { name: "ended governed membership does not suppress valid legacy evidence", governed: "other", endGoverned: true, expected: true },
    { name: "a Locations policy never admits a direct machine", locationIndex: true, expected: false }
  ];
  for (const [i, scenario] of cases.entries()) await t.test(scenario.name, async () => {
    const create = (key, objectType = "location", metadata = {}) => provisionAosObject({
      commandId: `legacy-case-${i}-${key}`, entityId: entity.entityId, objectType,
      displayName: "Repeated customer label", actorId: principalId,
      cardTemplateSlug: "universal-object-007", metadata
    }).object;
    const policy = { schema: "aos.system-index-membership.v1", enabled: true,
      defaultWorkspaceHome: false, allowedObjectTypes: ["location"], allowedDefinitionIds: [] };
    const a = create("a", scenario.locationIndex ? "system-index" : "location",
      scenario.locationIndex ? { systemIndexMembershipPolicy: policy } : {});
    const b = create("b");
    const machine = create("member", "machine");
    // Seed only historical direct-container state in this isolated database.
    updateJsonFile(MOS_PATHS.objects, {}, objects => {
      objects[machine.objectId] = { ...objects[machine.objectId], directContainerId: a.objectId };
      return objects;
    });
    const legacy = createObjectRelationship({ sourceObjectId: machine.objectId, targetObjectId: a.objectId,
      relationshipLabel: "Customer legacy link", actorId: principalId }).relationship;
    const endEdge = edge => endObjectRelationship({ relationshipId: edge.relationshipId,
      expectedRevision: edge.revision, actorId: principalId, commandId: `end-${edge.relationshipId}` });
    if (scenario.endLegacy) endEdge(legacy);
    if (scenario.governed) {
      const governed = createObjectRelationship({ sourceObjectId: machine.objectId,
        targetObjectId: scenario.governed === "other" ? b.objectId : a.objectId,
        behaviorId: "aos.rail-membership.v1", actorId: principalId,
        commandId: `governed-${i}` }).relationship;
      if (scenario.endGoverned) endEdge(governed);
      if (scenario.governed === "both") createObjectRelationship({ sourceObjectId: machine.objectId,
        targetObjectId: b.objectId, behaviorId: "aos.rail-membership.v1", actorId: principalId,
        commandId: `governed-second-${i}` });
    }
    const before = census();
    // A second bootstrap exercises the persisted refresh path as well.
    for (let refresh = 0; refresh < 2; refresh++) {
      const { environment, admissions } = await bootstrap();
      const objects = admissions.map(response => normalizeIxCoreAdmissionEnvelope({ response,
        requestedObject: response.object, expectedEntityId: entity.entityId }));
      const admission = buildAosCanonicalAdmission({ aosObjects: objects });
      const relationships = refresh ? [...environment.relationships].reverse() : environment.relationships;
      let registry;
      function Probe() {
        registry = useRegistry({ canonicalAdmission: admission, aosObjects: objects,
          relationships, railProjections: environment.railProjections });
        return null;
      }
      renderToStaticMarkup(React.createElement(Probe));
      const children = bindChildren(relationships, environment.railProjections, admission,
        registry.objectRegistry, getAosMembershipObjectIds, getAosRailProjectionObjectIds);
      const expected = scenario.expected ? [machine.objectId] : [];
      assert.deepEqual((environment.railProjections[a.objectId]?.members || []).map(x => x.objectId), expected);
      assert.deepEqual(registry.objectRegistry.get(a.objectId)?.itemObjectIds, expected, "Preview must match IX-Core membership");
      assert.deepEqual(children(a), expected, "BOARD must select the same canonical children");
      if (["other", "both"].includes(scenario.governed) && !scenario.endGoverned) {
        assert.deepEqual(registry.objectRegistry.get(b.objectId).itemObjectIds, [machine.objectId]);
        assert.deepEqual(children(b), [machine.objectId]);
        assert.equal(registry.objectRegistry.get(b.objectId).items[0].passportId,
          admission.objectsById.get(machine.objectId).passportId);
      }
      if (scenario.expected) assert.equal(registry.objectRegistry.get(a.objectId).items[0].passportId,
        admission.objectsById.get(machine.objectId).passportId);
      assert.deepEqual(census(), before, "Read, render and refresh cannot change Objects, Passports or durable edges");
    }
  });
});
