export const IXI_MOBILE_VIEWPORT_MAX = 767;
export const IXI_MOBILE_SINGLE_GUTTER = 8;
export const IXI_MOBILE_SINGLE_MAX_SCALE = 1.4;

export const IXI_MOBILE_CARD_GEOMETRY = Object.freeze({
  marketplace: Object.freeze({ nativeWidth: 300, nativeHeight: 400 }),
  private: Object.freeze({ nativeWidth: 300, nativeHeight: 475 }),
  auction: Object.freeze({ nativeWidth: 300, nativeHeight: 475 })
});

export function resolveIXIViewportMode(width) {
  const numericWidth = Number(width);
  if (!Number.isFinite(numericWidth) || numericWidth <= 0) return "desktop";
  return numericWidth <= IXI_MOBILE_VIEWPORT_MAX ? "mobile" : "desktop";
}

export function getIXIMobileCardGeometry(cardFamily = "marketplace") {
  return IXI_MOBILE_CARD_GEOMETRY[cardFamily] || IXI_MOBILE_CARD_GEOMETRY.marketplace;
}

export function resolveIXIMobileSingleCardMetrics({
  viewportWidth,
  cardFamily = "marketplace",
  gutter = IXI_MOBILE_SINGLE_GUTTER,
  maxScale = IXI_MOBILE_SINGLE_MAX_SCALE
} = {}) {
  const width = Number(viewportWidth);
  const safeGutter = Math.max(0, Number(gutter) || 0);
  const safeMaxScale = Math.max(1, Number(maxScale) || 1);
  const geometry = getIXIMobileCardGeometry(cardFamily);
  const nativeWidth = geometry.nativeWidth;
  const nativeHeight = geometry.nativeHeight;

  if (!Number.isFinite(width) || width <= 0) {
    return {
      cardFamily,
      scale: 1,
      renderedWidth: nativeWidth,
      renderedHeight: nativeHeight,
      nativeWidth,
      nativeHeight,
      gutter: safeGutter
    };
  }

  const availableWidth = Math.max(nativeWidth, width - (safeGutter * 2));
  const scale = Math.min(safeMaxScale, availableWidth / nativeWidth);

  return {
    cardFamily,
    scale,
    renderedWidth: nativeWidth * scale,
    renderedHeight: nativeHeight * scale,
    nativeWidth,
    nativeHeight,
    gutter: safeGutter
  };
}
