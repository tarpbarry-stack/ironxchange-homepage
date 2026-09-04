import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const adoptedCards = [
  "components/ixi-aos/cards/001/IXIAosCard001Location.jsx",
  "components/ixi-aos/cards/002/IXIAosCard002Location.jsx",
  "components/ixi-aos/cards/003/IXIAosCard003Location.jsx",
  "components/ixi-aos/cards/004/IXIAosCard004Personnel.jsx",
  "components/ixi-aos/cards/005/IXIAosCard005Personnel.jsx",
  "components/ixi-aos/cards/006/IXIAosCard006Personnel.jsx",
  "components/ixi-aos/cards/008/IXIAosCard008Profile.jsx"
];

test("Cards 001-006 and 008 use the shared commercial editor bridge", () => {
  for (const path of adoptedCards) {
    const source = read(path);
    assert.match(source, /IXIAosCommercialEditorBridge/u, `${path} must use the commercial editor bridge`);
    assert.match(source, /object=\{contractProps\.object\}/u, `${path} must seed editing from the real runtime object`);
    assert.match(source, /onSaveObject=\{contractProps\.onSaveObject\}/u, `${path} must save through the real data-contract adapter`);
  }
});

test("commercial editor bridge intercepts only canonical EDIT and preserves durable save payload", () => {
  const source = read("components/ixi-aos/card-runtime/modules/IXIAosCommercialEditorBridge.jsx");
  const sessionSource = read("components/ixi-aos/card-runtime/modules/useIXIAosObjectEditSession.js");
  const persistenceSource = `${source}\n${sessionSource}`;
  assert.match(source, /button\.header-action\.edit/u);
  assert.match(source, /runIXIActionNoticeLifecycle/u);
  assert.match(source, /successMessage: "SAVED"/u);
  assert.match(source, /errorMessage: "NOT SAVED"/u);
  assert.match(persistenceSource, /fieldDefinitions:/u);
  assert.match(persistenceSource, /metadata:/u);
  assert.match(persistenceSource, /media:/u);
});

test("shared commercial editor keeps customer ID protected while allowing schema editing", () => {
  const source = read("components/ixi-aos/card-runtime/modules/IXIAosCommercialObjectEditor.jsx");
  assert.match(source, /\+ ADD FIELD/u);
  assert.match(source, /removeField/u);
  assert.match(source, /updateDefinition/u);
  assert.match(source, /protectedId/u);
  assert.match(source, /Customer business identifier cannot be removed/u);
  assert.match(source, /IXIAosPrimaryMediaEditor/u);
});

test("admission registry advances only repaired first-wave cards", () => {
  const source = read("components/ixi-aos/card-runtime/IXIAosCommercialAdmissionRegistry.js");
  for (const card of ["001", "002", "003", "004", "005", "006", "007", "008", "009"]) {
    assert.match(source, new RegExp(`\\"${card}\\"[\\s\\S]*?status: \\"ready-for-runtime-qa\\"`, "u"));
  }
  for (const card of ["010", "011", "012", "013", "014", "015", "016", "017"]) {
    assert.match(source, new RegExp(`\\"${card}\\"[\\s\\S]*?status: \\"repair-required\\"`, "u"));
  }
  assert.match(source, /"009B"[\s\S]*?status: "unverified"/u);
});
