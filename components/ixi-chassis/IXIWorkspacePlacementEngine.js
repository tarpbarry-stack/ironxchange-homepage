/*
 * IXI UNIVERSAL WORKSPACE PLACEMENT ENGINE
 *
 * This engine knows NOTHING about:
 *
 * machine
 * seller
 * job
 * location
 * person
 * equipment
 * system index
 * container
 *
 * It manages only:
 *
 * OBJECT ID
 * +
 * WORKSPACE SURFACE
 * +
 * ORDER
 *
 * Business relationships belong elsewhere.
 */


/* =========================================================
   DEFAULT WORKSPACE SURFACES

   These are IXI UI surfaces, not business containers.

   Additional surfaces may be added dynamically.
   ========================================================= */

export const IXI_DEFAULT_WORKSPACE_SURFACES =
  Object.freeze([
    "board",
    "stackTop",
    "stackBottom",
    "pocketLeft",
    "pocketRight",
    "pocketLeft2",
    "pocketRight2"
  ]);


/* =========================================================
   NORMALIZATION
   ========================================================= */

function clean(value) {
  return String(
    value || ""
  ).trim();
}

function normalizeIdList(
  values = []
) {
  if (!Array.isArray(values)) {
    return [];
  }

  const seen =
    new Set();

  const result = [];

  values.forEach(value => {
    const id =
      clean(value);

    if (
      !id ||
      seen.has(id)
    ) {
      return;
    }

    seen.add(id);
    result.push(id);
  });

  return result;
}


/* =========================================================
   CREATE EMPTY PLACEMENT STATE
   ========================================================= */

export function createEmptyWorkspacePlacements({
  surfaces =
    IXI_DEFAULT_WORKSPACE_SURFACES
} = {}) {
  const placements = {};

  normalizeIdList(
    surfaces
  ).forEach(surfaceId => {
    placements[surfaceId] = [];
  });

  return placements;
}


/* =========================================================
   ENSURE SURFACE EXISTS

   Critical for future IXI environments.

   The engine does not require every surface to be
   hard-coded ahead of time.
   ========================================================= */

export function ensureWorkspaceSurface({
  placements = {},
  surfaceId
}) {
  const target =
    clean(surfaceId);

  if (!target) {
    return placements;
  }

  if (
    Array.isArray(
      placements[target]
    )
  ) {
    return placements;
  }

  return {
    ...placements,
    [target]: []
  };
}


/* =========================================================
   FIND CURRENT WORKSPACE LOCATION
   ========================================================= */

export function getObjectWorkspaceSurface({
  placements = {},
  objectId
}) {
  const id =
    clean(objectId);

  if (!id) {
    return null;
  }

  for (
    const [
      surfaceId,
      objectIds
    ] of Object.entries(
      placements || {}
    )
  ) {
    if (
      normalizeIdList(
        objectIds
      ).includes(id)
    ) {
      return surfaceId;
    }
  }

  return null;
}


/* =========================================================
   REMOVE OBJECT FROM EVERY WORKSPACE SURFACE

   Workspace invariant:

   one object
   =
   one visible workspace surface

   This says NOTHING about canonical membership,
   containment, location, assignment, etc.
   ========================================================= */

export function removeObjectFromWorkspace({
  placements = {},
  objectId
}) {
  const id =
    clean(objectId);

  if (!id) {
    return placements;
  }

  const next = {};

  Object.entries(
    placements || {}
  ).forEach(
    ([
      surfaceId,
      objectIds
    ]) => {
      next[surfaceId] =
        normalizeIdList(
          objectIds
        ).filter(
          value =>
            value !== id
        );
    }
  );

  return next;
}


/* =========================================================
   MOVE OBJECT TO WORKSPACE SURFACE
   ========================================================= */

