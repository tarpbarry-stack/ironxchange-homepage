const clean = value => String(value ?? "").trim();
const asArray = value => Array.isArray(value) ? value : [];

export const IXI_NOTE_SCHEMA = "ixi-note-v1";
export const IXI_NOTE_TYPES = Object.freeze([
  "work-note",
  "issue",
  "recommendation"
]);

function normalizeType(value) {
  const candidate = clean(value).toLowerCase();
  return IXI_NOTE_TYPES.includes(candidate) ? candidate : "work-note";
}

function normalizeVisibility(value) {
  return clean(value).toLowerCase() || "work-order-team";
}

function normalizeTags(value) {
  return [...new Set(asArray(value).map(clean).filter(Boolean))];
}

function validDateOnly(value) {
  const candidate = clean(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate)) return false;
  return !Number.isNaN(new Date(`${candidate}T00:00:00`).getTime());
}

export function createIXINoteDraft({
  context = {},
  workOrder = {},
  input = {}
} = {}) {
  const now = clean(input.createdAt) || new Date().toISOString();
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
  const actor = context.actor || {};
  const attachment =
    input.attachment && typeof input.attachment === "object"
      ? input.attachment
      : null;

  return {
    schema: IXI_NOTE_SCHEMA,
    identity: {
      noteId: clean(input.noteId),
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
    note: {
      type: normalizeType(input.type),
      title: clean(input.title),
      body: clean(input.body),
      noteDate: clean(input.noteDate) || now.slice(0, 10),
      visibility: normalizeVisibility(input.visibility),
      tags: normalizeTags(input.tags),
      voiceTranscript: clean(input.voiceTranscript),
      attachments: attachment ? [attachment] : asArray(input.attachments)
    },
    flags: {
      surfaceAtCloseout: ["issue", "recommendation"].includes(normalizeType(input.type)),
      resolved: false
    },
    status: "draft",
    audit: {
      createdBy: clean(actor.userId || actor.employeeId || actor.passportId || actor.id),
      createdByLabel: clean(actor.displayName || actor.name || actor.label),
      createdAt: now,
      updatedAt: now
    }
  };
}

export function validateIXINote(draft = {}) {
  const errors = {};

  if (!clean(draft.context?.primaryPassportId)) {
    errors.primary = "Originating AOS Passport is required";
  }

  if (!clean(draft.context?.workOrderId) && !clean(draft.context?.workOrderNumber)) {
    errors.workOrder = "Work Order relationship is required";
  }

  if (!clean(draft.note?.body)) {
    errors.body = "required";
  }

  if (!IXI_NOTE_TYPES.includes(clean(draft.note?.type))) {
    errors.type = "invalid";
  }

  if (!validDateOnly(draft.note?.noteDate)) {
    errors.noteDate = "invalid";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

export default {
  createIXINoteDraft,
  validateIXINote
};
