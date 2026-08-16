import {
  createIXIAosObjectFinancialDocument,
  createIXIAosFinancialObjectReference,
  mergeIXIAosFinancialReferences
} from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";

import {
  createIXIPurchaseDraft,
  validateIXIPurchase
} from "./IXIPurchaseContract";

const clean = value => String(value ?? "").trim();

function createExternalReference({
  passportId = "",
  role = "",
  label = "",
  objectType = "",
  externalId = ""
} = {}) {
  const resolvedRole = clean(role);
  const resolvedPassportId = clean(passportId);
  const resolvedExternalId = clean(externalId);

  if (!resolvedRole || (!resolvedPassportId && !resolvedExternalId)) {
    return null;
  }

  return {
    ...(resolvedPassportId ? { passportId: resolvedPassportId } : {}),
    ...(resolvedExternalId ? { externalId: resolvedExternalId } : {}),
    role: resolvedRole,
    label: clean(label),
    objectType: clean(objectType)
  };
}

function getFinancialDocumentId(response = {}) {
  return clean(
    response.financialDocument?.documentId ||
    response.financialDocument?.id ||
    response.record?.documentId ||
    response.record?.id ||
    ""
  );
}

export async function createIXIPurchase({
  object = {},
  context = {},
  workOrder = {},
  input = {},
  metadata = {},
  signal = undefined
} = {}) {
  const draft = createIXIPurchaseDraft({ context, workOrder, input });
  const validation = validateIXIPurchase(draft);

  if (!validation.valid) {
    const error = new Error("Purchase request / PO is incomplete or invalid.");
    error.code = "IXI_PURCHASE_VALIDATION_FAILED";
    error.validation = validation;
    throw error;
  }

  const references = [];

  for (const [candidate, role] of [
    [context.entity || {}, "entity"],
    [context.location || {}, "location"],
    [context.actor || {}, "employee"]
  ]) {
    const reference = createIXIAosFinancialObjectReference({ object: candidate, role });
    if (reference) references.push(reference);
  }

  const vendorReference = clean(draft.purchase.vendorPassportId)
    ? createExternalReference({
        passportId: draft.purchase.vendorPassportId,
        role: "vendor",
        label: draft.purchase.vendorLabel,
        objectType: "vendor"
      })
    : createIXIAosFinancialObjectReference({ object: input.vendor || {}, role: "vendor" });

  if (vendorReference) references.push(vendorReference);

  const workOrderReference = createExternalReference({
    role: "work-order",
    label: draft.context.workOrderNumber,
    objectType: "work-order",
    externalId: draft.context.workOrderId || draft.context.workOrderNumber
  });

  if (workOrderReference) references.push(workOrderReference);

  const mergedReferences = mergeIXIAosFinancialReferences(references);
  const purchase = draft.purchase;
  const clientRequestId = clean(draft.identity.clientRequestId);
  const idempotencyKey = clientRequestId ? `ixi-transact-purchase:${clientRequestId}` : "";

  const response = await createIXIAosObjectFinancialDocument({
    object,
    documentType: purchase.requestType === "purchase-order" ? "purchase-order" : "purchase-requisition",
    commandId: clientRequestId,
    idempotencyKey,
    signal,
    input: {
      workOrderId: draft.context.workOrderId,
      workOrderNumber: draft.context.workOrderNumber,
      vendorId: purchase.vendorId,
      vendorName: purchase.vendorLabel,
      documentDate: draft.createdAt.slice(0, 10),
      dueDate: purchase.neededByDate,
      currency: purchase.currency,
      subtotal: purchase.subtotal,
      total: purchase.estimatedTotal,
      shipping: purchase.estimatedShipping,
      status: "open",
      financialState: draft.financial.state,
      description: `${purchase.requestType}: ${purchase.items.map(line => line.description).filter(Boolean).join(", ")}`,
      notes: purchase.notes,
      costCode: purchase.costCode,
      chargeTo: purchase.chargeTo,
      lines: purchase.items.map(line => ({
        lineType: "item",
        lineId: line.lineId,
        description: line.description,
        quantity: line.quantity,
        unit: line.unit,
        unitPrice: line.estimatedUnitCost,
        amount: line.estimatedTotal
      })),
      attachments: purchase.attachments,
      reconciliation: draft.reconciliation,
      references: mergedReferences
    },
    additionalReferences: mergedReferences,
    metadata: {
      ...metadata,
      transactModule: "purchase",
      purchaseSchema: draft.schema,
      workOrderId: draft.context.workOrderId,
      workOrderNumber: draft.context.workOrderNumber,
      requestType: purchase.requestType,
      financialState: draft.financial.state,
      clientRequestId
    }
  });

  const purchaseId = getFinancialDocumentId(response) || clean(draft.identity.purchaseId) || clientRequestId;

  return {
    draft: {
      ...draft,
      identity: { ...draft.identity, purchaseId },
      status: "posted"
    },
    response
  };
}

export default { createIXIPurchase };