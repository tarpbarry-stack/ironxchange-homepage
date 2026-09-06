import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync(
  "pages/account/my-listings-v2.js",
  "utf8"
);
const router = fs.readFileSync(
  "components/ixi-machine-card/IXIMachineCard.js",
  "utf8"
);

test("mobile presentation is mounted on real My Inventory V2", () => {
  assert.match(page, /export default function MyListingsV2/);
  assert.match(page, /aria-label="Private inventory card density"/);
  assert.match(page, /ixi-mobile-current-card-board/);
  assert.match(page, /activeEnvironment="INVENTORY"/);
  assert.doesNotMatch(page, /MobileBoardCertificationPage/);
});

test("I and II reuse the certified sitewide presentation contract", () => {
  assert.match(page, /resolveMobileCardScaleMode/);
  assert.match(page, /width >= 424\) return "focus"/);
  assert.match(page, /width >= 364\) return "work"/);
  assert.match(page, /width >= 392 \? "compact" : "micro"/);
  assert.match(page, /data-ixi-mobile-card-density/);
  assert.match(page, /"ixi-mobile-card-density"/);
});

test("Private cards and seller operations remain canonical", () => {
  assert.match(router, /PrivateListingCard/);
  assert.match(page, /cardContext="inventory"/);
  assert.match(page, /useIXISellerMachineOps/);
  assert.match(page, /getSellerListingCardProps/);
  assert.match(page, /\/api\/account-listings/);
});

test("existing DnD owns movement and its overlay owns the top plane", () => {
  assert.match(page, /PointerSensor/);
  assert.match(page, /distance:\s*6/);
  assert.match(page, /IXIDragEngine/);
  assert.match(page, /overlayZIndex=\{1000000\}/);
  assert.match(page, /IXISortableMachineCard/);
});
