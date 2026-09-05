import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function read(path) {
  return fs.readFileSync(
    new URL(`../${path}`, import.meta.url),
    "utf8"
  );
}

const registry = read(
  "components/ixi-aos/card-runtime/IXIAosCommercialAdmissionRegistry.js"
);

const expectedCards = [
  "001", "002", "003", "004", "005", "006", "007", "008",
  "009", "009B", "010", "011", "012", "013", "014", "015",
  "016", "017"
];

test("commercial admission registry covers the full FaceLab numbered inventory", () => {
  for (const card of expectedCards) {
    assert.match(
      registry,
      new RegExp(`\\"${card}\\"\\s*:`),
      `Card ${card} must have an explicit admission decision`
    );
  }
});

test("only source-complete cards are marked ready for runtime QA", () => {
  const repairedCards = [
    "001", "002", "003", "004", "005", "006", "008",
    "007", "009", "010", "011", "012", "013", "014", "015", "016", "017"
  ];

  for (const card of repairedCards) {
    const pattern = new RegExp(
      `"${card}"[\\s\\S]*?status:\\s*"ready-for-runtime-qa"`
    );
    assert.match(
      registry,
      pattern,
      `Card ${card} must be admitted to runtime QA after commercial editor adoption`
    );
  }

  assert.match(
    registry,
    /"009B"[\s\S]*?status:\s*"unverified"/u
  );
});

test("Card 007 delegates dynamic schema and media editing to the shared editor", () => {
  const source = read(
    "components/ixi-aos/cards/007/IXIAosCard007EmployeeApplication.jsx"
  );
  const editor = read("components/ixi-aos/card-runtime/modules/IXIAosCommercialObjectEditor.jsx");

  assert.match(source, /IXIAosCommercialEditorBridge/u);
  assert.match(editor, /function addField\(/u);
  assert.match(editor, /function removeField\(/u);
  assert.match(editor, /IXIAosPrimaryMediaEditor/u);
  assert.match(editor, /fieldDefinitions:\s*normalizedDefinitions/u);
});

test("Card 009 delegates protected ID, schema, and media editing to the shared editor", () => {
  const source = read(
    "components/ixi-aos/cards/009/IXIAosCard009.jsx"
  );
  const editor = read("components/ixi-aos/card-runtime/modules/IXIAosCommercialObjectEditor.jsx");

  assert.match(source, /IXIAosCommercialEditorBridge/u);
  assert.match(editor, /function addField\(/u);
  assert.match(editor, /function removeField\(/u);
  assert.match(editor, /protectedId/u);
  assert.match(editor, /IXIAosPrimaryMediaEditor/u);
  assert.match(editor, /fieldDefinitions:\s*normalizedDefinitions/u);
});

test("shared numbered-card chassis preserves real parent and customer ID contracts", () => {
  const adapter = read(
    "components/ixi-aos/card-runtime/IXIAosDataContractCardAdapter.jsx"
  );
  const parent = read(
    "components/ixi-aos/card-runtime/IXIAosParentIdentity.js"
  );
  const businessId = read(
    "components/ixi-aos/card-runtime/modules/IXIAosBusinessIdentifierSlot.jsx"
  );

  assert.match(adapter, /getAosParentDisplayName/u);
  assert.match(adapter, /has-real-parent/u);
  assert.match(parent, /explicitParentLabel/u);
  assert.doesNotMatch(parent, /LOCATIONS|PERSONNEL|EQUIPMENT|PROJECT/u);

  assert.match(adapter, /IXIAosBusinessIdentifierSlot/u);
  assert.match(businessId, /background:\s*transparent/u);
  assert.match(businessId, /border:\s*0/u);
  assert.match(businessId, /border-radius:\s*0/u);
});

test("known blocked card families cannot masquerade as dynamic schema editors", () => {
  const blockedSources = [
    "components/ixi-aos/cards/location/IXIAosLocationOverviewCard.jsx",
    "components/ixi-aos/cards/generic/IXIAosGenericContainerLayoutV12.jsx",
    "components/ixi-aos/cards/generic/IXIAosGenericDataDominant010.jsx",
    "components/ixi-aos/cards/generic/IXIAosGenericMetricDominant011.jsx",
    "components/ixi-aos/cards/generic/IXIAosGenericLifecycle012.jsx",
    "components/ixi-aos/cards/generic/IXIAosGenericContentDominant013.jsx",
    "components/ixi-aos/cards/generic/IXIAosGenericCondition014.jsx",
    "components/ixi-aos/cards/generic/IXIAosGenericAgreement015.jsx",
    "components/ixi-aos/cards/generic/IXIAosGenericSequence016.jsx",
    "components/ixi-aos/cards/generic/IXIAosGenericStructuralContainer017.jsx"
  ];

  for (const path of blockedSources) {
    const source = read(path);
    assert.doesNotMatch(
      source,
      /function addField\(/u,
      `${path} must not be treated as field-add capable until actually repaired`
    );
    assert.doesNotMatch(
      source,
      /function removeField\(/u,
      `${path} must not be treated as field-delete capable until actually repaired`
    );
  }
});
