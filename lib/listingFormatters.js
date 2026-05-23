export function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getListingId(item = {}) {
  return item?.id?.uuid || item?.id || item?.uuid || item?.link || item?.title || "";
}

export function getListingHref(item = {}, from = "browse") {
  return `/listing/${slugify(item.title || "listing")}?from=${from}`;
}

export function cleanMachineTitle(title = "") {
  return String(title)
    .replace(/\s*[-–]?\s*\d{1,5}(,\d{3})*\s*(HRS|Hrs|hrs|Hours|hours)\b/g, "")
    .replace(/\s*[-–]\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function toNumber(value) {
  const raw = String(value || "").replace(/[^0-9]/g, "");
  return raw ? Number(raw) : null;
}

export function formatHours(value) {
  const num = toNumber(value);
  return num ? `${num.toLocaleString()} hrs` : "";
}

export function getCardImages(item = {}) {
  return [
    ...(Array.isArray(item.images) ? item.images : []),
    ...(Array.isArray(item.imageUrls) ? item.imageUrls : []),
    item.imageUrl,
    item.image,
  ].filter(Boolean);
}

export function getListingKeywords(item = {}) {
  const raw =
    item?.keywords ||
    item?.tags ||
    item?.publicData?.keywords ||
    item?.attributes?.publicData?.keywords ||
    [];

  if (Array.isArray(raw)) return raw.filter(Boolean).map(String);

  if (typeof raw === "string") {
    return raw
      .split(",")
      .map(keyword => keyword.trim())
      .filter(Boolean);
  }

  return [];
}

export function getFeatureLine(item = {}) {
  return [...new Set(getListingKeywords(item))]
    .slice(0, 4)
    .join(" • ");
}
