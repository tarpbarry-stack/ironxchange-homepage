// /lib/machine-media/machineMediaSharetribeAdapter.js

import {
  getActiveMachineMediaFile,
  getMachineMediaImageId
} from "./machineMediaIdentity";

function getUUIDFactory(sdk) {
  const UUID =
    sdk?.types?.UUID ||
    sdk?.sdkTypes?.UUID ||
    sdk?.types?.uuid ||
    null;

  if (UUID) return UUID;

  throw new Error("Machine Media save failed: Sharetribe UUID type unavailable.");
}

function toSharetribeUUID(sdk, value) {
  if (!value) return null;

  const UUID = getUUIDFactory(sdk);

  if (value?.uuid) {
    return new UUID(value.uuid);
  }

  return new UUID(String(value));
}

export async function buildSharetribeImageIdsFromMedia({
  sdk,
  mediaItems = []
}) {
  if (!sdk) {
    throw new Error("Machine Media save failed: missing Sharetribe SDK.");
  }

  const finalImageIds = [];

  for (const item of mediaItems) {
    const existingId = getMachineMediaImageId(item);
    const activeFile = getActiveMachineMediaFile(item);

    if (existingId && !activeFile) {
      finalImageIds.push(toSharetribeUUID(sdk, existingId));
      continue;
    }

    if (!activeFile) {
      throw new Error("Machine Media save failed: media item has no image id or file.");
    }

    const upload = await sdk.images.upload(
      { image: activeFile },
      { expand: true }
    );

    const uploadedId = upload?.data?.data?.id?.uuid;

    if (!uploadedId) {
      throw new Error("Machine Media save failed: Sharetribe upload returned no image id.");
    }

    finalImageIds.push(toSharetribeUUID(sdk, uploadedId));
  }

  if (mediaItems.length > 0 && finalImageIds.length !== mediaItems.length) {
    throw new Error("Machine Media save failed: image count mismatch.");
  }

  return finalImageIds;
}

export async function updateListingMediaWithSharetribe({
  sdk,
  listingId,
  mediaItems = []
}) {
  if (!sdk) {
    throw new Error("Machine Media update failed: missing Sharetribe SDK.");
  }

  if (!listingId) {
    throw new Error("Machine Media update failed: missing listing id.");
  }

  const images = await buildSharetribeImageIdsFromMedia({
    sdk,
    mediaItems
  });

  const response = await sdk.ownListings.update(
    {
      id: toSharetribeUUID(sdk, listingId),
      images
    },
    {
      expand: true,
      include: ["images"]
    }
  );

  return {
    response,
    images,
    imageCount: images.length
  };
}
