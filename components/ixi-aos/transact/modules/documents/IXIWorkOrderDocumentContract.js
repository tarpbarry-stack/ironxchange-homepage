const clean = value => String(value ?? "").trim();

export const IXI_WORK_ORDER_DOCUMENT_SCHEMA = "ixi-work-order-document-v1";

export const IXI_WORK_ORDER_DOCUMENT_TYPES = Object.freeze([
  "photo",
  "receipt",
  "invoice",
  "quote",
  "report",
  "other"
]);

function normalizeType(value) {
  const candidate = clean(value).toLowerCase();
  return IXI_WORK_ORDER_DOCUMENT_TYPES.includes(candidate) ? candidate : "other";
}

export function createIXIWorkOrderGeneralDocumentDraft({
  context = {},
  workOrder = {},
  input = {}
} = {}) {
  const actor = context.actor || {};
  const workOrderId = clean(
    workOrder.identity?.workOrderId ||
      workOrder.workOrderId ||
      workOrder.id
  );
  const workOrderNumber = clean(
    workOrder.identity?.number ||
      workOrder.workOrderNumber ||
      workOrder.number
  );
  const now = clean(input.createdAt) || new Date().toISOString();

  return {
    schema: IXI_WORK_ORDER_DOCUMENT_SCHEMA,
    identity: {
      documentId: clean(input.documentId),
      clientRequestId: clean(input.clientRequestId)
    },
    context: {
      primaryPassportId: clean(context.primary?.passportId),
      primaryObjectId: clean(context.primary?.objectId),
      primaryObjectType: clean(context.primary?.objectType),
      primaryLabel: clean(context.primary?.label),
      entityPassportId: clean(context.entity?.passportId),
      locationPassportId: clean(context.location?.passportId),
      employeePassportId: clean(actor.passportId),
      employeeId: clean(actor.employeeId || actor.userId || actor.id),
      workOrderId,
      workOrderNumber
    },
    document: {
      type: normalizeType(input.documentType),
      title: clean(input.title || input.fileName),
      fileName: clean(input.fileName),
      mimeType: clean(input.mimeType).toLowerCase(),
      size: Number(input.size || 0),
      status: clean(input.status) || "local-pending-upload",
      relatedType: "general",
      relatedId: workOrderId || workOrderNumber,
      relatedLabel: workOrderNumber
    },
    status: "draft",
    audit: {
      createdAt: now,
      createdBy: clean(actor.userId || actor.employeeId || actor.passportId || actor.id),
      createdByLabel: clean(actor.displayName || actor.name || actor.label)
    }
  };
}

export function validateIXIWorkOrderGeneralDocument(draft = {}) {
  const errors = {};

  if (!clean(draft.context?.primaryPassportId)) {
    errors.primary = "Originating AOS Passport is required";
  }

  if (!clean(draft.context?.workOrderId) && !clean(draft.context?.workOrderNumber)) {
    errors.workOrder = "Work Order relationship is required";
  }

  if (!clean(draft.document?.fileName)) {
    errors.fileName = "File name is required";
  }

  if (!(Number(draft.document?.size) > 0)) {
    errors.size = "File is empty";
  }

  if (!IXI_WORK_ORDER_DOCUMENT_TYPES.includes(clean(draft.document?.type))) {
    errors.documentType = "invalid";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

export default {
  createIXIWorkOrderGeneralDocumentDraft,
  validateIXIWorkOrderGeneralDocument
};
