import { getListingId } from "./listingFormatters";

export const SAVED_LISTINGS_KEY = "savedListings";

export function normalizeSavedId(id) {
  return String(id || "").trim();
}

export function getSavedListingIdsFromUser(currentUser = {}) {
  const saved =
    currentUser?.attributes?.profile?.privateData?.[SAVED_LISTINGS_KEY];

  return Array.isArray(saved)
    ? saved.map(normalizeSavedId).filter(Boolean)
    : [];
}

export function isListingSaved(currentUser = {}, listing = {}) {
  const listingId = normalizeSavedId(getListingId(listing));
  if (!listingId) return false;

  return getSavedListingIdsFromUser(currentUser).includes(listingId);
}

export async function fetchCurrentUserWithSavedListings(sdk) {
  const response = await sdk.currentUser.show();
  return response?.data?.data || null;
}

export async function toggleSavedListing({ sdk, listing }) {
  const listingId = normalizeSavedId(getListingId(listing));

  if (!sdk) {
    throw new Error("Sharetribe SDK is required.");
  }

  if (!listingId) {
    throw new Error("Listing ID is required to save this listing.");
  }

  const response = await sdk.currentUser.show();
  const currentUser = response?.data?.data;

  if (!currentUser) {
    throw new Error("You must be logged in to save listings.");
  }

  const profile = currentUser?.attributes?.profile || {};
  const privateData = profile?.privateData || {};

  const currentSaved = Array.isArray(privateData[SAVED_LISTINGS_KEY])
    ? privateData[SAVED_LISTINGS_KEY].map(normalizeSavedId).filter(Boolean)
    : [];

  const nextSaved = currentSaved.includes(listingId)
    ? currentSaved.filter(id => id !== listingId)
    : [...currentSaved, listingId];

  const updateResponse = await sdk.currentUser.updateProfile(
    {
      privateData: {
        ...privateData,
        [SAVED_LISTINGS_KEY]: nextSaved
      }
    },
    {
      expand: true
    }
  );

  return {
    savedIds: nextSaved,
    currentUser: updateResponse?.data?.data || currentUser
  };
}

export function filterSavedListings(listings = [], savedIds = []) {
  const savedSet = new Set(savedIds.map(normalizeSavedId).filter(Boolean));

  return Array.isArray(listings)
    ? listings.filter(item => savedSet.has(normalizeSavedId(getListingId(item))))
    : [];
}
