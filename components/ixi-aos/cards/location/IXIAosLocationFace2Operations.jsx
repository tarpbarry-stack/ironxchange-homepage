import IXIAosLocationFace2OperationsV12, {
  LOCATION_FACE2_SKINS,
  LOCATION_FACE2_V12_LOCK
} from "./IXIAosLocationFace2OperationsV12";

export { LOCATION_FACE2_SKINS };

export const LOCATION_FACE2_GENERIC_LOCK = Object.freeze({
  ...LOCATION_FACE2_V12_LOCK,
  renderer: "specialized-v12-location-operations",
  singleScrollSurface: true,
  allOperationalFieldsEditable: true
});

export default function IXIAosLocationFace2Operations(props) {
  return <IXIAosLocationFace2OperationsV12 {...props} />;
}
