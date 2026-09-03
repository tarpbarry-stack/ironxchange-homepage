import IXIAosGenericUniversalLayout007B from "../generic/IXIAosGenericUniversalLayout007B";
import IXIAosV12LibraryReadability from "../../card-runtime/modules/IXIAosV12LibraryReadability";
import IXIAosV12Face1EditPatch from "../../card-runtime/modules/IXIAosV12Face1EditPatch";

export default function IXIAosCard007B(props) {
  return (
    <div className="ixi-v12-library-readable ixi-v12-face1-edit" style={{ width: 298, height: 471 }}>
      <IXIAosGenericUniversalLayout007B {...props} />
      <IXIAosV12LibraryReadability />
      <IXIAosV12Face1EditPatch />
    </div>
  );
}
