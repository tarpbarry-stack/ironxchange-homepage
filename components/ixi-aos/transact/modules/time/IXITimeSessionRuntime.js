const STORAGE_KEY = "ixi-transact-active-time-session-v1";
const EVENT_NAME = "ixi-transact-time-session-change";
const clean = value => String(value ?? "").trim();
const nowIso = () => new Date().toISOString();
const canUseStorage = () => typeof window !== "undefined" && Boolean(window.localStorage);

function readStore() {
  if (!canUseStorage()) return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store || {}));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: store || {} }));
}

export function getIXITimeEmployeeKey(context = {}) {
  return clean(
    context.actor?.passportId ||
    context.actor?.employeeId ||
    context.actor?.userId ||
    context.actor?.id ||
    context.actor?.label ||
    "anonymous"
  );
}

export function getIXITimeTargetKey(context = {}, workOrder = {}) {
  const woId = clean(workOrder.identity?.workOrderId || workOrder.identity?.techWorkOrderId || workOrder.workOrderId || workOrder.id);
  const woNumber = clean(workOrder.identity?.number || workOrder.workOrderNumber || workOrder.number);
  if (woId || woNumber) return `work:${woId || woNumber}`;

  const primary = context.primary || {};
  return `object:${clean(primary.passportId || primary.objectId || primary.label || "unknown")}`;
}

export function getIXIActiveTimeSession(context = {}) {
  const key = getIXITimeEmployeeKey(context);
  return readStore()[key] || null;
}

export function getIXITimeSessionElapsedMs(session = {}, at = Date.now()) {
  const accumulated = Number(session.accumulatedMs || 0);
  if (session.status !== "running" || !session.lastStartedAt) return accumulated;
  const started = new Date(session.lastStartedAt).getTime();
  return accumulated + Math.max(0, Number(at) - started);
}

export function getIXITimeSessionUnrecordedMs(session = {}, at = Date.now()) {
  return Math.max(0, getIXITimeSessionElapsedMs(session, at) - Number(session.recordedMs || 0));
}

