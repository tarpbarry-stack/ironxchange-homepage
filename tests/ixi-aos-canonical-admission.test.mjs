import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAosCanonicalAdmission,
  canonicalizeAosPlacementReferences,
  createAosObjectPreviewReference,
  normalizeAosCanonicalObject,
  normalizeIxCoreAdmissionEnvelope,
  preserveAosOwnedListingPresentations,
  resolveAosCanonicalPresentation
} from "../lib/mos/ixiAosCanonicalAdmission.mjs";

function machine(overrides = {}) {
  return {
    objectId: "object-machine-1",
    entityId: "entity-1",
    objectType: "machine",
    passportId: "IXIABC2345",
    metadata: { sourceListingId: "listing-1" },
    permissions: { canEdit: true, canTransact: true },
    ...overrides
  };
}

test("exact IX-Core admission envelope preserves only server-verified aliases and evidence", () => {
  const response = {
    ok: true,
    identity: {
      objectId: "object-machine-1",
      passportId: "IXIABC2345",
      entityId: "entity-1",
      aliases: [
        { sourceType: "sharetribe-listing", sourceId: "listing-1" },
        { sourceType: "historical-passport", sourceId: "IXIDEF2345" },
        { sourceType: "erp-asset", sourceId: "ERP-41" }
      ],
      evidence: { matchedBy: ["objectId", "passportId"] }
    },
    object: {
      objectId: "object-machine-1",
      entityId: "entity-1",
      sourceBindings: [{
        sourceType: "sharetribe-listing",
        sourceId: "released-listing-2"
      }]
    }
  };
  const admitted = normalizeIxCoreAdmissionEnvelope({
    response,
    requestedObject: machine({
      sourceBindings: [{ sourceType: "browser-invented", sourceId: "FAKE-1" }]
    }),
    expectedEntityId: "entity-1"
  });
  const admission = buildAosCanonicalAdmission({ aosObjects: [admitted] });

  assert.deepEqual(admitted.aliases, [
    { sourceType: "sharetribe-listing", sourceId: "listing-1" },
    { sourceType: "historical-passport", sourceId: "IXIDEF2345" },
    { sourceType: "erp-asset", sourceId: "ERP-41" },
    { sourceType: "sharetribe-listing", sourceId: "released-listing-2" }
  ]);
  assert.deepEqual(admitted.evidence, {
    matchedBy: ["objectId", "passportId"]
  });
  assert.equal(admitted.admissionIdentity, response.identity);
  assert.equal(admission.resolveObjectId("listing-1"), "object-machine-1");
  assert.equal(admission.resolveObjectId("IXIDEF2345"), "object-machine-1");
  assert.equal(admission.resolveObjectId("ERP-41"), "object-machine-1");
  assert.equal(admission.resolveObjectId("released-listing-2"), "object-machine-1");
  assert.equal(admission.resolveObjectId("FAKE-1"), "");
});

test("flattened admission responses and conflicting canonical Object Passports fail closed", () => {
  assert.throws(
    () => normalizeIxCoreAdmissionEnvelope({
      response: {
        ok: true,
        objectId: "object-machine-1",
        passportId: "IXIABC2345",
        entityId: "entity-1",
        aliases: [],
        evidence: {},
        object: machine()
      },
      requestedObject: machine(),
      expectedEntityId: "entity-1"
    }),
    error => error?.code === "CANONICAL_IDENTITY_REPAIR_REQUIRED"
  );

  assert.throws(
    () => normalizeIxCoreAdmissionEnvelope({
      response: {
        ok: true,
        identity: {
          objectId: "object-machine-1",
          passportId: "IXIABC2345",
          entityId: "entity-1",
          aliases: [],
          evidence: {}
        },
        object: machine({ passportId: "IXIWRG2345" })
      },
      requestedObject: machine(),
      expectedEntityId: "entity-1"
    }),
    error => error?.code === "CANONICAL_IDENTITY_REPAIR_REQUIRED"
  );
});

