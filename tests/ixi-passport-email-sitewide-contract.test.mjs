import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("one global Passport email provider owns the shared dialog", () => {
  const app = read("pages/_app.js");
  const browse = read("pages/browse-v2.js");
  const provider = read(
    "components/ixi-marketplace/ListingShareProvider.jsx"
  );

  assert.match(app, /<ListingShareProvider>/u);
  assert.match(provider, /<PassportEmailDialog/u);
  assert.match(provider, /IXI_PASSPORT_EMAIL_EVENT/u);
  assert.doesNotMatch(browse, /<ListingShareProvider>/u);
  assert.doesNotMatch(provider, /buildMarketplaceSmsHref/u);
  assert.doesNotMatch(provider, /buildMarketplaceWhatsAppHref/u);
});

test("Passport delivery telemetry completes only after confirmed success", () => {
  const dialog = read("components/passport/PassportEmailDialog.jsx");
  const requested = dialog.indexOf("listing_share_email_requested");
  const response = dialog.indexOf("await fetch");
  const completed = dialog.indexOf("listing_share_completed");
  const failed = dialog.indexOf("listing_share_failed");

  assert.ok(requested > -1);
  assert.ok(response > requested);
  assert.ok(completed > response);
  assert.ok(failed > completed);
});

test("every IXI machine-card rail falls back to Passport email", () => {
  const rail = read("components/IXIMachineRail.js");

  assert.match(rail, /openIXIPassportEmail\(listing\)/u);
  assert.match(rail, /if \(onRailSend\)/u);
  assert.match(rail, /aria-label="Email machine Passport"/u);
});

test("Marketplace cards use the shared Passport email event", () => {
  const card = read(
    "components/ixi-machine-card/marketplace/MarketplaceListingCard.js"
  );

  assert.match(card, /openIXIPassportEmail\(listingToShare\)/u);
  assert.doesNotMatch(
    card,
    /new CustomEvent\(\s*"ixi:marketplace-distribution-open"/u
  );
});

test("machine console Email actions use the same Passport dialog", () => {
  for (const facePath of [
    "components/ixi-machine-object/IXIMachineObjectFace2.js",
    "components/ixi-machine-object/IXIMachineObjectFace3.js"
  ]) {
    const face = read(facePath);
    assert.match(
      face,
      /onEmail=\{\(\) => openIXIPassportEmail\(listing\)\}/u,
      facePath
    );
  }
});

test("Live and the public slug expose the exact Passport email dialog", () => {
  const live = read("pages/live.js");
  const slug = read("pages/listing/[slug].js");
  const postFree = read("pages/post-free.js");

  assert.match(live, /openIXIPassportEmail\(previewListing\)/u);
  assert.match(live, /<strong>Email Passport<\/strong>/u);
  assert.match(slug, /openIXIPassportEmail\(listing\)/u);
  assert.match(slug, /<span>Email Passport<\/span>/u);
  assert.match(postFree, /<IXIMachineCard/u);
});

test("Pocket Send emails the front visible machine without changing placement", () => {
  const helper = read("lib/marketplace/passportEmailEvents.js");
  const pockets = [
    "components/ixi-chassis/IXIPocket.js",
    "components/ixi-chassis/IXIPocketL1.js",
    "components/ixi-chassis/IXIPocketL2.js",
    "components/ixi-chassis/IXIPocketR1.js",
    "components/ixi-chassis/IXIPocketR2.js"
  ];

  assert.match(helper, /machineIds\[machineIds\.length - 1\]/u);
  for (const pocketPath of pockets) {
    const pocket = read(pocketPath);
    assert.match(pocket, /getPocketFrontMachine/u, pocketPath);
    assert.match(pocket, /openIXIPassportEmail/u, pocketPath);
  }
});

test("Active Stack retains movement Send and its cards use the global rail", () => {
  const zone = read("components/ixi-chassis/IXIActiveStackZone.js");
  const stack = read("components/ixi-chassis/IXIActiveStack.js");

  assert.match(zone, /setActiveStackSendMenu/u);
  assert.match(zone, /<IXIActiveStack/u);
  assert.match(stack, /<IXIMachineCard/u);
});
