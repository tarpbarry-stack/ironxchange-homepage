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

test("only workspace-visible system adapters use durable IX Core object and Passport identity", () => {
  const equipment = {
    objectId: "object-equipment",
    entityId: "entity-1",
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
    entityId: "entity-1",
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

  assert.equal(indexes.length, 1);
  assert.equal(indexes[0].indexId, "equipment");
  assert.equal(indexes[0].objectId, "object-equipment");
  assert.equal(indexes[0].identities[0].passportId, "IXI7777777");
  assert.equal(indexes.some(index => index.objectId === "object-for-sale"), false);
});

test("workspace adapter behavior never overwrites the customer's persisted ecosystem names", () => {
  const equipment = {
    objectId: "object-equipment-custom-name",
    entityId: "entity-1",
    objectType: "system-index",
    displayName: "MY IRON",
    status: "active",
    identities: [passportIdentity("object-equipment-custom-name", "IXI7777779")],
    metadata: {
      systemIndex: true,
      adapterId: "ixi-owned-equipment"
    }
  };
  const forSale = {
    objectId: "object-for-sale-custom-name",
    entityId: "entity-1",
    objectType: "system-index",
    displayName: "READY TO SELL",
    status: "active",
    identities: [passportIdentity("object-for-sale-custom-name", "IXI7777782")],
    metadata: {
      systemIndex: true,
      adapterId: "ixi-for-sale"
    }
  };

  const indexes = buildAosSystemIndexes({
    aosObjects: [equipment, forSale],
    ownedListings: []
  });

  assert.equal(indexes[0].displayName, "MY IRON");
  assert.equal(indexes[0].label, "MY IRON");
  assert.equal(indexes.some(index => index.displayName === "READY TO SELL"), false);
});

test("a durable system index without a customer-visible name fails closed", () => {
  assert.throws(
    () => buildAosSystemIndexes({
      aosObjects: [{
        objectId: "object-equipment-missing-name",
        entityId: "entity-1",
        objectType: "system-index",
        status: "active",
        identities: [passportIdentity("object-equipment-missing-name", "IXI7777783")],
        metadata: {
          systemIndex: true,
          adapterId: "ixi-owned-equipment"
        }
      }],
      ownedListings: []
    }),
    error => error?.code === "AOS_SYSTEM_INDEX_NAME_REQUIRED"
  );
});

test("browser-only synthetic system indexes are not manufactured", () => {
  assert.deepEqual(
    buildAosSystemIndexes({ aosObjects: [], ownedListings: [] }),
    []
  );
});

test("persisted System Index membership comes from canonical rail projections only", () => {
  const index = {
    objectId: "object-customer-index",
    entityId: "entity-1",
    objectType: "system-index",
    displayName: "Wichita Falls",
    status: "active",
    identities: [passportIdentity("object-customer-index", "IXIWFT2345")],
    metadata: { systemIndex: true }
  };
  const projected = {
    objectId: "object-ripper",
    entityId: "entity-1",
    objectType: "machine",
    displayName: "Ripper",
    status: "active",
    identities: [passportIdentity("object-ripper", "IXIRPR2345")]
  };
  const legacyOnly = {
    objectId: "object-legacy-child",
    entityId: "entity-1",
    displayName: "Legacy Child",
    status: "active",
    directContainerId: index.objectId,
    identities: [passportIdentity("object-legacy-child", "IXIWGC2345")]
  };

  const [result] = buildAosSystemIndexes({
    aosObjects: [index, projected, legacyOnly],
    ownedListings: [],
    railProjections: {
      [index.objectId]: {
        members: [{ objectId: projected.objectId }]
      }
    }
  });

  assert.deepEqual(result.items.map(item => item.objectId), [projected.objectId]);
  assert.equal(result.itemCount, 1);
});

test("Equipment membership is governed by its rail projection while Sharetribe supplies presentation only", () => {
  const equipment = {
    objectId: "object-equipment-governed",
    entityId: "entity-1",
    objectType: "system-index",
    displayName: "MY EQUIPMENT",
    status: "active",
    identities: [passportIdentity("object-equipment-governed", "IXIEQP2345")],
    metadata: { systemIndex: true, adapterId: "ixi-owned-equipment" }
  };
  const projected = {
    objectId: "object-current-machine",
    entityId: "entity-1",
    objectType: "machine",
    displayName: "Canonical title",
    status: "active",
    identities: [
      passportIdentity("object-current-machine", "IXIMCH2345"),
      {
        identityType: "external-record",
        sourceType: "sharetribe-listing",
        sourceId: "listing-current"
      }
    ]
  };
  const currentListing = {
    id: "listing-current",
    title: "Current private presentation",
    attributes: { state: "published", price: { amount: 2500000 } }
  };
  const unrelatedListing = {
    id: "listing-not-a-member",
    title: "Must not enter Equipment",
    attributes: { state: "published" }
  };

  const [index] = buildAosSystemIndexes({
    aosObjects: [equipment, projected],
    ownedListings: [currentListing, unrelatedListing],
    railProjections: {
      [equipment.objectId]: {
        members: [{ objectId: projected.objectId, passportId: "IXIMCH2345" }]
      }
    }
  });

  assert.equal(index.itemCount, 1);
  assert.deepEqual(index.items.map(item => item.objectId), [projected.objectId]);
  assert.equal(index.items[0].presentation.kind, "ixi-private-machine");
  assert.equal(index.items[0].presentation.sourceAdapterId, "ixi.sharetribe-owned-machine.v1");
  assert.equal(index.items[0].presentationSource, currentListing);
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

test("AOS TRAN$ACT resolves the same canonical Passport shown on the card", () => {
  const source = fs.readFileSync(
    new URL(
      "../components/ixi-machine-card/private/IXIOwnedPrivateTransactRuntime.jsx",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(source, /getCanonicalAosPassportId/u);
  assert.match(source, /const passportId = getCanonicalAosPassportId\(object\)/u);
  assert.doesNotMatch(source, /const passportId = clean\(object\?\.passportId\)/u);
});

test("AOS startup skips the public Marketplace census and loads governed reads concurrently", () => {
  const environment = fs.readFileSync(
    new URL("../lib/mos/loadIXIMosEnvironment.js", import.meta.url),
    "utf8"
  );
  const listings = fs.readFileSync(
    new URL("../lib/listings/IXIListingsEngine.js", import.meta.url),
    "utf8"
  );

  assert.match(environment, /includePublicListings:\s*false/u);
  assert.match(environment, /Promise\.all\(\[\s*ownedListingsRequest,\s*environmentRequest/u);
  assert.match(listings, /includePublicListings = true/u);
  assert.match(listings, /includePublicListings\s*\?\s*loadPublicListingCollection/u);
});
