import ListingCard from "../ListingCard";
import { getMachineCardFamily } from "./getMachineCardFamily";

export default function IXIMachineCard(props) {
  const family = getMachineCardFamily(props.listing);

  return (
    <ListingCard
      {...props}
      resolvedCardFamily={family}
    />
  );
}
