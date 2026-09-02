import {
  normalizeMachineAccess,
  normalizeMachineChannel
} from "../../lib/machine-access/IXIMachineAccess";

let accessTokenCache = null;
let accessTokenExpiresAt = 0;
let accessTokenPromise = null;

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

async function getAccessToken({
  useCache = false
} = {}) {
  if (!useCache) {
    return requestAccessToken();
  }

  if (
    accessTokenCache &&
    Date.now() < accessTokenExpiresAt
  ) {
    return accessTokenCache;
  }

  if (accessTokenPromise) {
    return accessTokenPromise;
  }

  accessTokenPromise =
    requestAccessToken({
      cacheResult: true
    });

  try {
    return await accessTokenPromise;
  } finally {
    accessTokenPromise = null;
  }
}

async function requestAccessToken({
  cacheResult = false
} = {}) {
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

  if (cacheResult) {
    accessTokenCache =
      data.access_token;

    accessTokenExpiresAt =
      Date.now() +
      Math.max(
        (
          Number(data.expires_in) ||
          300
        ) * 1000 - 30000,
        30000
      );
  }

  return data.access_token;
}

async function fetchListingsPage(
  token,
  page
) {
  const response = await fetch(
    `https://flex-integ-api.sharetribe.com/v1/integration_api/listings/query?per_page=100&page=${page}&include=images,author,author.profileImage`,
    {
      method: "GET",
      headers: {
        Authorization:
          `Bearer ${token}`,
        Accept: "application/json"
      }
    }
  );

  const pageData =
    await safeJson(response);

  if (!response.ok) {
    throw new Error(
      `Listings failed on page ${page}: ${JSON.stringify(pageData)}`
    );
  }

  return pageData;
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
    Object.values(variants).find(variant => variant?.url)?.url ||
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

function getCategory(publicData = {}) {
  return formatCategory(
    publicData.category ||
      publicData.categoryLevel1 ||
      publicData.type ||
      "Equipment"
  );
}

function getMake(publicData = {}) {
  if (publicData.make) {
    return cleanLabel(publicData.make);
  }

  const makeRaw = publicData.categoryLevel2 || "";
  const categoryRaw = publicData.categoryLevel1 || "";

  return cleanLabel(String(makeRaw).replace(`${categoryRaw}-`, ""));
}

function getModel(publicData = {}) {
  if (publicData.model) {
    return cleanLabel(publicData.model);
  }

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

function getLocation(publicData = {}) {
  const loc =
    publicData.location ||
    publicData.loc ||
    [publicData.city, publicData.state].filter(Boolean).join(", ");

  if (typeof loc === "string" && loc.trim()) {
    return loc.trim().toUpperCase();
  }

  return "Location available on request";
}

function getPrice(attrs = {}, publicData = {}) {
  if (publicData.callForPrice) return "Call";

  if (publicData.price) {
    const num = Number(String(publicData.price).replace(/[^0-9]/g, ""));
    if (num) return `$${num.toLocaleString()}`;
  }

  const priceAmount = attrs.price?.amount;

  if (!priceAmount && priceAmount !== 0) return "Call";

  return `$${Math.round(priceAmount / 100).toLocaleString()}`;
}

function normalizeExternalImageUrls(publicData = {}) {
  const raw = publicData.imageUrls || [];

  if (Array.isArray(raw)) {
    return raw
      .map(url => String(url || "").trim())
      .filter(Boolean);
  }

  if (typeof raw === "string") {
    return raw
      .split(",")
      .map(url => url.trim())
      .filter(Boolean);
  }

  return [];
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

    sellerLocation: sellerLocation ? String(sellerLocation).toUpperCase() : "",

    sellerWebsite: publicData.website || "",
    sellerFacebook: publicData.facebookUrl || "",
    sellerInstagram: publicData.instagramUrl || "",
    sellerLinkedin: publicData.linkedinUrl || "",
    sellerYoutube: publicData.youtubeUrl || "",
    sellerTiktok: publicData.tiktokUrl || "",
    sellerBio: publicData.bio || publicData.companyBio || "",
    sellerPhone: protectedData.phoneNumber || publicData.phoneNumber || "",

    sellerLogo: profileImage,
    profileImage,
    authorProfile: profile
  };
}

function buildSlug(attrs = {}, id = "") {
  return (attrs.slug || attrs.title || id || "equipment")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default async function handler(req, res) {
  try {
    const marketplaceBrowsePerformance =
      req.query.surface ===
        "browse-v2";

    const token = await getAccessToken({
      useCache:
        marketplaceBrowsePerformance
    });

    const firstPage =
      await fetchListingsPage(
        token,
        1
      );

    const totalPages = Number(
      firstPage.meta?.totalPages ||
      firstPage.meta?.total_pages ||
      1
    );

    const remainingPages = [];

    if (totalPages > 1) {
      if (marketplaceBrowsePerformance) {
        remainingPages.push(
          ...await Promise.all(
            Array.from(
              {
                length:
                  totalPages - 1
              },
              (_, index) =>
                fetchListingsPage(
                  token,
                  index + 2
                )
            )
          )
        );
      } else {
        for (
          let page = 2;
          page <= totalPages;
          page += 1
        ) {
          remainingPages.push(
            await fetchListingsPage(
              token,
              page
            )
          );
        }
      }
    }

    const pages = [
      firstPage,
      ...remainingPages
    ];

    const allData = pages.flatMap(
      page => page.data || []
    );

    const allIncluded = pages.flatMap(
      page => page.included || []
    );

    console.log("IX LISTINGS FETCHED:", allData.length);

    const data = {
      data: allData,
      included: allIncluded
    };

    const included = data.included || [];
    const imageById = {};
    const logoById = {};
    const authorById = {};

    included.forEach(asset => {
      const id = getId(asset.id);
      if (!id) return;

      if (asset.type === "image") {
        const url = getBestImageUrl(asset);
        const logoUrl = getBestProfileLogoUrl(asset);

        if (url) imageById[id] = url;
        if (logoUrl) logoById[id] = logoUrl;
      }

      if (asset.type === "user") {
        authorById[id] = asset;
      }
    });

    const listings = (data.data || [])
      .filter(item => {
  const attrs = item.attributes || {};
  const publicData = attrs.publicData || {};
  const metadata = attrs.metadata || {};

  const listingStatus =
    publicData.listingStatus ||
    metadata.listingStatus ||
    "";

  const machineAccess = normalizeMachineAccess(
    publicData.machineAccess ||
    metadata.machineAccess
  );

  const machineChannel = normalizeMachineChannel(
    publicData.machineChannel ||
    metadata.machineChannel
  );

  return (
    attrs.state === "published" &&
    listingStatus !== "deleted" &&
    listingStatus !== "archived" &&
    machineAccess === "public" &&
    machineChannel === "marketplace"
  );
})
      .map(item => {
        const attrs = item.attributes || {};
        const publicData = attrs.publicData || {};
        const metadata = attrs.metadata || {};
        const id = getId(item.id);

        const authorId =
          item.relationships?.author?.data?.id?.uuid ||
          item.relationships?.author?.data?.id ||
          null;

        const author = authorId ? authorById[authorId] : null;
        const sellerInfo = getSellerInfo(author, logoById);

        const slug = buildSlug(attrs, id);

        const imageIds = item.relationships?.images?.data || [];

        const sharetribeImages = imageIds
          .map(imageRef => imageById[getId(imageRef.id)])
          .filter(Boolean);

const sharetribeImageObjects = imageIds
  .map((imageRef, index) => {
    const imageId = getId(imageRef.id);
    const url = imageById[imageId];

    if (!imageId || !url) return null;

    return {
      imageId,
      url,
      source: "sharetribe",
      position: index,
      hero: index === 0
    };
  })
  .filter(Boolean);
        

        const bulkImageUrls = normalizeExternalImageUrls(publicData);

        const finalImages =
          bulkImageUrls.length > 0
            ? bulkImageUrls
            : sharetribeImages;

        const imageUrl =
          finalImages[0] ||
          "/images/hero-equipment-yard.jpg";

        return {
          id,
          authorId,

          createdAt: attrs.createdAt || attrs.created_at || null,

          title: attrs.title || "Equipment",

          type: getCategory(publicData),
          category: getCategory(publicData),

          make: getMake(publicData),
          model: getModel(publicData),

          year: publicData.year || "",
          hours: formatHours(publicData.hours),

          location: getLocation(publicData),

          price: getPrice(attrs, publicData),

          image: imageUrl,
          imageUrl,

          images: finalImages,
imageUrls: finalImages,

imageObjects: sharetribeImageObjects,

sharetribeImages,
bulkImageUrls,

          description:
            publicData.description ||
            attrs.description ||
            "",

         publicData,
metadata,

machineAccess: normalizeMachineAccess(
  publicData.machineAccess ||
  metadata.machineAccess
),

machineChannel: normalizeMachineChannel(
  publicData.machineChannel ||
  metadata.machineChannel
),

keywords: Array.isArray(publicData.keywords)
            ? publicData.keywords
            : [],

          externalLinks: Array.isArray(publicData.externalLinks)
            ? publicData.externalLinks
            : [],

          listingStatus:
            publicData.listingStatus ||
            metadata.listingStatus ||
            "live",

          workflowStatus:
            publicData.workflowStatus ||
            metadata.workflowStatus ||
            "good-listing",

          sellerReference:
            publicData.sellerReference ||
            publicData.stockNumber ||
            metadata.sellerReference ||
            "",

          serialNumber: publicData.serialNumber || "",
          condition: publicData.condition || "",

          ...sellerInfo,

          link: `/listing/${slug}`,
          stagingLink: `https://staging.ironxchange.com/l/${slug}/${id}`
        };
      });

    res.status(200).json(listings);
  } catch (err) {
    console.error("LISTINGS API ERROR:", err);

    res.status(500).json({
      error: err.message || "Listings API failed"
    });
  }
}
