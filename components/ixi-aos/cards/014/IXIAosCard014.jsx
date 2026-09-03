import IXIAosGenericCondition014 from "../generic/IXIAosGenericCondition014";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import IXIAosCommercialEditorBridge from "../../card-runtime/modules/IXIAosCommercialEditorBridge";

export const CARD_014 = Object.freeze({
  cardNumber: 14,
  templateSlug: "aos-card-014",
  nativeWidth: 298,
  nativeHeight: 471,
  railReserve: 23,
  version: 12,
  renderer: "schema-driven-generic"
});

export default function IXIAosCard014(props) {
  return (
    <IXIAosDataContractCardAdapter {...props} minimumCustomFields={10}>
      {contractProps => (
        <IXIAosCommercialEditorBridge {...contractProps} object={contractProps.object} minimumCustomFields={10} mediaEnabled>
          {({ object: runtimeObject }) => <IXIAosGenericCondition014 {...contractProps} object={runtimeObject} />}
        </IXIAosCommercialEditorBridge>
      )}
    </IXIAosDataContractCardAdapter>
  );
}
