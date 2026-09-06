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

  executeIXITransaction
}) {

  function exposeEquipmentMachineToBoard(
    machine
  ) {
    const machineId =
      String(
        getListingId(machine) ||
        ""
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

    executeIXITransaction?.(
      faceOneResult
    );
  }


  function returnMachineToEquipment(
    machineOrId
  ) {
    const machineId =
      typeof machineOrId ===
        "object"
        ? String(
            getListingId(
              machineOrId
            ) || ""
          )
        : String(
            machineOrId || ""
          );

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

    executeIXITransaction?.(
      result
    );
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

    executeIXITransaction?.(
      result
    );
  }


  function returnAllEquipmentHome() {
    const equipmentMachineIds =
      new Set(
        (
          equipmentIndex?.items ||
          []
        )
          .map(item =>
            String(
              getListingId(item) ||
              ""
            )
          )
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

    executeIXITransaction?.(
      result
    );
  }


  return {
    exposeEquipmentMachineToBoard,

    returnMachineToEquipment,

    exposeAllEquipmentToBoard,

    returnAllEquipmentHome
  };
}
