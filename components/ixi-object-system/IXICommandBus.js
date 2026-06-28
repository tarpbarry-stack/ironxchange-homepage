import {
  IXI_TRANSACTION_TYPES,
  executeIXIObjectTransaction
} from "./IXIObjectTransactionEngine";

export function runIXICommand({
  command,
  payload = {}
}) {
  return executeIXIObjectTransaction({
    type: command,
    payload
  });
}

function emptyCommandResult({
  ixiCardState,
  machineContainers
}) {
  return {
    nextIxiCardState: ixiCardState,
    nextMachineContainers: machineContainers,
    patchesToPersist: []
  };
}

export const IXI_COMMANDS = {
  moveObject(payload) {
    return runIXICommand({
      command: IXI_TRANSACTION_TYPES.MOVE,
      payload
    });
  },

  moveObjectToPosition(payload) {
    return runIXICommand({
      command: IXI_TRANSACTION_TYPES.MOVE_TO_POSITION,
      payload
    });
  },

  reorderWithinContainer(payload) {
    return runIXICommand({
      command: IXI_TRANSACTION_TYPES.REORDER_WITHIN_CONTAINER,
      payload
    });
  },

  checkoutObject(payload) {
    return runIXICommand({
      command: IXI_TRANSACTION_TYPES.CHECKOUT,
      payload
    });
  },

  checkInObject(payload) {
    return runIXICommand({
      command: IXI_TRANSACTION_TYPES.CHECKIN,
      payload
    });
  },

  bulkMoveOrCheckIn(payload) {
    return runIXICommand({
      command: IXI_TRANSACTION_TYPES.BULK_MOVE_OR_CHECKIN,
      payload
    });
  },

  recoverSellerDeck(payload) {
    return runIXICommand({
      command: IXI_TRANSACTION_TYPES.RECOVER_SELLER_DECK,
      payload
    });
  },

  bulkMoveObjects({
    objectIds = [],
    targetContainer,
    ixiCardState,
    machineContainers
  }) {
    if (!targetContainer) {
      return emptyCommandResult({
        ixiCardState,
        machineContainers
      });
    }

    let result = emptyCommandResult({
      ixiCardState,
      machineContainers
    });

    objectIds
      .map(String)
      .filter(Boolean)
      .forEach(objectId => {
        result = runIXICommand({
          command: IXI_TRANSACTION_TYPES.MOVE,
          payload: {
            objectId,
            targetContainer,
            ixiCardState: result.nextIxiCardState,
            machineContainers: result.nextMachineContainers
          }
        });
      });

    return result;
  },

  sendObjectToFront({
    objectId,
    containerKey = "board",
    ixiCardState,
    machineContainers
  }) {
    const id = String(objectId || "");

    if (!id || !containerKey) {
      return emptyCommandResult({
        ixiCardState,
        machineContainers
      });
    }

    const list = Array.isArray(machineContainers?.[containerKey])
      ? machineContainers[containerKey].map(String)
      : [];

    if (!list.includes(id)) {
      return emptyCommandResult({
        ixiCardState,
        machineContainers
      });
    }

    return {
      nextIxiCardState: ixiCardState,
      nextMachineContainers: {
        ...machineContainers,
        [containerKey]: [
          id,
          ...list.filter(item => item !== id)
        ]
      },
      patchesToPersist: []
    };
  },

  sendObjectToBack({
    objectId,
    containerKey = "board",
    ixiCardState,
    machineContainers
  }) {
    const id = String(objectId || "");

    if (!id || !containerKey) {
      return emptyCommandResult({
        ixiCardState,
        machineContainers
      });
    }

    const list = Array.isArray(machineContainers?.[containerKey])
      ? machineContainers[containerKey].map(String)
      : [];

    if (!list.includes(id)) {
      return emptyCommandResult({
        ixiCardState,
        machineContainers
      });
    }

    return {
      nextIxiCardState: ixiCardState,
      nextMachineContainers: {
        ...machineContainers,
        [containerKey]: [
          ...list.filter(item => item !== id),
          id
        ]
      },
            patchesToPersist: []
    };
  },

  moveObjectToContainerStart({
    objectId,
    containerKey = "board",
    ixiCardState,
    machineContainers
  }) {
    return this.sendObjectToFront({
      objectId,
      containerKey,
      ixiCardState,
      machineContainers
    });
  },

    moveObjectToContainerEnd({
    objectId,
    containerKey = "board",
    ixiCardState,
    machineContainers
  }) {
    return this.sendObjectToBack({
      objectId,
      containerKey,
      ixiCardState,
      machineContainers
    });
  },

  handleRelationshipDrop({
  dragId,
  overId,
  sourceContainer,
  targetContainer,
  ixiCardState,
  machineContainers
}) {
  const id = String(dragId || "");
  const over = String(overId || "");

  if (!id || !over || !targetContainer) {
    return emptyCommandResult({
      ixiCardState,
      machineContainers
    });
  }

  if (
    sourceContainer &&
    targetContainer &&
    sourceContainer === targetContainer &&
    id !== over
  ) {
    const ids = Array.isArray(machineContainers[sourceContainer])
      ? machineContainers[sourceContainer].map(String)
      : [];

    const fromIndex = ids.findIndex(item => item === id);
    const toIndex = ids.findIndex(item => item === over);

    const insertAfter = fromIndex < toIndex;

    return this.reorderWithinContainer({
      containerKey: sourceContainer,
      objectId: id,
      targetId: over,
      insertAfter,
      ixiCardState,
      machineContainers
    });
  }

  if (
    sourceContainer !== "board" &&
    targetContainer === "board" &&
    over &&
    over !== "board" &&
    id !== over
  ) {
    return this.moveObjectToPosition({
      objectId: id,
      targetContainer: "board",
      targetId: over,
      insertAfter: false,
      ixiCardState,
      machineContainers
    });
  }

  if (targetContainer && targetContainer !== sourceContainer) {
    return this.moveObject({
      objectId: id,
      targetContainer,
      ixiCardState,
      machineContainers
    });
  }

  return emptyCommandResult({
    ixiCardState,
    machineContainers
  });
}
};
