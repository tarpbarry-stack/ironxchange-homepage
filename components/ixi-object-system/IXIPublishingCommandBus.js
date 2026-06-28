export const IXI_PUBLISHING_COMMANDS = {
  async saveListingDetails({
    listingId,
    hours = "",
    location = "",
    description = "",
    keywords = []
  }) {
    if (!listingId) {
      return { ok: false, error: "Missing listingId" };
    }

    const response = await fetch("/api/update-listing-details", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId,
        hours,
        location,
        description,
        keywords
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error || "Listing details update failed");
    }

    return { ok: true, data };
  },

  async saveListingPrice({
    listingId,
    price = ""
  }) {
    if (!listingId) {
      return { ok: false, error: "Missing listingId" };
    }

    const cleanPrice = String(price || "").replace(/[^0-9]/g, "");

    if (!cleanPrice) {
      return { ok: true, skipped: true };
    }

    const response = await fetch("/api/update-listing-price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId,
        price: cleanPrice
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error || "Listing price update failed");
    }

    return { ok: true, data };
  },

  async saveWorkflow({
    listingId,
    workflowStatus
  }) {
    if (!listingId) {
      return { ok: false, error: "Missing listingId" };
    }

    const response = await fetch("/api/update-listing-workflow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId,
        workflowStatus
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error || "Workflow update failed");
    }

    return { ok: true, data };
  },

  async saveExternalLinks({
    listingId,
    externalLinks = []
  }) {
    if (!listingId) {
      return { ok: false, error: "Missing listingId" };
    }

    const response = await fetch("/api/update-listing-external-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId,
        externalLinks
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error || "External links save failed");
    }

    return { ok: true, data };
  },

  async pauseListing({ listingId }) {
    if (!listingId) {
      return { ok: false, error: "Missing listingId" };
    }

    const response = await fetch("/api/pause-listing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error || "Pause failed");
    }

    return { ok: true, data };
  },

  async reactivateListing({ listingId }) {
    if (!listingId) {
      return { ok: false, error: "Missing listingId" };
    }

    const response = await fetch("/api/reactivate-listing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error || "Reactivate failed");
    }

    return { ok: true, data };
  },

  async deleteListing({ listingId }) {
    if (!listingId) {
      return { ok: false, error: "Missing listingId" };
    }

    const response = await fetch("/api/delete-listing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error || "Delete failed");
    }

    return { ok: true, data };
  }
};
