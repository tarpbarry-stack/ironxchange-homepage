import IXIAosGenericStructuralContainer017 from "../generic/IXIAosGenericStructuralContainer017";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import IXIAosFace1CardRuntime from "../../card-runtime/modules/IXIAosFace1CardRuntime";

export const CARD_017 = Object.freeze({
  cardNumber: 17,
  templateSlug: "aos-card-017",
  nativeWidth: 298,
  nativeHeight: 471,
  railReserve: 23,
  version: 12,
  renderer: "schema-driven-generic-structural-container"
});

export default function IXIAosCard017(props) {
  return (
    <IXIAosDataContractCardAdapter {...props} minimumCustomFields={4}>
      {contractProps => (
        <IXIAosFace1CardRuntime object={contractProps.object} onSaveObject={contractProps.onSaveObject} maxFields={4}>
          {face1 => <IXIAosGenericStructuralContainer017 {...contractProps} object={face1.object} onSaveObject={face1.onSaveObject} />}
        </IXIAosFace1CardRuntime>
      )}
    </IXIAosDataContractCardAdapter>
  );
}
