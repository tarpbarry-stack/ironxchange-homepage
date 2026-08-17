import IXIAosLocationFace3V12 from "./IXIAosLocationFace3V12";

export const LOCATION_FACE3_OWNED_V12 = Object.freeze({
  faceNumber: 3,
  variant: "owned",
  version: 12,
  nativeWidth: 298,
  nativeHeight: 471,
  renderer: "location-financial-owned-v12"
});

export default function IXIAosLocationFace3OwnedV12(props) {
  return <IXIAosLocationFace3V12 {...props} mode="owned" />;
}
