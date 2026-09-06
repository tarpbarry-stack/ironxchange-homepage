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
