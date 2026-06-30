export const IXI_PHOTO_MUTATION_COMMANDS = {
  async updateListingPhotos({
    listingId,
    imageIds = []
  }) {
    if (!listingId) {
      return {
        ok: false,
        error: "Missing listingId"
      };
    }

    const response = await fetch("/api/update-listing-photos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        listingId,
        imageIds
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.ok === false) {
      throw new Error(data?.error || "Photo update failed");
    }

    return data;
  }
};
