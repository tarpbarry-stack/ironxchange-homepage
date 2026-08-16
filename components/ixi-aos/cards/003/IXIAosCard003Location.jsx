import IXIAosLocationOverviewCard from "../location/IXIAosLocationOverviewCard";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";

export const CARD_003_LOCATION = Object.freeze({
  cardNumber: 3,
  templateSlug: "location-standard-003",
  nativeWidth: 298,
  nativeHeight: 471,
  railReserve: 19,
  label: "Container Layout 003",
  section: "AOS CONTAINER LAYOUTS",
  version: 12,
  renderer: "schema-driven-generic"
});

export default function IXIAosCard003Location(props) {
  return (
    <IXIAosDataContractCardAdapter {...props}>
      {contractProps => <IXIAosLocationOverviewCard {...contractProps} variant="003" />}
    </IXIAosDataContractCardAdapter>
  );
}
