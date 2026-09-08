import test from "node:test";
import assert from "node:assert/strict";

import {
  createAosWorkspaceSessionController,
  validateIxCoreWorkspaceSession
} from "../components/ixi-mos/workspace/IXIAosWorkspaceSessionController.mjs";

const A = "object_machine_a";
const B = "object_machine_b";
const LOCATION = "object_wichita_falls";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createServer({ placementScope = "personal", principalId = "user_1" } = {}) {
  let sequence = 0;
  let session = {
    sessionId: "session_1",
    tenantId: "tenant_1",
    entityId: "entity_1",
    workspaceId: "aos-work",
    placementScope,
    scopeOwnerId: placementScope === "personal" ? principalId : "dispatch_team",
    sharedScopeId: placementScope === "shared" ? "dispatch_team" : null,
    status: "active",
    revision: 0,
    objects: {},
    startedAt: "2026-09-07T16:00:00.000Z",
    updatedAt: "2026-09-07T16:00:00.000Z",
    expiresAt: "2026-09-08T16:00:00.000Z",
    endedAt: null
  };
  const calls = [];
  const completed = new Map();
  let failNextNetwork = false;
  let forceConflict = false;
  let denyShared = false;

  function stamp() {
    sequence += 1;
    return `2026-09-07T16:${String(sequence).padStart(2, "0")}:00.000Z`;
  }

  const transport = {
    async open(request) {
      calls.push({ type: "open", ...clone(request) });
      if (denyShared && request.placementScope === "shared") {
        const error = new Error("Shared scope denied.");
        error.code = "WORKSPACE_SHARED_SCOPE_DENIED";
        error.status = 403;
        throw error;
      }
      return { ok: true, result: { created: false, resumed: true, session: clone(session) } };
    },
    async read(request) {
      calls.push({ type: "read", ...clone(request) });
      return { ok: true, session: clone(session) };
    },
    async command(request) {
      calls.push({ type: "command", ...clone(request) });
      if (failNextNetwork) {
        failNextNetwork = false;
        const error = new Error("network");
        error.code = "MOS_GATEWAY_NETWORK_ERROR";
        throw error;
      }
      if (completed.has(request.commandId)) {
        return { ...clone(completed.get(request.commandId)), replayed: true };
      }
      if (forceConflict || request.expectedRevision !== session.revision) {
        forceConflict = false;
        const error = new Error("revision conflict");
        error.code = "WORKSPACE_SESSION_REVISION_CONFLICT";
        error.status = 409;
        throw error;
      }

      const payload = request.payload || {};
      const objectId = payload.objectId;
      const now = stamp();
      if (request.commandType === "object.admit") {
        session.objects[objectId] = {
          objectId,
          sessionOrigin: {
            surfaceId: payload.surfaceId,
            visualOrder: payload.visualOrder,
            operatingState: payload.operatingState
          },
          currentPlacement: {
            surfaceId: payload.surfaceId,
            visualOrder: payload.visualOrder,
            operatingState: payload.operatingState
          },
          activeSummonedContext: payload.activeSummonedContext || null,
          returnSnapshot: null,
          admittedAt: now,
          updatedAt: now
        };
      } else if (request.commandType === "object.snapshot.capture") {
        const record = session.objects[objectId];
        record.returnSnapshot = {
          operationId: payload.operationId,
          placement: clone(record.currentPlacement),
          capturedAt: now
        };
      } else if (request.commandType === "object.move") {
        session.objects[objectId].currentPlacement = {
          surfaceId: payload.surfaceId,
          visualOrder: payload.visualOrder,
          operatingState: payload.operatingState
        };
      } else if (request.commandType === "object.undo") {
        const record = session.objects[objectId];
        assert.equal(record.returnSnapshot.operationId, payload.operationId);
        record.currentPlacement = clone(record.returnSnapshot.placement);
        record.returnSnapshot = null;
      } else if (request.commandType === "object.recall") {
        session.objects[objectId].currentPlacement = clone(
          session.objects[objectId].sessionOrigin
        );
      } else if (request.commandType === "surface.reorder") {
        payload.orderedObjectIds.forEach((id, index) => {
          session.objects[id].currentPlacement.visualOrder = index;
        });
      } else if (request.commandType === "summon.set") {
        session.objects[objectId].activeSummonedContext =
          payload.activeSummonedContext || null;
      }
      session.revision += 1;
      session.updatedAt = now;
      const response = { ok: true, result: { changed: true, session: clone(session) } };
      completed.set(request.commandId, response);
      return clone(response);
    },
    async end(request) {
      calls.push({ type: "end", ...clone(request) });
      session.status = "ended";
      session.revision += 1;
      session.endedAt = stamp();
      Object.values(session.objects).forEach(record => {
        record.returnSnapshot = null;
      });
      return { ok: true, result: { changed: true, session: clone(session) } };
    }
  };

  return {
    transport,
    calls,
    current: () => clone(session),
    failNetworkOnce: () => { failNextNetwork = true; },
    conflictOnce: () => { forceConflict = true; },
    denyShared: () => { denyShared = true; },
    replaceSession: next => { session = clone(next); }
  };
}

