import IXIAosGenericContainerLayoutV12 from "../generic/IXIAosGenericContainerLayoutV12";
import IXIAosGenericCardRailShell from "../generic/IXIAosGenericCardRailShell";
import IXIAosV12CardPolish from "../../card-runtime/modules/IXIAosV12CardPolish";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";

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
        <>
          <IXIAosGenericCardRailShell object={contractProps.object} {...contractProps} face={1}>
            <IXIAosGenericContainerLayoutV12 {...contractProps} variant={3} />
          </IXIAosGenericCardRailShell>
          <IXIAosV12CardPolish />
        </>
      )}
    </IXIAosDataContractCardAdapter>
  );
}
