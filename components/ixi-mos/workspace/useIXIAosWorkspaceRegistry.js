import {
  useMemo
} from "react";

import {
  getListingId
} from "../../../lib/listingFormatters";

import {
  getIXIAosSystemAdapter
} from "../../../lib/mos/IXIAosSystemAdapterRegistry";

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


function isActiveMosObject(object = {}) {
  const status =
    String(object?.status || "")
      .trim()
      .toLowerCase();

  return ![
    "archived",
    "deleted",
    "soft-deleted"
  ].includes(status);
}


function buildDirectChildrenMap(
  aosObjects = []
) {
  const childrenByParent =
    new Map();

  (aosObjects || [])
    .filter(isActiveMosObject)
    .forEach(object => {
      const parentId =
        cleanId(
          object?.directContainerId
        );

      const objectId =
        getMosObjectId(object);

      if (
        !parentId ||
        !objectId ||
        parentId === objectId
      ) {
        return;
      }

      if (
        !childrenByParent.has(
          parentId
        )
      ) {
        childrenByParent.set(
          parentId,
          []
        );
      }

      childrenByParent
        .get(parentId)
        .push(object);
    });

  return childrenByParent;
}


function buildRelatedObjectsMap(
  aosObjects = [],
  relationships = []
) {
  const objectsById = new Map(
    (aosObjects || [])
      .filter(isActiveMosObject)
      .map(object => [getMosObjectId(object), object])
      .filter(([objectId]) => Boolean(objectId))
  );
  const relatedByObject = new Map();

  (relationships || [])
    .filter(relationship =>
      String(relationship?.status || "active").toLowerCase() === "active"
    )
    .forEach(relationship => {
      const sourceId = cleanId(relationship?.sourceObjectId);
      const targetId = cleanId(relationship?.targetObjectId);
      const sourceObject = objectsById.get(sourceId);
      const targetObject = objectsById.get(targetId);

      if (!sourceObject || !targetObject || sourceId === targetId) return;
      if (!relatedByObject.has(sourceId)) relatedByObject.set(sourceId, []);
      if (!relatedByObject.has(targetId)) relatedByObject.set(targetId, []);

      relatedByObject.get(sourceId).push(targetObject);
      relatedByObject.get(targetId).push(sourceObject);
    });

  return relatedByObject;
}


export default function useIXIAosWorkspaceRegistry({
  workspaceListings = [],
  aosObjects = [],
  relationships = [],
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


  const directChildrenByParent =
    useMemo(
      () =>
        buildDirectChildrenMap(
          aosObjects
        ),
      [aosObjects]
    );

  const relatedObjectsByObject =
    useMemo(
      () => buildRelatedObjectsMap(aosObjects, relationships),
      [aosObjects, relationships]
    );


  /* =========================================================
     UNIVERSAL AOS WORKSPACE OBJECT REGISTRY

     Identity is source-driven:

     - MOS object identity comes from objectId.
     - IronXchange machine identity comes from listing identity.
     - IXI system adapters resolve from the central adapter registry.
     - System Index presentation comes from assembled index records.

     User-defined relationships are symmetric for recall: either
     endpoint can recall the other. Legacy directContainerId children
     remain visible during migration but are not the new authority.
     ========================================================= */
  const objectRegistry =
    useMemo(() => {
      const registry =
        new Map();


      /* Durable MOS objects. */
      (aosObjects || [])
        .filter(isActiveMosObject)
        .forEach(object => {
          const objectId =
            getMosObjectId(object);

          if (!objectId) {
            return;
          }

          if (
            systemIndexIds.has(
              objectId
            )
          ) {
            return;
          }

          registry.set(
            objectId,
            {
              ...object,

              items: Array.from(new Map([
                ...(directChildrenByParent.get(objectId) || []),
                ...(relatedObjectsByObject.get(objectId) || [])
              ].map(item => [getMosObjectId(item), item])).values())
            }
          );
        });


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


      /* System Index presentation objects. */
      (workspaceSystemIndexes || [])
        .forEach(index => {
          const objectId =
            cleanId(
              index?.objectId
            );

          if (!objectId) {
            return;
          }

          const adapter =
            getIXIAosSystemAdapter(
              index
            );

          const workspaceIndex =
            adapter?.adapterId ===
              "ixi-owned-equipment" &&
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
      systemIndexIds,
      directChildrenByParent,
      relatedObjectsByObject
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
