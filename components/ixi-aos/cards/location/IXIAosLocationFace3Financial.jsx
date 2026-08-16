import IXIAosGenericConfiguredFaceV12 from "../generic/IXIAosGenericConfiguredFaceV12";

export const LOCATION_FACE_3_FINANCIAL = Object.freeze({
  faceNumber: 3,
  version: 12,
  nativeWidth: 298,
  nativeHeight: 471,
  renderer: "schema-driven-generic"
});

export default function IXIAosLocationFace3Financial(props) {
  return (
    <IXIAosGenericConfiguredFaceV12
      {...props}
      faceNumber={3}
    />
  );
}
