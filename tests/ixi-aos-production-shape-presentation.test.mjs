import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  buildAosCanonicalAdmission,
  preserveAosOwnedListingPresentations
} from "../lib/mos/ixiAosCanonicalAdmission.mjs";
import {
  buildAosSystemIndexes
} from "../lib/mos/buildAosSystemIndexes.js";
import {
  isIXIAosWorkspaceVisibleAdapter
} from "../lib/mos/IXIAosSystemAdapterRegistry.js";

const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function passportFor(index) {
  return `IXIABC234${alphabet[index]}`;
}

function admittedMachine(index) {
  const listingId = `historical-listing-${index + 1}`;
  const passportId = passportFor(index);
  const historicallyBound = index >= 20;

  return {
    objectId: `object_machine_${index + 1}`,
    passportId,
    entityId: "entity-star-and-sons",
    displayName: `Machine ${index + 1}`,
    status: "active",
    canonicalAdmissionVerified: true,
    aliases: historicallyBound
      ? [{ sourceType: "sharetribe-listing", sourceId: listingId }]
      : [],
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

test("all owned equipment stays visible as Private cards while unresolved joins stay non-operational", () => {
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
    3
  );
  assert.equal(
    admitted.filter(object => object.presentation.kind === "aos-numbered-card").length,
    0
  );
  assert.equal(
    admitted.filter(object => object.presentation.kind === "unresolved-presentation").length,
    20
  );
  assert.equal(presentations.length, 23);
  assert.equal(
    presentations.filter(item => item.presentation.kind === "ixi-private-machine").length,
    23
  );
  assert.equal(
    presentations.filter(item => item.canonicalIdentityStatus === "unresolved").length,
    20
  );
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
  assert.match(registry, /if \(!isIXIAosWorkspaceVisibleAdapter\(admittedObject\)\) continue;/u);
  assert.match(registry, /presentation\?\.kind === "unresolved-presentation"/u);
  assert.match(registry, /preserveAosOwnedListingPresentations/u);
});
