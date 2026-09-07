export const IXI_AOS_BOARD_SKIN_STORAGE_KEY =
  "ixi:aos-work:board-skin";

export const IXI_AOS_DEFAULT_BOARD_SKIN_ID =
  "ixi-101";

export const IXI_AOS_BOARD_SKIN_IDS =
  Object.freeze({
    V12: "v12",
    IXI_101: "ixi-101",
    IXI_102: "ixi-102",
    IXI_103: "ixi-103",
    IXI_104: "ixi-104",
    IXI_105: "ixi-105",
    IXI_106: "ixi-106",
    IXI_107: "ixi-107"
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
      description: "Jet-black field with numbered calibration rails and sparse IXI marks.",
      className: "aos-work-board-skin-ixi-102"
    }),
    Object.freeze({
      skinId: IXI_AOS_BOARD_SKIN_IDS.IXI_103,
      name: "IXI-103",
      designation: "VECTOR FIELD",
      description: "Jet-black coordinate field with sparse vector paths and calibrated IXI marks.",
      className: "aos-work-board-skin-ixi-103"
    }),
    Object.freeze({
      skinId: IXI_AOS_BOARD_SKIN_IDS.IXI_104,
      name: "IXI-104",
      designation: "BLACK TOPO",
      description: "Jet-black survey field with sparse contour lines and calibrated elevation marks.",
      className: "aos-work-board-skin-ixi-104"
    }),
    Object.freeze({
      skinId: IXI_AOS_BOARD_SKIN_IDS.IXI_105,
      name: "IXI-105",
      designation: "BLACK SIGNAL",
      description: "Jet-black diagnostic field with sparse telemetry traces and active signal pulses.",
      className: "aos-work-board-skin-ixi-105"
    }),
    Object.freeze({
      skinId: IXI_AOS_BOARD_SKIN_IDS.IXI_106,
      name: "IXI-106",
      designation: "LOAD PATH",
      description: "Jet-black structural field with calibrated load paths and restrained force nodes.",
      className: "aos-work-board-skin-ixi-106"
    }),
    Object.freeze({
      skinId: IXI_AOS_BOARD_SKIN_IDS.IXI_107,
      name: "IXI-107",
      designation: "DATUM ZERO",
      description: "Jet-black metrology field with precision arcs, datum marks and calibrated nodes.",
      className: "aos-work-board-skin-ixi-107"
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
