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

export {
  getMachineContainerFromContainers
};
