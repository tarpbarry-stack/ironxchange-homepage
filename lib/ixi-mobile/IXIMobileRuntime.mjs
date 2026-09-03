export const IXI_MOBILE_VIEWPORT_MAX = 767;
export const IXI_MOBILE_SINGLE_GUTTER = 8;
export const IXI_MOBILE_SINGLE_MAX_SCALE = 1.4;

export const IXI_MOBILE_CARD_GEOMETRIES = Object.freeze({
  marketplace: Object.freeze({ width: 300, height: 400 }),
  private: Object.freeze({ width: 300, height: 475 }),
  aos: Object.freeze({ width: 300, height: 475 })
});

export function resolveIXIViewportMode(width) {
  const numericWidth = Number(width);
  if (!Number.isFinite(numericWidth) || numericWidth <= 0) return "desktop";
  return numericWidth <= IXI_MOBILE_VIEWPORT_MAX ? "mobile" : "desktop";
}

export function getIXIMobileCardGeometry(family = "marketplace") {
  return IXI_MOBILE_CARD_GEOMETRIES[family] || IXI_MOBILE_CARD_GEOMETRIES.marketplace;
}

export function resolveIXIMobileSingleCardMetrics({
  viewportWidth,
  family = "marketplace",
  gutter = IXI_MOBILE_SINGLE_GUTTER,
  maxScale = IXI_MOBILE_SINGLE_MAX_SCALE
} = {}) {
  const geometry = getIXIMobileCardGeometry(family);
  const width = Number(viewportWidth);
  const safeGutter = Math.max(0, Number(gutter) || 0);
  const safeMaxScale = Math.max(1, Number(maxScale) || 1);
  const availableWidth = Number.isFinite(width) && width > 0
    ? Math.max(geometry.width, width - (safeGutter * 2))
    : geometry.width;
  const scale = Math.min(safeMaxScale, availableWidth / geometry.width);

  return {
    family,
    scale,
    nativeWidth: geometry.width,
    nativeHeight: geometry.height,
    renderedWidth: geometry.width * scale,
    renderedHeight: geometry.height * scale,
    gutter: safeGutter
  };
}
