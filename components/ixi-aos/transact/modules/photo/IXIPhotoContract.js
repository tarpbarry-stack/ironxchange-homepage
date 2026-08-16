const clean = value => String(value ?? "").trim();
const asArray = value => Array.isArray(value) ? value : [];

export const IXI_PHOTO_SCHEMA = "ixi-photo-v1";
export const IXI_PHOTO_TYPES = Object.freeze([
  "work-photo",
  "damage",
  "before-after",
  "reference",
  "tech-screen",
  "warning-fault"
]);

const IXI_PHOTO_MIME_TYPES = Object.freeze([
  "image/jpeg",
  "image/png",
  "image/webp"
]);

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

function normalizePhotoType(value) {
  const candidate = clean(value).toLowerCase();
  return IXI_PHOTO_TYPES.includes(candidate) ? candidate : "work-photo";
}

function normalizeTags(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map(clean).filter(Boolean))];
  }

  return [...new Set(clean(value).split(",").map(clean).filter(Boolean))];
}

function normalizeMedia(media = [], photoId = "") {
  return asArray(media).map((item, index) => ({
    mediaId: clean(item.mediaId || item.id) || `${photoId || "PHOTO"}-MEDIA-${index + 1}`,
    fileName: clean(item.fileName || item.name) || `photo-${index + 1}.jpg`,
    mimeType: clean(item.mimeType || item.type).toLowerCase() || "image/jpeg",
    size: Number(item.size || 0),
    width: Number(item.width || 0),
    height: Number(item.height || 0),
    previewUrl: clean(item.previewUrl),
    status: clean(item.status) || "local-pending-upload"
  }));
}

function validTimestamp(value) {
  const candidate = clean(value);
  return Boolean(candidate) && !Number.isNaN(new Date(candidate).getTime());
}

function resolveLinkedWorkRecord(workOrder = {}) {
  const isTechWorkOrder = Boolean(
    clean(workOrder?.identity?.techWorkOrderId) ||
    clean(workOrder?.schema).startsWith("ixi-tech-work-order")
  );

  const id = clean(
    isTechWorkOrder
      ? workOrder.identity?.techWorkOrderId || workOrder.identity?.workOrderId || workOrder.id
      : workOrder.identity?.workOrderId || workOrder.workOrderId || workOrder.id
  );

  const number = clean(
    workOrder.identity?.number ||
    workOrder.workOrderNumber ||
    workOrder.number
  );

  return {
    type: isTechWorkOrder ? "tech-work-order" : "work-order",
    id,
    number,
    isTechWorkOrder
  };
}

export function createIXIPhotoDraft({
  context = {},
  workOrder = {},
  input = {}
} = {}) {
  const actor = context.actor || {};
  const photoId = clean(input.photoId || input.clientRequestId);
  const linkedWork = resolveLinkedWorkRecord(workOrder);
  const occurredAt = clean(input.occurredAt) || new Date().toISOString();

  return {
    schema: IXI_PHOTO_SCHEMA,
    identity: {
      photoId,
      clientRequestId: clean(input.clientRequestId)
    },
    context: {
      primaryPassportId: clean(context.primary?.passportId),
      primaryObjectId: clean(context.primary?.objectId),
      primaryObjectType: clean(context.primary?.objectType),
      primaryLabel: clean(context.primary?.label),
      entityPassportId: clean(context.entity?.passportId),
      locationPassportId: clean(context.location?.passportId),
      locationLabel: clean(context.location?.label),
      employeePassportId: clean(actor.passportId),
      employeeId: clean(actor.employeeId || actor.userId || actor.id),
      employeeLabel: clean(actor.displayName || actor.name || actor.label),
      workOrderId: linkedWork.id,
      workOrderNumber: linkedWork.number,
      linkedRecordType: linkedWork.type
    },
    photo: {
      type: normalizePhotoType(input.photoType),
      title: clean(input.title),
      description: clean(input.description),
      occurredAt,
      linkedRecordType: linkedWork.type,
      linkedRecordId: linkedWork.id || linkedWork.number,
      linkedRecordLabel: linkedWork.number,
      tags: normalizeTags(input.tags),
      visibility: clean(input.visibility) || (linkedWork.isTechWorkOrder ? "tech-work-order-team" : "work-order-team"),
      media: normalizeMedia(input.media, photoId)
    },
    status: "draft",
    audit: {
      createdAt: occurredAt,
      createdBy: clean(actor.userId || actor.employeeId || actor.passportId || actor.id),
      createdByLabel: clean(actor.displayName || actor.name || actor.label)
    }
  };
}

export function validateIXIPhoto(draft = {}) {
  const errors = {};
  const media = asArray(draft.photo?.media);

  if (!clean(draft.context?.primaryPassportId)) {
    errors.primary = "Originating AOS Passport is required";
  }

  if (!clean(draft.context?.workOrderId) && !clean(draft.context?.workOrderNumber)) {
    errors.workOrder = "Work relationship is required";
  }

  if (!media.length) {
    errors.media = "required";
  }

  if (!IXI_PHOTO_TYPES.includes(clean(draft.photo?.type))) {
    errors.photoType = "invalid";
  }

  if (!validTimestamp(draft.photo?.occurredAt)) {
    errors.occurredAt = "invalid";
  }

  const invalidMedia = media.find(item =>
    !clean(item.fileName) ||
    !IXI_PHOTO_MIME_TYPES.includes(clean(item.mimeType).toLowerCase()) ||
    !(Number(item.size) > 0) ||
    Number(item.size) > MAX_PHOTO_BYTES
  );

  if (invalidMedia) {
    errors.mediaFile = "invalid";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

export default {
  createIXIPhotoDraft,
  validateIXIPhoto
};