import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const adapter = read("components/ixi-aos/card-runtime/IXIAosDataContractCardAdapter.jsx");
const resolver = read("components/ixi-aos/card-runtime/IXIAosParentIdentity.js");
const card008 = read("components/ixi-aos/cards/008/IXIAosCard008Profile.jsx");

test("real AOS parent identity uses canonical IXI yellow", () => {
  assert.match(adapter, /\.ixi-aos-runtime-parent-line[\s\S]*?color:\s*#ffc400/u);
  assert.match(adapter, /parentDisplayName\s*\?/u);
  assert.match(adapter, /aria-label="Parent"/u);
});

test("parent resolver never invents FaceLab stock taxonomy", () => {
  assert.match(resolver, /explicitParentLabel/u);
  assert.match(resolver, /parentDisplayName/u);
  assert.doesNotMatch(resolver, /LOCATIONS|PERSONNEL|EQUIPMENT|RECORD/u);
});

test("Card 008 consumes the shared numbered-card adapter", () => {
  assert.match(card008, /IXIAosDataContractCardAdapter/u);
  assert.doesNotMatch(card008, /parentDisplayName\s*=\s*["']/u);
});

test("FaceLab remains unchanged when no real parent exists", () => {
  assert.match(adapter, /parentDisplayName\s*\?\s*\(/u);
  assert.match(adapter, /has-real-parent/u);
});
