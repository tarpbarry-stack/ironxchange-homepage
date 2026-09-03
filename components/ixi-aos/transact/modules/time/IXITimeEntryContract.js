const clean = value => String(value ?? "").trim();
const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;

export const IXI_TIME_ENTRY_SCHEMA = "ixi-time-entry-v2";

export function createIXITimeEntryDraft({ context = {}, workOrder = {}, input = {} } = {}) {
  const woId = clean(workOrder.identity?.workOrderId || workOrder.workOrderId || workOrder.id);
  const woNumber = clean(workOrder.identity?.number || workOrder.workOrderNumber || workOrder.number);
  const primary = context.primary || {};
  const actor = context.actor || {};
  const createdAt = new Date().toISOString();

  return {
    schema: IXI_TIME_ENTRY_SCHEMA,
    identity: {
      timeEntryId: clean(input.timeEntryId),
      clientRequestId: clean(input.clientRequestId)
    },
    context: {
      primaryPassportId: clean(primary.passportId),
      primaryObjectId: clean(primary.objectId),
      primaryObjectType: clean(primary.objectType),
      primaryLabel: clean(primary.label),
      entityPassportId: clean(context.entity?.passportId),
      entityLabel: clean(context.entity?.label),
      locationPassportId: clean(context.location?.passportId),
      locationLabel: clean(context.location?.label),
      employeePassportId: clean(input.employeePassportId || actor.passportId),
      employeeId: clean(input.employeeId || actor.employeeId || actor.userId || actor.id),
      employeeLabel: clean(actor.displayName || actor.name || actor.label),
      workOrderId: woId,
      workOrderNumber: woNumber
    },
    time: {
      mode: clean(input.mode || "manual"),
      workType: clean(input.workType),
      date: clean(input.date),
      startTime: clean(input.startTime),
      endTime: clean(input.endTime),
      hours: num(input.hours),
      billable: input.billable !== false,
      overtime: Boolean(input.overtime),
      description: clean(input.description),
      notes: clean(input.notes),
      startedAt: clean(input.startedAt),
      endedAt: clean(input.endedAt),
      source: clean(input.source || (woId || woNumber ? "work-record" : "standalone-transact"))
    },
    session: input.session && typeof input.session === "object" ? { ...input.session } : null,
    attachments: Array.isArray(input.attachments) ? input.attachments : [],
    status: clean(input.status || "draft").toLowerCase(),
    createdAt
  };
}

export function validateIXITimeEntry(draft = {}, { allowZeroHours = false } = {}) {
  const errors = {};
  if (!clean(draft.context?.employeePassportId || draft.context?.employeeId)) errors.employee = "required";
  if (!clean(draft.context?.primaryPassportId || draft.context?.primaryObjectId || draft.context?.primaryLabel)) errors.primary = "required";
  if (!clean(draft.time?.workType)) errors.workType = "required";
  if (!clean(draft.time?.date)) errors.date = "required";
  if (allowZeroHours ? num(draft.time?.hours) < 0 : !(num(draft.time?.hours) > 0)) errors.hours = "required";
  if (!clean(draft.time?.description)) errors.description = "required";
  return { valid: Object.keys(errors).length === 0, errors };
}

export default {
  createIXITimeEntryDraft,
  validateIXITimeEntry
};
