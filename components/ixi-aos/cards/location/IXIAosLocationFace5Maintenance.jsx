import IXIAosGenericConfiguredFaceV12 from "../generic/IXIAosGenericConfiguredFaceV12";

export const LOCATION_FACE_5_MAINTENANCE = Object.freeze({
  faceNumber: 5,
  version: 12,
  nativeWidth: 298,
  nativeHeight: 471,
  renderer: "schema-driven-generic"
});

export default function IXIAosLocationFace5Maintenance({
  maintenanceSnapshot = {},
  ...props
}) {
  return (
    <IXIAosGenericConfiguredFaceV12
      {...props}
      faceNumber={5}
      runtimeData={maintenanceSnapshot}
    />
  );
}
