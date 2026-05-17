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

async function getAccessToken() {
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
        client_secret: process.env.SHARETRIBE_CLIENT_SECRET,
        scope: "integ"
      })
    }
  );

  const data = await safeJson(response);

  if (!response.ok) {
    throw new Error(`Auth failed: ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { listingId, price } = req.body;

    if (!listingId || !price) {
      return res.status(400).json({
        error: "Missing listingId or price"
      });
    }

    const token = await getAccessToken();

    const response = await fetch(
      `https://flex-integ-api.sharetribe.com/v1/integration_api/listings/${listingId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/vnd.api+json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          data: {
            type: "listing",
            id: listingId,
            attributes: {
              price: {
                amount: Number(
                  String(price).replace(/,/g, "")
                ) * 100,
                currency: "USD"
              }
            }
          }
        })
      }
    );

    const data = await safeJson(response);

    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }

    res.status(200).json({
      ok: true
    });
  } catch (err) {
    console.error("PRICE UPDATE ERROR:", err);

    res.status(500).json({
      error: err.message
    });
  }
}
