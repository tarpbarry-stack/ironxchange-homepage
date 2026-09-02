import integrationSdk from "sharetribe-flex-integration-sdk";

function getId(value) {
  return String(
    value?.uuid || value?.id?.uuid || value?.id || value || ""
  ).trim();
}

function getImageUrl(image = {}) {
  const variants = image?.attributes?.variants || {};

  return (
    variants["scaled-large"]?.url ||
    variants["landscape-crop2x"]?.url ||
    variants["landscape-crop"]?.url ||
    variants.default?.url ||
    variants["scaled-medium"]?.url ||
    variants["scaled-small"]?.url ||
    ""
  );
}

function normalizePrice(price) {
  const amount = Number(price?.amount);
  if (!Number.isFinite(amount) || amount <= 0) return "";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: price?.currency || "USD",
    maximumFractionDigits: 0
  }).format(amount / 100);
}

export function normalizeDistributionListing({
  listing,
  included = []
}) {
  const attributes = listing?.attributes || {};
  const publicData = attributes.publicData || {};
  const authorId = getId(
    listing?.relationships?.author?.data?.id
  );
  const author = included.find(
    item => item?.type === "user" && getId(item?.id) === authorId
  );
  const profile = author?.attributes?.profile || {};
  const sellerPublicData = profile.publicData || {};
  const sellerProtectedData = profile.protectedData || {};
  const profileImageId = getId(
    author?.relationships?.profileImage?.data?.id
  );
  const imageMap = new Map(
    included
      .filter(item => item?.type === "image")
      .map(image => [getId(image?.id), image])
  );
  const images = (
    listing?.relationships?.images?.data || []
  )
    .map(image => getImageUrl(imageMap.get(getId(image?.id))))
    .filter(Boolean);

  return {
    id: getId(listing?.id),
    title: String(attributes.title || "").trim(),
    description: String(
      attributes.description || publicData.description || ""
    ).trim(),
    state: String(attributes.state || "").trim().toLowerCase(),
    deleted: Boolean(attributes.deleted),
    price: normalizePrice(attributes.price),
    year: String(publicData.year || "").trim(),
    make: String(publicData.make || "").trim(),
    model: String(publicData.model || "").trim(),
    hours: String(publicData.hours || "").trim(),
    location: String(
      publicData.location || publicData.loc || ""
    ).trim(),
    serialNumber: String(publicData.serialNumber || "").trim(),
    stockNumber: String(
      publicData.stockNumber || publicData.sellerReference || ""
    ).trim(),
    passportId: String(publicData.passportId || "").trim(),
    passportUrl: String(publicData.passportUrl || "").trim(),
    images,
    imageUrls: images,
    imageUrl: images[0] || "",
    sellerName: String(
      sellerPublicData.sellerName || profile.displayName || ""
    ).trim(),
    sellerCompany: String(
      sellerPublicData.companyName ||
        sellerProtectedData.companyName ||
        ""
    ).trim(),
    sellerLocation: String(
      sellerPublicData.sellerLocation ||
        sellerPublicData.location ||
        sellerPublicData.cityState ||
        ""
    ).trim(),
    sellerPhone: String(
      sellerProtectedData.phoneNumber ||
        sellerPublicData.phoneNumber ||
        ""
    ).trim(),
    sellerEmail: String(
      author?.attributes?.email ||
        sellerProtectedData.email ||
        sellerPublicData.email ||
        ""
    ).trim(),
    sellerLogo: profileImageId
      ? getImageUrl(imageMap.get(profileImageId))
      : "",
    publicData,
    attributes: {
      ...attributes,
      publicData
    }
  };
}

export async function loadDistributionListing(listingId) {
  const id = getId(listingId);

  if (!/^[a-zA-Z0-9-]{8,80}$/u.test(id)) {
    const error = new Error("A valid Marketplace listing is required.");
    error.code = "INVALID_LISTING_ID";
    error.status = 400;
    throw error;
  }

  const clientId = process.env.SHARETRIBE_CLIENT_ID;
  const clientSecret = process.env.SHARETRIBE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    const error = new Error(
      "Marketplace listing access is not configured."
    );
    error.code = "LISTING_ACCESS_MISCONFIGURED";
    error.status = 500;
    throw error;
  }

  try {
    const sdk = integrationSdk.createInstance({
      clientId,
      clientSecret
    });
    const response = await sdk.listings.show(
      {
        id,
        include: ["author", "author.profileImage", "images"]
      },
      { expand: true }
    );
    const rawListing = response?.data?.data;

    if (!rawListing) {
      const error = new Error("The listing was not found.");
      error.code = "LISTING_NOT_FOUND";
      error.status = 404;
      throw error;
    }

    const listing = normalizeDistributionListing({
      listing: rawListing,
      included: response?.data?.included || []
    });

    if (listing.state !== "published" || listing.deleted) {
      const error = new Error(
        "This machine is not available for public distribution."
      );
      error.code = "LISTING_NOT_PUBLIC";
      error.status = 409;
      throw error;
    }

    return listing;
  } catch (error) {
    if (error?.code && error?.status) throw error;

    const status = Number(error?.status || error?.statusCode);
    if (status === 404) {
      const notFound = new Error("The listing was not found.");
      notFound.code = "LISTING_NOT_FOUND";
      notFound.status = 404;
      throw notFound;
    }

    const lookupError = new Error(
      "The Marketplace listing could not be loaded for email."
    );
    lookupError.code = "LISTING_LOOKUP_FAILED";
    lookupError.status = 502;
    lookupError.retryable = true;
    throw lookupError;
  }
}

export default loadDistributionListing;
