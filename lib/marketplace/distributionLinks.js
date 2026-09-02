function clean(value = "") {
  return String(value ?? "").trim();
}

export function getMarketplaceDistributionListingId(listing = {}) {
  listing = listing || {};

  return clean(
    listing?.id?.uuid ||
      (typeof listing?.id === "string" ? listing.id : "") ||
      listing?.listingId?.uuid ||
      listing?.listingId ||
      listing?.uuid ||
      listing?.sourceId
  );
}

function slugify(value = "") {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "");
}

function getPublicData(listing = {}) {
  listing = listing || {};
  return listing.publicData || listing.attributes?.publicData || {};
}

export function getMarketplaceDistributionUrl(
  listing = {},
  origin = ""
) {
  listing = listing || {};
  const publicData = getPublicData(listing);
  const passportId = clean(
    listing.passportId || publicData.passportId
  );
  const cleanOrigin = clean(origin).replace(/\/+$/u, "");

  if (passportId) {
    return `${cleanOrigin}/p/${encodeURIComponent(passportId)}`;
  }

  const listingId = getMarketplaceDistributionListingId(listing);
  if (!listingId) return "";

  const title =
    listing.title || listing.attributes?.title || "listing";
  const slug = slugify(title) || "listing";
  const query = new URLSearchParams({
    listingId,
    from: "browse"
  });

  return `${cleanOrigin}/listing/${slug}?${query.toString()}`;
}

export function buildMarketplaceDistributionText(
  listing = {},
  shareUrl = ""
) {
  listing = listing || {};
  const publicData = getPublicData(listing);
  const title = clean(
    listing.title || listing.attributes?.title || "Equipment listing"
  );
  const hours = clean(listing.hours || publicData.hours);
  const price = clean(listing.price || publicData.price);
  const location = clean(listing.location || publicData.location);
  const details = [
    hours ? `${hours} hours` : "",
    price,
    location
  ].filter(Boolean);

  return [title, details.join(" • "), shareUrl]
    .filter(Boolean)
    .join("\n");
}

export function buildMarketplaceSmsHref(text = "") {
  return `sms:?&body=${encodeURIComponent(text)}`;
}

export function buildMarketplaceWhatsAppHref(text = "") {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
