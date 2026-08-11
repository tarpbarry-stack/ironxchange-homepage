/*
 * =========================================================
 * IXI AOS V2 — PRESENTATION METRICS
 * =========================================================
 *
 * This is the physical presentation contract for AOS.
 *
 * IMPORTANT:
 *
 * Object data does not determine Card size.
 *
 * Card family does not permanently determine Card size.
 *
 * Environment does not permanently determine Card size.
 *
 * cardContext + presentationMode determine how the
 * information is presented.
 *
 *
 * CORE RULE:
 *
 * READABILITY FIRST.
 *
 * As available physical space decreases:
 *
 * 1. spacing compresses
 * 2. layout reflows
 * 3. secondary information may disappear
 * 4. only then may modest geometric scaling occur
 *
 * We do NOT solve small Cards by shrinking readable
 * typography into microscopic typography.
 */


export const IXI_AOS_PRESENTATION_MODES = [
  "xl",
  "large",
  "medium",
  "compact",
  "micro"
];


/*
 * =========================================================
 * TYPOGRAPHY FLOOR
 * =========================================================
 *
 * These are intentionally larger than the historical
 * Face Lab defaults.
 *
 * We can tune them visually.
 *
 * Medium is intended to remain a WORKING mode.
 */

const PRESENTATION_METRICS = {

  xl: {
    mode:
      "xl",

    panel: {
      width:
        298,

      height:
        471
    },

    typography: {
      display:
        20,

      title:
        16,

      section:
        11,

      label:
        9.5,

      value:
        11.5,

      micro:
        8.5
    },

    spacing: {
      gapXs:
        4,

      gapSm:
        7,

      gapMd:
        11,

      gapLg:
        15,

      padX:
        12,

      padTop:
        10,

      modulePad:
        9
    },

    geometry: {
      rowMinHeight:
        27,

      sectionHeaderHeight:
        24,

      actionFooterHeight:
        44,

      operatingRailHeight:
        19
    },

    visibility: {
      detail:
        true,

      secondary:
        true,

      primary:
        true,

      critical:
        true
    },

    physicalScale:
      1
  },


  large: {
    mode:
      "large",

    panel: {
      width:
        278,

      height:
        445
    },

    typography: {
      display:
        19,

      title:
        15,

      section:
        10.5,

      label:
        9.25,

      value:
        11,

      micro:
        8.25
    },

    spacing: {
      gapXs:
        4,

      gapSm:
        7,

      gapMd:
        10,

      gapLg:
        14,

      padX:
        11,

      padTop:
        9,

      modulePad:
        8
    },

    geometry: {
      rowMinHeight:
        26,

      sectionHeaderHeight:
        23,

      actionFooterHeight:
        42,

      operatingRailHeight:
        19
    },

    visibility: {
      detail:
        true,

      secondary:
        true,

      primary:
        true,

      critical:
        true
    },

    physicalScale:
      1
  },


  /*
   * MEDIUM IS THE IMPORTANT DATUM.
   *
   * Medium must remain readable and workable.
   *
   * We should visually tune this against the existing
   * Marketplace Medium Card.
   */
  medium: {
    mode:
      "medium",

    panel: {
      width:
        252,

      height:
        410
    },

    typography: {
      display:
        18,

      title:
        14,

      section:
        10,

      label:
        9,

      value:
        10.5,

      micro:
        8
    },

    spacing: {
      gapXs:
        3,

      gapSm:
        6,

      gapMd:
        9,

      gapLg:
        12,

      padX:
        10,

      padTop:
        8,

      modulePad:
        7
    },

    geometry: {
      rowMinHeight:
        25,

      sectionHeaderHeight:
        22,

      actionFooterHeight:
        40,

      operatingRailHeight:
        19
    },

    visibility: {
      detail:
        false,

      secondary:
        true,

      primary:
        true,

      critical:
        true
    },

    physicalScale:
      1
  },


  /*
   * COMPACT stops trying to show everything.
   *
   * Typography stays readable.
   * Information density changes.
   */
  compact: {
    mode:
      "compact",

    panel: {
      width:
        226,

      height:
        360
    },

    typography: {
      display:
        17,

      title:
        13,

      section:
        9.5,

      label:
        8.75,

      value:
        10,

      micro:
        8
    },

    spacing: {
      gapXs:
        3,

      gapSm:
        5,

      gapMd:
        8,

      gapLg:
        10,

      padX:
        9,

      padTop:
        7,

      modulePad:
        6
    },

    geometry: {
      rowMinHeight:
        24,

      sectionHeaderHeight:
        21,

      actionFooterHeight:
        36,

      operatingRailHeight:
        19
    },

    visibility: {
      detail:
        false,

      secondary:
        false,

      primary:
        true,

      critical:
        true
    },

    physicalScale:
      .96
  },


  /*
   * MICRO is an identification/navigation representation.
   *
   * It is NOT intended to display the entire application.
   */
  micro: {
    mode:
      "micro",

    panel: {
      width:
        202,

      height:
        310
    },

    typography: {
      display:
        16,

      title:
        12,

      section:
        9,

      label:
        8.5,

      value:
        9.5,

      micro:
        8
    },

    spacing: {
      gapXs:
        2,

      gapSm:
        4,

      gapMd:
        6,

      gapLg:
        8,

      padX:
        8,

      padTop:
        6,

      modulePad:
        5
    },

    geometry: {
      rowMinHeight:
        23,

      sectionHeaderHeight:
        20,

      actionFooterHeight:
        32,

      operatingRailHeight:
        19
    },

    visibility: {
      detail:
        false,

      secondary:
        false,

      primary:
        false,

      critical:
        true
    },

    physicalScale:
      .92
  }
};


