function getStackContainerKey(stackKey) {
  return stackKey === "top"
    ? "stackTop"
    : "stackBottom";
}

function toggleStackOpenState(currentState, stackKey) {
  return {
    ...currentState,
    [stackKey]: !currentState[stackKey]
  };
}

function toggleStackLayoutState(currentLayouts, stackKey) {
  return {
    ...currentLayouts,
    [stackKey]:
      currentLayouts[stackKey] === "horizontal"
        ? "vertical"
        : "horizontal"
  };
}

function getMachineIdsForStack(
  machineContainers,
  stackKey
) {
  const sourceContainer = getStackContainerKey(stackKey);

  return machineContainers?.[sourceContainer] || [];
}

export {
  getStackContainerKey,
  toggleStackOpenState,
  toggleStackLayoutState,
  getMachineIdsForStack
};
