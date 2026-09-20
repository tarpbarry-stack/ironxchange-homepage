import { getAosVisiblePrimaryImage } from "../../../lib/media/ixiAosPrimaryImage.mjs";

// Toolbar references are projections of admitted Objects. These functions do
// not create identities, infer membership, or rewrite saved placements.
export const AOS_TOOLBAR_SURFACES = Object.freeze({
  left: "rail:aos-left",
  right: "rail:aos-right"
});

const SURFACES = Object.freeze({
  left: [AOS_TOOLBAR_SURFACES.left, "pocketLeft", "pocketLeft2", "stackTop"],
  right: [AOS_TOOLBAR_SURFACES.right, "pocketRight", "pocketRight2", "stackBottom"]
});

export function isAosToolbarSurface(surfaceId) {
  return Object.values(SURFACES).some(surfaces => surfaces.includes(surfaceId));
}

export function getAosToolbarObjectIds(placements, side) {
  return [...new Set((SURFACES[side] || []).flatMap(surface =>
    Array.isArray(placements?.[surface]) ? placements[surface] : []
  ))];
}

export function getAosToolbarContents(object, registry) {
  // The registry already applies canonical membership, compatibility review,
  // and root-index guards. Never derive children from toolbar placement.
  return [...new Set(object?.itemObjectIds || [])]
    .map(objectId => registry.get(objectId)).filter(Boolean);
}

export function getAosToolbarReturnOperation(session, objectId) {
  const record = session?.objects?.[objectId];
  const operationId = record?.returnSnapshot?.operationId;
  // Group Return belongs to its container. A single-row action must never
  // restore unrelated Objects from a previous Board/Recall batch.
  if (!operationId) return "";
  const affected = Object.values(session.objects).filter(item =>
    item?.returnSnapshot?.operationId === operationId
  );
  return affected.length === 1 ? operationId : "";
}

export function getAosToolbarName(object) {
  return object?.displayName || object?.title || object?.attributes?.title || object?.passportId || "Object";
}

function isMachine(object) {
  return object?.presentation?.kind === "ixi-private-machine" || object?.objectType === "machine";
}

function toolbarImage(object) {
  const source = object?.presentationSource || object;
  // Reuse the admitted listing's existing media projection. Native AOS media
  // goes through the same visibility resolver as the operating card.
  return getAosVisiblePrimaryImage(object) || (isMachine(object)
    ? [source?.imageUrl, source?.imageObjects?.[0], source?.images?.[0], source?.imageUrls?.[0]]
      .map(value => typeof value === "string" ? value : value?.url || value?.src).find(Boolean) || ""
    : "");
}

export function getAosToolbarPresentation(object, registry) {
  const machine = isMachine(object);
  const source = object?.presentationSource || object;
  const image = toolbarImage(object);
  const contents = getAosToolbarContents(object, registry);
  const previews = !image && !machine ? contents.slice(0, 4).map(child => ({
    objectId: child.objectId,
    name: getAosToolbarName(child),
    image: toolbarImage(child)
  })) : [];
  return { machine, image, previews, count: contents.length,
    price: machine && typeof source?.price === "string" ? source.price : "" };
}
