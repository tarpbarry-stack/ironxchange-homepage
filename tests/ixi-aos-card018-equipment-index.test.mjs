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
  assert.match(card, /\.ixi-card-018:before/);
  assert.match(card, /border:1px solid #454b47/);
  assert.match(card, /Inter Variable/);
  assert.match(card, /IXIAosCardHeaderIdentity/);
  assert.match(card, /IXIAosCardHeaderControls/);
  assert.doesNotMatch(card, /IXIObjectRail/);
  assert.doesNotMatch(card, /system-index-card>\.board-command-rail/);
  assert.match(card, /\.c018-head\{[^}]*height:43px/);
  assert.match(card, /system-index-identity\)\{padding-top:49px/);
  assert.match(card, /<span>SYSTEM INDEX<\/span>/);
});

test("Card 018 leaves the canonical collection deck rail visible and solely responsible for navigation", async () => {
  const [card, systemIndex, sellerYard] = await Promise.all([
    read("components/ixi-aos/cards/018/IXIAosCard018.jsx"),
    read("components/ixi-mos/IXISystemIndexCard.jsx"),
    read("components/ixi-seller-object/IXISellerObjectCard.js")
  ]);

  assert.doesNotMatch(card, /system-index-card>\.board-command-rail\)\{display:none/);
  assert.match(systemIndex, /onCycleMachineFace=\{goForward\}/);
  assert.match(systemIndex, /onRailSend=\{goBackward\}/);
  assert.match(systemIndex, /:\s*goHome/);
  assert.match(systemIndex, /:\s*goEnd/);
  assert.match(sellerYard, /onCycleMachineFace=\{\(\) =>/);
  assert.match(sellerYard, /onRailSend=\{\(\) =>/);
});

test("Card 018 always renders owned equipment through the current inventory machine-card family", async () => {
  const [card, systemIndex, childRouter] = await Promise.all([
    read("components/ixi-aos/cards/018/IXIAosCard018.jsx"),
    read("components/ixi-mos/IXISystemIndexCard.jsx"),
    read("components/ixi-mos/workspace/IXIAosWorkspaceChildCard.jsx")
  ]);

  assert.match(card, /childCardMode = "machine"/);
  assert.match(card, /childCardMode=\{childCardMode\}/);
  assert.match(systemIndex, /forceMachineCard=\{childCardMode === "machine"\}/);
  assert.match(childRouter, /!forceMachineCard &&\s*isDurableMosObject/);
  assert.match(childRouter, /<IXIMachineCard/);
  assert.match(childRouter, /cardContext="inventory"/);
  assert.match(childRouter, /showListingManagementActions=\{false\}/);
});

test("Card 018 equipment deck excludes retired seller-yard lifecycle controls", async () => {
  const [childRouter, privateCard, marketplaceCard] = await Promise.all([
    read("components/ixi-mos/workspace/IXIAosWorkspaceChildCard.jsx"),
    read("components/ixi-machine-card/private/PrivateListingCard.js"),
    read("components/ixi-machine-card/marketplace/MarketplaceListingCard.js")
  ]);

  assert.match(childRouter, /showListingManagementActions=\{false\}/);
  assert.match(
    privateCard,
    /presentation === "seller" && showListingManagementActions && !creationMode/
  );
  assert.match(
    marketplaceCard,
    /sellerMode && showListingManagementActions && !creationMode/
  );
});

test("Card 018 machine browsing removes the container header and loops without an End Deck face", async () => {
  const [card, systemIndex] = await Promise.all([
    read("components/ixi-aos/cards/018/IXIAosCard018.jsx"),
    read("components/ixi-mos/IXISystemIndexCard.jsx")
  ]);

  assert.match(card, /loopChildDeck = true/);
  assert.match(card, /\{isContainerFace \? \(/);
  assert.match(card, /loopChildDeck=\{loopChildDeck\}/);
  assert.match(systemIndex, /loopChildDeck &&\s*activeItemIndex === items\.length - 1/);
  assert.match(systemIndex, /loopChildDeck\s*\? lastChildFace\s*:\s*getLastCollectionFace/);
  assert.match(systemIndex, /forceMachineCard=\{childCardMode === "machine"\}/);
});

test("AOS Work renders the canonical Equipment System Index through Card 018", async () => {
  const board = await read("components/ixi-mos/workspace/IXIAosWorkspaceBoard.jsx");
  assert.match(board, /IXIAosCard018/);
  assert.match(board, /systemAdapter\?\.adapterId ===\s*"ixi-owned-equipment"/);
  assert.match(board, /singularLabel:\s*"SYSTEM INDEX"/);
  assert.match(board, /displayName:\s*"EQUIPMENT"/);
  assert.match(board, /templateSlug:\s*"aos-card-018"/);
  assert.match(board, /cardTemplateSlug:\s*systemIndexCard\.templateSlug/);
  assert.match(board, /children=\{item\?\.items \|\| \[\]\}/);
  assert.match(board, /onExposeObject=\{exposeObject\}/);
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
  assert.match(preview, /cardNumber === 18 \|\| cardNumber === 19/);
  assert.doesNotMatch(preview, /c018-machine-/);
  assert.match(resolver, /"aos-card-018":\s*18/);
  assert.match(runtime, /18:\s*IXIAosCard018/);
  assert.match(identity, /Math\.min\(19/);
  assert.match(admission, /"018":/);
});
