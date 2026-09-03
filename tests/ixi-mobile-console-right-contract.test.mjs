import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync("pages/aos/mobile-console-right.js", "utf8");
const consoleSource = fs.readFileSync("components/ixi-private-object/IXIPrivateObjectConsole.jsx", "utf8");
const scaler = fs.readFileSync("components/ixi-mobile/IXIImmutableScaledSurface.jsx", "utf8");

test("mobile right Console reuses the canonical private Console and immutable scaler", () => {
  assert.match(page, /IXIPrivateObjectConsole/);
  assert.match(page, /IXIImmutableScaledSurface/);
  assert.match(page, /nativeWidth=\{nativeWidth\}/);
  assert.match(page, /nativeHeight=\{475\}/);
  assert.match(scaler, /ResizeObserver/);
});

test("right Console gate is one machine plus one module only", () => {
  assert.match(page, /const nativeWidth = consoleDepth === 2 \? 600 : 300/);
  assert.match(page, /consoleSlots\.length > 2/);
  assert.match(page, /consoleSlots: nextPatch\.consoleSlots\.slice\(0, 2\)/);
  assert.match(page, /ixi-private-console-listing-slot \.ixi-object-card-actuator\.left\{display:none!important\}/);
  assert.match(page, /ixi-private-console-module-slot \.ixi-object-card-actuator\.right\{display:none!important\}/);
});

test("canonical private Console remains desktop-native 300x475", () => {
  assert.match(consoleSource, /PRIVATE_NATIVE_PANEL_WIDTH =\s*300/);
  assert.match(consoleSource, /PRIVATE_NATIVE_HEIGHT =\s*475/);
  assert.match(consoleSource, /display: flex;/);
  assert.match(consoleSource, /flex-direction: row;/);
});

test("authenticated route loads only current user's owned private inventory", () => {
  assert.match(page, /sdk\.currentUser\.show\(\)/);
  assert.match(page, /api\/account-listings\?authorId=/);
  assert.match(page, /isOwnedPrivateCandidate/);
  assert.doesNotMatch(page, /api\/listings/);
});
