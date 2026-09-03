import IXIAosGenericContainerLayoutV12 from "../generic/IXIAosGenericContainerLayoutV12";
import IXIAosGenericCardRailShell from "../generic/IXIAosGenericCardRailShell";
import IXIAosV12CardPolish from "../../card-runtime/modules/IXIAosV12CardPolish";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import IXIAosCommercialEditorBridge from "../../card-runtime/modules/IXIAosCommercialEditorBridge";

export const AOS_CARD_005_PERSONNEL = Object.freeze({
  cardNumber: 5,
  cardId: "005-generic-container-v12",
  templateSlug: "personnel-container-005",
  label: "Container Layout 005",
  version: 12,
  variant: "analytic"
});

export default function IXIAosCard005Personnel(props) {
  return (
    <IXIAosDataContractCardAdapter {...props}>
      {contractProps => (
        <IXIAosCommercialEditorBridge object={contractProps.object} onSaveObject={contractProps.onSaveObject}>
          {({ object }) => (
            <>
              <IXIAosGenericCardRailShell {...contractProps} object={object} face={1}>
                <IXIAosGenericContainerLayoutV12 {...contractProps} object={object} variant={2} />
              </IXIAosGenericCardRailShell>
              <IXIAosV12CardPolish />
            </>
          )}
        </IXIAosCommercialEditorBridge>
      )}
    </IXIAosDataContractCardAdapter>
  );
}