import {
  IXI_AOS_SESSION_PLACEMENT_SCHEMA,
  hydrateAosSessionPlacement,
  validateAosSessionPlacement
} from "./IXIAosSessionPlacementEngine.mjs";

const RETRYABLE_CODES = new Set([
  "MOS_GATEWAY_NETWORK_ERROR",
  "NETWORK_ERROR",
  "ECONNRESET",
  "ETIMEDOUT"
]);

function clean(value) {
  return String(value ?? "").trim();
}

function canonicalObjectId(value) {
  const objectId = clean(value);
  if (!objectId.startsWith("object_")) {
    const error = new Error("Workspace placement requires canonical objectId values.");
    error.code = "WORKSPACE_CANONICAL_OBJECT_REQUIRED";
    throw error;
  }
  return objectId;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sessionFromResponse(response) {
  return response?.result?.session || response?.session || null;
}

function commandIdPart(value) {
  return clean(value).replace(/[^A-Za-z0-9:._-]/g, "-").slice(0, 48);
}

function placementScopeFromSession(session) {
  if (session?.placementScope === "shared") {
    return {
      kind: "shared",
      scopeId: clean(session.sharedScopeId || session.scopeOwnerId)
    };
  }
  return {
    kind: "personal",
    scopeId: clean(session.scopeOwnerId),
    ownerActorId: clean(session.scopeOwnerId)
  };
}

function engineSnapshotFromSession(session) {
  const objectsById = Object.fromEntries(
    Object.entries(session?.objects || {}).map(([key, record]) => {
      const objectId = canonicalObjectId(record?.objectId || key);
      const origin = record?.sessionOrigin || {};
      const current = record?.currentPlacement || origin;
      const snapshot = record?.returnSnapshot;
      return [objectId, {
        objectId,
        sessionOrigin: {
          surfaceId: clean(origin.surfaceId),
          activeSummonedContext: null,
          visualOrder: Number(origin.visualOrder || 0),
          admissionMode: clean(origin.operatingState || "preview")
        },
        currentSurface: clean(current.surfaceId),
        activeSummonedContext: clean(record?.activeSummonedContext) || null,
        returnSnapshot: snapshot ? {
          operationId: clean(snapshot.operationId),
          currentSurface: clean(snapshot.placement?.surfaceId),
          activeSummonedContext: null,
          visualOrder: Number(snapshot.placement?.visualOrder || 0),
          operatingState: clean(snapshot.placement?.operatingState || "operating"),
          capturedAt: snapshot.capturedAt
        } : null,
        visualOrder: Number(current.visualOrder || 0),
        operatingState: clean(current.operatingState || "operating"),
        admittedAt: record?.admittedAt,
        updatedAt: record?.updatedAt
      }];
    })
  );

  return {
    schema: IXI_AOS_SESSION_PLACEMENT_SCHEMA,
    status: session?.status === "ended" ? "ended" : "active",
    tenantId: clean(session?.tenantId),
    workspaceId: clean(session?.workspaceId),
    sessionId: clean(session?.sessionId),
    placementScope: placementScopeFromSession(session),
    startedAt: session?.startedAt,
    expiresAt: session?.expiresAt,
    endedAt: session?.endedAt || null,
    revision: Number(session?.revision || 0),
    updatedAt: session?.updatedAt || session?.startedAt,
    objectsById
  };
}

export function validateIxCoreWorkspaceSession(session, previousSession = null) {
  const snapshot = engineSnapshotFromSession(session);
  if (snapshot.status === "active") {
    hydrateAosSessionPlacement(snapshot, null, {
      now: session?.updatedAt || new Date().toISOString()
    });
  } else {
    validateAosSessionPlacement(snapshot);
  }

  if (previousSession) {
    Object.entries(previousSession.objects || {}).forEach(([objectId, previous]) => {
      const next = session?.objects?.[objectId];
      if (
        next &&
        JSON.stringify(next.sessionOrigin) !== JSON.stringify(previous.sessionOrigin)
      ) {
        const error = new Error("IX-Core changed an immutable sessionOrigin.");
        error.code = "WORKSPACE_SESSION_ORIGIN_MUTATED";
        error.objectId = objectId;
        throw error;
      }
    });
  }

  return snapshot;
}

export function workspacePlacementsFromSession(session, surfaces = {}) {
  const placements = Object.fromEntries(
    Object.entries(surfaces || {}).map(([surfaceId, objectIds]) => [
      clean(surfaceId),
      Array.isArray(objectIds) ? [] : []
    ])
  );
  const grouped = new Map();

  Object.values(session?.objects || {}).forEach(record => {
    const objectId = canonicalObjectId(record?.objectId);
    const placement = record?.currentPlacement || record?.sessionOrigin;
    const surfaceId = clean(placement?.surfaceId);
    if (!surfaceId) return;
    if (!grouped.has(surfaceId)) grouped.set(surfaceId, []);
    grouped.get(surfaceId).push({
      objectId,
      visualOrder: Number(placement?.visualOrder || 0)
    });
  });

  grouped.forEach((records, surfaceId) => {
    placements[surfaceId] = records
      .sort((left, right) =>
        left.visualOrder - right.visualOrder ||
        left.objectId.localeCompare(right.objectId)
      )
      .map(record => record.objectId);
  });
  return placements;
}

export function locateWorkspaceObject(placements, objectId) {
  const id = canonicalObjectId(objectId);
  for (const [surfaceId, objectIds] of Object.entries(placements || {})) {
    const visualOrder = Array.isArray(objectIds)
      ? objectIds.findIndex(candidate => clean(candidate) === id)
      : -1;
    if (visualOrder >= 0) return { surfaceId, visualOrder };
  }
  return null;
}

function placeOneObject(placements, objectId, placement) {
  const id = canonicalObjectId(objectId);
  const next = Object.fromEntries(
    Object.entries(placements || {}).map(([surfaceId, objectIds]) => [
      surfaceId,
      Array.isArray(objectIds)
        ? objectIds.filter(candidate => clean(candidate) !== id)
        : []
    ])
  );
  if (!placement?.surfaceId) return next;
  const surface = clean(placement.surfaceId);
  const members = [...(next[surface] || [])];
  const index = Math.max(0, Math.min(Number(placement.visualOrder || 0), members.length));
  members.splice(index, 0, id);
  next[surface] = members;
  return next;
}

function changedObjectIds(previous, next) {
  const ids = new Set();
  Object.values(previous || {}).forEach(values =>
    (Array.isArray(values) ? values : []).forEach(value => ids.add(canonicalObjectId(value)))
  );
  Object.values(next || {}).forEach(values =>
    (Array.isArray(values) ? values : []).forEach(value => ids.add(canonicalObjectId(value)))
  );
  return [...ids].filter(objectId => {
    const before = locateWorkspaceObject(previous, objectId);
    const after = locateWorkspaceObject(next, objectId);
    return JSON.stringify(before) !== JSON.stringify(after);
  });
}

function sameObjectSet(left = [], right = []) {
  const normalize = values => values.map(canonicalObjectId).sort();
  return JSON.stringify(normalize(left)) === JSON.stringify(normalize(right));
}

function retryable(error) {
  return !Number(error?.status) || RETRYABLE_CODES.has(clean(error?.code));
}

export function createAosWorkspaceSessionController({
  transport,
  relationshipTransport = null,
  createCommandId,
  onSession = () => {},
  onPlacements = () => {},
  onError = () => {},
  initialSurfaces = {}
} = {}) {
  if (!transport?.open || !transport?.read || !transport?.command || !transport?.end) {
    throw new Error("Authenticated workspace session transport is required.");
  }
  if (typeof createCommandId !== "function") {
    throw new Error("A stable command ID factory is required.");
  }

  let session = null;
  let placements = clone(initialSurfaces);
  let queue = Promise.resolve();
  const objectEpoch = new Map();
  const operations = new Map();

  function publishSession(next, { hydratePlacements = false } = {}) {
    validateIxCoreWorkspaceSession(next, session);
    session = clone(next);
    onSession(clone(session));
    if (hydratePlacements) {
      placements = workspacePlacementsFromSession(session, initialSurfaces);
      onPlacements(clone(placements));
    }
    return session;
  }

  async function withStableRetry(request) {
    try {
      return await request();
    } catch (error) {
      if (!retryable(error)) throw error;
      return request();
    }
  }

  function enqueue(task) {
    const running = queue.catch(() => null).then(task);
    queue = running.catch(error => {
      onError(error);
      return null;
    });
    return running;
  }

  async function applyCommand({ commandId, commandType, payload }) {
    if (!session) throw new Error("Workspace session is not open.");
    const expectedRevision = Number(session.revision);
    const request = () => transport.command({
      sessionId: session.sessionId,
      placementScope: session.placementScope,
      commandId,
      expectedRevision,
      commandType,
      payload
    });
    try {
      const response = await withStableRetry(request);
      const next = sessionFromResponse(response);
      if (!next) throw new Error("IX-Core did not return the authoritative workspace session.");
      publishSession(next);
      return response;
    } catch (error) {
      if (error?.code === "WORKSPACE_SESSION_REVISION_CONFLICT") {
        const readback = await transport.read({
          sessionId: session.sessionId,
          placementScope: session.placementScope
        });
        const next = sessionFromResponse(readback);
        if (next) publishSession(next);
      }
      throw error;
    }
  }

  async function open(options) {
    const commandId = clean(options?.commandId) || createCommandId("aos-session-open");
    const response = await withStableRetry(() => transport.open({
      ...options,
      commandId
    }));
    const next = sessionFromResponse(response);
    if (!next) throw new Error("IX-Core did not return an authenticated workspace session.");
    publishSession(next, { hydratePlacements: true });
    return clone(session);
  }

  function admitObjects(descriptors = []) {
    return enqueue(async () => {
      const pending = descriptors.flatMap(descriptor => {
        const objectId = canonicalObjectId(descriptor?.objectId);
        if (session?.objects?.[objectId]) return [];
        return [{
          objectId,
          surfaceId: clean(descriptor.surfaceId),
          visualOrder: Number(descriptor.visualOrder || 0),
          operatingState: clean(descriptor.operatingState || "preview"),
          activeSummonedContext:
            clean(descriptor.activeSummonedContext) || null
        }];
      });

      if (pending.length) {
        await applyCommand({
          commandId: createCommandId("aos-admit-batch"),
          commandType: "objects.admit",
          payload: { objects: pending }
        });
      }
      placements = workspacePlacementsFromSession(session, initialSurfaces);
      onPlacements(clone(placements));
      return clone(session);
    });
  }

  function rollbackLocal(operationId) {
    const operation = operations.get(operationId);
    if (!operation) return [];
    const eligible = [];
    let next = placements;
    operation.objects.forEach(record => {
      if (objectEpoch.get(record.objectId) !== record.epoch) return;
      next = placeOneObject(next, record.objectId, record.before);
      eligible.push(record.objectId);
    });
    if (eligible.length) {
      placements = next;
      onPlacements(clone(placements));
    }
    return eligible;
  }

  async function undoServerOperation(operationId, objectIds) {
    if (!objectIds.length) return;
    await applyCommand({
      commandId: `${commandIdPart(operationId)}:undo`,
      commandType: "objects.undo",
      payload: { objectIds, operationId }
    });
  }

  function persistLayout(nextPlacements, {
    operationId = createCommandId("aos-workspace-operation"),
    captureUndo = true,
    objectIds = null,
    activeSummonedContext
  } = {}) {
    const previous = clone(placements);
    const next = clone(nextPlacements);
    const changedCandidates = changedObjectIds(previous, next);
    const requestedIds = objectIds == null
      ? null
      : new Set(objectIds.map(canonicalObjectId));
    const changed = requestedIds
      ? changedCandidates.filter(objectId => requestedIds.has(objectId))
      : changedCandidates;
    const operation = {
      operationId,
      objects: changed.map(objectId => {
        const epoch = (objectEpoch.get(objectId) || 0) + 1;
        objectEpoch.set(objectId, epoch);
        return { objectId, epoch, before: locateWorkspaceObject(previous, objectId) };
      })
    };
    operations.set(operationId, operation);
    placements = next;
    onPlacements(clone(placements));

    const completion = enqueue(async () => {
      try {
        const destinationSurfaces = new Set();
        const admissions = [];
        const moves = [];
        for (let index = 0; index < changed.length; index += 1) {
          const objectId = changed[index];
          const destination = locateWorkspaceObject(next, objectId);
          if (!destination) continue;
          destinationSurfaces.add(destination.surfaceId);
          if (!session?.objects?.[objectId]) {
            admissions.push({
              objectId,
              surfaceId: destination.surfaceId,
              visualOrder: destination.visualOrder,
              operatingState:
                destination.surfaceId.startsWith("container:") ||
                destination.surfaceId === "indexEquipment"
                  ? "tucked"
                  : "operating",
              ...(activeSummonedContext === undefined
                ? {}
                : {
                    activeSummonedContext:
                      clean(activeSummonedContext) || null
                  })
            });
          } else {
            moves.push({
              objectId,
              surfaceId: destination.surfaceId,
              visualOrder: destination.visualOrder,
              operatingState:
                destination.surfaceId.startsWith("container:") ||
                destination.surfaceId === "indexEquipment"
                  ? "tucked"
                  : "operating",
              ...(activeSummonedContext === undefined
                ? {}
                : {
                    activeSummonedContext:
                      clean(activeSummonedContext) || null
                  })
            });
          }
        }

        if (admissions.length) {
          await applyCommand({
            commandId: `${commandIdPart(operationId)}:admit`,
            commandType: "objects.admit",
            payload: { objects: admissions }
          });
        }

        if (moves.length) {
          await applyCommand({
            commandId: `${commandIdPart(operationId)}:move`,
            commandType: "objects.move",
            payload: {
              objects: moves,
              operationId: captureUndo ? operationId : null
            }
          });
        }

        /*
         * IX-Core object.move intentionally changes only one placement. Finish
         * each destination with its complete canonical order so an insertion
         * cannot leave duplicate visualOrder values. This remains workspace
         * state; no durable rail ordering or relationship mutation is invoked.
         */
        let reorderIndex = 0;
        for (const surfaceId of destinationSurfaces) {
          const orderedObjectIds = (next[surfaceId] || [])
            .map(canonicalObjectId)
            .filter(objectId => session?.objects?.[objectId]);
          const authoritativeMembers = Object.values(session?.objects || {})
            .filter(record => record?.currentPlacement?.surfaceId === surfaceId)
            .map(record => canonicalObjectId(record.objectId));
          if (!sameObjectSet(orderedObjectIds, authoritativeMembers)) continue;
          await applyCommand({
            commandId: `${commandIdPart(operationId)}:reorder:${reorderIndex}`,
            commandType: "surface.reorder",
            payload: { surfaceId, orderedObjectIds }
          });
          reorderIndex += 1;
        }
        return { ok: true, operationId, changedObjectIds: changed };
      } catch (error) {
        const eligible = rollbackLocal(operationId);
        if (captureUndo && eligible.length) {
          try {
            await undoServerOperation(operationId, eligible);
          } catch (undoError) {
            onError(undoError);
          }
        }
        throw error;
      }
    });

    return { operationId, completion, changedObjectIds: changed };
  }

  function connect({
    nextPlacements,
    objectId,
    relationship
  }) {
    if (typeof relationshipTransport !== "function") {
      throw new Error("Governed relationship transport is required.");
    }
    const operationId = clean(relationship?.commandId) ||
      createCommandId("aos-connect");
    const sourceId = canonicalObjectId(objectId);
    const placement = persistLayout(nextPlacements, {
      operationId,
      objectIds: [sourceId]
    });
    const epoch = objectEpoch.get(sourceId);

    const completion = (async () => {
      await placement.completion;
      try {
        const response = await withStableRetry(() => relationshipTransport({
          ...relationship,
          commandId: operationId
        }));
        return { ok: true, operationId, response };
      } catch (error) {
        if (objectEpoch.get(sourceId) === epoch) {
          const eligible = rollbackLocal(operationId);
          if (eligible.includes(sourceId)) {
            await enqueue(() => undoServerOperation(operationId, [sourceId]));
          }
        }
        throw error;
      }
    })();
    return { operationId, completion };
  }

  function recall(objectIds) {
    const operationId = createCommandId("aos-recall");
    const ids = objectIds.map(canonicalObjectId);
    const operation = {
      operationId,
      objects: ids.map(objectId => {
        const epoch = (objectEpoch.get(objectId) || 0) + 1;
        objectEpoch.set(objectId, epoch);
        return {
          objectId,
          epoch,
          before: locateWorkspaceObject(placements, objectId)
        };
      })
    };
    operations.set(operationId, operation);

    let recalledPlacements = placements;
    ids.forEach(objectId => {
      const origin = session?.objects?.[objectId]?.sessionOrigin;
      if (origin) recalledPlacements = placeOneObject(recalledPlacements, objectId, origin);
    });
    placements = recalledPlacements;
    onPlacements(clone(placements));

    return enqueue(async () => {
      await applyCommand({
        commandId: `${commandIdPart(operationId)}:recall`,
        commandType: "objects.recall",
        payload: { objectIds: ids, operationId }
      });
      placements = workspacePlacementsFromSession(session, initialSurfaces);
      onPlacements(clone(placements));
      return { operationId, session: clone(session) };
    });
  }

  function undo(operationId) {
    const operation = operations.get(operationId);
    const objectIds = operation
      ? operation.objects
          .filter(record => objectEpoch.get(record.objectId) === record.epoch)
          .map(record => record.objectId)
      : Object.values(session?.objects || {})
          .filter(record =>
            clean(record?.returnSnapshot?.operationId) === clean(operationId)
          )
          .map(record => canonicalObjectId(record.objectId));
    return enqueue(async () => {
      await undoServerOperation(operationId, objectIds);
      operations.delete(operationId);
      placements = workspacePlacementsFromSession(session, initialSurfaces);
      onPlacements(clone(placements));
      return clone(session);
    });
  }

  function reorder(surfaceId, orderedObjectIds) {
    const commandId = createCommandId("aos-surface-reorder");
    return enqueue(async () => {
      await applyCommand({
        commandId,
        commandType: "surface.reorder",
        payload: {
          surfaceId: clean(surfaceId),
          orderedObjectIds: orderedObjectIds.map(canonicalObjectId)
        }
      });
      placements = workspacePlacementsFromSession(session, initialSurfaces);
      onPlacements(clone(placements));
      return clone(session);
    });
  }

  function summon(objectId, activeSummonedContext) {
    return enqueue(() => applyCommand({
      commandId: createCommandId("aos-summon"),
      commandType: "summon.set",
      payload: {
        objectId: canonicalObjectId(objectId),
        activeSummonedContext: clean(activeSummonedContext) || null
      }
    }));
  }

  function summonMany(objectIds, activeSummonedContext) {
    const objects = objectIds.map(objectId => ({
      objectId: canonicalObjectId(objectId),
      activeSummonedContext: clean(activeSummonedContext) || null
    }));
    if (!objects.length) return Promise.resolve(null);
    return enqueue(() => applyCommand({
      commandId: createCommandId("aos-summon-batch"),
      commandType: "objects.summon.set",
      payload: { objects }
    }));
  }

  function end() {
    return enqueue(async () => {
      if (!session) return null;
      const commandId = createCommandId("aos-session-end");
      const expectedRevision = Number(session.revision);
      const response = await withStableRetry(() => transport.end({
        sessionId: session.sessionId,
        placementScope: session.placementScope,
        commandId,
        expectedRevision
      }));
      const next = sessionFromResponse(response);
      if (next) publishSession(next);
      operations.clear();
      return clone(session);
    });
  }

  return Object.freeze({
    open,
    admitObjects,
    persistLayout,
    connect,
    recall,
    undo,
    reorder,
    summon,
    summonMany,
    end,
    readSession: () => clone(session),
    readPlacements: () => clone(placements),
    readOperation: operationId => clone(operations.get(operationId) || null),
    whenIdle: () => queue
  });
}

export default createAosWorkspaceSessionController;
