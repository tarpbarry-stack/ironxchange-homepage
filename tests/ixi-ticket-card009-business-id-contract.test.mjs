import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(
  new URL("../components/ixi-aos/cards/generic/IXIAosGenericMediaDominant009.jsx", import.meta.url),
  "utf8"
);

test("CT-260904-000006 fixes the Card 009 business-ID label while keeping its value editable", () => {
  assert.match(source, /label: isBusinessIdentifier\(definition\) \? "ID"/u);
  assert.match(source, /<span className="c009-editor-fixed-label">ID<\/span>/u);
  assert.match(source, /aria-label=\{`\$\{definition\.label\} value`\}/u);
  assert.match(source, /onChange=\{event => setDraft\(current => \(\{ \.\.\.current, \[definition\.fieldId\]: event\.target\.value \}\)\)\}/u);
  assert.match(source, /!isBusinessIdentifier\(definition\) \? \(\s*<button type="button" onClick=\{\(\) => removeField\(definition\.fieldId\)\}>×<\/button>/u);
  assert.doesNotMatch(source, /disabled=\{isBusinessIdentifier\(definition\)\}/u);
  assert.match(source, /\.c009-editor-row\.business-id\{grid-template-columns:\.85fr 1\.25fr\}/u);
});

test("Card 009 renders a fixed ID caption with the canonical business-ID value", () => {
  assert.match(source, /const businessIdentifier = definitions\.find\(isBusinessIdentifier\) \|\| null;/u);
  assert.match(source, /const businessIdentifierValue = inputValue\(fields\?\.\[businessIdentifier\?\.fieldId\]\);/u);
  assert.match(source, /className="c009-media-id"><span>ID<\/span><strong>\{businessIdentifierValue \|\| "—"\}<\/strong><\/div>/u);
  assert.doesNotMatch(source, /businessIdentifier\?\.label \|\| "ID"/u);
});

test("Card 009 shell and existing controls remain intact", () => {
  assert.match(source, /const W = 298;/u);
  assert.match(source, /const H = 471;/u);
  assert.match(source, /className="c009-photo-action"/u);
  assert.match(source, /className="c009-relations"/u);
  assert.match(source, /className="c009-commands"/u);
  assert.match(source, /<IXIObjectRail/u);
});
