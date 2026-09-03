import IXIAosGenericMetricDominant011 from "../generic/IXIAosGenericMetricDominant011";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import IXIAosCommercialEditorBridge from "../../card-runtime/modules/IXIAosCommercialEditorBridge";

export const CARD_011 = Object.freeze({
  cardNumber: 11,
  templateSlug: "aos-card-011",
  nativeWidth: 298,
  nativeHeight: 471,
  railReserve: 23,
  version: 12,
  renderer: "schema-driven-generic"
});

export default function IXIAosCard011(props) {
  return (
    <IXIAosDataContractCardAdapter {...props} minimumCustomFields={9}>
      {contractProps => (
        <IXIAosCommercialEditorBridge {...contractProps} object={contractProps.object} minimumCustomFields={9} mediaEnabled>
          {({ object: runtimeObject }) => <IXIAosGenericMetricDominant011 {...contractProps} object={runtimeObject} />}
        </IXIAosCommercialEditorBridge>
      )}
    </IXIAosDataContractCardAdapter>
  );
}
