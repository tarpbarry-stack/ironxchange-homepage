import {
  createIXIAosObjectFinancialDocument,
  createIXIAosFinancialObjectReference,
  mergeIXIAosFinancialReferences
} from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";

import {
  runIXIActionNoticeLifecycle
} from "../../../../ixi-object-system/IXIActionNoticeEngine";

import {
  createIXIPurchaseDraft,
  validateIXIPurchase
} from "./IXIPurchaseContract";

import {
  evaluateIXIPurchaseRuntime,
  resolveIXIPurchasingPolicy
} from "./IXIPurchasePolicyEngine";

import {
  createIXIPurchaseRecord,
  attachIXIPurchaseFinancialDocument
} from "./IXIPurchaseRecordEngine";

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

  if (!resolvedRole || (!resolvedPassportId && !resolvedExternalId)) return null;

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
    response.document?.documentId ||
    response.document?.id ||
    response.id
  );
}

function getOriginatingObjectId(object = {}, context = {}) {
  return clean(
    context.primary?.objectId ||
    context.primary?.id ||
    context.primary?.passportId ||
    object?.objectId ||
    object?.id ||
    object?.passportId
  );
}

function buildPurchaseReferences({
  context = {},
  input = {},
  vendorLabel = "",
  vendorPassportId = "",
  workOrderId = "",
  workOrderNumber = ""
} = {}) {
  const references = [];

  for (const [candidate, role] of [
    [context.entity || {}, "entity"],
    [context.location || {}, "location"],
    [context.actor || {}, "employee"]
  ]) {
    const reference = createIXIAosFinancialObjectReference({ object: candidate, role });
    if (reference) references.push(reference);
  }

  const vendorReference = clean(vendorPassportId)
    ? createExternalReference({
        passportId: vendorPassportId,
        role: "vendor",
        label: vendorLabel,
        objectType: "vendor"
      })
    : createIXIAosFinancialObjectReference({
        object: input.vendor || {},
        role: "vendor"
      });

  if (vendorReference) references.push(vendorReference);

  const workOrderReference = createExternalReference({
    role: "work-order",
    label: workOrderNumber,
    objectType: "work-order",
    externalId: workOrderId || workOrderNumber
  });

  if (workOrderReference) references.push(workOrderReference);

  return mergeIXIAosFinancialReferences(references);
}

function createPurchaseFinancialInput({
  purchase = {},
  workOrderId = "",
  workOrderNumber = "",
  financialState = "requested",
  status = "requested",
  references = [],
  approval = null
} = {}) {
  return {
    workOrderId,
    workOrderNumber,
    vendorId: purchase.vendorId,
    vendorName: purchase.vendorLabel,
    documentDate: clean(purchase.documentDate) || new Date().toISOString().slice(0, 10),
    dueDate: purchase.neededByDate,
    currency: purchase.currency || "USD",
    subtotal: Number(purchase.subtotal || 0),
    total: Number(purchase.estimatedTotal || 0),
    shipping: Number(purchase.estimatedShipping || 0),
    status,
    financialState,
    description:
      purchase.whatNeeded ||
      (Array.isArray(purchase.items)
        ? purchase.items.map(line => line.description).filter(Boolean).join(", ")
        : ""),
    businessReason: purchase.businessReason,
    shipToId: purchase.shipToId,
    shipToLabel: purchase.shipToLabel,
    notes: purchase.notes,
    costCode: purchase.costCode,
    chargeTo: purchase.chargeTo,
    lines: (Array.isArray(purchase.items) ? purchase.items : []).map(line => ({
      lineType: "item",
      lineId: line.lineId,
      description: line.description,
      quantity: Number(line.quantity || 0),
      unit: line.unit,
      unitPrice: Number(line.committedUnitCost ?? line.estimatedUnitCost ?? 0),
      amount: Number(line.quantity || 0) * Number(line.committedUnitCost ?? line.estimatedUnitCost ?? 0)
    })),
    attachments: Array.isArray(purchase.attachments) ? purchase.attachments : [],
    approval,
    references
  };
}