export function moveObjectToWorkspaceSurface({
  placements = {},
  objectId,
  targetSurface,
  position = "end"
}) {
  const id =
    clean(objectId);

  const target =
    clean(targetSurface);

  if (
    !id ||
    !target
  ) {
    return placements;
  }

  let next =
    ensureWorkspaceSurface({
      placements:
        removeObjectFromWorkspace({
          placements,
          objectId: id
        }),

      surfaceId:
        target
    });

  const targetIds =
    normalizeIdList(
      next[target]
    );

  next = {
    ...next,

    [target]:
      position === "start"
        ? [
            id,
            ...targetIds
          ]
        : [
            ...targetIds,
            id
          ]
  };

  return next;
}


/* =========================================================
   MOVE OBJECT TO POSITION RELATIVE TO ANOTHER OBJECT
   ========================================================= */

export function moveObjectToWorkspacePosition({
  placements = {},
  objectId,
  targetSurface,
  targetObjectId,
  insertAfter = false
}) {
  const id =
    clean(objectId);

  const targetId =
    clean(targetObjectId);

  const surface =
    clean(targetSurface);

  if (
    !id ||
    !targetId ||
    !surface ||
    id === targetId
  ) {
    return placements;
  }

  let next =
    ensureWorkspaceSurface({
      placements:
        removeObjectFromWorkspace({
          placements,
          objectId: id
        }),

      surfaceId:
        surface
    });

  const targetIds =
    normalizeIdList(
      next[surface]
    );

  const targetIndex =
    targetIds.indexOf(
      targetId
    );

  if (
    targetIndex === -1
  ) {
    return {
      ...next,

      [surface]: [
        ...targetIds,
        id
      ]
    };
  }

  const insertIndex =
    insertAfter
      ? targetIndex + 1
      : targetIndex;

  const reordered =
    [...targetIds];

  reordered.splice(
    insertIndex,
    0,
    id
  );

  return {
    ...next,
    [surface]:
      reordered
  };
}


/* =========================================================
   REORDER INSIDE SAME SURFACE
   ========================================================= */

export function reorderObjectWithinWorkspaceSurface({
  placements = {},
  surfaceId,
  objectId,
  targetObjectId,
  insertAfter = false
}) {
  const surface =
    clean(surfaceId);

  const id =
    clean(objectId);

  const targetId =
    clean(targetObjectId);

  if (
    !surface ||
    !id ||
    !targetId ||
    id === targetId
  ) {
    return placements;
  }

  const current =
    normalizeIdList(
      placements?.[surface]
    );

  const fromIndex =
    current.indexOf(id);

  const targetIndex =
    current.indexOf(
      targetId
    );

  if (
    fromIndex === -1 ||
    targetIndex === -1
  ) {
    return placements;
  }

  const reordered =
    [...current];

  reordered.splice(
    fromIndex,
    1
  );

  const adjustedTargetIndex =
    reordered.indexOf(
      targetId
    );

  reordered.splice(
    insertAfter
      ? adjustedTargetIndex + 1
      : adjustedTargetIndex,
    0,
    id
  );

  return {
    ...placements,

    [surface]:
      reordered
  };
}


/* =========================================================
   SEND TO FRONT / BACK
   ========================================================= */

export function sendObjectToWorkspaceFront({
  placements = {},
  surfaceId = "board",
  objectId
}) {
  const surface =
    clean(surfaceId);

  const id =
    clean(objectId);

  if (
    !surface ||
    !id
  ) {
    return placements;
  }

  const current =
    normalizeIdList(
      placements?.[surface]
    );

  if (
    !current.includes(id)
  ) {
    return placements;
  }

  return {
    ...placements,

    [surface]: [
      id,
      ...current.filter(
        value =>
          value !== id
      )
    ]
  };
}


