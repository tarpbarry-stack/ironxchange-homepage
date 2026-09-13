import assert from "node:assert/strict";
import test from "node:test";
import { buildIXITransactRecordView, linkedIXITransactRecordIds, verifyIXITransactSelectedRecord } from "../components/ixi-command-center/IXITransactRecordViewModel.js";

const stored = (id, type, fields = {}, revision = 4) => ({
  financialDocument: { financialDocumentId: id, documentType: type, references: [{ role: "asset", passportId: "ASSET-A" }], ...fields },
  server: { revision }
});
const machine = { objectId: "object-a", passportId: "ASSET-A", objectType: "machine" };
const open = (record, records = [], object = machine) => buildIXITransactRecordView({ record, financialDocumentId: record.financialDocument.financialDocumentId, financialRecords: records, object });

test("an older acquisition opens its exact saved record and authoritative revision without mutating identity or history", () => {
  const selected = stored("acq-old", "asset-acquisition", { assetAcquisition: { identity: { acquisitionId: "acq-old" }, acquisition: { purchasePrice: 100 }, financialBinding: { revision: 1 } } });
  const newer = stored("acq-new", "asset-acquisition", { assetAcquisition: { acquisition: { purchasePrice: 200 } } });
  const object = { ...machine, assetAcquisition: newer.financialDocument.assetAcquisition };
  const before = JSON.stringify({ selected, newer, object });
  const view = open(selected, [newer, selected], object);
  assert.equal(view.moduleId, "asset-acquisition");
  assert.equal(view.props.object.assetAcquisition.acquisition.purchasePrice, 100);
  assert.deepEqual(view.props.object.assetAcquisition.financialBinding, { financialDocumentId: "acq-old", revision: 4, financialLineId: "", line: null });
  assert.equal(view.props.object.objectId, "object-a");
  assert.equal(view.props.object.passportId, "ASSET-A");
  assert.deepEqual(view.props.financialRecords.map(item => item.financialDocument.financialDocumentId), ["acq-old", "acq-new"]);
  assert.equal(JSON.stringify({ selected, newer, object }), before);
});

test("completed Tech Work Orders retain their result and current revision and never route to a new regular work order", () => {
  const tech = stored("tech-1", "work-order", { documentNumber: "TECHWO-1", financialState: "closed", techWorkOrder: { work: { status: "complete" }, result: { workPerformed: "Recalibrated" }, financialBinding: { revision: 3 } } });
  const view = open(tech);
  assert.equal(view.moduleId, "technology-work");
  assert.equal(view.props.activeTechWorkOrder.work.status, "complete");
  assert.equal(view.props.activeTechWorkOrder.result.workPerformed, "Recalibrated");
  assert.equal(view.props.activeTechWorkOrder.financialBinding.revision, 4);
  assert.equal(view.props.activeWorkOrder, undefined);
  const regular = open(stored("wo-1", "work-order", { workOrder: { work: { status: "closed" } } }));
  assert.equal(regular.moduleId, "work-order");
  assert.equal(regular.props.activeWorkOrder.work.status, "closed");
});

test("missing, mismatched and incomplete records cannot initialize an unrelated or blank worksheet", () => {
  assert.throws(() => verifyIXITransactSelectedRecord(null, "selected"), /could not be verified/);
  assert.throws(() => verifyIXITransactSelectedRecord(stored("other", "expense"), "selected"), /could not be verified/);
  for (const type of ["asset-acquisition", "bill", "purchase-order", "work-order", "unrecognized-record"]) {
    assert.equal(open(stored("record", type)).moduleId, "");
  }
  assert.equal(open(stored("expense", "expense", {}, 0)).moduleId, "");
  assert.equal(open(stored("expense", "expense"), [], { ...machine, passportId: "ASSET-B" }).moduleId, "");
});

test("bill selection retains all payments and credits for the selected bill's governed balance", () => {
  const bill = stored("bill-old", "bill", { billRecord: { identity: { billRecordId: "external-number" } } });
  const other = stored("bill-new", "bill", { billRecord: {} });
  const payment = stored("payment", "payment", { sourceFinancialDocumentId: "bill-old" });
  const view = open(bill, [other, payment, bill]);
  assert.equal(view.moduleId, "bill");
  assert.equal(view.props.selectedFinancialDocumentId, "bill-old");
  assert.equal(view.props.financialRecords.length, 3);
  assert.ok(view.props.financialRecords.includes(payment));
});

test("each supported embedded transaction receives the selected snapshot instead of an Object's default", () => {
  for (const [type, key] of [["rental-expense", "rentalExpense"], ["rental-income", "rentalIncome"], ["service-quote", "serviceQuote"], ["purchase-order", "purchaseOrderRecord"]]) {
    const view = open(stored("selected", type, { [key]: { identity: { number: "ORIGINAL" } } }), [], { ...machine, [key]: { identity: { number: "LATEST" } } });
    assert.equal(view.moduleId, type);
    assert.equal(view.props.object[key].identity.number, "ORIGINAL");
  }
});

test("sales selection finds the exact deal, while superseded stages stay readable without opening a different invoice", () => {
  const old = stored("invoice-old", "invoice", { metadata: { dealId: "deal-a" }, occurredAt: "2026-01-01" });
  const latest = stored("invoice-new", "invoice", { metadata: { dealId: "deal-a" }, occurredAt: "2026-02-01" });
  const unrelated = stored("invoice-b", "invoice", { metadata: { dealId: "deal-b" }, occurredAt: "2026-03-01" });
  assert.equal(open(latest, [old, unrelated]).moduleId, "invoice");
  assert.equal(open(old, [latest, unrelated]).moduleId, "");
  assert.equal(open(unrelated, [latest, old]).props.selectedFinancialDocumentId, "invoice-b");
});

test("payments expose their saved document and deduplicated lineage instead of opening a treasury creation form", () => {
  const payment = stored("pay-1", "payment", { paymentMethod: "wire", sourceFinancialDocumentId: "inv-1", relatedFinancialDocumentIds: ["inv-1", "pay-1"], relationships: [{ financialDocumentId: "inv-1" }, { financialDocumentId: "credit-1" }] });
  const view = open(payment);
  assert.equal(view.moduleId, "");
  assert.equal(view.document.paymentMethod, "wire");
  assert.deepEqual(linkedIXITransactRecordIds(view.document), ["inv-1", "credit-1"]);
});

test("nested server envelopes carry the same exact identity and revision", () => {
  const record = { record: stored("nested", "expense") };
  const view = buildIXITransactRecordView({ record, financialDocumentId: "nested", object: machine });
  assert.equal(view.moduleId, "expense");
  assert.equal(view.server.revision, 4);
});
