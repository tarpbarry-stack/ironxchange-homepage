const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

const CONTENT_TYPE_BY_EXTENSION = Object.freeze({
  avif: "image/avif",
  heic: "image/heic",
  heif: "image/heif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp"
});

const EXTENSION_BY_CONTENT_TYPE = Object.freeze({
  "image/avif": "avif",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
});

export const IXI_AOS_MEDIA_MAX_IMAGE_BYTES = MAX_IMAGE_BYTES;
export const IXI_AOS_MEDIA_ACCEPT = ".jpg,.jpeg,.png,.webp,.avif,.heic,.heif";
export const IXI_AOS_MEDIA_ALLOWED_CONTENT_TYPES = Object.freeze(
  Object.values(CONTENT_TYPE_BY_EXTENSION)
);

function clean(value) {
  return String(value ?? "").trim();
}

function extensionOf(fileName = "") {
  const match = clean(fileName).toLowerCase().match(/\.([a-z0-9]+)$/u);
  return match?.[1] || "";
}

export function resolveIXIAosMediaContentType(file = {}) {
  const declared = clean(file?.type).split(";")[0].toLowerCase();
  if (IXI_AOS_MEDIA_ALLOWED_CONTENT_TYPES.includes(declared)) return declared;
  return CONTENT_TYPE_BY_EXTENSION[extensionOf(file?.name)] || "";
}

export function validateIXIAosMediaFile(file = {}) {
  const contentType = resolveIXIAosMediaContentType(file);
  const sizeBytes = Number(file?.size || 0);

  if (!contentType) {
    throw new Error("Use a JPG, JPEG, PNG, WebP, AVIF, HEIC, or HEIF image.");
  }

  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    throw new Error("The selected image is empty or unreadable.");
  }

  if (sizeBytes > MAX_IMAGE_BYTES) {
    throw new Error("The selected image exceeds the 20 MB limit.");
  }

  return {
    contentType,
    fileName: clean(file?.name) || `ixi-photo.${EXTENSION_BY_CONTENT_TYPE[contentType] || "jpg"}`,
    sizeBytes
  };
}

export function resolveIXIAosMediaIdentity(object = {}) {
  const objectId = clean(
    object?.objectId ||
    object?.id?.uuid ||
    object?.id ||
    object?.uuid
  );

  const passportIdentity = (Array.isArray(object?.identities) ? object.identities : [])
    .find(identity => clean(identity?.identityType || identity?.type).toLowerCase() === "ixi-passport");

  const passportId = clean(
    object?.passportId ||
    object?.passport?.passportId ||
    object?.identity?.passportId ||
    passportIdentity?.passportId
  );

  if (!objectId) {
    throw new Error("This AOS Object must be saved before a photo can be uploaded.");
  }

  return { machineId: objectId, passportId };
}

function mediaUrl(item = {}) {
  return clean(
    item?.display?.url ||
    item?.hero?.url ||
    item?.original?.url ||
    item?.thumb?.url
  );
}

export function mapIXIMediaManifestToAosMedia(manifest = {}) {
  const source = Array.isArray(manifest?.media) ? manifest.media : [];
  const byId = new Map(source.map(item => [clean(item?.mediaId), item]));
  const orderedIds = Array.isArray(manifest?.orderedMediaIds)
    ? manifest.orderedMediaIds.map(clean).filter(Boolean)
    : [];

  const ordered = [
    ...(manifest?.heroMediaId && byId.has(clean(manifest.heroMediaId))
      ? [byId.get(clean(manifest.heroMediaId))]
      : []),
    ...orderedIds.map(id => byId.get(id)).filter(Boolean),
    ...source
  ];

  const seen = new Set();

  return ordered.flatMap(item => {
    const mediaId = clean(item?.mediaId);
    const url = mediaUrl(item);
    if (!mediaId || !url || seen.has(mediaId)) return [];
    seen.add(mediaId);

    return [{
      mediaId,
      url,
      heroUrl: clean(item?.hero?.url),
      displayUrl: clean(item?.display?.url),
      thumbUrl: clean(item?.thumb?.url),
      originalUrl: clean(item?.original?.url),
      contentType: clean(item?.display?.contentType || item?.original?.contentType),
      width: Number(item?.display?.width || item?.hero?.width || 0),
      height: Number(item?.display?.height || item?.hero?.height || 0),
      source: "ixi-media",
      canonical: true,
      manifestVersion: Number(manifest?.mediaVersion || 0),
      machineId: clean(manifest?.machineId),
      passportId: clean(manifest?.passportId)
    }];
  });
}

export function isIXIAosStagedMedia(item = {}) {
  return Boolean(item?.pendingUpload && item?.file);
}
