import IXIAosGenericAgreement015 from "../generic/IXIAosGenericAgreement015";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";

export const CARD_015 = Object.freeze({
  cardNumber: 15,
  templateSlug: "aos-card-015",
  nativeWidth: 298,
  nativeHeight: 471,
  railReserve: 23,
  version: 12,
  renderer: "schema-driven-generic"
});

export default function IXIAosCard015(props) {
  return (
    <IXIAosDataContractCardAdapter {...props} minimumCustomFields={11}>
      {contractProps => <IXIAosGenericAgreement015 {...contractProps} />}
    </IXIAosDataContractCardAdapter>
  );
}