let commandCounter = 0;
function commandId(prefix) {
  commandCounter += 1;
  return `${prefix}-${commandCounter}`;
}

async function readyController({
  server = createServer(),
  relationshipTransport = async request => ({ relationship: { relationshipId: "relationship_1" }, request }),
  onPlacements = () => {}
} = {}) {
  const controller = createAosWorkspaceSessionController({
    transport: server.transport,
    relationshipTransport,
    createCommandId: commandId,
    onPlacements,
    initialSurfaces: { board: [], indexEquipment: [] }
  });
  await controller.open({ workspaceId: "aos-work", placementScope: "personal" });
  await controller.admitObjects([
    { objectId: A, surfaceId: "board", visualOrder: 0, operatingState: "operating" },
    { objectId: B, surfaceId: "board", visualOrder: 1, operatingState: "operating" }
  ]);
  return { controller, server };
}

test("network retry reuses the identical session command ID", async () => {
  const { controller, server } = await readyController();
  server.failNetworkOnce();
  const operation = controller.persistLayout({ board: [B], indexEquipment: [A] });
  await operation.completion;
  const commands = server.calls.filter(call => call.type === "command");
  const counts = commands.reduce((map, call) => {
    map.set(call.commandId, (map.get(call.commandId) || 0) + 1);
    return map;
  }, new Map());
  const retriedId = [...counts].find(([, count]) => count === 2)?.[0];
  const retries = commands.filter(call => call.commandId === retriedId);
  assert.ok(retriedId);
  assert.equal(retries[0].expectedRevision, retries[1].expectedRevision);
  assert.deepEqual(retries[0].payload, retries[1].payload);
});

test("sortable placement persists one complete canonical surface order", async () => {
  const { controller, server } = await readyController();
  const operation = controller.persistLayout(
    { board: [B, A], indexEquipment: [] },
    { objectIds: [A] }
  );
  await operation.completion;

  const reorder = server.calls.find(call =>
    call.type === "command" &&
    call.commandType === "surface.reorder"
  );
  assert.deepEqual(reorder?.payload, {
    surfaceId: "board",
    orderedObjectIds: [B, A]
  });
  assert.equal(server.current().objects[B].currentPlacement.visualOrder, 0);
  assert.equal(server.current().objects[A].currentPlacement.visualOrder, 1);
});

