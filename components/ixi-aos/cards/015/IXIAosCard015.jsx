import IXIAosGenericAgreement015 from "../generic/IXIAosGenericAgreement015";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import IXIAosCommercialEditorBridge from "../../card-runtime/modules/IXIAosCommercialEditorBridge";

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
        <IXIAosCommercialEditorBridge {...contractProps} object={contractProps.object} minimumCustomFields={11} mediaEnabled>
          {({ object: runtimeObject }) => <IXIAosGenericAgreement015 {...contractProps} object={runtimeObject} />}
        </IXIAosCommercialEditorBridge>
      )}
    </IXIAosDataContractCardAdapter>
  );
}
