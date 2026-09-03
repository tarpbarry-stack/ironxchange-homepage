import IXIAosGenericMediaDominant009 from "../generic/IXIAosGenericMediaDominant009";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import IXIAosV12LibraryReadability from "../../card-runtime/modules/IXIAosV12LibraryReadability";
import IXIAosV12Face1EditPatch from "../../card-runtime/modules/IXIAosV12Face1EditPatch";

export const CARD_009 = Object.freeze({
  cardNumber: 9,
  templateSlug: "aos-card-009",
  nativeWidth: 298,
  nativeHeight: 471,
  railReserve: 23,
  version: 12,
  renderer: "schema-driven-generic"
});

export default function IXIAosCard009(props) {
  return (
    <IXIAosDataContractCardAdapter {...props} minimumCustomFields={7}>
      {contractProps => (
        <div className="ixi-v12-library-readable ixi-v12-face1-edit" style={{ width: 298, height: 471 }}>
          <IXIAosGenericMediaDominant009 {...contractProps} />
          <IXIAosV12LibraryReadability />
          <IXIAosV12Face1EditPatch />
        </div>
      )}
    </IXIAosDataContractCardAdapter>
  );
}
