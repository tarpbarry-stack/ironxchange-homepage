import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Card 018 is a V12 Equipment Index backed by the canonical System Index card", async () => {
  const card = await read("components/ixi-aos/cards/018/IXIAosCard018.jsx");
  assert.match(card, /cardNumber:\s*18/);
  assert.match(card, /version:\s*12/);
  assert.match(card, /IXISystemIndexCard/);
  assert.match(card, /onExposeContents/);
  assert.match(card, /onGatherContents/);
  assert.match(card, /onReturnContents/);
  assert.match(card, /onSavePresentation/);
  assert.match(card, /\.ixi-card-018:after/);
  assert.match(card, /Inter Variable/);
  assert.match(card, /IXIAosCardHeaderIdentity/);
  assert.match(card, /IXIAosCardHeaderControls/);
  assert.match(card, /IXIObjectRail/);
  assert.match(card, /system-index-card>\.board-command-rail/);
});

test("Card 018 is registered in FaceLab, runtime resolution, and operating-card delivery", async () => {
  const [catalog, preview, resolver, runtime, identity, admission] = await Promise.all([
    read("components/ixi-aos-card-library/IXIAosCardCatalogClient.js"),
    read("components/ixi-aos-card-library/IXIAosCardCatalogPreview.jsx"),
    read("components/ixi-aos/card-runtime/IXIAosOperatingCardResolver.mjs"),
    read("components/ixi-aos/card-runtime/IXIAosOperatingCardRuntime.jsx"),
    read("components/ixi-aos/card-runtime/IXIAosCardIdentityFace.jsx"),
    read("components/ixi-aos/card-runtime/IXIAosCommercialAdmissionRegistry.js")
  ]);
  assert.match(catalog, /aos-card-018/);
  assert.match(preview, /IXIAosCard018/);
  assert.match(preview, /if \(cardNumber === 18\) return \[\]/);
  assert.doesNotMatch(preview, /c018-machine-/);
  assert.match(resolver, /"aos-card-018":\s*18/);
  assert.match(runtime, /18:\s*IXIAosCard018/);
  assert.match(identity, /Math\.min\(18/);
  assert.match(admission, /"018":/);
});