export function sendObjectToWorkspaceBack({
  placements = {},
  surfaceId = "board",
  objectId
}) {
  const surface =
    clean(surfaceId);

  const id =
    clean(objectId);

  if (
    !surface ||
    !id
  ) {
    return placements;
  }

  const current =
    normalizeIdList(
      placements?.[surface]
    );

  if (
    !current.includes(id)
  ) {
    return placements;
  }

  return {
    ...placements,

    [surface]: [
      ...current.filter(
        value =>
          value !== id
      ),
      id
    ]
  };
}


/* =========================================================
   SANITIZE UNIVERSAL WORKSPACE STATE

   validObjectIds may contain ANY IXI object family.
   ========================================================= */

export function sanitizeWorkspacePlacements({
  placements = {},
  validObjectIds = [],
  defaultSurface = "board",
  includeUnplacedObjects = true
}) {
  const valid =
    new Set(
      normalizeIdList(
        validObjectIds
      )
    );

  const seen =
    new Set();

  const next = {};

  /*
   * Preserve every known workspace surface,
   * including dynamically-created ones.
   */
  Object.entries(
    placements || {}
  ).forEach(
    ([
      surfaceId,
      objectIds
    ]) => {
      next[surfaceId] = [];

      normalizeIdList(
        objectIds
      ).forEach(id => {
        if (
          valid.has(id) &&
          !seen.has(id)
        ) {
          next[
            surfaceId
          ].push(id);

          seen.add(id);
        }
      });
    }
  );

  IXI_DEFAULT_WORKSPACE_SURFACES
    .forEach(surfaceId => {
      if (
        !Array.isArray(
          next[surfaceId]
        )
      ) {
        next[surfaceId] = [];
      }
    });

  if (
    includeUnplacedObjects
  ) {
    const target =
      clean(
        defaultSurface
      ) ||
      "board";

    if (
      !Array.isArray(
        next[target]
      )
    ) {
      next[target] = [];
    }

    valid.forEach(id => {
      if (
        !seen.has(id)
      ) {
        next[target].push(id);
        seen.add(id);
      }
    });
  }

  return next;
}


/* =========================================================
   RESOLVE OBJECTS IN WORKSPACE ORDER

   Registry may contain machines, containers, jobs,
   locations, people, seller objects, etc.
   ========================================================= */

export function resolveWorkspaceObjects({
  placements = {},
  surfaceId = "board",
  objectRegistry = new Map()
}) {
  const ids =
    normalizeIdList(
      placements?.[
        surfaceId
      ]
    );

  return ids
    .map(id => {
      if (
        objectRegistry instanceof Map
      ) {
        return (
          objectRegistry.get(id) ||
          null
        );
      }

      return (
        objectRegistry?.[id] ||
        null
      );
    })
    .filter(Boolean);
}


/* =========================================================
   VALIDATE WORKSPACE INVARIANTS

   Useful during migration and eventually tests.
   ========================================================= */

export function validateWorkspacePlacements(
  placements = {}
) {
  const seen =
    new Map();

  const duplicates = [];

  Object.entries(
    placements || {}
  ).forEach(
    ([
      surfaceId,
      objectIds
    ]) => {
      normalizeIdList(
        objectIds
      ).forEach(id => {
        if (
          seen.has(id)
        ) {
          duplicates.push({
            objectId: id,

            firstSurface:
              seen.get(id),

            duplicateSurface:
              surfaceId
          });

          return;
        }

        seen.set(
          id,
          surfaceId
        );
      });
    }
  );

  return {
    ok:
      duplicates.length === 0,

    objectCount:
      seen.size,

    duplicates
  };
}


export default {
  createEmptyWorkspacePlacements,
  ensureWorkspaceSurface,

  getObjectWorkspaceSurface,

  removeObjectFromWorkspace,

  moveObjectToWorkspaceSurface,
  moveObjectToWorkspacePosition,

  reorderObjectWithinWorkspaceSurface,

  sendObjectToWorkspaceFront,
  sendObjectToWorkspaceBack,

  sanitizeWorkspacePlacements,

  resolveWorkspaceObjects,

  validateWorkspacePlacements
};
