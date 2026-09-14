/*
 * AOS SYSTEM INDEX PLACEMENT SAFETY
 *
 * This module owns workspace presentation only. It never writes MOS Objects,
 * Passports, containment fields, or relationships. The caller must supply the
 * canonical System Index object IDs returned by buildAosSystemIndexes; visible
 * labels and customer business nouns are deliberately ignored.
 */

function clean(value) {
  return String(value ?? "").trim();
}

function uniqueIds(values = []) {
  return [...new Set(
    (Array.isArray(values) ? values : [])
      .map(clean)
      .filter(Boolean)
  )];
}

function clonePlacements(placements = {}) {
  return Object.fromEntries(
    Object.entries(placements || {}).map(([surfaceId, objectIds]) => [
      surfaceId,
      uniqueIds(objectIds)
    ])
  );
}

export function excludePeerSystemIndexMembers({
  ownerObjectId,
  memberObjectIds = [],
  systemIndexObjectIds = []
} = {}) {
  const ownerId = clean(ownerObjectId);
  const systemIndexIds = new Set(uniqueIds(systemIndexObjectIds));
  const members = uniqueIds(memberObjectIds);

  if (!systemIndexIds.has(ownerId)) return members;

  return members.filter(memberObjectId => !systemIndexIds.has(memberObjectId));
}

export function reconcilePeerSystemIndexesToBoard({
  placements = {},
  systemIndexObjectIds = []
} = {}) {
  const next = clonePlacements(placements);
  const systemIndexIds = new Set(uniqueIds(systemIndexObjectIds));
  const releasedObjectIds = [];

  Object.entries(next).forEach(([surfaceId, objectIds]) => {
    if (!surfaceId.startsWith("container:")) return;

    const parentObjectId = clean(surfaceId.slice("container:".length));
    if (!systemIndexIds.has(parentObjectId)) return;

    objectIds.forEach(objectId => {
      if (
        systemIndexIds.has(objectId) &&
        objectId !== parentObjectId &&
        !releasedObjectIds.includes(objectId)
      ) {
        releasedObjectIds.push(objectId);
      }
    });
  });

  if (!releasedObjectIds.length) {
    return { placements: next, releasedObjectIds };
  }

  const releasedIds = new Set(releasedObjectIds);
  Object.keys(next).forEach(surfaceId => {
    next[surfaceId] = next[surfaceId].filter(objectId => !releasedIds.has(objectId));
  });
  next.board = uniqueIds([
    ...(next.board || []),
    ...releasedObjectIds
  ]);

  return { placements: next, releasedObjectIds };
}

export function pinSystemIndexToBoard({
  placements = {},
  objectId
} = {}) {
  const pinnedObjectId = clean(objectId);
  const next = clonePlacements(placements);

  if (!pinnedObjectId) {
    return {
      placements: next,
      changed: false
    };
  }

  const boardHasObject = (next.board || []).includes(pinnedObjectId);
  const nonBoardHasObject = Object.entries(next).some(
    ([surfaceId, objectIds]) =>
      surfaceId !== "board" && objectIds.includes(pinnedObjectId)
  );

  if (boardHasObject && !nonBoardHasObject) {
    return {
      placements: next,
      changed: false
    };
  }

  Object.keys(next).forEach(surfaceId => {
    next[surfaceId] = next[surfaceId].filter(
      candidate => candidate !== pinnedObjectId
    );
  });
  next.board = uniqueIds([
    ...(next.board || []),
    pinnedObjectId
  ]);

  return {
    placements: next,
    changed: true
  };
}

export default {
  excludePeerSystemIndexMembers,
  reconcilePeerSystemIndexesToBoard,
  pinSystemIndexToBoard
};
