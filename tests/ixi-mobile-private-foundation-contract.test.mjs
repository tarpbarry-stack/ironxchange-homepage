import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync(
  "pages/account/my-listings-v2.js",
  "utf8"
);
const privateConsole = fs.readFileSync(
  "components/ixi-private-object/IXIPrivateObjectConsole.jsx",
  "utf8"
);
const privateCard = fs.readFileSync(
  "components/ixi-machine-card/private/PrivateListingCard.js",
  "utf8"
);
const ownedRuntime = fs.readFileSync(
  "components/ixi-machine-card/private/IXIOwnedPrivateListingRuntime.jsx",
  "utf8"
);
const actuator = fs.readFileSync(
  "components/ixi-chassis/IXIObjectCardActuator.jsx",
  "utf8"
);
const inventoryBoard = page.match(
  /<IXIBoard\s+items=\{visibleSavedListings\}[\s\S]*?\/>/u
)?.[0] || "";

test("the production Private inventory owns the mobile I and II presentation", () => {
  assert.match(page, /aria-label="Private inventory card density"/u);
  assert.match(page, /className="desktop-card-scale-control"/u);
  assert.match(page, /\.desktop-card-scale-control \{[\s\S]*?display: none;/u);
  assert.match(page, /ixi-mobile-private-card-board/u);
  assert.match(inventoryBoard, /cardContext="inventory"/u);
  assert.match(inventoryBoard, /fitCardScalingToCell=\{isMobileCardPresentation\}/u);
  assert.match(inventoryBoard, /fillCardScalingToCell=\{[\s\S]*?mobileCardDensity === "I"/u);
  assert.match(page, /ixi-mobile-private-card-board-i\) \{[\s\S]*?padding-left: 4px;[\s\S]*?padding-right: 4px;/u);
  assert.match(page, /ixi-mobile-private-card-board-ii\) \{[\s\S]*?gap: 10px 4px;[\s\S]*?padding-left: 2px;[\s\S]*?padding-right: 2px;/u);
});

test("Private mobile keeps the immutable 300 by 475 owner runtime", () => {
  assert.match(privateCard, /height: 475px;/u);
  assert.match(privateCard, /className="seller-owner-toolbar"/u);
  assert.match(privateCard, /className="owner-action transact"/u);
  assert.match(ownedRuntime, /IXIOwnedPrivateTransactRuntime/u);
  assert.match(ownedRuntime, /width:298px;min-width:298px;height:471px/u);
  assert.match(ownedRuntime, /onClose=\{\(\) => setTransactVisibility\(false\)\}/u);
});

test("Private Console is one side on mobile and scales as one complete assembly", () => {
  assert.match(privateConsole, /PRIVATE_NATIVE_PANEL_WIDTH =\s*300/u);
  assert.match(privateConsole, /PRIVATE_NATIVE_HEIGHT =\s*475/u);
  assert.match(privateConsole, /normalizeSingleSideConsoleSlots/u);
  assert.match(privateConsole, /useMobileSingleSideConsole/u);
  assert.match(privateConsole, /IXIFitWidthObjectShell/u);
  assert.match(privateConsole, /nativeWidth=\{consoleNativeWidth\}/u);
  assert.match(privateConsole, /nativeHeight=\{PRIVATE_NATIVE_HEIGHT\}/u);
});

test("Private mobile scrolling wins and scaled edge actuators retain a 44 pixel target", () => {
  assert.match(page, /MouseSensor/u);
  assert.match(page, /TouchSensor/u);
  assert.match(page, /MOBILE_TOUCH_HOLD_MS = 500/u);
  assert.match(page, /MOBILE_TOUCH_TOLERANCE_PX = 5/u);
  assert.match(page, /touch-action: manipulation;/u);
  assert.doesNotMatch(page, /PointerSensor/u);
  assert.match(actuator, /private-listing-card[\s\S]*?44px/u);
});
