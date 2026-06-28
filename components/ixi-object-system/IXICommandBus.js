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
  }
};
