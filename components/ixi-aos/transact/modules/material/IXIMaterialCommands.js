import {
  createIXIAosObjectFinancialDocument,
  createIXIAosFinancialObjectReference,
} from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";
import {
  createIXIMaterialDraft,
  validateIXIMaterial,
} from "./IXIMaterialContract";
import { runIXIActionNoticeLifecycle } from "../../../../ixi-object-system/IXIActionNoticeEngine";

const clean = (value) => String(value ?? "").trim();

function stableIdentity(input = {}, commandId = "") {
  const id = clean(commandId || input.clientRequestId);
  if (!id) {
    const error = new Error(
      "Material usage requires a stable command identity.",
    );
    error.code = "IXI_MATERIAL_COMMAND_ID_REQUIRED";
    throw error;
  }
  return id;
}

function pushUniqueReference(refs, reference) {
  if (!reference?.passportId || !reference?.role) return;
  const key = `${clean(reference.passportId)}|${clean(reference.role)}`;
  if (
    !refs.some(
      (item) => `${clean(item.passportId)}|${clean(item.role)}` === key,
    )
  )
    refs.push(reference);
}

function responseRecord(response = {}) {
  return response?.data?.record || response?.record || {};
}

function canonicalize(draft, response) {
  const stored = responseRecord(response);
  const document =
    stored?.financialDocument || response?.financialDocument || {};
  const financialDocumentId = clean(document.financialDocumentId);
  if (!financialDocumentId) {
    const error = new Error(
      "IXI Financial did not return a canonical Material identity.",
    );
    error.code = "IXI_MATERIAL_IDENTITY_MISSING";
    throw error;
  }
  return {
    ...(document.materialUsage || draft),
    identity: {
      ...(document.materialUsage?.identity || draft.identity),
      clientRequestId: clean(draft.identity?.clientRequestId),
      materialUsageId: financialDocumentId,
      number: clean(document.documentNumber) || financialDocumentId,
    },
    financialBinding: {
      financialDocumentId,
      revision: Number(stored?.server?.revision || stored?.revision || 1),
      financialLineId: clean(document?.lines?.[0]?.financialLineId),
    },
  };
}

export async function createIXIMaterialUsage({
  object = {},
  context = {},
  workOrder = {},
  input = {},
  commandId = "",
  idempotencyKey = "",
  metadata = {},
  apiBaseUrl = "",
  headers = {},
  signal,
} = {}) {
  const resolvedCommandId = stableIdentity(input, commandId);
  const draft = createIXIMaterialDraft({
    context,
    workOrder,
    input: { ...input, clientRequestId: resolvedCommandId },
  });
  const validation = validateIXIMaterial(draft);
  if (!validation.valid) {
    const error = new Error("Material usage is incomplete");
    error.validation = validation;
    throw error;
  }
  const resolvedObject = {
    ...object,
    passportId: clean(object.passportId || draft.context.primaryPassportId),
    objectId: clean(object.objectId || draft.context.primaryObjectId),
    objectType: clean(object.objectType || draft.context.primaryObjectType),
    label: clean(object.label || draft.context.primaryLabel),
  };
  const references = [];
  pushUniqueReference(
    references,
    createIXIAosFinancialObjectReference({
      object: context.primary || resolvedObject,
      role: "origin",
    }),
  );
  pushUniqueReference(
    references,
    createIXIAosFinancialObjectReference({
      object: context.location || {},
      role: "location",
    }),
  );
  pushUniqueReference(
    references,
    createIXIAosFinancialObjectReference({
      object: context.actor || {},
      role: "employee",
    }),
  );
  pushUniqueReference(
    references,
    createIXIAosFinancialObjectReference({
      object: context.entity || {},
      role: "entity",
    }),
  );
  if (
    draft.context.employeePassportId &&
    !references.some(
      (ref) =>
        ref.passportId === draft.context.employeePassportId &&
        ref.role === "employee",
    )
  )
    pushUniqueReference(references, {
      passportId: draft.context.employeePassportId,
      role: "employee",
      label: draft.context.employeeLabel,
      objectType: "employee",
    });
  if (draft.material.inventoryPassportId)
    pushUniqueReference(references, {
      passportId: draft.material.inventoryPassportId,
      role: "inventory-item",
      label: draft.material.description,
      objectType: "inventory-item",
    });
  const sourceFinancialDocumentId = clean(draft.context.workOrderId);
  const operation = () =>
    createIXIAosObjectFinancialDocument({
      object: resolvedObject,
      documentType: "material-usage",
      input: {
        currency: draft.costAttribution.currency,
        financialState: "incurred",
        occurredAt: `${draft.material.dateUsed}T12:00:00.000Z`,
        description: draft.material.description,
        memo: draft.material.notes,
        amount: draft.material.extendedCost,
        sourceFinancialDocumentId,
        materialUsage: draft,
        attachments: draft.attachments,
        references,
      },
      additionalReferences: references,
      commandId: resolvedCommandId,
      idempotencyKey: clean(
        idempotencyKey || `ixi-material:${resolvedCommandId}`,
      ),
      metadata: {
        ...metadata,
        transactModule: "material",
        materialSchema: draft.schema,
        materialSource: draft.material.source,
        economicEvent: false,
        clientRequestId: resolvedCommandId,
        workOrderId: sourceFinancialDocumentId,
      },
      apiBaseUrl,
      headers,
      signal,
    });
  const noticeObjectId = clean(
    draft.context.primaryObjectId || draft.context.primaryPassportId,
  );
  const response = noticeObjectId
    ? await runIXIActionNoticeLifecycle({
        objectId: noticeObjectId,
        commandId: resolvedCommandId,
        source: "ixi-transact-material",
        savingMessage: "RECORDING MATERIAL...",
        successMessage: "MATERIAL RECORDED",
        errorMessage: "MATERIAL SAVE FAILED",
        operation,
      })
    : await operation();
  return { draft: canonicalize(draft, response), response };
}

export default { createIXIMaterialUsage };
