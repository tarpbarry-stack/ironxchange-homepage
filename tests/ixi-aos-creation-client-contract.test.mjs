import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { assertCompleteAosCreation } from "../lib/mos/ixiAosCreationClient.mjs";
import { getAosChildCreationContract, assertAosDraftCreationReady } from "../lib/mos/IXIAosChildCreationContract.mjs";
import * as foundation from "../components/ixi-aos/card-runtime/IXIAosFoundationEngine.mjs";

const policy = { schema: "aos.system-index-membership.v1", enabled: true, defaultWorkspaceHome: false,
  allowedObjectTypes: ["person"], allowedDefinitionIds: [] };
const parent = { objectType: "system-index", metadata: { systemIndexMembershipPolicy: policy } };
const object = { objectId: "saved-object", entityId: "entity", objectType: "person", revision: 2,
  passportId: "IXIABC2345", identities: [{ identityType: "ixi-passport", passportId: "IXIABC2345" }], metadata: {} };
const receipt = () => ({ ok: true, object, passport: { passportId: object.passportId },
  identity: { objectId: object.objectId, passportId: object.passportId },
  transact: { eligible: true, objectId: object.objectId, passportId: object.passportId },
  creation: { schema: "aos.create-and-attach.v1", state: "complete", commandId: "manual:aos-draft:test",
    draftId: "aos-draft:test", membership: { parentObjectId: "parent", parentPassportId: "IXIPARENT1" },
    relationship: { relationshipId: "edge", entityId: "entity", behaviorId: "aos.rail-membership.v1", status: "active",
      sourceObjectId: object.objectId, targetObjectId: "parent" } } });

test("parent membership supplies child choices without drawing business meaning from appearance", () => {
  assert.equal(getAosChildCreationContract(parent).objectType, "person");
  const multiple = getAosChildCreationContract({ ...parent, metadata: { systemIndexMembershipPolicy: {
    ...policy, allowedObjectTypes: ["person", "location"] } } });
  assert.equal(multiple.objectType, "generic");
  assert.throws(() => assertAosDraftCreationReady({ objectId: "aos-draft:test", objectType: "generic",
    metadata: { draftOnly: true, creationMembershipContract: multiple } }));
  for (const cardTemplateSlug of ["universal-object-007", "ixi-system-index-v1"]) {
    assert.equal(getAosChildCreationContract({ objectType: "container", cardTemplateSlug }).isIndex, false);
  }
  assert.throws(() => getAosChildCreationContract({ objectType: "system-index" }),
    { code: "AOS_CREATION_PARENT_CONFIGURATION_REQUIRED" });
});

test("a creation receipt binds the selected classification, intended parent and original save request", () => {
  const value = receipt();
  const expected = { entityId: "entity", objectType: "person", membership: value.creation.membership,
    commandId: value.creation.commandId, draftId: value.creation.draftId };
  assert.equal(assertCompleteAosCreation(value, expected).object.objectId, object.objectId);
  assert.throws(() => assertCompleteAosCreation({ ...value, object: { ...object, objectType: "generic" } }, expected),
    { code: "AOS_CREATION_CLASSIFICATION_MISMATCH" });
  assert.throws(() => assertCompleteAosCreation({ ...value, creation: { ...value.creation, draftId: "aos-draft:other" } }, expected),
    { code: "AOS_CREATION_COMMAND_MISMATCH" });
  assert.throws(() => assertCompleteAosCreation({ ...value, creation: { ...value.creation,
    relationship: { ...value.creation.relationship, targetObjectId: "wrong-parent" } } }, expected),
    { code: "AOS_CREATION_ATTACHMENT_UNCONFIRMED" });
});

test("the production editor accepts a verified draft-to-permanent transition and still rejects an unrelated Object", async () => {
  const source = fs.readFileSync(new URL("../components/ixi-aos/card-runtime/modules/useIXIAosObjectEditSession.js", import.meta.url), "utf8")
    .replace(/^import[\s\S]*?from\s+["'][^"']+["'];\s*/gm, "")
    .replace("export default function", "function");
  const dependencies = { ...Object.fromEntries(Object.entries(foundation).filter(([key]) => key !== "default")), assertCompleteAosCreation,
    useRef: value => ({ current: value }), useState: value => [typeof value === "function" ? value() : value, () => {}],
    useCallback: fn => fn, useEffect: () => {}, commitMosObjectCommand: () => { throw new Error("Unexpected update command"); },
    fetchMosObject: () => { throw new Error("Unexpected reload"); } };
  const useEditor = new Function(...Object.keys(dependencies), `${source}\nreturn useIXIAosObjectEditSession;`)(...Object.values(dependencies));
  const draft = { objectId: "aos-draft:test", entityId: "entity", objectType: "person", displayName: "Colleague",
    metadata: { draftOnly: true }, fields: {} };
  const editor = useEditor({ object: draft, persistenceAdapter: async () => receipt() });
  const saved = await editor.save(draft);
  assert.equal(saved.objectId, "saved-object");
  const unrelated = useEditor({ object: draft, persistenceAdapter: async () => ({ ...receipt(),
    creation: { ...receipt().creation, draftId: "aos-draft:other" } }) });
  await assert.rejects(unrelated.save(draft), { code: "AOS_CREATION_DRAFT_MISMATCH" });
});
