import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const cards = ["010", "011", "012", "013", "014", "015", "016", "017"];

for (const card of cards) {
  test(`Card ${card} uses the shared commercial editor without bypassing the data contract`, () => {
    const source = read(`components/ixi-aos/cards/${card}/IXIAosCard${card}.jsx`);
    assert.match(source, /IXIAosDataContractCardAdapter/u);
    assert.match(source, /IXIAosCommercialEditorBridge/u);
    assert.match(source, /mediaEnabled/u);
    assert.match(source, /runtimeObject/u);
  });
}

test("Cards 010-017 are admitted only to runtime QA, not production certification", () => {
  const registry = read("components/ixi-aos/card-runtime/IXIAosCommercialAdmissionRegistry.js");
  for (const card of cards) {
    assert.match(
      registry,
      new RegExp(`"${card}"\\s*:\\s*Object\\.freeze\\(\\{\\s*status:\\s*"ready-for-runtime-qa"`, "u")
    );
  }
  assert.doesNotMatch(registry, /production-ready/u);
});

test("shared editor owns customizable fields, protected business ID, media, and normalized schema save", () => {
  const editor = read("components/ixi-aos/card-runtime/modules/IXIAosCommercialObjectEditor.jsx");
  assert.match(editor, /\+ ADD FIELD/u);
  assert.match(editor, /removeField/u);
  assert.match(editor, /isBusinessIdentifier/u);
  assert.match(editor, /IXIAosPrimaryMediaEditor/u);
  assert.match(editor, /fieldDefinitions:\s*normalizedDefinitions/u);
  assert.match(editor, /metadata:[\s\S]*fieldDefinitions:\s*normalizedDefinitions/u);
});

test("commercial bridge persists through the real save callback and notice lifecycle", () => {
  const bridge = read("components/ixi-aos/card-runtime/modules/IXIAosCommercialEditorBridge.jsx");
  assert.match(bridge, /onSaveObject/u);
  assert.match(bridge, /runIXIActionNoticeLifecycle/u);
  assert.match(bridge, /successMessage:\s*"SAVED"/u);
  assert.match(bridge, /errorMessage:\s*"NOT SAVED"/u);
});

test("yellow real-parent contract remains intact while adopting 010-017", () => {
  const adapter = read("components/ixi-aos/card-runtime/IXIAosDataContractCardAdapter.jsx");
  assert.match(adapter, /\.ixi-aos-runtime-parent-line[\s\S]*?color:\s*#ffc400/u);
});
