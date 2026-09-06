const detailRequests = new Map();

export async function loadIXIListingDetails(listingId) {
  const id = String(listingId || "").trim();

  if (!id) return null;

  if (!detailRequests.has(id)) {
    const request = fetch(
      `/api/passport-listing/${encodeURIComponent(id)}`
    )
      .then(async response => {
        const payload = await response.json();

        if (!response.ok || !payload?.ok) {
          throw new Error(
            payload?.error ||
            `Listing details failed (${response.status})`
          );
        }

        return payload.listing || null;
      })
      .catch(error => {
        detailRequests.delete(id);
        throw error;
      });

    detailRequests.set(id, request);
  }

  return detailRequests.get(id);
}

export default loadIXIListingDetails;
