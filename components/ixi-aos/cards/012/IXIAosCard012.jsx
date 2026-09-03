import IXIAosGenericLifecycle012 from "../generic/IXIAosGenericLifecycle012";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import IXIAosCommercialEditorBridge from "../../card-runtime/modules/IXIAosCommercialEditorBridge";

export const CARD_012 = Object.freeze({
  cardNumber: 12,
  templateSlug: "aos-card-012",
  nativeWidth: 298,
  nativeHeight: 471,
  railReserve: 23,
  version: 12,
  renderer: "schema-driven-generic"
});

export default function IXIAosCard012(props) {
  return (
    <IXIAosDataContractCardAdapter {...props} minimumCustomFields={10}>
      {contractProps => (
        <IXIAosCommercialEditorBridge {...contractProps} object={contractProps.object} minimumCustomFields={10} mediaEnabled>
          {({ object: runtimeObject }) => <IXIAosGenericLifecycle012 {...contractProps} object={runtimeObject} />}
        </IXIAosCommercialEditorBridge>
      )}
    </IXIAosDataContractCardAdapter>
  );
}
