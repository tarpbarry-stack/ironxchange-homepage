import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../components/ixi-aos/transact/modules/quote/IXIQuoteContract.js", import.meta.url), "utf8");
const contract = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);

test("Quote persists a flexible RPO transaction and structured additional terms", () => {
  const draft = contract.createIXIQuoteDraft({ input: {
    dealType: "rental-purchase-option",
    customerName: "West Texas Contractor",
    quotedPrice: 200000,
    rpo: { startDate: "2026-10-01", termMonths: 18, paymentFrequency: "monthly", paymentCount: 18, periodicPayment: 9000, purchaseCreditType: "percent", purchaseCreditPercent: 75, optionPrice: 78500, returnTerms: "Return freight paid by customer." },
    additionalTermsRows: [{ termId: "custom-1", label: "Mobilization", value: "Seller delivers within 10 days.", scope: "rpo", customerFacing: true }]
  }});
  assert.equal(draft.dealType, "rental-purchase-option");
  assert.equal(draft.rpo.paymentCount, 18);
  assert.equal(draft.rpo.purchaseCreditType, "percent");
  assert.equal(draft.rpo.purchaseCreditPercent, 75);
  assert.deepEqual(draft.additionalTerms[0], { termId: "custom-1", label: "Mobilization", value: "Seller delivers within 10 days.", scope: "rpo", customerFacing: true });
  assert.equal(contract.getIXIQuoteCompleteness(draft).formalReady, false);
});

test("RPO and custom terms survive Quote editing round trip", () => {
  const original = contract.createIXIQuoteDraft({ input: { dealType: "rental-purchase-option", rpo: { optionPrice: 50000 }, additionalTermsRows: [{ label: "Fuel", value: "Full tank", customerFacing: false }] } });
  const input = contract.quoteInputFromRecord(original);
  const updated = contract.updateIXIQuoteDraft(original, { input: { ...input, customerPhone: "555-0100" } });
  assert.equal(updated.rpo.optionPrice, 50000);
  assert.equal(updated.additionalTerms[0].value, "Full tank");
  assert.equal(updated.additionalTerms[0].customerFacing, false);
});
