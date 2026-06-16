function getStackContainerKey(stackKey) {
  return stackKey === "top"
    ? "stackTop"
    : "stackBottom";
}

export {
  getStackContainerKey
};
