export const IXI_CARD_SCALE_PRESETS = {
  xl: { label: "XL", scale: 1, width: 320, height: 391, gap: 18 },
  large: { label: "L", scale: 0.88, width: 282, height: 344, gap: 16 },
  medium: { label: "M", scale: 0.76, width: 243, height: 297, gap: 14 },
  compact: { label: "C", scale: 0.64, width: 205, height: 250, gap: 12 },
  micro: { label: "µ", scale: 0.52, width: 166, height: 203, gap: 10 }
};

export function getIXICardScalePreset(size = "xl") {
  return IXI_CARD_SCALE_PRESETS[size] || IXI_CARD_SCALE_PRESETS.xl;
}
