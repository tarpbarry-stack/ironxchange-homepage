import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  acceptIXIAosCanonicalObject,
  createIXIAosDefinitionEnvelope,
  createIXIAosDefinitionIndex,
  createIXIAosEditSession,
  createIXIAosObjectUpdateCommand,
  publishIXIAosDefinition,
  synchronizeIXIAosBusinessIdentifier,
  validateIXIAosDefinitionEnvelope
} from "../components/ixi-aos/card-runtime/IXIAosFoundationEngine.mjs";

const baseObject = {
  objectId: "object-009",
  revision: 7,
  definitionVersion: "definition-4",
  displayName: "2023 KOMATSU WA475-10",
  businessIdentifiers: [{ label: "ID", value: "OLD-009" }],
  fields: { businessIdentifier: "OLD-009", year: 2023 },
  fieldDefinitions: [
    { fieldId: "businessIdentifier", label: "CUSTOMER ID", semanticRole: "business-identifier" },
    { fieldId: "year", label: "YEAR", type: "number" }
  ]
};

test("foundation indexes 1,000 faces as definitions without creating component logic", () => {
  const faces = Array.from({ length: 1000 }, (_, index) => ({
    faceId: `face-${index + 1}`,
    label: `FACE ${index + 1}`,
    modules: [{ moduleId: `module-${index + 1}`, moduleType: "object-fields" }]
  }));
  const definition = createIXIAosDefinitionEnvelope({
    definitionId: "definition:scale-proof",
    fields: baseObject.fieldDefinitions,
    faces
  });
  const index = createIXIAosDefinitionIndex(definition);
  assert.equal(definition.faces.length, 1000);
  assert.equal(index.facesById.get("face-1000").faceIndex, 1000);
  assert.equal(new Set(definition.faces.map(face => face.faceId)).size, 1000);
});

test("definition validation rejects duplicate durable IDs and publishing versions an accepted draft", () => {
  const invalid = validateIXIAosDefinitionEnvelope({
    definitionId: "definition:invalid",
    fields: [{ fieldId: "status" }, { fieldId: "status" }],
    faces: [{ faceId: "face-1" }]
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.some(error => error.code === "DUPLICATE_ID"));

  const published = publishIXIAosDefinition({
    definitionId: "definition:valid",
    revision: 3,
    version: 8,
    fields: baseObject.fieldDefinitions,
    faces: [{ faceId: "face-1", label: "PRIMARY" }]
  }, { actorId: "user-1", at: "2026-09-04T12:00:00.000Z" });
  assert.equal(published.state, "published");
  assert.equal(published.revision, 4);
  assert.equal(published.version, 9);
  assert.equal(published.metadata.publishedBy, "user-1");
});

test("business ID edits atomically replace durable identity while preserving secondary IDs", () => {
  const next = synchronizeIXIAosBusinessIdentifier({
    ...baseObject,
    businessIdentifiers: [
      { label: "ID", value: "OLD-009" },
      { label: "SERIAL", value: "KMTWA475XPA014821" }
    ],
    fields: { ...baseObject.fields, businessIdentifier: "CUSTOMER-77" }
  });
  assert.equal(next.fields.businessIdentifier, "CUSTOMER-77");
  assert.equal(next.businessIdentifiers[0].value, "CUSTOMER-77");
  assert.equal(next.businessIdentifiers[1].value, "KMTWA475XPA014821");
});

test("one command carries revision, definition version and one retry-safe identity", () => {
  const session = createIXIAosEditSession(baseObject);
  const draft = {
    ...session.draft,
    fields: { ...session.draft.fields, businessIdentifier: "CUSTOMER-77" }
  };
  const command = createIXIAosObjectUpdateCommand({
    session,
    draft,
    commandId: "command-123",
    now: "2026-09-04T12:00:00.000Z"
  });
  assert.equal(command.commandId, "command-123");
  assert.equal(command.idempotencyKey, "command-123");
  assert.equal(command.expectedRevision, 7);
  assert.equal(command.definitionVersion, "definition-4");
  assert.equal(command.patch.businessIdentifiers[0].value, "CUSTOMER-77");

  const canonical = acceptIXIAosCanonicalObject(command, {
    object: { ...draft, revision: 8 }
  });
  assert.equal(canonical.revision, 8);
  assert.throws(
    () => acceptIXIAosCanonicalObject(command, { object: { ...draft, revision: 7 } }),
    error => error.code === "IXI_AOS_CANONICAL_REVISION_STALE"
  );
});

test("Cards 004 and 009 use one editor session and the MOS client enforces canonical readback", () => {
  const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  for (const card of ["004/IXIAosCard004Personnel.jsx", "009/IXIAosCard009.jsx"]) {
    const source = read(`components/ixi-aos/cards/${card}`);
    assert.match(source, /IXIAosCommercialEditorBridge/u);
    assert.match(source, /persistenceAdapter=/u);
  }
  const bridge = read("components/ixi-aos/card-runtime/modules/IXIAosCommercialEditorBridge.jsx");
  assert.match(bridge, /useIXIAosObjectEditSession/u);
  const session = read("components/ixi-aos/card-runtime/modules/useIXIAosObjectEditSession.js");
  assert.match(session, /pending\?\.fingerprint === fingerprint/u);
  assert.match(session, /pendingCommandRef\.current = \{ command, fingerprint \}/u);
  const client = read("lib/mos/ixiMosBrowserGatewayClient.js");
  assert.match(client, /Idempotency-Key/u);
  assert.match(client, /If-Match/u);
  assert.match(client, /await fetchMosObject/u);
  assert.match(client, /IXI_AOS_CANONICAL_READBACK_REQUIRED/u);
});
