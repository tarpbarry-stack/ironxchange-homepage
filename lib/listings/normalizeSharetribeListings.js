// /lib/listings/normalizeSharetribeListings.js

import {
  normalizeMachineAccess,
  normalizeMachineChannel
} from "../machine-access/IXIMachineAccess";

function getId(value) {
  return value?.uuid || value || "";
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
  const variants =
    imageAsset?.attributes?.variants || {};

  return (
    variants["listing-card-2x"]?.url ||
    variants["listing-card"]?.url ||
    variants["landscape-crop2x"]?.url ||
    variants["landscape-crop"]?.url ||
    variants["scaled-large"]?.url ||
    variants["scaled-medium"]?.url ||
    variants["scaled-small"]?.url ||
    variants["square-small"]?.url ||
    Object.values(variants).find(
      variant => variant?.url
    )?.url ||
    imageAsset?.attributes?.url ||
    ""
  );
}

function getBestProfileLogoUrl(imageAsset) {
  const variants =
    imageAsset?.attributes?.variants || {};

  return (
    variants.default?.url ||
    variants["scaled-large"]?.url ||
    variants["scaled-medium"]?.url ||
    variants["scaled-small"]?.url ||
    variants["landscape-crop2x"]?.url ||
    variants["landscape-crop"]?.url ||
    Object.values(variants).find(
      variant => variant?.url
    )?.url ||
    imageAsset?.attributes?.url ||
    ""
  );
}

function getCategory(publicData = {}) {
  return (
    cleanLabel(
      publicData.category ||
      publicData.categoryLevel1 ||
      publicData.type
    ) ||
    "EQUIPMENT"
  );
}

function getMake(publicData = {}) {
  if (publicData.make) {
    return cleanLabel(publicData.make);
  }

  const makeRaw =
    publicData.categoryLevel2 || "";

  const categoryRaw =
    publicData.categoryLevel1 || "";

  return cleanLabel(
    String(makeRaw).replace(
      `${categoryRaw}-`,
      ""
    )
  );
}

function getModel(publicData = {}) {
  if (publicData.model) {
    return cleanLabel(publicData.model);
  }

  const modelRaw =
    publicData.categoryLevel3 || "";

  const makeRaw =
    publicData.categoryLevel2 || "";

  return cleanLabel(
    String(modelRaw).replace(
      `${makeRaw}-`,
      ""
    )
  );
}

function formatHours(value) {
  if (!value && value !== 0) {
    return "";
  }

  const cleaned = String(value)
    .replace(/,/g, "")
    .replace(/[^\d]/g, "");

  if (!cleaned) {
    return "";
  }

  return `${Number(cleaned).toLocaleString()} Hrs`;
}

function getLocation(publicData = {}) {
  const loc =
    publicData.location ||
    publicData.loc ||
    [publicData.city, publicData.state]
      .filter(Boolean)
      .join(", ");

  if (
    typeof loc === "string" &&
    loc.trim()
  ) {
    return loc.trim().toUpperCase();
  }

  return "Location available on request";
}

function getPrice(
  attributes = {},
  publicData = {}
) {
  if (publicData.callForPrice) {
    return "Call";
  }

  if (publicData.price) {
    const number = Number(
      String(publicData.price).replace(
        /[^0-9]/g,
        ""
      )
    );

    if (number) {
      return `$${number.toLocaleString()}`;
    }
  }

  const priceAmount =
    attributes.price?.amount;

  if (
    !priceAmount &&
    priceAmount !== 0
  ) {
    return "Call";
  }

  return `$${Math.round(
    priceAmount / 100
  ).toLocaleString()}`;
}

