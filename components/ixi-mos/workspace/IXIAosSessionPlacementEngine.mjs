/*
 * IXI AOS SESSION PLACEMENT ENGINE
 *
 * This module owns temporary workspace truth only. It deliberately has no
 * dependency on MOS objects, Passports, aliases, durable edges, customer
 * labels, card numbers, Sharetribe listings, or browser storage.
 *
 * Canonical object admission belongs to the identity boundary. Persisting a
 * payload belongs to an authenticated, revision-safe adapter. This engine
 * only produces and validates the state that adapter may store.
 */

export const IXI_AOS_SESSION_PLACEMENT_SCHEMA =
  "ixi-aos-session-placement-v1";

export const IXI_AOS_PLACEMENT_SCOPE = Object.freeze({
  PERSONAL: "personal",
  SHARED: "shared"
});

const ACTIVE = "active";
const ENDED = "ended";
const PREVIEW = "preview";
const OPERATING = "operating";

function clean(value) {
  return String(value || "").trim();
}

function finiteOrder(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function iso(value, fieldName) {
  const candidate = clean(value);
  if (!candidate || Number.isNaN(Date.parse(candidate))) {
    throw new Error(`${fieldName} must be an ISO timestamp.`);
  }
  return new Date(candidate).toISOString();
}

function operationTime(value) {
  return iso(value || new Date().toISOString(), "now");
}

function required(value, fieldName) {
  const candidate = clean(value);
  if (!candidate) {
    throw new Error(`${fieldName} is required.`);
  }
  return candidate;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeScope(placementScope = {}) {
  const kind = required(placementScope.kind, "placementScope.kind");
  const scopeId = required(placementScope.scopeId, "placementScope.scopeId");

  if (!Object.values(IXI_AOS_PLACEMENT_SCOPE).includes(kind)) {
    throw new Error("placementScope.kind must be personal or shared.");
  }

  if (kind === IXI_AOS_PLACEMENT_SCOPE.PERSONAL) {
    return {
      kind,
      scopeId,
      ownerActorId: required(
        placementScope.ownerActorId,
        "placementScope.ownerActorId"
      )
    };
  }

  return { kind, scopeId };
}

function assertActiveSession(state, now = new Date().toISOString()) {
  if (state?.status !== ACTIVE) {
    throw new Error("The AOS placement session is not active.");
  }

  if (Date.parse(state.expiresAt) <= Date.parse(now)) {
    throw new Error("The AOS placement session has expired.");
  }
}

function assertActorMayMutateScope(state, actorId, authorizationDecision) {
  const actor = required(actorId, "actorId");

  if (state.placementScope.kind === IXI_AOS_PLACEMENT_SCOPE.PERSONAL) {
    if (actor !== state.placementScope.ownerActorId) {
      throw new Error("Personal placement scope belongs to another actor.");
    }
    return;
  }

  const decision = authorizationDecision || {};
  if (
    decision.allowed !== true ||
    clean(decision.actorId) !== actor ||
    clean(decision.scopeKey) !== getAosPlacementScopeKey(state)
  ) {
    throw new Error(
      "Shared placement mutation requires a matching server authorization decision."
    );
  }
}

function nextRevision(state, now) {
  return {
    ...state,
    revision: Number(state.revision || 0) + 1,
    updatedAt: operationTime(now)
  };
}

function normalizeOrigin({
  resolvedSurface,
  activeSummonedContext = null,
  visualOrder = 0,
  admissionMode = PREVIEW
}) {
  const surface = required(resolvedSurface, "resolvedSurface");
  const mode = admissionMode === OPERATING ? OPERATING : PREVIEW;

  return Object.freeze({
    surfaceId: surface,
    activeSummonedContext: clean(activeSummonedContext) || null,
    visualOrder: finiteOrder(visualOrder),
    admissionMode: mode
  });
}

function updateRecord(state, objectId, updater, now) {
  const id = required(objectId, "objectId");
  const current = state.objectsById?.[id];
  if (!current) {
    throw new Error(`Canonical object is not admitted to this session: ${id}`);
  }

  return nextRevision(
    {
      ...state,
      objectsById: {
        ...state.objectsById,
        [id]: updater(current)
      }
    },
    now
  );
}

export function getAosPlacementScopeKey({
  tenantId,
  workspaceId,
  sessionId,
  placementScope
} = {}) {
  const scope = normalizeScope(placementScope);
  return [
    required(tenantId, "tenantId"),
    required(workspaceId, "workspaceId"),
    required(sessionId, "sessionId"),
    scope.kind,
    scope.scopeId,
    scope.kind === IXI_AOS_PLACEMENT_SCOPE.PERSONAL
      ? scope.ownerActorId
      : "collaborative"
  ].map(encodeURIComponent).join("/");
}

export function getAosPlacementIdentity(state, objectId) {
  return {
    tenantId: required(state?.tenantId, "tenantId"),
    workspaceId: required(state?.workspaceId, "workspaceId"),
    sessionId: required(state?.sessionId, "sessionId"),
    objectId: required(objectId, "objectId"),
    placementScope: normalizeScope(state?.placementScope)
  };
}

export function createAosSessionPlacement({
  tenantId,
  workspaceId,
  sessionId,
  placementScope,
  startedAt,
  expiresAt
}) {
  const start = iso(startedAt, "startedAt");
  const expiry = iso(expiresAt, "expiresAt");
  if (Date.parse(expiry) <= Date.parse(start)) {
    throw new Error("expiresAt must be after startedAt.");
  }

  const state = {
    schema: IXI_AOS_SESSION_PLACEMENT_SCHEMA,
    status: ACTIVE,
    tenantId: required(tenantId, "tenantId"),
    workspaceId: required(workspaceId, "workspaceId"),
    sessionId: required(sessionId, "sessionId"),
    placementScope: normalizeScope(placementScope),
    startedAt: start,
    expiresAt: expiry,
    endedAt: null,
    revision: 0,
    updatedAt: start,
    objectsById: {}
  };

  return Object.freeze(state);
}

export function admitAosSessionObject(state, {
  objectId,
  resolvedSurface,
  activeSummonedContext = null,
  visualOrder = 0,
  admissionMode = PREVIEW,
  actorId,
  authorizationDecision = null,
  now
}) {
  assertActiveSession(state, now);
  assertActorMayMutateScope(state, actorId, authorizationDecision);
  const id = required(objectId, "objectId");

  // First admission owns the immutable origin. Re-admission is a no-op.
  if (state.objectsById?.[id]) {
    return state;
  }

  const origin = normalizeOrigin({
    resolvedSurface,
    activeSummonedContext,
    visualOrder,
    admissionMode
  });

  return nextRevision(
    {
      ...state,
      objectsById: {
        ...state.objectsById,
        [id]: {
          objectId: id,
          sessionOrigin: origin,
          currentSurface: origin.surfaceId,
          activeSummonedContext: origin.activeSummonedContext,
          returnSnapshot: null,
          visualOrder: origin.visualOrder,
          operatingState: origin.admissionMode,
          admittedAt: operationTime(now),
          updatedAt: operationTime(now)
        }
      }
    },
    now
  );
}

export function moveAosSessionObject(state, {
  objectId,
  currentSurface,
  activeSummonedContext = null,
  visualOrder = 0,
  actorId,
  authorizationDecision = null,
  now
}) {
  assertActiveSession(state, now);
  assertActorMayMutateScope(state, actorId, authorizationDecision);
  const surface = required(currentSurface, "currentSurface");

  return updateRecord(state, objectId, current => ({
    ...current,
    currentSurface: surface,
    activeSummonedContext: clean(activeSummonedContext) || null,
    visualOrder: finiteOrder(visualOrder),
    operatingState: OPERATING,
    updatedAt: operationTime(now)
  }), now);
}

export function setAosSessionSummonedContext(state, {
  objectId,
  activeSummonedContext,
  actorId,
  authorizationDecision = null,
  now
}) {
  assertActiveSession(state, now);
  assertActorMayMutateScope(state, actorId, authorizationDecision);

  return updateRecord(state, objectId, current => ({
    ...current,
    activeSummonedContext: clean(activeSummonedContext) || null,
    updatedAt: operationTime(now)
  }), now);
}

export function captureAosOperationUndo(state, {
  operationId,
  objectIds = [],
  actorId,
  authorizationDecision = null,
  now
}) {
  assertActiveSession(state, now);
  assertActorMayMutateScope(state, actorId, authorizationDecision);
  const operation = required(operationId, "operationId");
  const ids = [...new Set(objectIds.map(value => clean(value)).filter(Boolean))];
  if (!ids.length) return state;

  let changed = false;
  const objectsById = { ...state.objectsById };

  ids.forEach(id => {
    const current = objectsById[id];
    if (!current) {
      throw new Error(`Canonical object is not admitted to this session: ${id}`);
    }

    // A retry of the same operation cannot overwrite its original undo state.
    if (current.returnSnapshot?.operationId === operation) return;

    objectsById[id] = {
      ...current,
      returnSnapshot: {
        operationId: operation,
        currentSurface: current.currentSurface,
        activeSummonedContext: current.activeSummonedContext,
        visualOrder: current.visualOrder,
        operatingState: current.operatingState,
        capturedAt: operationTime(now)
      },
      updatedAt: operationTime(now)
    };
    changed = true;
  });

  return changed
    ? nextRevision({ ...state, objectsById }, now)
    : state;
}

export function undoAosSessionOperation(state, {
  operationId,
  actorId,
  authorizationDecision = null,
  now
}) {
  assertActiveSession(state, now);
  assertActorMayMutateScope(state, actorId, authorizationDecision);
  const operation = required(operationId, "operationId");
  let changed = false;
  const objectsById = {};

  Object.entries(state.objectsById || {}).forEach(([id, current]) => {
    const snapshot = current.returnSnapshot;
    if (snapshot?.operationId !== operation) {
      objectsById[id] = current;
      return;
    }

    objectsById[id] = {
      ...current,
      currentSurface: snapshot.currentSurface,
      activeSummonedContext: snapshot.activeSummonedContext,
      visualOrder: snapshot.visualOrder,
      operatingState: snapshot.operatingState,
      returnSnapshot: null,
      updatedAt: operationTime(now)
    };
    changed = true;
  });

  return changed
    ? nextRevision({ ...state, objectsById }, now)
    : state;
}

export function recallAosSessionObjectsToStart(state, {
  objectIds = null,
  actorId,
  authorizationDecision = null,
  now
}) {
  assertActiveSession(state, now);
  assertActorMayMutateScope(state, actorId, authorizationDecision);
  const selected = objectIds == null
    ? new Set(Object.keys(state.objectsById || {}))
    : new Set(objectIds.map(value => clean(value)).filter(Boolean));
  const objectsById = { ...state.objectsById };
  let changed = false;

  selected.forEach(id => {
    const current = objectsById[id];
    if (!current) {
      throw new Error(`Canonical object is not admitted to this session: ${id}`);
    }
    const origin = current.sessionOrigin;
    objectsById[id] = {
      ...current,
      currentSurface: origin.surfaceId,
      activeSummonedContext: origin.activeSummonedContext,
      visualOrder: origin.visualOrder,
      operatingState: origin.admissionMode,
      updatedAt: operationTime(now)
    };
    changed = true;
  });

  return changed
    ? nextRevision({ ...state, objectsById }, now)
    : state;
}

export function reorderAosSessionSurface(state, {
  surfaceId,
  orderedObjectIds = [],
  actorId,
  authorizationDecision = null,
  now
}) {
  assertActiveSession(state, now);
  assertActorMayMutateScope(state, actorId, authorizationDecision);
  const surface = required(surfaceId, "surfaceId");
  const ids = orderedObjectIds.map(value => required(value, "objectId"));
  if (new Set(ids).size !== ids.length) {
    throw new Error("orderedObjectIds contains duplicate canonical objects.");
  }

  const currentSurfaceIds = Object.values(state.objectsById || {})
    .filter(record => record.currentSurface === surface)
    .map(record => record.objectId);
  if (
    currentSurfaceIds.length !== ids.length ||
    currentSurfaceIds.some(id => !ids.includes(id))
  ) {
    throw new Error("orderedObjectIds must contain the complete surface membership.");
  }

  const objectsById = { ...state.objectsById };
  ids.forEach((id, index) => {
    const current = objectsById[id];
    if (!current || current.currentSurface !== surface) {
      throw new Error(`Object ${id} is not admitted on surface ${surface}.`);
    }
    objectsById[id] = {
      ...current,
      visualOrder: index,
      updatedAt: operationTime(now)
    };
  });

  return nextRevision({ ...state, objectsById }, now);
}

export function createAosSessionPersistencePayload(state, {
  expectedRevision
} = {}) {
  validateAosSessionPlacement(state);
  const expected = Number(expectedRevision);
  if (!Number.isInteger(expected) || expected < 0) {
    throw new Error("expectedRevision from the authoritative store is required.");
  }
  return {
    scopeKey: getAosPlacementScopeKey(state),
    expectedRevision: expected,
    nextRevision: state.revision,
    sessionPlacement: clone(state)
  };
}

export function hydrateAosSessionPlacement(
  payload,
  expectedScope = null,
  { now = new Date().toISOString() } = {}
) {
  const state = clone(payload);
  validateAosSessionPlacement(state);
  if (
    expectedScope &&
    getAosPlacementScopeKey(state) !== getAosPlacementScopeKey(expectedScope)
  ) {
    throw new Error("Persisted placement belongs to a different AOS scope.");
  }
  if (state.status === ACTIVE) {
    assertActiveSession(state, now);
  }
  return state;
}

export function endAosSessionPlacement(state, { actorId, authorizationDecision = null, now }) {
  assertActiveSession(state, now);
  assertActorMayMutateScope(state, actorId, authorizationDecision);
  const endedAt = operationTime(now);
  const objectsById = Object.fromEntries(
    Object.entries(state.objectsById || {}).map(([id, current]) => [
      id,
      { ...current, returnSnapshot: null, updatedAt: endedAt }
    ])
  );
  return nextRevision({ ...state, status: ENDED, endedAt, objectsById }, now);
}

export function validateAosSessionPlacement(state) {
  if (state?.schema !== IXI_AOS_SESSION_PLACEMENT_SCHEMA) {
    throw new Error("Unsupported AOS session placement schema.");
  }
  required(state.tenantId, "tenantId");
  required(state.workspaceId, "workspaceId");
  required(state.sessionId, "sessionId");
  normalizeScope(state.placementScope);
  iso(state.startedAt, "startedAt");
  iso(state.expiresAt, "expiresAt");
  if (Date.parse(state.expiresAt) <= Date.parse(state.startedAt)) {
    throw new Error("expiresAt must be after startedAt.");
  }
  if (![ACTIVE, ENDED].includes(state.status)) {
    throw new Error("Invalid AOS session placement status.");
  }
  if (!state.objectsById || typeof state.objectsById !== "object") {
    throw new Error("objectsById is required.");
  }
  if (!Number.isInteger(state.revision) || state.revision < 0) {
    throw new Error("revision must be a non-negative integer.");
  }

  Object.entries(state.objectsById).forEach(([key, record]) => {
    if (key !== clean(record?.objectId)) {
      throw new Error("Session objects must be keyed by canonical objectId.");
    }
    required(record.currentSurface, "currentSurface");
    required(record.sessionOrigin?.surfaceId, "sessionOrigin.surfaceId");
    if (![PREVIEW, OPERATING].includes(record.sessionOrigin?.admissionMode)) {
      throw new Error("Invalid sessionOrigin.admissionMode.");
    }
    if (!Number.isFinite(Number(record.sessionOrigin?.visualOrder))) {
      throw new Error("Invalid sessionOrigin.visualOrder.");
    }
    if (!Number.isFinite(Number(record.visualOrder))) {
      throw new Error("Invalid visualOrder.");
    }
    if (![PREVIEW, OPERATING].includes(record.operatingState)) {
      throw new Error("Invalid operatingState.");
    }
  });

  return {
    ok: true,
    scopeKey: getAosPlacementScopeKey(state),
    objectCount: Object.keys(state.objectsById).length,
    revision: state.revision
  };
}

export default {
  createAosSessionPlacement,
  admitAosSessionObject,
  moveAosSessionObject,
  setAosSessionSummonedContext,
  captureAosOperationUndo,
  undoAosSessionOperation,
  recallAosSessionObjectsToStart,
  reorderAosSessionSurface,
  createAosSessionPersistencePayload,
  hydrateAosSessionPlacement,
  endAosSessionPlacement,
  getAosPlacementScopeKey,
  getAosPlacementIdentity,
  validateAosSessionPlacement
};
