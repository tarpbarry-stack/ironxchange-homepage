import {
  createStableMediaKey,
  getMediaUrl,
  getSharetribeImageId
} from "./machineMediaIdentity";

export function createMachineMediaItem(input = {}, index = 0) {
  const sharetribeImageId = getSharetribeImageId(input);
  const url = getMediaUrl(input);

  return {
    ...input,

    id: createStableMediaKey(input, index),
    mediaKey: createStableMediaKey(input, index),

    source: sharetribeImageId ? "sharetribe" : "local",

    sharetribeImageId,
    imageId: sharetribeImageId,

    url,
    previewUrl: input.previewUrl || input.url || url,
    originalUrl: input.originalUrl || url,

    activeMode: input.activeMode || input.variant || "original",
    variant: input.variant || input.activeMode || "original",

    deleted: input.deleted === true,
    isHero: index === 0,

    sortIndex: index
  };
}

export function createMachineMediaModel(items = []) {
  return (Array.isArray(items) ? items : [])
    .filter(Boolean)
    .map((item, index) => createMachineMediaItem(item, index))
    .map((item, index) => ({
      ...item,
      isHero: index === 0,
      sortIndex: index
    }));
}
