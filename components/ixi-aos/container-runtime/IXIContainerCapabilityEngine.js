/*
 * IXI AOS CONTAINER CAPABILITY ENGINE
 *
 * Container is a CAPABILITY of a Card.
 *
 * This engine does NOT know:
 * - Equipment
 * - Locations
 * - Jobs
 * - People
 * - Machines
 * - Marketplace
 * - Auction
 *
 * It knows only:
 *
 * parent Object
 * child Objects
 * direct relationships
 * Board exposure state
 * selected/on-deck child
 *
 * Durable containment truth remains in IX-Core.
 */


/* =========================================================
   BASIC HELPERS
   ========================================================= */

function clean(
  value
) {
  return String(
    value || ""
  ).trim();
}


function safeArray(
  value
) {
  return Array.isArray(
    value
  )
    ? value
    : [];
}


function safeObject(
  value
) {
  return (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(value)
  )
    ? value
    : {};
}


/* =========================================================
   OBJECT ID
   ========================================================= */

export function getIXIContainerObjectId(
  object = {}
) {
  return clean(
    object.objectId ||
    object.id?.uuid ||
    object.id ||
    object.listingId ||
    ""
  );
}


/* =========================================================
   DIRECT PARENT RESOLUTION
   ========================================================= */

/*
 * During migration we support several
 * known shapes.
 *
 * Long term IX-Core should return one
 * canonical relationship contract.
 */
export function getIXIDirectContainerId(
  object = {}
) {
  return clean(
    object.directContainerId ||

    object.containerId ||

    object.parentObjectId ||

    object.relationships
      ?.containment
      ?.directContainerId ||

    object.metadata
      ?.directContainerId ||

    ""
  );
}


/* =========================================================
   DIRECT CHILDREN
   ========================================================= */

export function getIXIDirectContainerChildren({
  container,
  objects = []
} = {}) {

  const containerId =
    getIXIContainerObjectId(
      container
    );


  if (!containerId) {
    return [];
  }


  return safeArray(
    objects
  )
    .filter(
      object => {

        const objectId =
          getIXIContainerObjectId(
            object
          );


        if (
          !objectId ||
          objectId ===
            containerId
        ) {
          return false;
        }


        return (
          getIXIDirectContainerId(
            object
          ) ===
          containerId
        );
      }
    );
}


/* =========================================================
   DESCENDANTS
   ========================================================= */

export function getIXIContainerDescendants({
  container,
  objects = []
} = {}) {

  const rootId =
    getIXIContainerObjectId(
      container
    );


  if (!rootId) {
    return [];
  }


  const allObjects =
    safeArray(
      objects
    );


  const descendants =
    [];


  const visited =
    new Set([
      rootId
    ]);


  const queue =
    [rootId];


  while (
    queue.length
  ) {

    const parentId =
      queue.shift();


    const children =
      allObjects.filter(
        object =>
          getIXIDirectContainerId(
            object
          ) ===
          parentId
      );


    children.forEach(
      child => {

        const childId =
          getIXIContainerObjectId(
            child
          );


        if (
          !childId ||
          visited.has(
            childId
          )
        ) {
          return;
        }


        visited.add(
          childId
        );


        descendants.push(
          child
        );


        queue.push(
          childId
        );
      }
    );
  }


  return descendants;
}


/* =========================================================
   ANCESTRY
   ========================================================= */

export function getIXIContainerAncestry({
  object,
  objects = []
} = {}) {

  const allObjects =
    safeArray(
      objects
    );


  const objectById =
    new Map();


  allObjects.forEach(
    candidate => {

      const id =
        getIXIContainerObjectId(
          candidate
        );


      if (id) {
        objectById.set(
          id,
          candidate
        );
      }
    }
  );


  const ancestry =
    [];


  const visited =
    new Set();


  let current =
    object;


  while (
    current
  ) {

    const parentId =
      getIXIDirectContainerId(
        current
      );


    if (
      !parentId ||
      visited.has(
        parentId
      )
    ) {
      break;
    }


    visited.add(
      parentId
    );


    const parent =
      objectById.get(
        parentId
      );


    if (!parent) {
      break;
    }


    ancestry.unshift(
      parent
    );


    current =
      parent;
  }


  return ancestry;
}


/* =========================================================
   CYCLE GUARD
   ========================================================= */

