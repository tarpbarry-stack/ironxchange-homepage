import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  IXI_AOS_PLACEMENT_SCOPE,
  admitAosSessionObject,
  captureAosOperationUndo,
  createAosSessionPersistencePayload,
  createAosSessionPlacement,
  endAosSessionPlacement,
  getAosPlacementIdentity,
  getAosPlacementScopeKey,
  hydrateAosSessionPlacement,
  moveAosSessionObject,
  recallAosSessionObjectsToStart,
  reorderAosSessionSurface,
  setAosSessionSummonedContext,
  undoAosSessionOperation,
  validateAosSessionPlacement
} from "../components/ixi-mos/workspace/IXIAosSessionPlacementEngine.mjs";

const T0 = "2026-09-07T16:00:00.000Z";
const T1 = "2026-09-07T16:01:00.000Z";
const T2 = "2026-09-07T16:02:00.000Z";
const T3 = "2026-09-07T16:03:00.000Z";
const EXPIRY = "2026-09-08T16:00:00.000Z";

function personalSession(overrides = {}) {
  return createAosSessionPlacement({
    tenantId: "entity-star-and-sons",
    workspaceId: "aos-work",
    sessionId: "session-001",
    placementScope: {
      kind: IXI_AOS_PLACEMENT_SCOPE.PERSONAL,
      scopeId: "personal:user-001",
      ownerActorId: "user-001"
    },
    startedAt: T0,
    expiresAt: EXPIRY,
    ...overrides
  });
}

function admit(state, objectId, resolvedSurface, now = T1, extra = {}) {
  return admitAosSessionObject(state, {
    objectId,
    resolvedSurface,
    actorId: "user-001",
    now,
    ...extra
  });
}

test("session engine is dependency-free and cannot call durable services", () => {
  const source = readFileSync(new URL(
    "../components/ixi-mos/workspace/IXIAosSessionPlacementEngine.mjs",
    import.meta.url
  ), "utf8");

  assert.doesNotMatch(source, /^import\s/m);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /\blocalStorage\b|\bsessionStorage\b/);
});

test("placement identity is tenant/workspace/session/object/scope keyed", () => {
  const personal = personalSession();
  const shared = createAosSessionPlacement({
    tenantId: personal.tenantId,
    workspaceId: personal.workspaceId,
    sessionId: personal.sessionId,
    placementScope: { kind: "shared", scopeId: "crew-alpha" },
    startedAt: T0,
    expiresAt: EXPIRY
  });

  assert.notEqual(getAosPlacementScopeKey(personal), getAosPlacementScopeKey(shared));
  assert.deepEqual(getAosPlacementIdentity(personal, "object-ripper"), {
    tenantId: "entity-star-and-sons",
    workspaceId: "aos-work",
    sessionId: "session-001",
    objectId: "object-ripper",
    placementScope: {
      kind: "personal",
      scopeId: "personal:user-001",
      ownerActorId: "user-001"
    }
  });
});

test("first admission captures immutable origin for previews and later loads", () => {
  let state = admit(personalSession(), "object-ripper", "rail:equipment", T1, {
    activeSummonedContext: "object-equipment-index",
    visualOrder: 4,
    admissionMode: "preview"
  });
  const origin = state.objectsById["object-ripper"].sessionOrigin;

  const replay = admit(state, "object-ripper", "board", T2, {
    activeSummonedContext: "object-wichita-falls",
    visualOrder: 0,
    admissionMode: "operating"
  });

  assert.equal(replay, state);
  assert.deepEqual(replay.objectsById["object-ripper"].sessionOrigin, origin);
  assert.equal(replay.objectsById["object-ripper"].operatingState, "preview");
});

