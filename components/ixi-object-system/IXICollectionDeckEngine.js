export function getCollectionDeckState({
  face = 1,
  items = []
} = {}) {
  const safeItems =
    Array.isArray(items)
      ? items
      : [];

  const normalizedFace =
    Math.max(
      1,
      Number(face || 1)
    );

  const endDeckFace =
    safeItems.length + 2;

  const isIdentityFace =
    normalizedFace === 1;

  const isEndDeckFace =
    normalizedFace ===
    endDeckFace;

  const activeItemIndex =
    normalizedFace > 1 &&
    normalizedFace <
      endDeckFace
      ? normalizedFace - 2
      : -1;

  const activeItem =
    activeItemIndex >= 0
      ? safeItems[
          activeItemIndex
        ] || null
      : null;

  return {
    face:
      normalizedFace,

    items:
      safeItems,

    itemCount:
      safeItems.length,

    endDeckFace,

    isIdentityFace,
    isEndDeckFace,

    activeItemIndex,
    activeItem
  };
}

export function getNextCollectionFace({
  face = 1,
  items = []
} = {}) {
  const {
    endDeckFace
  } =
    getCollectionDeckState({
      face,
      items
    });

  return (
    Number(face || 1) >=
    endDeckFace
      ? 1
      : Number(face || 1) + 1
  );
}

export function getPreviousCollectionFace({
  face = 1,
  items = []
} = {}) {
  const currentFace =
    Number(face || 1);

  getCollectionDeckState({
    face,
    items
  });

  return currentFace <= 2
    ? 1
    : currentFace - 1;
}

export function getFirstCollectionFace() {
  return 1;
}

export function getLastCollectionFace({
  items = []
} = {}) {
  return (
    Array.isArray(items)
      ? items.length
      : 0
  ) + 2;
}

export function getCollectionFaceForItemIndex(
  itemIndex
) {
  const index =
    Number(itemIndex);

  if (
    !Number.isInteger(index) ||
    index < 0
  ) {
    return 1;
  }

  return index + 2;
}
