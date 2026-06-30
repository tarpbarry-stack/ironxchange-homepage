import {
  createPhotoObject,
  updatePhotoObject
} from "./IXIPhotoObject";

export function initializeWorkbench({
  photos = []
}) {
  return photos.map((photo, index) =>
    createPhotoObject({
      id:
        photo?.id?.uuid ||
        photo?.id ||
        photo?.imageId ||
        `photo-${index}`,

      original:
        photo?.url ||
        photo?.variants?.default?.url ||
        "",

      position: index,

      hero: index === 0
    })
  );
}

export function addPhotoToWorkbench({
  workbench = [],
  photo
}) {
  return [
    ...workbench,
    createPhotoObject({
      id:
        photo?.id?.uuid ||
        photo?.id ||
        `photo-${Date.now()}`,

      original:
        photo?.url ||
        photo?.variants?.default?.url ||
        "",

      position: workbench.length
    })
  ];
}

export function replaceWorkbenchPhoto({
  workbench = [],
  photoId,
  patch = {}
}) {
  return workbench.map(photo =>
    String(photo.id) === String(photoId)
      ? updatePhotoObject(photo, patch)
      : photo
  );
}
