import IXIAosGenericContainerLayoutV12 from "../generic/IXIAosGenericContainerLayoutV12";
import IXIAosGenericCardRailShell from "../generic/IXIAosGenericCardRailShell";
import IXIAosV12CardPolish from "../../card-runtime/modules/IXIAosV12CardPolish";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import IXIAosFace1CardRuntime from "../../card-runtime/modules/IXIAosFace1CardRuntime";

export const AOS_CARD_004_PERSONNEL = Object.freeze({
  cardNumber: 4,
  cardId: "004-generic-container-v12",
  templateSlug: "personnel-container-004",
  label: "Container Layout 004",
  version: 12,
  variant: "summary"
});

export default function IXIAosCard004Personnel(props) {
  return (
    <IXIAosDataContractCardAdapter {...props}>
      {contractProps => (
        <IXIAosFace1CardRuntime object={contractProps.object} onSaveObject={contractProps.onSaveObject} maxFields={0}>
          {face1 => (
            <>
              <IXIAosGenericCardRailShell {...contractProps} object={face1.object} face={1}>
                <IXIAosGenericContainerLayoutV12 {...contractProps} object={face1.object} onSaveObject={face1.onSaveObject} variant={1} />
              </IXIAosGenericCardRailShell>
              <IXIAosV12CardPolish />
            </>
          )}
        </IXIAosFace1CardRuntime>
      )}
    </IXIAosDataContractCardAdapter>
  );
}
