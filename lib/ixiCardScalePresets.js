export const IXI_CARD_SCALE_PRESETS = {
  xl: { label: "XL", scale: 1, width: 298, height: 391, gap: 22 },
  large: { label: "L", scale: 0.88, width: 282, height: 344, gap: 18 },
  medium: { label: "M", scale: 0.76, width: 243, height: 297, gap: 15 },
  compact: { label: "C", scale: 0.64, width: 205, height: 250, gap: 12 },
  micro: { label: "µ", scale: 0.52, width: 166, height: 203, gap: 10 }
};

export const IXI_AUCTION_CARD_SCALE_PRESETS = {
  xl: {
    label: "XL",
    scale: 1,
    width: 298,
    height: 470,
    gap: 12
  },

  large: {
    label: "L",
    scale: 0.88,
    width: 282,
    height: 414,
    gap: 10
  },

  medium: {
    label: "M",
    scale: 0.76,
    width: 243,
    height: 357,
    gap: 9
  },

  compact: {
    label: "C",
    scale: 0.64,
    width: 205,
    height: 301,
    gap: 8
  },

  micro: {
    label: "µ",
    scale: 0.52,
    width: 166,
    height: 244,
    gap: 7
  }
};

export function getIXIAuctionCardScalePreset(size = "xl") {
  return (
    IXI_AUCTION_CARD_SCALE_PRESETS[size] ||
    IXI_AUCTION_CARD_SCALE_PRESETS.xl
  );
}

export function getIXICardScalePreset(size = "xl") {
  return IXI_CARD_SCALE_PRESETS[size] || IXI_CARD_SCALE_PRESETS.xl;
}
