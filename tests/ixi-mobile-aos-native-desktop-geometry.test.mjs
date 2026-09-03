import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync("pages/mobile-aos-native.js", "utf8");
const privateCard = fs.readFileSync("components/ixi-machine-card/private/PrivateListingCard.js", "utf8");

test("AOS mobile certification uses exact native private geometry", () => {
  assert.match(page, /PRIVATE_NATIVE_WIDTH = 300/);
  assert.match(page, /PRIVATE_NATIVE_HEIGHT = 475/);
  assert.match(page, /1\.000×/);
  assert.match(page, /transform: none/);
  assert.doesNotMatch(page, /scale\(/);
});

test("mobile certification restores compact desktop location inputs", () => {
  assert.match(privateCard, /\.city-input\s*\{\s*width: 76px;/s);
  assert.match(privateCard, /\.state-input\s*\{\s*width: 27px;/s);
  assert.match(privateCard, /maxLength=\{2\}/);
  assert.match(page, /\.state-input[\s\S]*width: 27px !important/);
  assert.match(page, /\.city-input[\s\S]*width: 76px !important/);
});

test("owned private Face 1 hides obsolete lifecycle row on certification surface", () => {
  assert.match(page, /\.seller-actions \{\s*display: none !important;/s);
  assert.match(page, /machineFace=\{1\}/);
});
