import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../components/ixi-aos/transact/modules/asset-acquisition/IXIAssetAcquisitionContract.js", import.meta.url),
  "utf8"
);
const contract = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
const engineSource = await readFile(
  new URL("../components/ixi-aos/transact/modules/asset-acquisition/IXIAssetAcquisitionRecordEngine.js", import.meta.url),
  "utf8",
);
const engine = await import(`data:text/javascript;base64,${Buffer.from(engineSource).toString("base64")}`);

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
  assert.equal(draft.schema, "ixi-asset-acquisition-v3");
  assert.equal(draft.acquisition.purchasePrice, 150000);
  assert.equal(draft.acquisition.directAcquisitionCost, 154875);
  assert.equal(contract.validateIXIAssetAcquisition(draft).valid, true);
});

test("Asset Acquisition basis includes purchase-document charges and subtracts trade/credits", () => {
  const draft = contract.createIXIAssetAcquisitionDraft({
    context,
    input: validInput({
      auctionDocumentFees: 500,
      tradeAllowance: 10000,
      sellerCredits: 875,
    }),
  });
  assert.equal(draft.acquisition.originalAcquisitionBasis, 144500);
  assert.equal(draft.acquisition.currentAcquisitionBasis, 144500);
  assert.deepEqual(draft.makeReady.estimates, []);
});

test("Asset Acquisition amendment preserves original basis and appends immutable evidence", () => {
  const draft = contract.createIXIAssetAcquisitionDraft({ context, input: validInput() });
  const amended = engine.amendIXIAssetAcquisition(draft, {
    field: "buyerPremium",
    newValue: 2500,
    effectiveDate: "2026-09-04",
    reason: "Auction correction",
    reference: "INV-2026-9-CREDIT",
  }, context.actor);
  assert.equal(amended.acquisition.originalAcquisitionBasis, 154875);
  assert.equal(amended.acquisition.currentAcquisitionBasis, 154375);
  assert.equal(amended.acquisition.amendmentTotal, -500);
  assert.equal(amended.adjustments.length, 1);
  assert.equal(amended.adjustments[0].previousValue, 3000);
  assert.equal(amended.adjustments[0].newValue, 2500);
  assert.equal(draft.acquisition.buyerPremium, 3000);
});

test("Package normalization is zero-sum, Passport-bound, and never rewrites original basis", () => {
  const draft = contract.createIXIAssetAcquisitionDraft({ context, input: validInput() });
  const normalized = engine.normalizeIXIPackageAllocation(draft, {
    packageId: "PKG-100",
    packageReference: "AUCTION-44",
    packageTotal: 250000,
    allocationMethod: "relative-market",
    effectiveDate: "2026-09-05",
    reason: "Normalize remaining machines after disposition",
    allocations: [
      { passportId: "passport:machine:1", label: "2020 CAT 336", amount: 160000 },
      { passportId: "passport:machine:2", label: "2019 CAT 320", amount: 90000 },
    ],
  }, context.actor);
  assert.equal(normalized.acquisition.originalAcquisitionBasis, 154875);
  assert.equal(normalized.acquisition.currentAcquisitionBasis, 160000);
  assert.equal(normalized.packageAllocation.packageTotal, 250000);
  assert.equal(normalized.adjustments.at(-1).allocatedTotal, 250000);
  assert.throws(() => engine.normalizeIXIPackageAllocation(draft, {
    packageId: "PKG-100", packageReference: "AUCTION-44", packageTotal: 250000,
    allocationMethod: "manual-normalized", effectiveDate: "2026-09-05", reason: "Bad total",
    allocations: [
      { passportId: "passport:machine:1", amount: 160000 },
      { passportId: "passport:machine:2", amount: 80000 },
    ],
  }), /must equal/u);
});

test("A canonical package control projects the allocation onto every referenced Passport", () => {
  const siblingContext = { ...context, primary: { ...context.primary, passportId: "passport:machine:2", label: "2019 CAT 320" } };
  const sibling = contract.createIXIAssetAcquisitionDraft({ context: siblingContext, input: validInput({ purchasePrice: 100000, buyerPremium: 0, tax: 0, titleFees: 0, otherAcquisitionFees: 0 }) });
  const event = {
    adjustmentId: "ACQ-NORM-CONTROL-1",
    type: "package-normalization",
    packageId: "PKG-100",
    packageReference: "AUCTION-44",
    packageTotal: 250000,
    allocationMethod: "relative-market",
    occurredAt: "2026-09-05T12:00:00.000Z",
    allocations: [
      { passportId: "passport:machine:1", amount: 160000 },
      { passportId: "passport:machine:2", amount: 90000 },
    ],
  };
  const projected = engine.applyIXIAcquisitionActuals(sibling, [{ documentType: "adjustment", packageNormalization: event }]);
  assert.equal(projected.acquisition.originalAcquisitionBasis, 100000);
  assert.equal(projected.acquisition.currentAcquisitionBasis, 90000);
  assert.equal(projected.adjustments.at(-1).projectedFromControl, true);
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
  assert.match(app, /"PAYMENT DUE DATE": "FECHA DE VENCIMIENTO"/u);
  assert.match(app, /"CLEAR SELECTED FILES": "BORRAR ARCHIVOS SELECCIONADOS"/u);
  assert.match(app, /TODOS LOS DEMÁS COSTOS PERMANECEN EN SUS PROPIOS MÓDULOS TRAN\$ACT Y APARECEN MEDIANTE F\$1 Y F\$2/u);
  assert.match(app, /lang=\{lang === "es" \? "es-MX" : "en-US"\}/u);
  assert.match(app, /\{tx\("PURCHASE PRICE"\)\}/u);
  assert.match(app, /\{tx\("DIRECT PURCHASE"\)\}/u);
  assert.match(app, /\{tx\("\+ BILL OF SALE \/ INVOICE"\)\}/u);
  assert.match(app, /save: tx\(clean\(error\?\.message\)/u);
  assert.doesNotMatch(app, />MAKE-READY OPEN</u);
  assert.doesNotMatch(app, />REMOVE (?:OWNER|PAYMENT)</u);
  assert.doesNotMatch(app, /makeReadyEstimates:\s*costs/u);
  assert.doesNotMatch(app, /\+ ADD ESTIMATED COST/u);
  assert.doesNotMatch(app, /LINKED INTAKE WORKFLOWS/u);
  assert.doesNotMatch(app, /CREATE FREIGHT ORDER/u);
  assert.doesNotMatch(app, /CREATE RECEIVING INSPECTION/u);
  assert.doesNotMatch(app, /OPEN MAKE-READY WORK ORDER/u);
  assert.doesNotMatch(app, /FREIGHT ACTUAL/u);
  assert.doesNotMatch(app, /MAKE-READY ACTUAL/u);
  assert.doesNotMatch(app, /ACTUAL LANDED COST/u);
  assert.match(app, /SAVE IMMUTABLE AMENDMENT/u);
  assert.match(app, /SAVE ZERO-SUM NORMALIZATION/u);
  const commands = await readFile(
    new URL("../components/ixi-aos/transact/modules/asset-acquisition/IXIAssetAcquisitionCommands.js", import.meta.url),
    "utf8",
  );
  assert.match(commands, /documentType:\s*"adjustment"/u);
  assert.match(commands, /packageNormalization:\s*event/u);
  assert.match(commands, /zeroSum:\s*true/u);
});
