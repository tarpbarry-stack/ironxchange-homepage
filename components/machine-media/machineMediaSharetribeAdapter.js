import { types as sdkTypes } from "sharetribe-flex-sdk";

import {
  getMediaFile,
  getSharetribeImageId
} from "./machineMediaIdentity";

const { UUID } = sdkTypes;

function toUuid(value) {
  if (!value) return null;
  if (value?.uuid) return value;
  return new UUID(String(value));
}

function getUploadedImageId(uploadResponse) {
  return (
    uploadResponse?.data?.data?.id?.uuid ||
    uploadResponse?.data?.data?.id ||
    uploadResponse?.data?.id?.uuid ||
    uploadResponse?.data?.id ||
    null
  );
}

export async function buildSharetribeImageIdList({
  sdk,
  mediaItems = []
}) {
  if (!sdk) {
    throw new Error("Missing Sharetribe SDK");
  }

  const finalImageIds = [];

  for (const media of mediaItems) {
    const existingId = getSharetribeImageId(media);
    const mode = media?.activeMode || media?.variant || "original";

    if (existingId && mode === "original" && !media?.file) {
      finalImageIds.push(toUuid(existingId));
      continue;
    }

    const file = getMediaFile(media);

    if (!file) {
      throw new Error("Media save stopped: missing image file or existing image ID.");
    }

    const upload = await sdk.images.upload(
      { image: file },
      { expand: true }
    );

    const uploadedId = getUploadedImageId(upload);

    if (!uploadedId) {
      throw new Error("Media upload failed: missing uploaded image ID.");
    }

    finalImageIds.push(toUuid(uploadedId));
  }

  if (finalImageIds.length !== mediaItems.length) {
    throw new Error("Media save stopped: final image count mismatch.");
  }

  return finalImageIds;
}

export async function updateSharetribeListingMedia({
  sdk,
  listingId,
  mediaItems = []
}) {
  if (!listingId) {
    throw new Error("Missing listingId for media update.");
  }

  const images = await buildSharetribeImageIdList({
    sdk,
    mediaItems
  });

  const response = await sdk.ownListings.update(
    {
      id: toUuid(listingId),
      images
    },
    { expand: true }
  );

  return {
    response,
    imageIds: images.map(item => item?.uuid || String(item))
  };
}
