import { createIXIAosObjectFinancialDocument } from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";
import { patchIXIAosFinancialDocument } from "../../../financial-runtime/IXIAosFinancialReadClient";
const clean = value => String(value ?? "").trim();

export async function createIXITechWorkOrder({ object = {}, context = {}, record = {}, signal } = {}) {
  const commandId = clean(record?.identity?.clientRequestId || record?.identity?.techWorkOrderId);
  if (!commandId) throw new Error("A stable technology work-order request ID is required.");
  const response = await createIXIAosObjectFinancialDocument({ object: { ...object, ...context.primary, passportId: context.primary?.passportId }, documentType: "technology-work-order", commandId, idempotencyKey: `ixi-technology-work-order:${commandId}`, input: { currency: "USD", amount: Number(record?.financial?.totalActual || 0), description: clean(record?.work?.description || record?.work?.title) || "Technology work order", documentNumber: clean(record?.identity?.number), financialState: "incurred", status: clean(record?.work?.status || "in-progress"), techWorkOrder: record, references: context.references || [] }, metadata: { transactModule: "technology-work-order", recordSchema: record?.schema }, signal });
  const document = response?.financialDocument || response?.record?.financialDocument || {};
  const financialDocumentId = clean(document.financialDocumentId);
  return { response, record: { ...record, identity: { ...(record.identity || {}), techWorkOrderId: financialDocumentId || record?.identity?.techWorkOrderId, workOrderId: financialDocumentId || record?.identity?.workOrderId, number: clean(document.documentNumber) || financialDocumentId || record?.identity?.number }, financialBinding: { financialDocumentId, revision: Number(response?.record?.server?.revision || response?.record?.revision || 1) } } };
}

export async function updateIXITechWorkOrder({ record = {}, action = "update", signal } = {}) {
  const financialDocumentId = clean(record?.financialBinding?.financialDocumentId || record?.identity?.techWorkOrderId);
  if (!financialDocumentId) throw new Error("Technology work order is not bound to a financial document.");
  const commandId = globalThis.crypto?.randomUUID?.() || `techwo-update-${Date.now()}`;
  return patchIXIAosFinancialDocument({ financialDocumentId, expectedRevision: record?.financialBinding?.revision, commandId, idempotencyKey: commandId, patch: { techWorkOrder: record, financialState: ["complete", "closed"].includes(clean(record?.work?.status)) ? "closed" : "incurred", completedAt: clean(record?.dates?.completedAt) }, metadata: { transactModule: "technology-work-order", action }, signal });
}
