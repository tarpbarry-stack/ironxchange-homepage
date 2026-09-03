import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const editor = read(
  "components/ixi-aos/card-runtime/modules/IXIAosCommercialObjectEditor.jsx"
);

test("shared commercial editor protects durable business identity", () => {
  assert.match(editor, /BUSINESS_IDENTIFIER_FIELD_ID/u);
  assert.match(editor, /BUSINESS_IDENTIFIER_ROLE/u);
  assert.match(editor, /isBusinessIdentifier/u);
  assert.match(editor, /Customer business identifier cannot be removed/u);
  assert.match(editor, /disabled=\{protectedId/u);
});

test("shared commercial editor supports customer-defined schema changes", () => {
  assert.match(editor, /function addField\(/u);
  assert.match(editor, /function removeField\(/u);
  assert.match(editor, /updateDefinition/u);
  assert.match(editor, /value=\{definition\.label\}/u);
  assert.match(editor, /\+ ADD FIELD/u);
  assert.match(editor, /fieldType:\s*event\.target\.value/u);
});

test("shared commercial editor preserves typed values and durable field definitions", () => {
  assert.match(editor, /function parseValue\(/u);
  assert.match(editor, /money/u);
  assert.match(editor, /boolean/u);
  assert.match(editor, /tags/u);
  assert.match(editor, /fieldDefinitions:\s*normalizedDefinitions/u);
  assert.match(editor, /metadata:[\s\S]*?fieldDefinitions:\s*normalizedDefinitions/u);
});

test("shared commercial editor includes the common media contract", () => {
  assert.match(editor, /IXIAosPrimaryMediaEditor/u);
  assert.match(editor, /mediaEnabled/u);
  assert.match(editor, /media:\s*mediaEnabled\s*\?\s*media/u);
});

test("shared commercial editor remains presentation-only and noun agnostic", () => {
  assert.doesNotMatch(
    editor,
    /LOCATION|PERSONNEL|EQUIPMENT|PROJECT|DOCUMENT|INCIDENT|AGREEMENT|TRIP/u
  );
});
