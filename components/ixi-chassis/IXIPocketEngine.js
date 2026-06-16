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

export {
  rotatePocketState
};