export async function createIXIPurchase({
  object = {},
  context = {},
  workOrder = {},
  input = {},
  policy = null,
  authority = null,
  metadata = {},
  signal = undefined
} = {}) {
  const resolvedPolicy = resolveIXIPurchasingPolicy(context, policy);
  const draft = createIXIPurchaseDraft({ context, workOrder, input });
  const validation = validateIXIPurchase(draft, {
    requireVendor: resolvedPolicy.request.requireVendor !== false,
    requireBusinessReason: resolvedPolicy.request.requireBusinessReason !== false
  });

  if (!validation.valid) {
    const error = new Error("Purchase request / PO is incomplete or invalid.");
    error.code = "IXI_PURCHASE_VALIDATION_FAILED";
    error.validation = validation;
    throw error;
  }

  const runtime = evaluateIXIPurchaseRuntime({
    context,
    purchase: draft,
    policy: resolvedPolicy,
    authority
  });

  const requestedDirectPo = draft.purchase.requestType === "purchase-order";

  if (requestedDirectPo && !runtime.canDirectPo) {
    const error = new Error(
      "Current user does not have direct Purchase Order authority for this amount."
    );
    error.code = "IXI_PURCHASE_DIRECT_PO_AUTHORITY_REQUIRED";
    error.authority = runtime;
    throw error;
  }

  if (
    runtime.quoteRequirement.requiredQuotes >
    Number(draft.purchase.quoteCount || 0)
  ) {
    const error = new Error(
      `This purchase requires ${runtime.quoteRequirement.requiredQuotes} quote(s) before submission.`
    );
    error.code = "IXI_PURCHASE_QUOTES_REQUIRED";
    error.requiredQuotes = runtime.quoteRequirement.requiredQuotes;
    throw error;
  }

  const mergedReferences = buildPurchaseReferences({
    context,
    input,
    vendorLabel: draft.purchase.vendorLabel,
    vendorPassportId: draft.purchase.vendorPassportId,
    workOrderId: draft.context.workOrderId,
    workOrderNumber: draft.context.workOrderNumber
  });

  const purchase = draft.purchase;
  const clientRequestId = clean(draft.identity.clientRequestId);
  const idempotencyKey = clientRequestId
    ? `ixi-transact-purchase:${clientRequestId}`
    : "";
  const originatingObjectId = getOriginatingObjectId(object, context);

  return runIXIActionNoticeLifecycle({
    objectId: originatingObjectId,
    commandId: clientRequestId,
    source: "ixi-transact-purchase",
    savingMessage: requestedDirectPo
      ? "CREATING PURCHASE ORDER..."
      : "CREATING PURCHASE REQUEST...",
    successMessage: result => {
      const number =
        result?.record?.identity?.poNumber ||
        result?.record?.identity?.requestNumber ||
        "";
      return requestedDirectPo
        ? `PURCHASE ORDER ${number || "CREATED"}`
        : `PURCHASE REQUEST ${number || "CREATED"}`;
    },
    errorMessage: error => clean(error?.message) || "PURCHASE SAVE FAILED",
    operation: async () => {
      const response = await createIXIAosObjectFinancialDocument({
        object,
        documentType: requestedDirectPo
          ? "purchase-order"
          : "purchase-requisition",
        commandId: clientRequestId,
        idempotencyKey,
        signal,
        input: createPurchaseFinancialInput({
          purchase,
          workOrderId: draft.context.workOrderId,
          workOrderNumber: draft.context.workOrderNumber,
          financialState: requestedDirectPo ? "committed" : "requested",
          status: requestedDirectPo ? "open" : "requested",
          references: mergedReferences,
          approval: {
            requiredRole: runtime.approval.role,
            requiredRoleLabel: runtime.approval.label,
            requiredAuthority: runtime.approval.authorityCeiling,
            quoteRequirement: runtime.quoteRequirement
          }
        }),
        additionalReferences: mergedReferences,
        metadata: {
          ...metadata,
          transactModule: "purchase",
          purchaseSchema: draft.schema,
          workOrderId: draft.context.workOrderId,
          workOrderNumber: draft.context.workOrderNumber,
          requestType: purchase.requestType,
          financialState: requestedDirectPo ? "committed" : "requested",
          originatingObjectId,
          originatingPassportId: draft.context.primaryPassportId,
          clientRequestId
        }
      });

      const purchaseId =
        getFinancialDocumentId(response) ||
        clean(draft.identity.purchaseId) ||
        clientRequestId;

      const committedDraft = {
        ...draft,
        identity: {
          ...draft.identity,
          purchaseId
        },
        financial: {
          ...draft.financial,
          state: requestedDirectPo ? "committed" : "requested",
          committedAmount: requestedDirectPo
            ? draft.purchase.estimatedTotal
            : 0
        },
        status: requestedDirectPo ? "po-issued" : "pending-approval"
      };

      const record = createIXIPurchaseRecord({
        draft: committedDraft,
        context,
        actor: context.actor,
        policy: resolvedPolicy,
        authority,
        forceDirectPo: requestedDirectPo,
        financialDocumentId: purchaseId
      });

      return {
        draft: committedDraft,
        record,
        response,
        runtime
      };
    }
  });
}

