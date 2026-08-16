import {
  asArray,
  clean,
  getFieldDefinitions,
  getObjectFields,
  getObjectId,
  getObjectMetadata,
  getObjectPresentation
} from "./IXIAosSemanticObjectPresentation";

/*
 * IXI AOS OBJECT DATA CONTRACT
 *
 * One persisted object contract must serve every creation/read channel:
 * manual +, Object Studio, Excel/CSV bulk import, API/AWS and card editing.
 *
 * Customer vocabulary is presentation truth. Stable fieldId/semanticRole values
 * are machine identity and MUST NOT be derived from the customer's label.
 */

export const AOS_OBJECT_DATA_CONTRACT_VERSION = 1;
export const BUSINESS_IDENTIFIER_FIELD_ID = "businessIdentifier";
export const BUSINESS_IDENTIFIER_ROLE = "business-identifier";

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export function normalizeImportableFieldDefinition(definition = {}, index = 0) {
  const fieldId = clean(definition?.fieldId || definition?.field || definition?.key || definition?.slug);
  if (!fieldId) return null;

  return {
    ...definition,
    fieldId,
    label: clean(definition?.label || definition?.displayLabel || fieldId),
    fieldType: clean(definition?.fieldType || definition?.type || "text") || "text",
    presentationRole: clean(
      definition?.presentationRole ||
      definition?.semanticRole ||
      definition?.role ||
      definition?.presentation?.role
    ).toLowerCase(),
    presentationOrder: Number(definition?.presentationOrder ?? definition?.presentation?.order ?? index),
    editable: definition?.editable !== false && definition?.readOnly !== true,
    importable: definition?.importable !== false,
    exportable: definition?.exportable !== false,
    apiAddressable: definition?.apiAddressable !== false,
    importAliases: asArray(definition?.importAliases).map(clean).filter(Boolean)
  };
}

export function getImportableFieldDefinitions(object = {}) {
  return getFieldDefinitions(object)
    .map(normalizeImportableFieldDefinition)
    .filter(Boolean);
}

export function getBusinessIdentifierDefinition(object = {}) {
  const definitions = getImportableFieldDefinitions(object);
  return definitions.find(definition =>
    definition.presentationRole === BUSINESS_IDENTIFIER_ROLE ||
    clean(definition?.semanticRole).toLowerCase() === BUSINESS_IDENTIFIER_ROLE ||
    clean(definition?.fieldId) === BUSINESS_IDENTIFIER_FIELD_ID
  ) || null;
}

export function createBusinessIdentifierDefinition(object = {}, order = 0) {
  const metadata = getObjectMetadata(object);
  const presentation = getObjectPresentation(object);
  const label = clean(
    metadata?.businessIdentifierLabel ||
    presentation?.businessIdentifierLabel ||
    presentation?.identifierLabel
  ) || "ID";

  return normalizeImportableFieldDefinition({
    fieldId: BUSINESS_IDENTIFIER_FIELD_ID,
    label,
    fieldType: "text",
    semanticRole: BUSINESS_IDENTIFIER_ROLE,
    presentationRole: BUSINESS_IDENTIFIER_ROLE,
    presentationOrder: order,
    editable: true,
    importable: true,
    exportable: true,
    apiAddressable: true,
    importAliases: []
  }, order);
}

export function ensureBusinessIdentifierDefinition(object = {}, definitions = null) {
  const source = (definitions || getImportableFieldDefinitions(object))
    .map(normalizeImportableFieldDefinition)
    .filter(Boolean);

  if (source.some(definition =>
    definition.presentationRole === BUSINESS_IDENTIFIER_ROLE ||
    clean(definition?.semanticRole).toLowerCase() === BUSINESS_IDENTIFIER_ROLE ||
    definition.fieldId === BUSINESS_IDENTIFIER_FIELD_ID
  )) return source;

  return [createBusinessIdentifierDefinition(object, 0), ...source.map((definition, index) => ({
    ...definition,
    presentationOrder: Number(definition.presentationOrder ?? index + 1)
  }))];
}

export function getBusinessIdentifierValue(object = {}) {
  const definition = getBusinessIdentifierDefinition(object);
  if (!definition) return "";
  const value = getObjectFields(object)?.[definition.fieldId];
  if (value && typeof value === "object") return clean(value?.value || value?.label || value?.name);
  return clean(value);
}

export function createStableCustomFieldDefinition(existingDefinitions = [], index = 0) {
  const used = new Set(asArray(existingDefinitions).map(item => clean(item?.fieldId)).filter(Boolean));
  let sequence = Math.max(index + 1, 1);
  let fieldId = `custom_${sequence}`;
  while (used.has(fieldId)) fieldId = `custom_${++sequence}`;

  return normalizeImportableFieldDefinition({
    fieldId,
    label: `FIELD ${sequence}`,
    fieldType: "text",
    presentationOrder: existingDefinitions.length,
    editable: true,
    importable: true,
    exportable: true,
    apiAddressable: true,
    importAliases: []
  }, existingDefinitions.length);
}

export function buildAosObjectSavePayload(nextObject = {}, definitions = null) {
  const normalizedDefinitions = ensureBusinessIdentifierDefinition(
    nextObject,
    definitions || nextObject?.fieldDefinitions || getImportableFieldDefinitions(nextObject)
  ).map((definition, index) => ({
    ...definition,
    presentationOrder: Number(definition?.presentationOrder ?? index)
  }));

  const metadata = {
    ...safeObject(nextObject?.metadata),
    aosDataContractVersion: AOS_OBJECT_DATA_CONTRACT_VERSION,
    fieldDefinitions: normalizedDefinitions
  };

  const object = {
    ...nextObject,
    fields: { ...getObjectFields(nextObject) },
    fieldDefinitions: normalizedDefinitions,
    metadata
  };

  return {
    objectId: getObjectId(object),
    object,
    displayName: object?.displayName,
    fields: { ...getObjectFields(object) },
    fieldDefinitions: normalizedDefinitions,
    metadata,
    media: asArray(object?.media),
    dataContractVersion: AOS_OBJECT_DATA_CONTRACT_VERSION
  };
}
