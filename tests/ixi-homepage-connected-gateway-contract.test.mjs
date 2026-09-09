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

test("one product-faithful IXI Marketplace tableau distributes through the system", () => {
  assert.match(homepage, /function HeroMarketplaceTableau/u);
  assert.match(homepage, /IXI CONSOLE/u);
  assert.match(homepage, /DISTRIBUTE/u);
  assert.match(homepage, /<MarketplaceVisual listing=\{listing\}/u);
  assert.match(homepage, /fetch\("\/api\/listings"/u);
  assert.match(homepage, /passportId/u);
  assert.doesNotMatch(homepage, /IXIBrowseObjectConsoleRouter/u);
  assert.doesNotMatch(homepage, /ListingShareProvider/u);
});

test("the gateway doors contain three product-faithful marketing tableaux", () => {
  assert.match(homepage, /className=\{styles\.heroDoorObjects\}/u);
  assert.match(homepage, /<HeroMarketplaceTableau listing=\{listing\}/u);
  assert.match(homepage, /<HeroAosTableau listing=\{listing\}/u);
  assert.match(homepage, /<HeroTransactTableau listing=\{listing\}/u);
  assert.match(homepage, /IXI CONSOLE/u);
  assert.match(homepage, /AOS CONSOLE/u);
  assert.match(homepage, /FINANCIAL CONSOLE/u);
  assert.match(homepage, /LIVE<\/span><b>PRIV<\/b><span>AUCT/u);
  assert.match(homepage, /ACQUIRE/u);
  assert.doesNotMatch(homepage, /IXIPrivateObjectConsole/u);
  assert.doesNotMatch(homepage, /IXITransactObjectConsole/u);
});

test("each complete gateway bay is one outlined product link", () => {
  assert.match(homepage, /function GatewayHitAreas/u);
  assert.match(homepage, /aria-label="Enter the IXI Marketplace"/u);
  assert.match(homepage, /aria-label="Enter IXI AOS"/u);
  assert.match(homepage, /aria-label="Enter IXI TRAN\$ACT"/u);
  assert.match(homepage, /className=\{styles\.gatewayHitAreas\}/u);
  assert.match(styles, /\.gatewayHitArea\{[\s\S]*?border:1px solid/u);
  assert.match(styles, /\.gatewayHitArea:hover/u);
  assert.match(styles, /\.gatewayHitArea:focus-visible/u);
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
  assert.match(homepage, /className=\{styles\.transactIdentity\}/u);
  assert.match(homepage, /ONE PASSPORT · COMPLETE FINANCIAL CONTROL/u);
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
