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
  const response = dialog.indexOf(
    'await fetch("/api/marketplace/share-email"'
  );
  const completed = dialog.lastIndexOf("listing_share_completed");
  const failed = dialog.lastIndexOf("listing_share_failed");

  assert.ok(requested > -1);
  assert.ok(response > requested);
  assert.ok(completed > response);
  assert.ok(failed > completed);
});

test("Text Passport presents explicit one-time consent before provider activation", () => {
  const dialog = read("components/passport/PassportEmailDialog.jsx");
  const provider = read("components/ixi-marketplace/ListingShareProvider.jsx");
  const proof = read("pages/text-passport-consent.js");

  assert.match(dialog, /Recipient mobile number/u);
  assert.match(dialog, /I requested this one-time machine Passport text/u);
  assert.match(dialog, /One SMS\/MMS per request/u);
  assert.match(dialog, /Message and data rates may apply/u);
  assert.match(dialog, /Reply STOP to opt out or HELP for help/u);
  assert.match(dialog, /Consent is not a\s+condition of purchase/u);
  assert.match(dialog, /does not sell or share your\s+mobile number/u);
  assert.match(dialog, /844-430-IRON/u);
  assert.match(dialog, /if \(!textDeliveryEnabled\)/u);
  assert.match(dialog, /No message was sent/u);
  assert.match(
    dialog,
    /await fetch\("\/api\/marketplace\/share-text"/u
  );
  assert.match(
    provider,
    /NEXT_PUBLIC_IXI_TEXT_PASSPORT_ENABLED === "true"/u
  );
  assert.match(proof, /initialChannel="text"/u);
  assert.match(proof, /textDeliveryEnabled=\{false\}/u);
});

test("Text Passport legal surfaces disclose the transactional program", () => {
  const privacy = read("pages/privacy.js");
  const terms = read("pages/terms.js");

  for (const source of [privacy, terms]) {
    assert.match(source, /one message per\s+request/iu);
    assert.match(source, /Message and data rates may apply/u);
    assert.match(source, /Reply STOP to opt out or\s+HELP\s+for help/u);
    assert.match(source, /Consent is not a condition of purchase/u);
  }
  assert.match(
    privacy,
    /does not sell or share mobile numbers with third\s+parties for their marketing/iu
  );
});

test("only machine-card families wire their rails to Passport email", () => {
  const rail = read("components/IXIMachineRail.js");
  const marketplace = read(
    "components/ixi-machine-card/marketplace/MarketplaceListingCard.js"
  );
  const privateCard = read(
    "components/ixi-machine-card/private/PrivateListingCard.js"
  );
  const auction = read(
    "components/ixi-machine-card/auction/AuctionListingCard.js"
  );

  assert.doesNotMatch(rail, /openIXIPassportEmail/u);
  assert.match(rail, /onRailSend\?\.\(listing\)/u);
  assert.match(marketplace, /onRailSend=\{openMarketplaceDistribution\}/u);
  assert.match(privateCard, /onRailSend=\{openIXIPassportEmail\}/u);
  assert.match(auction, /onRailSend=\{openIXIPassportEmail\}/u);
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

test("Post Free preview cannot claim delivery before a Passport exists", () => {
  const provider = read(
    "components/ixi-marketplace/ListingShareProvider.jsx"
  );
  const dialog = read("components/passport/PassportEmailDialog.jsx");

  assert.match(provider, /post-free-preview/u);
  assert.match(
    provider,
    /Post this machine to create its Passport before emailing\./u
  );
  assert.match(dialog, /Post machine first/u);
  assert.match(dialog, /status === "sending" \|\| unavailableReason/u);
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
