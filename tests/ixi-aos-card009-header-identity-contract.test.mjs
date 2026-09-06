import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const cardSource = fs.readFileSync(
  new URL("../components/ixi-aos/cards/009/IXIAosCard009.jsx", import.meta.url),
  "utf8"
);
const identitySource = fs.readFileSync(
  new URL("../components/ixi-aos/card-runtime/modules/IXIAosCardHeaderIdentity.jsx", import.meta.url),
  "utf8"
);
const visualCorrectionsSource = fs.readFileSync(
  new URL("../components/ixi-aos/card-runtime/modules/IXIAosLocationVisualCorrections.jsx", import.meta.url),
  "utf8"
);
const operatingResolverSource = fs.readFileSync(
  new URL("../components/ixi-aos/card-runtime/IXIAosOperatingCardResolver.mjs", import.meta.url),
  "utf8"
);

test("Cards 009 and 009B use the canonical library header alignment", () => {
  assert.doesNotMatch(cardSource, /card-009-header-identity/u);
  assert.match(identitySource, /\.ixi-aos-header-ixi-number\{position:absolute;top:7px;right:9px;z-index:190/u);
  assert.match(identitySource, /\.ixi-aos-header-identity-shell \.ixi-aos-card-header-controls\)\{top:17px!important\}/u);
  assert.doesNotMatch(identitySource, /\.card-009-header-identity/u);
  assert.match(operatingResolverSource, /"aos-card-009b": 9/u);
});

test("Card 009 does not cover the live IXI identity with synthetic text", () => {
  assert.doesNotMatch(visualCorrectionsSource, /\.ixi-card-009 \.c009-header::after/u);
  assert.doesNotMatch(visualCorrectionsSource, /content:"IXI - XXXXXX"/u);
});
