function rotatePocketState(currentContainers, pocketKey) {
  if (!pocketKey) return currentContainers;

  const ids = currentContainers?.[pocketKey] || [];

  if (ids.length <= 1) return currentContainers;

  return {
    ...currentContainers,
    [pocketKey]: [
      ...ids.slice(1),
      ids[0]
    ]
  };
}

function movePocketToContainerState(
  currentContainers,
  pocketKey,
  targetContainer
) {
  if (!pocketKey || !targetContainer) {
    return currentContainers;
  }

  const pocketIds = currentContainers?.[pocketKey] || [];

  if (!pocketIds.length) {
    return currentContainers;
  }

  const next = {
    ...currentContainers
  };

  next[pocketKey] = [];

  next[targetContainer] = [
    ...(next[targetContainer] || []),
    ...pocketIds
  ];

  return next;
}

export {
  rotatePocketState,
  movePocketToContainerState
};
