import IXIAosGenericConfiguredFaceV12 from "../generic/IXIAosGenericConfiguredFaceV12";

export const LOCATION_FACE2_SKINS = Object.freeze([
  Object.freeze({ id: "v12", label: "V12" }),
  Object.freeze({ id: "steel", label: "STEEL" }),
  Object.freeze({ id: "blueprint", label: "BLUE" }),
  Object.freeze({ id: "industrial", label: "INDUSTRIAL" })
]);

export const LOCATION_FACE2_GENERIC_LOCK = Object.freeze({
  face: 2,
  version: 12,
  nativeWidth: 298,
  nativeHeight: 471,
  renderer: "schema-driven-generic"
});

export default function IXIAosLocationFace2Operations(props) {
  return (
    <IXIAosGenericConfiguredFaceV12
      {...props}
      faceNumber={2}
    />
  );
}
