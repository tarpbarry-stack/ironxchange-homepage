const IXI_WORKSPACE_SETTINGS_ID =
  "__workspaceSettings";

const IXI_WORKSPACE_LAYOUT_ID =
  "__workspaceLayout";


function createEmptyWorkspaceContainers() {
  return {
    board: [],

    /*
     * SYSTEM INDEX HOME CONTAINERS
     *
     * These are workspace presentation
     * containers only.
     *
     * They do NOT define canonical
     * AOS/MOS membership.
     */
    indexEquipment: [],

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
  validMachineIds,
  {
    defaultContainer =
      "board"
  } = {}
) {
  const valid =
    new Set(
      validMachineIds.map(
        id => String(id)
      )
    );

  const clean =
    createEmptyWorkspaceContainers();

  const seen =
    new Set();


  /*
   * Restore every known persisted
   * workspace container.
   */
  Object.keys(clean).forEach(
    containerKey => {
      (
        savedContainers?.[
          containerKey
        ] || []
      ).forEach(id => {
        const sid =
          String(id);

        if (
          valid.has(sid) &&
          !seen.has(sid)
        ) {
          clean[
            containerKey
          ].push(sid);

          seen.add(sid);
        }
      });
    }
  );


  /*
   * Any machine that exists but has
   * never been persisted into a
   * workspace location goes to the
   * caller-supplied default.
   *
   * Normal IXI Workspace:
   *   defaultContainer = "board"
   *
   * AOS Work:
   *   defaultContainer =
   *   "indexEquipment"
   */
  const resolvedDefault =
    Object.prototype
      .hasOwnProperty.call(
        clean,
        defaultContainer
      )
      ? defaultContainer
      : "board";


  validMachineIds.forEach(id => {
    const sid =
      String(id);

    if (!seen.has(sid)) {
      clean[
        resolvedDefault
      ].push(sid);

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
  layoutId =
    IXI_WORKSPACE_LAYOUT_ID
}) {
  return saveIxiMachinePatch({
    userId,

    listingId:
      layoutId,

    patch: {
      machineContainers,
      activeStackLayouts,
      activeStacksOpen,

      updatedAt:
        Date.now()
    }
  });
}


function saveWorkspaceSettingsRecord({
  saveIxiMachinePatch,
  userId,
  settings = {},
  settingsId =
    IXI_WORKSPACE_SETTINGS_ID
}) {
  return saveIxiMachinePatch({
    userId,

    listingId:
      settingsId,

    patch: {
      ...settings,

      updatedAt:
        Date.now()
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