test("move and summoned context change session state without touching origin", () => {
  const admitted = admit(personalSession(), "object-ripper", "rail:equipment");
  const moved = moveAosSessionObject(admitted, {
    objectId: "object-ripper",
    currentSurface: "surface:wichita-falls",
    activeSummonedContext: "object-wichita-falls",
    visualOrder: 2,
    actorId: "user-001",
    now: T2
  });
  const recalledContext = setAosSessionSummonedContext(moved, {
    objectId: "object-ripper",
    activeSummonedContext: "object-equipment-index",
    actorId: "user-001",
    now: T3
  });

  assert.equal(admitted.objectsById["object-ripper"].currentSurface, "rail:equipment");
  assert.equal(recalledContext.objectsById["object-ripper"].currentSurface, "surface:wichita-falls");
  assert.equal(recalledContext.objectsById["object-ripper"].activeSummonedContext, "object-equipment-index");
  assert.equal(recalledContext.objectsById["object-ripper"].sessionOrigin.surfaceId, "rail:equipment");
  assert.equal("edges" in recalledContext, false);
  assert.equal("passportId" in recalledContext, false);
  assert.equal("aliases" in recalledContext, false);
});

test("operation undo restores its snapshot while recall-to-start uses origin", () => {
  let state = admit(personalSession(), "object-ripper", "rail:equipment");
  state = moveAosSessionObject(state, {
    objectId: "object-ripper",
    currentSurface: "board",
    activeSummonedContext: "object-equipment-index",
    visualOrder: 3,
    actorId: "user-001",
    now: T2
  });
  state = captureAosOperationUndo(state, {
    operationId: "board-wichita-001",
    objectIds: ["object-ripper"],
    actorId: "user-001",
    now: T2
  });
  state = moveAosSessionObject(state, {
    objectId: "object-ripper",
    currentSurface: "surface:wichita-falls",
    activeSummonedContext: "object-wichita-falls",
    visualOrder: 0,
    actorId: "user-001",
    now: T3
  });

  const undone = undoAosSessionOperation(state, {
    operationId: "board-wichita-001",
    actorId: "user-001",
    now: "2026-09-07T16:04:00.000Z"
  });
  assert.equal(undone.objectsById["object-ripper"].currentSurface, "board");
  assert.equal(undone.objectsById["object-ripper"].visualOrder, 3);
  assert.equal(undone.objectsById["object-ripper"].returnSnapshot, null);

  const recalled = recallAosSessionObjectsToStart(undone, {
    objectIds: ["object-ripper"],
    actorId: "user-001",
    now: "2026-09-07T16:05:00.000Z"
  });
  assert.equal(recalled.objectsById["object-ripper"].currentSurface, "rail:equipment");
  assert.equal(recalled.objectsById["object-ripper"].operatingState, "preview");
});

test("sorting changes visual order only", () => {
  let state = personalSession();
  state = admit(state, "object-a", "board", T1, { admissionMode: "operating" });
  state = admit(state, "object-b", "board", T2, { admissionMode: "operating" });
  const origins = JSON.stringify(Object.values(state.objectsById).map(item => item.sessionOrigin));

  const sorted = reorderAosSessionSurface(state, {
    surfaceId: "board",
    orderedObjectIds: ["object-b", "object-a"],
    actorId: "user-001",
    now: T3
  });

  assert.equal(sorted.objectsById["object-b"].visualOrder, 0);
  assert.equal(sorted.objectsById["object-a"].visualOrder, 1);
  assert.equal(JSON.stringify(Object.values(sorted.objectsById).map(item => item.sessionOrigin)), origins);
});

test("persistence round-trip survives refresh and rejects scope crossover", () => {
  const state = admit(personalSession(), "object-ripper", "rail:equipment");
  const persisted = createAosSessionPersistencePayload(state, {
    expectedRevision: 0
  });
  const hydrated = hydrateAosSessionPlacement(
    persisted.sessionPlacement,
    personalSession()
  );

  assert.deepEqual(hydrated, state);
  assert.equal(persisted.expectedRevision, 0);
  assert.equal(persisted.nextRevision, 1);
  assert.throws(() => hydrateAosSessionPlacement(
    persisted.sessionPlacement,
    personalSession({ workspaceId: "another-workspace" })
  ), /different AOS scope/);
});

test("persistence cannot guess the authoritative revision", () => {
  const state = admit(personalSession(), "object-ripper", "board");
  assert.throws(
    () => createAosSessionPersistencePayload(state),
    /expectedRevision from the authoritative store/
  );
});

