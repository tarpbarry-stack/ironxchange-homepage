import {
  THEATER_RECEPTOR_KEYS,
  sanitizeTheaterContainers
} from "../../lib/ixiTheaterQueue";

import {
  IXI_TRANSACTION_TYPES,
  executeIXIObjectTransaction
} from "./IXIObjectTransactionEngine";

const THEATER_CONTAINER_KEYS = ["rail", ...THEATER_RECEPTOR_KEYS];

function emptyTheaterResult(theaterContainers) {
  return {
    nextTheaterContainers: sanitizeTheaterContainers(theaterContainers || {})
  };
}

function cleanTheaterContainers(containers = {}) {
  const next = {};

  THEATER_CONTAINER_KEYS.forEach(key => {
    const seen = new Set();

    next[key] = (containers[key] || [])
      .map(id => String(id))
      .filter(id => {
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
  });

  return sanitizeTheaterContainers(next);
}

function removeIdFromAllTheaterContainers(containers = {}, objectId) {
  const id = String(objectId || "");
  const next = cleanTheaterContainers(containers);

  THEATER_CONTAINER_KEYS.forEach(key => {
    next[key] = (next[key] || []).filter(item => String(item) !== id);
  });

  return next;
}

function getTheaterSourceContainer(containers = {}, objectId) {
  const id = String(objectId || "");

  return THEATER_CONTAINER_KEYS.find(key =>
    (containers[key] || []).some(item => String(item) === id)
  );
}

function moveTheaterObjectToContainer({
  objectId,
  targetContainer,
  targetId = "",
  insertAfter = false,
  theaterContainers
}) {
  const id = String(objectId || "");
  const target = String(targetContainer || "");
  const over = String(targetId || "");

  if (!id || !THEATER_CONTAINER_KEYS.includes(target)) {
    return emptyTheaterResult(theaterContainers);
  }

  const cleaned = removeIdFromAllTheaterContainers(theaterContainers, id);
  const targetList = [...(cleaned[target] || [])].filter(
    item => String(item) !== id
  );

  const overIndex = targetList.findIndex(item => String(item) === over);

  if (overIndex >= 0) {
    targetList.splice(insertAfter ? overIndex + 1 : overIndex, 0, id);
  } else {
    targetList.push(id);
  }

  return {
    nextTheaterContainers: cleanTheaterContainers({
      ...cleaned,
      [target]: targetList
    })
  };
}

export const IXI_THEATER_COMMANDS = {
  moveToRail({
    objectId,
    targetId = "",
    insertAfter = false,
    theaterContainers
  }) {
    return moveTheaterObjectToContainer({
      objectId,
      targetContainer: "rail",
      targetId,
      insertAfter,
      theaterContainers
    });
  },

  moveToStack({
    objectId,
    stackKey,
    targetId = "",
    insertAfter = false,
    theaterContainers
  }) {
    return moveTheaterObjectToContainer({
      objectId,
      targetContainer: stackKey,
      targetId,
      insertAfter,
      theaterContainers
    });
  },

  loadStackToRail({
    stackKey,
    theaterContainers
  }) {
    const source = String(stackKey || "");

    if (!THEATER_RECEPTOR_KEYS.includes(source)) {
      return emptyTheaterResult(theaterContainers);
    }

    const current = cleanTheaterContainers(theaterContainers);
    const stackIds = current[source] || [];

    if (!stackIds.length) {
      return emptyTheaterResult(current);
    }

    return {
      nextTheaterContainers: cleanTheaterContainers({
        ...current,
        rail: [...(current.rail || []), ...stackIds],
        [source]: []
      })
    };
  },

  unloadRailToStack({
    stackKey,
    theaterContainers
  }) {
    const target =
      THEATER_RECEPTOR_KEYS.includes(String(stackKey || ""))
        ? String(stackKey)
        : "";

    const current = cleanTheaterContainers(theaterContainers);
    const railIds = current.rail || [];

    if (!railIds.length) {
      return emptyTheaterResult(current);
    }

    const destination =
      target ||
      THEATER_RECEPTOR_KEYS.find(key => !(current[key] || []).length) ||
      "stack1";

    return {
      nextTheaterContainers: cleanTheaterContainers({
        ...current,
        [destination]: [...(current[destination] || []), ...railIds],
        rail: []
      })
    };
  },

  rotateStack({
    stackKey,
    theaterContainers
  }) {
    const key = String(stackKey || "");

    if (!THEATER_RECEPTOR_KEYS.includes(key)) {
      return emptyTheaterResult(theaterContainers);
    }

    const current = cleanTheaterContainers(theaterContainers);
    const stackIds = current[key] || [];

    if (stackIds.length <= 1) {
      return emptyTheaterResult(current);
    }

    return {
      nextTheaterContainers: cleanTheaterContainers({
        ...current,
        [key]: [...stackIds.slice(1), stackIds[0]]
      })
    };
  },

  clearStack({
    stackKey,
    theaterContainers
  }) {
    const key = String(stackKey || "");

    if (!THEATER_RECEPTOR_KEYS.includes(key)) {
      return emptyTheaterResult(theaterContainers);
    }

    return {
      nextTheaterContainers: cleanTheaterContainers({
        ...theaterContainers,
        [key]: []
      })
    };
  },

  handleTheaterDrop({
    dragId,
    overId,
    overData = {},
    theaterContainers
  }) {
    const id = String(dragId || "");
    const over = String(overId || "");
    const targetId = String(overData.targetId || over || "");

    if (!id || !over || id === over) {
      return emptyTheaterResult(theaterContainers);
    }

    const current = cleanTheaterContainers(theaterContainers);
    const sourceContainer = getTheaterSourceContainer(current, id);

    if (!sourceContainer) {
      return emptyTheaterResult(current);
    }

    const explicitTargetContainer =
      overData.containerId ||
      overData.sortable?.containerId ||
      "";

    const isOverRailCard = (current.rail || []).some(
      item => String(item) === targetId
    );

    const targetContainer =
      explicitTargetContainer ||
      (THEATER_RECEPTOR_KEYS.includes(over) ? over : "") ||
      (isOverRailCard ? "rail" : "");

    if (!THEATER_CONTAINER_KEYS.includes(targetContainer)) {
      return emptyTheaterResult(current);
    }

    const sourceList = current[sourceContainer] || [];
    const fromIndex = sourceList.findIndex(item => String(item) === id);
    const toIndex = sourceList.findIndex(item => String(item) === targetId);

    const insertAfter =
      sourceContainer === targetContainer &&
      fromIndex >= 0 &&
      toIndex >= 0 &&
      fromIndex < toIndex;

    return moveTheaterObjectToContainer({
      objectId: id,
      targetContainer,
      targetId,
      insertAfter,
      theaterContainers: current
    });
  }
};
