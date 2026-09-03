import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  getIXIMobileCardGeometry,
  resolveIXIMobileSingleCardMetrics
} from "../lib/ixi-mobile/IXIMobileRuntime.mjs";

const privateCardSource = fs.readFileSync(
  new URL("../components/ixi-machine-card/private/PrivateListingCard.js", import.meta.url),
  "utf8"
);
const ownerRuntimeSource = fs.readFileSync(
  new URL("../components/ixi-machine-card/private/IXIOwnedPrivateListingRuntime.jsx", import.meta.url),
  "utf8"
);
const transactRuntimeSource = fs.readFileSync(
  new URL("../components/ixi-machine-card/private/IXIOwnedPrivateTransactRuntime.jsx", import.meta.url),
  "utf8"
);
const mobileRouteSource = fs.readFileSync(
  new URL("../pages/mobile-aos-foundation.js", import.meta.url),
  "utf8"
);

test("private AOS native mobile geometry is 300x475", () => {
  assert.deepEqual(getIXIMobileCardGeometry("private"), {
    nativeWidth: 300,
    nativeHeight: 475
  });

  const metrics = resolveIXIMobileSingleCardMetrics({
    viewportWidth: 390,
    cardFamily: "private"
  });

  assert.equal(metrics.nativeWidth, 300);
  assert.equal(metrics.nativeHeight, 475);
  assert.ok(metrics.renderedHeight > 400);
});

test("production private seller card retains native 475px shell", () => {
  assert.match(privateCardSource, /\.card\.seller-mode\s*\{[\s\S]*height:\s*475px;/);
  assert.match(privateCardSource, /min-height:\s*475px;/);
  assert.match(privateCardSource, /max-height:\s*475px;/);
});

test("production owned-object toolbar remains + EDIT $ : and opens TRAN$ACT", () => {
  assert.match(privateCardSource, /className="seller-owner-toolbar"/);
  assert.match(privateCardSource, />\+<\/button>/);
  assert.match(privateCardSource, />EDIT<\/button>/);
  assert.match(privateCardSource, /title="TRAN\$ACT"/);
  assert.match(privateCardSource, /onOpenTransact\?\.\(listing\)/);
  assert.match(privateCardSource, />:<\/button>/);
});

test("owned runtime swaps same object into production TRAN$ACT runtime and can close", () => {
  assert.match(ownerRuntimeSource, /if \(transactOpen\)/);
  assert.match(ownerRuntimeSource, /<IXIOwnedPrivateTransactRuntime/);
  assert.match(ownerRuntimeSource, /object=\{transactObject\}/);
  assert.match(ownerRuntimeSource, /onClose=\{\(\) => setTransactOpen\(false\)\}/);
  assert.match(transactRuntimeSource, /<IXITransactObjectConsole/);
  assert.match(transactRuntimeSource, /onClose=\{onClose\}/);
});

test("mobile AOS certification route uses private family 300x475 envelope", () => {
  assert.match(mobileRouteSource, /const CARD_FAMILY = "private"/);
  assert.match(mobileRouteSource, /cardFamily: CARD_FAMILY/);
  assert.match(mobileRouteSource, /data-native-geometry="300x475"/);
  assert.match(mobileRouteSource, /cardContext="inventory"/);
  assert.match(mobileRouteSource, /sellerMode/);
  assert.doesNotMatch(mobileRouteSource, /nativeHeight:\s*400/);
});
