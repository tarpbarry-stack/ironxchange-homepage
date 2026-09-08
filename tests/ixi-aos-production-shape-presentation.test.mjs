import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  buildAosCanonicalAdmission,
  preserveAosOwnedListingPresentations,
  shouldRegisterAosWorkspaceObject
} from "../lib/mos/ixiAosCanonicalAdmission.mjs";
import {
  buildAosSystemIndexes
} from "../lib/mos/buildAosSystemIndexes.js";
import {
  isIXIAosWorkspaceVisibleAdapter
} from "../lib/mos/IXIAosSystemAdapterRegistry.js";
import {
  getAosCorroboratedLegacyMembershipObjectIds
} from "../lib/mos/IXIAosMembershipBridge.mjs";

const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function passportFor(index) {
  return `IXIABC234${alphabet[index]}`;
}

function admittedMachine(index) {
  const listingId = `historical-listing-${index + 1}`;
  const passportId = passportFor(index);

  return {
    objectId: `object_machine_${index + 1}`,
    passportId,
    entityId: "entity-star-and-sons",
    displayName: `Machine ${index + 1}`,
    status: "active",
    canonicalAdmissionVerified: true,
    // IX-Core returns the union of Passport and released Object aliases.
    aliases: [{ sourceType: "sharetribe-listing", sourceId: listingId }],
    metadata: {},
    permissions: {}
  };
}

function listing(index) {
  const modern = index >= 20;
  return {
    id: { uuid: `historical-listing-${index + 1}` },
    title: `Private listing machine ${index + 1}`,
    imageUrls: [`https://images.example.test/machine-${index + 1}.jpg`],
    attributes: {
      publicData: modern ? { passportId: passportFor(index) } : {}
    }
  };
}

test("released Object source bindings preserve all owned equipment as canonical Private cards", () => {
  const machines = Array.from({ length: 23 }, (_, index) => admittedMachine(index));
  const listings = Array.from({ length: 23 }, (_, index) => listing(index));
  const admission = buildAosCanonicalAdmission({
    aosObjects: machines,
    workspaceListings: listings
  });

  const admitted = [...admission.objectsById.values()];
  const presentations = preserveAosOwnedListingPresentations(
    listings,
    admission
  );
  assert.equal(admitted.length, 23);
  assert.equal(
    admitted.filter(object => object.presentation.kind === "ixi-private-machine").length,
    23
  );
  assert.equal(
    admitted.filter(object => object.presentation.kind === "aos-numbered-card").length,
    0
  );
  assert.equal(
    admitted.filter(object => object.presentation.kind === "unresolved-presentation").length,
    0
  );
  assert.equal(presentations.length, 23);
  assert.equal(
    presentations.filter(item => item.presentation.kind === "ixi-private-machine").length,
    23
  );
  assert.equal(
    presentations.filter(item => item.canonicalIdentityStatus === "unresolved").length,
    0
  );
  assert.equal(presentations.every(item => item.objectId.startsWith("object_machine_")), true);
  assert.equal(presentations.every(item => item.governedActionsDisabled !== true), true);
  assert.equal(presentations.every(item => item.imageUrls.length === 1), true);
});

test("the passive legacy FOR SALE adapter cannot become an AOS workspace container", () => {
  const equipment = {
    objectId: "object-equipment",
    passportId: "IXIEQP2345",
    entityId: "entity-star-and-sons",
    displayName: "EQUIPMENT",
    status: "active",
    objectType: "system-index",
    metadata: { systemIndex: true, adapterId: "ixi-owned-equipment" }
  };
  const legacyForSale = {
    objectId: "object-for-sale",
    passportId: "IXISAL2345",
    entityId: "entity-star-and-sons",
    displayName: "FOR SALE",
    status: "active",
    objectType: "system-index",
    metadata: { systemIndex: true, adapterId: "ixi-for-sale" }
  };

  const indexes = buildAosSystemIndexes({
    aosObjects: [equipment, legacyForSale],
    ownedListings: []
  });

  assert.deepEqual(indexes.map(index => index.objectId), [equipment.objectId]);
  assert.equal(isIXIAosWorkspaceVisibleAdapter(equipment), true);
  assert.equal(isIXIAosWorkspaceVisibleAdapter(legacyForSale), false);

  const work = fs.readFileSync(
    new URL("../pages/aos/work.js", import.meta.url),
    "utf8"
  );
  const registry = fs.readFileSync(
    new URL(
      "../components/ixi-mos/workspace/useIXIAosWorkspaceRegistry.js",
      import.meta.url
    ),
    "utf8"
  );
  assert.match(work, /\.filter\(isIXIAosWorkspaceVisibleAdapter\)/u);
  assert.match(registry, /shouldRegisterAosWorkspaceObject/u);
  assert.match(registry, /preserveAosOwnedListingPresentations/u);
});

