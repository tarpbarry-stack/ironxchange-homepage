const IXI_WORKSPACE_SETTINGS_ID = "__workspaceSettings";
const IXI_WORKSPACE_LAYOUT_ID = "__workspaceLayout";

function createEmptyWorkspaceContainers() {
  return {
    board: [],
    stackTop: [],
    stackBottom: [],
    pocketLeft: [],
    pocketRight: [],
    pocketLeft2: [],
    pocketRight2: []
  };
}

function sanitizeWorkspaceContainers(
  savedContainers,
  validMachineIds
) {
  const valid = new Set(
    validMachineIds.map(id => String(id))
  );

  const clean = createEmptyWorkspaceContainers();
  const seen = new Set();

  Object.keys(clean).forEach(containerKey => {
    (savedContainers?.[containerKey] || []).forEach(id => {
      const sid = String(id);

      if (valid.has(sid) && !seen.has(sid)) {
        clean[containerKey].push(sid);
        seen.add(sid);
      }
    });
  });

  validMachineIds.forEach(id => {
    const sid = String(id);

    if (!seen.has(sid)) {
      clean.board.push(sid);
      seen.add(sid);
    }
  });

  return clean;
}

function saveWorkspaceLayoutRecord({
  saveIxiMachinePatch,
  userId,
  machineContainers,
  activeStackLayouts,
  activeStacksOpen,
  layoutId = IXI_WORKSPACE_LAYOUT_ID
}) {
  return saveIxiMachinePatch({
    userId,
    listingId: layoutId,
    patch: {
      machineContainers,
      activeStackLayouts,
      activeStacksOpen,
      updatedAt: Date.now()
    }
  });
}

function saveWorkspaceSettingsRecord({
  saveIxiMachinePatch,
  userId,
  settings = {},
  settingsId = IXI_WORKSPACE_SETTINGS_ID
}) {
  return saveIxiMachinePatch({
    userId,
    listingId: settingsId,
    patch: {
      ...settings,
      updatedAt: Date.now()
    }
  });
}

export {
  IXI_WORKSPACE_SETTINGS_ID,
  IXI_WORKSPACE_LAYOUT_ID,
  createEmptyWorkspaceContainers,
  sanitizeWorkspaceContainers,
  saveWorkspaceLayoutRecord,
  saveWorkspaceSettingsRecord
};
