import IXIAosGenericContainerLayoutV12 from "../generic/IXIAosGenericContainerLayoutV12";
import IXIAosGenericCardRailShell from "../generic/IXIAosGenericCardRailShell";
import IXIAosV12CardPolish from "../../card-runtime/modules/IXIAosV12CardPolish";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";

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
        <>
          <IXIAosGenericCardRailShell object={contractProps.object} {...contractProps} face={1}>
            <IXIAosGenericContainerLayoutV12 {...contractProps} variant={2} />
          </IXIAosGenericCardRailShell>
          <IXIAosV12CardPolish />
        </>
      )}
    </IXIAosDataContractCardAdapter>
  );
}
