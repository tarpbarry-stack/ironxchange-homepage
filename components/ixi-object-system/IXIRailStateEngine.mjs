export const IXI_RELATIONSHIP_COLORS = Object.freeze([
  "none",
  "green",
  "yellow",
  "red",
  "cyan",
  "white",
  "blue",
  "orange"
]);

export const IXI_RELATIONSHIP_OUTLINES = Object.freeze([1, 3, 5, 0]);

export function getNextIXIRelationshipColor(value) {
  const current = String(value ?? "").trim().toLowerCase() || "none";
  const index = IXI_RELATIONSHIP_COLORS.indexOf(current);

  return IXI_RELATIONSHIP_COLORS[
    (Math.max(index, 0) + 1) % IXI_RELATIONSHIP_COLORS.length
  ];
}

export function getNextIXIRelationshipOutline(value) {
  const current = Number(value ?? 1);
  const index = IXI_RELATIONSHIP_OUTLINES.indexOf(current);

  return IXI_RELATIONSHIP_OUTLINES[
    (Math.max(index, 0) + 1) % IXI_RELATIONSHIP_OUTLINES.length
  ];
}
