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

export {
  getStackContainerKey,
  toggleStackOpenState
};
