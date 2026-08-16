import {
  getMachineAccess,
  getMachineChannel,
  IXI_MACHINE_ACCESS,
  IXI_MACHINE_CHANNELS
} from "../machine-access/IXIMachineAccess";

/*
 * IXI AOS SYSTEM INDEX ASSEMBLY
 *
 * Commercial doctrine:
 * - Customer vocabulary is authoritative.
 * - Persisted MOS objects are never classified by business nouns.
 * - A generic container is NOT automatically a System Index.
 * - System Index identity is explicit technical metadata/template identity.
 * - IronXchange-owned universes are explicit system adapters.
 * - MOS directContainerId is canonical for persisted container membership.
 *
 * Current IXI-owned adapters:
 * - EQUIPMENT: authenticated owner's active IronXchange listings.
 * - FOR SALE: public owned listings published to Marketplace/Auction channels.
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
     * Technical migration marker only.
     * This is NOT a business noun classifier.
     */
    cleanKey(object?.objectType) === "system-index"
  );
}

function getDirectMosChildren({
  parentObjectId,
  aosObjects = []
}) {
  const parentId = cleanText(parentObjectId);

  if (!parentId) {
    return [];
  }

  return aosObjects.filter(object => {
    if (!isActiveMosObject(object)) {
      return false;
    }

    const objectId = getObjectId(object);
    const directContainerId = cleanText(object?.directContainerId);

    return (
      objectId &&
      objectId !== parentId &&
      directContainerId === parentId
    );
  });
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

function isForSaleListing(listing = {}) {
  if (isArchivedListing(listing)) {
    return false;
  }

  const access = getMachineAccess(listing);
  const channel = getMachineChannel(listing);

  return (
    access === IXI_MACHINE_ACCESS.PUBLIC &&
    (
      channel === IXI_MACHINE_CHANNELS.MARKETPLACE ||
      channel === IXI_MACHINE_CHANNELS.AUCTION
    )
  );
}

function createSystemAdapterIndex({
  indexId,
  label,
  objectFamily,
  items = [],
  value = 0,
  metadata = {}
}) {
  return {
    indexId,
    objectId: `system-index:${indexId}`,
    objectType: "system-index",
    objectFamily,
    displayName: label,
    label,
    itemCount: items.length,
    value,
    items,

    metadata: {
      ...metadata,
      systemOwned: true,
      systemAdapter: true,
      systemIndexPresentation: true,
      canonicalMosContainer: false
    },

    capabilities: {
      canContain: false,
      canOpenStack: true,
      canMoveToBoard: true,
      isProjection: true,
      acceptsOperationalDrop: false
    }
  };
}

function buildPersistedSystemIndex({
  object,
  aosObjects
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
    ) || "INDEX";

  const directItems =
    getDirectMosChildren({
      parentObjectId: objectId,
      aosObjects
    });

  return {
    ...object,
    indexId: objectId,
    objectId,
    displayName,
    label: displayName,
    itemCount: directItems.length,
    value: sumValues(directItems, getObjectValue),
    items: directItems,

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
  ownedListings = []
} = {}) {
  const activeObjects =
    Array.isArray(aosObjects)
      ? aosObjects.filter(isActiveMosObject)
      : [];

  const activeListings =
    Array.isArray(ownedListings)
      ? ownedListings.filter(listing => !isArchivedListing(listing))
      : [];

  const forSaleListings =
    activeListings.filter(isForSaleListing);

  const equipmentIndex =
    createSystemAdapterIndex({
      indexId: "equipment",
      label: "EQUIPMENT",
      objectFamily: "equipment",
      items: activeListings,
      value: sumValues(activeListings, getListingValue),
      metadata: {
        adapterId: "ixi-owned-equipment",
        source: "owned-ironxchange-listings"
      }
    });

  const forSaleIndex =
    createSystemAdapterIndex({
      indexId: "for-sale",
      label: "FOR SALE",
      objectFamily: "publication",
      items: forSaleListings,
      value: sumValues(forSaleListings, getListingValue),
      metadata: {
        adapterId: "ixi-owned-for-sale",
        source: "owned-ironxchange-listings",
        marketplaceCount:
          forSaleListings.filter(
            listing =>
              getMachineChannel(listing) ===
              IXI_MACHINE_CHANNELS.MARKETPLACE
          ).length,
        auctionCount:
          forSaleListings.filter(
            listing =>
              getMachineChannel(listing) ===
              IXI_MACHINE_CHANNELS.AUCTION
          ).length
      }
    });

  const persistedIndexes =
    activeObjects
      .filter(isPersistedSystemIndex)
      .map(object =>
        buildPersistedSystemIndex({
          object,
          aosObjects: activeObjects
        })
      )
      .filter(Boolean);

  return uniqueIndexes([
    equipmentIndex,
    forSaleIndex,
    ...persistedIndexes
  ]);
}

export default buildAosSystemIndexes;
