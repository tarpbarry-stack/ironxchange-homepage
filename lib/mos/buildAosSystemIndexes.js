import {
  getMachineAccess,
  getMachineChannel,
  IXI_MACHINE_ACCESS,
  IXI_MACHINE_CHANNELS
} from "../machine-access/IXIMachineAccess";

function clean(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getObjectType(object = {}) {
  return clean(
    object.objectType ||
    object.type ||
    object.customerCategory
  );
}

function getObjectValue(object = {}) {
  const value =
    object.value ??
    object.estimatedValue ??
    object.marketValue ??
    0;

  const numericValue =
    Number(value);

  return Number.isFinite(numericValue)
    ? numericValue
    : 0;
}

function getListingValue(listing = {}) {
  const value =
    listing.price?.amount ??
    listing.price ??
    listing.publicData?.price ??
    listing.attributes?.publicData?.price ??
    0;

  const numericValue =
    Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  /*
   * Sharetribe Money amounts may be stored
   * in minor currency units.
   */
  if (
    listing.price?.amount !== undefined &&
    numericValue > 1000000
  ) {
    return numericValue / 100;
  }

  return numericValue;
}

function sumValues(items = [], resolver) {
  return items.reduce(
    (total, item) =>
      total + resolver(item),
    0
  );
}

function isArchivedListing(listing = {}) {
  const status =
    clean(
      listing.listingStatus ||
      listing.publicData?.listingStatus ||
      listing.attributes?.publicData?.listingStatus
    );

  return status === "archived";
}

function isForSaleListing(listing = {}) {
  if (isArchivedListing(listing)) {
    return false;
  }

  const access =
    getMachineAccess(listing);

  const channel =
    getMachineChannel(listing);

  return (
    access === IXI_MACHINE_ACCESS.PUBLIC &&
    (
      channel ===
        IXI_MACHINE_CHANNELS.MARKETPLACE ||
      channel ===
        IXI_MACHINE_CHANNELS.AUCTION
    )
  );
}

function createIndex({
  indexId,
  label,
  objectFamily,
  items = [],
  value = 0,
  metadata = {}
}) {
  return {
    indexId,
    objectId:
      `system-index:${indexId}`,

    objectType:
      "system-index",

    objectFamily,

    displayName:
      label,

    label,

    itemCount:
      items.length,

    value,

    items,

    metadata,

    capabilities: {
      canContain: false,
      canOpenStack: true,
      canMoveToBoard: true,
      isProjection: true,
      acceptsOperationalDrop: false
    }
  };
}

export function buildAosSystemIndexes({
  aosObjects = [],
  ownedListings = []
} = {}) {
  const activeListings =
    ownedListings.filter(
      listing =>
        !isArchivedListing(listing)
    );

  const forSaleListings =
    activeListings.filter(
      isForSaleListing
    );

  const jobs =
    aosObjects.filter(
      object =>
        getObjectType(object) ===
        "job"
    );

  const people =
    aosObjects.filter(object =>
      [
        "person",
        "employee",
        "contractor"
      ].includes(
        getObjectType(object)
      )
    );

  const locations =
    aosObjects.filter(object =>
      [
        "location",
        "yard",
        "building",
        "room"
      ].includes(
        getObjectType(object)
      )
    );

  const realEstate =
    aosObjects.filter(object =>
      [
        "real-estate",
        "property",
        "land"
      ].includes(
        getObjectType(object)
      )
    );

  const vehicles =
    aosObjects.filter(
      object =>
        getObjectType(object) ===
        "vehicle"
    );

  const tools =
    aosObjects.filter(
      object =>
        getObjectType(object) ===
        "tool"
    );

  return [
    createIndex({
      indexId: "jobs",
      label: "JOBS",
      objectFamily: "job",
      items: jobs,
      value:
        sumValues(
          jobs,
          getObjectValue
        )
    }),

    createIndex({
      indexId: "people",
      label: "PEOPLE",
      objectFamily: "person",
      items: people,
      value: 0
    }),

    createIndex({
      indexId: "equipment",
      label: "EQUIPMENT",
      objectFamily: "equipment",
      items: activeListings,
      value:
        sumValues(
          activeListings,
          getListingValue
        ),

      metadata: {
        source:
          "owned-ironxchange-listings"
      }
    }),

    createIndex({
      indexId: "for-sale",
      label: "FOR SALE",
      objectFamily: "publication",
      items: forSaleListings,
      value:
        sumValues(
          forSaleListings,
          getListingValue
        ),

      metadata: {
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
    }),

    createIndex({
      indexId: "locations",
      label: "LOCATIONS",
      objectFamily: "location",
      items: locations,
      value:
        sumValues(
          locations,
          getObjectValue
        )
    }),

    createIndex({
      indexId: "real-estate",
      label: "REAL ESTATE",
      objectFamily: "real-estate",
      items: realEstate,
      value:
        sumValues(
          realEstate,
          getObjectValue
        )
    }),

    createIndex({
      indexId: "vehicles",
      label: "VEHICLES",
      objectFamily: "vehicle",
      items: vehicles,
      value:
        sumValues(
          vehicles,
          getObjectValue
        )
    }),

    createIndex({
      indexId: "tools",
      label: "TOOLS",
      objectFamily: "tool",
      items: tools,
      value:
        sumValues(
          tools,
          getObjectValue
        )
    })
  ];
}

export default buildAosSystemIndexes;
