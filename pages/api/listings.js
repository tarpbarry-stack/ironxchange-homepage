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

function cleanLabel(value) {
  if (!value) return "";

  return String(value)
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .trim()
    .toUpperCase();
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

function getBestProfileLogoUrl(imageAsset) {
  const variants = imageAsset?.attributes?.variants || {};

  return (
    variants.default?.url ||
    variants["scaled-large"]?.url ||
    variants["scaled-medium"]?.url ||
    variants["scaled-small"]?.url ||
    variants["landscape-crop2x"]?.url ||
    variants["landscape-crop"]?.url ||
    Object.values(variants).find(v => v?.url)?.url ||
    imageAsset?.attributes?.url ||
    ""
  );
}

function formatCategory(value) {
  return cleanLabel(value) || "Equipment";
}

function getCategory(publicData) {
  return formatCategory(
    publicData.categoryLevel1 ||
      publicData.category ||
      publicData.type ||
      "Equipment"
  );
}

function getMake(publicData) {
  const makeRaw = publicData.categoryLevel2 || "";
  const categoryRaw = publicData.categoryLevel1 || "";

  return cleanLabel(String(makeRaw).replace(`${categoryRaw}-`, ""));
}

function getModel(publicData) {
  const modelRaw = publicData.categoryLevel3 || "";
  const makeRaw = publicData.categoryLevel2 || "";

  return cleanLabel(String(modelRaw).replace(`${makeRaw}-`, ""));
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

function getProfileImage(author, imageById) {
  const profileImageId =
    author?.relationships?.profileImage?.data?.id?.uuid ||
    author?.relationships?.profileImage?.data?.id;

  if (profileImageId && imageById[profileImageId]) {
    return imageById[profileImageId];
  }

  return "";
}

function getSellerInfo(author, imageById) {
  const attrs = author?.attributes || {};
  const profile = attrs.profile || {};
  const publicData = profile.publicData || {};
  const protectedData = profile.protectedData || {};

  const companyName =
    publicData.companyName ||
    publicData.company ||
    publicData.dealerName ||
    publicData.businessName ||
    protectedData.companyName ||
    "";

  const displayName =
    profile.displayName ||
    attrs.name ||
    companyName ||
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    "Private Seller";

  const sellerLocation =
    publicData.location ||
    publicData.sellerLocation ||
    publicData.cityState ||
    publicData.loc ||
    protectedData.location ||
    "";

  const profileImage = getProfileImage(author, imageById);

  return {
  sellerName:
    publicData.sellerName ||
    displayName ||
    "IronXchange Seller",

  sellerCompany:
    publicData.companyName ||
    companyName ||
    profile.abbreviatedName ||
    "",

  sellerLocation:
    sellerLocation
      ? String(sellerLocation).toUpperCase()
      : "",

  sellerLogo: profileImage,

  profileImage,

  authorProfile: profile
};
}

export default async function handler(req, res) {
  try {
    const token = await getAccessToken();

    const response = await fetch(
      "https://flex-integ-api.sharetribe.com/v1/integration_api/listings/query?per_page=100&include=images,author,author.profileImage",
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
    const authorById = {};

    included.forEach((asset) => {
      const id = getId(asset.id);
      if (!id) return;

      if (asset.type === "image") {
        const url = getBestImageUrl(asset);
        if (url) imageById[id] = url;
      }

      if (asset.type === "user") {
        authorById[id] = asset;
      }
    });

    const listings = (data.data || [])
      .filter((item) => item.attributes?.state === "published")
      .map((item) => {
        const attrs = item.attributes || {};
        const publicData = attrs.publicData || {};
        const id = getId(item.id);

        const authorId =
          item.relationships?.author?.data?.id?.uuid ||
          item.relationships?.author?.data?.id ||
          null;

        const author = authorId ? authorById[authorId] : null;
        const sellerInfo = getSellerInfo(author, imageById);

        const slug = (attrs.slug || attrs.title || "equipment")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

        const imageIds = item.relationships?.images?.data || [];

        const images = imageIds
          .map((imageRef) => imageById[getId(imageRef.id)])
          .filter(Boolean);

        const imageUrl = images[0] || "/images/hero-equipment-yard.jpg";

        return {
          id,
          authorId,
          createdAt: attrs.createdAt || attrs.created_at || null,
          title: attrs.title || "Equipment",
          type: getCategory(publicData),
          make: getMake(publicData),
          model: getModel(publicData),
          hours: formatHours(publicData.hours),
          location: getLocation(publicData),
          price: getPrice(attrs.price?.amount),
          image: imageUrl,
          imageUrl,
          images,
          imageUrls: images,
          description: attrs.description || "",
          publicData,
          ...sellerInfo,
          link: `https://staging.ironxchange.com/l/${slug}/${id}`
        };
      });

    res.status(200).json(listings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
