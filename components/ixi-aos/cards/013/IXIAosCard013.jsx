import IXIAosGenericContentDominant013 from "../generic/IXIAosGenericContentDominant013";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import IXIAosFace1CardRuntime from "../../card-runtime/modules/IXIAosFace1CardRuntime";

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
        <IXIAosFace1CardRuntime object={contractProps.object} onSaveObject={contractProps.onSaveObject} maxFields={9}>
          {face1 => <IXIAosGenericContentDominant013 {...contractProps} object={face1.object} onSaveObject={face1.onSaveObject} />}
        </IXIAosFace1CardRuntime>
      )}
    </IXIAosDataContractCardAdapter>
  );
}
