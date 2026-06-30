export function getSharetribeImageId(media = {}) {
  return (
    media?.sharetribeImageId ||
    media?.imageId ||
    media?.id?.uuid ||
    media?.image?.id?.uuid ||
    media?.image?.id ||
    null
  );
}

export function getMediaUrl(media = {}) {
  return (
    media?.url ||
    media?.previewUrl ||
    media?.originalUrl ||
    media?.attributes?.variants?.["scaled-large"]?.url ||
    media?.attributes?.variants?.["scaled-medium"]?.url ||
    media?.attributes?.variants?.default?.url ||
    media?.attributes?.variants?.["landscape-crop"]?.url ||
    media?.attributes?.variants?.["scaled-small"]?.url ||
    null
  );
}

export function getMediaFile(media = {}) {
  const mode = media?.activeMode || media?.variant || "original";

  if (mode === "dealerPop") {
    return media?.dealerPopFile || media?.file || null;
  }

  if (mode === "clean") {
    return media?.cleanFile || media?.file || null;
  }

  return media?.originalFile || media?.file || null;
}

export function isExistingOriginalMedia(media = {}) {
  const imageId = getSharetribeImageId(media);
  const mode = media?.activeMode || media?.variant || "original";

  return Boolean(imageId && mode === "original" && !media?.file);
}

export function createStableMediaKey(media = {}, index = 0) {
  const imageId = getSharetribeImageId(media);
  const url = getMediaUrl(media);

  if (imageId) return `sharetribe-${imageId}`;
  if (media?.id) return String(media.id);
  if (url) return `url-${index}-${url}`;

  return `local-${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`;
}
