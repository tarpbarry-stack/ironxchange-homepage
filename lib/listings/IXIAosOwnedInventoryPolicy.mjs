function listingData(listing = {}) {
  return {
    publicData:
      listing.publicData ||
      listing.attributes?.publicData ||
      {},
    metadata:
      listing.metadata ||
      listing.attributes?.metadata ||
      {}
  };
}

function normalized(value) {
  return String(value || "").trim().toLowerCase();
}

function firstValue(...values) {
  return values.find(value => normalized(value)) || "";
}

function isLegacyUrlImport(listing, publicData, metadata) {
  const media =
    listing.ixiMedia ||
    publicData.ixiMedia ||
    metadata.ixiMedia ||
    {};

  const identities = [
    listing.machineOrigin,
    publicData.machineOrigin,
    metadata.machineOrigin,
    listing.sourceType,
    publicData.sourceType,
    metadata.sourceType,
    media.machineKey,
    media.passportId,
    media.manifest
  ];

  return identities.some(value =>
    normalized(value).includes("url-import")
  );
}

/**
 * Defines the canonical AOS-owned machine universe.
 *
 * Sharetribe's ownListings API means "authored by this user", not necessarily
 * "owned by this Entity". URL-import research and auction-comparison records
 * are authored listings too, so AOS must classify them explicitly.
 */
export function isAosOwnedMachine(listing = {}) {
  const { publicData, metadata } = listingData(listing);
  const status = normalized(firstValue(
    listing.listingStatus,
    publicData.listingStatus,
    metadata.listingStatus,
    listing.sharetribeState,
    listing.attributes?.state
  ));
  const role = normalized(firstValue(
    listing.ownershipRole,
    publicData.ownershipRole,
    metadata.ownershipRole
  ));
  const ownershipStatus = normalized(firstValue(
    listing.ownershipStatus,
    publicData.ownershipStatus,
    metadata.ownershipStatus
  ));
  const channel = normalized(firstValue(
    listing.machineChannel,
    publicData.machineChannel,
    metadata.machineChannel
  ));

  if (
    listing.deleted === true ||
    listing.attributes?.deleted === true ||
    status === "deleted" ||
    status === "archived"
  ) {
    return false;
  }

  if (
    role === "non-owner" ||
    ownershipStatus === "reference" ||
    ownershipStatus === "not-owned"
  ) {
    return false;
  }

  // An acquisition/disposition action is authoritative, even when the
  // machine originally entered IXI through URL-import research.
  if (role === "owner" || ownershipStatus === "owned") {
    return true;
  }

  if (isLegacyUrlImport(listing, publicData, metadata)) {
    return false;
  }

  // Historical auction records are work/comparison records unless an owner
  // action explicitly promoted them above.
  if (channel === "auction" || channel === "auction-archive") {
    return false;
  }

  // The source endpoint is author-scoped. This preserves legacy private and
  // marketplace inventory created before explicit ownership fields existed.
  return true;
}

export function filterAosOwnedMachines(listings = []) {
  return Array.isArray(listings)
    ? listings.filter(isAosOwnedMachine)
    : [];
}

