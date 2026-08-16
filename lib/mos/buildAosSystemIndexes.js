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
 * - Persisted MOS containers are never classified by their names.
 * - No JOB / PEOPLE / LOCATION / VEHICLE / TOOL noun inference.
 * - No objectType business taxonomy is used to manufacture indexes.
 * - IronXchange-owned universes are explicit system adapters.
 * - MOS directContainerId is canonical for persisted container membership.
 *
 * Current IXI-owned adapters:
 * - EQUIPMENT: authenticated owner's active IronXchange listings.
 * - FOR SALE: public owned listings published to Marketplace/Auction channels.
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

function isContainerObject(object = {}) {
  return (
    object?.capabilities?.canContain === true ||
    object?.metadata?.systemIndex === true ||
    object?.metadata?.isSystemIndex === true ||
    cleanText(object?.cardTemplateSlug) === "ixi-system-index-v1" ||
    cleanText(object?.templateId) === "ixi-system-index-v1" ||
    cleanText(object?.metadata?.templateId) === "ixi-system-index-v1" ||
    cleanText(object?.metadata?.cardTemplateId) === "ixi-system-index-v1"
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

function buildPersistedContainerIndex({
  object,
  aosObjects
}) {
  const objectId = getObjectId(object);

  if (!objectId || !isActiveMosObject(object)) {
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

    /*
     * Persisted identity is preserved exactly.
     * No identity is manufactured from the customer's name.
     */
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

  /*
   * IXI-OWNED SYSTEM ADAPTERS
   *
   * These exist because IronXchange itself owns the canonical
   * source universe. They are explicit integrations, not inferred
   * customer business categories.
   */
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

  /*
   * CUSTOMER / MOS CONTAINERS
   *
   * Every persisted container is surfaced by stable object identity.
   * Its saved displayName is presentation only.
   *
   * We intentionally do NOT ask whether it is named JOBS, PEOPLE,
   * LOCATIONS, VENDORS, DOGS, FIELD RIGS, or anything else.
   */
  const persistedIndexes =
    activeObjects
      .filter(isContainerObject)
      .map(object =>
        buildPersistedContainerIndex({
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
