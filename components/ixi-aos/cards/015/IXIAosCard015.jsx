import IXIAosGenericAgreement015 from "../generic/IXIAosGenericAgreement015";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import IXIAosFace1CardRuntime from "../../card-runtime/modules/IXIAosFace1CardRuntime";

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
      {contractProps => (
        <IXIAosFace1CardRuntime object={contractProps.object} onSaveObject={contractProps.onSaveObject} maxFields={11}>
          {face1 => <IXIAosGenericAgreement015 {...contractProps} object={face1.object} onSaveObject={face1.onSaveObject} />}
        </IXIAosFace1CardRuntime>
      )}
    </IXIAosDataContractCardAdapter>
  );
}
