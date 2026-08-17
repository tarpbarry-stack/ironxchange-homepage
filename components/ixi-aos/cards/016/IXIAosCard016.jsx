import IXIAosGenericSequence016 from "../generic/IXIAosGenericSequence016";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";

export const CARD_016 = Object.freeze({
  cardNumber: 16,
  templateSlug: "aos-card-016",
  nativeWidth: 298,
  nativeHeight: 471,
  railReserve: 23,
  version: 12,
  renderer: "schema-driven-generic"
});

export default function IXIAosCard016(props) {
  return (
    <IXIAosDataContractCardAdapter {...props} minimumCustomFields={11}>
      {contractProps => <IXIAosGenericSequence016 {...contractProps} />}
    </IXIAosDataContractCardAdapter>
  );
}
