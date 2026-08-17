import IXIAosGenericStructuralContainer017 from "../generic/IXIAosGenericStructuralContainer017";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";

export const CARD_017 = Object.freeze({
  cardNumber: 17,
  templateSlug: "aos-card-017",
  nativeWidth: 298,
  nativeHeight: 471,
  railReserve: 23,
  version: 12,
  renderer: "schema-driven-generic-structural-container"
});

export default function IXIAosCard017(props) {
  return (
    <IXIAosDataContractCardAdapter {...props} minimumCustomFields={4}>
      {contractProps => <IXIAosGenericStructuralContainer017 {...contractProps} />}
    </IXIAosDataContractCardAdapter>
  );
}
