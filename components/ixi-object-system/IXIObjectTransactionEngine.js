import {
  createCheckoutRecord,
  returnCheckedOutToParent
} from "./IXILineageEngine";

function toId(value) {
  return String(value || "");
}

function removeIdFromContainers(containers = {}, objectId) {
  const id = toId(objectId);

  return Object.fromEntries(
    Object.entries(containers || {}).map(([key, list]) => [
      key,
      Array.isArray(list)
        ? list.map(String).filter(item => item !== id)
        : []
    ])
  );
}

function addIdToContainer(containers = {}, objectId, targetContainer) {
  const id = toId(objectId);
  const target = toId(targetContainer);

  if (!id || !target) return containers;

  const cleaned = removeIdFromContainers(containers, id);
  const targetList = Array.isArray(cleaned[target])
    ? cleaned[target].map(String)
    : [];

  return {
    ...cleaned,
    [target]: targetList.includes(id)
      ? targetList
      : [...targetList, id]
  };
}

function removeIdFromParentCheckoutList(cardState = {}, parentId, objectId) {
  const pId = toId(parentId);
  const oId = toId(objectId);

  const parentState = cardState[pId] || {};
  const checkedOutMachineIds = Array.isArray(parentState.checkedOutMachineIds)
    ? parentState.checkedOutMachineIds.map(String)
    : [];

  return {
    ...cardState,
    [pId]: {
      ...parentState,
      checkedOutMachineIds: checkedOutMachineIds.filter(id => id !== oId),
      updatedAt: Date.now()
    }
  };
}

function addIdToParentCheckoutList(cardState = {}, parentId, objectId) {
  const pId = toId(parentId);
  const oId = toId(objectId);

  const parentState = cardState[pId] || {};
  const checkedOutMachineIds = Array.isArray(parentState.checkedOutMachineIds)
    ? parentState.checkedOutMachineIds.map(String)
    : [];

  return {
    ...cardState,
    [pId]: {
      ...parentState,
      checkedOutMachineIds: checkedOutMachineIds.includes(oId)
        ? checkedOutMachineIds
        : [...checkedOutMachineIds, oId],
      updatedAt: Date.now()
    }
  };
}

export function checkoutObjectTransaction({
  objectId,
  sourceParentId,
  sourceParentType = "seller-object",
  targetContainer = "board",
  checkoutReason = "checkout",
  ixiCardState = {},
  machineContainers = {}
}) {
  const id = toId(objectId);
  const parentId = toId(sourceParentId);

  if (!id || !parentId) {
    return {
      nextIxiCardState: ixiCardState,
      nextMachineContainers: machineContainers,
      patchesToPersist: []
    };
  }

  const currentObjectState = ixiCardState[id] || {};

  const checkoutRecord = createCheckoutRecord({
    objectId: id,
    sourceParentId: parentId,
    sourceParentType,
    checkoutContainer: targetContainer,
    checkoutReason
  });

  let nextIxiCardState = {
    ...ixiCardState,
    [id]: {
      ...currentObjectState,
      ...checkoutRecord,
      container: targetContainer,
      touched: true,
      updatedAt: Date.now()
    }
  };

  nextIxiCardState = addIdToParentCheckoutList(
    nextIxiCardState,
    parentId,
    id
  );

  const nextMachineContainers = addIdToContainer(
    machineContainers,
    id,
    targetContainer
  );

  return {
    nextIxiCardState,
    nextMachineContainers,
    patchesToPersist: [
      { listingId: id, patch: nextIxiCardState[id] },
      { listingId: parentId, patch: nextIxiCardState[parentId] }
    ]
  };
}

export function checkInObjectTransaction({
  objectId,
  ixiCardState = {},
  machineContainers = {}
}) {
  const id = toId(objectId);
  const objectState = ixiCardState[id] || {};
  const parentId = toId(objectState.sourceParentId);

  if (!id || !parentId || !objectState.checkedOutFromParent) {
    return {
      nextIxiCardState: ixiCardState,
      nextMachineContainers: machineContainers,
      patchesToPersist: []
    };
  }

  let nextIxiCardState = removeIdFromParentCheckoutList(
    ixiCardState,
    parentId,
    id
  );

  nextIxiCardState = {
    ...nextIxiCardState,
    [id]: {
      ...returnCheckedOutToParent(objectState),
      sourceParentId: "",
      sourceParentType: "",
      sourceDeckId: "",
      checkedOutFromParent: false,
      container: "board",
      touched: true,
      updatedAt: Date.now()
    }
  };

  const nextMachineContainers = removeIdFromContainers(
    machineContainers,
    id
  );

  return {
    nextIxiCardState,
    nextMachineContainers,
    patchesToPersist: [
      { listingId: id, patch: nextIxiCardState[id] },
      { listingId: parentId, patch: nextIxiCardState[parentId] }
    ]
  };
}

export function moveObjectTransaction({
  objectId,
  targetContainer,
  ixiCardState = {},
  machineContainers = {}
}) {
  const id = toId(objectId);
  const target = toId(targetContainer);

  if (!id || !target) {
    return {
      nextIxiCardState: ixiCardState,
      nextMachineContainers: machineContainers,
      patchesToPersist: []
    };
  }

  const currentObjectState = ixiCardState[id] || {};

  const nextIxiCardState = {
    ...ixiCardState,
    [id]: {
      ...currentObjectState,
      container: target,
      touched: true,
      updatedAt: Date.now()
    }
  };

  const nextMachineContainers = addIdToContainer(
    machineContainers,
    id,
    target
  );

  return {
    nextIxiCardState,
    nextMachineContainers,
    patchesToPersist: [
      { listingId: id, patch: nextIxiCardState[id] }
    ]
  };
}

export function bulkCheckInTransaction({
  objectIds = [],
  ixiCardState = {},
  machineContainers = {}
}) {
  let nextIxiCardState = { ...ixiCardState };
  let nextMachineContainers = { ...machineContainers };
  const patchesToPersist = [];

  objectIds.map(String).forEach(objectId => {
    const result = checkInObjectTransaction({
      objectId,
      ixiCardState: nextIxiCardState,
      machineContainers: nextMachineContainers
    });

    nextIxiCardState = result.nextIxiCardState;
    nextMachineContainers = result.nextMachineContainers;
    patchesToPersist.push(...result.patchesToPersist);
  });

  return {
    nextIxiCardState,
    nextMachineContainers,
    patchesToPersist
  };
}

export function bulkMoveOrCheckInTransaction({
  objectIds = [],
  targetContainer,
  ixiCardState = {},
  machineContainers = {}
}) {
  let nextIxiCardState = { ...ixiCardState };
  let nextMachineContainers = { ...machineContainers };
  const patchesToPersist = [];

  objectIds.map(String).forEach(objectId => {
    const state = nextIxiCardState[objectId] || {};

    const result =
      targetContainer === "board" &&
      state.checkedOutFromParent &&
      state.sourceParentId
        ? checkInObjectTransaction({
            objectId,
            ixiCardState: nextIxiCardState,
            machineContainers: nextMachineContainers
          })
        : moveObjectTransaction({
            objectId,
            targetContainer,
            ixiCardState: nextIxiCardState,
            machineContainers: nextMachineContainers
          });

    nextIxiCardState = result.nextIxiCardState;
    nextMachineContainers = result.nextMachineContainers;
    patchesToPersist.push(...result.patchesToPersist);
  });

  return {
    nextIxiCardState,
    nextMachineContainers,
    patchesToPersist
  };
}
