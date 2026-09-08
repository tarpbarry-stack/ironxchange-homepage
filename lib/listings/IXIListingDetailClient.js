const detailRequests = new Map();
const DETAIL_RETRY_DELAY_MS = 250;

function waitForDetailRetry() {
  return new Promise(resolve => {
    setTimeout(resolve, DETAIL_RETRY_DELAY_MS);
  });
}

async function requestListingDetails(id, retry = true) {
  try {
    const response = await fetch(
      `/api/passport-listing/${encodeURIComponent(id)}`
    );
    const payload = await response.json();

    if (!response.ok || !payload?.ok) {
      const error = new Error(
        payload?.error ||
        `Listing details failed (${response.status})`
      );

      error.status = response.status;
      throw error;
    }

    if (!payload.listing) {
      throw new Error(
        "Listing details response did not contain a listing"
      );
    }

    return payload.listing;
  } catch (error) {
    if (
      !retry ||
      (Number(error?.status) >= 400 && Number(error?.status) < 500)
    ) {
      throw error;
    }

    await waitForDetailRetry();
    return requestListingDetails(id, false);
  }
}

export async function loadIXIListingDetails(listingId) {
  const id = String(listingId || "").trim();

  if (!id) return null;

  if (!detailRequests.has(id)) {
    const request = requestListingDetails(id)
      .catch(error => {
        detailRequests.delete(id);
        throw error;
      });

    detailRequests.set(id, request);
  }

  return detailRequests.get(id);
}

export default loadIXIListingDetails;
