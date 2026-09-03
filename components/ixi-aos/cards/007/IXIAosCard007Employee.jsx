import IXIAosGenericUniversalLayout007 from "../generic/IXIAosGenericUniversalLayout007";
import IXIAosCard007MediaGeometry from "./IXIAosCard007MediaGeometry";
import IXIAosV12LibraryReadability from "../../card-runtime/modules/IXIAosV12LibraryReadability";
import IXIAosV12Face1EditPatch from "../../card-runtime/modules/IXIAosV12Face1EditPatch";

/* Compatibility export: Card 007A universal geometry. */
export default function IXIAosCard007Employee(props) {
  return (
    <div className="ixi-v12-library-readable ixi-v12-face1-edit" style={{ width: 298, height: 471 }}>
      <IXIAosGenericUniversalLayout007 {...props} />
      <IXIAosCard007MediaGeometry />
      <IXIAosV12LibraryReadability />
      <IXIAosV12Face1EditPatch />
    </div>
  );
}
