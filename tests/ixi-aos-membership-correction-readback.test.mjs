import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { mergeAosCanonicalObject } from "../lib/mos/mergeAosCanonicalObject.mjs";
import { acceptIXIAosCanonicalObject } from "../components/ixi-aos/card-runtime/IXIAosFoundationEngine.mjs";
import { canClassifyExistingAosObject } from "../lib/mos/IXIAosMemberTypes.js";

// Execute the production page handler. A command-client-only test cannot see
// whether a subsequent page state update discards the refreshed review.
const source = fs.readFileSync(new URL("../pages/aos/work.js", import.meta.url), "utf8");
const start = source.indexOf("const saveAosWorkspaceObject = useCallback(");
const end = source.indexOf("function cycleMachineFace(", start);
assert.ok(start >= 0 && end > start);
const bindSave = new Function("useCallback", "commitMosObjectCommand", "aosEntity", "mergeAosCanonicalObject",
  "loadIXIMosEnvironment", "setAosObjects", "setAosRelationships", "setAosRailProjections", "setSystemIndexes",
  source.slice(start, end) + "\nreturn saveAosWorkspaceObject;");

test("saving index configuration preserves its refreshed review and a newer canonical revision", async () => {
  const canonical = { objectId: "root", entityId: "entity", objectType: "system-index", revision: 2,
    displayName: "Customer index", metadata: { systemIndexMembershipPolicy: { enabled: true } } };
  const refreshed = { ...canonical, revision: 3, displayName: "Newer name from another session",
    membershipReview: { state: "resolved", issues: [{ objectId: "invalid-member", state: "invalid" }] },
    canonicalIdentity: { objectId: "root", passportId: "IXIEXAMPLE", entityId: "entity" } };
  let objects = [{ ...canonical, revision: 1, membershipReview: { state: "unresolved", issues: [] } }];
  const save = bindSave(fn => fn, async () => ({ object: canonical }), { entityId: "entity" }, mergeAosCanonicalObject,
    async () => ({ entity: { entityId: "entity" }, objects: [refreshed], relationships: [], railProjections: {}, systemIndexes: [] }),
    update => { objects = typeof update === "function" ? update(objects) : update; }, () => {}, () => {}, () => {});
  const saved = await save({ object: objects[0], command: { patch: { metadata: canonical.metadata } } });
  assert.deepEqual(objects[0].membershipReview, refreshed.membershipReview);
  assert.deepEqual(objects[0].canonicalIdentity, refreshed.canonicalIdentity);
  assert.equal(objects[0].revision, 3);
  assert.equal(objects[0].displayName, refreshed.displayName);
  assert.deepEqual(saved.object, objects[0]);
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
