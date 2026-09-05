import { normalizeIXIWorkOrder } from "./IXIWorkOrderContract";

const clean = value => String(value ?? "").trim();
const obj = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const arr = value => Array.isArray(value) ? value : [];

export const IXI_WORK_ORDER_ACTIONS = Object.freeze({
  DETAILS_UPDATED: "work-order-details-updated",
  TECHNICIAN_ASSIGNED: "work-order-technician-assigned",
  CREW_UPDATED: "work-order-crew-updated",
  NOTE_ADDED: "work-order-note-added",
  PAUSED: "work-order-paused",
  RESUMED: "work-order-resumed",
  COMPLETED: "work-order-completed"
});

const CLOSED_STATUSES = new Set(["complete", "completed", "closed", "canceled", "cancelled"]);

function actorOf(actor = {}) {
  const source = obj(actor);
  return {
    passportId: clean(source.passportId),
    employeeId: clean(source.employeeId),
    userId: clean(source.userId || source.id),
    label: clean(source.displayName || source.name || source.label)
  };
}

function personOf(value = {}) {
  const source = obj(value);
  return {
    passportId: clean(source.passportId),
    employeeId: clean(source.employeeId),
    userId: clean(source.userId || source.id),
    label: clean(source.displayName || source.name || source.label)
  };
}

function stableId(prefix, occurredAt) {
  return clean(globalThis.crypto?.randomUUID?.()) || `${prefix}-${occurredAt}-${Math.random().toString(16).slice(2)}`;
}

function assertOpen(workOrder) {
  const status = clean(workOrder.work?.status).toLowerCase();
  if (CLOSED_STATUSES.has(status) || clean(workOrder.recordStatus).toLowerCase() === "closed") {
    const error = new Error("This Work Order is closed. Create a correction instead of overwriting it.");
    error.code = "IXI_WORK_ORDER_LOCKED";
    throw error;
  }
}

function appendActivity(workOrder, { type, label, detail = "", actor = {}, occurredAt }) {
  return [
    ...arr(workOrder.activity),
    {
      activityId: stableId("WOEV", occurredAt),
      type,
      label: clean(label),
      detail: clean(detail),
      occurredAt,
      actor: actorOf(actor)
    }
  ];
}

function withAudit(workOrder, activityInput) {
  const occurredAt = clean(activityInput.occurredAt) || new Date().toISOString();
  return {
    ...workOrder,
    audit: { ...workOrder.audit, updatedAt: occurredAt },
    activity: appendActivity(workOrder, { ...activityInput, occurredAt })
  };
}

export function updateIXIWorkOrderDetails(workOrder, {
  title,
  description,
  type,
  priority,
  machineCondition,
  reason,
  actor = {},
  occurredAt = ""
} = {}) {
  const current = normalizeIXIWorkOrder(workOrder);
  assertOpen(current);
  const explanation = clean(reason);
  if (!explanation) throw Object.assign(new Error("A reason is required for Work Order changes."), { code: "IXI_WORK_ORDER_REASON_REQUIRED" });
  const nextWork = {
    ...current.work,
    title: clean(title) || current.work.title,
    description: clean(description),
    type: clean(type) || current.work.type,
    priority: clean(priority) || current.work.priority,
    machineCondition: clean(machineCondition) || current.work.machineCondition
  };
  return withAudit({ ...current, work: nextWork }, {
    type: IXI_WORK_ORDER_ACTIONS.DETAILS_UPDATED,
    label: "WORK ORDER UPDATED",
    detail: explanation,
    actor,
    occurredAt
  });
}

export function assignIXIWorkOrderTechnician(workOrder, {
  technician = {},
  reason,
  actor = {},
  occurredAt = ""
} = {}) {
  const current = normalizeIXIWorkOrder(workOrder);
  assertOpen(current);
  const person = personOf(technician);
  if (!person.passportId) throw Object.assign(new Error("Technician IXI Passport is required."), { code: "IXI_TECHNICIAN_PASSPORT_REQUIRED" });
  if (!person.label) throw Object.assign(new Error("Technician name is required."), { code: "IXI_TECHNICIAN_NAME_REQUIRED" });
  const explanation = clean(reason);
  if (!explanation) throw Object.assign(new Error("A reason is required to change the Technician."), { code: "IXI_WORK_ORDER_REASON_REQUIRED" });
  return withAudit({
    ...current,
    people: { ...current.people, assignedTo: [person] }
  }, {
    type: IXI_WORK_ORDER_ACTIONS.TECHNICIAN_ASSIGNED,
    label: "TECHNICIAN ASSIGNED",
    detail: `${person.label} · ${person.passportId} · ${explanation}`,
    actor,
    occurredAt
  });
}

