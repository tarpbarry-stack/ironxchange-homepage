import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function importSource(path) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  return import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
}

const contract = await importSource("../components/ixi-aos/transact/modules/rental-expense/IXIRentalExpenseContract.js");
const engine = await importSource("../components/ixi-aos/transact/modules/rental-expense/IXIRentalExpenseRecordEngine.js");

const context = {
  primary: { passportId: "passport:job:1", objectId: "job:1", objectType: "project", label: "Midland Loadout" },
  entity: { passportId: "passport:entity:1", label: "IronXchange LLC" },
  actor: { passportId: "passport:employee:1", displayName: "John Carter" }
};

function validInput(overrides = {}) {
  return {
    clientRequestId: "rental-request-1",
    vendorName: "United Rentals",
    assetDescription: "CAT 336 Excavator",
    assetType: "machine",
    startDate: "2026-09-01",
    expectedReturnDate: "2026-09-30",
    baseRate: 7000,
    rateUnit: "month",
    damageWaiver: 250,
    charges: [{ type: "service", label: "Telematics", amount: 100, recurrence: "per-period" }],
    ...overrides
  };
}

test("Rental Expense creates a real projected commitment with AOS lineage", () => {
  const draft = contract.createIXIRentalExpenseDraft({ context, input: validInput() });
  const record = engine.applyIXIRentalExpenseEconomics(draft, [], "2026-09-30");
  assert.equal(record.schema, "ixi-rental-expense-v2");
  assert.equal(record.context.primaryPassportId, "passport:job:1");
  assert.equal(record.economics.projectedBaseCost, 7000);
  assert.equal(record.economics.projectedAncillaryCost, 350);
  assert.equal(record.economics.projectedTotal, 7350);
  assert.equal(contract.validateIXIRentalExpense(record).valid, true);
});

test("Recurring rental charges scale by billing period and OFF RENT freezes the commitment", () => {
  const draft = contract.createIXIRentalExpenseDraft({ context, input: validInput({ expectedReturnDate: "2026-10-31" }) });
  const projected = engine.applyIXIRentalExpenseEconomics(draft, [], "2026-10-31");
  assert.equal(projected.economics.projectedPeriods, 2);
  assert.equal(projected.economics.projectedTotal, 14450);
  const returned = engine.offRentIXIRentalExpense(projected, { actualOffRentDate: "2026-09-15", endMeter: 25 }, context.actor);
  const final = engine.applyIXIRentalExpenseEconomics(returned, [], "2026-12-31");
  assert.equal(final.period.status, "off-rent");
  assert.equal(final.economics.projectedPeriods, 1);
  assert.equal(final.economics.projectedTotal, 7350);
});

test("Rental Expense rejects zero rates and browser-only evidence", () => {
  const draft = contract.createIXIRentalExpenseDraft({
    context,
    input: validInput({ baseRate: 0, documents: [{ fileName: "agreement.pdf", status: "local-pending-upload" }] })
  });
  const result = contract.validateIXIRentalExpense(draft);
  assert.equal(result.valid, false);
  assert.equal(result.errors.rate, "greater-than-zero");
  assert.equal(result.errors.documents, "secure-upload-required");
});
