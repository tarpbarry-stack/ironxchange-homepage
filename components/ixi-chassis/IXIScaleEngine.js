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

export {
  IXI_CARD_SCALE_SEQUENCE,
  getNextCardScaleMode
};
