function getListingId(listing = {}) {
  return String(
    listing?.id?.uuid ||
    listing?.id ||
    listing?.uuid ||
    listing?.listingId ||
    ""
  );
}

export function resolveIXILaunchSelection({
  requestedListingId = "",
  listings = []
} = {}) {
  if (!Array.isArray(listings) || listings.length === 0) {
    return null;
  }

  const requestedId = String(requestedListingId || "");

  if (!requestedId) {
    return listings[0];
  }

  return listings.find(
    listing => getListingId(listing) === requestedId
  ) || null;
}
