export function getPublicData(listing = {}) {
  return listing?.attributes?.publicData || listing?.publicData || {};
}

export function getListingId(listing = {}) {
  return listing?.id?.uuid || listing?.id || listing?.uuid || "";
}

export function getListingSlug(listing = {}) {
  return listing?.attributes?.slug || listing?.slug || getListingId(listing);
}

export function getListingHref(listing = {}) {
  return `/listing/${getListingSlug(listing)}`;
}

export function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\bundefined\b/gi, "")
    .replace(/\bnull\b/gi, "")
    .trim();
}

export function formatHours(value) {
  if (value === null || value === undefined || value === "") return "Hours not listed";

  const raw = String(value).replace(/[^\d]/g, "");
  if (!raw) return "Hours not listed";

  return `${Number(raw).toLocaleString()} hrs`;
}

export function formatPrice(listing = {}) {
  const price = listing?.attributes?.price || listing?.price;

  if (!price) return "Call for price";

  const amount = typeof price === "object" ? price.amount : price;
  if (!amount) return "Call for price";

  const dollars = amount > 999999 ? amount / 100 : amount;

  return `$${Number(dollars).toLocaleString()}`;
}

export function getListingTitle(listing = {}) {
  const pd = getPublicData(listing);

  const generated = cleanText(
    [pd.year, pd.make, pd.model].filter(Boolean).join(" ")
  );

  const title = cleanText(listing?.attributes?.title || listing?.title || generated);

  return title || "Equipment Listing";
}

export function getLocation(listing = {}) {
  const pd = getPublicData(listing);
  return cleanText(pd.location || listing?.location) || "Location not listed";
}

export function getFeatureLine(listing = {}) {
  const pd = getPublicData(listing);

  return [
    pd.category,
    pd.stockNumber ? `Stock # ${pd.stockNumber}` : null,
    pd.serialNumber ? `Serial # ${pd.serialNumber}` : null,
  ]
    .filter(Boolean)
    .join(" • ");
}

export function isAuctionListing(listing = {}) {
  const pd = getPublicData(listing);
  return Boolean(pd.auctionEventId || pd.auctionDate || pd.auctionType);
}

export function getAuctionMeta(listing = {}) {
  const pd = getPublicData(listing);

  return {
    auctionType: pd.auctionType || "",
    auctionDate: pd.auctionDate || "",
    auctionStartTime: pd.auctionStartTime || "",
    auctionEndTime: pd.auctionEndTime || "",
    estimateLow: pd.estimateLow || "",
    estimateHigh: pd.estimateHigh || "",
  };
}

export function getListingImages(listing = {}) {
  const rawImages =
    listing?.images ||
    listing?.relationships?.images?.data ||
    listing?.includedImages ||
    [];

  return rawImages
    .map(img => {
      return (
        img?.attributes?.variants?.default?.url ||
        img?.attributes?.variants?.["landscape-crop"]?.url ||
        img?.attributes?.variants?.["landscape-crop2x"]?.url ||
        img?.attributes?.variants?.square?.url ||
        img?.url ||
        img
      );
    })
    .filter(Boolean);
}
