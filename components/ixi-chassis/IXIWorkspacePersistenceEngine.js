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

export {
  IXI_WORKSPACE_SETTINGS_ID,
  IXI_WORKSPACE_LAYOUT_ID,
  createEmptyWorkspaceContainers
};
