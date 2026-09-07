import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { resolveIXIAosOperatingCardNumber } from "../components/ixi-aos/card-runtime/IXIAosOperatingCardResolver.mjs";
import { acceptIXIAosCanonicalObject } from "../components/ixi-aos/card-runtime/IXIAosFoundationEngine.mjs";
import { assertAosObjectMutationRequest } from "../lib/server/aos/ixiAosObjectMutationPolicy.mjs";
import { mergeAosCanonicalObject } from "../lib/mos/mergeAosCanonicalObject.mjs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function validMutation(overrides = {}) {
  return {
    method: "PATCH",
    path: "/objects/object-42",
    headers: {
      "idempotency-key": "aos-save-42",
      "x-ixi-expected-revision": "0"
    },
    body: {
      actorId: "ignored-in-browser",
      businessIdentifiers: [{ label: "ID", value: "UNIT 42" }],
      commandId: "aos-save-42",
      definitionVersion: "12",
      displayName: "2024 CATERPILLAR 336",
      expectedRevision: 0,
      fields: { businessIdentifier: "UNIT 42", hours: 125 },
      media: [],
      metadata: {
        aosCommand: {
          contractVersion: "ixi-aos-object-command-v1",
          commandId: "aos-save-42",
          definitionVersion: "12",
          expectedRevision: 0
        },
        fieldDefinitions: [
          { fieldId: "businessIdentifier", label: "ID", fieldType: "text" },
          { fieldId: "hours", label: "HOURS", fieldType: "number" }
        ]
      }
    },
    ...overrides
  };
}

test("operating runtime resolves every numbered template without a second editor system", () => {
  assert.equal(resolveIXIAosOperatingCardNumber({ cardTemplateSlug: "location-standard" }), 1);
  assert.equal(resolveIXIAosOperatingCardNumber({ cardTemplateSlug: "location-standard-003" }), 3);
  assert.equal(resolveIXIAosOperatingCardNumber({ cardTemplateSlug: "aos-card-009b" }), 9);
  assert.equal(resolveIXIAosOperatingCardNumber({ metadata: { cardNumber: 16 } }), 16);
  assert.equal(resolveIXIAosOperatingCardNumber({ capabilities: { canContain: true } }), 17);
  assert.equal(resolveIXIAosOperatingCardNumber({}), 7);
});

test("server accepts a complete idempotent revision-protected mutation", () => {
  assert.deepEqual(assertAosObjectMutationRequest(validMutation()), {
    objectId: "object-42",
    commandId: "aos-save-42",
    expectedRevision: 0,
    definitionVersion: "12",
    bodyBytes: JSON.stringify(validMutation().body).length
  });
});

test("server rejects missing idempotency and conflicting revisions", () => {
  assert.throws(
    () => assertAosObjectMutationRequest(validMutation({ headers: { "x-ixi-expected-revision": "0" } })),
    error => error.code === "AOS_OBJECT_IDEMPOTENCY_REQUIRED" && error.status === 428
  );
  assert.throws(
    () => assertAosObjectMutationRequest(validMutation({
      headers: { "idempotency-key": "aos-save-42", "x-ixi-expected-revision": "1" }
    })),
    error => error.code === "AOS_OBJECT_REVISION_MISMATCH" && error.status === 412
  );
});

test("server rejects mass-assignment keys and duplicate schema identities", () => {
  const forbidden = validMutation();
  forbidden.body.entityId = "another-tenant";
  assert.throws(
    () => assertAosObjectMutationRequest(forbidden),
    error => error.code === "AOS_OBJECT_PATCH_KEY_FORBIDDEN"
  );

  const duplicate = validMutation();
  duplicate.body.metadata.fieldDefinitions.push({
    fieldId: "hours",
    label: "OTHER HOURS",
    fieldType: "number"
  });
  assert.throws(
    () => assertAosObjectMutationRequest(duplicate),
    error => error.code === "AOS_FIELD_DEFINITION_DUPLICATE"
  );
});

test("revision zero still requires a strictly newer canonical readback", () => {
  const command = { objectId: "object-42", expectedRevision: 0 };
  assert.throws(
    () => acceptIXIAosCanonicalObject(command, { object: { objectId: "object-42", revision: 0 } }),
    error => error.code === "IXI_AOS_CANONICAL_REVISION_STALE"
  );
  assert.equal(
    acceptIXIAosCanonicalObject(command, { object: { objectId: "object-42", revision: 1 } }).revision,
    1
  );
});

test("workspace accepts IX-Core values while retaining derived definition hydration", () => {
  const merged = mergeAosCanonicalObject(
    {
      objectId: "object-42",
      displayName: "OLD",
      definition: { definitionId: "definition-1" },
      fieldDefinitions: [{ fieldId: "hours", label: "HOURS" }]
    },
    {
      objectId: "object-42",
      displayName: "CANONICAL",
      revision: 8,
      fields: { hours: 500 }
    }
  );
  assert.equal(merged.displayName, "CANONICAL");
  assert.equal(merged.revision, 8);
  assert.equal(merged.definition.definitionId, "definition-1");
  assert.equal(merged.fieldDefinitions[0].fieldId, "hours");
});

test("AOS Work mounts the production card runtime and canonical save adapter", () => {
  const board = read("components/ixi-mos/workspace/IXIAosWorkspaceBoard.jsx");
  const page = read("pages/aos/work.js");
  const runtime = read("components/ixi-aos/card-runtime/IXIAosOperatingCardRuntime.jsx");
  const adapter = read("components/ixi-aos/card-runtime/IXIAosDataContractCardAdapter.jsx");
  const editSession = read("components/ixi-aos/card-runtime/modules/useIXIAosObjectEditSession.js");
  const editor = read("components/ixi-aos/card-runtime/modules/IXIAosCommercialObjectEditor.jsx");

  assert.match(board, /IXIAosOperatingCardRuntime/u);
  assert.match(board, /onSaveObject=\{onSaveObject\}/u);
  assert.doesNotMatch(board, /<IXIMosObjectCard/u);
  assert.match(page, /commitMosObjectCommand\(command\)/u);
  assert.match(page, /mergeAosCanonicalObject/u);
  assert.match(page, /entityId !== activeEntityId/u);
  assert.match(page, /Existing durable AOS objects must remain manageable/u);
  assert.match(page, /validMosObjectIds\.forEach/u);
  assert.match(page, /equipmentSystemIndexObjectId,\s*\.\.\.validMosObjectIds/u);
  assert.doesNotMatch(page, /IXIMosObjectCard/u);
  assert.match(read("lib/mos/ixiMosBrowserGatewayClient.js"), /X-IXI-Expected-Revision/u);
  assert.match(read("pages/api/aos/mos\/\[\.\.\.path\]\.js"), /headers\["If-Match"\]\s*=\s*expectedRevision/u);
  assert.match(runtime, /width:\s*300px/u);
  assert.match(runtime, /height:\s*475px/u);
  assert.match(adapter, /createIXIAosObjectUpdateCommand/u);
  assert.match(adapter, /source:\s*"aos-card-action"/u);
  assert.match(editSession, /fetchMosObject\(objectId\)/u);
  assert.match(editSession, /createIXIAosEditSession\(canonical\)/u);
  assert.match(editSession, /editorObject:\s*session\?\.draft\s*\|\|\s*runtimeObject/u);
  assert.match(editor, /REBASE DRAFT ON LATEST/u);
});
