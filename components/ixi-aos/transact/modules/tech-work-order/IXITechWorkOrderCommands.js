import {
  createIXIAosFinancialObjectReference,
  createIXIAosWorkOrder
} from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";
import {
  createIXITechWorkOrderDraft,
  normalizeIXITechWorkOrder
} from "./IXITechWorkOrderContract";

const clean = value => String(value ?? "").trim();

export async function createIXITechWorkOrder({
  object = {},
  context = {},
  input = {},
  commandId = "",
  idempotencyKey = "",
  metadata = {},
  apiBaseUrl = "",
  headers = {},
  signal
} = {}) {
  const draft = createIXITechWorkOrderDraft({ context, input });
  if (clean(input.startedAt)) draft.dates.startedAt = clean(input.startedAt);
  if (Array.isArray(input.activityProjection)) draft.activityProjection = input.activityProjection;
  const stableId = clean(commandId || idempotencyKey);
  if (!stableId) {
    const error = new Error("Tech Work Order requires a stable command identity.");
    error.code = "IXI_TECH_WORK_ORDER_COMMAND_ID_REQUIRED";
    throw error;
  }
  if (!clean(draft.context.primaryPassportId)) {
    const error = new Error("This object needs an IXI Passport before Tech Work can be created.");
    error.code = "IXI_TECH_WORK_ORDER_PASSPORT_REQUIRED";
    throw error;
  }

  const references = [
    createIXIAosFinancialObjectReference({ object: context.entity || {}, role: "entity" }),
    createIXIAosFinancialObjectReference({ object: context.location || {}, role: "location" }),
    createIXIAosFinancialObjectReference({ object: context.actor || {}, role: "technician" })
  ].filter(Boolean);

  const response = await createIXIAosWorkOrder({
    object,
    input: {
      currency: "USD",
      amount: 0,
      description: draft.work.description || draft.work.title || "Technology work order",
      financialState: "incurred",
      occurredAt: draft.dates.requestedAt,
      workOrderType: "technology",
      priority: draft.work.priority,
      techWorkOrder: draft,
      references
    },
    additionalReferences: references,
    commandId: stableId,
    idempotencyKey: clean(idempotencyKey) || stableId,
    metadata: {
      ...metadata,
      transactModule: "tech-work-order",
      techWorkOrderSchema: draft.schema,
      originatingPassportId: draft.context.primaryPassportId,
      originatingObjectType: draft.context.primaryObjectType,
      clientRequestId: stableId
    },
    apiBaseUrl,
    headers,
    signal
  });

  const document = response?.financialDocument || response?.record?.financialDocument || {};
  const financialDocumentId = clean(document.financialDocumentId);
  if (!financialDocumentId) {
    const error = new Error("IXI Financial did not return a canonical Tech Work Order identity.");
    error.code = "IXI_TECH_WORK_ORDER_IDENTITY_MISSING";
    throw error;
  }

  return {
    draft: normalizeIXITechWorkOrder({
      ...(document.techWorkOrder || draft),
      identity: {
        ...(document.techWorkOrder?.identity || draft.identity),
        clientRequestId: stableId,
        techWorkOrderId: financialDocumentId,
        workOrderId: financialDocumentId,
        number: clean(document.documentNumber) || financialDocumentId
      },
      financialBinding: {
        financialDocumentId,
        revision: Number(response?.record?.server?.revision || response?.record?.revision || 1)
      }
    }),
    response
  };
}

export default { createIXITechWorkOrder };
