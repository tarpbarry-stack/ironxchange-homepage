import IXILocationObjectFace1
  from "../ixi-mos/location/IXILocationObjectFace1";

import IXIAosLocationFace2Operations
  from "../ixi-aos/cards/location/IXIAosLocationFace2Operations";


const AOS_FACE_RENDERERS = Object.freeze({
  "location-face-1":
    IXILocationObjectFace1,

  "location-face-2":
    IXIAosLocationFace2Operations,

  "location-operations":
    IXIAosLocationFace2Operations,

  "location-operations-v12":
    IXIAosLocationFace2Operations
});


export function getAosFaceRenderer(
  rendererSlug = ""
) {
  const slug =
    String(
      rendererSlug || ""
    ).trim();

  return (
    AOS_FACE_RENDERERS[slug] ||
    null
  );
}


export function hasAosFaceRenderer(
  rendererSlug = ""
) {
  return Boolean(
    getAosFaceRenderer(
      rendererSlug
    )
  );
}


export default
AOS_FACE_RENDERERS;
