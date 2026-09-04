import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../components/ixi-aos/transact/modules/equipment-sale/IXIEquipmentSaleContract.js", import.meta.url), "utf8");
const contract = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
const context = {
  primary: { passportId: "passport:asset:1", objectId: "machine:1", objectType: "machine", label: "2022 CAT 336" },
  entity: { passportId: "passport:entity:1", companyName: "Dealer LLC", salesTermsDocument: { documentId: "terms-2026", version: "2026.1", sha256: "a".repeat(64), url: "https://documents.example/terms.pdf", pageCount: 2 } },
  actor: { passportId: "passport:employee:1", label: "Sales Person" }
};
const quote = { identity: { quoteId: "ifd_quote1" }, customer: { name: "Buyer LLC", email: "buyer@example.com" }, asset: { serialNumber: "SN123" }, commercial: { paymentTerms: "Wire before release" }, totals: { subtotal: 100000, tax: 7000, freight: 2500, fees: 500, tradeAllowance: 10000 } };

test("Equipment Sale inherits Quote and exact Entity terms without accounting duplication", () => {
  const draft = contract.createIXIEquipmentSaleDraft({ context, quote, input: { totals: { deposit: 5000 } } });
  assert.equal(draft.related.quoteId, "ifd_quote1");
  assert.equal(draft.totals.total, 100000);
  assert.equal(draft.totals.balanceDue, 95000);
  assert.equal(draft.termsDocument.pageCount, 2);
  assert.equal(contract.getIXIEquipmentSaleReadiness(draft).ready, true);
});

test("Equipment Sale saves incomplete drafts but blocks signature readiness", () => {
  const draft = contract.createIXIEquipmentSaleDraft({ context: { ...context, entity: { ...context.entity, salesTermsDocument: {} } }, quote: null });
  const readiness = contract.getIXIEquipmentSaleReadiness(draft);
  assert.equal(readiness.ready, false);
  assert.ok(readiness.missing.includes("Customer"));
  assert.ok(readiness.missing.includes("Two-page counsel terms"));
});

test("Equipment Sale reconciles tax, fees, allowances, deposit, and balance", () => {
  const draft = contract.createIXIEquipmentSaleDraft({ context, quote });
  const changed = contract.updateIXIEquipmentSale(draft, { ...contract.saleInputFromRecord(draft), subtotal: 85000, tax: 5100, freight: 1200, fees: 300, tradeAllowance: 6000, deposit: 10000 });
  assert.equal(changed.totals.total, 85600);
  assert.equal(changed.totals.balanceDue, 75600);
});
