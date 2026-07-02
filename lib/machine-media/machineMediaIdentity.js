// /lib/machine-media/machineMediaIdentity.js

export function getMachineMediaUrl(item) {
  if (!item) return "";

  if (typeof item === "string") return item;

  return (
    item.url ||
    item.src ||
    item.previewUrl ||
    item.originalUrl ||
    item.attributes?.variants?.["scaled-large"]?.url ||
    item.attributes?.variants?.["scaled-medium"]?.url ||
    item.attributes?.variants?.default?.url ||
    item.attributes?.variants?.["landscape-crop"]?.url ||
    item.attributes?.variants?.["scaled-small"]?.url ||
    ""
  );
}

export function getMachineMediaImageId(item) {
  if (!item) return "";

  const raw =
    item.imageId ||
    item.sharetribeImageId ||
    item.id?.uuid ||
    item.id ||
    item.uuid ||
    "";

  return raw ? String(raw) : "";
}

export function isExistingSharetribeMedia(item) {
  return Boolean(getMachineMediaImageId(item)) && !item?.file;
}

export function getActiveMachineMediaUrl(item) {
  if (!item) return "";

  if (item.activeMode === "dealerPop" && item.dealerPopUrl) {
    return item.dealerPopUrl;
  }

  if (item.activeMode === "clean" && item.cleanUrl) {
    return item.cleanUrl;
  }

  return (
    item.url ||
    item.originalUrl ||
    getMachineMediaUrl(item) ||
    ""
  );
}

export function getActiveMachineMediaFile(item) {
  if (!item) return null;

  if (item.activeMode === "dealerPop" && item.dealerPopFile) {
    return item.dealerPopFile;
  }

  if (item.activeMode === "clean" && item.cleanFile) {
    return item.cleanFile;
  }

  return item.file || item.originalFile || null;
}

export function buildExistingMachineMediaItem(item, index = 0) {
  const url = getMachineMediaUrl(item);
  const imageId = getMachineMediaImageId(item);

  return {
    id: imageId ? `existing-${imageId}` : `existing-${index}-${url}`,
    imageId,
    sharetribeImageId: imageId,

    url,
    originalUrl: url,
    cleanUrl: url,
    dealerPopUrl: url,

    file: null,
    originalFile: null,
    cleanFile: null,
    dealerPopFile: null,

    activeMode: "original",
    existing: true,
    status: "persisted"
  };
}

export function buildNewMachineMediaItem(item, index = 0) {
  const url = getActiveMachineMediaUrl(item);

  return {
    id:
      item.id ||
      `new-${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`,

    imageId: "",
    sharetribeImageId: "",

    url,
    originalUrl: item.originalUrl || url,
    cleanUrl: item.cleanUrl || url,
    dealerPopUrl: item.dealerPopUrl || url,

    file: item.file || item.originalFile || null,
    originalFile: item.originalFile || item.file || null,
    cleanFile: item.cleanFile || null,
    dealerPopFile: item.dealerPopFile || null,

    activeMode: item.activeMode || "original",
    existing: false,
    status: "local"
  };
}

export function createMachineMediaFromListing(listing = {}) {
  const rawImages =
    Array.isArray(listing?.imageObjects) && listing.imageObjects.length > 0
      ? listing.imageObjects
      : Array.isArray(listing?.images)
        ? listing.images
        : [];

  return rawImages
    .map((item, index) => buildExistingMachineMediaItem(item, index))
    .filter(item => item.url);
}

export function buildUrlMachineMediaItem(url, index = 0) {
  const cleanUrl = typeof url === "string" ? url.trim() : "";

  return {
    id: `url-${index}-${cleanUrl}`,

    imageId: "",
    sharetribeImageId: "",

    url: cleanUrl,
    originalUrl: cleanUrl,
    cleanUrl,
    dealerPopUrl: cleanUrl,

    file: null,
    originalFile: null,
    cleanFile: null,
    dealerPopFile: null,

    activeMode: "original",
    existing: false,
    status: "remote-url"
  };
}

export function createMachineMediaFromUrls(urls = []) {
  return urls
    .filter(Boolean)
    .map((url, index) => buildUrlMachineMediaItem(url, index))
    .filter(item => item.url);
}
