import IXIAosGenericMetricDominant011 from "../generic/IXIAosGenericMetricDominant011";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import IXIAosFace1CardRuntime from "../../card-runtime/modules/IXIAosFace1CardRuntime";

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
        <IXIAosFace1CardRuntime object={contractProps.object} onSaveObject={contractProps.onSaveObject} maxFields={9}>
          {face1 => <IXIAosGenericMetricDominant011 {...contractProps} object={face1.object} onSaveObject={face1.onSaveObject} />}
        </IXIAosFace1CardRuntime>
      )}
    </IXIAosDataContractCardAdapter>
  );
}
