import AuctionListingCard from "./auction/AuctionListingCard";
import PrivateListingCard from "./private/PrivateListingCard";
import MarketplaceListingCard
  from "./marketplace/MarketplaceListingCard";

import {
  getMachineCardFamily
} from "./getMachineCardFamily";

import resolveMachineCardPresentation
  from "./resolveMachineCardPresentation";

export default function IXIMachineCard({
  cardContext = "workspace",
  ...props
}) {
  const cardFamily =
    getMachineCardFamily(props.listing);

  const presentation =
    resolveMachineCardPresentation({
      cardFamily,
      cardContext,
      sellerMode: props.sellerMode
    });

  if (!props.suppressFamilyLog) {
    console.log(
      "IXI MACHINE CARD FAMILY",
      {
        listingId:
          props.listing?.id?.uuid ||
          props.listing?.id ||
          "",
        cardFamily,
        cardContext,
        presentation,
        showMachineRail:
          props.showMachineRail
      }
    );
  }

  if (cardFamily === "auction") {
    return (
      <AuctionListingCard
        {...props}
        cardContext={cardContext}
        presentation={presentation}
      />
    );
  }

  if (cardFamily === "private") {
    return (
      <PrivateListingCard
        {...props}
        cardContext={cardContext}
        presentation={presentation}
      />
    );
  }

  return (
    <MarketplaceListingCard
      {...props}
      cardContext={cardContext}
      presentation={presentation}
    />
  );
}
