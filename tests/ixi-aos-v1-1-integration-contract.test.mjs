import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAosCanonicalAdmission,
  canonicalizeAosPlacementReferences,
  createAosObjectPreviewReference
} from "../lib/mos/ixiAosCanonicalAdmission.mjs";
import {
  IXI_AOS_RAIL_MEMBERSHIP_BEHAVIOR_ID,
  createAosMembershipRelationship,
  createAosRailOrderKey,
  getAosMembershipObjectIds,
  getAosRailProjectionObjectIds
} from "../lib/mos/IXIAosMembershipBridge.mjs";
import {
  admitMosCanonicalIdentity,
  admitMosCanonicalIdentities,
  createMosRelationship,
  findVerifiedMosRelationship,
  hasMosCanonicalAdmissionEvidence
} from "../lib/mos/ixiMosBrowserGatewayClient.js";

test("environment hydration batches canonical identity admission into one authenticated request", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url, options });
    return {
      ok: true,
      json: async () => ({ ok: true, admissions: [] })
    };
  };
  try {
    await admitMosCanonicalIdentities({
      requests: [
        { objectId: "object-one", passportId: "IXIONE2345" },
        { objectId: "object-two", passportId: "IXITWO2345" }
      ]
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/api/aos/mos/identity/admit-batch");
  assert.equal(JSON.parse(calls[0].options.body).requests.length, 2);
});

function canonicalObject({ objectId, passportId, displayName, objectType = "customer-defined" }) {
  return {
    objectId,
    passportId,
    entityId: "entity-star-and-sons",
    displayName,
    objectType,
    permissions: { canRelate: true }
  };
}

test("browser commands use the exact IX-Core v1.1 admission and rail contracts", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];

  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url, options });

    if (url === "/api/aos/mos/identity/admit") {
      const request = JSON.parse(options.body);
      const isTarget = request.objectId === "object-wichita-falls";
      return {
        ok: true,
        json: async () => ({
          ok: true,
          identity: {
            objectId: request.objectId,
            passportId: request.passportId,
            entityId: "entity-star-and-sons",
            aliases: isTarget
              ? []
              : [{ sourceType: "sharetribe-listing", sourceId: "listing-ripper-1" }],
            evidence: { resolution: "canonical-admission" }
          },
          object: {
            objectId: request.objectId,
            passportId: request.passportId,
            entityId: "entity-star-and-sons"
          }
        })
      };
    }

    if (url === "/api/aos/mos/relationships") {
      return {
        ok: true,
        json: async () => ({
          relationship: {
            relationshipId: "relationship-wf-ripper",
            sourceObjectId: "object-ripper-1",
            sourcePassportId: "IXIRPR2345",
            targetObjectId: "object-wichita-falls",
            targetPassportId: "IXIWFT2345",
            behaviorId: IXI_AOS_RAIL_MEMBERSHIP_BEHAVIOR_ID,
            definitionId: null,
            orderKey: "000100",
            status: "active"
          }
        })
      };
    }

    return {
      ok: true,
      json: async () => ({
        relationships: [{
          relationshipId: "relationship-wf-ripper",
          sourceObjectId: "object-ripper-1",
          sourcePassportId: "IXIRPR2345",
          targetObjectId: "object-wichita-falls",
          targetPassportId: "IXIWFT2345",
          behaviorId: IXI_AOS_RAIL_MEMBERSHIP_BEHAVIOR_ID,
          definitionId: null,
          orderKey: "000100",
          status: "active"
        }]
      })
    };
  };

  try {
    await admitMosCanonicalIdentity({
      objectId: "object-ripper-1",
      passportId: "IXIRPR2345",
      aliases: [{ sourceType: "sharetribe-listing", sourceId: "listing-ripper-1" }]
    });
    await createMosRelationship({
      sourceObjectId: "object-ripper-1",
      sourcePassportId: "IXIRPR2345",
      targetObjectId: "object-wichita-falls",
      targetPassportId: "IXIWFT2345",
      behaviorId: IXI_AOS_RAIL_MEMBERSHIP_BEHAVIOR_ID,
      definitionId: null,
      relationshipLabel: null,
      orderKey: "000100",
      commandId: "command-wf-ripper"
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(JSON.parse(calls[0].options.body), {
    objectId: "object-ripper-1",
    passportId: "IXIRPR2345",
    aliases: [{ sourceType: "sharetribe-listing", sourceId: "listing-ripper-1" }]
  });
  assert.deepEqual(JSON.parse(calls[1].options.body), {
    commandId: "command-wf-ripper",
    sourceObjectId: "object-ripper-1",
    sourcePassportId: "IXIRPR2345",
    targetObjectId: "object-wichita-falls",
    targetPassportId: "IXIWFT2345",
    behaviorId: IXI_AOS_RAIL_MEMBERSHIP_BEHAVIOR_ID,
    definitionId: null,
    relationshipLabel: null,
    orderKey: "000100"
  });
  assert.equal(calls[1].options.headers["Idempotency-Key"], "command-wf-ripper");
  assert.match(calls[2].url, /object-wichita-falls\/relationships\?direction=incoming/u);
});

test("Wichita Falls and Equipment project one ripper without changing Object or Passport counts", async () => {
  const ripper = canonicalObject({
    objectId: "object-ripper-1",
    passportId: "IXIRPR2345",
    displayName: "RIPPER",
    objectType: "machine"
  });
  const equipment = canonicalObject({
    objectId: "object-equipment-index",
    passportId: "IXIEQP2345",
    displayName: "Equipment"
  });
  const wichitaFalls = canonicalObject({
    objectId: "object-wichita-falls",
    passportId: "IXIWFT2345",
    displayName: "Wichita Falls"
  });
  const listing = {
    id: { uuid: "listing-ripper-1" },
    attributes: { publicData: { passportId: ripper.passportId } }
  };
  const admission = buildAosCanonicalAdmission({
    aosObjects: [ripper, equipment, wichitaFalls],
    workspaceListings: [listing]
  });
  const objectCount = admission.objectsById.size;
  const passportCount = admission.passportToObjectId.size;
  const equipmentProjection = {
    [equipment.objectId]: {
      members: [{ objectId: ripper.objectId, passportId: ripper.passportId }]
    }
  };

  let request = null;
  const result = await createAosMembershipRelationship({
    createRelationship: async payload => {
      request = payload;
      return {
        relationship: {
          relationshipId: "relationship-wf-ripper",
          revision: 1,
          status: "active",
          ...payload
        }
      };
    },
    parentObjectId: wichitaFalls.objectId,
    parentPassportId: wichitaFalls.passportId,
    memberObjectId: ripper.objectId,
    memberPassportId: ripper.passportId,
    orderKey: createAosRailOrderKey(0),
    commandId: "command-wf-ripper"
  });
  const hydratedRailProjections = {
    ...equipmentProjection,
    [wichitaFalls.objectId]: {
      members: [{ objectId: ripper.objectId, passportId: ripper.passportId }]
    }
  };

  assert.deepEqual(
    getAosRailProjectionObjectIds({
      railOwnerObjectId: equipment.objectId,
      railProjections: hydratedRailProjections,
      admission
    }),
    [ripper.objectId]
  );
  assert.deepEqual(
    getAosRailProjectionObjectIds({
      railOwnerObjectId: wichitaFalls.objectId,
      railProjections: hydratedRailProjections,
      admission
    }),
    [ripper.objectId]
  );
  assert.deepEqual(
    getAosMembershipObjectIds({
      parentObjectId: wichitaFalls.objectId,
      relationships: [result.relationship],
      admission
    }),
    [ripper.objectId]
  );
  assert.equal(request.sourceObjectId, ripper.objectId);
  assert.equal(request.sourcePassportId, ripper.passportId);
  assert.equal(request.targetObjectId, wichitaFalls.objectId);
  assert.equal(request.targetPassportId, wichitaFalls.passportId);
  assert.equal(request.behaviorId, IXI_AOS_RAIL_MEMBERSHIP_BEHAVIOR_ID);
  assert.equal(request.definitionId, null);
  assert.equal(request.relationshipLabel, null);

  const equipmentPreview = createAosObjectPreviewReference(ripper.objectId, admission);
  const wichitaFallsPreview = createAosObjectPreviewReference(ripper.objectId, admission);
  assert.notEqual(equipmentPreview, wichitaFallsPreview);
  assert.equal(equipmentPreview.objectId, wichitaFallsPreview.objectId);
  assert.equal(equipmentPreview.passportId, wichitaFallsPreview.passportId);
  assert.equal(equipmentPreview.referenceOnly, true);

  const placement = canonicalizeAosPlacementReferences({
    board: [listing.id.uuid],
    [`container:${wichitaFalls.objectId}`]: [ripper.passportId]
  }, admission);
  assert.deepEqual(placement.board, [ripper.objectId]);
  assert.deepEqual(placement[`container:${wichitaFalls.objectId}`], []);
  assert.equal(admission.objectsById.size, objectCount);
  assert.equal(admission.passportToObjectId.size, passportCount);
});

test("customer label changes cannot alter rail behavior or edge identity", async () => {
  const payloads = [];
  const createRelationship = async payload => {
    payloads.push(payload);
    return { relationship: { relationshipId: `relationship-${payloads.length}`, ...payload } };
  };

  for (const relationshipLabel of ["Equipment", "Heavy Iron"]) {
    await createAosMembershipRelationship({
      createRelationship,
      parentObjectId: "object-index",
      parentPassportId: "IXIIDX2345",
      memberObjectId: "object-ripper",
      memberPassportId: "IXIRPR2345",
      orderKey: "000100",
      relationshipLabel: null,
      commandId: `command-${relationshipLabel}`
    });
  }

  assert.equal(payloads[0].behaviorId, payloads[1].behaviorId);
  assert.equal(payloads[0].sourceObjectId, payloads[1].sourceObjectId);
  assert.equal(payloads[0].targetObjectId, payloads[1].targetObjectId);
  assert.equal(payloads[0].relationshipLabel, null);
  assert.equal(payloads[1].relationshipLabel, null);
});

test("durable relationship readback requires complete matching Passport evidence", () => {
  const expected = {
    relationshipId: "relationship-1",
    sourceObjectId: "object-ripper-1",
    sourcePassportId: "IXIRPR2345",
    targetObjectId: "object-wichita-falls",
    targetPassportId: "IXIWFT2345",
    behaviorId: IXI_AOS_RAIL_MEMBERSHIP_BEHAVIOR_ID,
    definitionId: null,
    orderKey: "000100",
    status: "active"
  };

  assert.equal(findVerifiedMosRelationship({
    readback: { relationships: [{ ...expected, sourcePassportId: null }] },
    ...expected
  }), null);
  assert.equal(findVerifiedMosRelationship({
    readback: { relationships: [{ ...expected, targetPassportId: "IXIWRONG" }] },
    ...expected
  }), null);
  assert.deepEqual(findVerifiedMosRelationship({
    readback: { relationships: [expected] },
    ...expected
  }), expected);
});

test("workspace deduplication is local to each placement scope", () => {
  const admission = buildAosCanonicalAdmission({
    aosObjects: [canonicalObject({
      objectId: "object-ripper-1",
      passportId: "IXIRPR2345",
      displayName: "RIPPER"
    })]
  });

  const employeeOne = canonicalizeAosPlacementReferences({ board: ["object-ripper-1"] }, admission);
  const employeeTwo = canonicalizeAosPlacementReferences({ board: ["IXIRPR2345"] }, admission);

  assert.deepEqual(employeeOne.board, ["object-ripper-1"]);
  assert.deepEqual(employeeTwo.board, ["object-ripper-1"]);
  assert.notEqual(employeeOne, employeeTwo);
});

test("rail projections reject Passport mismatch, unresolved identity, and alias collision", () => {
  const ripper = canonicalObject({
    objectId: "object-ripper-1",
    passportId: "IXIRPR2345",
    displayName: "Ripper"
  });
  const owner = canonicalObject({
    objectId: "object-wichita-falls",
    passportId: "IXIWFT2345",
    displayName: "Wichita Falls"
  });
  const admission = buildAosCanonicalAdmission({ aosObjects: [ripper, owner] });

  assert.throws(
    () => getAosRailProjectionObjectIds({
      railOwnerObjectId: owner.objectId,
      railProjections: {
        [owner.objectId]: {
          members: [{ objectId: ripper.objectId, passportId: "IXIBAD2345" }]
        }
      },
      admission
    }),
    error => error?.code === "IXI_AOS_PROJECTION_PASSPORT_MISMATCH"
  );

  assert.throws(
    () => getAosRailProjectionObjectIds({
      railOwnerObjectId: owner.objectId,
      railProjections: {
        [owner.objectId]: { members: [{ objectId: "object-missing" }] }
      },
      admission
    }),
    error => error?.code === "IXI_AOS_PROJECTION_IDENTITY_UNRESOLVED"
  );

  assert.throws(
    () => getAosRailProjectionObjectIds({
      railOwnerObjectId: owner.objectId,
      railProjections: {
        [owner.objectId]: { members: [{ objectId: ripper.objectId }] }
      },
      admission: {
        objectsById: admission.objectsById,
        resolveObjectId() {
          const error = new Error("collision");
          error.code = "IXI_AOS_ALIAS_INDEX_CONFLICT";
          throw error;
        }
      }
    }),
    error => error?.code === "IXI_AOS_PROJECTION_IDENTITY_CONFLICT"
  );
});

test("durable relationship readback verifies every technical field and endpoint admission", () => {
  const relationship = {
    relationshipId: "relationship-wf-ripper",
    sourceObjectId: "object-ripper-1",
    sourcePassportId: "IXIRPR2345",
    targetObjectId: "object-wichita-falls",
    targetPassportId: "IXIWFT2345",
    behaviorId: IXI_AOS_RAIL_MEMBERSHIP_BEHAVIOR_ID,
    definitionId: "definition-rail-1",
    orderKey: "000100",
    status: "active"
  };
  const expected = {
    readback: { relationships: [relationship] },
    ...relationship
  };

  assert.equal(findVerifiedMosRelationship(expected), relationship);

  for (const [field, value] of [
    ["relationshipId", "relationship-other"],
    ["sourceObjectId", "object-other"],
    ["targetObjectId", "object-other"],
    ["behaviorId", "aos.neutral-connection.v1"],
    ["definitionId", "definition-other"],
    ["orderKey", "000200"],
    ["status", "ended"],
    ["sourcePassportId", "IXIBAD2345"],
    ["targetPassportId", "IXIBAD2345"]
  ]) {
    assert.equal(
      findVerifiedMosRelationship({
        ...expected,
        readback: { relationships: [{ ...relationship, [field]: value }] }
      }),
      null,
      field
    );
  }

  const admission = {
    ok: true,
    identity: {
      objectId: "object-ripper-1",
      passportId: "IXIRPR2345",
      evidence: { matchedBy: "objectId" }
    },
    object: { objectId: "object-ripper-1" }
  };
  assert.equal(hasMosCanonicalAdmissionEvidence({
    admission,
    objectId: "object-ripper-1",
    passportId: "IXIRPR2345"
  }), true);
  assert.equal(hasMosCanonicalAdmissionEvidence({
    admission,
    objectId: "object-ripper-1",
    passportId: "IXIBAD2345"
  }), false);
});
