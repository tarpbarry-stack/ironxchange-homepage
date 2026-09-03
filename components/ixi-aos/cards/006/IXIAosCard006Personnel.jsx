import IXIAosGenericContainerLayoutV12 from "../generic/IXIAosGenericContainerLayoutV12";
import IXIAosGenericCardRailShell from "../generic/IXIAosGenericCardRailShell";
import IXIAosV12CardPolish from "../../card-runtime/modules/IXIAosV12CardPolish";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import IXIAosCommercialEditorBridge from "../../card-runtime/modules/IXIAosCommercialEditorBridge";

export const AOS_CARD_006_PERSONNEL = Object.freeze({
  cardNumber: 6,
  cardId: "006-generic-container-v12",
  templateSlug: "personnel-container-006",
  label: "Container Layout 006",
  version: 12,
  variant: "dashboard"
});

export default function IXIAosCard006Personnel(props) {
  return (
    <IXIAosDataContractCardAdapter {...props}>
      {contractProps => (
        <IXIAosCommercialEditorBridge object={contractProps.object} onSaveObject={contractProps.onSaveObject}>
          {({ object }) => (
            <>
              <IXIAosGenericCardRailShell {...contractProps} object={object} face={1}>
                <IXIAosGenericContainerLayoutV12 {...contractProps} object={object} variant={3} />
              </IXIAosGenericCardRailShell>
              <IXIAosV12CardPolish />
            </>
          )}
        </IXIAosCommercialEditorBridge>
      )}
    </IXIAosDataContractCardAdapter>
  );
}