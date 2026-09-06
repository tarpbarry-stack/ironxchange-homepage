import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

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
  assert.match(browse, /enableCardScaling=\{isMobileCardPresentation\}/u);
  assert.match(browse, /fitCardScalingToCell=\{isMobileCardPresentation\}/u);
  assert.match(browse, /\.ixi-console-expanded\) \{\s*grid-column: 1 \/ -1;/u);
  assert.match(board, /fitCardScalingToCell/u);
  assert.match(fitWidthShell, /ResizeObserver/u);
  assert.match(fitWidthShell, /availableWidth \/ width/u);
  assert.match(browseConsoleRouter, /IXIFitWidthObjectShell/u);
  assert.match(marketplaceConsole, /nativeWidth=\{consoleNativeWidth\}/u);
});
