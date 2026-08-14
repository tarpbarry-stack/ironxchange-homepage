import IXILocationObjectFace1
  from "../ixi-aos/location/IXILocationObjectFace1";


const AOS_FACE_RENDERERS = Object.freeze({
  "location-face-1":
    IXILocationObjectFace1
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