export function wouldIXIContainmentCreateCycle({
  object,
  destination,
  objects = []
} = {}) {

  const objectId =
    getIXIContainerObjectId(
      object
    );


  const destinationId =
    getIXIContainerObjectId(
      destination
    );


  if (
    !objectId ||
    !destinationId
  ) {
    return false;
  }


  if (
    objectId ===
    destinationId
  ) {
    return true;
  }


  const descendants =
    getIXIContainerDescendants({
      container:
        object,

      objects
    });


  return descendants.some(
    descendant =>
      getIXIContainerObjectId(
        descendant
      ) ===
      destinationId
  );
}


/* =========================================================
   CONTAINER SUMMARY
   ========================================================= */

export function getIXIObjectValue(
  object = {}
) {

  const candidates = [
    object.value,
    object.estimatedValue,
    object.marketValue,

    object.fields
      ?.value,

    object.fields
      ?.estimatedValue,

    object.price?.amount,

    object.price
  ];


  for (
    const candidate
    of candidates
  ) {

    const number =
      Number(
        candidate
      );


    if (
      Number.isFinite(
        number
      )
    ) {

      /*
       * Sharetribe Money may be
       * represented in minor units.
       *
       * Temporary compatibility only.
       */
      if (
        object.price?.amount !==
          undefined &&
        candidate ===
          object.price.amount &&
        number > 1000000
      ) {
        return number / 100;
      }


      return number;
    }
  }


  return 0;
}


export function getIXIContainerSummary({
  container,
  objects = []
} = {}) {

  const directChildren =
    getIXIDirectContainerChildren({
      container,
      objects
    });


  const descendants =
    getIXIContainerDescendants({
      container,
      objects
    });


  const directValue =
    directChildren.reduce(
      (
        total,
        object
      ) =>
        total +
        getIXIObjectValue(
          object
        ),
      0
    );


  const descendantValue =
    descendants.reduce(
      (
        total,
        object
      ) =>
        total +
        getIXIObjectValue(
          object
        ),
      0
    );


  return {
    directCount:
      directChildren.length,

    descendantCount:
      descendants.length,

    directValue,

    descendantValue,

    directChildren,

    descendants
  };
}


/* =========================================================
   CONTAINER DECK STATE
   ========================================================= */

export function normalizeIXIContainerDeckIndex({
  index = 0,
  itemCount = 0
} = {}) {

  const count =
    Math.max(
      0,
      Number(
        itemCount || 0
      )
    );


  if (
    count === 0
  ) {
    return 0;
  }


  const numericIndex =
    Number(
      index || 0
    );


  if (
    !Number.isFinite(
      numericIndex
    )
  ) {
    return 0;
  }


  return Math.min(
    count - 1,

    Math.max(
      0,
      numericIndex
    )
  );
}


export function getIXIContainerDeckState({
  children = [],
  selectedIndex = 0
} = {}) {

  const items =
    safeArray(
      children
    );


  const normalizedIndex =
    normalizeIXIContainerDeckIndex({
      index:
        selectedIndex,

      itemCount:
        items.length
    });


  return {
    itemCount:
      items.length,

    selectedIndex:
      normalizedIndex,

    selectedObject:
      items[
        normalizedIndex
      ] || null,

    hasPrevious:
      items.length > 1,

    hasNext:
      items.length > 1
  };
}


export function getNextIXIContainerDeckIndex({
  selectedIndex = 0,
  itemCount = 0
} = {}) {

  const count =
    Math.max(
      0,
      Number(
        itemCount || 0
      )
    );


  if (
    count <= 1
  ) {
    return 0;
  }


  const current =
    normalizeIXIContainerDeckIndex({
      index:
        selectedIndex,

      itemCount:
        count
    });


  return (
    current + 1
  ) % count;
}


