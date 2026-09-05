import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const {
  authorizePassportFirstAsset,
  isCanonicalMosObjectId
} = require("../lib/ixi-freight/ixiFreightProxy.js");

test("the private card never promotes a Sharetribe listing UUID to MOS objectId", () => {
  const source = fs.readFileSync(
    new URL("../components/ixi-machine-card/private/IXIOwnedPrivateListingRuntime.jsx", import.meta.url),
    "utf8"
  );
  const context = fs.readFileSync(
    new URL("../components/ixi-aos/transact/IXITransactContext.js", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /publicData\?\.mosObjectId\s*\|\|\s*getListingId\(listing\)/u);
  assert.match(source, /sourceReference:\s*clean\(getListingId\(listing\)\)/u);
  assert.doesNotMatch(context, /source\.objectId\s*\|\|\s*source\.id/u);
});

test("a canonical MOS Object ID remains only a compatibility hint", async () => {
  const objectId = "object_123e4567-e89b-12d3-a456-426614174000";
  assert.equal(isCanonicalMosObjectId(objectId), true);

  const result = await authorizePassportFirstAsset({
    userId: "user-1",
    body: {
      asset: {
        objectId,
        passportId: "IXI123",
        source: { verified: true, sourceId: "forged" }
      }
    }
  });

  assert.equal(result.asset.objectId, objectId);
  assert.equal(result.asset.source, undefined);
});

test("the gateway converts a legacy listing UUID into verified provenance, never object identity", async () => {
  const result = await authorizePassportFirstAsset({
    userId: "user-1",
    body: {
      asset: {
        objectId: "6a9b2cc3-e7ab-4267-aed0-138cba998dfa",
        passportId: "IXI123",
        label: "2019 CAT 336"
      }
    },
    loadListings: async userId => {
      assert.equal(userId, "user-1");
      return {
        data: [{
          id: { uuid: "6a9b2cc3-e7ab-4267-aed0-138cba998dfa" },
          attributes: { publicData: { passportId: "IXI123" } }
        }]
      };
    }
  });

  assert.equal(result.asset.objectId, "");
  assert.deepEqual(result.asset.source, {
    sourceType: "sharetribe-listing",
    sourceId: "6a9b2cc3-e7ab-4267-aed0-138cba998dfa",
    verified: true
  });
});

test("Passport-only provisioning fails closed when the user does not own the source listing", async () => {
  await assert.rejects(
    authorizePassportFirstAsset({
      userId: "user-1",
      body: { asset: { passportId: "IXI-NOT-OWNED" } },
      loadListings: async () => ({
        data: [{ attributes: { publicData: { passportId: "IXI-OTHER" } } }]
      })
    }),
    error => error?.code === "FREIGHT_ASSET_OWNERSHIP_UNVERIFIED" && error?.status === 403
  );
});
