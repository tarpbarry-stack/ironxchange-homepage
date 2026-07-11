// /lib/passport/buildPassportPresentation.js

function clean(value = "") {
  return String(value ?? "").trim();
}

function firstValue(...values) {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      clean(value) !== ""
    ) {
      return value;
    }
  }

  return "";
}

function normalizeImageUrl(image = "") {
  if (!image) return "";

  if (typeof image === "string") {
    return clean(image);
  }

  return clean(
    image.url ||
    image.src ||
    image.attributes?.variants?.["scaled-large"]?.url ||
    image.attributes?.variants?.["landscape-crop"]?.url ||
    image.attributes?.variants?.default?.url ||
    ""
  );
}

function collectImages(listing = {}, publicData = {}) {
  const possibleCollections = [
    listing.images,
    listing.photos,
    listing.photoUrls,
    publicData.images,
    publicData.photos,
    publicData.photoUrls
  ];

  const urls = [];

  for (const collection of possibleCollections) {
    if (!Array.isArray(collection)) continue;

    for (const image of collection) {
      const url = normalizeImageUrl(image);

      if (url && !urls.includes(url)) {
        urls.push(url);
      }
    }
  }

  const standaloneImages = [
    listing.heroPhoto,
    listing.heroImage,
    listing.image,
    listing.imageUrl,
    publicData.heroPhoto,
    publicData.heroImage,
    publicData.image,
    publicData.imageUrl
  ];

  for (const image of standaloneImages.reverse()) {
    const url = normalizeImageUrl(image);

    if (url && !urls.includes(url)) {
      urls.unshift(url);
    }
  }

  return urls;
}

function normalizePrice(value) {
  if (
    value === undefined ||
    value === null ||
    clean(value) === ""
  ) {
    return "Call for price";
  }

  if (typeof value === "number") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(value);
  }

  if (typeof value === "object") {
    const amount =
      value.amount ??
      value.value ??
      value.attributes?.amount;

    if (typeof amount === "number") {
      const normalizedAmount =
        amount > 1000000 ? amount / 100 : amount;

      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
      }).format(normalizedAmount);
    }
  }

  const raw = clean(value);

  if (!raw) {
    return "Call for price";
  }

  if (/^\$/.test(raw)) {
    return raw;
  }

  const digits = raw.replace(/[^\d.]/g, "");
  const numeric = Number(digits);

  if (Number.isFinite(numeric) && numeric > 0) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(numeric);
  }

  return raw;
}

export function buildPassportPresentation({
  listing = {},
  passport = {},
  baseUrl = "https://preview.ironxchange.com"
} = {}) {
  const attributes = listing.attributes || {};
  const publicData =
    listing.publicData ||
    attributes.publicData ||
    {};

  const passportId = clean(
    firstValue(
      passport.passportId,
      listing.passportId,
      publicData.passportId
    )
  );

  const year = clean(
    firstValue(
      passport.year,
      listing.year,
      publicData.year
    )
  );

  const make = clean(
    firstValue(
      passport.make,
      listing.make,
      publicData.make
    )
  );

  const model = clean(
    firstValue(
      passport.model,
      listing.model,
      publicData.model
    )
  );

  const title =
    [year, make, model]
      .filter(Boolean)
      .join(" ") ||
    clean(
      firstValue(
        passport.title,
        listing.title,
        attributes.title,
        "Machine"
      )
    );

  const images = collectImages(listing, publicData);

  const heroPhoto =
    normalizeImageUrl(passport.heroPhoto) ||
    normalizeImageUrl(passport.heroImage) ||
    images[0] ||
    "";

  const supportingPhotos = images
    .filter(url => url && url !== heroPhoto)
    .slice(0, 4);

  return {
    passportId,

    passportUrl: passportId
      ? `${baseUrl.replace(/\/$/, "")}/p/${passportId}`
      : "",

    title,
    year,
    make,
    model,

    hours: clean(
      firstValue(
        passport.hours,
        listing.hours,
        publicData.hours
      )
    ),

    price: normalizePrice(
      firstValue(
        passport.price,
        listing.price,
        publicData.price
      )
    ),

    location: clean(
      firstValue(
        passport.location,
        listing.location,
        listing.loc,
        publicData.location,
        publicData.loc
      )
    ),

    serialNumber: clean(
      firstValue(
        passport.serialNumber,
        listing.serialNumber,
        publicData.serialNumber
      )
    ),

    stockNumber: clean(
      firstValue(
        passport.stockNumber,
        listing.stockNumber,
        publicData.stockNumber
      )
    ),

    description: clean(
      firstValue(
        passport.description,
        listing.description,
        attributes.description,
        publicData.description,
        publicData.details,
        "Machine bio not listed."
      )
    ),

    heroPhoto,

    supportingPhotos,

    gallery: [
      heroPhoto,
      ...supportingPhotos
    ].filter(Boolean),

    seller: {
  name:
    listing.sellerName ||
    listing.sellerCompany ||
    listing.companyName ||
    publicData.sellerName ||
    publicData.sellerCompany ||
    publicData.companyName ||
    "",

  logo:
    listing.sellerLogo ||
    listing.profileImage ||
    listing.logo ||
    publicData.sellerLogo ||
    publicData.profileImage ||
    publicData.logo ||
    "",

  location:
    listing.sellerLocation ||
    publicData.sellerLocation ||
    publicData.companyLocation ||
    "",

  phone:
    listing.sellerPhone ||
    publicData.sellerPhone ||
    publicData.phone ||
    "",

  email:
    listing.sellerEmail ||
    publicData.sellerEmail ||
    publicData.email ||
    ""
}
  };
}

export default buildPassportPresentation;
