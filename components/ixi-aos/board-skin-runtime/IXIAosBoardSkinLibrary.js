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
    IXI_107: "ixi-107",
    IXI_108: "ixi-108",
    IXI_109: "ixi-109",
    IXI_110: "ixi-110",
    IXI_111: "ixi-111",
    IXI_112: "ixi-112",
    IXI_113: "ixi-113",
    IXI_114: "ixi-114",
    IXI_115: "ixi-115",
    IXI_116: "ixi-116"
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
    }),
    Object.freeze({
      skinId: IXI_AOS_BOARD_SKIN_IDS.IXI_108,
      name: "IXI-108",
      designation: "EARTHWORK PLAN",
      description: "Full-field civil grading plan with excavation, haul routes and survey controls.",
      className: "aos-work-board-skin-ixi-108"
    }),
    Object.freeze({
      skinId: IXI_AOS_BOARD_SKIN_IDS.IXI_109,
      name: "IXI-109",
      designation: "DIRECTIONAL DRILLING",
      description: "Jet-black oilfield plan with well paths, casing data and geological targets.",
      className: "aos-work-board-skin-ixi-109"
    }),
    Object.freeze({
      skinId: IXI_AOS_BOARD_SKIN_IDS.IXI_110,
      name: "IXI-110",
      designation: "NIGHT SURVEY",
      description: "Sparse midnight survey field with sight lines, benchmarks and control points.",
      className: "aos-work-board-skin-ixi-110"
    }),
    Object.freeze({
      skinId: IXI_AOS_BOARD_SKIN_IDS.IXI_111,
      name: "IXI-111",
      designation: "QUARRY GRID",
      description: "Open-pit bench plan with bore surveys, grade control and haul-road geometry.",
      className: "aos-work-board-skin-ixi-111"
    }),
    Object.freeze({
      skinId: IXI_AOS_BOARD_SKIN_IDS.IXI_112,
      name: "IXI-112",
      designation: "LIFT RADIUS",
      description: "Crane lift plan with swing geometry, working radii and a restrained cyan boom path.",
      className: "aos-work-board-skin-ixi-112"
    }),
    Object.freeze({
      skinId: IXI_AOS_BOARD_SKIN_IDS.IXI_113,
      name: "IXI-113",
      designation: "EXCAVATOR BUILD",
      description: "Excavator assembly blueprint with boom geometry, hydraulic details and component callouts.",
      className: "aos-work-board-skin-ixi-113"
    }),
    Object.freeze({
      skinId: IXI_AOS_BOARD_SKIN_IDS.IXI_114,
      name: "IXI-114",
      designation: "GRADER GEOMETRY",
      description: "Cat 14M engineering plan with articulation, moldboard geometry and tandem-drive details.",
      className: "aos-work-board-skin-ixi-114"
    }),
    Object.freeze({
      skinId: IXI_AOS_BOARD_SKIN_IDS.IXI_115,
      name: "IXI-115",
      designation: "DOZER PROFILE",
      description: "Cat D8T build plan with six-way PAT blade, high-drive undercarriage and rear ripper.",
      className: "aos-work-board-skin-ixi-115"
    }),
    Object.freeze({
      skinId: IXI_AOS_BOARD_SKIN_IDS.IXI_116,
      name: "IXI-116",
      designation: "ARTIC HAUL",
      description: "Volvo A45G engineering plan with articulation, body-hoist geometry and 6×6 driveline.",
      className: "aos-work-board-skin-ixi-116"
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
