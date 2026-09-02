export const IXI_SCALE_MODES = {
  xl: {
    label: "XL",
    scale: 1,
    columnGap: 22,
    rowGap: 48
  },

  work: {
    label: "WORK",
    scale: 1.2,
    columnGap: 26,
    rowGap: 58
  },

  focus: {
    label: "FOCUS",
    scale: 1.4,
    columnGap: 31,
    rowGap: 67
  },

  large: {
    label: "L",
    scale: 0.88,
    columnGap: 18,
    rowGap: 42
  },

  medium: {
    label: "M",
    scale: 0.76,
    columnGap: 15,
    rowGap: 36
  },

  compact: {
    label: "C",
    scale: 0.64,
    columnGap: 12,
    rowGap: 30
  },

  micro: {
    label: "µ",
    scale: 0.52,
    columnGap: 10,
    rowGap: 24
  }
};

export const IXI_OBJECT_GEOMETRY = {
  marketplace: {
    nativeWidth: 300,
    nativeHeight: 400
  },

  private: {
    nativeWidth: 300,
    nativeHeight: 475
  },

  auction: {
    nativeWidth: 300,
    nativeHeight: 475
  },

  seller: {
    nativeWidth: 298,
    nativeHeight: 391
  },

  default: {
    nativeWidth: 298,
    nativeHeight: 391
  }
};

export function normalizeIXIScaleMode(
  value = "xl"
) {
  return Object.prototype.hasOwnProperty.call(
    IXI_SCALE_MODES,
    value
  )
    ? value
    : "xl";
}

export function getIXIScalePreset(
  scaleMode = "xl"
) {
  const normalized =
    normalizeIXIScaleMode(
      scaleMode
    );

  return IXI_SCALE_MODES[
    normalized
  ];
}

export function getIXIObjectNativeGeometry({
  objectFamily = "default",
  nativeWidth,
  nativeHeight
} = {}) {
  const familyGeometry =
    IXI_OBJECT_GEOMETRY[
      objectFamily
    ] ||
    IXI_OBJECT_GEOMETRY.default;

  const resolvedWidth =
    Number(nativeWidth);

  const resolvedHeight =
    Number(nativeHeight);

  return {
    nativeWidth:
      Number.isFinite(
        resolvedWidth
      ) &&
      resolvedWidth > 0
        ? resolvedWidth
        : familyGeometry.nativeWidth,

    nativeHeight:
      Number.isFinite(
        resolvedHeight
      ) &&
      resolvedHeight > 0
        ? resolvedHeight
        : familyGeometry.nativeHeight
  };
}

export function getIXIObjectFootprint({
  scaleMode = "xl",
  objectFamily = "default",

  nativeWidth,
  nativeHeight,

  slotCount = 1,
  seamOverlap = 1
} = {}) {
  const preset =
    getIXIScalePreset(
      scaleMode
    );

  const geometry =
    getIXIObjectNativeGeometry({
      objectFamily,
      nativeWidth,
      nativeHeight
    });

  const normalizedSlotCount =
    Math.max(
      1,
      Math.floor(
        Number(slotCount) || 1
      )
    );

  const normalizedOverlap =
    Math.max(
      0,
      Number(seamOverlap) || 0
    );

  const assembledNativeWidth =
    (
      normalizedSlotCount *
      geometry.nativeWidth
    ) -
    (
      Math.max(
        normalizedSlotCount - 1,
        0
      ) *
      normalizedOverlap
    );

  return {
    scaleMode:
      normalizeIXIScaleMode(
        scaleMode
      ),

    label:
      preset.label,

    scale:
      preset.scale,

   gap:
  preset.columnGap,

columnGap:
  preset.columnGap,

rowGap:
  preset.rowGap,

    slotCount:
      normalizedSlotCount,

    seamOverlap:
      normalizedOverlap,

    nativePanelWidth:
      geometry.nativeWidth,

    nativeWidth:
      assembledNativeWidth,

    nativeHeight:
      geometry.nativeHeight,

    renderedWidth:
      assembledNativeWidth *
      preset.scale,

    renderedHeight:
      geometry.nativeHeight *
      preset.scale
  };
}
