import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const homepage = fs.readFileSync("components/homepage/ConnectedHomepage.js", "utf8");
const styles = fs.readFileSync("components/homepage/ConnectedHomepage.module.css", "utf8");
const index = fs.readFileSync("pages/index.js", "utf8");

test("homepage is the benefits-led Marketplace, AOS, and TRAN$ACT gateway", () => {
  assert.match(index, /ConnectedHomepage/u);
  assert.match(homepage, /YOUR MACHINE<br \/>IS THE BEGINNING/u);
  assert.match(homepage, /LIST ONCE\. DISTRIBUTE EVERYWHERE/u);
  assert.match(homepage, /OPERATE THE WHOLE BUSINESS/u);
  assert.match(homepage, /CONTROL THE ENTIRE ENTITY/u);
  assert.match(homepage, /ONE MACHINE\. ONE PASSPORT/u);
  assert.doesNotMatch(homepage, /AUCTION/u);
});

test("one real IXI Marketplace object enters and distributes through the system", () => {
  assert.match(homepage, /import IXIMachineCard/u);
  assert.match(homepage, /import IXIBrowseObjectConsoleRouter/u);
  assert.match(homepage, /import ListingShareProvider/u);
  assert.match(homepage, /<IXIMachineCard/u);
  assert.match(homepage, /<IXIBrowseObjectConsoleRouter/u);
  assert.match(homepage, /enableMarketplaceDistribution/u);
  assert.match(homepage, /consoleRightOpen: true/u);
  assert.match(homepage, /<MarketplaceVisual listing=\{listing\}/u);
  assert.match(homepage, /fetch\("\/api\/listings"/u);
  assert.match(homepage, /passportId/u);
  assert.doesNotMatch(homepage, /function PassportCard/u);
});

test("the gateway doors contain the three real IXI product surfaces", () => {
  assert.match(homepage, /className=\{styles\.heroDoorObjects\}/u);
  assert.match(homepage, /<HomepageListingObject listing=\{listing\} location="hero"/u);
  assert.match(homepage, /<HomepagePrivateAosCard listing=\{listing\}/u);
  assert.match(homepage, /<HomepageTransactScreen listing=\{listing\}/u);
  assert.match(homepage, /machineAccess: "private"/u);
  assert.match(homepage, /cardContext="inventory"/u);
  assert.match(homepage, /onMachinePlacementChange/u);
  assert.match(homepage, /showMachineRail/u);
  assert.match(homepage, /import IXIPrivateObjectConsole/u);
  assert.match(homepage, /<IXIPrivateObjectConsole/u);
  assert.match(homepage, /consoleRightOpen: true/u);
  assert.match(homepage, /import IXITransactObjectConsole/u);
  assert.match(homepage, /<IXITransactObjectConsole/u);
  assert.match(homepage, /homepage-transact-workspace/u);
});

test("homepage routes every benefit and conversion into the real product", () => {
  assert.match(homepage, /href="\/browse-v2"/u);
  assert.match(homepage, /href="\/aos\/work"/u);
  assert.match(homepage, /href="\/transact"/u);
  assert.match(homepage, /href="\/post-free"/u);
  assert.match(homepage, /POST A MACHINE — FREE/u);
});

test("homepage provides a complete distribution, operations, and finance story", () => {
  for (const channel of ["MARKETPLACE", "SELLER YARD", "EMAIL", "SMS", "WHATSAPP"]) assert.match(homepage, new RegExp(channel, "u"));
  for (const stage of ["ACQUISITION", "WORK", "EXPENSES", "INVOICE", "SOLD", "SETTLEMENT"]) assert.match(homepage, new RegExp(stage, "u"));
  assert.match(homepage, /THE BUSINESS AROUND THE MACHINE/u);
  assert.match(homepage, /EVERY DOLLAR FOLLOWS THE MACHINE/u);
});

test("homepage preserves desktop fidelity and explicitly supports mobile", () => {
  assert.match(styles, /\.hero\{[\s\S]*?min-height:760px/u);
  assert.match(styles, /\.gatewayJourney\{[\s\S]*?grid-template-columns:1\.16fr \.98fr \.9fr/u);
  assert.match(styles, /@media\(max-width:900px\)/u);
  assert.match(styles, /@media\(max-width:560px\)/u);
  assert.match(styles, /@media\(prefers-reduced-motion:reduce\)/u);
  assert.match(homepage, /viewport-fit=cover/u);
  assert.match(homepage, /fetchPriority="high"/u);
});
