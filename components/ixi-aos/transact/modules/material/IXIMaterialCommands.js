import {
  createIXIAosObjectFinancialDocument,
  createIXIAosFinancialObjectReference
} from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";
import {
  createIXIMaterialDraft,
  validateIXIMaterial
} from "./IXIMaterialContract";
import {
  runIXIActionNoticeLifecycle
} from "../../../../ixi-object-system/IXIActionNoticeEngine";

const clean = value => String(value ?? "").trim();

function pushUniqueReference(refs, reference) {
  if (!reference) return;
  const key = [
    clean(reference.passportId),
    clean(reference.externalId),
    clean(reference.role),
    clean(reference.label)
  ].join("|");
  if (refs.some(item => [
    clean(item.passportId),
    clean(item.externalId),
    clean(item.role),
    clean(item.label)
  ].join("|") === key)) return;
  refs.push(reference);
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
  signal
} = {}) {
  const draft = createIXIMaterialDraft({ context, workOrder, input });
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
    label: clean(object.label || draft.context.primaryLabel)
  };
  const resolvedCommandId = clean(commandId || input.clientRequestId || draft.identity.clientRequestId || `MAT-${Date.now()}`);
  const resolvedIdempotencyKey = clean(idempotencyKey || `ixi-material:${resolvedCommandId}`);
  const noticeObjectId = clean(
    context.primary?.objectId ||
    context.primary?.passportId ||
    resolvedObject.objectId ||
    resolvedObject.passportId
  );

  return runIXIActionNoticeLifecycle({
    objectId: noticeObjectId,
    commandId: resolvedCommandId,
    source: "ixi-transact-material",
    savingMessage: "RECORDING MATERIAL...",
    successMessage: result => {
      const id = clean(
        result?.draft?.identity?.materialUsageId ||
        result?.draft?.identity?.clientRequestId
      );
      return id ? `MATERIAL ${id} RECORDED` : "MATERIAL RECORDED";
    },
    errorMessage: "MATERIAL SAVE FAILED",
    operation: async () => {
      const additionalReferences = [];
      pushUniqueReference(additionalReferences, createIXIAosFinancialObjectReference({ object: context.primary || resolvedObject, role: "origin" }));
      pushUniqueReference(additionalReferences, createIXIAosFinancialObjectReference({ object: context.location || {}, role: "location" }));
      pushUniqueReference(additionalReferences, createIXIAosFinancialObjectReference({ object: context.actor || {}, role: "employee" }));
      pushUniqueReference(additionalReferences, createIXIAosFinancialObjectReference({ object: context.entity || {}, role: "entity" }));

      if (clean(draft.context.workOrderId || draft.context.workOrderNumber)) {
        pushUniqueReference(additionalReferences, {
          role: draft.context.techWorkOrderId ? "tech-work-order" : "work-order",
          label: draft.context.workOrderNumber,
          objectType: draft.context.techWorkOrderId ? "technology-work-order" : "work-order",
          externalId: draft.context.techWorkOrderId || draft.context.workOrderId || draft.context.workOrderNumber
        });
      }

      if (clean(draft.material.purchaseOrderId || draft.material.purchaseOrderNumber)) {
        pushUniqueReference(additionalReferences, {
          role: "purchase-order",
          label: draft.material.purchaseOrderNumber || draft.material.purchaseOrderId,
          objectType: "purchase-order",
          externalId: draft.material.purchaseOrderId || draft.material.purchaseOrderNumber
        });
      }

      if (clean(draft.material.inventoryPassportId || draft.material.inventoryItemId)) {
        pushUniqueReference(additionalReferences, {
          role: "inventory-item",
          label: draft.material.description,
          objectType: "inventory-item",
          passportId: draft.material.inventoryPassportId,
          externalId: draft.material.inventoryItemId
        });
      }

      const response = await createIXIAosObjectFinancialDocument({
        object: resolvedObject,
        documentType: "material-usage",
        input: {
          currency: draft.costAttribution.currency,
          amount: draft.material.extendedCost,
          description: draft.material.description,
          status: "posted",
          material: draft.material,
          costAttribution: draft.costAttribution,
          inventoryAdjustment: draft.inventoryAdjustment,
          receivingConsumption: draft.receivingConsumption,
          attachments: draft.attachments,
          references: additionalReferences
        },
        additionalReferences,
        commandId: resolvedCommandId,
        idempotencyKey: resolvedIdempotencyKey,
        metadata: {
          ...metadata,
          transactModule: "material",
          materialSchema: draft.schema,
          materialSource: draft.material.source,
          economicEvent: false,
          originatingPassportId: draft.context.primaryPassportId,
          originatingObjectId: draft.context.primaryObjectId,
          originatingObjectType: draft.context.primaryObjectType,
          originatingLabel: draft.context.primaryLabel,
          workOrderId: draft.context.workOrderId,
          techWorkOrderId: draft.context.techWorkOrderId,
          workOrderNumber: draft.context.workOrderNumber,
          purchaseOrderId: draft.material.purchaseOrderId,
          purchaseOrderLineId: draft.material.purchaseOrderLineId,
          inventoryAdjustmentRequired: Boolean(draft.inventoryAdjustment?.required),
          inventoryMutationStatus: draft.inventoryAdjustment?.status || "not-required",
          receivingConsumptionStatus: draft.receivingConsumption?.status || "not-required"
        },
        apiBaseUrl,
        headers,
        signal
      });

      const materialUsageId = clean(
        response?.materialUsageId ||
        response?.document?.documentId ||
        response?.financialDocument?.documentId ||
        draft.identity.materialUsageId ||
        draft.identity.clientRequestId ||
        resolvedCommandId
      );

      return {
        draft: {
          ...draft,
          identity: { ...draft.identity, materialUsageId },
          status: "posted"
        },
        response
      };
    }
  });
}

export default { createIXIMaterialUsage };
