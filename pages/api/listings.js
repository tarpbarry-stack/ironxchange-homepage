import {
  normalizeMachineAccess,
  normalizeMachineChannel
} from "../../lib/machine-access/IXIMachineAccess";
import {
  compactMarketplaceListing
} from "../../lib/listings/compactMarketplaceListing";
import {
  getCache,
  waitUntil
} from "@vercel/functions";

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

async function buildListingsCatalogue() {
    const timings = {};
    const totalStartedAt = Date.now();
    const tokenStartedAt = Date.now();

    // This is a public, read-only catalogue endpoint. Reusing the Sharetribe
    // integration token avoids paying for an authentication round trip on
    // every Marketplace, Saved, Yard and Launch navigation.
    const token = await getAccessToken({
      useCache: true
    });

    timings.tokenMs = Date.now() - tokenStartedAt;

    const firstPageStartedAt = Date.now();

    const firstPage =
      await fetchListingsPage(
        token,
        1
      );

    timings.firstPageMs = Date.now() - firstPageStartedAt;

    const totalPages = Number(
      firstPage.meta?.totalPages ||
      firstPage.meta?.total_pages ||
      1
    );

    const remainingPages = [];
    const remainingPagesStartedAt = Date.now();

    if (totalPages > 1) {
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
    }

    timings.remainingPagesMs =
      Date.now() - remainingPagesStartedAt;

    const normalizeStartedAt = Date.now();

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

        const passportId =
          publicData.passportId ||
          publicData.ixiMedia?.passportId ||
          "";

        const stockNumber =
          publicData.stockNumber ||
          publicData.sellerReference ||
          metadata.sellerReference ||
          "";

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

          imageCount: finalImages.length,

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

          stockNumber,
          serialNumber: publicData.serialNumber || "",
          condition: publicData.condition || "",

          passportId,
          passportUrl: publicData.passportUrl || "",
          ixiMediaMachineKey:
            publicData.ixiMedia?.machineKey ||
            publicData.ixiMediaMachineKey ||
            "",

          ...sellerInfo,

          link: `/listing/${slug}`,
          stagingLink: `https://staging.ironxchange.com/l/${slug}/${id}`
        };
      });

    timings.normalizeMs = Date.now() - normalizeStartedAt;
    timings.totalMs = Date.now() - totalStartedAt;

    return {
      listings,
      timings
    };
}

const BROWSE_CACHE_KEY = "card-catalogue-v3";
const BROWSE_CACHE_FRESH_MS = 60 * 1000;
const BROWSE_CACHE_TTL_SECONDS = 7 * 24 * 60 * 60;
const BROWSE_CACHE_MAX_BYTES = 1_800_000;

let browseRefreshPromise = null;
let browseMemoryFallback = null;

function getBrowseRuntimeCache() {
  return getCache({
    namespace: "ixi-marketplace"
  });
}

async function readBrowseCatalogueCache() {
  try {
    const cached = await getBrowseRuntimeCache().get(BROWSE_CACHE_KEY);
    return cached || browseMemoryFallback;
  } catch (error) {
    console.warn(JSON.stringify({
      level: "warn",
      message: "marketplace_runtime_cache_read_failed",
      error: error?.message || String(error)
    }));

    return browseMemoryFallback;
  }
}

async function writeBrowseCatalogueCache(entry) {
  browseMemoryFallback = entry;

  const bytes = Buffer.byteLength(
    JSON.stringify(entry.listings),
    "utf8"
  );

  if (bytes > BROWSE_CACHE_MAX_BYTES) {
    console.warn(JSON.stringify({
      level: "warn",
      message: "marketplace_runtime_cache_item_too_large",
      bytes
    }));
    return;
  }

  try {
    await getBrowseRuntimeCache().set(
      BROWSE_CACHE_KEY,
      entry,
      {
        ttl: BROWSE_CACHE_TTL_SECONDS,
        tags: ["marketplace-listings"],
        name: "IXI marketplace compact card catalogue"
      }
    );
  } catch (error) {
    console.warn(JSON.stringify({
      level: "warn",
      message: "marketplace_runtime_cache_write_failed",
      error: error?.message || String(error)
    }));
  }
}

