import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(
  new URL("../components/ixi-aos/cards/generic/IXIAosGenericMediaDominant009.jsx", import.meta.url),
  "utf8"
);

test("CT-260904-000001 removes only Card 009's year/make/model display row", () => {
  assert.doesNotMatch(source, /className="c009-primary-grid"/u);
  assert.doesNotMatch(source, /const primaryFields =/u);
  assert.match(source, /const secondaryFields = populatedFields\.slice\(3, 6\)/u);
});

test("Card 009 gives serial more width and hours less width", () => {
  assert.match(
    source,
    /\.c009-detail-strip\{flex:0 0 39px;display:grid;grid-template-columns:minmax\(0,1\.7fr\) minmax\(0,\.65fr\) minmax\(0,\.8fr\)/u
  );
});

test("Card 009 enlarges values while preserving the existing header typography", () => {
  assert.match(source, /\.c009-detail span\{[^}]*font-size:4\.5px/u);
  assert.match(source, /\.c009-detail strong\{[^}]*font-size:8px/u);
});

test("Card 009 shell, relationships, commands, rail, and editor remain present", () => {
  assert.match(source, /const W = 298;/u);
  assert.match(source, /const H = 471;/u);
  assert.match(source, /className="c009-relations"/u);
  assert.match(source, /className="c009-commands"/u);
  assert.match(source, /<IXIObjectRail/u);
  assert.match(source, /<Card009Editor/u);
});
