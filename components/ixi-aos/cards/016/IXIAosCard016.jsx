import IXIAosGenericSequence016 from "../generic/IXIAosGenericSequence016";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import IXIAosFace1CardRuntime from "../../card-runtime/modules/IXIAosFace1CardRuntime";

export const CARD_016 = Object.freeze({
  cardNumber: 16,
  templateSlug: "aos-card-016",
  nativeWidth: 298,
  nativeHeight: 471,
  railReserve: 23,
  version: 12,
  renderer: "schema-driven-generic"
});

export default function IXIAosCard016(props) {
  return (
    <IXIAosDataContractCardAdapter {...props} minimumCustomFields={11}>
      {contractProps => (
        <IXIAosFace1CardRuntime object={contractProps.object} onSaveObject={contractProps.onSaveObject} maxFields={11}>
          {face1 => <IXIAosGenericSequence016 {...contractProps} object={face1.object} onSaveObject={face1.onSaveObject} />}
        </IXIAosFace1CardRuntime>
      )}
    </IXIAosDataContractCardAdapter>
  );
}