export function updateIXIWorkOrderCrew(workOrder, {
  crew = [],
  reason,
  actor = {},
  occurredAt = ""
} = {}) {
  const current = normalizeIXIWorkOrder(workOrder);
  assertOpen(current);
  const normalized = arr(crew).map(personOf).filter(person => person.passportId && person.label);
  const seen = new Set();
  const unique = normalized.filter(person => {
    if (seen.has(person.passportId)) return false;
    seen.add(person.passportId);
    return true;
  });
  const explanation = clean(reason);
  if (!explanation) throw Object.assign(new Error("A reason is required to change the Crew."), { code: "IXI_WORK_ORDER_REASON_REQUIRED" });
  return withAudit({
    ...current,
    people: { ...current.people, crew: unique }
  }, {
    type: IXI_WORK_ORDER_ACTIONS.CREW_UPDATED,
    label: "CREW UPDATED",
    detail: `${unique.length} crew member${unique.length === 1 ? "" : "s"} · ${explanation}`,
    actor,
    occurredAt
  });
}

export function addIXIWorkOrderNote(workOrder, note, { actor = {}, occurredAt = "" } = {}) {
  const current = normalizeIXIWorkOrder(workOrder);
  assertOpen(current);
  const source = obj(note);
  const noteId = clean(source.identity?.noteId || source.identity?.clientRequestId);
  if (!noteId || !clean(source.note?.body)) throw Object.assign(new Error("A valid note is required."), { code: "IXI_WORK_ORDER_NOTE_INVALID" });
  const existing = arr(current.noteProjection);
  if (existing.some(item => clean(item.identity?.noteId || item.identity?.clientRequestId) === noteId)) return current;
  const next = {
    ...current,
    noteProjection: [...existing, source],
    references: {
      ...current.references,
      noteIds: [...new Set([...arr(current.references?.noteIds), noteId])]
    }
  };
  return withAudit(next, {
    type: IXI_WORK_ORDER_ACTIONS.NOTE_ADDED,
    label: "NOTE ADDED",
    detail: clean(source.note?.title || source.note?.body).slice(0, 160),
    actor,
    occurredAt: occurredAt || source.audit?.createdAt
  });
}

export function changeIXIWorkOrderStatus(workOrder, {
  status,
  actor = {},
  occurredAt = ""
} = {}) {
  const current = normalizeIXIWorkOrder(workOrder);
  assertOpen(current);
  const nextStatus = clean(status).toLowerCase();
  if (!['paused', 'in-progress'].includes(nextStatus)) throw Object.assign(new Error("Unsupported Work Order status."), { code: "IXI_WORK_ORDER_STATUS_INVALID" });
  return withAudit({ ...current, work: { ...current.work, status: nextStatus } }, {
    type: nextStatus === "paused" ? IXI_WORK_ORDER_ACTIONS.PAUSED : IXI_WORK_ORDER_ACTIONS.RESUMED,
    label: nextStatus === "paused" ? "WORK PAUSED" : "WORK RESUMED",
    actor,
    occurredAt
  });
}

export function completeIXIWorkOrderRecord(workOrder, {
  workPerformed,
  disposition,
  finalMachineCondition,
  recommendations = "",
  actor = {},
  occurredAt = ""
} = {}) {
  const current = normalizeIXIWorkOrder(workOrder);
  assertOpen(current);
  const completedAt = clean(occurredAt) || new Date().toISOString();
  if (!clean(workPerformed)) throw Object.assign(new Error("Work performed is required to complete the Work Order."), { code: "IXI_WORK_PERFORMED_REQUIRED" });
  if (!clean(disposition)) throw Object.assign(new Error("Completion result is required."), { code: "IXI_WORK_RESULT_REQUIRED" });
  if (!clean(finalMachineCondition)) throw Object.assign(new Error("Final machine condition is required."), { code: "IXI_FINAL_CONDITION_REQUIRED" });
  const completedBy = actorOf(actor);
  return withAudit({
    ...current,
    work: { ...current.work, status: "complete" },
    people: { ...current.people, completedBy },
    dates: { ...current.dates, completedAt },
    result: {
      ...current.result,
      workPerformed: clean(workPerformed),
      disposition: clean(disposition),
      finalMachineCondition: clean(finalMachineCondition),
      recommendations: clean(recommendations)
    },
    financial: { ...current.financial, status: "complete" },
    recordStatus: "closed"
  }, {
    type: IXI_WORK_ORDER_ACTIONS.COMPLETED,
    label: "WORK COMPLETED",
    detail: `${clean(disposition)} · ${clean(finalMachineCondition)}`,
    actor,
    occurredAt: completedAt
  });
}

export default {
  updateIXIWorkOrderDetails,
  assignIXIWorkOrderTechnician,
  updateIXIWorkOrderCrew,
  addIXIWorkOrderNote,
  changeIXIWorkOrderStatus,
  completeIXIWorkOrderRecord
};
