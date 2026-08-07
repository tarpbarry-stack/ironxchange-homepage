function clean(value = "") {
  return String(value || "").trim();
}

function getId(value) {
  return (
    value?.uuid ||
    value?.id?.uuid ||
    value?.id ||
    value ||
    ""
  );
}

function getBestImageUrl(image = {}) {
  const variants =
    image?.attributes?.variants ||
    image?.variants ||
    {};

  return (
    variants["scaled-large"]?.url ||
    variants["scaled-medium"]?.url ||
    variants.default?.url ||
    variants["landscape-crop"]?.url ||
    variants["landscape-crop2x"]?.url ||
    Object.values(variants).find(
      variant => variant?.url
    )?.url ||
    ""
  );
}

function formatHours(value) {
  if (!value && value !== 0) {
    return "";
  }

  const raw =
    String(value)
      .replace(/,/g, "")
      .replace(/[^\d]/g, "");

  if (!raw) {
    return "";
  }

  return `${Number(raw).toLocaleString()} Hrs`;
}

function formatPrice(
  attributes = {},
  publicData = {}
) {
  if (publicData.callForPrice) {
    return "Call for Price";
  }

  if (publicData.price) {
    const value =
      Number(
        String(publicData.price)
          .replace(/[^0-9]/g, "")
      );

    if (value) {
      return `$${value.toLocaleString()}`;
    }
  }

  const amount =
    attributes?.price?.amount;

  if (
    amount === null ||
    amount === undefined
  ) {
    return "Call for Price";
  }

  return `$${Math.round(
    Number(amount) / 100
  ).toLocaleString()}`;
}

function getLocation(publicData = {}) {
  const direct =
    publicData.machineLocation ||
    publicData.equipmentLocation ||
    publicData.listingLocation ||
    publicData.marketLocation ||
    publicData.location ||
    publicData.cityState ||
    "";

  if (
    typeof direct === "string" &&
    direct.trim()
  ) {
    return direct.trim();
  }

  const city =
    clean(
      publicData.city ||
      publicData.machineCity
    );

  const state =
    clean(
      publicData.state ||
      publicData.loc ||
      publicData.machineState
    );

  if (city && state) {
    return `${city}, ${state}`;
  }

  return city || state || "";
}

export function adaptMachineFilePayload(
  payload = {}
) {
  const machine =
    payload?.machine || {};

  const passport =
    machine?.passport || {};

  const resource =
    machine?.listing || {};

  const included =
    Array.isArray(machine?.included)
      ? machine.included
      : [];

  const attributes =
    resource?.attributes || {};

  const publicData =
    attributes?.publicData || {};

  const metadata =
    attributes?.metadata || {};

  const listingId =
    getId(resource?.id);

  const authorId =
    getId(
      resource?.relationships
        ?.author
        ?.data
        ?.id
    );

  const authorResource =
    included.find(item => {
      return (
        item?.type === "user" &&
        String(getId(item?.id)) ===
          String(authorId)
      );
    }) || null;

  const authorProfile =
    authorResource
      ?.attributes
      ?.profile || {};

  const sellerPublicData =
    authorProfile.publicData || {};

  const sellerProtectedData =
    authorProfile.protectedData || {};

  const profileImageId =
    getId(
      authorResource
        ?.relationships
        ?.profileImage
        ?.data
        ?.id
    );

  const profileImageResource =
    included.find(item => {
      return (
        item?.type === "image" &&
        String(getId(item?.id)) ===
          String(profileImageId)
      );
    }) || null;

  const sellerLogo =
    getBestImageUrl(
      profileImageResource
    );

  const machineImageRefs =
    Array.isArray(
      resource?.relationships
        ?.images
        ?.data
    )
      ? resource.relationships.images.data
      : [];

  const imageObjects =
    machineImageRefs
      .map((imageRef, index) => {
        const imageId =
          getId(imageRef?.id);

        const imageResource =
          included.find(item => {
            return (
              item?.type === "image" &&
              String(getId(item?.id)) ===
                String(imageId)
            );
          });

        const url =
          getBestImageUrl(
            imageResource
          );

        if (!imageId || !url) {
          return null;
        }

        return {
          imageId,
          url,
          source: "sharetribe",
          position: index,
          hero: index === 0,
          attributes:
            imageResource?.attributes ||
            {}
        };
      })
      .filter(Boolean);

  const images =
    imageObjects.map(
      image => image.url
    );

  const sellerName =
    clean(
      sellerPublicData.sellerName ||
      sellerPublicData.companyName ||
      authorProfile.displayName ||
      [
        authorProfile.firstName,
        authorProfile.lastName
      ]
        .filter(Boolean)
        .join(" ")
    ) ||
    "IronXchange Seller";

  const sellerCompany =
    clean(
      sellerPublicData.companyName ||
      sellerProtectedData.companyName ||
      authorProfile.abbreviatedName
    );

  const sellerLocation =
    clean(
      sellerPublicData.location ||
      sellerPublicData.sellerLocation ||
      sellerPublicData.cityState
    );

  return {
    id: listingId,

    passportId:
      clean(
        passport.passportId ||
        publicData.passportId
      ),

    passport,

    title:
      attributes.title ||
      "Equipment",

    description:
      attributes.description ||
      publicData.description ||
      "",

    year:
      publicData.year || "",

    make:
      publicData.make || "",

    model:
      publicData.model || "",

    category:
      publicData.category || "",

    type:
      publicData.category || "",

    hours:
      formatHours(
        publicData.hours
      ),

    price:
      formatPrice(
        attributes,
        publicData
      ),

    location:
      getLocation(
        publicData
      ),

    serialNumber:
      publicData.serialNumber ||
      "",

    stockNumber:
      publicData.stockNumber ||
      "",

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

    publicData,
    metadata,

    machineAccess:
      publicData.machineAccess ||
      metadata.machineAccess ||
      "",

    machineChannel:
      publicData.machineChannel ||
      metadata.machineChannel ||
      "",

    listingStatus:
      publicData.listingStatus ||
      metadata.listingStatus ||
      "",

    authorId,

    author:
      authorResource
        ? {
            ...authorResource,
            profile:
              authorProfile,
            attributes: {
              ...(
                authorResource.attributes ||
                {}
              ),
              profile:
                authorProfile,
              profileImage:
                profileImageResource
            }
          }
        : null,

    authorName:
      sellerName,

    sellerName,
    sellerCompany,
    companyName:
      sellerCompany,
    sellerLocation,

    sellerLogo,
    profileImage:
      sellerLogo,

    imageObjects,

    images,
    imageUrls:
      images,

    image:
      images[0] || "",
    imageUrl:
      images[0] || "",

    videoUrl:
      publicData.videoUrl ||
      ""
  };
}

export default adaptMachineFilePayload;