function refreshBrowseCatalogue() {
  if (browseRefreshPromise) return browseRefreshPromise;

  browseRefreshPromise = buildListingsCatalogue()
    .then(async result => {
      const entry = {
        listings: result.listings.map(compactMarketplaceListing),
        cachedAt: Date.now(),
        timings: result.timings
      };

      await writeBrowseCatalogueCache(entry);
      return entry;
    })
    .finally(() => {
      browseRefreshPromise = null;
    });

  return browseRefreshPromise;
}

function scheduleBrowseRefresh() {
  const refresh = refreshBrowseCatalogue().catch(error => {
    console.error(JSON.stringify({
      level: "error",
      message: "marketplace_background_refresh_failed",
      error: error?.message || String(error)
    }));
  });

  try {
    waitUntil(refresh);
  } catch {
    // Local Next.js execution does not always provide a request waitUntil
    // context. The in-process promise still refreshes the development cache.
  }
}

function setCatalogueResponseHeaders(res, {
  projection,
  cacheStatus,
  timings = {}
}) {
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=604800, stale-if-error=604800"
  );
  res.setHeader(
    "Vercel-CDN-Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=604800, stale-if-error=604800"
  );
  res.setHeader("X-IXI-Listings-Projection", projection);
  res.setHeader("X-IXI-Catalog-Cache", cacheStatus);

  const serverTiming = [
    ["cache", timings.cacheReadMs],
    ["auth", timings.tokenMs],
    ["sharetribe_page_1", timings.firstPageMs],
    ["sharetribe_remaining", timings.remainingPagesMs],
    ["normalize", timings.normalizeMs]
  ]
    .filter(([, duration]) => Number.isFinite(duration))
    .map(([name, duration]) => `${name};dur=${Math.max(0, duration)}`)
    .join(", ");

  if (serverTiming) {
    res.setHeader("Server-Timing", serverTiming);
  }
}

export default async function handler(req, res) {
  const requestStartedAt = Date.now();
  const requestId = String(
    req.headers["x-vercel-id"] ||
    req.headers["x-request-id"] ||
    ""
  );

  try {
    const isBrowseCardProjection =
      req.query.surface === "browse-v2" &&
      req.query.projection === "card";

    let responseListings;
    let timings = {};
    let cacheStatus = "bypass";

    if (isBrowseCardProjection) {
      const cacheReadStartedAt = Date.now();
      const cached = await readBrowseCatalogueCache();
      const cacheReadMs = Date.now() - cacheReadStartedAt;
      const cacheAgeMs = cached?.cachedAt
        ? Date.now() - Number(cached.cachedAt)
        : Number.POSITIVE_INFINITY;

      if (Array.isArray(cached?.listings)) {
        responseListings = cached.listings;
        timings = { cacheReadMs };
        cacheStatus = cacheAgeMs <= BROWSE_CACHE_FRESH_MS
          ? "hit"
          : "stale";

        if (cacheStatus === "stale") {
          scheduleBrowseRefresh();
        }
      } else {
        const refreshed = await refreshBrowseCatalogue();
        responseListings = refreshed.listings;
        timings = {
          ...(refreshed.timings || {}),
          cacheReadMs
        };
        cacheStatus = "miss";
      }
    } else {
      const result = await buildListingsCatalogue();
      responseListings = result.listings;
      timings = result.timings;
    }

    setCatalogueResponseHeaders(res, {
      projection: isBrowseCardProjection ? "card" : "full",
      cacheStatus,
      timings
    });

    console.log(JSON.stringify({
      level: "info",
      message: "marketplace_catalogue_served",
      requestId,
      cacheStatus,
      projection: isBrowseCardProjection ? "card" : "full",
      count: responseListings.length,
      durationMs: Date.now() - requestStartedAt,
      timings
    }));

    return res.status(200).json(responseListings);
  } catch (err) {
    console.error(JSON.stringify({
      level: "error",
      message: "marketplace_catalogue_failed",
      requestId,
      error: err?.message || String(err),
      durationMs: Date.now() - requestStartedAt
    }));

    return res.status(500).json({
      error: err.message || "Listings API failed"
    });
  }
}
