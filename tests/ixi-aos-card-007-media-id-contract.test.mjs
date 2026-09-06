import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(
  new URL("../components/ixi-aos/cards/generic/IXIAosGenericUniversalLayout007.jsx", import.meta.url),
  "utf8"
);
const variantB = fs.readFileSync(
  new URL("../components/ixi-aos/cards/generic/IXIAosGenericUniversalLayout007B.jsx", import.meta.url),
  "utf8"
);
const variantC = fs.readFileSync(
  new URL("../components/ixi-aos/cards/generic/IXIAosGenericUniversalLayout007C.jsx", import.meta.url),
  "utf8"
);
const card = fs.readFileSync(
  new URL("../components/ixi-aos/cards/007/IXIAosCard007EmployeeApplication.jsx", import.meta.url),
  "utf8"
);

test("Card 007 places the canonical business ID at the lower-left of primary media", () => {
  assert.match(source, /const businessIdentifier = definitions\.find\(isBusinessIdentifier\) \|\| null;/u);
  assert.match(source, /showMediaBusinessIdentifier \? <><div className="u007-media-shade" \/><div className="u007-media-id"><span>ID<\/span><strong>\{businessIdentifierValue \|\| "—"\}<\/strong><\/div><\/> : null/u);
  assert.match(source, /\.u007-media-id\{position:absolute;left:8px;right:86px;bottom:7px/u);
});

test("Card 007 does not repeat the business identifier in ordinary details", () => {
  assert.match(source, /showMediaBusinessIdentifier\s+\? definitions\.filter\(definition => !isBusinessIdentifier\(definition\)\)/u);
  assert.match(source, /className="u007-media-action"/u);
  assert.match(source, /<IXIAosPrimaryMediaEditor[\s\S]*?media=\{media\}[\s\S]*?onChange=\{setMedia\}/u);
});

test("007A and 007B use the media ID while 007C places ID first in details", () => {
  assert.match(source, /showMediaBusinessIdentifier = true/u);
  assert.match(variantB, /<IXIAosGenericUniversalLayout007 \{\.\.\.props\} \/>/u);
  assert.match(variantC, /showMediaBusinessIdentifier=\{false\}/u);
  assert.match(card, /showBusinessIdentifier=\{false\}/u);
  assert.match(source, /\[businessIdentifier, \.\.\.definitions\.filter\(definition => !isBusinessIdentifier\(definition\)\)\]\.filter\(Boolean\)/u);
  assert.match(source, /clean\(item\.value\) \|\| isBusinessIdentifier\(item\.definition\)/u);
  assert.match(source, /<span>\{isBusinessIdentifier\(definition\) \? "ID" : definition\.label\}<\/span><strong>\{value \|\| "—"\}<\/strong>/u);
});
