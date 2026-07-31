import ListingCard from "../ListingCard";

import AuctionListingCard from "./auction/AuctionListingCard";

import {
  getMachineCardFamily
} from "./getMachineCardFamily";

export default function IXIMachineCard({
  cardContext = "workspace",
  ...props
}) {
  const cardFamily =
    getMachineCardFamily(props.listing);

  console.log("IXI MACHINE CARD FAMILY", {
    listingId:
      props.listing?.id?.uuid ||
      props.listing?.id ||
      "",
    cardFamily
  });

 if (cardFamily === "auction") {
  return (
    <AuctionListingCard
      {...props}
      cardContext={cardContext}
    />
  );
}

return (
  <ListingCard
    {...props}
    cardContext={cardContext}
  />
);
}
