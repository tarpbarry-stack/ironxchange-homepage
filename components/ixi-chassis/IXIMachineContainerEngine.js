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

function moveMachineToContainerAtPositionState({
  currentContainers,
  machineId,
  targetContainer,
  targetId,
  insertAfter = false
}) {
  if (!machineId || !targetContainer || !targetId) {
    return currentContainers;
  }

  const id = String(machineId);
  const target = String(targetId);
  const next = {};

  Object.keys(currentContainers || {}).forEach(containerKey => {
    next[containerKey] = (currentContainers[containerKey] || []).filter(
      item => String(item) !== id
    );
  });

  const targetList = [...(next[targetContainer] || [])];

  const targetIndex = targetList.findIndex(
    item => String(item) === target
  );

  if (targetIndex === -1) {
    targetList.push(id);
  } else {
    targetList.splice(
      insertAfter ? targetIndex + 1 : targetIndex,
      0,
      id
    );
  }

  return {
    ...next,
    [targetContainer]: targetList
  };
}

function moveMachineToContainerState({
  currentContainers,
  machineId,
  targetContainer
}) {
  if (!machineId || !targetContainer) {
    return currentContainers;
  }

  const id = String(machineId);
  const next = {};

  Object.keys(currentContainers || {}).forEach(containerKey => {
    next[containerKey] = (currentContainers[containerKey] || []).filter(
      item => String(item) !== id
    );
  });

  const isPocket = [
    "pocketLeft",
    "pocketRight",
    "pocketLeft2",
    "pocketRight2"
  ].includes(targetContainer);

  next[targetContainer] = [
  ...(next[targetContainer] || []),
  id
];
  return next;
}

export {
  getMachineContainerFromContainers,
  reorderMachineWithinContainerState,
  moveMachineToContainerAtPositionState,
  moveMachineToContainerState
};
