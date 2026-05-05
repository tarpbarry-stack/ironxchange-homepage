async function getAccessToken() {
  const response = await fetch("https://flex-auth.sharetribe.com/v1/auth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.SHARETRIBE_CLIENT_ID,
      client_secret: process.env.SHARETRIBE_CLIENT_SECRET,
      scope: "integration_api"
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Auth failed: ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

export default async function handler(req, res) {
  try {
    const token = await getAccessToken();

    const response = await fetch(
      "https://flex-integ-api.sharetribe.com/v1/integration_api/listings/query?per_page=20&pub_status=published",
      {
        headers: {
          Authorization: `bearer ${token}`,
          Accept: "application/json"
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Listings failed: ${JSON.stringify(data)}`);
    }

    const listings = (data.data || []).map((item) => {
      const attrs = item.attributes || {};
      const publicData = attrs.publicData || {};
      const priceAmount = attrs.price?.amount;

      return {
        title: attrs.title || "Equipment",
        type: publicData.category || publicData.type || "Equipment",
        hours: publicData.hours ? `${publicData.hours} Hrs` : "",
        location:
          publicData.location ||
          publicData.cityState ||
          publicData.state ||
          "",
        price: priceAmount ? `$${Math.round(priceAmount / 100).toLocaleString()}` : "Call",
        image: "/images/hero-equipment-yard.jpg",
        link: `https://staging.ironxchange.com/l/${attrs.slug || item.id.uuid}/${item.id.uuid}`
      };
    });

    res.status(200).json(listings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