export function getPreviousIXIContainerDeckIndex({
  selectedIndex = 0,
  itemCount = 0
} = {}) {

  const count =
    Math.max(
      0,
      Number(
        itemCount || 0
      )
    );


  if (
    count <= 1
  ) {
    return 0;
  }


  const current =
    normalizeIXIContainerDeckIndex({
      index:
        selectedIndex,

      itemCount:
        count
    );


  return (
    current - 1 + count
  ) % count;
}


/* =========================================================
   WORKSPACE EXPOSURE
   ========================================================= */

/*
 * IMPORTANT:
 *
 * These functions do NOT modify durable
 * containment.
 *
 * BOARD is workspace exposure only.
 *
 * RECALL is also workspace placement
 * behavior unless the caller explicitly
 * invokes an IX-Core relationship command.
 */


export function exposeIXIContainerChildrenToBoard({
  container,
  objects = [],
  moveObjectToBoard
} = {}) {

  if (
    typeof moveObjectToBoard !==
    "function"
  ) {
    return [];
  }


  const children =
    getIXIDirectContainerChildren({
      container,
      objects
    });


  children.forEach(
    child => {

      moveObjectToBoard({
        object:
          child,

        sourceContainer:
          container
      });
    }
  );


  return children;
}


export function exposeIXIContainerChildToBoard({
  container,
  child,
  moveObjectToBoard
} = {}) {

  if (
    !child ||
    typeof moveObjectToBoard !==
      "function"
  ) {
    return null;
  }


  moveObjectToBoard({
    object:
      child,

    sourceContainer:
      container
  });


  return child;
}


/* =========================================================
   RECALL
   ========================================================= */

/*
 * RECALL means:
 *
 * "Bring the Cards associated directly
 * with this container back to this
 * container's working deck."
 *
 * It does NOT manufacture relationships.
 *
 * Durable relationship truth comes from
 * IX-Core.
 */
export function recallIXIContainerChildren({
  container,
  objects = [],
  recallObject
} = {}) {

  if (
    typeof recallObject !==
    "function"
  ) {
    return [];
  }


  const children =
    getIXIDirectContainerChildren({
      container,
      objects
    });


  children.forEach(
    child => {

      recallObject({
        object:
          child,

        destinationContainer:
          container
      });
    }
  );


  return children;
}


/* =========================================================
   DROP VALIDATION
   ========================================================= */

export function validateIXIContainerDrop({
  object,
  destination,
  objects = [],
  destinationCapabilities = {}
} = {}) {

  const sourceId =
    getIXIContainerObjectId(
      object
    );


  const destinationId =
    getIXIContainerObjectId(
      destination
    );


  if (
    !sourceId
  ) {
    return {
      allowed:
        false,

      reason:
        "SOURCE_OBJECT_ID_REQUIRED"
    };
  }


  if (
    !destinationId
  ) {
    return {
      allowed:
        false,

      reason:
        "DESTINATION_OBJECT_ID_REQUIRED"
    };
  }


  if (
    sourceId ===
    destinationId
  ) {
    return {
      allowed:
        false,

      reason:
        "OBJECT_CANNOT_CONTAIN_ITSELF"
    };
  }


  const capabilities =
    safeObject(
      destinationCapabilities
    );


  if (
    !capabilities.canContain &&
    !capabilities.canReceiveDrop
  ) {
    return {
      allowed:
        false,

      reason:
        "DESTINATION_DOES_NOT_ACCEPT_OBJECTS"
    };
  }


  if (
    wouldIXIContainmentCreateCycle({
      object,
      destination,
      objects
    })
  ) {
    return {
      allowed:
        false,

      reason:
        "CONTAINMENT_CYCLE"
    };
  }


  return {
    allowed:
      true,

    reason:
      "OK"
  };
}


/* =========================================================
   CONTAINER RUNTIME MODEL
   ========================================================= */

export function buildIXIContainerRuntimeModel({
  container,
  objects = [],
  selectedIndex = 0
} = {}) {

  const summary =
    getIXIContainerSummary({
      container,
      objects
    });


  const deck =
    getIXIContainerDeckState({
      children:
        summary.directChildren,

      selectedIndex
    });


  return {
    containerId:
      getIXIContainerObjectId(
        container
      ),

    container,

    directChildren:
      summary.directChildren,

    descendants:
      summary.descendants,

    directCount:
      summary.directCount,

    descendantCount:
      summary.descendantCount,

    directValue:
      summary.directValue,

    descendantValue:
      summary.descendantValue,

    deck
  };
}


/* =========================================================
   DEFAULT EXPORT
   ========================================================= */

export default {
  getIXIContainerObjectId,
  getIXIDirectContainerId,

  getIXIDirectContainerChildren,
  getIXIContainerDescendants,
  getIXIContainerAncestry,

  wouldIXIContainmentCreateCycle,

  getIXIObjectValue,
  getIXIContainerSummary,

  normalizeIXIContainerDeckIndex,
  getIXIContainerDeckState,
  getNextIXIContainerDeckIndex,
  getPreviousIXIContainerDeckIndex,

  exposeIXIContainerChildrenToBoard,
  exposeIXIContainerChildToBoard,
  recallIXIContainerChildren,

  validateIXIContainerDrop,

  buildIXIContainerRuntimeModel
};
