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
  }
};
