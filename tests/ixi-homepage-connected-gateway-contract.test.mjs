import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const homepage = fs.readFileSync(
  "components/homepage/ConnectedHomepage.js",
  "utf8"
);
const styles = fs.readFileSync(
  "components/homepage/ConnectedHomepage.module.css",
  "utf8"
);
const index = fs.readFileSync("pages/index.js", "utf8");
const browse = fs.readFileSync("pages/browse-v2.js", "utf8");

test("homepage is the connected Marketplace, AOS, and TRAN$ACT gateway", () => {
  assert.match(index, /ConnectedHomepage/u);
  assert.match(homepage, /MOVE<br\/>MACHINES/u);
  assert.match(homepage, /MARKETPLACE/u);
  assert.match(homepage, /RUN THE WORK/u);
  assert.match(homepage, /CONTROL THE MONEY/u);
  assert.match(homepage, /THE MACHINE IS THE CENTER<br\/>OF THE SYSTEM/u);
  assert.doesNotMatch(homepage, /AUCTION/u);
});

test("the same Passport-backed machine connects all three product zones", () => {
  assert.match(homepage, /<HeroMarketplace machine=\{machine\}/u);
  assert.match(homepage, /<HeroAos machine=\{machine\}/u);
  assert.match(homepage, /<HeroTransact machine=\{machine\}/u);
  assert.match(homepage, /<MarketplaceZone machine=\{machine\}/u);
  assert.match(homepage, /<AosZone machine=\{machine\}/u);
  assert.match(homepage, /<TransactZone machine=\{machine\}/u);
  assert.match(homepage, /passportId/u);
});

test("homepage search carries query and category into the real Marketplace", () => {
  assert.match(homepage, /params\.set\("q", q\)/u);
  assert.match(homepage, /params\.set\("category", category\)/u);
  assert.match(homepage, /router\.push\(suffix \? `\/browse-v2\?\$\{suffix\}` : "\/browse-v2"\)/u);
  assert.match(browse, /params\.get\("q"\)/u);
  assert.match(browse, /params\.get\("category"\)/u);
  assert.match(browse, /setSearchQuery\(homepageQuery\)/u);
  assert.match(browse, /category: homepageCategory/u);
});

test("homepage preserves desktop fidelity and explicitly supports mobile", () => {
  assert.match(styles, /\.hero\s*\{[\s\S]*?min-height:\s*910px/u);
  assert.match(styles, /\.platformGrid\s*\{[\s\S]*?grid-template-columns:\s*1\.02fr 1\.08fr 1fr/u);
  assert.match(styles, /@media\s*\(max-width:\s*900px\)/u);
  assert.match(styles, /@media\s*\(max-width:\s*560px\)/u);
  assert.match(styles, /@media\s*\(prefers-reduced-motion:\s*reduce\)/u);
  assert.match(homepage, /viewport-fit=cover/u);
});
