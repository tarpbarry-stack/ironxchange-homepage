import IXIAosGenericContainerLayoutV12 from "../generic/IXIAosGenericContainerLayoutV12";
import IXIAosGenericCardRailShell from "../generic/IXIAosGenericCardRailShell";
import IXIAosV12CardPolish from "../../card-runtime/modules/IXIAosV12CardPolish";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import IXIAosV12LibraryReadability from "../../card-runtime/modules/IXIAosV12LibraryReadability";
import IXIAosV12Face1EditPatch from "../../card-runtime/modules/IXIAosV12Face1EditPatch";

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
        <div className="ixi-v12-library-readable ixi-v12-face1-edit" style={{ width: 298, height: 471 }}>
          <IXIAosGenericCardRailShell {...contractProps} object={contractProps.object} face={1}>
            <IXIAosGenericContainerLayoutV12 {...contractProps} object={contractProps.object} variant={1} />
          </IXIAosGenericCardRailShell>
          <IXIAosV12CardPolish />
          <IXIAosV12LibraryReadability />
          <IXIAosV12Face1EditPatch />
        </div>
      )}
    </IXIAosDataContractCardAdapter>
  );
}
