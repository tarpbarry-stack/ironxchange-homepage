import {
  getMachineAccess,
  getMachineChannel,
  IXI_MACHINE_CHANNELS
} from "../../lib/machine-access/IXIMachineAccess";

export const IXI_CARD_FAMILIES = Object.freeze({
  MARKETPLACE: "marketplace",
  PRIVATE: "private",
  AUCTION: "auction"
});

export function getMachineCardFamily(listing = {}) {
  const channel = getMachineChannel(listing);
  const access = getMachineAccess(listing);

  if (channel === IXI_MACHINE_CHANNELS.AUCTION) {
    return IXI_CARD_FAMILIES.AUCTION;
  }

  if (access === "private") {
    return IXI_CARD_FAMILIES.PRIVATE;
  }

  return IXI_CARD_FAMILIES.MARKETPLACE;
}
