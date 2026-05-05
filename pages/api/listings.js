async function safeJson(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Expected JSON but got ${response.status} ${response.statusText}: ${text.slice(0, 120)}`
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
  try {
    const token = await getAccessToken();

    const response = await fetch(
      "https://flex-integ-api.sharetribe.com/v1/integration_api/listings/query?per_page=20&include=images",
      {
        method: "GET",
        headers: {
          Authorization: `bearer ${token}`,
          Accept: "application/json"
        }
      }
    );

    const data = await safeJson(response);

    if (!response.ok) {
      throw new Error(`Listings failed: ${JSON.stringify(data)}`);
    }

    const included = data.included || [];

    const imageById = {};
    included.forEach((asset) => {
      if (asset.type === "image") {
        const id = asset.id?.uuid || asset.id;
        const variants = asset.attributes?.variants || {};

        imageById[id] =
          variants["landscape-crop"]?.url ||
          variants["landscape-crop2x"]?.url ||
          variants["scaled-small"]?.url ||
          variants["scaled-medium"]?.url ||
          variants["scaled-large"]?.url ||
          asset.attributes?.url;
      }
    });

    const listings = (data.data || [])
      .filter((item) => item.attributes?.state === "published")
      .map((item) => {
        const attrs = item.attributes || {};
        const publicData = attrs.publicData || {};
        const priceAmount = attrs.price?.amount;

        const id = item.id?.uuid || item.id;

        const slug = (attrs.slug || attrs.title || "equipment")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

        const firstImageId =
          item.relationships?.images?.data?.[0]?.id?.uuid ||
          item.relationships?.images?.data?.[0]?.id;

        return {
          title: attrs.title || "Equipment",
          type: publicData.category || publicData.type || "Equipment",
          hours: publicData.hours
            ? `${Number(publicData.hours).toLocaleString()} Hrs`
            : "",
          location:
            publicData.location ||
            publicData.cityState ||
            publicData.state ||
            "",
          price: priceAmount
            ? `$${Math.round(priceAmount / 100).toLocaleString()}`
            : "Call",
          image: imageById[firstImageId] || "/images/hero-equipment-yard.jpg",
          link: `https://staging.ironxchange.com/l/${slug}/${id}`
        };
      });

    res.status(200).json(listings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
