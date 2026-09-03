export const IXI_MOBILE_VIEWPORT_MAX = 767;
export const IXI_MOBILE_SINGLE_GUTTER = 8;
export const IXI_MARKETPLACE_NATIVE_WIDTH = 300;
export const IXI_MARKETPLACE_NATIVE_HEIGHT = 400;
export const IXI_MOBILE_SINGLE_MAX_SCALE = 1.4;

export function resolveIXIViewportMode(width) {
  const numericWidth = Number(width);
  if (!Number.isFinite(numericWidth) || numericWidth <= 0) {
    return "desktop";
  }

  return numericWidth <= IXI_MOBILE_VIEWPORT_MAX
    ? "mobile"
    : "desktop";
}

export function resolveIXIMobileSingleCardMetrics({
  viewportWidth,
  gutter = IXI_MOBILE_SINGLE_GUTTER,
  nativeWidth = IXI_MARKETPLACE_NATIVE_WIDTH,
  nativeHeight = IXI_MARKETPLACE_NATIVE_HEIGHT,
  maxScale = IXI_MOBILE_SINGLE_MAX_SCALE
} = {}) {
  const width = Number(viewportWidth);
  const safeGutter = Math.max(0, Number(gutter) || 0);
  const safeNativeWidth = Math.max(1, Number(nativeWidth) || 1);
  const safeNativeHeight = Math.max(1, Number(nativeHeight) || 1);
  const safeMaxScale = Math.max(1, Number(maxScale) || 1);

  if (!Number.isFinite(width) || width <= 0) {
    return {
      scale: 1,
      renderedWidth: safeNativeWidth,
      renderedHeight: safeNativeHeight,
      nativeWidth: safeNativeWidth,
      nativeHeight: safeNativeHeight,
      gutter: safeGutter
    };
  }

  const availableWidth = Math.max(
    safeNativeWidth,
    width - (safeGutter * 2)
  );

  const scale = Math.min(
    safeMaxScale,
    availableWidth / safeNativeWidth
  );

  return {
    scale,
    renderedWidth: safeNativeWidth * scale,
    renderedHeight: safeNativeHeight * scale,
    nativeWidth: safeNativeWidth,
    nativeHeight: safeNativeHeight,
    gutter: safeGutter
  };
}
