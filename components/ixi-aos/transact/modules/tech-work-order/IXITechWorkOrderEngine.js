import { normalizeIXITechWorkOrder } from "./IXITechWorkOrderContract";

const clean = value => String(value ?? "").trim();
const nowIso = () => new Date().toISOString();

export const IXI_TECHWO_ACTIONS = Object.freeze({
  UPDATE: "update",
  ASSIGN: "assign",
  CREW: "crew",
  START: "start",
  PAUSE: "pause",
  RESUME: "resume",
  WAIT: "wait",
  COMPLETE: "complete",
  REOPEN: "reopen",
  CLOSE: "close",
  CANCEL: "cancel"
});

const personOf = value => ({
  passportId: clean(value?.passportId).toUpperCase(),
  employeeId: clean(value?.employeeId),
  userId: clean(value?.userId || value?.id),
  label: clean(value?.displayName || value?.name || value?.label)
});

function requireReason(payload = {}, message = "A reason is required for this change.") {
  const reason = clean(payload.reason);
  if (!reason) throw new Error(message);
  return reason;
}

function withAudit(record, patch = {}) {
  const current = normalizeIXITechWorkOrder(record);
  return {
    ...current,
    ...patch,
    revision: Number(current.revision || 0) + 1,
    audit: {
      ...(current.audit || {}),
      updatedAt: nowIso()
    }
  };
}

