export const IXI_SCALE_MODES = {
  xl: {
    label: "XL",
    scale: 1,
    gap: 22
  },

  large: {
    label: "L",
    scale: 0.88,
    gap: 18
  },

  medium: {
    label: "M",
    scale: 0.76,
    gap: 15
  },

  compact: {
    label: "C",
    scale: 0.64,
    gap: 12
  },

  micro: {
    label: "µ",
    scale: 0.52,
    gap: 10
  }
};

export const IXI_OBJECT_GEOMETRY = {
  marketplace: {
    nativeWidth: 298,
    nativeHeight: 391
  },

  private: {
    nativeWidth: 298,
    nativeHeight: 391
  },

  auction: {
    nativeWidth: 298,
    nativeHeight: 471
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
      preset.gap,

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
