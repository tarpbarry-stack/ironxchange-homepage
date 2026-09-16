import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const read = name => fs.readFileSync(new URL(`../components/ixi-aos/transact/modules/asset-acquisition/${name}.js`, import.meta.url), "utf8");
const engine = await import(`data:text/javascript;base64,${Buffer.from(read("IXIAssetAcquisitionRecordEngine")).toString("base64")}`);
const contract = await import(`data:text/javascript;base64,${Buffer.from(read("IXIAssetAcquisitionContract")).toString("base64")}`);
const require = createRequire(import.meta.url);
const core = process.env.IXI_CORE_CONTRACT_ROOT;
if (!core) throw new Error("The pinned IXI_CORE_CONTRACT_ROOT is required for acquisition date integration.");
const { createAssetAcquisitionDocument } = require(path.join(core, "financial/IXIFinancialAssetAcquisitionFactory.js"));
const { validateFinancialDocument } = require(path.join(core, "financial/IXIFinancialValidationBridge.js"));
const { projectInventory } = require(path.join(core, "financial/IXIFinancialInventoryLifecycle.js"));
const context = {
  primary: { passportId: "passport:machine:1", objectId: "machine:1", objectType: "machine", label: "Test loader" },
  entity: { passportId: "passport:entity:1", label: "Test company" },
  actor: { passportId: "passport:employee:1", displayName: "Test operator" },
};
const references = [{ role: "asset", passportId: context.primary.passportId }, { role: "entity", passportId: context.entity.passportId }, { role: "employee", passportId: context.actor.passportId }];
function fixture() {
  const draft = contract.createIXIAssetAcquisitionDraft({ context, input: {
    sellerLabel: "Test seller", purchaseDate: "2026-09-16", purchasePrice: 80000,
    owners: [{ partyLabel: "Test company", legalOwnershipPercent: 100, settlementSharePercent: 100 }],
  } });
  return createAssetAcquisitionDocument({ financialDocumentId: "ifd_datecorrection001", assetAcquisition: draft,
    occurredAt: "2026-09-16T12:00:00.000Z", references,
    metadata: { purchaseDate: "2026-09-16", preserved: { source: "original" } } });
}
const correction = { purchaseDate: "2026-02-10", reason: "Correct purchase document date", reference: "INV-ORIGINAL", adjustmentId: "ACQ-DATE-TEST" };

test("purchase date correction preserves original costs, ownership, identity and prior history", () => {
  const original = fixture().assetAcquisition;
  original.adjustments = [{ type: "acquisition-amendment", effectiveDate: "2026-02-10", reason: "Date Wrong", basisDelta: 0 }];
  const before = structuredClone(original);
  const result = engine.correctIXIAcquisitionPurchaseDate(original, correction, context.actor);
  assert.deepEqual(original, before);
  assert.deepEqual(result.identity, before.identity);
  assert.deepEqual(result.ownership, before.ownership);
  assert.deepEqual(result.funding, before.funding);
  assert.deepEqual({ ...result.acquisition, purchaseDate: before.acquisition.purchaseDate }, before.acquisition);
  assert.deepEqual(result.adjustments[0], before.adjustments[0]);
  assert.equal(result.adjustments.at(-1).previousValue, "2026-09-16");
  assert.equal(result.adjustments.at(-1).newValue, "2026-02-10");
  assert.equal(result.adjustments.at(-1).actorPassportId, context.actor.passportId);
  assert.equal(result.activity.at(-1).type, "purchase-date-correction");
  assert.equal(result.audit.createdAt, before.audit.createdAt);
});

test("date corrections reject impossible dates, missing evidence and dates after service", () => {
  const record = fixture().assetAcquisition;
  for (const purchaseDate of ["", "2026-02-30", "2026-13-01", "2026-2-10", "bad", "2026-09-16"])
    assert.throws(() => engine.correctIXIAcquisitionPurchaseDate(record, { ...correction, purchaseDate }, context.actor));
  for (const field of ["reason", "reference"])
    assert.throws(() => engine.correctIXIAcquisitionPurchaseDate(record, { ...correction, [field]: "" }, context.actor));
  assert.throws(() => engine.correctIXIAcquisitionPurchaseDate({ ...record, makeReady: { inServiceDate: "2026-02-01" } }, correction, context.actor), /in-service/);
});