function activity(record, type, actorLabel = "", note = "") {
  return [
    ...(Array.isArray(record.activityProjection) ? record.activityProjection : []),
    {
      activityId: `TECHACT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      actorLabel: clean(actorLabel),
      note: clean(note),
      occurredAt: nowIso()
    }
  ];
}

export function applyIXITechWorkOrderAction({ record = {}, action = "", actor = {}, payload = {} } = {}) {
  const current = normalizeIXITechWorkOrder(record);
  const actorLabel = clean(actor.displayName || actor.name || actor.label);
  const status = clean(current.work?.status);
  const now = nowIso();

  if (action === IXI_TECHWO_ACTIONS.UPDATE) {
    if (["complete", "closed", "canceled"].includes(status)) throw new Error("Completed or closed TECHWO must be reopened before editing.");
    const reason = requireReason(payload, "A reason is required to edit TECHWO.");
    const performedOn = clean(payload.performedOn || current.dates?.performedOn).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(performedOn) || performedOn > new Date().toISOString().slice(0, 10)) {
      throw new Error("Work performed date must be a valid date that is not in the future.");
    }
    return withAudit(current, {
      work: {
        ...current.work,
        title: clean(payload.title) || clean(payload.description).slice(0, 80) || current.work.title,
        description: clean(payload.description),
        type: clean(payload.type) || current.work.type,
        priority: clean(payload.priority) || current.work.priority,
        impact: clean(payload.impact) || current.work.impact
      },
      technology: {
        ...current.technology,
        environment: clean(payload.environment) || current.technology.environment,
        systemName: clean(payload.systemName),
        version: clean(payload.version)
      },
      dates: { ...current.dates, performedOn },
      activityProjection: activity(current, "tech-work-updated", actorLabel, reason)
    });
  }

  if (action === IXI_TECHWO_ACTIONS.ASSIGN) {
    if (["complete", "closed", "canceled"].includes(status)) throw new Error("Completed or closed TECHWO must be reopened before assignment.");
    const reason = requireReason(payload, "A reason is required to change the technician.");
    const technician = personOf(payload.technician);
    if (!technician.passportId || !technician.label) throw new Error("Technician name and IXI Passport are required.");
    return withAudit(current, {
      people: { ...current.people, assignedTo: [technician] },
      activityProjection: activity(current, "technician-assigned", actorLabel, `${technician.label} · ${technician.passportId} · ${reason}`)
    });
  }

  if (action === IXI_TECHWO_ACTIONS.CREW) {
    if (["complete", "closed", "canceled"].includes(status)) throw new Error("Completed or closed TECHWO must be reopened before changing crew.");
    const reason = requireReason(payload, "A reason is required to change the crew.");
    const seen = new Set();
    const crew = (Array.isArray(payload.crew) ? payload.crew : []).map(personOf).filter(person => {
      if (!person.passportId || !person.label || seen.has(person.passportId)) return false;
      seen.add(person.passportId);
      return true;
    });
    return withAudit(current, {
      people: { ...current.people, crew },
      activityProjection: activity(current, "crew-updated", actorLabel, `${crew.length} crew member${crew.length === 1 ? "" : "s"} · ${reason}`)
    });
  }

  if (action === IXI_TECHWO_ACTIONS.START) {
    if (["complete", "closed", "canceled"].includes(status)) throw new Error("Completed or closed TECHWO must be reopened before work can start.");
    return withAudit(current, {
      work: { ...current.work, status: "in-progress" },
      dates: { ...current.dates, startedAt: current.dates?.startedAt || now },
      activityProjection: activity(current, "tech-work-started", actorLabel)
    });
  }

  if (action === IXI_TECHWO_ACTIONS.PAUSE) {
    if (status !== "in-progress") throw new Error("Only active TECHWO work can be paused.");
    return withAudit(current, {
      work: { ...current.work, status: "paused" },
      activityProjection: activity(current, "tech-work-paused", actorLabel)
    });
  }

  if (action === IXI_TECHWO_ACTIONS.RESUME) {
    if (!["paused", "waiting", "open", "scheduled"].includes(status)) throw new Error("TECHWO is not in a resumable state.");
    return withAudit(current, {
      work: { ...current.work, status: "in-progress", waitingReason: "" },
      dates: { ...current.dates, startedAt: current.dates?.startedAt || now },
      activityProjection: activity(current, "tech-work-resumed", actorLabel)
    });
  }

  if (action === IXI_TECHWO_ACTIONS.WAIT) {
    return withAudit(current, {
      work: { ...current.work, status: "waiting", waitingReason: clean(payload.reason || "other") },
      activityProjection: activity(current, "tech-work-waiting", actorLabel, payload.reason)
    });
  }

  if (action === IXI_TECHWO_ACTIONS.COMPLETE) {
    if (["closed", "canceled"].includes(status)) throw new Error("Closed or canceled TECHWO cannot be completed.");
    const workPerformed = clean(payload.workPerformed || current.result?.workPerformed);
    const validation = clean(payload.validation || current.technology?.validation);
    const rootCause = clean(payload.rootCause || current.technology?.rootCause);
    const resolution = clean(payload.resolution || current.technology?.resolution);
    if (!workPerformed) throw new Error("Work performed is required before TECHWO completion.");
    if (!rootCause) throw new Error("Root cause is required before TECHWO completion.");
    if (!resolution) throw new Error("Resolution is required before TECHWO completion.");
    if (!validation) throw new Error("Completion validation is required before TECHWO completion.");
    const disposition = clean(payload.disposition || "fully-functioning");
    return withAudit(current, {
      work: { ...current.work, status: "complete" },
      dates: { ...current.dates, completedAt: now },
      people: { ...current.people, completedBy: actor || null },
      result: {
        ...current.result,
        disposition,
        workPerformed,
        recommendations: clean(payload.recommendations || current.result?.recommendations),
        finalImpact: clean(payload.finalImpact || "normal")
      },
      technology: {
        ...current.technology,
        rootCause,
        resolution,
        validation
      },
      activityProjection: activity(current, "tech-work-completed", actorLabel, disposition)
    });
  }

  if (action === IXI_TECHWO_ACTIONS.REOPEN) {
    if (!["complete", "closed"].includes(status)) throw new Error("Only completed or closed TECHWO can be reopened.");
    const reason = requireReason(payload, "A reason is required to reopen TECHWO.");
    return withAudit(current, {
      work: { ...current.work, status: "open" },
      dates: { ...current.dates, completedAt: "", closedAt: "" },
      recordStatus: "open",
      activityProjection: activity(current, "tech-work-reopened", actorLabel, reason)
    });
  }

  if (action === IXI_TECHWO_ACTIONS.CLOSE) {
    if (status !== "complete") throw new Error("TECHWO must be complete before it can be closed.");
    return withAudit(current, {
      work: { ...current.work, status: "closed" },
      dates: { ...current.dates, closedAt: now },
      recordStatus: "closed",
      activityProjection: activity(current, "tech-work-closed", actorLabel)
    });
  }

  if (action === IXI_TECHWO_ACTIONS.CANCEL) {
    if (["closed", "complete"].includes(status)) throw new Error("Completed or closed TECHWO should not be canceled.");
    return withAudit(current, {
      work: { ...current.work, status: "canceled" },
      recordStatus: "canceled",
      activityProjection: activity(current, "tech-work-canceled", actorLabel, payload.reason)
    });
  }

  throw new Error(`Unsupported TECHWO action: ${action}`);
}

export function getIXITechWorkOrderActuals(record = {}) {
  const financial = record?.financial || {};
  const labor = Number(financial.laborActual || 0);
  const material = Number(financial.materialActual || 0);
  const service = Number(financial.serviceActual || 0);
  const other = Number(financial.otherActual || 0);
  return {
    labor,
    material,
    service,
    other,
    requested: Number(financial.requested || 0),
    committed: Number(financial.committed || 0),
    totalActual: labor + material + service + other
  };
}

export default {
  applyIXITechWorkOrderAction,
  getIXITechWorkOrderActuals
};
