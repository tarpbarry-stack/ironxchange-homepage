import { createIXIAosTimeEntry, createIXIAosFinancialObjectReference } from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";
import { patchIXIAosFinancialDocument } from "../../../financial-runtime/IXIAosFinancialReadClient";
import { createIXITimeEntryDraft, validateIXITimeEntry } from "./IXITimeEntryContract";
import { runIXIActionNoticeLifecycle } from "../../../../ixi-object-system/IXIActionNoticeEngine";

const clean = value => String(value ?? "").trim();
const safeObject = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};

function stableIdentity(input = {}, metadata = {}) {
  const id = clean(input.clientRequestId || metadata.commandId);
  if (!id) {
    const error = new Error("Time entry requires a stable command identity.");
    error.code = "IXI_TIME_COMMAND_ID_REQUIRED";
    throw error;
  }
  return id;
}

function pushUniqueReference(refs, reference) {
  if (!reference) return;
  const key = `${clean(reference.passportId)}|${clean(reference.role)}`;
  if (!clean(reference.passportId) || refs.some(item => `${clean(item.passportId)}|${clean(item.role)}` === key)) return;
  refs.push(reference);
}

function referencesFor({ object = {}, context = {}, draft = {} } = {}) {
  const refs = [];
  pushUniqueReference(refs, createIXIAosFinancialObjectReference({ object: context.primary || object, role: "origin" }));
  pushUniqueReference(refs, createIXIAosFinancialObjectReference({ object: context.location || {}, role: "location" }));
  pushUniqueReference(refs, createIXIAosFinancialObjectReference({ object: context.actor || {}, role: "employee" }));
  pushUniqueReference(refs, createIXIAosFinancialObjectReference({ object: context.entity || {}, role: "entity" }));
  if (clean(draft.context?.employeePassportId) && !refs.some(ref => clean(ref.passportId) === clean(draft.context.employeePassportId) && ref.role === "employee")) {
    refs.push({ passportId: clean(draft.context.employeePassportId), role: "employee", label: clean(draft.context.employeeLabel), objectType: "employee" });
  }
  return refs;
}

function responseRecord(response = {}) {
  return response?.data?.record || response?.record || {};
}

function canonicalize(draft, response) {
  const stored = responseRecord(response);
  const document = stored?.financialDocument || response?.financialDocument || {};
  const financialDocumentId = clean(document.financialDocumentId);
  if (!financialDocumentId) {
    const error = new Error("IXI Financial did not return a canonical Time identity.");
    error.code = "IXI_TIME_IDENTITY_MISSING";
    throw error;
  }
  return {
    ...(document.timeEntry || draft),
    identity: {
      ...(document.timeEntry?.identity || draft.identity),
      clientRequestId: clean(draft.identity?.clientRequestId),
      timeEntryId: financialDocumentId,
      number: clean(document.documentNumber) || financialDocumentId
    },
    financialBinding: {
      financialDocumentId,
      revision: Number(stored?.server?.revision || stored?.revision || 1),
      financialLineId: clean(document?.lines?.[0]?.financialLineId || draft?.financialBinding?.financialLineId)
    }
  };
}

function occurredAt(date = "") {
  return clean(date) ? `${clean(date)}T12:00:00.000Z` : new Date().toISOString();
}

