import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const scaler = fs.readFileSync("components/ixi-mobile/IXIImmutableScaledSurface.jsx", "utf8");
const page = fs.readFileSync("pages/mobile-aos-immutable.js", "utf8");

test("AOS mobile uses one immutable 300x475 coordinate system", () => {
  assert.match(page, /nativeWidth=\{300\}/);
  assert.match(page, /nativeHeight=\{475\}/);
  assert.match(page, /machineFace=\{1\}/);
  assert.match(scaler, /ResizeObserver/);
  assert.match(scaler, /transform-origin: top left/);
  assert.match(scaler, /transform: `scale\(\$\{scale\}\)`/);
});

test("inner private card desktop geometry is firewalled from viewport reflow", () => {
  assert.match(scaler, /\.city-input \{/);
  assert.match(scaler, /width: 100% !important/);
  assert.match(scaler, /\.state-input \{/);
  assert.match(scaler, /width: 27px !important/);
  assert.match(scaler, /\.price-row \{/);
  assert.match(scaler, /flex-wrap: nowrap !important/);
  assert.match(scaler, /\.seller-actions \{/);
  assert.match(scaler, /display: none !important/);
});
