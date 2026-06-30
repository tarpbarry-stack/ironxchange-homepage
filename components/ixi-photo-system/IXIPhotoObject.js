export const IXI_PHOTO_STATES = {
  NEW: "new",
  PROCESSING: "processing",
  READY: "ready",
  PERSISTED: "persisted",
  VERIFIED: "verified",
  ERROR: "error"
};

export function createPhotoObject({
  id = "",
  original = "",
  position = 0,
  hero = false
}) {
  const now = new Date().toISOString();

  return {
    id: String(id),

    position,

    hero: Boolean(hero),

    state: IXI_PHOTO_STATES.NEW,

    variants: {
      original,
      clean: "",
      dealerPop: "",
      passport: "",
      thumbnail: ""
    },

    metadata: {
      uploadedAt: now,
      updatedAt: now,
      orientation: "",
      width: 0,
      height: 0
    }
  };
}

export function updatePhotoObject(
  photo = {},
  patch = {}
) {
  return {
    ...photo,

    ...patch,

    metadata: {
      ...(photo.metadata || {}),
      updatedAt: new Date().toISOString(),
      ...(patch.metadata || {})
    }
  };
}
