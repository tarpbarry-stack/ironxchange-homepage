// /lib/machine-media/machineMediaSharetribeAdapter.js

import { types as sdkTypes } from "sharetribe-flex-sdk";

import {
  getActiveMachineMediaFile,
  getMachineMediaImageId
} from "./machineMediaIdentity";

const { UUID } = sdkTypes;

function toSharetribeUUID(value) {
  if (!value) return null;

  if (value?.uuid) {
    return new UUID(value.uuid);
  }

  return new UUID(String(value));
}

/* ---------- ADD THIS ---------- */

function requiresServerImageProxy(url = "") {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    return (
      hostname === "www-ironplanet.s3-us-west-2.amazonaws.com" ||
      hostname === "cdn.ironpla.net"
    );
  } catch {
    return false;
  }
}

async function remoteUrlToFile(url, index = 0) {
  const fetchUrl = requiresServerImageProxy(url)
    ? `/api/media/fetch-remote-image?url=${encodeURIComponent(url)}`
    : url;

  const response = await fetch(fetchUrl);

  if (!response.ok) {
    throw new Error(
      `Remote image fetch failed: ${response.status}`
    );
  }

  const blob = await response.blob();

  const extension =
    blob.type === "image/png"
      ? "png"
      : blob.type === "image/webp"
      ? "webp"
      : "jpg";

  return new File(
    [blob],
    `url-import-${index}.${extension}`,
    {
      type: blob.type || "image/jpeg"
    }
  );
}

/* ---------- END ADD ---------- */

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
    let activeFile = getActiveMachineMediaFile(item);

if (!activeFile && item?.status === "remote-url" && item?.url) {
  activeFile = await remoteUrlToFile(item.url, finalImageIds.length);
}

    if (existingId && !activeFile) {
      finalImageIds.push(toSharetribeUUID(existingId));
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

    finalImageIds.push(toSharetribeUUID(uploadedId));
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
      id: toSharetribeUUID(listingId),
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
