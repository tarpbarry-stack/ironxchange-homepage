import { useMemo } from "react";

import { getListingId } from "../../../lib/listingFormatters";
import {
  buildAosCanonicalAdmission,
  canonicalizeAosPlacementReferences,
  createAosObjectPreviewReference,
  preserveAosOwnedListingPresentations,
  shouldRegisterAosWorkspaceObject
} from "../../../lib/mos/ixiAosCanonicalAdmission.mjs";
import {
  getAosCorroboratedLegacyMembershipObjectIds,
  getAosMembershipObjectIds,
  getAosRailProjectionObjectIds
} from "../../../lib/mos/IXIAosMembershipBridge.mjs";
import { resolveWorkspaceObjects } from "../../ixi-chassis/IXIWorkspacePlacementEngine";
import {
  isIXIAosWorkspaceVisibleAdapter
} from "../../../lib/mos/IXIAosSystemAdapterRegistry";
import {
  evaluateAosSystemIndexMembership,
  isExplicitAosSystemIndexObject
} from "../../../lib/mos/IXIAosSystemIndexMembershipPolicy";
import {
  excludePeerSystemIndexMembers
} from "./IXIAosSystemIndexPlacement.mjs";

function clean(value) {
  return String(value ?? "").trim();
}

function uniqueObjectIds(values = []) {
  return [...new Set(values.map(clean).filter(Boolean))];
}

function indexMemberObjectIds(index = {}, admission) {
  const directReferences = [
    ...(Array.isArray(index?.itemObjectIds) ? index.itemObjectIds : []),
    ...(Array.isArray(index?.memberObjectIds) ? index.memberObjectIds : [])
  ];
  const itemReferences = (Array.isArray(index?.items) ? index.items : []).map(item =>
    item?.objectId || getListingId(item) || item?.passportId
  );

  return uniqueObjectIds([...directReferences, ...itemReferences]
    .map(reference => admission.resolveObjectId(reference)));
}

function previewsForObjectIds(objectIds, admission) {
  return uniqueObjectIds(objectIds)
    .map(objectId => createAosObjectPreviewReference(objectId, admission))
    .filter(Boolean);
}