/*
 * =========================================================
 * NORMALIZATION
 * =========================================================
 */

export function normalizeIXIAosPresentationMode(
  value,
  fallback = "medium"
) {

  const mode =
    String(
      value ||
      ""
    )
      .trim()
      .toLowerCase();


  return IXI_AOS_PRESENTATION_MODES
    .includes(
      mode
    )
      ? mode
      : fallback;
}


/*
 * =========================================================
 * READ METRICS
 * =========================================================
 */

export function getIXIAosPresentationMetrics(
  mode = "medium"
) {

  const normalized =
    normalizeIXIAosPresentationMode(
      mode
    );


  return PRESENTATION_METRICS[
    normalized
  ];
}


/*
 * =========================================================
 * CSS VARIABLE CONTRACT
 * =========================================================
 *
 * This deliberately uses the vocabulary already started
 * by Face Lab.
 *
 * Existing Face primitives can therefore migrate without
 * inventing another typography language.
 */

export function getIXIAosPresentationCssVars(
  mode = "medium"
) {

  const metrics =
    getIXIAosPresentationMetrics(
      mode
    );


  return {
    "--ixi-face-font-display":
      `${metrics.typography.display}px`,

    "--ixi-face-font-title":
      `${metrics.typography.title}px`,

    "--ixi-face-font-section":
      `${metrics.typography.section}px`,

    "--ixi-face-font-label":
      `${metrics.typography.label}px`,

    "--ixi-face-font-value":
      `${metrics.typography.value}px`,

    "--ixi-face-font-micro":
      `${metrics.typography.micro}px`,


    "--ixi-face-gap-xs":
      `${metrics.spacing.gapXs}px`,

    "--ixi-face-gap-sm":
      `${metrics.spacing.gapSm}px`,

    "--ixi-face-gap-md":
      `${metrics.spacing.gapMd}px`,

    "--ixi-face-gap-lg":
      `${metrics.spacing.gapLg}px`,


    "--ixi-face-pad-x":
      `${metrics.spacing.padX}px`,

    "--ixi-face-pad-top":
      `${metrics.spacing.padTop}px`,

    "--ixi-face-module-pad":
      `${metrics.spacing.modulePad}px`,


    "--ixi-face-row-min-height":
      `${metrics.geometry.rowMinHeight}px`,

    "--ixi-face-section-header-height":
      `${metrics.geometry.sectionHeaderHeight}px`,

    "--ixi-face-action-footer-height":
      `${metrics.geometry.actionFooterHeight}px`,

    "--ixi-operating-rail-height":
      `${metrics.geometry.operatingRailHeight}px`
  };
}


/*
 * =========================================================
 * CONTENT PRIORITY
 * =========================================================
 *
 * A module can declare:
 *
 * critical
 * primary
 * secondary
 * detail
 *
 * As the Card becomes smaller, information disappears
 * BEFORE typography becomes unreadable.
 */

export function shouldShowIXIAosPresentationPriority({
  mode = "medium",
  priority = "primary"
} = {}) {

  const metrics =
    getIXIAosPresentationMetrics(
      mode
    );


  const normalizedPriority =
    [
      "critical",
      "primary",
      "secondary",
      "detail"
    ].includes(
      priority
    )
      ? priority
      : "primary";


  return (
    metrics
      ?.visibility
      ?.[normalizedPriority] !==
    false
  );
}


/*
 * =========================================================
 * CHARACTER-WIDTH CONTRACT
 * =========================================================
 *
 * This addresses the field-width problem directly.
 *
 * Known-value fields should not receive arbitrary giant
 * boxes.
 */

export function getIXIAosCharacterWidth({
  chars = 10,

  minChars = 1,

  maxChars = 40,

  paddingChars = 2
} = {}) {

  const requested =
    Number(
      chars
    ) ||
    10;


  const clamped =
    Math.max(
      Number(
        minChars
      ) ||
      1,

      Math.min(
        requested,
        Number(
          maxChars
        ) ||
        40
      )
    );


  return `${
    clamped +
    (
      Number(
        paddingChars
      ) ||
      0
    )
  }ch`;
}


/*
 * =========================================================
 * COMMON FIELD CONTENT CONTRACTS
 * =========================================================
 *
 * These are presentation hints only.
 *
 * They are NOT business-schema restrictions.
 */

const FIELD_CHARACTER_CONTRACTS = {

  year: {
    chars:
      4
  },

  make: {
    chars:
      14
  },

  model: {
    chars:
      16
  },

  vin: {
    chars:
      17
  },

  serial: {
    chars:
      18
  },

  serialnumber: {
    chars:
      18
  },

  stock: {
    chars:
      14
  },

  stocknumber: {
    chars:
      14
  },

  miles: {
    chars:
      10
  },

  hours: {
    chars:
      10
  },

  price: {
    chars:
      12
  },

  status: {
    chars:
      14
  },

  location: {
    chars:
      22
  }
};


export function getIXIAosFieldCharacterContract(
  fieldId = ""
) {

  const key =
    String(
      fieldId ||
      ""
    )
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9]/g,
        ""
      );


  return (
    FIELD_CHARACTER_CONTRACTS[
      key
    ] ||
    {
      chars:
        14
    }
  );
}


/*
 * =========================================================
 * NEXT MODE
 * =========================================================
 */

export function getNextIXIAosPresentationMode(
  currentMode = "xl"
) {

  const current =
    normalizeIXIAosPresentationMode(
      currentMode,
      "xl"
    );


  const index =
    IXI_AOS_PRESENTATION_MODES
      .indexOf(
        current
      );


  return IXI_AOS_PRESENTATION_MODES[
    index >=
    IXI_AOS_PRESENTATION_MODES.length - 1
      ? 0
      : index + 1
  ];
}
