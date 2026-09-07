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
  getCanonicalAosPassportId
} from "../../../lib/mos/ixiAosPassportPresentation.mjs";

import {
  resolveWorkspaceObjects
} from "../../ixi-chassis/IXIWorkspacePlacementEngine";

import {
  projectAosContainerChildren
} from "./IXIAosWorkspaceContainerProjection.mjs";


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
  aosObjects = [],
  workspaceListings = []
) {
  const listingsById = new Map(
    (workspaceListings || [])
      .map(listing => [cleanId(getListingId(listing)), listing])
      .filter(([listingId]) => Boolean(listingId))
  );
  const listingsByPassport = new Map();

  (workspaceListings || []).forEach(listing => {
    const passportId = getCanonicalAosPassportId(listing);
    if (!passportId || listingsByPassport.has(passportId)) return;
    listingsByPassport.set(passportId, listing);
  });
  const workspacePresentation = object => {
    const sourceListingId = cleanId(object?.metadata?.sourceListingId) ||
      cleanId((Array.isArray(object?.identities) ? object.identities : [])
        .find(identity =>
          cleanId(identity?.sourceType) === "sharetribe-listing"
        )?.sourceId);
    const passportId = getCanonicalAosPassportId(object);

    return listingsById.get(sourceListingId) ||
      listingsByPassport.get(passportId) ||
      object;
  };
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
        .push(workspacePresentation(object));
    });

  return childrenByParent;
}


function buildRelationshipChildrenMap(
  aosObjects = [],
  relationships = [],
  workspaceListings = []
) {
  const objectsById = new Map(
    (aosObjects || [])
      .filter(isActiveMosObject)
      .map(object => [getMosObjectId(object), object])
      .filter(([objectId]) => Boolean(objectId))
  );
  const listingsById = new Map(
    (workspaceListings || [])
      .map(listing => [cleanId(getListingId(listing)), listing])
      .filter(([listingId]) => Boolean(listingId))
  );
  const listingsByPassport = new Map();

  (workspaceListings || []).forEach(listing => {
    const passportId = getCanonicalAosPassportId(listing);
    if (!passportId || listingsByPassport.has(passportId)) return;
    listingsByPassport.set(passportId, listing);
  });
  const workspacePresentation = object => {
    const sourceListingId = cleanId(object?.metadata?.sourceListingId) ||
      cleanId((Array.isArray(object?.identities) ? object.identities : [])
        .find(identity =>
          cleanId(identity?.sourceType) === "sharetribe-listing"
        )?.sourceId);
    const passportId = getCanonicalAosPassportId(object);

    return listingsById.get(sourceListingId) ||
      listingsByPassport.get(passportId) ||
      object;
  };
  const childrenByParent = new Map();

  (relationships || [])
    .filter(relationship =>
      cleanId(relationship?.status || "active").toLowerCase() === "active" &&
      cleanId(
        relationship?.relationshipKey ||
        relationship?.relationshipType ||
        relationship?.relationshipLabel
      ).toLowerCase() === "contains"
    )
    .forEach(relationship => {
      const parentId = cleanId(relationship?.sourceObjectId);
      const childId = cleanId(relationship?.targetObjectId);
      const child = objectsById.get(childId);

      if (!parentId || !child || parentId === childId) return;
      if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
      childrenByParent.get(parentId).push(workspacePresentation(child));
    });

  return childrenByParent;
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
          aosObjects,
          workspaceListings
        ),
      [aosObjects, workspaceListings]
    );

  const relationshipChildrenByParent =
    useMemo(
      () => buildRelationshipChildrenMap(
        aosObjects,
        relationships,
        workspaceListings
      ),
      [aosObjects, relationships, workspaceListings]
    );

  /* =========================================================
     UNIVERSAL AOS WORKSPACE OBJECT REGISTRY

     Identity is source-driven:

     - MOS object identity comes from objectId.
     - IronXchange machine identity comes from listing identity.
     - IXI system adapters resolve from the central adapter registry.
     - System Index presentation comes from assembled index records.

     New container membership is a non-exclusive `contains`
     relationship. Legacy directContainerId children remain readable
     during migration, but no workspace gesture creates that state.
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

              /*
               * UNIVERSAL AOS OBJECT LAW
               *
               * Every canonical AOS Object may be both a child and a
               * parent. IX-Core persists this contract; the workspace
               * also normalizes legacy readbacks so an older record can
               * never lose its receiving surface while it is repaired.
               */
              capabilities: {
                ...(object?.capabilities || {}),
                canContain: true,
                canCreate: true
              },

              items: Array.from(new Map([
                ...(relationshipChildrenByParent.get(objectId) || []),
                ...(directChildrenByParent.get(objectId) || [])
              ].map(item => [
                cleanId(getListingId(item) || getMosObjectId(item)),
                item
              ])).values())
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

      /* Keep the receiving rail synchronized with the accepted visual drop
       * while IX-Core confirms the non-exclusive relationship. */
      [...registry.entries()].forEach(([objectId, object]) => {
        if (!cleanId(object?.entityId) || systemIndexIds.has(objectId)) return;

        const placedChildren = resolveWorkspaceObjects({
          placements: workspacePlacements,
          surfaceId: `container:${objectId}`,
          objectRegistry: registry
        });

        registry.set(objectId, {
          ...object,
          items: projectAosContainerChildren({
            canonicalChildren: object?.items || [],
            placedChildren
          })
        });
      });


      return registry;
    }, [
      workspaceListings,
      aosObjects,
      workspaceSystemIndexes,
      equipmentWorkspaceIndex,
      systemIndexIds,
      directChildrenByParent,
      relationshipChildrenByParent,
      workspacePlacements
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
