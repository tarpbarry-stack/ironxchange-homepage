// Keep each native card intact. Wider Consoles wrap after two native panels.
export function getMobileAssemblyGeometry({ nativeWidth, nativeHeight, availableWidth, measuredHeight }) {
  const width = Math.min(600, Math.max(1, Number(nativeWidth) || 300));
  const height = Math.max(1, Number(measuredHeight) || Number(nativeHeight) || 475);
  const scale = Math.min(1.4, Math.max(1, Number(availableWidth) || 1) / width);
  return { width, height, scale, renderedWidth: width * scale, renderedHeight: height * scale };
}

export function getMobileTransactFootprint(depth = 1) {
  const count = Math.max(1, Math.floor(Number(depth) || 1));
  return { width: Math.min(2, count) * 298, height: Math.ceil(count / 2) * 471 };
}