test("personal scope rejects another employee and shared scope requires server decision", () => {
  const state = personalSession();
  assert.throws(() => admitAosSessionObject(state, {
    objectId: "object-ripper",
    resolvedSurface: "board",
    actorId: "user-002",
    now: T1
  }), /belongs to another actor/);

  const shared = createAosSessionPlacement({
    tenantId: "entity-star-and-sons",
    workspaceId: "aos-work",
    sessionId: "shared-session-001",
    placementScope: { kind: "shared", scopeId: "crew-alpha" },
    startedAt: T0,
    expiresAt: EXPIRY
  });
  const scopeKey = getAosPlacementScopeKey(shared);
  assert.throws(() => admitAosSessionObject(shared, {
    objectId: "object-ripper",
    resolvedSurface: "board",
    actorId: "user-001",
    now: T1
  }), /server authorization decision/);

  const admitted = admitAosSessionObject(shared, {
    objectId: "object-ripper",
    resolvedSurface: "board",
    actorId: "user-001",
    authorizationDecision: { allowed: true, actorId: "user-001", scopeKey },
    now: T1
  });
  assert.equal(admitted.objectsById["object-ripper"].currentSurface, "board");

  assert.throws(() => admitAosSessionObject(shared, {
    objectId: "object-second",
    resolvedSurface: "board",
    actorId: "user-002",
    authorizationDecision: { allowed: true, actorId: "user-001", scopeKey },
    now: T2
  }), /server authorization decision/);
});

test("an operation retry cannot overwrite its first undo snapshot", () => {
  let state = admit(personalSession(), "object-ripper", "rail:equipment");
  state = captureAosOperationUndo(state, {
    operationId: "operation-001",
    objectIds: ["object-ripper"],
    actorId: "user-001",
    now: T2
  });
  const firstSnapshot = state.objectsById["object-ripper"].returnSnapshot;
  state = moveAosSessionObject(state, {
    objectId: "object-ripper",
    currentSurface: "board",
    actorId: "user-001",
    now: T3
  });
  const replay = captureAosOperationUndo(state, {
    operationId: "operation-001",
    objectIds: ["object-ripper"],
    actorId: "user-001",
    now: "2026-09-07T16:04:00.000Z"
  });

  assert.deepEqual(replay.objectsById["object-ripper"].returnSnapshot, firstSnapshot);
});

test("sorting requires complete surface membership", () => {
  let state = personalSession();
  state = admit(state, "object-a", "board", T1, { admissionMode: "operating" });
  state = admit(state, "object-b", "board", T2, { admissionMode: "operating" });

  assert.throws(() => reorderAosSessionSurface(state, {
    surfaceId: "board",
    orderedObjectIds: ["object-a"],
    actorId: "user-001",
    now: T3
  }), /complete surface membership/);
});

test("end clears abandoned snapshots and expiration blocks movement", () => {
  let state = admit(personalSession(), "object-ripper", "board");
  state = captureAosOperationUndo(state, {
    operationId: "operation-001",
    objectIds: ["object-ripper"],
    actorId: "user-001",
    now: T2
  });
  const ended = endAosSessionPlacement(state, {
    actorId: "user-001",
    now: T3
  });
  assert.equal(ended.status, "ended");
  assert.equal(ended.objectsById["object-ripper"].returnSnapshot, null);
  assert.throws(() => moveAosSessionObject(ended, {
    objectId: "object-ripper",
    currentSurface: "board",
    actorId: "user-001",
    now: "2026-09-07T16:04:00.000Z"
  }), /not active/);

  assert.throws(() => admitAosSessionObject(personalSession(), {
    objectId: "object-ripper",
    resolvedSurface: "board",
    actorId: "user-001",
    now: EXPIRY
  }), /expired/);
});

test("validation rejects non-canonical object-key structure", () => {
  const state = admit(personalSession(), "object-ripper", "board");
  const corrupted = structuredClone(state);
  corrupted.objectsById["listing-alias"] = corrupted.objectsById["object-ripper"];
  delete corrupted.objectsById["object-ripper"];

  assert.throws(() => validateAosSessionPlacement(corrupted), /canonical objectId/);
});

test("refresh hydration rejects an expired active session", () => {
  const state = admit(personalSession(), "object-ripper", "board");
  assert.throws(() => hydrateAosSessionPlacement(
    state,
    personalSession(),
    { now: EXPIRY }
  ), /expired/);
});
