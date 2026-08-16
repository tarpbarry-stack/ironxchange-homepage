import {
  useMemo
} from "react";

import {
  getListingId
} from "../../../lib/listingFormatters";

import {
  resolveWorkspaceObjects
} from "../../ixi-chassis/IXIWorkspacePlacementEngine";


function cleanId(value) {
  return String(value ?? "").trim();
}


function getMosObjectId(object = {}) {
  return cleanId(
    object?.objectId ||
    object?.id?.uuid ||
    object?.id
  );
}


export default function useIXIAosWorkspaceRegistry({
  workspaceListings = [],
  aosObjects = [],
  workspaceSystemIndexes = [],
  equipmentWorkspaceIndex = null,

  workspacePlacements = {},
  visibleSavedListings = []
}) {

  const systemIndexIds =
    useMemo(
      () => new Set(
        (workspaceSystemIndexes || [])
          .map(index =>
            cleanId(
              index?.objectId
            )
          )
          .filter(Boolean)
      ),
      [workspaceSystemIndexes]
    );


  const machineIds =
    useMemo(
      () => new Set(
        (workspaceListings || [])
          .map(item =>
            cleanId(
              getListingId(item)
            )
          )
          .filter(Boolean)
      ),
      [workspaceListings]
    );


  /* =========================================================
     UNIVERSAL AOS WORKSPACE OBJECT REGISTRY

     Identity is source-driven:

     - MOS object identity comes from objectId.
     - IronXchange machine identity comes from listing identity.
     - System Index presentation comes from the assembled
       System Index collection.

     We do NOT inspect business nouns or objectType to decide
     whether something deserves to exist in the workspace.
     ========================================================= */
  const objectRegistry =
    useMemo(() => {
      const registry =
        new Map();


      /* Durable MOS objects. */
      (aosObjects || []).forEach(
        object => {
          const objectId =
            getMosObjectId(object);

          if (!objectId) {
            return;
          }

          /*
           * System Index presentation is registered below.
           * Avoid two records for the same stable objectId.
           */
          if (
            systemIndexIds.has(
              objectId
            )
          ) {
            return;
          }

          registry.set(
            objectId,
            object
          );
        }
      );


      /* IronXchange machines/listings. */
      (workspaceListings || []).forEach(
        item => {
          const id =
            cleanId(
              getListingId(item)
            );

          if (!id) {
            return;
          }

          registry.set(
            id,
            item
          );
        }
      );


      /*
       * System Index presentation objects.
       *
       * Equipment alone receives a workspace-deck projection;
       * canonical Equipment membership remains owned by the
       * IronXchange adapter.
       */
      (workspaceSystemIndexes || [])
        .forEach(index => {
          const objectId =
            cleanId(
              index?.objectId
            );

          if (!objectId) {
            return;
          }

          const isEquipmentAdapter =
            index?.metadata?.adapterId ===
              "ixi-owned-equipment" ||
            index?.indexId ===
              "equipment";

          const workspaceIndex =
            isEquipmentAdapter &&
            equipmentWorkspaceIndex
              ? equipmentWorkspaceIndex
              : index;

          registry.set(
            objectId,
            {
              ...workspaceIndex,
              objectId
            }
          );
        });


      return registry;
    }, [
      workspaceListings,
      aosObjects,
      workspaceSystemIndexes,
      equipmentWorkspaceIndex,
      systemIndexIds
    ]);


  /* =========================================================
     BOARD PROJECTION

     Placement determines Board membership.
     Machine search/filter state applies ONLY to machines from
     the IronXchange listing universe. MOS objects and System
     Indexes are not accidentally hidden by machine filters.
     ========================================================= */
  const boardItems =
    useMemo(() => {
      const orderedObjects =
        resolveWorkspaceObjects({
          placements:
            workspacePlacements,

          surfaceId:
            "board",

          objectRegistry
        });


      const visibleMachineIds =
        new Set(
          (visibleSavedListings || [])
            .map(item =>
              cleanId(
                getListingId(item)
              )
            )
            .filter(Boolean)
        );


      return orderedObjects.filter(
        item => {
          const listingId =
            cleanId(
              getListingId(item)
            );

          const isMachine =
            listingId &&
            machineIds.has(listingId);

          if (!isMachine) {
            return true;
          }

          return visibleMachineIds.has(
            listingId
          );
        }
      );
    }, [
      workspacePlacements,
      objectRegistry,
      visibleSavedListings,
      machineIds
    ]);


  return {
    objectRegistry,
    boardItems
  };
}