export default function useIXIAosWorkspaceRegistry({
  canonicalAdmission = null,
  workspaceListings = [],
  aosObjects = [],
  relationships = [],
  railProjections = {},
  workspaceSystemIndexes = [],
  equipmentWorkspaceIndex = null,
  workspacePlacements = {},
  visibleSavedListings = []
}) {
  const admission = useMemo(
    () => canonicalAdmission || buildAosCanonicalAdmission({ aosObjects, workspaceListings }),
    [canonicalAdmission, aosObjects, workspaceListings]
  );

  const canonicalWorkspacePlacements = useMemo(
    () => canonicalizeAosPlacementReferences(workspacePlacements, admission),
    [workspacePlacements, admission]
  );

  const systemIndexesByObjectId = useMemo(() => {
    const map = new Map();
    (workspaceSystemIndexes || []).forEach(index => {
      const objectId = admission.resolveObjectId(index?.objectId);
      if (objectId) map.set(objectId, index);
    });
    return map;
  }, [workspaceSystemIndexes, admission]);

  const objectRegistry = useMemo(() => {
    const registry = new Map();

    for (const [objectId, admittedObject] of admission.objectsById) {
      const index = systemIndexesByObjectId.get(objectId);
      const projectedIndex = index?.metadata?.adapterId === "ixi-owned-equipment" && equipmentWorkspaceIndex
        ? equipmentWorkspaceIndex
        : index;
      if (!shouldRegisterAosWorkspaceObject({
        admittedObject,
        projectedIndex,
        workspaceVisible: isIXIAosWorkspaceVisibleAdapter(admittedObject)
      })) continue;
      const relationshipIds = getAosMembershipObjectIds({
        parentObjectId: objectId,
        relationships,
        admission
      });
      const legacyRelationshipIds = getAosCorroboratedLegacyMembershipObjectIds({
        parentObjectId: objectId,
        relationships,
        admission
      });
      const railProjectionIds = getAosRailProjectionObjectIds({
        railOwnerObjectId: objectId,
        railProjections,
        admission
      });
      const systemIndexIds = projectedIndex
        ? indexMemberObjectIds(projectedIndex, admission)
        : [];
      const candidateObjectIds = excludePeerSystemIndexMembers({
        ownerObjectId: objectId,
        memberObjectIds: uniqueObjectIds([
          ...relationshipIds,
          ...legacyRelationshipIds,
          ...railProjectionIds,
          ...systemIndexIds
        ]),
        systemIndexObjectIds: [...systemIndexesByObjectId.keys()]
      });
      const targetObject = projectedIndex || admittedObject;
      const itemObjectIds = candidateObjectIds.filter(memberObjectId =>
        evaluateAosSystemIndexMembership({
          sourceObject: admission.objectsById.get(memberObjectId),
          targetObject
        }).allowed
      );
      const isEquipmentIndex =
        projectedIndex?.metadata?.adapterId === "ixi-owned-equipment";
      const presentationItems = isEquipmentIndex
        ? preserveAosOwnedListingPresentations(
            projectedIndex?.items || [],
            admission
          )
        : previewsForObjectIds(itemObjectIds, admission);

      registry.set(objectId, {
        ...admittedObject,
        ...(projectedIndex || {}),
        objectId,
        objectType: projectedIndex ? "system-index" : admittedObject.objectType,
        passportId: admittedObject.passportId,
        canonicalIdentity: admittedObject.canonicalIdentity,
        aliases: admittedObject.aliases,
        actorAuthority: admittedObject.actorAuthority,
        presentation: admittedObject.presentation,
        selectedPresentation: admittedObject.selectedPresentation,
        itemObjectIds,
        items: presentationItems
      });
    }

    for (const [objectId, object] of registry) {
      const placedObjectIds = excludePeerSystemIndexMembers({
        ownerObjectId: objectId,
        memberObjectIds:
          canonicalWorkspacePlacements[`container:${objectId}`] || [],
        systemIndexObjectIds: [...systemIndexesByObjectId.keys()]
      }).filter(memberObjectId =>
        evaluateAosSystemIndexMembership({
          sourceObject: admission.objectsById.get(memberObjectId),
          targetObject: object
        }).allowed
      );
      if (!placedObjectIds.length) continue;

      const itemObjectIds = uniqueObjectIds([
        ...(object?.itemObjectIds || []),
        ...placedObjectIds
      ]);
      const isEquipmentIndex =
        object?.metadata?.adapterId === "ixi-owned-equipment";
      registry.set(objectId, {
        ...object,
        itemObjectIds,
        items: isEquipmentIndex
          ? object.items
          : previewsForObjectIds(itemObjectIds, admission)
      });
    }

    return registry;
  }, [
    admission,
    relationships,
    railProjections,
    systemIndexesByObjectId,
    equipmentWorkspaceIndex,
    canonicalWorkspacePlacements
  ]);

  const machineObjectIds = useMemo(
    () => new Set([...objectRegistry.values()]
      .filter(object => object?.presentation?.kind === "ixi-private-machine")
      .map(object => object.objectId)),
    [objectRegistry]
  );

  const boardItems = useMemo(() => {
    const orderedObjects = resolveWorkspaceObjects({
      placements: canonicalWorkspacePlacements,
      surfaceId: "board",
      objectRegistry
    });
    const visibleMachineObjectIds = new Set(
      (visibleSavedListings || [])
        .map(listing => admission.resolveObjectId(getListingId(listing)))
        .filter(Boolean)
    );

    const visibleOrderedObjects = orderedObjects.filter(item =>
      !machineObjectIds.has(item.objectId) || visibleMachineObjectIds.has(item.objectId)
    );

    /*
     * Recovery invariant: a System Index can never disappear inside another
     * System Index, even when an old relationship or saved session placement
     * predates the current guard. Surface the peer Index on the Board so the
     * operator can remove only its invalid parent edge.
     */
    const visibleIds = new Set(visibleOrderedObjects.map(item => item.objectId));
    const recoveredSystemIndexes = [...objectRegistry.values()].filter(item => {
      if (!isExplicitAosSystemIndexObject(item) || visibleIds.has(item.objectId)) {
        return false;
      }
      const locatedSurface = Object.entries(canonicalWorkspacePlacements).find(([, objectIds]) =>
        Array.isArray(objectIds) && objectIds.includes(item.objectId)
      )?.[0] || "";
      if (!locatedSurface.startsWith("container:")) return false;
      return true;
    });

    return [...visibleOrderedObjects, ...recoveredSystemIndexes];
  }, [
    canonicalWorkspacePlacements,
    objectRegistry,
    systemIndexesByObjectId,
    visibleSavedListings,
    admission,
    machineObjectIds
  ]);

  return {
    admission,
    objectRegistry,
    aliasIndexes: {
      passportId: admission.passportToObjectId,
      listingId: admission.listingToObjectId,
      historicalId: admission.historicalToObjectId,
      externalId: admission.externalToObjectId
    },
    canonicalWorkspacePlacements,
    boardItems
  };
}
