import {
  IXI_AOS_SYSTEM_ADAPTERS,
  getIXIAosSystemAdapter
} from "./IXIAosSystemAdapterRegistry.js";

import {
  getAosRailProjectionObjectIds
} from "./IXIAosMembershipBridge.mjs";

import {
  buildAosCanonicalAdmission
} from "./ixiAosCanonicalAdmission.mjs";

import {
  getAosSystemIndexMembershipPolicy,
  getAosSystemIndexWorkspaceDropPolicy,
  isExplicitAosSystemIndexObject
} from "./IXIAosSystemIndexMembershipPolicy.js";

/*
 * IXI AOS SYSTEM INDEX ASSEMBLY
 *
 * Commercial doctrine:
 * - Customer vocabulary is authoritative.
 * - Persisted MOS objects are never classified by business nouns.
 * - A generic container is NOT automatically a System Index.
 * - System Index identity is explicit technical metadata/template identity.
 * - IronXchange-owned universes are explicit registered system adapters.
 * - Persisted membership is projected from governed IX-Core rail edges.
 * - directContainerId is migration evidence only and is never graph truth.
 */

function cleanText(value) {
  return String(value ?? "").trim();
}

function cleanKey(value) {
  return cleanText(value).toLowerCase();
}

function getObjectId(object = {}) {
  return cleanText(
    object?.objectId ||
    object?.id?.uuid ||
    object?.id
  );
}

function getObjectValue(object = {}) {
  const value =
    object?.value ??
    object?.estimatedValue ??
    object?.marketValue ??
    0;

  const numericValue = Number(value);

  return Number.isFinite(numericValue)
    ? numericValue
    : 0;
}

function getListingValue(listing = {}) {
  const moneyAmount =
    listing?.price?.amount ??
    listing?.attributes?.price?.amount;

  if (moneyAmount !== undefined && moneyAmount !== null) {
    const numericAmount = Number(moneyAmount);

    return Number.isFinite(numericAmount)
      ? numericAmount / 100
      : 0;
  }

  const value =
    listing?.price ??
    listing?.publicData?.price ??
    listing?.attributes?.publicData?.price ??
    0;

  const numericValue = Number(value);

  return Number.isFinite(numericValue)
    ? numericValue
    : 0;
}

function sumValues(items = [], resolver) {
  return items.reduce(
    (total, item) => total + resolver(item),
    0
  );
}

function isActiveMosObject(object = {}) {
  const status = cleanKey(object?.status);

  return ![
    "archived",
    "deleted",
    "soft-deleted"
  ].includes(status);
}

function isPersistedSystemIndex(object = {}) {
  return isExplicitAosSystemIndexObject(object);
}

function getProjectedMosChildren({
  railOwnerObjectId,
  aosObjects = [],
  railProjections = {},
  admission
}) {
  const ownerId = cleanText(railOwnerObjectId);

  if (!ownerId) {
    return [];
  }

  const objectsById = new Map(
    aosObjects
      .filter(isActiveMosObject)
      .map(object => [getObjectId(object), object])
      .filter(([objectId]) => objectId)
  );

  return getAosRailProjectionObjectIds({
    railOwnerObjectId: ownerId,
    railProjections,
    admission
  })
    .map(objectId =>
      admission?.objectsById?.get(objectId) || objectsById.get(objectId)
    )
    .filter(Boolean);
}

function isArchivedListing(listing = {}) {
  const status = cleanKey(
    listing?.listingStatus ||
    listing?.publicData?.listingStatus ||
    listing?.attributes?.publicData?.listingStatus ||
    listing?.attributes?.state
  );

  return status === "archived" || status === "deleted";
}

function createSystemAdapterIndex({
  adapter,
  canonicalObject,
  items = [],
  value = 0,
  metadata = {}
}) {
  if (!canonicalObject || !getObjectId(canonicalObject)) {
    return null;
  }

  const customerDisplayName = cleanText(
    canonicalObject?.displayName
  );

  if (!customerDisplayName) {
    const error = new Error(
      "A canonical AOS System Index requires its persisted customer-visible name."
    );
    error.code = "AOS_SYSTEM_INDEX_NAME_REQUIRED";
    throw error;
  }

  return {
    ...canonicalObject,

    indexId:
      adapter.indexId,

    objectId:
      getObjectId(canonicalObject),

    /* Technical presentation marker only. */
    objectType:
      "system-index",

    objectFamily:
      adapter.objectFamily,

    /* Adapter identity controls behavior; persisted customer wording controls presentation. */
    displayName:
      customerDisplayName,

    label:
      customerDisplayName,

    itemCount:
      items.length,

    value,

    items,

    workspace: {
      surfaceId:
        adapter.workspaceSurfaceId,

      dropPolicy: getAosSystemIndexWorkspaceDropPolicy(canonicalObject)
    },

    metadata: {
      ...(canonicalObject?.metadata || {}),
      ...metadata,

      adapterId:
        adapter.adapterId,

      source:
        adapter.source,

      canonicalMembership:
        adapter.canonicalMembership,

      systemOwned:
        true,

      systemAdapter:
        true,

      systemIndexPresentation:
        true,

      canonicalMosContainer:
        false,

      supportsCollectionWorkspaceCommands:
        adapter.supportsCollectionWorkspaceCommands ===
        true
    },

    capabilities: {
      ...(canonicalObject?.capabilities || {}),
      canContain:
        false,

      canOpenStack:
        true,

      canMoveToBoard:
        true,

      isProjection:
        true,

      acceptsOperationalDrop:
        adapter.canOperationalDrop === true
    }
  };
}

