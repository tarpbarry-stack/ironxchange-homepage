import {
  createIXIAosTimeEntry,
  createIXIAosFinancialObjectReference
} from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";
import {
  createIXITimeEntryDraft,
  validateIXITimeEntry
} from "./IXITimeEntryContract";

const clean = value => String(value ?? "").trim();

function pushUniqueReference(refs, reference) {
  if (!reference) return;
  const key = [
    clean(reference.passportId),
    clean(reference.externalId),
    clean(reference.role),
    clean(reference.label)
  ].join("|");
  if (refs.some(item => [clean(item.passportId), clean(item.externalId), clean(item.role), clean(item.label)].join("|") === key)) return;
  refs.push(reference);
}

export async function createIXITimeEntry({
  object = {},
  context = {},
  workOrder = {},
  input = {},
  metadata = {}
} = {}) {
  const draft = createIXITimeEntryDraft({ context, workOrder, input });
  const check = validateIXITimeEntry(draft);
  if (!check.valid) {
    const error = new Error("Time entry incomplete");
    error.validation = check;
    throw error;
  }

  const refs = [];
  const primary = createIXIAosFinancialObjectReference({ object: context.primary || object, role: "origin" });
  const location = createIXIAosFinancialObjectReference({ object: context.location || {}, role: "location" });
  const employee = createIXIAosFinancialObjectReference({ object: context.actor || {}, role: "employee" });
  const entity = createIXIAosFinancialObjectReference({ object: context.entity || {}, role: "entity" });

  pushUniqueReference(refs, primary);
  pushUniqueReference(refs, location);
  pushUniqueReference(refs, employee);
  pushUniqueReference(refs, entity);

  if (clean(draft.context.workOrderId || draft.context.workOrderNumber)) {
    pushUniqueReference(refs, {
      role: "work-order",
      label: draft.context.workOrderNumber,
      objectType: "work-order",
      externalId: draft.context.workOrderId || draft.context.workOrderNumber
    });
  }

  const response = await createIXIAosTimeEntry({
    object: {
      ...object,
      passportId: clean(object.passportId || draft.context.primaryPassportId),
      objectId: clean(object.objectId || draft.context.primaryObjectId),
      objectType: clean(object.objectType || draft.context.primaryObjectType),
      label: clean(object.label || draft.context.primaryLabel)
    },
    input: {
      hours: draft.time.hours,
      date: draft.time.date,
      startTime: draft.time.startTime,
      endTime: draft.time.endTime,
      workType: draft.time.workType,
      description: draft.time.description,
      billable: draft.time.billable,
      overtime: draft.time.overtime,
      notes: draft.time.notes,
      attachments: draft.attachments,
      references: refs
    },
    additionalReferences: refs,
    metadata: {
      ...metadata,
      transactModule: "time",
      timeSchema: draft.schema,
      source: draft.time.source,
      originatingPassportId: draft.context.primaryPassportId,
      originatingObjectId: draft.context.primaryObjectId,
      originatingObjectType: draft.context.primaryObjectType,
      originatingLabel: draft.context.primaryLabel,
      workOrderId: draft.context.workOrderId,
      workOrderNumber: draft.context.workOrderNumber
    }
  });

  return {
    draft: {
      ...draft,
      identity: {
        ...draft.identity,
        timeEntryId: clean(
          response?.timeEntryId ||
          response?.document?.documentId ||
          response?.financialDocument?.documentId ||
          draft.identity.timeEntryId ||
          draft.identity.clientRequestId
        )
      },
      status: "posted"
    },
    response
  };
}

export default { createIXITimeEntry };