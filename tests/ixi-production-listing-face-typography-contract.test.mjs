import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = path => fs.readFileSync(path, "utf8");

test("production listing typography reaches private and auction secondary faces sitewide", () => {
  const app = read("pages/_app.js");
  const browse = read("pages/browse-v2.js");
  const typography = read("components/ixi-marketplace/IXIMarketplaceFaceTypography.jsx");

  assert.match(app, /import IXIMarketplaceFaceTypography/u);
  assert.match(app, /<IXIMarketplaceFaceTypography \/>/u);
  assert.doesNotMatch(browse, /IXIMarketplaceFaceTypography/u);

  assert.match(typography, /\.private-listing-card/u);
  assert.match(typography, /\.auction-listing-card/u);
  assert.match(typography, /\.mof2/u);
  assert.match(typography, /\.mof3/u);
  assert.match(typography, /\.mof4/u);
  assert.match(typography, /\.aof2/u);
  assert.match(typography, /\.aof3/u);
  assert.match(typography, /\.aof4/u);

  assert.doesNotMatch(typography, /\.mof1/u);
  assert.doesNotMatch(typography, /\.aof1/u);
});
