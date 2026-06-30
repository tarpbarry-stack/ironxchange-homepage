export function cleanIXINumber(value = "") {
  return String(value || "").replace(/[^0-9]/g, "");
}

export async function safeSharetribeJson(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Expected JSON but got ${response.status}: ${text.slice(0, 160)}`
    );
  }
}

export async function getSharetribeIntegrationToken() {
  const response = await fetch("https://flex-api.sharetribe.com/v1/auth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
      Accept: "application/json"
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.SHARETRIBE_CLIENT_ID,
      client_secret: process.env.SHARETRIBE_CLIENT_SECRET,
      scope: "integ"
    })
  });

  const data = await safeSharetribeJson(response);

  if (!response.ok) {
    throw new Error(`Sharetribe auth failed: ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

export async function updateSharetribeListing({
  token,
  listingId,
  patch = {}
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
        ...patch
      })
    }
  );

  const data = await safeSharetribeJson(response);

  if (!response.ok) {
    throw new Error(`Sharetribe listing update failed: ${JSON.stringify(data)}`);
  }

  return data;
}

export async function fetchSharetribeListing({
  token,
  listingId
}) {
  if (!token) throw new Error("Missing Sharetribe token");
  if (!listingId) throw new Error("Missing listingId");

  const response = await fetch(
    `https://flex-integ-api.sharetribe.com/v1/integration_api/listings/show?id=${encodeURIComponent(
      String(listingId)
    )}`,
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
    throw new Error(`Sharetribe listing fetch failed: ${JSON.stringify(data)}`);
  }

  return data;
}

function getSharetribeListingData(response = {}) {
  return response?.data?.data || response?.data || response || {};
}

function getSharetribePublicData(listing = {}) {
  return listing?.attributes?.publicData || listing?.publicData || {};
}

function getSharetribeDescription(listing = {}) {
  return listing?.attributes?.description || listing?.description || "";
}

function getSharetribePriceAmount(listing = {}) {
  return (
    listing?.attributes?.price?.amount ||
    listing?.price?.amount ||
    listing?.price ||
    ""
  );
}

export function buildMachineFactsPatch({
  title,
  price,
  hours,
  location,
  description,
  keywords = []
}) {
  const publicData = {};

  const cleanHours = cleanIXINumber(hours);
  const cleanPrice = cleanIXINumber(price);

  if (cleanHours) {
    publicData.hours = Number(cleanHours);
  }

  if (typeof location === "string") {
    publicData.location = location;
    publicData.city = location;
  }

  if (typeof description === "string") {
    publicData.description = description;
    publicData.details = description;
  }

  if (Array.isArray(keywords)) {
    publicData.keywords = keywords;
  }

  const patch = {
    publicData
  };

  if (typeof description === "string") {
    patch.description = description;
  }

  if (typeof title === "string" && title.trim()) {
    patch.title = title.trim();
  }

  if (cleanPrice) {
    patch.price = {
      amount: Number(cleanPrice) * 100,
      currency: "USD"
    };

    publicData.price = Number(cleanPrice);
  }

  return patch;
}

export function verifyMachineFacts({
  requested = {},
  listingResponse = {}
}) {
  const listing = getSharetribeListingData(listingResponse);
  const publicData = getSharetribePublicData(listing);

  const failures = [];

  const requestedPrice = cleanIXINumber(requested.price);
  const requestedHours = cleanIXINumber(requested.hours);

  if (requestedPrice) {
    const actualPriceAmount = Number(getSharetribePriceAmount(listing));
    const expectedPriceAmount = Number(requestedPrice) * 100;

    if (actualPriceAmount !== expectedPriceAmount) {
      failures.push({
        field: "price",
        expected: expectedPriceAmount,
        actual: actualPriceAmount
      });
    }
  }

  if (requestedHours) {
    const actualHours = Number(publicData.hours);

    if (actualHours !== Number(requestedHours)) {
      failures.push({
        field: "hours",
        expected: Number(requestedHours),
        actual: actualHours
      });
    }
  }

  if (typeof requested.location === "string") {
    const actualLocation =
      publicData.location ||
      publicData.city ||
      "";

    if (String(actualLocation) !== String(requested.location)) {
      failures.push({
        field: "location",
        expected: requested.location,
        actual: actualLocation
      });
    }
  }

    if (typeof requested.description === "string") {
    const actualDescription =
      getSharetribeDescription(listing) ||
      publicData.description ||
      publicData.details ||
      "";

    if (String(actualDescription) !== String(requested.description)) {
      failures.push({
        field: "description",
        expected: requested.description,
        actual: actualDescription
      });
    }
  }

  if (Array.isArray(requested.keywords)) {
    const expectedKeywords = requested.keywords.map(String).sort();

    const actualKeywords = Array.isArray(publicData.keywords)
      ? publicData.keywords.map(String).sort()
      : [];

    if (JSON.stringify(actualKeywords) !== JSON.stringify(expectedKeywords)) {
      failures.push({
        field: "keywords",
        expected: expectedKeywords,
        actual: actualKeywords
      });
    }
  }

  return {
    ok: failures.length === 0,
    failures
  };
}

export async function updateMachineFactsVerified({
  listingId,
  title,
  price,
  hours,
  location,
  description,
  keywords = []
}) {
  if (!listingId) throw new Error("Missing listingId");

  const token = await getSharetribeIntegrationToken();

  const requested = {
    title,
    price,
    hours,
    location,
    description,
    keywords
  };

  const patch = buildMachineFactsPatch(requested);

  const updateResult = await updateSharetribeListing({
    token,
    listingId,
    patch
  });

  const refreshedListing = await fetchSharetribeListing({
    token,
    listingId
  });

    const verification = verifyMachineFacts({
    requested,
    listingResponse: refreshedListing
  });

  if (!verification.ok) {
    throw new Error(
      `Sharetribe verification failed: ${JSON.stringify(
        verification.failures
      )}`
    );
  }

  return {
    ok: true,
    listingId: String(listingId),
    requested,
    updateResult,
    listing: refreshedListing,
    verification
  };
}
