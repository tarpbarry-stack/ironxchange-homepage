import { asArray, clean, getObjectFields } from "../IXIAosSemanticObjectPresentation";

function isBusinessIdentifier(definition = {}) {
  const role = clean(definition?.presentationRole || definition?.semanticRole).toLowerCase();
  const id = clean(definition?.fieldId).toLowerCase();
  return role === "business-identifier" || id === "businessidentifier" || id === "business-identifier";
}

export function buildFace1GenericEditObject(object = {}, { maxFields = null, includeBusinessIdentifier = false, fieldFilter = null } = {}) {
  const definitions = asArray(object?.fieldDefinitions || object?.metadata?.fieldDefinitions)
    .filter(definition => definition?.editable !== false && clean(definition?.fieldId))
    .filter(definition => includeBusinessIdentifier || !isBusinessIdentifier(definition))
    .filter(definition => typeof fieldFilter === "function" ? fieldFilter(definition) : true);
  const visibleDefinitions = Number.isFinite(Number(maxFields)) ? definitions.slice(0, Math.max(0, Number(maxFields))) : definitions;
  return { ...object, fieldDefinitions: visibleDefinitions.map(definition => ({ ...definition })), metadata: { ...(object?.metadata || {}), fieldDefinitions: visibleDefinitions.map(definition => ({ ...definition })), face1EditContract: true } };
}

export function restoreFace1GenericSave(originalObject = {}, nextObject = {}, { allowAddedDefinitions = false, allowDefinitionEdits = false } = {}) {
  const originalFields = getObjectFields(originalObject);
  const editedFields = getObjectFields(nextObject);
  const originalDefinitions = asArray(originalObject?.fieldDefinitions || originalObject?.metadata?.fieldDefinitions);
  const editedDefinitions = asArray(nextObject?.fieldDefinitions || nextObject?.metadata?.fieldDefinitions);
  const nextFields = { ...originalFields };

  editedDefinitions.forEach(definition => {
    const fieldId = clean(definition?.fieldId);
    if (fieldId && Object.prototype.hasOwnProperty.call(editedFields, fieldId)) nextFields[fieldId] = editedFields[fieldId];
  });

  const editedById = new Map(editedDefinitions.map(definition => [clean(definition?.fieldId), definition]).filter(([id]) => id));
  const originalIds = new Set(originalDefinitions.map(definition => clean(definition?.fieldId)).filter(Boolean));

  let finalDefinitions = originalDefinitions.map(definition => {
    const fieldId = clean(definition?.fieldId);
    const edited = editedById.get(fieldId);
    if (!allowDefinitionEdits || !edited) return { ...definition };
    return {
      ...definition,
      ...edited,
      fieldId,
      label: clean(edited?.label || edited?.displayLabel || definition?.label || definition?.displayLabel) || fieldId,
      editable: definition?.editable !== false
    };
  });

  if (allowAddedDefinitions) {
    editedDefinitions.forEach((definition, index) => {
      const fieldId = clean(definition?.fieldId);
      if (!fieldId || originalIds.has(fieldId)) return;
      finalDefinitions.push({
        ...definition,
        fieldId,
        label: clean(definition?.label || definition?.displayLabel) || `FIELD ${index + 1}`,
        editable: definition?.editable !== false,
        metadata: { ...(definition?.metadata || {}), userDefined: true }
      });
      originalIds.add(fieldId);
    });
  }

  finalDefinitions = finalDefinitions.map((definition, index) => ({ ...definition, presentationOrder: index }));

  return {
    ...originalObject,
    displayName: clean(nextObject?.displayName || originalObject?.displayName),
    fields: nextFields,
    fieldDefinitions: finalDefinitions,
    media: Array.isArray(nextObject?.media) ? nextObject.media : originalObject?.media,
    metadata: { ...(originalObject?.metadata || {}), fieldDefinitions: finalDefinitions }
  };
}
