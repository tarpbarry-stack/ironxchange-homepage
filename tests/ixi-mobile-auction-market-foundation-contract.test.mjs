import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync(
  "pages/auction-market/index.js",
  "utf8"
);
const auctionWorkPage = fs.readFileSync(
  "pages/auction-work/index.js",
  "utf8"
);
const auctionConsole = fs.readFileSync(
  "components/ixi-auction-object/IXIAuctionObjectConsole.jsx",
  "utf8"
);
const auctionCard = fs.readFileSync(
  "components/ixi-machine-card/auction/AuctionListingCard.js",
  "utf8"
);
const presentation = fs.readFileSync(
  "components/ixi-machine-card/resolveMachineCardPresentation.js",
  "utf8"
);
const board = fs.readFileSync(
  "components/ixi-chassis/IXIBoard.js",
  "utf8"
);
const actuator = fs.readFileSync(
  "components/ixi-chassis/IXIObjectCardActuator.jsx",
  "utf8"
);
const listingEngine = fs.readFileSync(
  "lib/listings/IXIListingsEngine.js",
  "utf8"
);
const listingApi = fs.readFileSync(
  "pages/api/listings.js",
  "utf8"
);
const auctionBoard = page.match(
  /<IXIBoard\s+items=\{visibleSellerListings\}[\s\S]*?\/>/u
)?.[0] || "";
const auctionWorkBoard = auctionWorkPage.match(
  /<IXIBoard\s+items=\{visibleSavedListings\}[\s\S]*?\/>/u
)?.[0] || "";

test("Auction Market loads real public Auction machines instead of an empty source", () => {
  assert.match(page, /isPublicAuctionMachine/u);
  assert.match(page, /publicListingSurface:[\s\S]*?"auction-market"/u);
  assert.match(listingEngine, /publicListingSurface/u);
  assert.match(listingEngine, /encodeURIComponent\(surface\)/u);
  assert.match(listingApi, /publicMachineChannel =[\s\S]*?"auction-market"[\s\S]*?"auction"[\s\S]*?: "marketplace"/u);
  assert.match(listingApi, /machineChannel === publicMachineChannel/u);
  assert.match(page, /listingStatus !== "deleted"/u);
  assert.match(page, /listingStatus !== "archived"/u);
  assert.doesNotMatch(page, /const auctionMarketListings = useMemo\(\(\) => \{\s*return \[\];/u);
  assert.match(page, /const boardObjects = useMemo\(\(\) => \{\s*return auctionMarketListings;/u);
});

test("the production Auction Market owns the mobile I and II presentation", () => {
  assert.match(page, /aria-label="Auction Market card density"/u);
  assert.match(page, /ixi-mobile-auction-card-board/u);
  assert.match(auctionBoard, /cardContext="auction-market"/u);
  assert.match(auctionBoard, /fitCardScalingToCell=\{isMobileCardPresentation\}/u);
  assert.match(auctionBoard, /fillCardScalingToCell=\{[\s\S]*?mobileCardDensity === "I"/u);
  assert.match(page, /ixi-mobile-auction-card-board-i\) \{[\s\S]*?padding-left: 4px;[\s\S]*?padding-right: 4px;/u);
  assert.match(page, /ixi-mobile-auction-card-board-ii\) \{[\s\S]*?gap: 10px 4px;[\s\S]*?padding-left: 2px;[\s\S]*?padding-right: 2px;/u);
  assert.match(page, /className="desktop-card-scale-control"/u);
});

test("authenticated Auction Work applies the same mobile contract to owned Auction cards", () => {
  assert.match(auctionWorkPage, /\/api\/account-listings\?authorId=/u);
  assert.match(auctionWorkPage, /getMachineChannel\(item\) ===[\s\S]*?IXI_MACHINE_CHANNELS\.AUCTION/u);
  assert.match(auctionWorkPage, /aria-label="Auction Work card density"/u);
  assert.match(auctionWorkBoard, /cardContext="auction-work"/u);
  assert.match(auctionWorkBoard, /fitCardScalingToCell=\{isMobileCardPresentation\}/u);
  assert.match(auctionWorkBoard, /fillCardScalingToCell=\{[\s\S]*?mobileCardDensity === "I"/u);
  assert.match(auctionWorkPage, /ixi-mobile-auction-work-card-board-i\) \{[\s\S]*?padding-left: 4px;[\s\S]*?padding-right: 4px;/u);
  assert.match(auctionWorkPage, /ixi-mobile-auction-work-card-board-ii\) \{[\s\S]*?gap: 10px 4px;[\s\S]*?padding-left: 2px;[\s\S]*?padding-right: 2px;/u);
  assert.match(auctionWorkPage, /MouseSensor/u);
  assert.match(auctionWorkPage, /TouchSensor/u);
  assert.doesNotMatch(auctionWorkPage, /PointerSensor/u);
});

test("Auction Market uses the real 300 by 475 Auction family without enabling operator edits", () => {
  assert.match(auctionCard, /height: 475px;/u);
  assert.match(presentation, /cardContext === "auction-market"/u);
  assert.match(auctionCard, /const canEditAuction =[\s\S]*?cardContext === "auction-work"/u);
  assert.match(auctionCard, /sellerMode=\{canEditAuction\}/u);
  assert.match(board, /cardContext === "auction-market"[\s\S]*?\? "tall"/u);
});

test("Auction mobile Console is one side and the complete assembly fits its cell", () => {
  assert.match(auctionConsole, /AUCTION_NATIVE_PANEL_WIDTH =\s*300/u);
  assert.match(auctionConsole, /AUCTION_NATIVE_HEIGHT =\s*475/u);
  assert.match(auctionConsole, /normalizeSingleSideConsoleSlots/u);
  assert.match(auctionConsole, /useMobileSingleSideConsole/u);
  assert.match(auctionConsole, /IXIFitWidthObjectShell/u);
  assert.match(auctionConsole, /nativeWidth=\{consoleNativeWidth\}/u);
  assert.match(auctionConsole, /nativeHeight=\{AUCTION_NATIVE_HEIGHT\}/u);
  assert.match(auctionConsole, /normalizeSingleSideConsoleSlots\(\s*consoleSlots,\s*\{\s*side/u);
});

test("Auction scrolling wins until intentional hold and scaled actuators keep a 44 pixel target", () => {
  assert.match(page, /MouseSensor/u);
  assert.match(page, /TouchSensor/u);
  assert.match(page, /MOBILE_TOUCH_HOLD_MS = 500/u);
  assert.match(page, /MOBILE_TOUCH_TOLERANCE_PX = 5/u);
  assert.match(page, /touch-action: manipulation;/u);
  assert.doesNotMatch(page, /PointerSensor/u);
  assert.match(actuator, /auction-listing-card[\s\S]*?44px/u);
});
