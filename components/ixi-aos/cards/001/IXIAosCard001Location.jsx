import IXIAosLocationOverviewCard from "../location/IXIAosLocationOverviewCard";
import IXIAosV12CardPolish from "../../card-runtime/modules/IXIAosV12CardPolish";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";

export const CARD_001_LOCATION = Object.freeze({
  cardNumber: 1,
  templateSlug: "location-standard",
  nativeWidth: 298,
  nativeHeight: 471,
  railReserve: 19,
  label: "Container Layout 001",
  section: "AOS CONTAINER LAYOUTS",
  version: 12,
  renderer: "schema-driven-generic"
});

export default function IXIAosCard001Location(props) {
  return (
    <IXIAosDataContractCardAdapter {...props}>
      {contractProps => (
        <>
          <IXIAosLocationOverviewCard {...contractProps} variant="001" />
          <IXIAosV12CardPolish />
        </>
      )}
    </IXIAosDataContractCardAdapter>
  );
}
