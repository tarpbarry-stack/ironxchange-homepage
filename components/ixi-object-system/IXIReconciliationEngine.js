export function isReservedIXIStateId(id) {
  return String(id || "").startsWith("__");
}

export function getAllContainerIds(machineContainers = {}) {
  const ids = [];

  Object.values(machineContainers || {}).forEach(containerList => {
    if (!Array.isArray(containerList)) return;

    containerList.forEach(id => {
      if (!id) return;
      ids.push(String(id));
    });
  });

  return ids;
}

export function removeIdFromAllContainers(machineContainers = {}, objectId) {
  const id = String(objectId || "");
  const next = {};

  Object.entries(machineContainers || {}).forEach(([containerKey, containerList]) => {
    next[containerKey] = Array.isArray(containerList)
      ? containerList.map(String).filter(itemId => itemId !== id)
      : [];
  });

  return next;
}

export function reconcileSellerBoardOnLoad({
  ixiCardState = {},
  machineContainers = {},
  sellerBoardObjects = []
}) {
  const nextCardState = { ...(ixiCardState || {}) };
  let nextContainers = { ...(machineContainers || {}) };

  const sellerIds = new Set(
    (sellerBoardObjects || [])
      .map(seller => String(seller?.id || seller?.sellerId || ""))
      .filter(Boolean)
  );

  Object.entries(ixiCardState || {}).forEach(([id, state]) => {
    if (isReservedIXIStateId(id)) return;
    if (!state?.checkedOutFromParent) return;
    if (state?.checkoutContainer !== "board") return;
    if (!state?.sourceParentId) return;
    if (!sellerIds.has(String(state.sourceParentId))) return;

    nextContainers = removeIdFromAllContainers(nextContainers, id);

    nextCardState[id] = {
      ...state,
      checkedOutFromParent: false,
      checkoutContainer: "",
      checkoutReason: "",
      updatedAt: new Date().toISOString()
    };
  });

  return {
    ixiCardState: nextCardState,
    machineContainers: nextContainers
  };
}
