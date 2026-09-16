import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { mergeAosCanonicalObject } from "../lib/mos/mergeAosCanonicalObject.mjs";
import { acceptIXIAosCanonicalObject } from "../components/ixi-aos/card-runtime/IXIAosFoundationEngine.mjs";
import { canClassifyExistingAosObject } from "../lib/mos/IXIAosMemberTypes.js";
import { preserveOpenInventoryTransactions } from "../lib/listings/IXIInventorySession.mjs";

const locationPolicy = {
  schema: "aos.system-index-membership.v1", enabled: true, defaultWorkspaceHome: false,
  allowedObjectTypes: ["location"], allowedDefinitionIds: []
};

// Execute the production page handler. A command-client-only test cannot see
// whether a subsequent page state update discards the refreshed review.
const source = fs.readFileSync(new URL("../pages/aos/work.js", import.meta.url), "utf8");
const start = source.indexOf("const saveAosWorkspaceObject = useCallback(");
const end = source.indexOf("function cycleMachineFace(", start);
assert.ok(start >= 0 && end > start);
const bindSave = new Function("useCallback", "commitMosObjectCommand", "aosEntity", "mergeAosCanonicalObject",
  "loadIXIMosEnvironment", "setAosObjects", "setAosRelationships", "setAosRailProjections", "setSystemIndexes",
  "preserveOpenInventoryTransactions", "inventoryCardStateRef",
  "acceptIXIAosCanonicalObject",
  source.slice(start, end) + "\nreturn saveAosWorkspaceObject;");

test("saving index configuration preserves refreshed review, a newer revision, and an open SOLD worksheet", async () => {
  const canonical = { objectId: "root", entityId: "entity", objectType: "system-index", revision: 2,
    displayName: "Customer index", metadata: { systemIndexMembershipPolicy: locationPolicy } };
  const refreshed = { ...canonical, revision: 3, displayName: "Newer name from another session",
    membershipReview: { state: "resolved", issues: [{ objectId: "invalid-member", state: "invalid" }] },
    canonicalIdentity: { objectId: "root", passportId: "IXIEXAMPLE", entityId: "entity" } };
  const sold = { objectId: "sold-machine", entityId: "entity", displayName: "Sold machine", revision: 8 };
  let objects = [{ ...canonical, revision: 1, membershipReview: { state: "unresolved", issues: [] } }, sold];
  const save = bindSave(fn => fn, async () => ({ object: canonical }), { entityId: "entity" }, mergeAosCanonicalObject,
    async () => ({ entity: { entityId: "entity" }, objects: [refreshed], relationships: [], railProjections: {}, systemIndexes: [] }),
    update => { objects = typeof update === "function" ? update(objects) : update; }, () => {}, () => {}, () => {},
    preserveOpenInventoryTransactions, { current: { "sold-machine": { transactOpen: true } } }, acceptIXIAosCanonicalObject);
  const saved = await save({ object: objects[0], command: { objectId: "root", expectedRevision: 1, patch: { metadata: canonical.metadata } } });
  assert.deepEqual(objects[0].membershipReview, refreshed.membershipReview);
  assert.deepEqual(objects[0].canonicalIdentity, refreshed.canonicalIdentity);
  assert.equal(objects[0].revision, 3);
  assert.equal(objects[0].displayName, refreshed.displayName);
  assert.deepEqual(saved.object, objects[0]);
  assert.deepEqual(objects[1], { ...sold, inventorySessionOnly: true });
});

test("index setup cannot report success for a newer Object with missing or different membership rules", () => {
  const command = { objectId: "root", expectedRevision: 1,
    patch: { metadata: { systemIndexMembershipPolicy: locationPolicy } } };
  for (const policy of [undefined, null, { ...locationPolicy, enabled: false },
    { ...locationPolicy, defaultWorkspaceHome: true },
    { ...locationPolicy, allowedObjectTypes: ["machine"] },
    { ...locationPolicy, allowedDefinitionIds: ["another-definition"] }]) {
    assert.throws(() => acceptIXIAosCanonicalObject(command, { object: {
      objectId: "root", revision: 3, metadata: { systemIndexMembershipPolicy: policy }
    } }), { code: "IXI_AOS_MEMBERSHIP_POLICY_READBACK_MISMATCH", status: 409 });
  }
});

test("workspace refresh cannot apply a different saved membership policy before reporting a conflict", async () => {
  const canonical = { objectId: "root", entityId: "entity", revision: 2,
    metadata: { systemIndexMembershipPolicy: locationPolicy } };
  const refreshed = { ...canonical, revision: 3, metadata: { systemIndexMembershipPolicy: {
    ...locationPolicy, allowedObjectTypes: ["machine"]
  } } };
  let updates = 0;
  const update = () => { updates++; };
  const save = bindSave(fn => fn, async () => ({ object: canonical }), { entityId: "entity" }, mergeAosCanonicalObject,
    async () => ({ entity: { entityId: "entity" }, objects: [refreshed], relationships: [], railProjections: {}, systemIndexes: [] }),
    update, update, update, update, preserveOpenInventoryTransactions, { current: {} }, acceptIXIAosCanonicalObject);
  await assert.rejects(save({ object: canonical, command: {
    objectId: "root", expectedRevision: 1, patch: { metadata: canonical.metadata }
  } }), { code: "IXI_AOS_MEMBERSHIP_POLICY_READBACK_MISMATCH", status: 409 });
  assert.equal(updates, 0, "A conflicting readback must not replace any workspace state as a successful save");
});

test("equivalent membership sets and unrelated newer edits remain valid readback", () => {
  const policy = { ...locationPolicy, allowedObjectTypes: ["location", "person"], allowedDefinitionIds: ["definition-b", "definition-a"] };
  const command = { objectId: "root", expectedRevision: 1, patch: { metadata: { systemIndexMembershipPolicy: policy } } };
  const canonical = { objectId: "root", revision: 5, displayName: "Renamed in another session", metadata: {
    systemIndexMembershipPolicy: { ...policy, allowedObjectTypes: ["PERSON", "location", "person"], allowedDefinitionIds: ["definition-a", "definition-b"] }
  } };
  const before = structuredClone({ command, canonical });
  assert.equal(acceptIXIAosCanonicalObject(command, { object: canonical }).revision, 5);
  assert.deepEqual({ command, canonical }, before);
});

test("an advanced revision cannot confirm a classification that IX-Core did not persist", () => {
  const command = { objectId: "member", expectedRevision: 1, patch: { objectType: "person" } };
  assert.throws(() => acceptIXIAosCanonicalObject(command, { object: {
    objectId: "member", revision: 2, objectType: "generic", displayName: "Existing member"
  } }), { code: "IXI_AOS_CLASSIFICATION_READBACK_MISMATCH" });
});

test("legacy correction is offered for persisted ordinary Objects, not unsaved creation drafts", () => {
  const existing = { objectId: "member", entityId: "entity", objectType: "generic", passportId: "IXIABC2345" };
  assert.equal(canClassifyExistingAosObject(existing), true);
  assert.equal(canClassifyExistingAosObject({ ...existing, metadata: { draftOnly: true } }), false);
  assert.equal(canClassifyExistingAosObject({ ...existing, passportId: null }), false);
  assert.equal(canClassifyExistingAosObject({ ...existing, metadata: { rootContainer: true } }), false);
  assert.equal(canClassifyExistingAosObject({ ...existing, definitionId: "customer-definition" }), false);
  assert.equal(canClassifyExistingAosObject({ ...existing, objectType: "person" }), false);
});
