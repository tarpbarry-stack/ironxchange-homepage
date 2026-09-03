import IXIAosGenericContentDominant013 from "../generic/IXIAosGenericContentDominant013";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import IXIAosCommercialEditorBridge from "../../card-runtime/modules/IXIAosCommercialEditorBridge";

export const CARD_013 = Object.freeze({
  cardNumber: 13,
  templateSlug: "aos-card-013",
  nativeWidth: 298,
  nativeHeight: 471,
  railReserve: 23,
  version: 12,
  renderer: "schema-driven-generic"
});

export default function IXIAosCard013(props) {
  return (
    <IXIAosDataContractCardAdapter {...props} minimumCustomFields={9}>
      {contractProps => (
        <IXIAosCommercialEditorBridge {...contractProps} object={contractProps.object} minimumCustomFields={9} mediaEnabled>
          {({ object: runtimeObject }) => <IXIAosGenericContentDominant013 {...contractProps} object={runtimeObject} />}
        </IXIAosCommercialEditorBridge>
      )}
    </IXIAosDataContractCardAdapter>
  );
}
