import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(
  new URL("../components/ixi-aos/cards/generic/IXIAosGenericObjectLayout007.jsx", import.meta.url),
  "utf8"
);

test("Card 008 does not reuse its durable ID as a subtitle", () => {
  assert.match(source, /BUSINESS_IDENTIFIER_FIELD_ID/u);
  assert.match(source, /!isBusinessIdentifier\(definition\)/u);
  assert.doesNotMatch(source, /subtitle:\s*subtitle\s*\|\|\s*next/u);
});

test("customer fields retain their labels instead of receiving positional meanings", () => {
  assert.match(source, /details:\s*definitions\.filter/u);
  assert.match(source, /presentationFields\.details\.map/u);
  assert.match(source, /definition\.label/u);
});
