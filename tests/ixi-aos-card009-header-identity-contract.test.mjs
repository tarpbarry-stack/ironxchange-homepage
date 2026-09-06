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

test("Card 009 reserves a dedicated top-right lane for its live IXI identity", () => {
  assert.match(cardSource, /className="card-009-header-identity"/u);
  assert.match(identitySource, /\.card-009-header-identity>\.ixi-aos-header-ixi-number\{top:6px;right:10px;z-index:220/u);
  assert.match(identitySource, /\.card-009-header-identity \.ixi-aos-card-header-controls\)\{top:19px!important\}/u);
});

test("Card 009 does not cover the live IXI identity with synthetic text", () => {
  assert.doesNotMatch(visualCorrectionsSource, /\.ixi-card-009 \.c009-header::after/u);
  assert.doesNotMatch(visualCorrectionsSource, /content:"IXI - XXXXXX"/u);
});
