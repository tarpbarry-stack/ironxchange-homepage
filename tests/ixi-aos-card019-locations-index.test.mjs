import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Card 019 is the V12 Locations System Index composition", async () => {
  const [card019, card018] = await Promise.all([
    read("components/ixi-aos/cards/019/IXIAosCard019.jsx"),
    read("components/ixi-aos/cards/018/IXIAosCard018.jsx")
  ]);

  assert.match(card019, /cardNumber:\s*19/);
  assert.match(card019, /templateSlug:\s*"aos-card-019"/);
  assert.match(card019, /version:\s*12/);
  assert.match(card019, /system-index-locations-container/);
  assert.match(card019, /IXIAosCard018/);
  assert.match(card019, /defaultDisplayName="LOCATIONS"/);
  assert.match(card019, /editHeading="EDIT LOCATIONS INDEX"/);
  assert.match(card019, /childCardMode="object"/);
  assert.match(card019, /loopChildDeck=\{false\}/);
  assert.match(card018, /<span>SYSTEM INDEX<\/span>/);
  assert.match(card018, /IXISystemIndexCard/);
  assert.doesNotMatch(card018, /IXIObjectRail/);
});

test("FaceLab and the operating runtime register Card 019", async () => {
  const [catalog, preview, resolver, runtime, identity, admission] = await Promise.all([
    read("components/ixi-aos-card-library/IXIAosCardCatalogClient.js"),
    read("components/ixi-aos-card-library/IXIAosCardCatalogPreview.jsx"),
    read("components/ixi-aos/card-runtime/IXIAosOperatingCardResolver.mjs"),
    read("components/ixi-aos/card-runtime/IXIAosOperatingCardRuntime.jsx"),
    read("components/ixi-aos/card-runtime/IXIAosCardIdentityFace.jsx"),
    read("components/ixi-aos/card-runtime/IXIAosCommercialAdmissionRegistry.js")
  ]);

  assert.match(catalog, /aos-card-019/);
  assert.match(preview, /IXIAosCard019/);
  assert.match(preview, /cardNumber === 19/);
  assert.match(resolver, /"aos-card-019":\s*19/);
  assert.match(runtime, /19:\s*IXIAosCard019/);
  assert.match(identity, /Math\.min\(19/);
  assert.match(admission, /"019":/);
});

test("AOS Work routes only the Locations System Index through Card 019", async () => {
  const board = await read("components/ixi-mos/workspace/IXIAosWorkspaceBoard.jsx");

  assert.match(board, /IXIAosCard019/);
  assert.match(board, /function isLocationsSystemIndex/);
  assert.match(board, /item\?\.displayName/);
  assert.match(board, /isLocationsSystemIndex\(item, systemAdapter\)/);
  assert.match(board, /displayName:\s*"LOCATIONS"/);
  assert.match(board, /templateSlug:\s*"aos-card-019"/);
  assert.match(board, /cardNumber:\s*19/);
  assert.match(board, /onAddObject=\{/);
  assert.match(board, /children=\{item\?\.items \|\| \[\]\}/);
});
