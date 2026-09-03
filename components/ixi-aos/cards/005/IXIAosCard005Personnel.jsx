import IXIAosGenericContainerLayoutV12 from "../generic/IXIAosGenericContainerLayoutV12";
import IXIAosGenericCardRailShell from "../generic/IXIAosGenericCardRailShell";
import IXIAosV12CardPolish from "../../card-runtime/modules/IXIAosV12CardPolish";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import IXIAosV12LibraryReadability from "../../card-runtime/modules/IXIAosV12LibraryReadability";
import IXIAosV12Face1EditPatch from "../../card-runtime/modules/IXIAosV12Face1EditPatch";

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
        <div className="ixi-v12-library-readable ixi-v12-face1-edit" style={{ width: 298, height: 471 }}>
          <IXIAosGenericCardRailShell {...contractProps} object={contractProps.object} face={1}>
            <IXIAosGenericContainerLayoutV12 {...contractProps} object={contractProps.object} variant={2} />
          </IXIAosGenericCardRailShell>
          <IXIAosV12CardPolish />
          <IXIAosV12LibraryReadability />
          <IXIAosV12Face1EditPatch />
        </div>
      )}
    </IXIAosDataContractCardAdapter>
  );
}
