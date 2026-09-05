import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sourceUrl = new URL(
  "../components/ixi-object-system/IXIMachineMutationEngine.js",
  import.meta.url
);
const source = await readFile(sourceUrl, "utf8");
const engine = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);

test("Face 2 keeps a verified description in the normalized private listing", () => {
  const listing = {
    id: "listing-1",
    title: "2021 CATERPILLAR 320",
    description: "Old description",
    publicData: {
      description: "Old description",
      details: "Old description",
      serialNumber: "ABC123"
    },
    imageUrls: ["https://images.example/machine.jpg"]
  };

  const saved = engine.mergeVerifiedMachineFacts({
    listing,
    after: {
      description: "New verified description"
    }
  });

  assert.equal(saved.description, "New verified description");
  assert.equal(saved.publicData.description, "New verified description");
  assert.equal(saved.publicData.details, "New verified description");
  assert.equal(saved.publicData.serialNumber, "ABC123");
  assert.deepEqual(saved.imageUrls, listing.imageUrls);
});

test("owned private saves update both the card runtime and parent inventory", async () => {
  const [runtime, sellerOps] = await Promise.all([
    readFile(new URL("../components/ixi-machine-card/private/IXIOwnedPrivateListingRuntime.jsx", import.meta.url), "utf8"),
    readFile(new URL("../components/ixi-chassis/useIXISellerMachineOps.js", import.meta.url), "utf8")
  ]);

  assert.match(runtime, /mergeVerifiedMachineFacts\(\{\s*listing: runtimeListing,\s*after\s*\}\)/s);
  assert.match(runtime, /props\.onOwnedObjectSaved\?\.\(nextListing, result\)/);
  assert.match(sellerOps, /onOwnedObjectSaved: nextListing => \{/);
  assert.match(sellerOps, /String\(getListingId\(item\)\) === String\(listingId\)[\s\S]*\? nextListing/);
});