test("durable-connect retry uses one operation ID as relationship idempotency ID", async () => {
  const requests = [];
  let first = true;
  const relationshipTransport = async request => {
    requests.push(clone(request));
    if (first) {
      first = false;
      const error = new Error("network");
      error.code = "MOS_GATEWAY_NETWORK_ERROR";
      throw error;
    }
    return { relationship: { relationshipId: "relationship_1" } };
  };
  const { controller } = await readyController({ relationshipTransport });
  const operation = controller.connect({
    nextPlacements: { board: [B], [`container:${LOCATION}`]: [A] },
    objectId: A,
    relationship: { sourceObjectId: A, targetObjectId: LOCATION }
  });
  await operation.completion;
  assert.equal(requests.length, 2);
  assert.equal(requests[0].commandId, operation.operationId);
  assert.equal(requests[1].commandId, operation.operationId);
});

test("delayed relationship success cannot overwrite a newer move", async () => {
  const pending = deferred();
  const placements = [];
  const { controller } = await readyController({
    relationshipTransport: () => pending.promise,
    onPlacements: next => placements.push(next)
  });
  const connected = controller.connect({
    nextPlacements: { board: [B], [`container:${LOCATION}`]: [A] },
    objectId: A,
    relationship: { sourceObjectId: A, targetObjectId: LOCATION }
  });
  await controller.whenIdle();
  const newer = controller.persistLayout({ board: [A, B] });
  await newer.completion;
  pending.resolve({ relationship: { relationshipId: "relationship_1" } });
  await connected.completion;
  assert.deepEqual(controller.readPlacements().board, [A, B]);
  assert.deepEqual(placements.at(-1).board, [A, B]);
});

test("delayed relationship failure rolls back only its object and preserves unrelated movement", async () => {
  const pending = deferred();
  const { controller } = await readyController({ relationshipTransport: () => pending.promise });
  const connected = controller.connect({
    nextPlacements: { board: [B], [`container:${LOCATION}`]: [A] },
    objectId: A,
    relationship: { sourceObjectId: A, targetObjectId: LOCATION }
  });
  await controller.whenIdle();
  const unrelated = controller.persistLayout({
    board: [],
    indexEquipment: [B],
    [`container:${LOCATION}`]: [A]
  });
  await unrelated.completion;
  pending.reject(Object.assign(new Error("relationship denied"), { status: 403 }));
  await assert.rejects(connected.completion, /relationship denied/);
  await controller.whenIdle();
  assert.deepEqual(controller.readPlacements().board, [A]);
  assert.deepEqual(controller.readPlacements().indexEquipment, [B]);
});

test("delayed relationship failure never rolls back a newer move of the same object", async () => {
  const pending = deferred();
  const { controller } = await readyController({ relationshipTransport: () => pending.promise });
  const connected = controller.connect({
    nextPlacements: { board: [B], [`container:${LOCATION}`]: [A] },
    objectId: A,
    relationship: { sourceObjectId: A, targetObjectId: LOCATION }
  });
  await controller.whenIdle();
  const newer = controller.persistLayout({ board: [B], indexEquipment: [A] });
  await newer.completion;
  pending.reject(Object.assign(new Error("relationship denied"), { status: 403 }));
  await assert.rejects(connected.completion, /relationship denied/);
  assert.deepEqual(controller.readPlacements().indexEquipment, [A]);
});

test("Return consumes an operation snapshot while Recall uses immutable origin", async () => {
  const { controller } = await readyController();
  const move = controller.persistLayout({ board: [B], indexEquipment: [A] });
  await move.completion;
  await controller.undo(move.operationId);
  assert.deepEqual(controller.readPlacements().board, [A, B]);

  const second = controller.persistLayout({ board: [B], indexEquipment: [A] });
  await second.completion;
  await controller.recall([A]);
  assert.equal(controller.readSession().objects[A].sessionOrigin.surfaceId, "board");
  assert.deepEqual(controller.readPlacements().board, [A, B]);
});

test("refresh resumes the same active session and hydrates its authoritative placement", async () => {
  const server = createServer();
  const first = await readyController({ server });
  const move = first.controller.persistLayout({ board: [B], indexEquipment: [A] });
  await move.completion;

  const second = createAosWorkspaceSessionController({
    transport: server.transport,
    createCommandId: commandId,
    initialSurfaces: { board: [], indexEquipment: [] }
  });
  await second.open({ workspaceId: "aos-work", placementScope: "personal" });
  assert.equal(second.readSession().sessionId, first.controller.readSession().sessionId);
  assert.deepEqual(second.readPlacements().indexEquipment, [A]);
});