async function createRecord({ object = {}, context = {}, workOrder = {}, input = {}, metadata = {}, allowZeroHours = false } = {}) {
  const commandId = stableIdentity(input, metadata);
  const draft = createIXITimeEntryDraft({ context, workOrder, input });
  const check = validateIXITimeEntry(draft, { allowZeroHours });
  if (!check.valid) {
    const error = new Error("Time entry incomplete");
    error.validation = check;
    throw error;
  }
  if (!clean(draft.context.primaryPassportId)) {
    const error = new Error("This object needs an IXI Passport before time can be recorded.");
    error.code = "IXI_TIME_PASSPORT_REQUIRED";
    throw error;
  }
  const references = referencesFor({ object, context, draft });
  const sourceFinancialDocumentId = clean(workOrder?.financialBinding?.financialDocumentId || workOrder?.identity?.workOrderId || workOrder?.identity?.techWorkOrderId || workOrder?.financialDocumentId);
  const operation = () => createIXIAosTimeEntry({
    object: {
      ...object,
      passportId: clean(object.passportId || draft.context.primaryPassportId),
      objectId: clean(object.objectId || draft.context.primaryObjectId),
      objectType: clean(object.objectType || draft.context.primaryObjectType),
      label: clean(object.label || draft.context.primaryLabel)
    },
    input: {
      currency: "USD",
      financialState: "incurred",
      occurredAt: occurredAt(draft.time.date),
      startedAt: draft.time.startedAt,
      endedAt: draft.time.endedAt,
      description: draft.time.description,
      memo: draft.time.notes,
      hours: draft.time.hours,
      hourlyRate: 0,
      employeePassportId: draft.context.employeePassportId,
      overtime: draft.time.overtime,
      sourceFinancialDocumentId,
      timeEntry: draft,
      attachments: draft.attachments,
      references
    },
    additionalReferences: references,
    commandId,
    idempotencyKey: `ixi-time:${commandId}`,
    metadata: {
      ...metadata,
      transactModule: "time",
      timeSchema: draft.schema,
      source: draft.time.source,
      laborRateAuthority: "ix-financial",
      originatingPassportId: draft.context.primaryPassportId,
      clientRequestId: commandId
    }
  });
  const objectId = clean(draft.context.primaryObjectId || draft.context.primaryPassportId);
  const response = objectId ? await runIXIActionNoticeLifecycle({
    objectId,
    operation,
    savingMessage: input.status === "running" ? "STARTING TIMER..." : "RECORDING TIME...",
    successMessage: input.status === "running" ? "TIMER STARTED" : "TIME RECORDED",
    errorMessage: "TIME SAVE FAILED",
    commandId,
    source: "ixi-transact-time"
  }) : await operation();
  return { draft: canonicalize(draft, response), response };
}

export function createIXITimeEntry(options = {}) {
  return createRecord({ ...options, input: { ...(options.input || {}), status: clean(options.input?.status || "recorded") } });
}

export function createIXITimeSessionRecord(options = {}) {
  return createRecord({ ...options, allowZeroHours: true, input: { ...(options.input || {}), mode: "live", status: "running" } });
}

export async function updateIXITimeSessionRecord({ record = {}, input = {}, metadata = {}, signal } = {}) {
  const financialDocumentId = clean(record?.financialBinding?.financialDocumentId || record?.identity?.timeEntryId);
  const expectedRevision = Number(record?.financialBinding?.revision);
  const commandId = stableIdentity(input, metadata);
  if (!financialDocumentId || !Number.isInteger(expectedRevision) || expectedRevision < 1) {
    const error = new Error("Time session is not bound to a current IXI Financial revision.");
    error.code = "IXI_TIME_BINDING_REQUIRED";
    throw error;
  }
  const timeEntry = {
    ...record,
    time: { ...safeObject(record.time), ...safeObject(input.time) },
    session: input.session === undefined ? record.session : input.session,
    attachments: input.attachments === undefined ? (record.attachments || []) : input.attachments,
    status: clean(input.status || record.status)
  };
  const hours = Number(timeEntry.time?.hours || 0);
  const response = await patchIXIAosFinancialDocument({
    financialDocumentId,
    expectedRevision,
    commandId,
    idempotencyKey: `ixi-time:${commandId}`,
    patch: {
      timeEntry,
      startedAt: clean(timeEntry.time?.startedAt),
      endedAt: clean(timeEntry.time?.endedAt),
      description: clean(timeEntry.time?.description),
      memo: clean(timeEntry.time?.notes),
      attachments: timeEntry.attachments || [],
      lines: [{
        financialLineId: clean(record?.financialBinding?.financialLineId),
        lineType: "labor",
        description: clean(timeEntry.time?.description) || "LABOR TIME",
        quantity: hours,
        unitPrice: 0,
        amount: 0,
        laborHours: hours,
        hourlyRate: 0,
        employeePassportId: clean(timeEntry.context?.employeePassportId),
        overtime: Boolean(timeEntry.time?.overtime)
      }],
      totals: { subtotal: 0, tax: 0, total: 0, balance: 0, laborHours: hours, laborCost: 0 },
      financialState: "incurred"
    },
    metadata: { ...metadata, transactModule: "time", laborRateAuthority: "ix-financial", timeStatus: timeEntry.status },
    signal
  });
  return { draft: canonicalize(timeEntry, response), response };
}

export default { createIXITimeEntry, createIXITimeSessionRecord, updateIXITimeSessionRecord };
