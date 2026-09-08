function clean(value) {
  return String(value ?? "").trim();
}

function getIdentityAliases(object = {}) {
  const objectId = clean(object?.objectId);
  return new Set(objectId ? [objectId] : []);
}

function objectsShareIdentity(left = {}, right = {}) {
  const leftAliases = getIdentityAliases(left);
  const rightAliases = getIdentityAliases(right);

  for (const alias of leftAliases) {
    if (rightAliases.has(alias)) return true;
  }

  return false;
}

function hasMedia(object = {}) {
  return Array.isArray(object?.media) && object.media.length > 0;
}

function mergePlacedPresentation(canonicalChild, placedChild) {
  if (!placedChild) return canonicalChild;

  return {
    ...placedChild,
    ...canonicalChild,
    displayName:
      clean(canonicalChild?.displayName) ||
      clean(placedChild?.displayName) ||
      clean(placedChild?.title),
    media: hasMedia(canonicalChild)
      ? canonicalChild.media
      : (placedChild?.media || canonicalChild?.media || []),
    imageUrl:
      clean(canonicalChild?.imageUrl) ||
      clean(placedChild?.imageUrl),
    imageUrls:
      Array.isArray(canonicalChild?.imageUrls) && canonicalChild.imageUrls.length
        ? canonicalChild.imageUrls
        : (placedChild?.imageUrls || canonicalChild?.imageUrls || []),
    objectId: clean(canonicalChild?.objectId),
    passportId: clean(canonicalChild?.passportId),
    referenceOnly: true
  };
}

export function projectAosContainerChildren({
  canonicalChildren = [],
  placedChildren = []
} = {}) {
  const canonical = Array.isArray(canonicalChildren)
    ? canonicalChildren.filter(child => clean(child?.objectId))
    : [];
  const placed = Array.isArray(placedChildren)
    ? placedChildren.filter(child => clean(child?.objectId))
    : [];

  const consumedPlaced = new Set();
  const projected = canonical.map(canonicalChild => {
    const placedIndex = placed.findIndex((placedChild, index) =>
      !consumedPlaced.has(index) &&
      objectsShareIdentity(canonicalChild, placedChild)
    );

    if (placedIndex < 0) return canonicalChild;
    consumedPlaced.add(placedIndex);
    return mergePlacedPresentation(canonicalChild, placed[placedIndex]);
  });

  placed.forEach((placedChild, index) => {
    if (consumedPlaced.has(index)) return;
    if (projected.some(child => objectsShareIdentity(child, placedChild))) return;
    projected.push(placedChild);
  });

  return projected;
}

export { getIdentityAliases, objectsShareIdentity };