test("Return consumes an authoritative snapshot after route refresh", async () => {
  const server = createServer();
  const first = await readyController({ server });
  const moved = first.controller.persistLayout(
    { board: [B], indexEquipment: [A] },
    { operationId: "operation-before-refresh", objectIds: [A] }
  );
  await moved.completion;

  const refreshed = createAosWorkspaceSessionController({
    transport: server.transport,
    createCommandId: commandId,
    initialSurfaces: { board: [], indexEquipment: [] }
  });
  await refreshed.open({ workspaceId: "aos-work", placementScope: "personal" });
  await refreshed.undo("operation-before-refresh");

  assert.deepEqual(refreshed.readPlacements().board, [A, B]);
  assert.equal(server.current().objects[A].returnSnapshot, null);
  assert.deepEqual(
    server.current().objects[A].currentPlacement,
    server.current().objects[A].sessionOrigin
  );
});

test("zero-listing workspace admits canonical IX-Core objects", async () => {
  const server = createServer();
  const controller = createAosWorkspaceSessionController({
    transport: server.transport,
    createCommandId: commandId,
    initialSurfaces: { board: [] }
  });
  await controller.open({ workspaceId: "aos-work", placementScope: "personal" });
  await controller.admitObjects([
    { objectId: LOCATION, surfaceId: "board", visualOrder: 0, operatingState: "operating" }
  ]);
  assert.deepEqual(Object.keys(controller.readSession().objects), [LOCATION]);
});

test("shared scope denial is server authoritative", async () => {
  const server = createServer({ placementScope: "shared" });
  server.denyShared();
  const controller = createAosWorkspaceSessionController({
    transport: server.transport,
    createCommandId: commandId
  });
  await assert.rejects(
    controller.open({
      workspaceId: "aos-work",
      placementScope: "shared",
      sharedScopeId: "dispatch_team"
    }),
    error => error.code === "WORKSPACE_SHARED_SCOPE_DENIED"
  );
});

test("revision conflict reads authority and rolls back only the affected object", async () => {
  const { controller, server } = await readyController();
  server.conflictOnce();
  const operation = controller.persistLayout({ board: [B], indexEquipment: [A] });
  await assert.rejects(operation.completion, /revision conflict/);
  assert.deepEqual(controller.readPlacements().board, [A, B]);
  assert.equal(server.calls.some(call => call.type === "read"), true);
});

test("session validation rejects origin mutation and alias placement keys", () => {
  const server = createServer();
  const original = server.current();
  original.objects[A] = {
    objectId: A,
    sessionOrigin: { surfaceId: "board", visualOrder: 0, operatingState: "operating" },
    currentPlacement: { surfaceId: "board", visualOrder: 0, operatingState: "operating" },
    returnSnapshot: null
  };
  const mutated = clone(original);
  mutated.objects[A].sessionOrigin.surfaceId = "indexEquipment";
  assert.throws(
    () => validateIxCoreWorkspaceSession(mutated, original),
    error => error.code === "WORKSPACE_SESSION_ORIGIN_MUTATED"
  );
  const aliased = clone(original);
  aliased.objects = {
    listing_alias: { ...aliased.objects[A], objectId: "listing_alias" }
  };
  assert.throws(() => validateIxCoreWorkspaceSession(aliased), /canonical objectId/);
});

test("workspace and relationship commands cannot change Object or Passport census", async () => {
  const census = Object.freeze({ objects: 25, passports: 25 });
  const { controller } = await readyController();
  const move = controller.persistLayout({ board: [B], indexEquipment: [A] });
  await move.completion;
  assert.deepEqual(census, { objects: 25, passports: 25 });
  assert.equal("passportId" in controller.readSession(), false);
});
