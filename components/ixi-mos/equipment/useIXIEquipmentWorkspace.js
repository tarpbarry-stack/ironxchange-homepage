import {
  getListingId
} from "../../../lib/listingFormatters";

import {
  IXI_COMMANDS
} from "../../ixi-object-system/IXICommandBus";


export default function useIXIEquipmentWorkspace({
  equipmentIndex = null,

  machineContainers = {},
  ixiCardState = {},

  executeIXITransaction,
  onSummonObject = null,
  resolveCanonicalObjectId = value => String(value ?? "").trim()
}) {

  function executeWithSummonedContext(result, objectIds = []) {
    const completion = executeIXITransaction?.(result);
    if (typeof onSummonObject === "function") {
      void Promise.resolve(completion).then(() =>
        Promise.all(objectIds.map(objectId => onSummonObject(objectId)))
      ).catch(() => null);
    }
    return completion;
  }

  function exposeEquipmentMachineToBoard(
    machine
  ) {
    const machineId = resolveCanonicalObjectId(
      machine?.objectId || getListingId(machine)
    );

    if (!machineId) {
      return;
    }

    const result =
      IXI_COMMANDS.moveObject({
        objectId:
          machineId,

        targetContainer:
          "board",

        ixiCardState,

        machineContainers
      });

    /*
     * Equipment OUT is an open operation, not a request to resume a
     * previously persisted face. Always present the current Inventory
     * card on Face 1 when it reaches the AOS board. Otherwise an old
     * Face 2 preference makes the machine appear as the legacy
     * LAUNCH / VIEW / PAUSE / DELETE control surface.
     */
    const faceOneState = {
      ...(result.nextIxiCardState || {}),
      [machineId]: {
        ...(result.nextIxiCardState?.[machineId] || {}),
        face: 1
      }
    };

    const faceOneResult = {
      ...result,
      nextIxiCardState: faceOneState,
      patchesToPersist: (result.patchesToPersist || []).map(entry =>
        String(entry?.listingId || "") === machineId
          ? {
              ...entry,
              patch: {
                ...(entry.patch || {}),
                face: 1
              }
            }
          : entry
      )
    };

    executeWithSummonedContext(faceOneResult, [machineId]);
  }


  function returnMachineToEquipment(
    machineOrId
  ) {
    const machineId =
      typeof machineOrId ===
        "object"
        ? resolveCanonicalObjectId(
            machineOrId?.objectId || getListingId(machineOrId)
          )
        : resolveCanonicalObjectId(machineOrId);

    if (!machineId) {
      return;
    }

    const result =
      IXI_COMMANDS.moveObject({
        objectId:
          machineId,

        targetContainer:
          "indexEquipment",

        ixiCardState,

        machineContainers
      });

    executeWithSummonedContext(result, [machineId]);
  }


  function exposeAllEquipmentToBoard() {
    const equipmentIds =
      Array.isArray(
        machineContainers
          .indexEquipment
      )
        ? machineContainers
            .indexEquipment
            .map(String)
        : [];

    if (!equipmentIds.length) {
      return;
    }

    const result =
      IXI_COMMANDS
        .bulkMoveObjects({
          objectIds:
            equipmentIds,

          targetContainer:
            "board",

          ixiCardState,

          machineContainers
        });

    executeWithSummonedContext(result, equipmentIds);
  }


  function returnAllEquipmentHome() {
    const equipmentMachineIds =
      new Set(
        (
          equipmentIndex?.items ||
          []
        )
          .map(item => resolveCanonicalObjectId(
            item?.objectId || getListingId(item) || item?.passportId
          ))
          .filter(Boolean)
      );

    if (
      !equipmentMachineIds.size
    ) {
      return;
    }

    const exposedIds =
      Object.entries(
        machineContainers
      )
        .filter(
          ([containerKey]) =>
            containerKey !==
            "indexEquipment"
        )
        .flatMap(
          ([, ids]) =>
            Array.isArray(ids)
              ? ids
              : []
        )
        .map(String)
        .filter(id =>
          equipmentMachineIds.has(
            id
          )
        );

    if (!exposedIds.length) {
      return;
    }

    const result =
      IXI_COMMANDS
        .bulkMoveObjects({
          objectIds:
            exposedIds,

          targetContainer:
            "indexEquipment",

          ixiCardState,

          machineContainers
        });

    executeWithSummonedContext(result, exposedIds);
  }


  return {
    exposeEquipmentMachineToBoard,

    returnMachineToEquipment,

    exposeAllEquipmentToBoard,

    returnAllEquipmentHome
  };
}
