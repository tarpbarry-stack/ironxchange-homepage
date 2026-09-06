import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync("pages/browse-v2.js", "utf8");
const router = fs.readFileSync(
  "components/ixi-machine-card/IXIMachineCard.js",
  "utf8"
);
const marketplaceBoard = page.match(
  /<IXIBoard\s+cardContext="marketplace"[\s\S]*?\/>/u
)?.[0] || "";

test("mobile presentation is mounted on the real public Marketplace", () => {
  assert.match(page, /export default function BrowseV2/);
  assert.match(page, /aria-label="Marketplace card density"/);
  assert.match(page, /ixi-mobile-current-card-board/);
  assert.doesNotMatch(page, /MobileBoardCertificationPage/);
});

test("I and II change only the surrounding card presentation", () => {
  assert.match(page, /resolveMobileCardScaleMode/);
  assert.match(page, /width >= 424\) return "focus"/);
  assert.match(page, /width >= 364\) return "work"/);
  assert.match(page, /width >= 392 \? "compact" : "micro"/);
  assert.match(page, /data-ixi-mobile-card-density/);
});

test("current cards still use the canonical family router", () => {
  assert.match(router, /AuctionListingCard/);
  assert.match(router, /PrivateListingCard/);
  assert.match(router, /MarketplaceListingCard/);
  assert.match(page, /cardContext="marketplace"/);
  assert.match(page, /IXIBrowseObjectConsoleRouter/);
});

test("existing DnD owns movement and the overlay owns the top plane", () => {
  assert.match(page, /MouseSensor/);
  assert.match(page, /TouchSensor/);
  assert.match(page, /distance:\s*6/);
  assert.match(page, /MOBILE_TOUCH_HOLD_MS = 500/);
  assert.match(page, /MOBILE_TOUCH_TOLERANCE_PX = 5/);
  assert.match(page, /delay:\s*MOBILE_TOUCH_HOLD_MS/);
  assert.match(page, /tolerance:\s*MOBILE_TOUCH_TOLERANCE_PX/);
  assert.match(page, /IXIDragEngine/);
  assert.match(page, /overlayZIndex=\{1000000\}/);
  assert.match(page, /IXISortableMachineCard/);
});

test("Mode I owns exactly two pixels beside both card actuators", () => {
  assert.match(
    page,
    /\.ixi-board-surface\.ixi-mobile-current-card-board-i\) \{[\s\S]*?padding-left: 2px;[\s\S]*?padding-right: 2px;/u
  );
  assert.match(marketplaceBoard, /fitCardScalingToCell=\{isMobileCardPresentation\}/u);
  assert.match(marketplaceBoard, /fillCardScalingToCell=\{[\s\S]*?mobileCardDensity === "I"/u);
});