function listing(overrides = {}) {
  return {
    id: { uuid: "listing-1" },
    title: "Customer machine title",
    attributes: {
      publicData: {
        passportId: "IXIABC2345",
        machineAccess: "private"
      }
    },
    ...overrides
  };
}

test("listing and Passport aliases converge to one canonical objectId", () => {
  const admission = buildAosCanonicalAdmission({
    aosObjects: [machine()],
    workspaceListings: [listing()]
  });

  assert.equal(admission.objectsById.size, 1);
  assert.equal(admission.resolveObjectId("listing-1"), "object-machine-1");
  assert.equal(admission.resolveObjectId("IXIABC2345"), "object-machine-1");
  assert.equal(admission.resolveObject("listing-1"), admission.resolveObject("IXIABC2345"));
});

test("one listing alias resolving to multiple active objects fails closed", () => {
  assert.throws(
    () => buildAosCanonicalAdmission({
      aosObjects: [
        machine(),
        machine({ objectId: "object-machine-2", passportId: "IXIDEF2345" })
      ]
    }),
    error => error.code === "IXI_AOS_ALIAS_COLLISION" && error.details.kind === "listing"
  );
});

test("one Passport resolving to multiple active objects fails closed", () => {
  assert.throws(
    () => buildAosCanonicalAdmission({
      aosObjects: [
        machine({ metadata: {} }),
        machine({ objectId: "object-machine-2", metadata: {} })
      ]
    }),
    error => error.code === "IXI_AOS_ALIAS_COLLISION" && error.details.kind === "Passport"
  );
});

test("conflicting Passport fields on one source object fail closed", () => {
  assert.throws(
    () => normalizeAosCanonicalObject({
      object: machine({
        passportId: "IXIABC2345",
        metadata: {
          passportIdentity: { passportId: "IXIDEF2345" }
        }
      })
    }),
    error => error.code === "IXI_AOS_OBJECT_PASSPORT_CONFLICT"
  );
});

test("existing Passport admits a listing even when historical source binding is missing", () => {
  const admission = buildAosCanonicalAdmission({
    aosObjects: [machine({ metadata: {} })],
    workspaceListings: [listing()]
  });

  assert.equal(admission.resolveObjectId("listing-1"), "object-machine-1");
  assert.equal(admission.unresolvedListings.length, 0);
  assert.deepEqual(
    admission.resolveObject("object-machine-1").aliases.listingIds,
    ["listing-1"]
  );
});

test("archived duplicate does not conflict with the active canonical object", () => {
  const admission = buildAosCanonicalAdmission({
    aosObjects: [
      machine(),
      machine({ objectId: "object-archived", status: "archived" })
    ],
    workspaceListings: [listing()]
  });

  assert.equal(admission.objectsById.size, 1);
  assert.equal(admission.resolveObjectId("listing-1"), "object-machine-1");
});

test("historical Passport locations and source bindings are admitted once", () => {
  const normalized = normalizeAosCanonicalObject({
    object: machine({
      passportId: undefined,
      metadata: {
        passportIdentity: { passportId: "IXIGHK2345" },
        sourceBindings: [
          { sourceType: "sharetribe-listing", sourceId: "listing-history-1" },
          { sourceType: "historical-record", sourceId: "legacy-machine-1", historical: true }
        ]
      }
    })
  });

  assert.equal(normalized.passportId, "IXIGHK2345");
  assert.deepEqual(normalized.aliases.listingIds, ["listing-history-1"]);
  assert.deepEqual(normalized.aliases.historicalIds, ["legacy-machine-1"]);
});

