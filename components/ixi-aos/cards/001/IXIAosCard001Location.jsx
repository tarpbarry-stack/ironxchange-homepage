import IXIAosLocationOverviewCard from "../location/IXIAosLocationOverviewCard";

export const CARD_001_LOCATION = Object.freeze({
  cardNumber: 1,
  templateSlug: "location-standard",
  nativeWidth: 298,
  nativeHeight: 471,
  railReserve: 19,
  label: "Location",
  section: "LOCATIONS & FACILITIES",
  version: 14
});

export default function IXIAosCard001Location(props) {
  return <IXIAosLocationOverviewCard {...props} variant="001" />;
}