test("unresolved backing presentation preserves Equipment and Locations System Indexes", () => {
  const unresolvedSystemIndexObject = adapterId => ({
    objectId: `object_${adapterId}`,
    entityId: "entity-star-and-sons",
    status: "active",
    metadata: { systemIndex: true, adapterId },
    presentation: { kind: "unresolved-presentation" }
  });
  const projectedIndex = (adapterId, indexId) => ({
    objectId: `object_${adapterId}`,
    indexId,
    metadata: {
      systemIndexPresentation: true,
      adapterId
    }
  });

  for (const [adapterId, indexId] of [
    ["ixi-owned-equipment", "equipment"],
    ["ixi-owned-locations", "locations"]
  ]) {
    assert.equal(shouldRegisterAosWorkspaceObject({
      admittedObject: unresolvedSystemIndexObject(adapterId),
      projectedIndex: projectedIndex(adapterId, indexId)
    }), true);
  }

  assert.equal(shouldRegisterAosWorkspaceObject({
    admittedObject: {
      objectId: "object_unresolved_machine",
      entityId: "entity-star-and-sons",
      status: "active",
      metadata: {},
      presentation: { kind: "unresolved-presentation" }
    },
    projectedIndex: null
  }), false);
});

test("Locations consumes IX-Core's corroborated legacy rail projection without rewriting it", () => {
  const locations = {
    objectId: "object_locations",
    passportId: "IXI5F64883",
    entityId: "entity-star-and-sons",
    displayName: "LOCATIONS",
    status: "active",
    objectType: "system-index",
    canonicalAdmissionVerified: true,
    aliases: [],
    metadata: {
      systemIndex: true,
      adapterId: "ixi-owned-locations"
    }
  };
  const yard = {
    objectId: "object_wichita",
    passportId: "IXIYRPT5YY",
    entityId: "entity-star-and-sons",
    displayName: "Wichita Falls Yard",
    status: "active",
    canonicalAdmissionVerified: true,
    aliases: [],
    metadata: {},
    presentation: { templateNumber: 7 }
  };
  const objects = [locations, yard];
  const admission = buildAosCanonicalAdmission({ aosObjects: objects });
  const indexes = buildAosSystemIndexes({
    aosObjects: objects,
    canonicalAdmission: admission,
    railProjections: {
      [locations.objectId]: {
        railOwnerObjectId: locations.objectId,
        railOwnerPassportId: locations.passportId,
        members: [{
          objectId: yard.objectId,
          passportId: yard.passportId,
          relationshipId: "relationship_legacy",
          relationshipStatus: "active",
          behaviorId: null,
          migrationEvidence: {
            kind: "legacy-direct-container-corroborated.v1",
            readOnly: true
          }
        }]
      }
    }
  });
  const locationsIndex = indexes.find(index => index.objectId === locations.objectId);

  assert.ok(locationsIndex);
  assert.equal(locationsIndex.itemCount, 1);
  assert.deepEqual(locationsIndex.items.map(item => item.objectId), [yard.objectId]);
  assert.equal(locationsIndex.items[0].passportId, yard.passportId);
});

test("frontend migration bridge reads only corroborated legacy membership", () => {
  const locations = {
    objectId: "object_locations",
    passportId: "IXI5F64883",
    entityId: "entity-star-and-sons",
    displayName: "LOCATIONS",
    status: "active",
    canonicalAdmissionVerified: true,
    aliases: []
  };
  const admittedObject = (objectId, passportId, directContainerId) => ({
    objectId,
    passportId,
    entityId: "entity-star-and-sons",
    displayName: objectId,
    status: "active",
    canonicalAdmissionVerified: true,
    aliases: [],
    directContainerId
  });
  const wichita = admittedObject(
    "object_wichita",
    "IXIYRPT5YY",
    locations.objectId
  );
  const unrelated = admittedObject(
    "object_unrelated",
    "IXIABC2345",
    "object_somewhere_else"
  );
  const admission = buildAosCanonicalAdmission({
    aosObjects: [locations, wichita, unrelated]
  });
  const relationships = [wichita, unrelated].map((object, index) => ({
    relationshipId: `relationship_${index}`,
    sourceObjectId: object.objectId,
    targetObjectId: locations.objectId,
    behaviorId: null,
    status: "active"
  }));

  assert.deepEqual(getAosCorroboratedLegacyMembershipObjectIds({
    parentObjectId: locations.objectId,
    relationships,
    admission
  }), [wichita.objectId]);
});
