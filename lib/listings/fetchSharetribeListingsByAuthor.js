// /lib/listings/fetchSharetribeListingsByAuthor.js

async function safeJson(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Expected JSON but got ${response.status}: ${text.slice(0, 120)}`
    );
  }
}

async function getIntegrationAccessToken() {
  const response = await fetch(
    "https://flex-api.sharetribe.com/v1/auth/token",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded; charset=utf-8",
        Accept: "application/json"
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.SHARETRIBE_CLIENT_ID,
        client_secret:
          process.env.SHARETRIBE_CLIENT_SECRET,
        scope: "integ"
      })
    }
  );

  const payload = await safeJson(response);

  if (!response.ok) {
    throw new Error(
      `Sharetribe authentication failed: ${JSON.stringify(payload)}`
    );
  }

  return payload.access_token;
}

export async function fetchSharetribeListingsByAuthor(
  authorId
) {
  if (!authorId) {
    throw new Error(
      "fetchSharetribeListingsByAuthor requires authorId"
    );
  }

  const token =
    await getIntegrationAccessToken();

  const allListings = [];
  const allIncluded = [];

  let page = 1;
  let totalPages = 1;

  do {
    const params = new URLSearchParams({
      authorId: String(authorId),
      per_page: "100",
      page: String(page),
      include: "images,author,author.profileImage"
    });

    const response = await fetch(
      `https://flex-integ-api.sharetribe.com/v1/integration_api/listings/query?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json"
        }
      }
    );

    const payload = await safeJson(response);

    if (!response.ok) {
      throw new Error(
        `Author listings request failed on page ${page}: ${JSON.stringify(payload)}`
      );
    }

    allListings.push(
      ...(Array.isArray(payload.data)
        ? payload.data
        : [])
    );

    allIncluded.push(
      ...(Array.isArray(payload.included)
        ? payload.included
        : [])
    );

    totalPages =
      payload.meta?.totalPages ||
      payload.meta?.total_pages ||
      page;

    page += 1;
  } while (page <= totalPages);

  return {
    data: allListings,
    included: allIncluded
  };
}

export default fetchSharetribeListingsByAuthor;
