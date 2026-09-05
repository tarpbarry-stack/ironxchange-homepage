import {
  getIXIObjectFootprint
} from "./ixiObjectGeometry.js";

export const IXI_WORKSPACE_CARD_FAMILIES =
  Object.freeze({
    MARKETPLACE: "marketplace",
    PRIVATE: "private",
    AUCTION: "auction",
    AOS: "aos"
  });

const WORKSPACE_CARD_FAMILY_SET =
  new Set(
    [
      ...Object.values(
        IXI_WORKSPACE_CARD_FAMILIES
      ),
      "seller",
      "default"
    ]
  );

export function normalizeIXIWorkspaceCardFamily(
  value,
  fallback =
    IXI_WORKSPACE_CARD_FAMILIES
      .MARKETPLACE
) {
  const family =
    String(value || "")
      .trim()
      .toLowerCase();

  return WORKSPACE_CARD_FAMILY_SET.has(
    family
  )
    ? family
    : fallback;
}

export function getIXIWorkspaceConsoleSlotCount(
  objectState = {},
  {
    maxSlots = 5
  } = {}
) {
  const savedSlots =
    Array.isArray(
      objectState?.consoleSlots
    )
      ? objectState.consoleSlots
      : [];

  const legacySlotCount =
    1 +
    (
      objectState?.consoleLeftOpen ===
        true
        ? 1
        : 0
    ) +
    (
      objectState?.consoleRightOpen ===
        true
        ? 1
        : 0
    );

  const explicitDepth =
    Number(
      objectState?.consoleDepth
    );

  const rawSlotCount =
    savedSlots.length > 0
      ? savedSlots.length
      : Number.isFinite(
          explicitDepth
        )
        ? explicitDepth
        : legacySlotCount;

  return Math.max(
    1,
    Math.min(
      Math.max(
        1,
        Math.floor(
          Number(maxSlots) || 1
        )
      ),
      Math.floor(
        Number(rawSlotCount) || 1
      )
    )
  );
}

export function getIXIWorkspaceCardFootprint({
  cardFamily,
  scaleMode = "xl",
  consoleSlotCount = 1,
  nativeWidth,
  nativeHeight,
  nativeWidthIncludesSlots = false,
  seamOverlap = 1
} = {}) {
  const family =
    normalizeIXIWorkspaceCardFamily(
      cardFamily
    );

  const slotCount =
    Math.max(
      1,
      Math.floor(
        Number(consoleSlotCount) || 1
      )
    );

  const footprint =
    getIXIObjectFootprint({
      scaleMode,
      objectFamily: family,
      nativeWidth,
      nativeHeight,
      slotCount:
        nativeWidthIncludesSlots
          ? 1
          : slotCount,
      seamOverlap
    });

  return {
    ...footprint,
    cardFamily: family,
    consoleSlotCount: slotCount
  };
}
