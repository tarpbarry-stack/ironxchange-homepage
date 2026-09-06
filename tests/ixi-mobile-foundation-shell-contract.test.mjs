import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  IXI_CONSOLE_SLOT_TYPES,
  createConsoleSlot,
  normalizeSingleSideConsoleSlots
} from "../components/ixi-chassis/IXIObjectConsoleEngine.js";

const app = fs.readFileSync("pages/_app.js", "utf8");
const shell = fs.readFileSync(
  "components/ixi-mobile/IXIMobileShell.jsx",
  "utf8"
);
const navbar = fs.readFileSync("components/Navbar.js", "utf8");
const environmentRail = fs.readFileSync(
  "components/IXIEnvironmentRail.js",
  "utf8"
);
const chassis = fs.readFileSync(
  "components/ixi-chassis/IXIChassis.js",
  "utf8"
);
const browse = fs.readFileSync("pages/browse-v2.js", "utf8");
const machineCardRouter = fs.readFileSync(
  "components/ixi-machine-card/IXIMachineCard.js",
  "utf8"
);
const marketplaceCard = fs.readFileSync(
  "components/ixi-machine-card/marketplace/MarketplaceListingCard.js",
  "utf8"
);
const board = fs.readFileSync(
  "components/ixi-chassis/IXIBoard.js",
  "utf8"
);
const fitWidthShell = fs.readFileSync(
  "components/ixi-mobile/IXIFitWidthObjectShell.jsx",
  "utf8"
);
const browseConsoleRouter = fs.readFileSync(
  "components/ixi-marketplace/IXIBrowseObjectConsoleRouter.jsx",
  "utf8"
);
const marketplaceConsole = fs.readFileSync(
  "components/ixi-machine-object/IXIMarketplaceObjectConsole.jsx",
  "utf8"
);
const consoleEngine = fs.readFileSync(
  "components/ixi-chassis/IXIObjectConsoleEngine.js",
  "utf8"
);
const marketplaceBoard = browse.match(
  /<IXIBoard\s+cardContext="marketplace"[\s\S]*?\/>/u
)?.[0] || "";

test("one shared mobile foundation is mounted by the real app", () => {
  assert.match(app, /<IXIMobileShell\s*\/>/u);
  assert.match(app, /viewport-fit=cover/u);
  assert.match(shell, /data-ixi-mobile-shell="foundation"/u);
  assert.match(shell, /aria-label="IXI mobile navigation"/u);
});

test("the mobile dock routes to the four real IXI areas", () => {
  assert.match(shell, /href: "\/browse-v2"/u);
  assert.match(shell, /href: "\/account\/my-listings-v2"/u);
  assert.match(shell, /href: "\/auction-market"/u);
  assert.match(shell, /href: "\/aos\/work"/u);
});

