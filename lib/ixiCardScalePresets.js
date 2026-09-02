import {
  IXI_SCALE_MODES,
  getIXIObjectFootprint
} from "./ixiObjectGeometry";

function createCardScalePresets(
  objectFamily
) {
  return Object.freeze(
    Object.fromEntries(
      Object.keys(
        IXI_SCALE_MODES
      ).map(scaleMode => {
        const footprint =
          getIXIObjectFootprint({
            scaleMode,
            objectFamily
          });

        return [
          scaleMode,
          Object.freeze({
            label: footprint.label,
            scale: footprint.scale,
            width: footprint.renderedWidth,
            height: footprint.renderedHeight,
            gap: footprint.columnGap
          })
        ];
      })
    )
  );
}

export const IXI_CARD_SCALE_PRESETS =
  createCardScalePresets(
    "marketplace"
  );

export const IXI_AUCTION_CARD_SCALE_PRESETS =
  createCardScalePresets(
    "auction"
  );

export function getIXIAuctionCardScalePreset(size = "xl") {
  return (
    IXI_AUCTION_CARD_SCALE_PRESETS[size] ||
    IXI_AUCTION_CARD_SCALE_PRESETS.xl
  );
}

export function getIXICardScalePreset(size = "xl") {
  return IXI_CARD_SCALE_PRESETS[size] || IXI_CARD_SCALE_PRESETS.xl;
}
