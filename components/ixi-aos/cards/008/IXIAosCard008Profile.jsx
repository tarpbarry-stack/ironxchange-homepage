import IXIAosGenericObjectLayout007 from "../generic/IXIAosGenericObjectLayout007";
import IXIAosGenericCardRailShell from "../generic/IXIAosGenericCardRailShell";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import IXIAosCommercialEditorBridge from "../../card-runtime/modules/IXIAosCommercialEditorBridge";

/*
 * Card 008 — profile / identity presentation recipe.
 * The renderer remains noun-agnostic; sample content never defines runtime meaning.
 * Parent identity is supplied by the shared numbered-card data-contract adapter.
 */
export default function IXIAosCard008Profile(props) {
  return (
    <IXIAosDataContractCardAdapter {...props}>
      {contractProps => (
        <IXIAosCommercialEditorBridge object={contractProps.object} onSaveObject={contractProps.onSaveObject}>
          {({ object }) => (
            <IXIAosGenericCardRailShell {...contractProps} object={object} face={1}>
              <IXIAosGenericObjectLayout007 {...contractProps} object={object} />
            </IXIAosGenericCardRailShell>
          )}
        </IXIAosCommercialEditorBridge>
      )}
    </IXIAosDataContractCardAdapter>
  );
}