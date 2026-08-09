import {
  useMemo
} from "react";

import {
  getListingId
} from "../../../lib/listingFormatters";

import {
  resolveWorkspaceObjects
} from "../../ixi-chassis/IXIWorkspacePlacementEngine";


export default function useIXIAosWorkspaceRegistry({
  workspaceListings = [],
  aosObjects = [],
  workspaceSystemIndexes = [],
  equipmentWorkspaceIndex = null,

  workspacePlacements = {},
  visibleSavedListings = []
}) {

  /*
   * =========================================================
   * UNIVERSAL AOS WORKSPACE OBJECT REGISTRY
   * =========================================================
   *
   * This registry answers:
   *
   * workspace objectId
   *        ↓
   * actual object
   *
   * It can contain:
   *
   * Sharetribe machine/listing objects
   * persisted MOS objects
   * System Index objects
   *
   * It does NOT determine canonical MOS
   * containment or relationships.
   */
  const objectRegistry =
    useMemo(() => {
      const registry =
        new Map();


      /*
       * Durable MOS workspace objects.
       *
       * Existing machines intentionally
       * stay on their proven listing path.
       *
       * System Indexes are registered
       * separately below because their
       * workspace projection may carry
       * additional presentation state.
       */
      (aosObjects || []).forEach(
        object => {
          const objectType =
            String(
              object?.objectType ||
              ""
            )
              .trim()
              .toLowerCase();

          if (
            !objectType ||
            objectType ===
              "system-index" ||
            objectType ===
              "machine"
          ) {
            return;
          }

          const objectId =
            String(
              object?.objectId ||
              object?.id ||
              ""
            );

          if (!objectId) {
            return;
          }

          registry.set(
            objectId,
            object
          );
        }
      );


      /*
       * Existing IronXchange
       * machine/listing objects.
       */
      (workspaceListings || []).forEach(
        item => {
          const id =
            String(
              getListingId(item) ||
              ""
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
       * System Index workspace objects.
       *
       * Equipment uses its working
       * workspace projection here rather
       * than mutating canonical Equipment
       * membership.
       */
      (
        workspaceSystemIndexes ||
        []
      ).forEach(index => {
        const objectId =
          String(
            index?.objectId ||
            ""
          );

        if (!objectId) {
          return;
        }

        const workspaceIndex =
          index?.indexId ===
            "equipment" &&
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
      equipmentWorkspaceIndex
    ]);


  /*
   * =========================================================
   * BOARD PROJECTION
   * =========================================================
   *
   * Workspace placement determines which
   * object IDs currently belong on Board.
   *
   * This function resolves those IDs back
   * into actual objects.
   *
   * IMPORTANT:
   *
   * This is workspace presentation only.
   * It does not determine MOS containment.
   */
  const boardItems =
    useMemo(() => {
      const orderedObjects =
        resolveWorkspaceObjects({
          placements:
            workspacePlacements,

          surfaceId:
            "board",

          objectRegistry:
            objectRegistry
        });


      /*
       * Existing machine filtering/search
       * remains intact.
       *
       * System Indexes remain structural
       * Board objects and are therefore not
       * removed by machine filtering.
       *
       * We are intentionally preserving
       * CURRENT behavior during extraction.
       *
       * Location/MOS rendering behavior can
       * be expanded here after this extraction
       * passes regression testing.
       */
    const visibleMachineIds =
  new Set(
    (
      visibleSavedListings ||
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

return orderedObjects.filter(
  item => {
    const objectType =
      String(
        item?.objectType ||
        ""
      )
        .trim()
        .toLowerCase();

    /*
     * Structural and durable MOS
     * objects are workspace objects
     * in their own right.
     *
     * Their Board visibility is
     * determined by workspace placement,
     * not by machine search/filter state.
     */
    if (
      objectType &&
      objectType !== "machine"
    ) {
      return true;
    }

    /*
     * Existing IronXchange machines
     * retain their proven Marketplace /
     * inventory filtering behavior.
     */
    const id =
      String(
        getListingId(item) ||
        ""
      );

    return (
      visibleMachineIds.has(id)
    );
  }
);
    }, [
      workspacePlacements,
      objectRegistry,
      visibleSavedListings
    ]);


  return {
    objectRegistry,
    boardItems
  };
}
