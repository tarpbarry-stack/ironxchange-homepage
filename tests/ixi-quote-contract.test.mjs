import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../components/ixi-aos/transact/modules/quote/IXIQuoteContract.js", import.meta.url), "utf8");
const contract = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);

const context = {
  primary: { passportId: "pass_asset", objectId: "machine_1", objectType: "machine", label: "2022 CAT 336" },
  entity: { passportId: "pass_entity", companyName: "MACHINE KING EQUIPMENT", logoUrl: "/logo.png" },
  actor: { passportId: "pass_actor", label: "SALES" },
  location: { label: "MIDLAND YARD" }
};

test("Quote saves a sparse sales note without business-field validation", () => {
  const quote = contract.createIXIQuoteDraft({ context, object: {}, input: { customerName: "John", customerPhone: "555-0100", quotedPrice: 185000 } });
  assert.equal(quote.schema, "ixi-equipment-quote-v1");
  assert.equal(quote.customer.name, "John");
  assert.equal(quote.customer.phone, "555-0100");
  assert.equal(quote.totals.total, 185000);
  assert.equal(quote.asset.passportId, "pass_asset");
  assert.equal(quote.brand.companyName, "MACHINE KING EQUIPMENT");
  assert.ok(contract.getIXIQuoteCompleteness(quote).percent < 100);
});

test("Quote computes the formal customer total without treating completeness as a gate", () => {
  const quote = contract.createIXIQuoteDraft({ context, object: {}, input: { quotedPrice: 185000, tax: 12000, freight: 2750, fees: 250, tradeAllowance: 80000 } });
  assert.deepEqual(quote.totals, { subtotal: 185000, tax: 12000, freight: 2750, fees: 250, tradeAllowance: 80000, total: 120000 });
  assert.ok(contract.getIXIQuoteCompleteness(quote).missing.includes("Customer name"));
});

test("Quote hydration preserves canonical identity while applying worksheet edits", () => {
  const original = contract.createIXIQuoteDraft({ context, object: {}, input: { customerName: "ABC", quotedPrice: 100000 } });
  original.identity.quoteId = "ifd_quote";
  original.identity.financialDocumentId = "ifd_quote";
  original.identity.number = "QT-1001";
  original.financialBinding = { financialDocumentId: "ifd_quote", revision: 4 };
  const updated = contract.updateIXIQuoteDraft(original, { context, object: {}, input: { ...contract.quoteInputFromRecord(original), quotedPrice: 110000 } });
  assert.equal(updated.identity.number, "QT-1001");
  assert.equal(updated.financialBinding.revision, 4);
  assert.equal(updated.totals.total, 110000);
});
