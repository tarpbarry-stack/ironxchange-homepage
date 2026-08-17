import IXIAosGenericMediaDominant009 from "../generic/IXIAosGenericMediaDominant009";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";

export const CARD_009 = Object.freeze({
  cardNumber: 9,
  templateSlug: "aos-card-009",
  nativeWidth: 298,
  nativeHeight: 471,
  railReserve: 23,
  version: 12,
  renderer: "schema-driven-generic"
});

export default function IXIAosCard009(props) {
  return (
    <IXIAosDataContractCardAdapter {...props} minimumCustomFields={6}>
      {contractProps => <IXIAosGenericMediaDominant009 {...contractProps} />}
    </IXIAosDataContractCardAdapter>
  );
}
