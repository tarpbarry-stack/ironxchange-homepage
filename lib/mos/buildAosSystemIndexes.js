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

const IXI_SYSTEM_INDEX_TEMPLATE_ID =
  "ixi-system-index-v1";

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
  const metadata =
    object?.metadata && typeof object.metadata === "object"
      ? object.metadata
      : {};

  const explicitTemplateId = cleanText(
    object?.cardTemplateSlug ||
    object?.templateId ||
    metadata?.templateId ||
    metadata?.cardTemplateId
  );

  return (
    metadata?.systemIndex === true ||
    metadata?.isSystemIndex === true ||
    metadata?.systemIndexPresentation === true ||
    explicitTemplateId === IXI_SYSTEM_INDEX_TEMPLATE_ID ||
    /*
     * Temporary technical migration marker only.
     * It never classifies customer business meaning.
     */
    cleanKey(object?.objectType) === "system-index"
  );
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
    .map(objectId => objectsById.get(objectId))
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

      dropPolicy: {
        enabled:
          adapter.canOperationalDrop === true,

        acceptedObjectTypes: [
          ...(adapter.acceptedObjectTypes || [])
        ]
      }
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
      acceptsOperationalDrop: true
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

  const forSaleObject = canonicalAdapterObject(
    IXI_AOS_SYSTEM_ADAPTERS.FOR_SALE
  );

  const equipmentIndex =
    createSystemAdapterIndex({
      adapter:
        IXI_AOS_SYSTEM_ADAPTERS
          .EQUIPMENT,

      canonicalObject:
        equipmentObject,

      items:
        activeListings,

      value:
        sumValues(
          activeListings,
          getListingValue
        )
    });

  const persistedIndexObjects =
    activeObjects
      .filter(isPersistedSystemIndex)
      .filter(object => ![
        getObjectId(equipmentObject),
        getObjectId(forSaleObject)
      ].filter(Boolean).includes(getObjectId(object)));

  const admission = canonicalAdmission || (
    persistedIndexObjects.length
      ? buildAosCanonicalAdmission({
          aosObjects: activeObjects,
          workspaceListings: activeListings
        })
      : null
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
