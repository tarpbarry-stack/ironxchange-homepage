import IXIAosGenericCondition014 from "../generic/IXIAosGenericCondition014";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import IXIAosFace1CardRuntime from "../../card-runtime/modules/IXIAosFace1CardRuntime";

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
        <IXIAosFace1CardRuntime object={contractProps.object} onSaveObject={contractProps.onSaveObject} maxFields={10}>
          {face1 => <IXIAosGenericCondition014 {...contractProps} object={face1.object} onSaveObject={face1.onSaveObject} />}
        </IXIAosFace1CardRuntime>
      )}
    </IXIAosDataContractCardAdapter>
  );
}