function commands(deps) {
  const source = read("IXIAssetAcquisitionCommands").replace(/^import .*;\n/gm, "").replace(/export default[^;]+;/g, "").replace(/export /g, "");
  return new Function(...Object.keys(deps), `${source}\nreturn { correctIXIAssetAcquisitionDate };`)(...Object.values(deps));
}
function apiFixture({ stale = false, fail = false, wrongDate = false } = {}) {
  const document = fixture();
  let saved, request;
  const announcements = [];
  const api = commands({
    correctIXIAcquisitionPurchaseDate: engine.correctIXIAcquisitionPurchaseDate,
    loadIXIAosFinancialDocument: async () => ({ financialDocument: structuredClone(document), server: { revision: stale ? 5 : 4 } }),
    patchIXIAosFinancialDocument: async input => {
      request = input;
      if (fail) throw new Error("Server revision conflict");
      saved = { ...structuredClone(document), ...input.patch };
      if (wrongDate) saved.occurredAt = document.occurredAt;
      return { ok: true, data: { record: { financialDocument: saved, server: { revision: 5 } } } };
    },
    announceInventoryChange: event => announcements.push(event),
  });
  const run = () => api.correctIXIAssetAcquisitionDate({ record: { ...document.assetAcquisition,
    financialBinding: { financialDocumentId: document.financialDocumentId, revision: 4 } }, correction, actor: context.actor });
  return { document, run, announcements, saved: () => saved, request: () => request };
}

test("saved correction updates canonical date and inventory ordering without changing the sale or economics", async () => {
  const api = apiFixture();
  const sale = { financialDocumentId: "ifd_sale001", documentType: "invoice", financialState: "collected", occurredAt: "2026-09-12", references,
    metadata: { assetSale: true, assetSaleRecord: { status: "sold", identity: { financialInvoiceId: "ifd_sale001" }, sale: { saleDate: "2026-09-12", saleDateSource: "operator" } } } };
  const state = acq => projectInventory({ records: [acq, sale], entityPassportId: context.entity.passportId });
  assert.equal(state(api.document).current[context.primary.passportId].state, "owned");
  const result = await api.run();
  const saved = api.saved();
  const validation = validateFinancialDocument(saved);
  assert.equal(validation.ok, true, JSON.stringify(validation.errors));
  assert.equal(saved.occurredAt, "2026-02-10T12:00:00.000Z");
  assert.equal(saved.acquisition.purchaseDate, "2026-02-10");
  assert.equal(saved.assetAcquisition.acquisition.purchaseDate, "2026-02-10");
  assert.equal(saved.metadata.purchaseDate, "2026-02-10");
  assert.deepEqual(saved.metadata.preserved, api.document.metadata.preserved);
  assert.deepEqual(saved.totals, api.document.totals);
  assert.deepEqual(saved.references, api.document.references);
  assert.deepEqual(saved.lines.map(({ occurredAt, ...line }) => line), api.document.lines.map(({ occurredAt, ...line }) => line));
  assert.ok(saved.lines.every(line => line.occurredAt === saved.occurredAt));
  assert.equal(result.record.financialBinding.revision, 5);
  assert.equal(api.request().expectedRevision, 4);
  assert.deepEqual(state(saved).sales, state(api.document).sales);
  assert.equal(state(saved).current[context.primary.passportId].state, "sold");
  assert.deepEqual(api.announcements, [{ passportId: context.primary.passportId, reason: "acquisition-date-corrected" }]);
  const repurchased = { ...saved, financialDocumentId: "ifd_repurchase001", occurredAt: "2026-10-01" };
  assert.equal(state(repurchased).current[context.primary.passportId].state, "owned");
});

test("a stale acquisition is never overwritten and failed or unverified saves never refresh Inventory", async () => {
  for (const scenario of [{ stale: true }, { fail: true }, { wrongDate: true }]) {
    const api = apiFixture(scenario);
    await assert.rejects(api.run());
    assert.deepEqual(api.announcements, []);
    if (scenario.stale) assert.equal(api.request(), undefined);
  }
});
