import IXIAosGenericConfiguredFaceV12 from "../generic/IXIAosGenericConfiguredFaceV12";

export const LOCATION_FACE_4_OBLIGATIONS = Object.freeze({
  faceNumber: 4,
  version: 12,
  nativeWidth: 300,
  nativeHeight: 475,
  renderer: "schema-driven-generic"
});

export default function IXIAosLocationFace4Obligations({
  financialSnapshot = {},
  ...props
}) {
  return (
    <IXIAosGenericConfiguredFaceV12
      {...props}
      faceNumber={4}
      runtimeData={financialSnapshot}
    />
  );
}