function buildPersistedSystemIndex({
  object,
  aosObjects,
  railProjections,
  admission
}) {
  const objectId = getObjectId(object);

  if (
    !objectId ||
    !isActiveMosObject(object) ||
    !isPersistedSystemIndex(object)
  ) {
    return null;
  }

  const displayName =
    cleanText(
      object?.displayName ||
      object?.label ||
      object?.name
    );

  if (!displayName) {
    const error = new Error(
      "A persisted AOS System Index requires a customer-visible name."
    );
    error.code = "AOS_SYSTEM_INDEX_NAME_REQUIRED";
    throw error;
  }

  const projectedItems =
    getProjectedMosChildren({
      railOwnerObjectId: objectId,
      aosObjects,
      railProjections,
      admission
    });
  const membershipPolicy = getAosSystemIndexMembershipPolicy(object);

  return {
    ...object,

    indexId:
      objectId,

    objectId,

    displayName,
    label: displayName,

    itemCount:
      projectedItems.length,

    value:
      sumValues(
        projectedItems,
        getObjectValue
      ),

    items:
      projectedItems,

    workspace: {
      ...(object?.workspace || {}),
      surfaceId: object?.workspace?.surfaceId || `index:${objectId}`,
      dropPolicy: getAosSystemIndexWorkspaceDropPolicy(object)
    },

    metadata: {
      ...(object?.metadata || {}),
      persisted: true,
      systemOwned: false,
      systemAdapter: false,
      systemIndexPresentation: true,
      canonicalMosContainer: true
    },

    capabilities: {
      ...(object?.capabilities || {}),
      canContain: true,
      canOpenStack: true,
      canMoveToBoard: true,
      isProjection: false,
      acceptsOperationalDrop: membershipPolicy?.enabled === true
    }
  };
}

function uniqueIndexes(indexes = []) {
  const seen = new Set();

  return indexes.filter(index => {
    const identity = cleanText(index?.objectId || index?.indexId);

    if (!identity || seen.has(identity)) {
      return false;
    }

    seen.add(identity);
    return true;
  });
}

export function buildAosSystemIndexes({
  aosObjects = [],
  ownedListings = [],
  railProjections = {},
  canonicalAdmission = null
} = {}) {
  const activeObjects =
    Array.isArray(aosObjects)
      ? aosObjects.filter(isActiveMosObject)
      : [];

  const activeListings =
    Array.isArray(ownedListings)
      ? ownedListings.filter(listing => !isArchivedListing(listing))
      : [];

  const canonicalAdapterObject = adapter =>
    activeObjects.find(object =>
      isPersistedSystemIndex(object) &&
      getIXIAosSystemAdapter(object)?.adapterId === adapter.adapterId
    ) || null;

  const equipmentObject = canonicalAdapterObject(
    IXI_AOS_SYSTEM_ADAPTERS.EQUIPMENT
  );

  const admission = canonicalAdmission || (
    activeObjects.length
      ? buildAosCanonicalAdmission({
          aosObjects: activeObjects,
          workspaceListings: activeListings
        })
      : null
  );

  const equipmentItems = equipmentObject
    ? getProjectedMosChildren({
        railOwnerObjectId: getObjectId(equipmentObject),
        aosObjects: activeObjects,
        railProjections,
        admission
      })
    : [];

  const equipmentIndex =
    createSystemAdapterIndex({
      adapter:
        IXI_AOS_SYSTEM_ADAPTERS
          .EQUIPMENT,

      canonicalObject:
        equipmentObject,

      items:
        equipmentItems,

      value:
        sumValues(
          equipmentItems,
          item => getListingValue(item) || getObjectValue(item)
        )
    });

  const persistedIndexObjects =
    activeObjects
      .filter(isPersistedSystemIndex)
      .filter(object => getObjectId(object) !== getObjectId(equipmentObject))
      /*
       * An IXI-owned adapter is visible only when it is registered above.
       * Unknown or retired technical adapters never fall through and become
       * customer System Indexes merely because an old Object remains auditable.
       */
      .filter(object =>
        object?.metadata?.systemAdapter !== true &&
        !cleanText(object?.metadata?.adapterId)
      );

  const persistedIndexes =
    persistedIndexObjects
      .map(object =>
        buildPersistedSystemIndex({
          object,
          aosObjects: activeObjects,
          railProjections,
          admission
        })
      )
      .filter(Boolean);

  return uniqueIndexes([
    equipmentIndex,
    ...persistedIndexes
  ]);
}

export default buildAosSystemIndexes;
