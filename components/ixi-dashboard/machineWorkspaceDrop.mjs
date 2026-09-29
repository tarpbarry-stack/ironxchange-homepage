export const boardTarget = "machine-workspace-board";
export const railPrefix = "machine-workspace-rail-";

export function machineRailDragId(side, key) {
  return `${railPrefix}${side}:${key}`;
}

function railSource(id) {
  if (!id.startsWith(railPrefix)) return null;
  const rest = id.slice(railPrefix.length);
  const colon = rest.indexOf(":");
  return colon < 0 ? null : { side: rest.slice(0, colon), key: rest.slice(colon + 1) };
}

export function resolveMachineWorkspaceDrop(activeId, overId, boardKeys) {
  if (!overId || activeId === overId) return null;
  const sourceRail = railSource(activeId);
  const targetRail = railSource(overId);
  if (sourceRail) {
    if (overId === boardTarget || boardKeys.includes(overId)) return { type: "open", key: sourceRail.key };
    if (targetRail?.side === sourceRail.side) return { type: "rail-order", side: sourceRail.side, from: sourceRail.key, to: targetRail.key };
    return null;
  }
  if (!boardKeys.includes(activeId)) return null;
  if (overId.startsWith(railPrefix)) return { type: "return", key: activeId, side: targetRail?.side || overId.slice(railPrefix.length) };
  if (boardKeys.includes(overId)) return { type: "board-order", from: activeId, to: overId };
  return null;
}
