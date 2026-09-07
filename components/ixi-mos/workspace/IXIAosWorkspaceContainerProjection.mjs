function clean(value) {
  return String(value ?? "").trim();
}

function getIdentityAliases(object = {}) {
  const aliases = new Set([
    clean(object?.objectId),
    clean(object?.id?.uuid),
    clean(object?.id),
    clean(object?.listingId),
    clean(object?.metadata?.sourceListingId),
    clean(object?.metadata?.passportIdentity?.passportId),
    clean(object?.passportId)
  ].filter(Boolean));

  (Array.isArray(object?.identities) ? object.identities : [])
    .forEach(identity => {
      [
        identity?.sourceId,
        identity?.passportId,
        identity?.identityId
      ].map(clean).filter(Boolean).forEach(value => aliases.add(value));
    });

  return aliases;
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
    directContainerId: canonicalChild?.directContainerId
  };
}

/*
 * A container rail is an immediate workspace projection backed by canonical
 * IX-Core membership. An accepted drag must appear in the destination rail in
 * the same render; the later canonical readback replaces that optimistic
 * listing by identity instead of adding a second card.
 */
export function projectAosContainerChildren({
  canonicalChildren = [],
  placedChildren = []
} = {}) {
  const canonical = Array.isArray(canonicalChildren)
    ? canonicalChildren.filter(Boolean)
    : [];
  const placed = Array.isArray(placedChildren)
    ? placedChildren.filter(Boolean)
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
