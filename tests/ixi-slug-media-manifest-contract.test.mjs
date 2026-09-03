import test from "node:test";
import assert from "node:assert/strict";
import { adaptMachineFilePayload } from "../lib/machines/IXIMachineFileAdapter.js";

test("canonical Machine File prefers IXI media manifest over Sharetribe images", () => {
  const payload = {
    machine: {
      passport: {
        passportId: "IXI123456",
        sourceId: "listing-1"
      },
      mediaMachineKey: "IXI123456",
      mediaManifest: {
        heroMediaId: "m1",
        media: [
          { mediaId: "m1", display: { url: "https://ixi.test/1.jpg" } },
          { mediaId: "m2", display: { url: "https://ixi.test/2.jpg" } },
          { mediaId: "m3", display: { url: "https://ixi.test/3.jpg" } }
        ]
      },
      listing: {
        id: { uuid: "listing-1" },
        attributes: {
          title: "2019 CATERPILLAR 420F2",
          publicData: {
            year: "2019",
            make: "CATERPILLAR",
            model: "420F2"
          }
        },
        relationships: {
          images: { data: [{ id: { uuid: "sharetribe-image" } }] }
        }
      },
      included: [
        {
          id: { uuid: "sharetribe-image" },
          type: "image",
          attributes: {
            variants: {
              "scaled-large": { url: "https://sharetribe.test/one.jpg" }
            }
          }
        }
      ]
    }
  };

  const listing = adaptMachineFilePayload(payload);

  assert.equal(listing.ixiMediaSource, "ixi");
  assert.equal(listing.imageUrls.length, 3);
  assert.deepEqual(listing.imageUrls, [
    "https://ixi.test/1.jpg",
    "https://ixi.test/2.jpg",
    "https://ixi.test/3.jpg"
  ]);
  assert.equal(listing.imageObjects[0].hero, true);
});

test("canonical Machine File retains Sharetribe fallback when IXI media is unavailable", () => {
  const payload = {
    machine: {
      passport: { passportId: "IXI654321", sourceId: "listing-2" },
      listing: {
        id: { uuid: "listing-2" },
        attributes: { title: "Machine", publicData: {} },
        relationships: {
          images: { data: [{ id: { uuid: "sharetribe-image" } }] }
        }
      },
      included: [
        {
          id: { uuid: "sharetribe-image" },
          type: "image",
          attributes: {
            variants: {
              "scaled-large": { url: "https://sharetribe.test/one.jpg" }
            }
          }
        }
      ]
    }
  };

  const listing = adaptMachineFilePayload(payload);

  assert.equal(listing.ixiMediaSource, "sharetribe");
  assert.deepEqual(listing.imageUrls, ["https://sharetribe.test/one.jpg"]);
});
