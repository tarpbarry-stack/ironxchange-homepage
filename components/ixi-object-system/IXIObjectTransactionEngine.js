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

function addIdToContainerAtPosition(
  containers = {},
  objectId,
  targetContainer,
  targetId,
  insertAfter = false
) {
  const id = toId(objectId);
  const target = toId(targetContainer);
  const anchorId = toId(targetId);

  if (!id || !target || !anchorId) return containers;

  const cleaned = removeIdFromContainers(containers, id);
  const targetList = Array.isArray(cleaned[target])
    ? cleaned[target].map(String)
    : [];

  const anchorIndex = targetList.findIndex(item => item === anchorId);

  if (anchorIndex === -1) {
    return {
      ...cleaned,
      [target]: [...targetList, id]
    };
  }

  const insertIndex = insertAfter ? anchorIndex + 1 : anchorIndex;
  const nextList = [...targetList];

  nextList.splice(insertIndex, 0, id);

  return {
    ...cleaned,
    [target]: nextList
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

export function moveObjectToPositionTransaction({
  objectId,
  targetContainer,
  targetId,
  insertAfter = false,
  ixiCardState = {},
  machineContainers = {}
}) {
  const id = toId(objectId);
  const target = toId(targetContainer);

  if (!id || !target || !targetId) {
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

  const nextMachineContainers = addIdToContainerAtPosition(
    machineContainers,
    id,
    target,
    targetId,
    insertAfter
  );

  return {
    nextIxiCardState,
    nextMachineContainers,
    patchesToPersist: [
      { listingId: id, patch: nextIxiCardState[id] }
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
export function recoverSellerDeckTransaction({
  sellerObject,
  ixiCardState = {},
  machineContainers = {}
}) {
  const sellerId = String(sellerObject?.id || "");
  const machines = Array.isArray(sellerObject?.machines)
    ? sellerObject.machines
    : [];

  if (!sellerId || !machines.length) {
    return {
      nextIxiCardState: ixiCardState,
      nextMachineContainers: machineContainers,
      patchesToPersist: []
    };
  }

  const machineIds = machines
    .map(machine => String(machine?.id?.uuid || machine?.id || ""))
    .filter(Boolean);

  let nextIxiCardState = {
    ...ixiCardState,
    [sellerId]: {
      ...(ixiCardState[sellerId] || {}),
      checkedOutMachineIds: [],
      face: 1,
      updatedAt: Date.now()
    }
  };

  machineIds.forEach(machineId => {
    const currentMachineState = nextIxiCardState[machineId] || {};

    nextIxiCardState[machineId] = {
      ...currentMachineState,
      sourceParentId: "",
      sourceParentType: "",
      sourceDeckId: "",
      checkedOutFromParent: false,
      checkedOutFromSeller: false,
      checkoutContainer: "",
      checkoutReason: "",
      sourceSellerId: "",
      container: "board",
      updatedAt: Date.now()
    };
  });

  const machineIdSet = new Set(machineIds);

  const nextMachineContainers = Object.fromEntries(
    Object.entries(machineContainers || {}).map(([containerKey, ids]) => [
      containerKey,
      Array.isArray(ids)
        ? ids.map(String).filter(id => !machineIdSet.has(id))
        : []
    ])
  );

  const patchesToPersist = [
    {
      listingId: sellerId,
      patch: nextIxiCardState[sellerId]
    },
    ...machineIds.map(machineId => ({
      listingId: machineId,
      patch: nextIxiCardState[machineId]
    }))
  ];

  return {
    nextIxiCardState,
    nextMachineContainers,
    patchesToPersist
  };
}
export const IXI_TRANSACTION_TYPES = {
  CHECKOUT: "CHECKOUT",
  CHECKIN: "CHECKIN",
  MOVE: "MOVE",
  MOVE_TO_POSITION: "MOVE_TO_POSITION",
  BULK_MOVE_OR_CHECKIN: "BULK_MOVE_OR_CHECKIN",
  RECOVER_SELLER_DECK: "RECOVER_SELLER_DECK"
};

export function executeIXIObjectTransaction({
  type,
  payload = {}
}) {
  if (type === IXI_TRANSACTION_TYPES.CHECKOUT) {
    return checkoutObjectTransaction(payload);
  }

  if (type === IXI_TRANSACTION_TYPES.CHECKIN) {
    return checkInObjectTransaction(payload);
  }

  if (type === IXI_TRANSACTION_TYPES.MOVE) {
    return moveObjectTransaction(payload);
  }

  if (type === IXI_TRANSACTION_TYPES.MOVE_TO_POSITION) {
    return moveObjectToPositionTransaction(payload);
  }

  if (type === IXI_TRANSACTION_TYPES.BULK_MOVE_OR_CHECKIN) {
    return bulkMoveOrCheckInTransaction(payload);
  }

  if (type === IXI_TRANSACTION_TYPES.RECOVER_SELLER_DECK) {
    return recoverSellerDeckTransaction(payload);
  }

  console.warn("IXI UNKNOWN TRANSACTION TYPE", type);

  return {
    nextIxiCardState: payload.ixiCardState || {},
    nextMachineContainers: payload.machineContainers || {},
    patchesToPersist: []
  };
}
