function readListingData(listing = {}) {
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

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function getAosOwnershipRole(listing = {}) {
  const { publicData, metadata } =
    readListingData(listing);

  return normalize(
    listing.ownershipRole ||
      publicData.ownershipRole ||
      metadata.ownershipRole
  );
}

export function isUrlImportedReferenceMachine(listing = {}) {
  const { publicData, metadata } =
    readListingData(listing);

  const provenance = [
    listing.machineOrigin,
    publicData.machineOrigin,
    metadata.machineOrigin,
    listing.sourceType,
    publicData.sourceType,
    metadata.sourceType,
    publicData.importSource,
    metadata.importSource,
    publicData.ixiMedia?.sourceType,
    metadata.ixiMedia?.sourceType
  ]
    .map(normalize)
    .filter(Boolean);

  return provenance.some(value =>
    value === "url-import" ||
    value === "auction-compare" ||
    value === "auction-research" ||
    value === "market-research" ||
    value === "reference"
  );
}

/**
 * The endpoint supplying AOS is already author-scoped. Channel and visibility
 * describe how an owned machine is being sold; they never define ownership.
 * Legacy author-created records remain included unless they carry explicit
 * non-owner/reference provenance.
 */
export function isAosOwnedMachine(listing = {}) {
  const { publicData, metadata } =
    readListingData(listing);

  const listingStatus = normalize(
    listing.listingStatus ||
      publicData.listingStatus ||
      metadata.listingStatus
  );

  if (listingStatus === "deleted") {
    return false;
  }

  if (getAosOwnershipRole(listing) === "non-owner") {
    return false;
  }

  return !isUrlImportedReferenceMachine(listing);
}

export function filterAosOwnedMachines(listings = []) {
  return Array.isArray(listings)
    ? listings.filter(isAosOwnedMachine)
    : [];
}
