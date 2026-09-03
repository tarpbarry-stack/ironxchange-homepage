import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync("pages/aos/mobile-console.js", "utf8");
const consoleSource = fs.readFileSync("components/ixi-private-object/IXIPrivateObjectConsole.jsx", "utf8");
const scaler = fs.readFileSync("components/ixi-mobile/IXIImmutableScaledSurface.jsx", "utf8");

test("mobile console invariant reuses canonical Console and immutable scaler", () => {
  assert.match(page, /IXIPrivateObjectConsole/);
  assert.match(page, /IXIImmutableScaledSurface/);
  assert.match(page, /nativeWidth=\{nativeWidth\}/);
  assert.match(page, /nativeHeight=\{475\}/);
  assert.match(scaler, /ResizeObserver/);
});

test("mobile console invariant never permits three visible slots", () => {
  assert.match(page, /requestedSlots\.length <= 2/);
  assert.match(page, /requestedSlots\.slice\(-2\)/);
  assert.match(page, /requestedSlots\.slice\(0, 2\)/);
  assert.match(page, /previousListingIndex === 1/);
  assert.match(page, /previousListingIndex === 0/);
});

test("canonical private Console remains desktop-native and multi-slot capable", () => {
  assert.match(consoleSource, /IXI_CONSOLE_MAX_DEPTH/);
  assert.match(consoleSource, /PRIVATE_NATIVE_PANEL_WIDTH =\s*300/);
  assert.match(consoleSource, /PRIVATE_NATIVE_HEIGHT =\s*475/);
});

test("authenticated route loads current user's owned private inventory only", () => {
  assert.match(page, /sdk\.currentUser\.show\(\)/);
  assert.match(page, /api\/account-listings\?authorId=/);
  assert.match(page, /isOwnedPrivateCandidate/);
  assert.doesNotMatch(page, /api\/listings/);
});
