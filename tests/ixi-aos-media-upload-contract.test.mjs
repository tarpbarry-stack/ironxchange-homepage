import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  IXI_AOS_MEDIA_ACCEPT,
  IXI_AOS_MEDIA_MAX_IMAGE_BYTES,
  mapIXIMediaManifestToAosMedia,
  resolveIXIAosMediaContentType,
  resolveIXIAosMediaIdentity,
  validateIXIAosMediaFile
} from "../lib/media/ixiAosMediaContract.mjs";

test("AOS media accepts exactly the IX Core direct-upload image formats", () => {
  assert.equal(IXI_AOS_MEDIA_ACCEPT, ".jpg,.jpeg,.png,.webp,.avif,.heic,.heif");
  assert.equal(resolveIXIAosMediaContentType({ name: "yard.HEIC", type: "" }), "image/heic");
  assert.equal(resolveIXIAosMediaContentType({ name: "machine.jpg", type: "image/jpeg" }), "image/jpeg");
  assert.equal(resolveIXIAosMediaContentType({ name: "document.gif", type: "image/gif" }), "");
});

test("AOS media enforces the canonical 20 MB source limit before upload", () => {
  assert.deepEqual(
    validateIXIAosMediaFile({ name: "yard.png", type: "image/png", size: IXI_AOS_MEDIA_MAX_IMAGE_BYTES }),
    { contentType: "image/png", fileName: "yard.png", sizeBytes: IXI_AOS_MEDIA_MAX_IMAGE_BYTES }
  );
  assert.throws(
    () => validateIXIAosMediaFile({ name: "yard.png", type: "image/png", size: IXI_AOS_MEDIA_MAX_IMAGE_BYTES + 1 }),
    /20 MB limit/u
  );
  assert.throws(
    () => validateIXIAosMediaFile({ name: "yard.gif", type: "image/gif", size: 100 }),
    /JPG, JPEG, PNG, WebP, AVIF, HEIC, or HEIF/u
  );
});

test("AOS media binds an Object upload to its Object ID and Passport", () => {
  assert.deepEqual(resolveIXIAosMediaIdentity({
    objectId: "object-yard-1",
    identities: [
      { identityType: "other", passportId: "IGNORE" },
      { identityType: "ixi-passport", passportId: "IXI-YARD-1" }
    ]
  }), {
    machineId: "object-yard-1",
    passportId: "IXI-YARD-1"
  });
  assert.throws(() => resolveIXIAosMediaIdentity({}), /must be saved/u);
});

test("canonical IXI Media manifest becomes compact AOS media references", () => {
  const item = mediaId => ({
    mediaId,
    display: { url: `https://media.example/${mediaId}.webp`, width: 1200, height: 800, contentType: "image/webp" },
    hero: { url: `https://media.example/${mediaId}-hero.webp` },
    thumb: { url: `https://media.example/${mediaId}-thumb.webp` },
    original: { url: `https://media.example/${mediaId}.jpg`, contentType: "image/jpeg" }
  });
  const media = mapIXIMediaManifestToAosMedia({
    machineId: "object-yard-1",
    passportId: "IXI-YARD-1",
    mediaVersion: 7,
    heroMediaId: "photo-b",
    orderedMediaIds: ["photo-a", "photo-b"],
    media: [item("photo-a"), item("photo-b")]
  });
  assert.deepEqual(media.map(entry => entry.mediaId), ["photo-b", "photo-a"]);
  assert.equal(media[0].url, "https://media.example/photo-b.webp");
  assert.equal(media[0].canonical, true);
  assert.equal(media[0].manifestVersion, 7);
  assert.equal(JSON.stringify(media).includes("data:image"), false);
});

test("AOS photo UI uses direct-upload proxies and never serializes a base64 image", async () => {
  const files = await Promise.all([
    readFile(new URL("../lib/media/ixiMediaClient.js", import.meta.url), "utf8"),
    readFile(new URL("../pages/api/media/uploads/init.js", import.meta.url), "utf8"),
    readFile(new URL("../pages/api/media/uploads/complete.js", import.meta.url), "utf8"),
    readFile(new URL("../components/ixi-aos/card-runtime/modules/IXIAosPrimaryMediaEditor.jsx", import.meta.url), "utf8")
  ]);
  const source = files.join("\n");
  assert.match(source, /\/media\/uploads\/init/u);
  assert.match(source, /\/media\/uploads\/complete/u);
  assert.match(source, /method: "PUT"/u);
  assert.doesNotMatch(source, /readAsDataURL/u);
});
