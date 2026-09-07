import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  buildAosCanonicalAdmission
} from "../lib/mos/ixiAosCanonicalAdmission.mjs";
import {
  buildAosSystemIndexes
} from "../lib/mos/buildAosSystemIndexes.js";

const read = file => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

function canonicalObject(overrides = {}) {
  return {
    objectId: "object-location",
    passportId: "IXIWCT2345",
    entityId: "entity-1",
    displayName: "Wichita Falls",
    status: "active",
    permissions: {},
    ...overrides
  };
}

test("canonical AOS objects and System Indexes hydrate with zero Sharetribe listings", () => {
  const location = canonicalObject();
  const index = canonicalObject({
    objectId: "object-system-index",
    passportId: "IXISYX2345",
    displayName: "Customer Index",
    metadata: {
      systemIndex: true,
      adapterId: "ixi-owned-equipment"
    }
  });
  const admission = buildAosCanonicalAdmission({
    aosObjects: [location, index],
    workspaceListings: []
  });
  const indexes = buildAosSystemIndexes({
    aosObjects: [location, index],
    ownedListings: [],
    railProjections: {},
    canonicalAdmission: admission
  });

  assert.equal(admission.objectsById.size, 2);
  assert.equal(admission.unresolvedListings.length, 0);
  assert.equal(indexes.length, 1);
  assert.equal(indexes[0].objectId, index.objectId);
  assert.deepEqual(indexes[0].items, []);

  const work = read("pages/aos/work.js");
  assert.doesNotMatch(work, /!workspaceListings\.length\s*\|\|\s*!systemIndexes\.length/u);
  assert.match(work, /!systemIndexes\.length && !aosObjects\.length/u);
});
