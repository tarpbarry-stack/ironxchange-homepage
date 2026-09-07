import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { buildAosSystemIndexes } from "../lib/mos/buildAosSystemIndexes.js";

function passportIdentity(objectId, passportId) {
  return {
    identityType: "ixi-passport",
    passportId,
    entityId: "entity-1",
    sourceType: "aos-object",
    sourceId: objectId
  };
}

test("system adapters use durable IX Core object and Passport identity", () => {
  const equipment = {
    objectId: "object-equipment",
    objectType: "system-index",
    displayName: "EQUIPMENT",
    status: "active",
    identities: [passportIdentity("object-equipment", "IXI7777777")],
    metadata: {
      systemIndex: true,
      adapterId: "ixi-owned-equipment"
    }
  };
  const forSale = {
    objectId: "object-for-sale",
    objectType: "system-index",
    displayName: "FOR SALE",
    status: "active",
    identities: [passportIdentity("object-for-sale", "IXI7777778")],
    metadata: {
      systemIndex: true,
      adapterId: "ixi-for-sale"
    }
  };

  const indexes = buildAosSystemIndexes({
    aosObjects: [equipment, forSale],
    ownedListings: []
  });

  assert.equal(indexes.length, 2);
  assert.equal(indexes[0].indexId, "equipment");
  assert.equal(indexes[0].objectId, "object-equipment");
  assert.equal(indexes[0].identities[0].passportId, "IXI7777777");
  assert.equal(indexes[1].objectId, "object-for-sale");
});

test("browser-only synthetic system indexes are not manufactured", () => {
  assert.deepEqual(
    buildAosSystemIndexes({ aosObjects: [], ownedListings: [] }),
    []
  );
});

test("AOS/Work fails closed before rendering an active record without Passport", () => {
  const source = fs.readFileSync(
    new URL("../lib/mos/loadIXIMosEnvironment.js", import.meta.url),
    "utf8"
  );
  assert.match(source, /AOS_IDENTITY_INTEGRITY_FAILED/u);
  assert.match(source, /objectsWithoutPassport/u);
  assert.doesNotMatch(source, /filter\(object => !getCanonicalAosPassportId\(object\)\)\.map/u);
});
