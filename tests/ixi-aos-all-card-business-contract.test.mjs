import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Cards 001-003 keep their layouts while using the canonical generic Face 1 contract", async () => {
  for (const number of [1, 2, 3]) {
    const card = String(number).padStart(3, "0");
    const source = await read(`components/ixi-aos/cards/${card}/IXIAosCard${card}Location.jsx`);
    assert.match(source, /IXIAosCommercialEditorBridge/u);
    assert.match(source, /IXIAosFace1CardRuntime/u);
    assert.match(source, new RegExp(`cardNumber=\\{${number}\\}`, "u"));
    assert.doesNotMatch(source, /buildFace1LocationEditObject/u);
    assert.doesNotMatch(source, /restoreFace1LocationSave/u);
  }
});

test("Cards 018-019 use the same data, edit, persistence, and draft-cancel contract", async () => {
  const [card018, card019] = await Promise.all([
    read("components/ixi-aos/cards/018/IXIAosCard018.jsx"),
    read("components/ixi-aos/cards/019/IXIAosCard019.jsx")
  ]);
  assert.match(card018, /IXIAosDataContractCardAdapter/u);
  assert.match(card018, /IXIAosCommercialEditorBridge/u);
  assert.match(card018, /IXIAosFace1CardRuntime/u);
  assert.match(card018, /onCancelDraft=\{contractProps\.onDeleteObject\}/u);
  assert.doesNotMatch(card018, /c018-editor/u);
  assert.match(card019, /IXIAosCard018/u);
});

test("selector creation inherits the visible preview schema and every draft is TRAN$ACT-ready", async () => {
  const [picker, samples, creation, presentation] = await Promise.all([
    read("components/ixi-mos/object-creation/IXIAosSystemObjectTemplatePicker.jsx"),
    read("components/ixi-aos-card-library/IXIAosCardSampleData.js"),
    read("components/ixi-mos/object-creation/useIXIMosObjectCreation.js"),
    read("components/ixi-aos/card-runtime/IXIAosSemanticObjectPresentation.js")
  ]);
  assert.match(picker, /buildAosCardCatalogPreviewObject/u);
  assert.match(picker, /fieldSchema:\s*\(templateSchema\.length \? templateSchema : previewSchema\)/u);
  assert.match(samples, /fieldId:\s*"addressLine1"/u);
  assert.match(samples, /2400 AVIATION DRIVE/u);
  assert.match(creation, /objectType:\s*"generic"/u);
  assert.match(creation, /canTransact:\s*true/u);
  assert.match(creation, /transactEligible:\s*true/u);
  assert.match(presentation, /hasAosPassport/u);
  assert.match(
    presentation,
    /export function getObjectActionCapabilities\(object = \{\}\) \{\s+const metadata = getObjectMetadata\(object\);/u
  );
  assert.match(presentation, /metadata\?\.transactEligible === true/u);
  const preview = await read("components/ixi-aos-card-library/IXIAosCardCatalogPreview.jsx");
  for (const number of [9, 10, 11, 12, 13, 14, 15, 16, 17]) {
    assert.match(preview, new RegExp(`cardNumber === ${number}`), `Card ${number} must publish its visible preview schema to creation`);
  }
});
