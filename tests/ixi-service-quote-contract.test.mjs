import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function importSource(path) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  return import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
}

const contract = await importSource("../components/ixi-aos/transact/modules/service-quote/IXIServiceQuoteContract.js");
const engine = await importSource("../components/ixi-aos/transact/modules/service-quote/IXIServiceQuoteRecordEngine.js");

const context = {
  primary: { passportId: "passport:asset:1", objectId: "machine:1", objectType: "machine", label: "CAT 336" },
  entity: { passportId: "passport:entity:1", label: "IronXchange LLC" },
  actor: { passportId: "passport:employee:1", displayName: "John Carter" }
};
const input = {
  customerName: "Granite Construction", problem: "Hydraulic leak", customerScope: "Diagnose and repair boom circuit",
  quoteDate: "2099-09-01", validThrough: "2099-09-15", pricingType: "fixed-price", taxAmount: 825,
  options: [{ label: "Base repair", required: true, lines: [{ type: "labor", description: "Field repair", quantity: 10, unit: "hour", unitPrice: 1000, unitCost: 600 }] }]
};

test("Service Quote separates service revenue, tax, customer total, and deposit terms", () => {
  const draft = contract.createIXIServiceQuoteDraft({ context, input: { ...input, depositType: "percent", depositValue: 25 } });
  assert.equal(draft.schema, "ixi-service-quote-v2");
  assert.equal(draft.economics.quotedServiceRevenue, 10000);
  assert.equal(draft.commercial.taxAmount, 825);
  assert.equal(draft.economics.customerQuoteTotal, 10825);
  assert.equal(draft.commercial.requestedDeposit, 2706.25);
  assert.equal(draft.economics.projectedGrossProfit, 4000);
  assert.equal(contract.validateIXIServiceQuote(draft).valid, true);
});

test("customer acceptance freezes exact revision and creates authorization without billing", () => {
  const draft = contract.createIXIServiceQuoteDraft({ context, input });
  const sent = engine.sendIXIServiceQuote(draft, { recipient: "buyer@example.com", channel: "email" }, context.actor);
  const accepted = engine.acceptIXIServiceQuote(sent, { acceptedBy: "Pat Customer", method: "digital" }, context.actor);
  assert.equal(accepted.status, "accepted");
  assert.equal(accepted.acceptance.acceptedRevision, 1);
  assert.equal(accepted.acceptance.snapshot.serviceValue, 10000);
  assert.equal(accepted.acceptance.snapshot.tax, 825);
  assert.equal(accepted.economics.authorizedServiceRevenue, 10000);
  assert.equal(accepted.economics.authorizedCustomerTotal, 10825);
  assert.equal(accepted.economics.economicEvent, true);
  assert.throws(() => engine.acceptIXIServiceQuote(accepted, { acceptedBy: "Pat", method: "phone" }, context.actor), /not allowed/i);
});

test("Change Order approval is idempotence-safe and conversion requires canonical identity", () => {
  const draft = contract.createIXIServiceQuoteDraft({ context, input });
  const sent = engine.sendIXIServiceQuote(draft, { recipient: "buyer@example.com" }, context.actor);
  const accepted = engine.acceptIXIServiceQuote(sent, { acceptedBy: "Pat Customer", method: "digital" }, context.actor);
  const pending = engine.addIXIServiceChangeOrder(accepted, { description: "Replace additional hose", amount: 500 }, context.actor);
  const approved = engine.approveIXIServiceChangeOrder(pending, "CO-1", { acceptedBy: "Pat Customer", method: "email" }, context.actor);
  assert.equal(approved.economics.authorizedServiceRevenue, 10500);
  assert.throws(() => engine.approveIXIServiceChangeOrder(approved, "CO-1", { acceptedBy: "Pat", method: "email" }), /not found/i);
  assert.throws(() => engine.convertIXIServiceQuoteToWorkOrder(approved, ""), /identity/i);
  assert.equal(engine.convertIXIServiceQuoteToWorkOrder(approved, "ifd_workorder001").related.customerServiceWorkOrderId, "ifd_workorder001");
});

test("Service Quote rejects invalid dates, zero value, and browser-only attachments", () => {
  const draft = contract.createIXIServiceQuoteDraft({ context, input: { ...input, validThrough: "2099-08-31", options: [{ required: true, lines: [{ description: "", quantity: 0, unitPrice: 0 }] }], documents: [{ fileName: "quote.pdf", status: "local-pending-upload" }] } });
  const result = contract.validateIXIServiceQuote(draft);
  assert.equal(result.valid, false);
  assert.match(result.errors.validThrough, /on or after/i);
  assert.match(result.errors.documents, /upload/i);
});
