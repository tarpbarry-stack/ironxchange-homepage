import IXIAosLocationFace3V12 from "./IXIAosLocationFace3V12";

export const LOCATION_FACE3_LEASED_V12 = Object.freeze({
  faceNumber: 3,
  variant: "leased",
  version: 12,
  nativeWidth: 300,
  nativeHeight: 475,
  renderer: "location-financial-leased-v12"
});

export default function IXIAosLocationFace3LeasedV12(props) {
  return <IXIAosLocationFace3V12 {...props} mode="leased" />;
}
