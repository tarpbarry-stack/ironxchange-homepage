import IXIAosLocationFace3OwnedV12 from "./IXIAosLocationFace3OwnedV12";
import IXIAosLocationFace3LeasedV12 from "./IXIAosLocationFace3LeasedV12";

export const LOCATION_FACE_3_FINANCIAL = Object.freeze({
  faceNumber: 3,
  version: 12,
  nativeWidth: 298,
  nativeHeight: 471,
  renderer: "location-financial-v12",
  variants: Object.freeze([
    "owned",
    "leased"
  ])
});

function clean(value) {
  return String(value || "").trim();
}

function resolveFinancialVariant(object = {}) {
  const fields = object?.fields && typeof object.fields === "object"
    ? object.fields
    : {};

  const raw = clean(
    fields.ownershipStatus ||
    fields.propertyStatus ||
    fields.occupancyType ||
    fields.locationFinancialMode ||
    "OWNED"
  ).toUpperCase();

  return raw.includes("LEASE") || raw.includes("RENT")
    ? "leased"
    : "owned";
}

export default function IXIAosLocationFace3Financial({
  forcedVariant = "",
  ...props
}) {
  const variant = clean(forcedVariant).toLowerCase() || resolveFinancialVariant(props.object);

  return variant === "leased"
    ? <IXIAosLocationFace3LeasedV12 {...props} />
    : <IXIAosLocationFace3OwnedV12 {...props} />;
}
