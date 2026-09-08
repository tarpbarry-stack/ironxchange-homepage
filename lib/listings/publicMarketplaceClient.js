import {
  createPublicMarketplaceCatalogueUrl
} from "./publicMarketplaceCatalogue.mjs";

const PUBLIC_CATALOGUE_RETRY_DELAY_MS = 250;
const publicListingRequests = new Map();

function waitForRetry() {
  return new Promise(resolve => {
    setTimeout(resolve, PUBLIC_CATALOGUE_RETRY_DELAY_MS);
  });
}

async function requestPublicMarketplaceListings(url) {
  const response = await fetch(url);

  if (!response.ok) {
    const error = new Error(
      `Public listings request failed with status ${response.status}`
    );

    error.status = response.status;
    throw error;
  }

  const payload = await response.json();

  if (!Array.isArray(payload)) {
    throw new Error(
      "Public listings response was not an array"
    );
  }

  return payload;
}

async function requestWithRetry(url, retry) {
  try {
    return await requestPublicMarketplaceListings(url);
  } catch (error) {
    if (
      !retry ||
      (Number(error?.status) >= 400 && Number(error?.status) < 500)
    ) {
      throw error;
    }

    await waitForRetry();
    return requestPublicMarketplaceListings(url);
  }
}

export function fetchPublicMarketplaceListings({
  surface = "browse-v2",
  projection = "card",
  retry = true
} = {}) {
  const url = createPublicMarketplaceCatalogueUrl({
    surface,
    projection
  });

  if (!publicListingRequests.has(url)) {
    const request = requestWithRetry(url, retry)
      .finally(() => {
        publicListingRequests.delete(url);
      });

    publicListingRequests.set(url, request);
  }

  return publicListingRequests.get(url);
}

export default fetchPublicMarketplaceListings;
