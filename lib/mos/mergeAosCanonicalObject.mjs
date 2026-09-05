function clean(value) {
  return String(value ?? "").trim();
}

function objectIdOf(value = {}) {
  return clean(value?.objectId || value?.id?.uuid || value?.id);
}

/*
 * IX-Core readback owns persisted values. Only definition hydration assembled
 * by the browser environment may be retained when IX-Core omits that derived
 * presentation record from a single-object read.
 */
export function mergeAosCanonicalObject(current = {}, canonical = {}) {
  const currentId = objectIdOf(current);
  const canonicalId = objectIdOf(canonical);

  if (!canonicalId || (currentId && currentId !== canonicalId)) {
    const error = new Error("Canonical AOS object identity does not match the workspace object.");
    error.code = "IXI_AOS_CANONICAL_IDENTITY_MISMATCH";
    throw error;
  }

  const metadataDefinitions = Array.isArray(canonical?.metadata?.fieldDefinitions)
    ? canonical.metadata.fieldDefinitions
    : [];
  const canonicalDefinitions = Array.isArray(canonical?.fieldDefinitions)
    ? canonical.fieldDefinitions
    : [];
  const currentDefinitions = Array.isArray(current?.fieldDefinitions)
    ? current.fieldDefinitions
    : [];

  return {
    ...canonical,
    definition: canonical?.definition || current?.definition || null,
    businessIdentifierSchema:
      canonical?.businessIdentifierSchema ||
      current?.businessIdentifierSchema ||
      null,
    fieldDefinitions:
      canonicalDefinitions.length
        ? canonicalDefinitions
        : metadataDefinitions.length
          ? metadataDefinitions
          : currentDefinitions
  };
}

export default mergeAosCanonicalObject;
