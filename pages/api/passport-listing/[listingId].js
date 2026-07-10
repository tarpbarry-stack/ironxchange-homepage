// /pages/api/passport-listing/[listingId].js

const integrationSdk = require(
  "sharetribe-flex-integration-sdk"
);

function extractError(error) {
  return (
    error?.data?.errors?.[0]?.title ||
    error?.data?.errors?.[0]?.detail ||
    error?.data?.errors?.[0]?.code ||
    error?.message ||
    "Machine lookup failed"
  );
}

function getUuid(value) {
  return (
    value?.uuid ||
    value?.id?.uuid ||
    value?.id ||
    value ||
    ""
  );
}

function getImageUrl(image = {}) {
  const variants =
    image?.attributes?.variants || {};

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

function normalizeMoney(price) {
  const amount = Number(price?.amount || 0);

  if (!amount) {
    return "";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: price?.currency || "USD",
    maximumFractionDigits: 0
  }).format(amount / 100);
}

function normalizeListing({
  listing,
  included
}) {
  const attributes =
    listing?.attributes || {};

  const publicData =
    attributes?.publicData || {};

  const authorRelationshipId =
    getUuid(
      listing?.relationships?.author?.data?.id
    );

  const imageRelationshipIds =
    (
      listing?.relationships?.images?.data || []
    ).map(image => getUuid(image?.id));

  const includedImages = included.filter(
    item => item?.type === "image"
  );

  /*
   * Preserve the exact Sharetribe image order from the
   * listing relationship instead of relying on the
   * unordered included array.
   */
  const imageMap = new Map(
    includedImages.map(image => [
      getUuid(image?.id),
      image
    ])
  );

  const imageObjects = imageRelationshipIds
    .map(imageId => imageMap.get(imageId))
    .filter(Boolean);

  const imageUrls = imageObjects
    .map(getImageUrl)
    .filter(Boolean);

  const author = included.find(
    item =>
      item?.type === "user" &&
      getUuid(item?.id) === authorRelationshipId
  );

  const profile =
    author?.attributes?.profile || {};

  const sellerPublicData =
    profile?.publicData || {};

  const sellerProtectedData =
    profile?.protectedData || {};

  return {
    id: getUuid(listing?.id),
    authorId: authorRelationshipId,

    title: attributes.title || "",
    description:
      attributes.description ||
      publicData.description ||
      "",

    state: attributes.state || "",
    deleted: Boolean(attributes.deleted),

    price: normalizeMoney(attributes.price),

    year: String(publicData.year || ""),
    make: publicData.make || "",
    model: publicData.model || "",
    hours: String(publicData.hours || ""),

    category:
      publicData.category ||
      publicData.categoryLevel1 ||
      "",

    location:
      publicData.location ||
      publicData.loc ||
      "",

    serialNumber:
      publicData.serialNumber || "",

    stockNumber:
      publicData.stockNumber ||
      publicData.sellerReference ||
      "",

    keywords: Array.isArray(publicData.keywords)
      ? publicData.keywords
      : [],

    externalLinks: Array.isArray(
      publicData.externalLinks
    )
      ? publicData.externalLinks
      : [],

    passportId:
      publicData.passportId || "",

    passportUrl:
      publicData.passportUrl || "",

    imageObjects,
    images: imageUrls,
    imageUrls,
    imageUrl: imageUrls[0] || "",

    sellerName:
      sellerPublicData.sellerName ||
      profile.displayName ||
      "",

    sellerCompany:
      sellerPublicData.companyName ||
      sellerProtectedData.companyName ||
      "",

    companyName:
      sellerPublicData.companyName ||
      sellerProtectedData.companyName ||
      "",

    sellerLocation:
      sellerPublicData.sellerLocation ||
      sellerPublicData.location ||
      sellerPublicData.cityState ||
      "",

    authorLocation:
      sellerPublicData.location ||
      sellerPublicData.cityState ||
      "",

    sellerPhone:
      sellerProtectedData.phoneNumber ||
      "",

    authorName:
      profile.displayName || "",

    author: {
      id: authorRelationshipId,
      attributes: {
        profile
      },
      profile
    },

    publicData,
    attributes: {
      ...attributes,
      publicData
    }
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  const { listingId } = req.query;

  if (!listingId) {
    return res.status(400).json({
      ok: false,
      error: "listingId is required"
    });
  }

  const clientId =
    process.env.SHARETRIBE_CLIENT_ID;

  const clientSecret =
    process.env.SHARETRIBE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      ok: false,
      error:
        "Sharetribe Integration credentials are missing"
    });
  }

  const sdk = integrationSdk.createInstance({
    clientId,
    clientSecret
  });

  try {
    const response = await sdk.listings.show(
      {
        id: listingId,
        include: ["author", "images"]
      },
      {
        expand: true
      }
    );

    const rawListing =
      response?.data?.data;

    const included =
      response?.data?.included || [];

    if (!rawListing) {
      return res.status(404).json({
        ok: false,
        error: "Machine listing was not found"
      });
    }

    const listing = normalizeListing({
      listing: rawListing,
      included
    });

    return res.status(200).json({
      ok: true,
      listing
    });
  } catch (error) {
    console.error(
      "PASSPORT LISTING LOOKUP ERROR:",
      {
        listingId,
        error: extractError(error)
      }
    );

    const candidateStatus =
      Number(
        error?.status ||
        error?.statusCode ||
        error?.data?.status
      );

    const status =
      Number.isInteger(candidateStatus) &&
      candidateStatus >= 400 &&
      candidateStatus <= 599
        ? candidateStatus
        : 500;

    return res.status(status).json({
      ok: false,
      error: extractError(error)
    });
  }
}
