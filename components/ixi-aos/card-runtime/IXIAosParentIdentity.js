/*
 * IXI AOS — CANONICAL PARENT IDENTITY
 *
 * A numbered card never invents its parent from card stock, object type,
 * sampleUse, template labels, or FaceLab nouns.
 *
 * In AOS/Work the workspace/container runtime supplies the user-named parent.
 * FaceLab has no canonical parent, so callers may intentionally receive an
 * empty string and preserve their existing stock/sample presentation.
 */

function clean(value) {
  return String(value ?? "").trim();
}

export function getAosParentDisplayName(object = {}, explicitParentLabel = "") {
  return clean(
    explicitParentLabel ||
    object?.parentDisplayName ||
    object?.parent?.displayName ||
    object?.parent?.name ||
    object?.parent?.label ||
    object?.metadata?.parentDisplayName
  );
}

export function hasAosParentIdentity(object = {}, explicitParentLabel = "") {
  return Boolean(getAosParentDisplayName(object, explicitParentLabel));
}

export default getAosParentDisplayName;
