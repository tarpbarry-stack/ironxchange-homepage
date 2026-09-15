import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const source = fs.readFileSync(new URL("../components/ixi-aos/transact/modules/sold/IXIAssetSaleContract.js", import.meta.url), "utf8");
const { createIXIAssetSaleDraft, resolveIXIAssetSaleDate } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
const sourceInvoice = { financialDocumentId: "ifd_history", occurredAt: "2026-02-01", totals: { total: 10000 } };

test("historical closeouts default to the original invoice date, separately from recording time", () => {
  const record = createIXIAssetSaleDraft({ input: { sourceInvoice } });
  assert.equal(record.sale.saleDate, "2026-02-01");
  assert.equal(record.sale.saleDateSource, "invoice");
  assert.equal(record.passportState.effectiveDate, "2026-02-01");
  assert.match(record.audit.createdAt, /T/);
});

test("loading the invoice supplies the default but preserves operator edits and explicit blanks", () => {
  assert.equal(resolveIXIAssetSaleDate().saleDate, "");
  assert.equal(resolveIXIAssetSaleDate({ sourceInvoice }).saleDate, "2026-02-01");
  assert.deepEqual(resolveIXIAssetSaleDate({ sourceInvoice, saleDate: "2026-02-03" }), { saleDate: "2026-02-03", saleDateSource: "operator" });
  assert.deepEqual(resolveIXIAssetSaleDate({ sourceInvoice, saleDate: "" }), { saleDate: "", saleDateSource: "operator" });
  assert.equal(createIXIAssetSaleDraft({ input: { sourceInvoice, saleDate: "" } }).sale.saleDate, "");
});

test("passing an invoice-derived default through the form preserves its provenance", () => {
  const selected = resolveIXIAssetSaleDate({ sourceInvoice });
  const record = createIXIAssetSaleDraft({ input: { sourceInvoice, ...selected } });
  assert.equal(record.sale.saleDateSource, "invoice");
  assert.equal(resolveIXIAssetSaleDate({ sourceInvoice, saleDate: "2026-03-01", saleDateSource: "invoice" }).saleDateSource, "operator");
});