export async function issueIXIPurchaseOrderFromRecord({
  object = {},
  context = {},
  record = {},
  policy = null,
  authority = null,
  metadata = {},
  signal = undefined
} = {}) {
  if (clean(record?.status) !== "approved") {
    const error = new Error("Purchase Request must be approved before issuing a Purchase Order.");
    error.code = "IXI_PURCHASE_NOT_APPROVED";
    throw error;
  }

  const runtime = evaluateIXIPurchaseRuntime({
    context,
    purchase: record,
    policy,
    authority
  });

  if (!runtime.actions.includes("issue-po")) {
    const error = new Error("Current user is not authorized to issue this Purchase Order.");
    error.code = "IXI_PURCHASE_ISSUE_PO_NOT_AUTHORIZED";
    throw error;
  }

  const purchaseId = clean(
    record?.identity?.purchaseId ||
    record?.identity?.clientRequestId
  );
  const requestNumber = clean(record?.identity?.requestNumber);
  const poNumber = clean(record?.identity?.poNumber) ||
    `PO-${requestNumber.replace(/^PR-/, "") || purchaseId.replace(/\D/g, "").slice(-6)}`;
  const commandId = `${purchaseId || requestNumber}:issue-po`;
  const originatingObjectId = getOriginatingObjectId(object, context);
  const purchase = record?.purchase || {};
  const workOrderId = clean(record?.context?.workOrderId);
  const workOrderNumber = clean(record?.context?.workOrderNumber);

  const references = buildPurchaseReferences({
    context,
    vendorLabel: purchase.vendorLabel,
    vendorPassportId: purchase.vendorPassportId,
    workOrderId,
    workOrderNumber
  });

  const requestDocumentId = clean(record?.financialLinks?.requestDocumentId);

  return runIXIActionNoticeLifecycle({
    objectId: originatingObjectId,
    commandId,
    source: "ixi-transact-purchase-issue-po",
    savingMessage: "ISSUING PURCHASE ORDER...",
    successMessage: `PURCHASE ORDER ${poNumber} ISSUED`,
    errorMessage: error => clean(error?.message) || "PURCHASE ORDER ISSUE FAILED",
    operation: async () => {
      const response = await createIXIAosObjectFinancialDocument({
        object,
        documentType: "purchase-order",
        commandId,
        idempotencyKey: `ixi-transact-purchase:${commandId}`,
        signal,
        input: createPurchaseFinancialInput({
          purchase: {
            ...purchase,
            documentDate: new Date().toISOString().slice(0, 10)
          },
          workOrderId,
          workOrderNumber,
          financialState: "committed",
          status: "open",
          references,
          approval: {
            status: record?.approval?.status,
            approvals: record?.approval?.approvals || [],
            sourceRequestNumber: requestNumber,
            sourceRequestDocumentId: requestDocumentId
          }
        }),
        additionalReferences: references,
        metadata: {
          ...metadata,
          transactModule: "purchase",
          purchaseRecordId: purchaseId,
          sourceRequestNumber: requestNumber,
          sourceRequestDocumentId: requestDocumentId,
          poNumber,
          financialState: "committed",
          originatingObjectId
        }
      });

      const poDocumentId = getFinancialDocumentId(response);
      if (!poDocumentId) {
        const error = new Error("Purchase Order persistence did not return a canonical document ID.");
        error.code = "IXI_PURCHASE_PO_ID_MISSING";
        throw error;
      }

      const linkedRecord = attachIXIPurchaseFinancialDocument(
        {
          ...record,
          identity: {
            ...(record.identity || {}),
            poNumber
          }
        },
        {
          type: "po",
          documentId: poDocumentId
        }
      );

      return {
        record: linkedRecord,
        poNumber,
        poDocumentId,
        response
      };
    }
  });
}

export default {
  createIXIPurchase,
  issueIXIPurchaseOrderFromRecord
};
