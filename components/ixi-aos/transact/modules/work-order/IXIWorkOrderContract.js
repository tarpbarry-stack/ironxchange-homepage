const clean = value => String(value ?? "").trim();
const obj = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const arr = value => Array.isArray(value) ? value : [];

export const IXI_WORK_ORDER_SCHEMA = "ixi-work-order-v1";

export const IXI_WORK_ORDER_STATUSES = Object.freeze([
  "requested",
  "open",
  "scheduled",
  "in-progress",
  "paused",
  "waiting",
  "complete",
  "closed",
  "canceled"
]);

export const IXI_WORK_ORDER_WAIT_REASONS = Object.freeze([
  "parts",
  "vendor",
  "approval",
  "machine",
  "other"
]);

export const IXI_WORK_ORDER_TYPES = Object.freeze([
  "repair",
  "pm",
  "inspection",
  "make-ready",
  "facility",
  "fabrication",
  "transport-prep",
  "other"
]);

export const IXI_MACHINE_CONDITIONS = Object.freeze([
  "operable",
  "limited",
  "down"
]);

export const IXI_WORK_ORDER_RESULTS = Object.freeze([
  "fully-functioning",
  "functional-with-notes",
  "further-work-required",
  "unresolved"
]);

function money(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
}

function normalizeReferenceList(value) {
  return [...new Set(arr(value).map(clean).filter(Boolean))];
}

export function createIXIWorkOrderDraft({ context = {}, input = {} } = {}) {
  const sourceContext = obj(context);
  const sourceInput = obj(input);
  const primary = obj(sourceContext.primary);
  const entity = obj(sourceContext.entity);
  const location = obj(sourceContext.location);
  const actor = obj(sourceContext.actor);
  const now = clean(sourceContext.launchedAt) || new Date().toISOString();

  return {
    schema: IXI_WORK_ORDER_SCHEMA,
    identity: {
      workOrderId: clean(sourceInput.workOrderId),
      number: clean(sourceInput.number),
      clientRequestId: clean(sourceInput.clientRequestId)
    },
    context: {
      entityPassportId: clean(sourceInput.entityPassportId || entity.passportId),
      primaryPassportId: clean(sourceInput.primaryPassportId || primary.passportId),
      primaryObjectId: clean(sourceInput.primaryObjectId || primary.objectId),
      primaryObjectType: clean(sourceInput.primaryObjectType || primary.objectType),
      primaryLabel: clean(sourceInput.primaryLabel || primary.label),
      locationPassportId: clean(sourceInput.locationPassportId || location.passportId),
      locationLabel: clean(sourceInput.locationLabel || location.label),
      jobPassportId: clean(sourceInput.jobPassportId)
    },
    work: {
      type: clean(sourceInput.type || "repair"),
      title: clean(sourceInput.title),
      description: clean(sourceInput.description),
      priority: clean(sourceInput.priority || "normal"),
      machineCondition: clean(sourceInput.machineCondition || "operable"),
      status: clean(sourceInput.status || "open"),
      waitingReason: clean(sourceInput.waitingReason)
    },
    people: {
      requestedBy: {
        passportId: clean(actor.passportId),
        userId: clean(actor.userId),
        employeeId: clean(actor.employeeId),
        label: clean(actor.displayName || actor.name || actor.label)
      },
      assignedTo: arr(sourceInput.assignedTo),
      completedBy: null
    },
    dates: {
      requestedAt: clean(sourceInput.requestedAt) || now,
      scheduledAt: "",
      startedAt: "",
      completedAt: "",
      closedAt: ""
    },
    result: {
      disposition: "",
      finalMachineCondition: "",
      workPerformed: "",
      recommendations: ""
    },
    references: {
      timeEntryIds: [],
      materialRecordIds: [],
      serviceRecordIds: [],
      expenseIds: [],
      purchaseRequestIds: [],
      purchaseOrderIds: [],
      billIds: [],
      technologyWorkIds: [],
      attachmentIds: [],
      photoIds: [],
      noteIds: []
    },
    financial: {
      laborActual: 0,
      materialActual: 0,
      serviceActual: 0,
      otherActual: 0,
      requested: 0,
      committed: 0,
      estimated: money(sourceInput.estimated),
      totalActual: 0,
      status: "open"
    },
    recordStatus: "open",
    revision: 1,
    audit: {
      createdBy: clean(actor.userId || actor.employeeId || actor.passportId),
      createdAt: now,
      updatedAt: now
    }
  };
}

export function normalizeIXIWorkOrder(value = {}) {
  const source = obj(value);
  const base = createIXIWorkOrderDraft({ context: {}, input: {} });
  const sourceReferences = obj(source.references);

  return {
    ...base,
    ...source,
    identity: {
      ...base.identity,
      ...obj(source.identity)
    },
    context: {
      ...base.context,
      ...obj(source.context)
    },
    work: {
      ...base.work,
      ...obj(source.work)
    },
    people: {
      ...base.people,
      ...obj(source.people),
      assignedTo: arr(source.people?.assignedTo)
    },
    dates: {
      ...base.dates,
      ...obj(source.dates)
    },
    result: {
      ...base.result,
      ...obj(source.result)
    },
    references: {
      ...base.references,
      ...sourceReferences,
      timeEntryIds: normalizeReferenceList(sourceReferences.timeEntryIds),
      materialRecordIds: normalizeReferenceList(sourceReferences.materialRecordIds),
      serviceRecordIds: normalizeReferenceList(sourceReferences.serviceRecordIds),
      expenseIds: normalizeReferenceList(sourceReferences.expenseIds),
      purchaseRequestIds: normalizeReferenceList(sourceReferences.purchaseRequestIds),
      purchaseOrderIds: normalizeReferenceList(sourceReferences.purchaseOrderIds),
      billIds: normalizeReferenceList(sourceReferences.billIds),
      technologyWorkIds: normalizeReferenceList(sourceReferences.technologyWorkIds),
      attachmentIds: normalizeReferenceList(sourceReferences.attachmentIds),
      photoIds: normalizeReferenceList(sourceReferences.photoIds),
      noteIds: normalizeReferenceList(sourceReferences.noteIds)
    },
    financial: {
      ...base.financial,
      ...obj(source.financial)
    },
    audit: {
      ...base.audit,
      ...obj(source.audit)
    }
  };
}

export default {
  createIXIWorkOrderDraft,
  normalizeIXIWorkOrder
};