test("every released Passport location enters through the shared normalizer", () => {
  const cases = [
    { passportId: "IXIABC2345" },
    { identities: [{ identityType: "ixi-passport", passportId: "IXIDEF2345" }] },
    { metadata: { passportIdentity: { passportId: "IXIGHK2345" } } },
    { metadata: { provisioning: { passportId: "IXIJKM2345" } } },
    { attributes: { publicData: { passportId: "IXIMNP2345" } } },
    { attributes: { publicData: { ixiMedia: { passportId: "IXIPQR2345" } } } },
    {
      metadata: {
        sourceBindings: [{ sourceType: "ixi-passport", sourceId: "IXISTV2345" }]
      }
    }
  ];

  cases.forEach((passportShape, index) => {
    const normalized = normalizeAosCanonicalObject({
      object: {
        objectId: `historical-object-${index}`,
        entityId: "entity-1",
        ...passportShape
      }
    });
    assert.equal(normalized.aliases.passportIds.length, 1);
    assert.equal(normalized.passportId, normalized.aliases.passportIds[0]);
  });
});

test("unresolved listing admission fails closed without creating a registry object", () => {
  const admission = buildAosCanonicalAdmission({
    aosObjects: [machine()],
    workspaceListings: [listing({
      id: { uuid: "unresolved-listing" },
      attributes: { publicData: { passportId: "IXIWXY2345" } }
    })]
  });

  assert.equal(admission.objectsById.size, 1);
  assert.equal(admission.resolveObjectId("unresolved-listing"), "");
  assert.equal(admission.unresolvedListings.length, 1);
});

test("unresolved owned listings remain Private-card presentations without gaining canonical authority", () => {
  const unresolved = listing({
    id: { uuid: "unresolved-listing" },
    attributes: { publicData: {} }
  });
  const admission = buildAosCanonicalAdmission({
    aosObjects: [machine({ metadata: {} })],
    workspaceListings: [unresolved]
  });
  const presentations = preserveAosOwnedListingPresentations(
    [unresolved],
    admission
  );

  assert.equal(presentations.length, 1);
  assert.equal(presentations[0].id.uuid, "unresolved-listing");
  assert.equal(presentations[0].presentation.kind, "ixi-private-machine");
  assert.equal(presentations[0].canonicalIdentityStatus, "unresolved");
  assert.equal(presentations[0].governedActionsDisabled, true);
  assert.equal(presentations[0].objectId, undefined);
  assert.equal(admission.objectsById.size, 1);
});

test("one machine has one operating identity and multiple rail previews", () => {
  const admission = buildAosCanonicalAdmission({
    aosObjects: [machine()],
    workspaceListings: [listing()]
  });
  const placements = canonicalizeAosPlacementReferences({
    board: ["listing-1", "IXIABC2345"],
    "container:wf": ["listing-1"],
    "container:job-41": ["IXIABC2345"]
  }, admission);
  const firstPreview = createAosObjectPreviewReference("object-machine-1", admission);
  const secondPreview = createAosObjectPreviewReference("object-machine-1", admission);

  assert.deepEqual(placements.board, ["object-machine-1"]);
  assert.deepEqual(placements["container:wf"], []);
  assert.deepEqual(placements["container:job-41"], []);
  assert.notEqual(firstPreview, secondPreview);
  assert.equal(firstPreview.objectId, secondPreview.objectId);
  assert.equal(firstPreview.referenceOnly, true);
});

test("machine presentation remains the established Private machine card", () => {
  const admitted = buildAosCanonicalAdmission({
    aosObjects: [machine({
      objectType: "customer-renamed-classification",
      displayName: "Pickup"
    })],
    workspaceListings: [listing()]
  }).objectsById.get("object-machine-1");

  assert.equal(admitted.presentation.kind, "ixi-private-machine");
  assert.equal(admitted.presentation.renderer, "established-private-machine-card");
  assert.equal(
    admitted.presentation.sourceAdapterId,
    "ixi.sharetribe-owned-machine.v1"
  );
  assert.equal(admitted.objectId, "object-machine-1");
  assert.equal(admitted.passportId, "IXIABC2345");
});

