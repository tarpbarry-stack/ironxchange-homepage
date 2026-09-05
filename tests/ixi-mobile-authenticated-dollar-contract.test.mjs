import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync("pages/aos/mobile-dollar.js", "utf8");
const scaler = fs.readFileSync("components/ixi-mobile/IXIImmutableScaledSurface.jsx", "utf8");
const ownedRuntime = fs.readFileSync("components/ixi-machine-card/private/IXIOwnedPrivateListingRuntime.jsx", "utf8");

test("authenticated mobile dollar gate uses current user inventory only", () => {
  assert.match(page, /sdk\.currentUser\.show\(\)/);
  assert.match(page, /\/api\/account-listings\?authorId=/);
  assert.doesNotMatch(page, /\/api\/listings/);
  assert.doesNotMatch(page, /MAX_AUTHOR_PROBES/);
});

test("authenticated gate preserves immutable 300x475 owner card", () => {
  assert.match(page, /IXIImmutableScaledSurface nativeWidth=\{300\} nativeHeight=\{475\}/);
  assert.match(page, /cardContext="inventory"/);
  assert.match(page, /sellerMode/);
  assert.match(page, /machineFace=\{1\}/);
  assert.match(scaler, /ResizeObserver/);
});

test("dollar remains the existing owned runtime action", () => {
  assert.match(ownedRuntime, /onOpenTransact=\{\(\) => !saving && setTransactVisibility\(true\)\}/);
  assert.match(ownedRuntime, /IXIOwnedPrivateTransactRuntime/);
  assert.match(ownedRuntime, /onClose=\{\(\) => setTransactVisibility\(false\)\}/);
});
