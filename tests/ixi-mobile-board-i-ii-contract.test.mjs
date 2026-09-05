import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync("pages/aos/mobile-board.js", "utf8");
const scaler = fs.readFileSync("components/ixi-mobile/IXIImmutableScaledSurface.jsx", "utf8");
const geometry = fs.readFileSync("lib/ixiObjectGeometry.js", "utf8");

test("board uses authenticated current-user owned private inventory", () => {
  assert.match(page, /sdk\.currentUser\.show\(\)/);
  assert.match(page, /api\/account-listings\?authorId=/);
  assert.match(page, /isOwnedPrivateCandidate/);
  assert.match(page, /hydrateIXIListingMedia/);
  assert.doesNotMatch(page, /api\/listings/);
});

test("I and II modes reuse the same production machine card", () => {
  assert.match(page, /IXIMachineCard/);
  assert.match(page, /layoutMode === "II"/);
  assert.match(page, /board-one/);
  assert.match(page, /board-two/);
  assert.doesNotMatch(page, /MobileMachineCard|ComparisonCard|MobilePrivateCard/);
});

test("every machine remains an immutable native 300x475 surface", () => {
  assert.match(page, /<IXIScaledCardShell[\s\S]*?objectFamily="private"/);
  assert.match(geometry, /private:\s*\{\s*nativeWidth:\s*300,\s*nativeHeight:\s*475/u);
  assert.match(page, /cardContext="inventory"/);
  assert.match(page, /sellerMode/);
  assert.match(scaler, /ResizeObserver/);
  assert.match(scaler, /transform: `scale\(\$\{scale\}\)`/);
});

test("II mode is a two-column board rather than horizontal machine swipe", () => {
  assert.match(page, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.doesNotMatch(page, /overflow-x:\s*auto/);
  assert.doesNotMatch(page, /scroll-snap-type/);
});
