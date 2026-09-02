const IXI_CARD_SCALE_SEQUENCE =
  Object.freeze([
    "xl",
    "work",
    "focus",
    "large",
    "medium",
    "compact",
    "micro"
  ]);

const IXI_CARD_SCALE_STEPS =
  Object.freeze([
    "micro",
    "compact",
    "medium",
    "large",
    "xl",
    "work",
    "focus"
  ]);

const IXI_CARD_SCALE_LABELS = Object.freeze({
  micro: "MICRO",
  compact: "COMPACT",
  medium: "MEDIUM",
  large: "LARGE",
  xl: "XL",
  work: "WORK",
  focus: "FOCUS"
});

const IXI_SITEWIDE_CARD_SCALE_STORAGE_KEY =
  "ixi:sitewide-card-scale-mode";

function normalizeCardScaleMode(
  mode,
  fallback = "xl"
) {
  return IXI_CARD_SCALE_STEPS.includes(mode)
    ? mode
    : fallback;
}

function getCardScaleIndex(mode) {
  return Math.max(
    0,
    IXI_CARD_SCALE_STEPS.indexOf(
      normalizeCardScaleMode(mode)
    )
  );
}

function getCardScaleModeAtIndex(index) {
  const nextIndex = Math.max(
    0,
    Math.min(
      IXI_CARD_SCALE_STEPS.length - 1,
      Math.round(Number(index) || 0)
    )
  );

  return IXI_CARD_SCALE_STEPS[nextIndex];
}

function stepCardScaleMode(
  currentMode,
  direction
) {
  return getCardScaleModeAtIndex(
    getCardScaleIndex(currentMode) +
      Math.sign(Number(direction) || 0)
  );
}

function getNextCardScaleMode(
  currentMode
) {
  const currentIndex =
    IXI_CARD_SCALE_SEQUENCE.indexOf(
      currentMode
    );

  return IXI_CARD_SCALE_SEQUENCE[
    (currentIndex + 1) %
      IXI_CARD_SCALE_SEQUENCE.length
  ];
}

function readSitewideCardScaleMode() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const savedMode =
      window.localStorage.getItem(
        IXI_SITEWIDE_CARD_SCALE_STORAGE_KEY
      );

    return IXI_CARD_SCALE_STEPS.includes(savedMode)
      ? savedMode
      : null;
  } catch (error) {
    return null;
  }
}

function writeSitewideCardScaleMode(mode) {
  const nextMode =
    normalizeCardScaleMode(mode);

  if (typeof window === "undefined") {
    return nextMode;
  }

  try {
    window.localStorage.setItem(
      IXI_SITEWIDE_CARD_SCALE_STORAGE_KEY,
      nextMode
    );
  } catch (error) {
    // Workspace persistence still carries the preference.
  }

  return nextMode;
}

function resolveSitewideCardScaleMode(
  workspaceMode,
  fallback = "xl"
) {
  const savedMode =
    readSitewideCardScaleMode();

  if (savedMode) {
    return savedMode;
  }

  const nextMode = normalizeCardScaleMode(
    workspaceMode,
    fallback
  );

  return writeSitewideCardScaleMode(nextMode);
}

export {
  IXI_CARD_SCALE_LABELS,
  IXI_CARD_SCALE_SEQUENCE,
  IXI_CARD_SCALE_STEPS,
  IXI_SITEWIDE_CARD_SCALE_STORAGE_KEY,
  getCardScaleIndex,
  getCardScaleModeAtIndex,
  getNextCardScaleMode,
  normalizeCardScaleMode,
  readSitewideCardScaleMode,
  resolveSitewideCardScaleMode,
  stepCardScaleMode,
  writeSitewideCardScaleMode
};
