import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../components/ixi-aos/transact/modules/asset-acquisition/IXIAssetAcquisitionContract.js", import.meta.url),
  "utf8"
);
const contract = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);

const context = {
  primary: { passportId: "passport:machine:1", objectId: "machine:1", objectType: "machine", label: "2020 CAT 336" },
  entity: { passportId: "passport:entity:1", label: "IronXchange LLC" },
  actor: { passportId: "passport:employee:1", displayName: "John Carter" }
};

function validInput(overrides = {}) {
  return {
    clientRequestId: "acq-request-1",
    acquisitionType: "direct-purchase",
    sellerLabel: "Barry Equipment",
    purchaseDate: "2026-09-03",
    purchasePrice: 150000,
    buyerPremium: 3000,
    tax: 750,
    titleFees: 125,
    otherAcquisitionFees: 1000,
    owners: [{ partyLabel: "IronXchange LLC", legalOwnershipPercent: 100, settlementSharePercent: 100 }],
    payments: [],
    ...overrides
  };
}

test("Asset Acquisition draft keeps user-entered value and calculates direct basis", () => {
  const draft = contract.createIXIAssetAcquisitionDraft({ context, input: validInput() });
  assert.equal(draft.schema, "ixi-asset-acquisition-v2");
  assert.equal(draft.acquisition.purchasePrice, 150000);
  assert.equal(draft.acquisition.directAcquisitionCost, 154875);
  assert.equal(contract.validateIXIAssetAcquisition(draft).valid, true);
});

test("Asset Acquisition rejects zero value, incomplete financing, and overpayment", () => {
  const draft = contract.createIXIAssetAcquisitionDraft({
    context,
    input: validInput({
      purchasePrice: 0,
      financed: true,
      lenderLabel: "",
      payments: [{ date: "2026-09-03", amount: 200000 }]
    })
  });
  const result = contract.validateIXIAssetAcquisition(draft);
  assert.equal(result.valid, false);
  assert.equal(result.errors.purchasePrice, "greater-than-zero");
  assert.equal(result.errors.lender, "required");
  assert.equal(result.errors.overpayment, "funding-exceeds-basis");
});

test("Asset Acquisition refuses browser-only attachment metadata", () => {
  const draft = contract.createIXIAssetAcquisitionDraft({
    context,
    input: validInput({ documents: [{ fileName: "bill.pdf", status: "local-pending-upload" }] })
  });
  const result = contract.validateIXIAssetAcquisition(draft);
  assert.equal(result.valid, false);
  assert.equal(result.errors.documents, "secure-upload-required");
});

test("Asset Acquisition preserves equal card gutters without changing card geometry", async () => {
  const styles = await readFile(
    new URL("../components/ixi-aos/transact/modules/asset-acquisition/IXIAssetAcquisitionStyles.jsx", import.meta.url),
    "utf8",
  );
  assert.match(styles, /\.ixi-acq\{padding:0 8px 12px\}/u);
});

test("Asset Acquisition provides complete Mexican Spanish UI coverage", async () => {
  const app = await readFile(
    new URL("../components/ixi-aos/transact/modules/asset-acquisition/IXIAssetAcquisitionApp.jsx", import.meta.url),
    "utf8",
  );
  assert.match(app, /const ES_TEXT = Object\.freeze/u);
  assert.match(app, /"MAKE-READY OPEN": "PREPARACIÓN ABIERTA"/u);
  assert.match(app, /"PAYMENT DUE DATE": "FECHA DE VENCIMIENTO"/u);
  assert.match(app, /"CLEAR SELECTED FILES": "BORRAR ARCHIVOS SELECCIONADOS"/u);
  assert.match(app, /lang=\{lang === "es" \? "es-MX" : "en-US"\}/u);
  assert.match(app, /\{tx\("PURCHASE PRICE"\)\}/u);
  assert.match(app, /\{tx\("DIRECT PURCHASE"\)\}/u);
  assert.match(app, /\{tx\("\+ BILL OF SALE \/ INVOICE"\)\}/u);
  assert.match(app, /save: tx\(clean\(error\?\.message\)/u);
  assert.doesNotMatch(app, />MAKE-READY OPEN</u);
  assert.doesNotMatch(app, />REMOVE (?:OWNER|PAYMENT)</u);
});
