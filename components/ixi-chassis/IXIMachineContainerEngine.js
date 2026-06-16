function getMachineContainerFromContainers(
  machineContainers,
  machineId
) {
  const id = String(machineId);

  for (const [containerKey, ids] of Object.entries(machineContainers || {})) {
    if ((ids || []).includes(id)) {
      return containerKey;
    }
  }

  return "board";
}

function reorderMachineWithinContainerState({
  currentContainers,
  containerKey,
  dragId,
  targetId,
  insertAfter = false
}) {
  if (!containerKey || !dragId || !targetId || dragId === targetId) {
    return currentContainers;
  }

  const source = currentContainers?.[containerKey] || [];

  const fromIndex = source.findIndex(
    item => String(item) === String(dragId)
  );

  const toIndex = source.findIndex(
    item => String(item) === String(targetId)
  );

  if (fromIndex === -1 || toIndex === -1) {
    return currentContainers;
  }

  const nextContainer = [...source];
  const [moved] = nextContainer.splice(fromIndex, 1);

  const adjustedTargetIndex = nextContainer.findIndex(
    item => String(item) === String(targetId)
  );

  const insertIndex = insertAfter
    ? adjustedTargetIndex + 1
    : adjustedTargetIndex;

  nextContainer.splice(insertIndex, 0, moved);

  return {
    ...currentContainers,
    [containerKey]: nextContainer
  };
}

export {
  getMachineContainerFromContainers,
  reorderMachineWithinContainerState
};
