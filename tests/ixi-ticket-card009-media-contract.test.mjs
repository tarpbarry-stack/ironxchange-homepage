import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(
  new URL("../components/ixi-aos/cards/generic/IXIAosGenericMediaDominant009.jsx", import.meta.url),
  "utf8"
);

test("CT-260904-000004 leaves only business ID and photo action content over Card 009 media", () => {
  assert.match(source, /const businessIdentifier = definitions\.find\(isBusinessIdentifier\) \|\| null;/u);
  assert.match(source, /className="c009-media-id"><span>\{businessIdentifier\?\.label \|\| "ID"\}<\/span><strong>\{businessIdentifierValue \|\| "—"\}<\/strong><\/div>/u);
  assert.doesNotMatch(source, /className="c009-media-id"><span>\{getObjectLabel\(runtimeObject\)\}<\/span><strong>\{getObjectDisplayName\(runtimeObject\)\}/u);
  assert.match(source, /className="c009-photo-action"/u);
});

test("Card 009 media, shell, prior detail layout, relationships, commands, rail, and editor stay intact", () => {
  assert.match(source, /const W = 298;/u);
  assert.match(source, /const H = 471;/u);
  assert.match(source, /className="c009-media"/u);
  assert.match(source, /className="c009-detail-strip"/u);
  assert.match(source, /grid-template-columns:minmax\(0,1\.7fr\) minmax\(0,\.65fr\) minmax\(0,\.8fr\)/u);
  assert.match(source, /className="c009-relations"/u);
  assert.match(source, /className="c009-commands"/u);
  assert.match(source, /<IXIObjectRail/u);
  assert.match(source, /<Card009Editor/u);
});
