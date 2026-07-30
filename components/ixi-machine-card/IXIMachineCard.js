import ListingCard from "../ListingCard";

import {
  getMachineCardFamily
} from "./getMachineCardFamily";

export default function IXIMachineCard(props) {
  const cardFamily =
    getMachineCardFamily(props.listing);

  console.log("IXI MACHINE CARD FAMILY", {
    listingId:
      props.listing?.id?.uuid ||
      props.listing?.id ||
      "",
    cardFamily
  });

  return <ListingCard {...props} />;
}
