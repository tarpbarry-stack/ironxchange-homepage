async function safeJson(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Expected JSON but got ${response.status} ${response.statusText}: ${text.slice(0, 200)}`
    );
  }
}

async function getAccessToken() {
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

  const data = await safeJson(response);

  if (!response.ok) {
    throw new Error(`Auth failed: ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      listingId,
      message,
      buyerName,
      buyerEmail,
      buyerPhone
    } = req.body || {};

    if (!listingId) {
      return res.status(400).json({
        error: "Missing listingId"
      });
    }

    if (!message) {
      return res.status(400).json({
        error: "Missing message"
      });
    }

    const token = await getAccessToken();

    const response = await fetch(
      "https://flex-api.sharetribe.com/v1/api/transactions/initiate",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },

        body: JSON.stringify({
          processAlias: "default-inquiry/release-1",

          transition: "transition/inquire-without-payment",

          params: {
            listingId,

            protectedData: {
              message,
              buyerName: buyerName || "",
              buyerEmail: buyerEmail || "",
              buyerPhone: buyerPhone || ""
            }
          }
        })
      }
    );

    const data = await safeJson(response);

    if (!response.ok) {
      console.error("SHARETRIBE ERROR:", data);

      return res.status(response.status).json({
        error: "Sharetribe inquiry failed",
        details: data
      });
    }

    return res.status(200).json({
      ok: true,
      transaction: data
    });
  } catch (err) {
    console.error("SERVER ERROR:", err);

    return res.status(500).json({
      error: err.message
    });
  }
}
