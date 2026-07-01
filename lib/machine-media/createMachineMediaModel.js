// /lib/machine-media/createMachineMediaModel.js

import {
  buildExistingMachineMediaItem,
  buildNewMachineMediaItem,
  getActiveMachineMediaUrl
} from "./machineMediaIdentity";

export function createMachineMediaModelFromListing(listing = {}) {
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

export function normalizeMachineMediaItems(items = []) {
  return items
    .map((item, index) => {
      if (item?.existing || item?.imageId || item?.sharetribeImageId) {
        return buildExistingMachineMediaItem(item, index);
      }

      return buildNewMachineMediaItem(item, index);
    })
    .filter(item => getActiveMachineMediaUrl(item));
}

export function getMachineMediaHeroUrl(mediaItems = "") {
  const first = Array.isArray(mediaItems) ? mediaItems[0] : null;

  return getActiveMachineMediaUrl(first) || "";
}

export function getMachineMediaPreviewUrls(mediaItems = []) {
  return mediaItems
    .map(getActiveMachineMediaUrl)
    .filter(Boolean);
}

export function moveMachineMediaItem(mediaItems = [], fromIndex, toIndex) {
  if (
    fromIndex === null ||
    fromIndex === undefined ||
    toIndex === null ||
    toIndex === undefined ||
    fromIndex === toIndex
  ) {
    return mediaItems;
  }

  const next = [...mediaItems];
  const [moved] = next.splice(fromIndex, 1);

  if (!moved) return mediaItems;

  next.splice(toIndex, 0, moved);

  return next;
}

export function removeMachineMediaItem(mediaItems = [], indexToRemove) {
  return mediaItems.filter((_, index) => index !== indexToRemove);
}