test("Foundation removes squeezed desktop chrome from phone presentation", () => {
  assert.match(navbar, /\.header-tools \{\s*display: none;/u);
  assert.match(environmentRail, /\.ixi-environment-rail \{\s*display: none;/u);
  assert.match(chassis, /\.ixi-command-chassis \{\s*display: none;/u);
  assert.match(shell, /env\(safe-area-inset-bottom\)/u);
  assert.match(shell, /min-height: 54px/u);
});

test("Foundation proves one real production card without cloning it", () => {
  assert.match(browse, /export default function BrowseV2/u);
  assert.match(browse, /cardContext="marketplace"/u);
  assert.match(browse, /IXISortableMachineCard/u);
  assert.match(machineCardRouter, /MarketplaceListingCard/u);
  assert.doesNotMatch(shell, /import\s+.*(?:MobileCard|MachineCard)/u);
  assert.doesNotMatch(shell, /<(?:MobileCard|MachineCard)/u);
});

test("mobile preserves the desktop Marketplace price and location row", () => {
  const mobileRules = marketplaceCard.match(
    /@media \(max-width: 850px\) \{[\s\S]*?\n        \}/u
  )?.[0] || "";

  assert.match(mobileRules, /\.price-row \{\s*flex-wrap: nowrap;/u);
  assert.match(mobileRules, /\.meta \{\s*width: auto;\s*min-width: 0;/u);
  assert.match(mobileRules, /\.location-input \{\s*width: 72px;\s*text-align: right;/u);
  assert.doesNotMatch(mobileRules, /\.meta \{\s*width: 100%;/u);
});

test("real Marketplace cards and assembled Consoles fit their mobile grid cell", () => {
  assert.match(marketplaceBoard, /enableCardScaling=\{true\}/u);
  assert.match(marketplaceBoard, /fitCardScalingToCell=\{isMobileCardPresentation\}/u);
  assert.match(marketplaceBoard, /fillCardScalingToCell=\{[\s\S]*?mobileCardDensity === "I"/u);
  assert.match(browse, /\.ixi-console-expanded\) \{\s*grid-column: 1 \/ -1;/u);
  assert.match(board, /fitCardScalingToCell/u);
  assert.match(fitWidthShell, /ResizeObserver/u);
  assert.match(fitWidthShell, /availableWidth \/ width/u);
  assert.match(fitWidthShell, /getViewportAvailableWidth/u);
  assert.match(fitWidthShell, /contain: inline-size/u);
  assert.match(fitWidthShell, /fillAvailableWidth/u);
  assert.match(fitWidthShell, /max-width: 100%/u);
  assert.doesNotMatch(fitWidthShell, /MOBILE_VIEWPORT_GUTTER|100dvw/u);
  assert.match(browseConsoleRouter, /IXIFitWidthObjectShell/u);
  assert.match(marketplaceConsole, /nativeWidth=\{consoleNativeWidth\}/u);
});

test("mobile Marketplace permits one Console side and switches sides without adding a third panel", () => {
  assert.match(consoleEngine, /export function normalizeSingleSideConsoleSlots/u);
  assert.match(marketplaceConsole, /useMobileSingleSideConsole/u);
  assert.match(marketplaceConsole, /normalizeSingleSideConsoleSlots\(\s*consoleSlots,\s*\{\s*side/u);
  assert.match(marketplaceConsole, /useMobileSingleSideConsole\s*\? 2\s*: IXI_CONSOLE_MAX_DEPTH/u);
  assert.match(marketplaceConsole, /!useMobileSingleSideConsole &&\s*!atCapacity/u);
});

test("mobile Marketplace scroll wins unless touch drag is intentionally held", () => {
  assert.match(browse, /MouseSensor/u);
  assert.match(browse, /TouchSensor/u);
  assert.match(browse, /MOBILE_TOUCH_HOLD_MS = 500/u);
  assert.match(browse, /MOBILE_TOUCH_TOLERANCE_PX = 5/u);
  assert.match(browse, /\.ixi-mobile-current-card-board \.ixi-board-sortable-card\) \{\s*touch-action: manipulation;/u);
  assert.match(browse, /padding-left: 2px;/u);
  assert.match(browse, /padding-right: 2px;/u);
});

test("two-column Marketplace cards keep four pixels clear around every side actuator", () => {
  assert.match(
    browse,
    /\.ixi-board-surface\.ixi-mobile-current-card-board-ii\) \{[\s\S]*?gap: 10px 8px;[\s\S]*?padding-left: 4px;[\s\S]*?padding-right: 4px;/u
  );
  assert.match(browse, /-webkit-user-select: none;/u);
  assert.match(browse, /user-select: none;/u);
});

test("single-side normalization preserves the real Console while moving it around the listing", () => {
  const listing = createConsoleSlot({
    type: IXI_CONSOLE_SLOT_TYPES.LISTING
  });
  const module = createConsoleSlot({
    slotId: "module-preserved",
    face: 3
  });
  const extraModule = createConsoleSlot({
    slotId: "module-removed",
    face: 4
  });

  const left = normalizeSingleSideConsoleSlots(
    [module, listing, extraModule],
    { side: "left" }
  );
  const right = normalizeSingleSideConsoleSlots(
    left,
    { side: "right" }
  );

  assert.equal(left.length, 2);
  assert.equal(left[0].slotId, "module-preserved");
  assert.equal(left[1].type, IXI_CONSOLE_SLOT_TYPES.LISTING);
  assert.equal(right.length, 2);
  assert.equal(right[0].type, IXI_CONSOLE_SLOT_TYPES.LISTING);
  assert.equal(right[1].slotId, "module-preserved");
  assert.equal(right[1].face, 3);
});
