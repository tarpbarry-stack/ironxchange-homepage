import {
  hydrateIXIListingCollection
} from "./hydrateIXIListingMedia";

function clean(value) {
  return String(value || "").trim();
}

export async function loadIXIOwnedListings(
  userId
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
      `/api/account-listings?authorId=${encodeURIComponent(
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

  return hydrateIXIListingCollection(
    listings
  );
}

export default loadIXIOwnedListings;
