function getNextCardScaleMode(currentMode) {
  return currentMode === "xl" ? "large" :
    currentMode === "large" ? "medium" :
    currentMode === "medium" ? "compact" :
    currentMode === "compact" ? "micro" :
    "xl";
}

export {
  getNextCardScaleMode
};
