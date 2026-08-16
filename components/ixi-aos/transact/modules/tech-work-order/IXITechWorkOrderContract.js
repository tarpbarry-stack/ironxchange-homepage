const clean = value => String(value ?? "").trim();
const obj = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const arr = value => Array.isArray(value) ? value : [];

export const IXI_TECH_WORK_ORDER_SCHEMA = "ixi-tech-work-order-v1";

export const IXI_TECH_WORK_ORDER_STATUSES = Object.freeze([
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

export const IXI_TECH_WORK_TYPES = Object.freeze([
  "incident",
  "service-request",
  "diagnostic",
  "configuration",
  "software-update",
  "firmware",
  "integration",
  "telematics-gps",
  "network-connectivity",
  "device-hardware",
  "security-access",
  "deployment-change",
  "other"
]);

export const IXI_TECH_IMPACT_LEVELS = Object.freeze([
  "normal",
  "degraded",
  "critical"
]);

export const IXI_TECH_ENVIRONMENTS = Object.freeze([
  "production",
  "test",
  "development",
  "field",
  "unknown"
]);

export const IXI_TECH_RESULTS = Object.freeze([
  "fully-functioning",
  "functional-with-notes",
  "further-work-required",
  "vendor-action-required",
  "unresolved"
]);

function money(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
}

function unique(values = []) {
  return [...new Set(arr(values).map(clean).filter(Boolean))];
}

export function createIXITechWorkOrderDraft({ context = {}, input = {} } = {}) {
  const sourceContext = obj(context);
  const sourceInput = obj(input);
  const primary = obj(sourceContext.primary);
  const entity = obj(sourceContext.entity);
  const location = obj(sourceContext.location);
  const actor = obj(sourceContext.actor);
  const now = clean(sourceContext.launchedAt) || new Date().toISOString();

  return {
    schema: IXI_TECH_WORK_ORDER_SCHEMA,
    identity: {
      techWorkOrderId: clean(sourceInput.techWorkOrderId),
      number: clean(sourceInput.number)
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
      type: clean(sourceInput.type || "incident"),
      title: clean(sourceInput.title),
      description: clean(sourceInput.description),
      priority: clean(sourceInput.priority || "normal"),
      impact: clean(sourceInput.impact || "normal"),
      status: clean(sourceInput.status || "open"),
      waitingReason: clean(sourceInput.waitingReason)
    },
    technology: {
      environment: clean(sourceInput.environment || "production"),
      systemName: clean(sourceInput.systemName),
      applicationName: clean(sourceInput.applicationName),
      deviceName: clean(sourceInput.deviceName),
      serviceProvider: clean(sourceInput.serviceProvider),
      version: clean(sourceInput.version),
      incidentReference: clean(sourceInput.incidentReference),
      affectedUsers: Number(sourceInput.affectedUsers || 0),
      rootCause: clean(sourceInput.rootCause),
      resolution: clean(sourceInput.resolution),
      validation: clean(sourceInput.validation),
      rollbackPlan: clean(sourceInput.rollbackPlan)
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
      workPerformed: "",
      recommendations: "",
      finalImpact: ""
    },
    references: {
      timeEntryIds: [],
      materialRecordIds: [],
      serviceRecordIds: [],
      expenseIds: [],
      purchaseRequestIds: [],
      purchaseOrderIds: [],
      billIds: [],
      attachmentIds: [],
      photoIds: [],
      noteIds: [],
      githubIssueIds: [],
      githubPullRequestIds: [],
      deploymentIds: []
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
    activityProjection: [],
    documentProjection: [],
    noteProjection: [],
    photoProjection: [],
    recordStatus: "open",
    revision: 1,
    audit: {
      createdBy: clean(actor.userId || actor.employeeId || actor.passportId),
      createdAt: now,
      updatedAt: now
    }
  };
}

export function normalizeIXITechWorkOrder(value = {}) {
  const source = obj(value);
  const base = createIXITechWorkOrderDraft({});
  const refs = obj(source.references);

  return {
    ...base,
    ...source,
    identity: { ...base.identity, ...obj(source.identity) },
    context: { ...base.context, ...obj(source.context) },
    work: { ...base.work, ...obj(source.work) },
    technology: { ...base.technology, ...obj(source.technology) },
    people: { ...base.people, ...obj(source.people), assignedTo: arr(source.people?.assignedTo) },
    dates: { ...base.dates, ...obj(source.dates) },
    result: { ...base.result, ...obj(source.result) },
    references: {
      ...base.references,
      ...refs,
      timeEntryIds: unique(refs.timeEntryIds),
      materialRecordIds: unique(refs.materialRecordIds),
      serviceRecordIds: unique(refs.serviceRecordIds),
      expenseIds: unique(refs.expenseIds),
      purchaseRequestIds: unique(refs.purchaseRequestIds),
      purchaseOrderIds: unique(refs.purchaseOrderIds),
      billIds: unique(refs.billIds),
      attachmentIds: unique(refs.attachmentIds),
      photoIds: unique(refs.photoIds),
      noteIds: unique(refs.noteIds),
      githubIssueIds: unique(refs.githubIssueIds),
      githubPullRequestIds: unique(refs.githubPullRequestIds),
      deploymentIds: unique(refs.deploymentIds)
    },
    financial: { ...base.financial, ...obj(source.financial) },
    activityProjection: arr(source.activityProjection),
    documentProjection: arr(source.documentProjection),
    noteProjection: arr(source.noteProjection),
    photoProjection: arr(source.photoProjection),
    audit: { ...base.audit, ...obj(source.audit) }
  };
}

export default {
  createIXITechWorkOrderDraft,
  normalizeIXITechWorkOrder
};