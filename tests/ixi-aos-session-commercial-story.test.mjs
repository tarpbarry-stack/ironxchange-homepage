import test from "node:test";
import assert from "node:assert/strict";

import {
  admitAosSessionObject,
  captureAosOperationUndo,
  createAosSessionPersistencePayload,
  createAosSessionPlacement,
  getAosPlacementScopeKey,
  hydrateAosSessionPlacement,
  moveAosSessionObject,
  recallAosSessionObjectsToStart,
  undoAosSessionOperation
} from "../components/ixi-mos/workspace/IXIAosSessionPlacementEngine.mjs";

const ACTOR = "person-machine-king";
const RIPPER = "object-existing-ripper";
const EQUIPMENT = "object-customer-index-equipment";
const WICHITA_FALLS = "object-customer-card-wichita-falls";

function createPersonal() {
  return createAosSessionPlacement({
    tenantId: "entity-star-and-sons",
    workspaceId: "aos-work",
    sessionId: "session-star-and-sons-001",
    placementScope: {
      kind: "personal",
      scopeId: `personal:${ACTOR}`,
      ownerActorId: ACTOR
    },
    startedAt: "2026-09-07T16:00:00.000Z",
    expiresAt: "2026-09-08T16:00:00.000Z"
  });
}

test("Star & Sons session story changes placement only", () => {
  const durableCensus = Object.freeze({
    objectCount: 25,
    passportCount: 25,
    edgeCount: 40,
    ripperObjectId: RIPPER,
    ripperPassportId: "IXIEXAMPLE"
  });

  let state = createPersonal();
  state = admitAosSessionObject(state, {
    objectId: RIPPER,
    resolvedSurface: `rail:${EQUIPMENT}`,
    activeSummonedContext: EQUIPMENT,
    admissionMode: "preview",
    visualOrder: 5,
    actorId: ACTOR,
    now: "2026-09-07T16:01:00.000Z"
  });

  // A second projection of the same canonical object cannot create another
  // session object or replace the first resolved origin.
  state = admitAosSessionObject(state, {
    objectId: RIPPER,
    resolvedSurface: `rail:${WICHITA_FALLS}`,
    activeSummonedContext: WICHITA_FALLS,
    admissionMode: "preview",
    visualOrder: 0,
    actorId: ACTOR,
    now: "2026-09-07T16:02:00.000Z"
  });
  assert.equal(Object.keys(state.objectsById).length, 1);
  assert.equal(state.objectsById[RIPPER].sessionOrigin.surfaceId, `rail:${EQUIPMENT}`);

  state = moveAosSessionObject(state, {
    objectId: RIPPER,
    currentSurface: `surface:${WICHITA_FALLS}`,
    activeSummonedContext: WICHITA_FALLS,
    visualOrder: 0,
    actorId: ACTOR,
    now: "2026-09-07T16:03:00.000Z"
  });
  state = captureAosOperationUndo(state, {
    operationId: "call-equipment-001",
    objectIds: [RIPPER],
    actorId: ACTOR,
    now: "2026-09-07T16:04:00.000Z"
  });
  state = moveAosSessionObject(state, {
    objectId: RIPPER,
    currentSurface: `surface:${EQUIPMENT}`,
    activeSummonedContext: EQUIPMENT,
    visualOrder: 0,
    actorId: ACTOR,
    now: "2026-09-07T16:05:00.000Z"
  });

  const undone = undoAosSessionOperation(state, {
    operationId: "call-equipment-001",
    actorId: ACTOR,
    now: "2026-09-07T16:06:00.000Z"
  });
  assert.equal(undone.objectsById[RIPPER].currentSurface, `surface:${WICHITA_FALLS}`);

  const recalled = recallAosSessionObjectsToStart(undone, {
    objectIds: [RIPPER],
    actorId: ACTOR,
    now: "2026-09-07T16:07:00.000Z"
  });
  assert.equal(recalled.objectsById[RIPPER].currentSurface, `rail:${EQUIPMENT}`);
  assert.equal(recalled.objectsById[RIPPER].activeSummonedContext, EQUIPMENT);

  const payload = createAosSessionPersistencePayload(recalled, {
    expectedRevision: 0
  });
  const refreshed = hydrateAosSessionPlacement(payload.sessionPlacement, recalled);
  assert.deepEqual(refreshed, recalled);

  // The session engine cannot receive or mutate durable identity/graph counts.
  assert.deepEqual(durableCensus, {
    objectCount: 25,
    passportCount: 25,
    edgeCount: 40,
    ripperObjectId: RIPPER,
    ripperPassportId: "IXIEXAMPLE"
  });
  assert.equal("passportId" in refreshed, false);
  assert.equal("edges" in refreshed, false);
});

test("personal and shared Star & Sons scopes cannot collide", () => {
  const personal = createPersonal();
  const shared = createAosSessionPlacement({
    tenantId: personal.tenantId,
    workspaceId: personal.workspaceId,
    sessionId: personal.sessionId,
    placementScope: {
      kind: "shared",
      scopeId: "star-and-sons-dispatch"
    },
    startedAt: personal.startedAt,
    expiresAt: personal.expiresAt
  });

  assert.notEqual(getAosPlacementScopeKey(personal), getAosPlacementScopeKey(shared));
});
