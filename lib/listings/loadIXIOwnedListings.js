import {
  hydrateIXIListingCollection
} from "./hydrateIXIListingMedia";

import {
  filterAosOwnedMachines
} from "./IXIAosOwnedInventoryPolicy.mjs";

function clean(value) {
  return String(value || "").trim();
}

export async function loadIXIOwnedListings(
  userId,
  {
    hydrateMedia = true
  } = {}
) {
  const normalizedUserId =
    clean(userId);

  if (!normalizedUserId) {
    throw new Error(
      "loadIXIOwnedListings requires userId."
    );
  }

  const response =
    await fetch(
      `/api/account-listings?scope=aos-owned&authorId=${encodeURIComponent(
        normalizedUserId
      )}`
    );

  let payload = null;

  try {
    payload =
      await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      payload?.error ||
      `Owned listings request failed with status ${response.status}.`
    );
  }

  const listings =
    Array.isArray(payload)
      ? payload
      : [];

  const ownedListings =
    filterAosOwnedMachines(listings);

  if (!hydrateMedia) {
    return ownedListings;
  }

  return hydrateIXIListingCollection(
    ownedListings,
    { dedupeRequests: true }
  );
}

export default loadIXIOwnedListings;
