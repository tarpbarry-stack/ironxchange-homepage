import { createIXIAosObjectFinancialDocument } from "../../financial-runtime/IXIAosFinancialRuntimeAdapter";
import { loadIXIAosFinancialDocument, loadIXIAosPassportFinancialDocuments, patchIXIAosFinancialDocument } from "../../financial-runtime/IXIAosFinancialReadClient";
import { hydrateIXIBillRecord } from "../modules/bill/IXIBillContract";
import { applyIXIBillAction } from "../modules/bill/IXIBillRecordEngine";
import { updateIXIBill } from "../modules/bill/IXIBillCommands";
import { correctedPaymentLines, paymentDocument, paymentRevision, paymentSummary, validatePaymentDraft } from "./IXIPaymentModel";

const clean = value => String(value ?? "").trim();
export const createPaymentCommandId = () => globalThis.crypto.randomUUID();

export async function saveIXIPayment({ source, records, context, object, input, commandId, capabilities, payment = null }) {
  if (!commandId) throw new Error("Reopen the payment form and try again.");
  let summary = paymentSummary(source, records);
  const oldPayment = payment ? paymentDocument(payment) : null;
  const maximum = summary.paidAtEntry ? summary.total : summary.balance + (oldPayment ? Number(oldPayment.totals?.total || 0) : 0);
  const error = validatePaymentDraft(input, maximum);
  if (error) throw new Error(error);
  if (!summary.active) throw new Error("This charge was voided. Reopen the original record to review it.");
  if (summary.hold) throw new Error("This payment is on hold or disputed. Resolve it in A/P before marking it paid.");
  if (summary.paidAtEntry && !oldPayment) {
    if (!capabilities["financial.document.patch"]) throw new Error("You do not have access to edit this expense.");
    // The expense itself already recorded the cash/card purchase. Update its
    // payment evidence without creating a second economic payment.
    const document = summary.document;
    const method = input.method === "CARD" ? "company-card" : input.method === "OTHER" ? "other" : "company-cash";
    return patchIXIAosFinancialDocument({ financialDocumentId: summary.id, expectedRevision: paymentRevision(source), commandId, idempotencyKey: `ixi-payment-details:${commandId}`,
      patch: { paymentMethod: method, expense: { ...document.expense, paymentMethod: method },
        ...(document.expenseRecord ? { expenseRecord: { ...document.expenseRecord, expense: { ...document.expenseRecord.expense, paymentMethod: method } } } : {}),
        expensePayment: { ...document.expensePayment, paidDate: input.paidDate, method: input.method, reference: clean(input.reference), notes: clean(input.notes) } },
      metadata: { action: "payment-details", transactModule: "expense", correctionNote: clean(input.notes) } });
  }
  if (!capabilities["financial.payment.create"]) throw new Error("You do not have access to record payments.");
  if (!summary.approved) {
    if (!capabilities["financial.document.approve"]) throw new Error("This Bill needs approval before you can mark it paid.");
    // Same visible action, with the existing authenticated approval command.
    const latest = await loadIXIAosFinancialDocument({ financialDocumentId: summary.id });
    const record = hydrateIXIBillRecord(latest);
    if (record?.approval?.status !== "approved") {
      if (record?.purchaseMatch?.status === "exception") throw new Error("This Bill has a purchase-order difference. Review and approve the difference on the Bill first.");
      const approved = applyIXIBillAction({ record, action: "approve", actor: context.actor, authority: { serverActions: capabilities } });
      await updateIXIBill({ record: approved, action: "approve" });
    }
  }
  if (oldPayment) {
    const amount = Number(input.amount);
    return patchIXIAosFinancialDocument({ financialDocumentId: oldPayment.financialDocumentId, expectedRevision: paymentRevision(payment), commandId, idempotencyKey: `ixi-payment-edit:${commandId}`,
      patch: { occurredAt: `${input.paidDate}T12:00:00.000Z`, period: input.paidDate.slice(0, 7), amount, paymentMethod: input.method,
        transactionReference: clean(input.reference), memo: clean(input.notes),
        totals: { ...oldPayment.totals, subtotal: amount, total: amount },
        lines: correctedPaymentLines(oldPayment, amount, input.paidDate, input.method),
        metadata: { ...oldPayment.metadata, paymentCorrection: true, correctionNote: clean(input.notes) } }, metadata: { action: "correct-payment", transactModule: "payments" } });
  }
  return createIXIAosObjectFinancialDocument({ object: object?.passportId ? object : context.primary, documentType: "payment", commandId, idempotencyKey: `ixi-payment:${commandId}`,
    input: { amount: Number(input.amount), currency: summary.currency, occurredAt: `${input.paidDate}T12:00:00.000Z`,
      financialState: "paid", status: "posted", paymentDirection: "outflow", paymentMethod: input.method,
      transactionReference: clean(input.reference), memo: clean(input.notes), description: `${summary.reimbursement ? "Reimbursement" : "Payment"} · ${summary.title}`,
      sourceFinancialDocumentId: summary.id, references: summary.document.references || [],
      payeePassportId: summary.reimbursement ? clean(summary.document.reimbursement?.employeePassportId || summary.document.expenseRecord?.reimbursement?.employeePassportId) : "" },
    additionalReferences: summary.document.references || [],
    metadata: { transactModule: "payments", sourceDocumentType: summary.document.documentType, ...(summary.reimbursement ? { expenseReimbursement: true } : {}) } });
}

export async function voidIXIPayment({ payment, commandId, reason = "" }) {
  const document = paymentDocument(payment);
  return patchIXIAosFinancialDocument({ financialDocumentId: document.financialDocumentId, expectedRevision: paymentRevision(payment), commandId, idempotencyKey: `ixi-payment-void:${commandId}`,
    patch: { financialState: "void", status: "void", metadata: { ...document.metadata, paymentCorrection: true, correctionNote: clean(reason) } },
    metadata: { action: "void-payment", transactModule: "payments" } });
}

export async function loadIXIPaymentRecords({ passportId, sourceIds = [], signal }) {
  const records = await loadIXIAosPassportFinancialDocuments({ passportId, signal });
  const present = new Set(records.map(record => paymentDocument(record).financialDocumentId));
  const missing = sourceIds.filter(id => !present.has(id));
  const linked = await Promise.all(missing.map(financialDocumentId => loadIXIAosFinancialDocument({ financialDocumentId, signal })));
  return [...records, ...linked];
}
