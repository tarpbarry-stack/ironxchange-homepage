import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const card004 = fs.readFileSync(
  new URL("../components/ixi-aos/cards/004/IXIAosCard004Personnel.jsx", import.meta.url),
  "utf8"
);

const face1 = fs.readFileSync(
  new URL("../components/ixi-aos/cards/004/IXIAosCard004CommercialFace1.jsx", import.meta.url),
  "utf8"
);

const face1Runtime = fs.readFileSync(
  new URL("../components/ixi-aos/card-runtime/modules/IXIAosFace1CardRuntime.jsx", import.meta.url),
  "utf8"
);

const inlineEditor = fs.readFileSync(
  new URL("../components/ixi-aos/card-runtime/modules/IXIAosInlineFace1Editor.jsx", import.meta.url),
  "utf8"
);

test("CT-260904-000009 removes only Card 004's duplicate adapter ID overlay", () => {
  assert.match(card004, /<IXIAosDataContractCardAdapter \{\.\.\.props\} showBusinessIdentifier=\{false\}>/u);
  assert.match(card004, /includeBusinessIdentifier fixedBusinessIdentifierLabel allowAddFields/u);
});

test("Card 004 uses its designated Face 1 summary controller", () => {
  assert.match(card004, /import IXIAosCard004CommercialFace1/u);
  assert.match(card004, /<IXIAosCard004CommercialFace1/u);
  assert.match(card004, /stretchRelationships/u);
});

test("Card 004 divides the existing summary shell into ID and open positions", () => {
  assert.match(face1, /grid-template-rows:1fr 1fr/u);
  assert.match(face1, /border-bottom:1px solid #252a26/u);
  assert.match(face1, /<small>ID<\/small>/u);
  assert.match(face1, /<small>OPEN POSITIONS<\/small>/u);
});

test("Open positions comes from object data and the field extension stays off", () => {
  assert.match(face1, /const openJobsDefinition = rawDefinitions\.find/u);
  assert.match(face1, /fields\?\.\[openJobsDefinition\.fieldId\] \?\? 0/u);
  assert.match(face1, /showFieldExtension = false/u);
  assert.match(face1, /\{showFieldExtension \? <div className="c004-field-extension"/u);
});

test("Card 004 Edit keeps ID fixed while its canonical value remains editable", () => {
  assert.match(card004, /includeBusinessIdentifier fixedBusinessIdentifierLabel allowAddFields/u);
  assert.match(face1Runtime, /fixedBusinessIdentifierLabel=\{fixedBusinessIdentifierLabel\}/u);
  assert.match(inlineEditor, /<span className="ixi-inline-fixed-label">ID<\/span>/u);
  assert.match(inlineEditor, /value=\{draft\[definition\.fieldId\] \?\? ""\}/u);
  assert.match(inlineEditor, /!fixedBusinessId \? <button/u);
  assert.match(inlineEditor, /label: fixedBusinessIdentifierLabel && isBusinessIdentifier\(definition\)[\s\S]*?\? "ID"/u);
});
