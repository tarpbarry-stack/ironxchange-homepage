import {
  asArray,
  clean,
  getObjectFields
} from "../IXIAosSemanticObjectPresentation";

function isBusinessIdentifier(definition = {}) {
  const role = clean(definition?.presentationRole || definition?.semanticRole).toLowerCase();
  const id = clean(definition?.fieldId).toLowerCase();
  return role === "business-identifier" || id === "businessidentifier" || id === "business-identifier";
}

export function buildFace1GenericEditObject(object = {}, {
  maxFields = null,
  includeBusinessIdentifier = false,
  fieldFilter = null
} = {}) {
  const definitions = asArray(object?.fieldDefinitions || object?.metadata?.fieldDefinitions)
    .filter(definition => definition?.editable !== false && clean(definition?.fieldId))
    .filter(definition => includeBusinessIdentifier || !isBusinessIdentifier(definition))
    .filter(definition => typeof fieldFilter === "function" ? fieldFilter(definition) : true);

  const visibleDefinitions = Number.isFinite(Number(maxFields))
    ? definitions.slice(0, Math.max(0, Number(maxFields)))
    : definitions;

  return {
    ...object,
    fieldDefinitions: visibleDefinitions.map(definition => ({ ...definition })),
    metadata: {
      ...(object?.metadata || {}),
      fieldDefinitions: visibleDefinitions.map(definition => ({ ...definition })),
      face1EditContract: true
    }
  };
}

export function restoreFace1GenericSave(originalObject = {}, nextObject = {}) {
  const originalFields = getObjectFields(originalObject);
  const editedFields = getObjectFields(nextObject);
  const editedDefinitions = asArray(nextObject?.fieldDefinitions || nextObject?.metadata?.fieldDefinitions);
  const nextFields = { ...originalFields };

  editedDefinitions.forEach(definition => {
    const fieldId = clean(definition?.fieldId);
    if (!fieldId) return;
    if (Object.prototype.hasOwnProperty.call(editedFields, fieldId)) {
      nextFields[fieldId] = editedFields[fieldId];
    }
  });

  return {
    ...originalObject,
    displayName: clean(nextObject?.displayName || originalObject?.displayName),
    fields: nextFields,
    fieldDefinitions: asArray(originalObject?.fieldDefinitions),
    media: Array.isArray(nextObject?.media) ? nextObject.media : originalObject?.media,
    metadata: {
      ...(originalObject?.metadata || {}),
      fieldDefinitions: asArray(originalObject?.metadata?.fieldDefinitions || originalObject?.fieldDefinitions)
    }
  };
}
