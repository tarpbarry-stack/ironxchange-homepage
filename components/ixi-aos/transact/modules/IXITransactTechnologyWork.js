export const IXI_TECHNOLOGY_WORK_SERVICE_TYPES = Object.freeze([
  "diagnose-tech-hookup",
  "remote-repair-hookup",
  "emissions-work",
  "system-recalibration",
  "software-update",
  "ecm-controller-programming",
  "telematics-gps",
  "technology-upgrade",
  "other"
]);

export const IXI_TECHNOLOGY_WORK_RESULTS = Object.freeze([
  "complete-fully-functioning",
  "complete-functional-with-notes",
  "diagnosed-repair-required",
  "parts-required",
  "onsite-work-required",
  "dealer-service-required",
  "follow-up-required",
  "unable-to-resolve"
]);

export const IXI_TECHNOLOGY_WORK_STATUS = Object.freeze([
  "requested",
  "accepted",
  "scheduled",
  "in-progress",
  "complete",
  "billed",
  "accounted",
  "cancelled"
]);

export const IXI_TECHNOLOGY_WORK_FIELDS = Object.freeze({
  workOrderId: "",
  workOrderNumber: "",
  status: "requested",
  serviceTypes: [],
  issue: "",
  diagnosis: "",
  workPerformed: "",
  technicianNotes: "",
  finalResult: "",
  upgradeSummary: "",
  upgrades: [],
  vendorPassportId: "",
  vendorId: "",
  vendorName: "",
  vendorTechnician: "",
  quoteAmount: null,
  quoteNumber: "",
  quoteAttachmentIds: [],
  finalAmount: null,
  invoiceNumber: "",
  invoiceAttachmentIds: [],
  requestedAt: "",
  acceptedAt: "",
  startedAt: "",
  completedAt: "",
  billedAt: "",
  accountedAt: "",
  primaryObjectPassportId: "",
  primaryObjectId: "",
  entityPassportId: "",
  locationPassportId: "",
  requestedByPassportId: "",
  requestedByUserId: "",
  source: "ixi-transact-technology-work"
});

export function createIXITechnologyWorkDraft(context = {}) {
  const now = new Date().toISOString();
  return {
    ...IXI_TECHNOLOGY_WORK_FIELDS,
    requestedAt: now,
    primaryObjectPassportId: context?.primary?.passportId || "",
    primaryObjectId: context?.primary?.objectId || "",
    entityPassportId: context?.entity?.passportId || "",
    locationPassportId: context?.location?.passportId || "",
    requestedByPassportId: context?.actor?.passportId || "",
    requestedByUserId: context?.actor?.userId || ""
  };
}

export function deriveIXITechnologyState(records = []) {
  const source = Array.isArray(records) ? records : [];
  const completed = source
    .filter(item => String(item?.status || "").toLowerCase() === "complete")
    .sort((a, b) => String(b?.completedAt || "").localeCompare(String(a?.completedAt || "")));

  const services = Array.from(new Set(completed.flatMap(item => Array.isArray(item?.serviceTypes) ? item.serviceTypes : [])));
  const upgrades = Array.from(new Set(completed.flatMap(item => Array.isArray(item?.upgrades) ? item.upgrades : [])));
  const openIssues = source.filter(item => {
    const status = String(item?.status || "").toLowerCase();
    return status && !["complete", "billed", "accounted", "cancelled"].includes(status);
  });

  return {
    technologyReceived: completed.length > 0,
    technologyWorkCount: source.length,
    completedTechnologyWorkCount: completed.length,
    lastTechnologyWorkAt: completed[0]?.completedAt || "",
    lastTechnologyResult: completed[0]?.finalResult || "",
    technologyServices: services,
    technologyUpgrades: upgrades,
    technologyOpenIssueCount: openIssues.length,
    technologyOpenIssues: openIssues.map(item => item?.workOrderId || item?.workOrderNumber || "").filter(Boolean)
  };
}

export default {
  IXI_TECHNOLOGY_WORK_SERVICE_TYPES,
  IXI_TECHNOLOGY_WORK_RESULTS,
  IXI_TECHNOLOGY_WORK_STATUS,
  IXI_TECHNOLOGY_WORK_FIELDS,
  createIXITechnologyWorkDraft,
  deriveIXITechnologyState
};