function normalizeExternalImageUrls(
  publicData = {}
) {
  const raw =
    publicData.imageUrls || [];

  if (Array.isArray(raw)) {
    return raw
      .map(url =>
        String(url || "").trim()
      )
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

function getProfileImage(
  author,
  logoById
) {
  const profileImageId =
    author?.relationships?.profileImage
      ?.data?.id?.uuid ||
    author?.relationships?.profileImage
      ?.data?.id;

  if (
    profileImageId &&
    logoById[profileImageId]
  ) {
    return logoById[profileImageId];
  }

  return "";
}

function getSellerInfo(
  author,
  logoById
) {
  const attributes =
    author?.attributes || {};

  const profile =
    attributes.profile || {};

  const publicData =
    profile.publicData || {};

  const protectedData =
    profile.protectedData || {};

  const companyName =
    publicData.companyName ||
    publicData.company ||
    publicData.dealerName ||
    publicData.businessName ||
    protectedData.companyName ||
    "";

  const displayName =
    profile.displayName ||
    attributes.name ||
    companyName ||
    [
      profile.firstName,
      profile.lastName
    ]
      .filter(Boolean)
      .join(" ") ||
    "Private Seller";

  const sellerLocation =
    publicData.location ||
    publicData.sellerLocation ||
    publicData.cityState ||
    publicData.loc ||
    protectedData.location ||
    "";

  const profileImage =
    getProfileImage(
      author,
      logoById
    );

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
        ? String(
            sellerLocation
          ).toUpperCase()
        : "",

    sellerWebsite:
      publicData.website || "",

    sellerFacebook:
      publicData.facebookUrl || "",

    sellerInstagram:
      publicData.instagramUrl || "",

    sellerLinkedin:
      publicData.linkedinUrl || "",

    sellerYoutube:
      publicData.youtubeUrl || "",

    sellerTiktok:
      publicData.tiktokUrl || "",

    sellerBio:
      publicData.bio ||
      publicData.companyBio ||
      "",

    sellerPhone:
      protectedData.phoneNumber ||
      publicData.phoneNumber ||
      "",

    sellerLogo: profileImage,
    profileImage,
    authorProfile: profile
  };
}

function buildSlug(
  attributes = {},
  id = ""
) {
  return (
    attributes.slug ||
    attributes.title ||
    id ||
    "equipment"
  )
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function normalizeSharetribeListings({
  data = [],
  included = []
} = {}) {
  const imageById = {};
  const logoById = {};
  const authorById = {};

  included.forEach(asset => {
    const id = getId(asset.id);

    if (!id) return;

    if (asset.type === "image") {
      const imageUrl =
        getBestImageUrl(asset);

      const logoUrl =
        getBestProfileLogoUrl(asset);

      if (imageUrl) {
        imageById[id] = imageUrl;
      }

      if (logoUrl) {
        logoById[id] = logoUrl;
      }
    }

    if (asset.type === "user") {
      authorById[id] = asset;
    }
  });

  return data.map(item => {
    const attributes =
      item.attributes || {};

    const publicData =
      attributes.publicData || {};

    const metadata =
      attributes.metadata || {};

    const id =
      getId(item.id);

    const authorId =
      item.relationships?.author
        ?.data?.id?.uuid ||
      item.relationships?.author
        ?.data?.id ||
      "";

    const author =
      authorId
        ? authorById[authorId]
        : null;

    const sellerInfo =
      getSellerInfo(
        author,
        logoById
      );

    const imageReferences =
      item.relationships?.images
        ?.data || [];

    const sharetribeImages =
      imageReferences
        .map(imageReference =>
          imageById[
            getId(imageReference.id)
          ]
        )
        .filter(Boolean);

    const imageObjects =
      imageReferences
        .map(
          (
            imageReference,
            index
          ) => {
            const imageId =
              getId(
                imageReference.id
              );

            const url =
              imageById[imageId];

            if (
              !imageId ||
              !url
            ) {
              return null;
            }

            return {
              imageId,
              url,
              source: "sharetribe",
              position: index,
              hero: index === 0
            };
          }
        )
        .filter(Boolean);

    const bulkImageUrls =
      normalizeExternalImageUrls(
        publicData
      );

    const finalImages =
      bulkImageUrls.length > 0
        ? bulkImageUrls
        : sharetribeImages;

    const imageUrl =
      finalImages[0] ||
      "/images/hero-equipment-yard.jpg";

    const createdAt =
      attributes.publishedAt ||
      attributes.createdAt ||
      attributes.created_at ||
      null;

    const slug =
      buildSlug(
        attributes,
        id
      );

    return {
      id,
      authorId,
      createdAt,

      sharetribeState:
        attributes.state || "",

      title:
        attributes.title ||
        "Equipment",

      type:
        getCategory(publicData),

      category:
        getCategory(publicData),

      make:
        getMake(publicData),

      model:
        getModel(publicData),

      year:
        publicData.year || "",

      hours:
        formatHours(
          publicData.hours
        ),

      location:
        getLocation(publicData),

      price:
        getPrice(
          attributes,
          publicData
        ),

      image: imageUrl,
      imageUrl,

      images: finalImages,
      imageUrls: finalImages,

      imageObjects,

      sharetribeImages,
      bulkImageUrls,

      description:
        publicData.description ||
        attributes.description ||
        "",

      publicData,
      metadata,

      machineAccess:
        normalizeMachineAccess(
          publicData.machineAccess ||
          metadata.machineAccess
        ),

      machineChannel:
        normalizeMachineChannel(
          publicData.machineChannel ||
          metadata.machineChannel
        ),

      keywords:
        Array.isArray(
          publicData.keywords
        )
          ? publicData.keywords
          : [],

      externalLinks:
        Array.isArray(
          publicData.externalLinks
        )
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

      serialNumber:
        publicData.serialNumber || "",

      condition:
        publicData.condition || "",

      ...sellerInfo,

      link:
        `/listing/${slug}`,

      stagingLink:
        `https://staging.ironxchange.com/l/${slug}/${id}`
    };
  });
}

export default normalizeSharetribeListings;
