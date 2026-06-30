export function getUpdatedPhotoMutationMessages({
  beforeImageIds = [],
  afterImageIds = []
}) {
  const before = Array.isArray(beforeImageIds)
    ? beforeImageIds.map(String).filter(Boolean)
    : [];

  const after = Array.isArray(afterImageIds)
    ? afterImageIds.map(String).filter(Boolean)
    : [];

  const messages = [];

  if (before.length !== after.length) {
    messages.push("PHOTOS UPDATED");
  } else if (JSON.stringify(before) !== JSON.stringify(after)) {
    messages.push("PHOTO ORDER UPDATED");
  }

  if (!messages.length) {
    messages.push("PHOTOS VERIFIED");
  }

  return messages;
}

export async function updateListingPhotos({
  commandBus,
  listingId,
  beforeImageIds = [],
  afterImageIds = [],
  context = ""
}) {
  if (!listingId) {
    throw new Error("Missing listingId");
  }

  if (!commandBus?.updateListingPhotos) {
    throw new Error("Missing updateListingPhotos command");
  }

  const result = await commandBus.updateListingPhotos({
    listingId,
    imageIds: afterImageIds
  });

  const notices = getUpdatedPhotoMutationMessages({
    beforeImageIds,
    afterImageIds
  });

  return {
    ok: true,
    command: "UPDATE_LISTING_PHOTOS",
    context,
    listingId: String(listingId),
    requested: {
      imageIds: afterImageIds
    },
    result,
    listing: result?.listing,
    verification: result?.verification,
    notices
  };
}
