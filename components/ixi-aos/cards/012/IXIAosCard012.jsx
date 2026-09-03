import IXIAosGenericLifecycle012 from "../generic/IXIAosGenericLifecycle012";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import IXIAosFace1CardRuntime from "../../card-runtime/modules/IXIAosFace1CardRuntime";

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
        <IXIAosFace1CardRuntime object={contractProps.object} onSaveObject={contractProps.onSaveObject} maxFields={10}>
          {face1 => <IXIAosGenericLifecycle012 {...contractProps} object={face1.object} onSaveObject={face1.onSaveObject} />}
        </IXIAosFace1CardRuntime>
      )}
    </IXIAosDataContractCardAdapter>
  );
}
