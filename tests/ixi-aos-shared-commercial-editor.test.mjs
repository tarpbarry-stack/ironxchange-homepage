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
  assert.match(editor, /getBusinessIdentifierValue\(object\)/u);
});

test("shared commercial editor supports customer-defined schema changes", () => {
  assert.match(editor, /function addField\(/u);
  assert.match(editor, /function removeField\(/u);
  assert.match(editor, /updateDefinition/u);
  assert.match(editor, /value=\{definition\.label\}/u);
  assert.match(editor, /\+ ADD FIELD/u);
  assert.match(editor, /fieldType:\s*event\.target\.value/u);
  assert.match(editor, /persistedEditableIds/u);
  assert.match(editor, /delete nextFields\[fieldId\]/u);
  assert.match(editor, /recoveredFromPersistedFields:\s*true/u);
  assert.match(editor, /function clearAllFields\(/u);
  assert.match(editor, /CLEAR ALL FIELDS/u);
});

test("shared commercial editor recovers orphaned server fields so they can be deleted", () => {
  assert.match(editor, /Object\.keys\(getObjectFields\(object\)\)/u);
  assert.match(editor, /!declaredIds\.has\(clean\(fieldId\)\)/u);
  assert.match(editor, /return \[\.\.\.declared, \.\.\.orphaned\]/u);
  assert.match(editor, /persistedEditableIds/u);
});

test("shared commercial editor preserves typed values and durable field definitions", () => {
  assert.match(editor, /function parseValue\(/u);
  assert.match(editor, /money/u);
  assert.match(editor, /boolean/u);
  assert.match(editor, /tags/u);
  assert.match(editor, /fieldDefinitions:\s*normalizedDefinitions/u);
  assert.match(editor, /metadata:[\s\S]*?fieldDefinitions:\s*normalizedDefinitions/u);
});

test("AOS Work preserves customer labels when canonical readback omits definitions", () => {
  const work = read("pages/aos/work.js");

  assert.match(
    work,
    /return mergeAosCanonicalObject\(\s*payload\?\.object \|\| existing,\s*canonical\s*\);/u
  );
});

test("shared commercial editor includes the common media contract", () => {
  assert.match(editor, /IXIAosPrimaryMediaEditor/u);
  assert.match(editor, /mediaEnabled/u);
  assert.match(editor, /persistIXIAosMediaDraft/u);
  assert.match(editor, /media:\s*canonicalMedia/u);
});

test("shared commercial editor remains presentation-only and noun agnostic", () => {
  assert.doesNotMatch(
    editor,
    /LOCATION|PERSONNEL|EQUIPMENT|PROJECT|DOCUMENT|INCIDENT|AGREEMENT|TRIP/u
  );
});

test("shared commercial editor preserves the native hard-shell container outline", () => {
  assert.match(editor, /overflow:hidden/u);
  assert.match(editor, /border:1px solid #454b47/u);
  assert.match(editor, /border-radius:13px/u);
  assert.match(editor, /box-shadow:inset 0 1px #ffffff12,0 18px 40px #0008/u);
});

test("shared commercial editor shows only real schema until add field is requested", () => {
  assert.doesNotMatch(editor, /minimumCustomFields/u);
  assert.doesNotMatch(editor, /while\s*\(customCount/u);
  assert.match(editor, /function addField\(/u);
});
