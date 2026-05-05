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

function getId(value) {
  return value?.uuid || value;
}

function getBestImageUrl(imageAsset) {
  const variants = imageAsset?.attributes?.variants || {};

  return (
    variants["listing-card-2x"]?.url ||
    variants["listing-card"]?.url ||
    variants["landscape-crop2x"]?.url ||
    variants["landscape-crop"]?.url ||
    variants["scaled-large"]?.url ||
    variants["scaled-medium"]?.url ||
    variants["scaled-small"]?.url ||
    variants["square-small"]?.url ||
    Object.values(variants).find((variant) => variant?.url)?.url ||
    imageAsset?.attributes?.url ||
    ""
  );
}

function formatCategory(value) {
  if (!value) return "Equipment";

  if (typeof value === "string") {
    return value
      .replace(/-/g, " ")
      .replace(/_/g, " ")
      .trim()
      .toUpperCase();
  }

  if (value.label) return String(value.label).toUpperCase();
  if (value.key) return String(value.key).replace(/-/g, " ").toUpperCase();

  return "Equipment";
}

function getCategory(publicData) {
  return formatCategory(
    publicData.categoryLevel1 ||
      publicData.category ||
      publicData.type ||
      "Equipment"
  );
}

function formatHours(value) {
  if (!value && value !== 0) return "";

  const cleaned = String(value).replace(/,/g, "").replace(/[^\d]/g, "");
  if (!cleaned) return "";

  return `${Number(cleaned).toLocaleString()} Hrs`;
}

function getLocation(publicData) {
  const loc = publicData.loc;

  if (typeof loc === "string" && loc.trim()) {
    return loc.trim().toUpperCase();
  }

  return "Location available on request";
}

function getPrice(priceAmount) {
  if (!priceAmount && priceAmount !== 0) return "Call";
  return `$${Math.round(priceAmount / 100).toLocaleString()}`;
}

export default async function handler(req, res) {
  try {
    const token = await getAccessToken();

    const response = await fetch(
      "https://flex-integ-api.sharetribe.com/v1/integration_api/listings/query?per_page=100&include=images",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
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
      if (asset.type !== "image") return;

      const id = getId(asset.id);
      const url = getBestImageUrl(asset);

      if (id && url) {
        imageById[id] = url;
      }
    });

    const listings = (data.data || [])
      .filter((item) => item.attributes?.state === "published")
      .map((item) => {
        const attrs = item.attributes || {};
        const publicData = attrs.publicData || {};
        const id = getId(item.id);

        const slug = (attrs.slug || attrs.title || "equipment")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

        const firstImageId = getId(item.relationships?.images?.data?.[0]?.id);

        const imageUrl =
          imageById[firstImageId] || "/images/hero-equipment-yard.jpg";

        return {
          id,
          title: attrs.title || "Equipment",
          type: getCategory(publicData),
          hours: formatHours(publicData.hours),
          location: getLocation(publicData),
          price: getPrice(attrs.price?.amount),
          image: imageUrl,
          imageUrl,
          link: `https://staging.ironxchange.com/l/${slug}/${id}`
        };
      });

    res.status(200).json(listings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
