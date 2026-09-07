function clean(value) {
  return String(value ?? "").trim();
}

function objectIdOf(value = {}) {
  return clean(value?.objectId || value?.id?.uuid || value?.id);
}

function fieldIdOf(definition = {}) {
  return clean(
    definition?.fieldId ||
    definition?.field ||
    definition?.key ||
    definition?.slug
  );
}

function labelOf(definition = {}) {
  return clean(definition?.label || definition?.displayLabel);
}

function isGeneratedFieldLabel(definition = {}) {
  const fieldId = fieldIdOf(definition);
  const label = labelOf(definition);
  if (!label) return true;

  return label.toLowerCase() === fieldId.toLowerCase() ||
    /^custom_\d+$/i.test(label) ||
    /^field[_ ]\d+$/i.test(label);
}

/*
 * IX-Core owns persisted field values and schema structure. Customer-authored
 * labels are presentation identity, however, and a generated readback label
 * (custom_10 / field_10 / the field id itself) must never erase a meaningful
 * label that was already attached to the same stable field id.
 */
export function reconcileCanonicalFieldDefinitions(current = {}, canonical = {}) {
  const currentMetadataDefinitions = Array.isArray(current?.metadata?.fieldDefinitions)
    ? current.metadata.fieldDefinitions
    : [];
  const currentDefinitions = Array.isArray(current?.fieldDefinitions)
    ? current.fieldDefinitions
    : [];
  const canonicalMetadataDefinitions = Array.isArray(canonical?.metadata?.fieldDefinitions)
    ? canonical.metadata.fieldDefinitions
    : [];
  const canonicalDefinitions = Array.isArray(canonical?.fieldDefinitions)
    ? canonical.fieldDefinitions
    : [];

  const baseDefinitions = canonicalDefinitions.length
    ? canonicalDefinitions
    : canonicalMetadataDefinitions.length
      ? canonicalMetadataDefinitions
      : currentDefinitions.length
        ? currentDefinitions
        : currentMetadataDefinitions;

  const candidatesById = new Map();
  [
    ...canonicalDefinitions,
    ...canonicalMetadataDefinitions,
    ...currentDefinitions,
    ...currentMetadataDefinitions
  ].forEach(definition => {
    const fieldId = fieldIdOf(definition);
    if (!fieldId) return;
    const candidates = candidatesById.get(fieldId) || [];
    candidates.push(definition);
    candidatesById.set(fieldId, candidates);
  });

  return baseDefinitions.map(definition => {
    const fieldId = fieldIdOf(definition);
    const customerDefinition = (candidatesById.get(fieldId) || [])
      .find(candidate => labelOf(candidate) && !isGeneratedFieldLabel(candidate));

    if (!customerDefinition || !isGeneratedFieldLabel(definition)) {
      return { ...definition };
    }

    const label = labelOf(customerDefinition);
    return {
      ...definition,
      label,
      aggregate: definition?.aggregate && typeof definition.aggregate === "object"
        ? { ...definition.aggregate, label }
        : definition?.aggregate
    };
  });
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

  const fieldDefinitions = reconcileCanonicalFieldDefinitions(current, canonical);

  return {
    ...canonical,
    definition: canonical?.definition || current?.definition || null,
    businessIdentifierSchema:
      canonical?.businessIdentifierSchema ||
      current?.businessIdentifierSchema ||
      null,
    fieldDefinitions,
    metadata: {
      ...(canonical?.metadata || {}),
      fieldDefinitions
    }
  };
}

export default mergeAosCanonicalObject;
