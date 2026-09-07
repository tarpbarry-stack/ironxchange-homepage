export const IXI_AOS_BOARD_SKIN_STORAGE_KEY =
  "ixi:aos-work:board-skin";

export const IXI_AOS_DEFAULT_BOARD_SKIN_ID =
  "ixi-101";

export const IXI_AOS_BOARD_SKIN_IDS =
  Object.freeze({
    V12: "v12",
    IXI_101: "ixi-101",
    IXI_102: "ixi-102"
  });

export const IXI_AOS_BOARD_SKINS =
  Object.freeze([
    Object.freeze({
      skinId: IXI_AOS_BOARD_SKIN_IDS.V12,
      name: "V12",
      designation: "JET BLACK",
      description: "The original uninterrupted black AOS work surface.",
      className: "aos-work-board-skin-v12"
    }),
    Object.freeze({
      skinId: IXI_AOS_BOARD_SKIN_IDS.IXI_101,
      name: "IXI-101",
      designation: "SYSTEM GRID",
      description: "Technical rails, restrained field markings and an IXI row signature.",
      className: "aos-work-board-skin-ixi-101"
    }),
    Object.freeze({
      skinId: IXI_AOS_BOARD_SKIN_IDS.IXI_102,
      name: "IXI-102",
      designation: "INDEX LINE",
      description: "Shaded graphite field with numbered calibration rails and sparse IXI marks.",
      className: "aos-work-board-skin-ixi-102"
    })
  ]);

export function normalizeIXIAosBoardSkinId(
  value
) {
  const candidate = String(value || "")
    .trim()
    .toLowerCase();

  return IXI_AOS_BOARD_SKINS.some(
    skin => skin.skinId === candidate
  )
    ? candidate
    : IXI_AOS_DEFAULT_BOARD_SKIN_ID;
}

export function getIXIAosBoardSkin(
  value
) {
  const skinId =
    normalizeIXIAosBoardSkinId(value);

  return IXI_AOS_BOARD_SKINS.find(
    skin => skin.skinId === skinId
  ) || IXI_AOS_BOARD_SKINS[0];
}

export function readIXIAosBoardSkinId() {
  if (typeof window === "undefined") {
    return IXI_AOS_DEFAULT_BOARD_SKIN_ID;
  }

  try {
    return normalizeIXIAosBoardSkinId(
      window.localStorage.getItem(
        IXI_AOS_BOARD_SKIN_STORAGE_KEY
      )
    );
  } catch (error) {
    return IXI_AOS_DEFAULT_BOARD_SKIN_ID;
  }
}

export function writeIXIAosBoardSkinId(
  value
) {
  const skinId =
    normalizeIXIAosBoardSkinId(value);

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        IXI_AOS_BOARD_SKIN_STORAGE_KEY,
        skinId
      );
    } catch (error) {
      // Remote workspace settings remain the durable source.
    }
  }

  return skinId;
}
