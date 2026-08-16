import IXIAosLocationOverviewCard from "../location/IXIAosLocationOverviewCard";

export const CARD_002_LOCATION = Object.freeze({
  cardNumber: 2,
  templateSlug: "location-standard-002",
  nativeWidth: 298,
  nativeHeight: 471,
  railReserve: 19,
  label: "Container Layout 002",
  section: "AOS CONTAINER LAYOUTS",
  version: 12,
  renderer: "schema-driven-generic"
});

export default function IXIAosCard002Location(props) {
  return <IXIAosLocationOverviewCard {...props} variant="002" />;
}