test("server-verified historical listing source preserves the Private card without a listing Passport", () => {
  const admitted = normalizeIxCoreAdmissionEnvelope({
    response: {
      ok: true,
      identity: {
        objectId: "object-machine-1",
        passportId: "IXIABC2345",
        entityId: "entity-1",
        aliases: [],
        evidence: { resolution: "canonical-admission" }
      },
      object: machine({
        metadata: { sourceListingId: "legacy-listing-1" }
      })
    },
    requestedObject: machine(),
    expectedEntityId: "entity-1"
  });

  const normalized = buildAosCanonicalAdmission({
    aosObjects: [admitted],
    workspaceListings: [{
      id: { uuid: "legacy-listing-1" },
      title: "Historical private machine",
      attributes: { publicData: {} }
    }]
  }).objectsById.get("object-machine-1");

  assert.equal(normalized.presentation.kind, "ixi-private-machine");
  assert.equal(normalized.presentation.sourceAlias, "legacy-listing-1");
  assert.equal(normalized.title, "Historical private machine");
  assert.deepEqual(normalized.aliases.listingIds, ["legacy-listing-1"]);
});

test("customer classification and label renames cannot change the source-adapter presentation", () => {
  const left = buildAosCanonicalAdmission({
    aosObjects: [machine({ objectType: "truck", displayName: "Pickup" })],
    workspaceListings: [listing()]
  }).objectsById.get("object-machine-1");
  const right = buildAosCanonicalAdmission({
    aosObjects: [machine({ objectType: "heavy-equipment", displayName: "Road Vehicle" })],
    workspaceListings: [listing()]
  }).objectsById.get("object-machine-1");

  assert.deepEqual(left.presentation, right.presentation);
  assert.equal(left.presentation.kind, "ixi-private-machine");
});

test("Cards 001-018 are presentation-only and Card 007 accepts customer-defined objects", () => {
  for (let templateNumber = 1; templateNumber <= 18; templateNumber += 1) {
    const object = machine({
      objectId: `object-${templateNumber}`,
      objectType: "customer-defined",
      passportId: `IXIABC${String(2344 + templateNumber).padStart(4, "0")}`,
      metadata: { cardNumber: templateNumber }
    });
    const presentation = resolveAosCanonicalPresentation({ object });
    assert.equal(presentation.kind, "aos-numbered-card");
    assert.equal(presentation.templateNumber, templateNumber);
  }

  assert.equal(resolveAosCanonicalPresentation({
    object: machine({ objectType: "anything-customer-defined", metadata: { cardNumber: 7 } })
  }).templateNumber, 7);
});

test("missing presentation metadata never manufactures a numbered AOS card", () => {
  const presentation = resolveAosCanonicalPresentation({
    object: machine({ metadata: {}, objectType: "machine" })
  });

  assert.equal(presentation.kind, "unresolved-presentation");
  assert.equal(presentation.renderer, null);
  assert.equal(presentation.explicit, false);
  assert.equal(presentation.templateNumber, undefined);
});

test("customer labels do not change identity, presentation fallback, or authority", () => {
  const left = normalizeAosCanonicalObject({
    object: machine({ displayName: "Equipment", metadata: {}, permissions: { canEdit: true } })
  });
  const right = normalizeAosCanonicalObject({
    object: machine({ displayName: "Road Vehicle", metadata: {}, permissions: { canEdit: true } })
  });

  assert.equal(left.objectId, right.objectId);
  assert.deepEqual(left.actorAuthority, right.actorAuthority);
  assert.equal(left.presentation.templateNumber, right.presentation.templateNumber);
});

test("authority is copied from governed server state and never inferred from contain capability", () => {
  const normalized = normalizeAosCanonicalObject({
    object: machine({
      capabilities: { canContain: true, canCreate: true, canTransact: true },
      permissions: {}
    })
  });

  assert.equal(normalized.actorAuthority.canCreateChild, false);
  assert.equal(normalized.actorAuthority.canTransact, false);
});