export function formatIXITimeDuration(ms = 0) {
  const total = Math.max(0, Math.floor(Number(ms || 0) / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function startIXITimeSession({ context = {}, workOrder = {}, workType = "", description = "", write = true, at = Date.now() } = {}) {
  const store = readStore();
  const key = getIXITimeEmployeeKey(context);
  const existing = store[key];
  const targetKey = getIXITimeTargetKey(context, workOrder);
  const woId = clean(workOrder.identity?.workOrderId || workOrder.identity?.techWorkOrderId || workOrder.workOrderId || workOrder.id);
  const woNumber = clean(workOrder.identity?.number || workOrder.workOrderNumber || workOrder.number);

  if (existing && existing.status === "running") {
    if (clean(existing.targetKey) === targetKey) return existing;
    const error = new Error("Employee already has an active timer");
    error.code = "IXI_ACTIVE_TIMER_EXISTS";
    error.session = existing;
    throw error;
  }

  const startedAt = new Date(at).toISOString();
  const sameTarget = existing && clean(existing.targetKey) === targetKey;
  const session = sameTarget
    ? {
        ...existing,
        status: "running",
        lastStartedAt: startedAt,
        resumedAt: startedAt,
        updatedAt: startedAt,
        workType: clean(workType || existing.workType),
        description: clean(description || existing.description)
      }
    : {
        schema: "ixi-time-session-v2",
        sessionId: `TS-${Date.now()}`,
        targetKey,
        employeeKey: key,
        employeePassportId: clean(context.actor?.passportId),
        employeeId: clean(context.actor?.employeeId || context.actor?.userId),
        employeeLabel: clean(context.actor?.displayName || context.actor?.name || context.actor?.label),
        primaryPassportId: clean(context.primary?.passportId),
        primaryObjectId: clean(context.primary?.objectId),
        primaryObjectType: clean(context.primary?.objectType),
        primaryLabel: clean(context.primary?.label),
        locationPassportId: clean(context.location?.passportId),
        locationLabel: clean(context.location?.label),
        workOrderId: woId,
        workOrderNumber: woNumber,
        workType: clean(workType),
        description: clean(description),
        status: "running",
        startedAt,
        lastStartedAt: startedAt,
        accumulatedMs: 0,
        recordedMs: 0,
        pauseCount: 0,
        createdAt: startedAt,
        updatedAt: startedAt
      };

  if (write) {
    store[key] = session;
    writeStore(store);
  }
  return session;
}

export function pauseIXITimeSession(context = {}, { write = true, at = Date.now(), session = null } = {}) {
  const store = readStore();
  const key = getIXITimeEmployeeKey(context);
  const current = session || store[key];
  if (!current || current.status !== "running") return current || null;
  const pausedAt = new Date(at).toISOString();
  const accumulatedMs = getIXITimeSessionElapsedMs(current, at);
  const next = {
    ...current,
    status: "paused",
    pausedAt,
    lastStartedAt: "",
    accumulatedMs,
    pauseCount: Number(current.pauseCount || 0) + 1,
    updatedAt: pausedAt
  };
  if (write) {
    store[key] = next;
    writeStore(store);
  }
  return next;
}

export function resumeIXITimeSession(context = {}, { write = true, at = Date.now(), session = null } = {}) {
  const store = readStore();
  const key = getIXITimeEmployeeKey(context);
  const current = session || store[key];
  if (!current || current.status !== "paused") return current || null;
  const resumedAt = new Date(at).toISOString();
  const next = { ...current, status: "running", resumedAt, lastStartedAt: resumedAt, updatedAt: resumedAt };
  if (write) {
    store[key] = next;
    writeStore(store);
  }
  return next;
}

export function markIXITimeSessionRecorded(context = {}, recordedThroughMs = null) {
  const store = readStore();
  const key = getIXITimeEmployeeKey(context);
  const current = store[key];
  if (!current) return null;
  const elapsed = recordedThroughMs == null ? getIXITimeSessionElapsedMs(current) : Number(recordedThroughMs || 0);
  const next = {
    ...current,
    recordedMs: Math.max(Number(current.recordedMs || 0), elapsed),
    updatedAt: nowIso()
  };
  store[key] = next;
  writeStore(store);
  return next;
}

export function stopIXITimeSession(context = {}, { clear = false, write = true, at = Date.now(), session = null } = {}) {
  const store = readStore();
  const key = getIXITimeEmployeeKey(context);
  const current = session || store[key];
  if (!current) return null;
  const endedAt = new Date(at).toISOString();
  const accumulatedMs = getIXITimeSessionElapsedMs(current, at);
  const stopped = {
    ...current,
    status: "stopped",
    endedAt,
    lastStartedAt: "",
    accumulatedMs,
    updatedAt: endedAt
  };
  if (write) {
    if (clear) delete store[key]; else store[key] = stopped;
    writeStore(store);
  }
  return stopped;
}

export function replaceIXITimeSession(context = {}, session = null) {
  const store = readStore();
  const key = getIXITimeEmployeeKey(context);
  if (session) store[key] = session; else delete store[key];
  writeStore(store);
  return session;
}

export function clearIXITimeSession(context = {}) {
  const store = readStore();
  const key = getIXITimeEmployeeKey(context);
  delete store[key];
  writeStore(store);
}

export function subscribeIXITimeSession(listener) {
  if (typeof window === "undefined") return () => {};
  const handler = () => listener?.();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}

export default {
  getIXITimeEmployeeKey,
  getIXITimeTargetKey,
  getIXIActiveTimeSession,
  getIXITimeSessionElapsedMs,
  getIXITimeSessionUnrecordedMs,
  formatIXITimeDuration,
  startIXITimeSession,
  pauseIXITimeSession,
  resumeIXITimeSession,
  markIXITimeSessionRecorded,
  stopIXITimeSession,
  replaceIXITimeSession,
  clearIXITimeSession,
  subscribeIXITimeSession
};
