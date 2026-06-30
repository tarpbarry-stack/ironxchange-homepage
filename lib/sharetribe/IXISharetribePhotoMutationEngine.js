import {
  getSharetribeIntegrationToken,
  safeSharetribeJson
} from "./IXISharetribeMutationEngine";


function normalizeImageIds(imageIds = []) {
  return Array.isArray(imageIds)
    ? imageIds
        .map(id => String(id || "").trim())
        .filter(Boolean)
    : [];
}

function getListingData(response = {}) {
  return response?.data?.data || response?.data || response || {};
}

function getListingImageIds(listing = {}) {
  const relationships =
    listing?.relationships ||
    listing?.data?.relationships ||
    {};

  const images = relationships?.images?.data || [];

  return Array.isArray(images)
    ? images
        .map(item => item?.id?.uuid || item?.id || "")
        .map(String)
        .filter(Boolean)
    : [];
}

async function updateSharetribeListingPhotos({
  token,
  listingId,
  imageIds = []
}) {
  if (!token) throw new Error("Missing Sharetribe token");
  if (!listingId) throw new Error("Missing listingId");

  const response = await fetch(
    "https://flex-integ-api.sharetribe.com/v1/integration_api/listings/update",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
  id: String(listingId),
  images: normalizeImageIds(imageIds)
})
    }
  );

  const data = await safeSharetribeJson(response);

  if (!response.ok) {
    throw new Error(`Sharetribe photo update failed: ${JSON.stringify(data)}`);
  }

  return data;
}

async function fetchSharetribeListingPhotos({
  token,
  listingId
}) {
  if (!token) throw new Error("Missing Sharetribe token");
  if (!listingId) throw new Error("Missing listingId");

  const response = await fetch(
    `https://flex-integ-api.sharetribe.com/v1/integration_api/listings/show?id=${encodeURIComponent(
      String(listingId)
    )}&include=images`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      }
    }
  );

  const data = await safeSharetribeJson(response);

  if (!response.ok) {
    throw new Error(`Sharetribe listing photo fetch failed: ${JSON.stringify(data)}`);
  }

  return data;
}

export function verifyListingPhotos({
  requestedImageIds = [],
  listingResponse = {}
}) {
  const listing = getListingData(listingResponse);

  const expected = normalizeImageIds(requestedImageIds);
  const actual = getListingImageIds(listing);

  const ok = JSON.stringify(actual) === JSON.stringify(expected);

  return {
    ok,
    expected,
    actual,
    failures: ok
      ? []
      : [
          {
            field: "images",
            expected,
            actual
          }
        ]
  };
}

export async function updateListingPhotosVerified({
  listingId,
  imageIds = []
}) {
  if (!listingId) throw new Error("Missing listingId");

  const normalizedImageIds = normalizeImageIds(imageIds);
  const token = await getSharetribeIntegrationToken();

  const updateResult = await updateSharetribeListingPhotos({
    token,
    listingId,
    imageIds: normalizedImageIds
  });

  const refreshedListing = await fetchSharetribeListingPhotos({
    token,
    listingId
  });

  const verification = verifyListingPhotos({
    requestedImageIds: normalizedImageIds,
    listingResponse: refreshedListing
  });

  if (!verification.ok) {
    throw new Error(
      `Sharetribe photo verification failed: ${JSON.stringify(
        verification.failures
      )}`
    );
  }

  return {
    ok: true,
    listingId: String(listingId),
    requested: {
      imageIds: normalizedImageIds
    },
    updateResult,
    listing: refreshedListing,
    verification
  };
}
