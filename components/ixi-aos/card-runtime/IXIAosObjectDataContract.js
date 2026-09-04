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
 * One persisted object contract serves manual creation, Object Studio,
 * Excel/CSV import, API/AWS and card editing.
 *
 * Customer vocabulary is presentation truth. Stable identifiers and roles
 * are machine identity and MUST NOT be derived from customer labels.
 *
 * MOS durable business identifiers live in object.businessIdentifiers[].
 * businessIdentifier remains a synthetic editor field for card/UI use.
 */

export const AOS_OBJECT_DATA_CONTRACT_VERSION = 2;
export const BUSINESS_IDENTIFIER_FIELD_ID = "businessIdentifier";
export const BUSINESS_IDENTIFIER_ROLE = "business-identifier";

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function getBusinessIdentifierSchema(object = {}) {
  const definition = safeObject(object?.definition);

  return safeObject(
    object?.businessIdentifierSchema ||
    definition?.businessIdentifierSchema ||
    object?.metadata?.businessIdentifierSchema
  );
}

function normalizePersistedBusinessIdentifiers(object = {}) {
  const schema = getBusinessIdentifierSchema(object);

  return asArray(object?.businessIdentifiers)
    .map(item => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const value = clean(item?.value);
      if (!value) return null;

      return {
        ...item,
        label: clean(item?.label || schema?.defaultLabel) || "ID",
        value
      };
    })
    .filter(Boolean);
}

export function normalizeImportableFieldDefinition(definition = {}, index = 0) {
  const fieldId = clean(
    definition?.fieldId ||
    definition?.field ||
    definition?.key ||
    definition?.slug
  );

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
    presentationOrder: Number(
      definition?.presentationOrder ??
      definition?.presentation?.order ??
      index
    ),
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
  const schema = getBusinessIdentifierSchema(object);

  const label = clean(
    schema?.defaultLabel ||
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
    editable: schema?.enabled !== false,
    importable: schema?.allowImport !== false,
    exportable: true,
    apiAddressable: true,
    required: schema?.required === true,
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
  )) {
    return source;
  }

  if (getBusinessIdentifierSchema(object)?.enabled === false) {
    return source;
  }

  return [
    createBusinessIdentifierDefinition(object, 0),
    ...source.map((definition, index) => ({
      ...definition,
      presentationOrder: Number(definition.presentationOrder ?? index + 1)
    }))
  ];
}

export function getBusinessIdentifierValue(object = {}) {
  const fields = getObjectFields(object);
  if (Object.prototype.hasOwnProperty.call(fields, BUSINESS_IDENTIFIER_FIELD_ID)) {
    const fieldValue = fields?.[BUSINESS_IDENTIFIER_FIELD_ID];
    if (fieldValue && typeof fieldValue === "object") {
      return clean(fieldValue?.value || fieldValue?.label || fieldValue?.name);
    }
    return clean(fieldValue);
  }

  const persisted = normalizePersistedBusinessIdentifiers(object);

  if (persisted.length) {
    return persisted[0].value;
  }

  return "";
}

export function getBusinessIdentifiers(object = {}) {
  const persisted = normalizePersistedBusinessIdentifiers(object);
  const fields = getObjectFields(object);
  const hasEditorValue = Object.prototype.hasOwnProperty.call(
    fields,
    BUSINESS_IDENTIFIER_FIELD_ID
  );
  const editorValue = fields?.[BUSINESS_IDENTIFIER_FIELD_ID];
  const value = hasEditorValue
    ? clean(
        editorValue && typeof editorValue === "object"
          ? editorValue?.value || editorValue?.label || editorValue?.name
          : editorValue
      )
    : clean(persisted[0]?.value);

  if (!value) return [];

  const schema = getBusinessIdentifierSchema(object);
  const definition = createBusinessIdentifierDefinition(object, 0);

  return [{
    ...(persisted[0] || {}),
    label: clean(definition?.label || schema?.defaultLabel) || "ID",
    value
  }, ...persisted.slice(1)];
}

export function createStableCustomFieldDefinition(existingDefinitions = [], index = 0) {
  const used = new Set(
    asArray(existingDefinitions)
      .map(item => clean(item?.fieldId))
      .filter(Boolean)
  );

  let sequence = Math.max(index + 1, 1);
  let fieldId = `custom_${sequence}`;

  while (used.has(fieldId)) {
    fieldId = `custom_${++sequence}`;
  }

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

  const fields = {
    ...getObjectFields(nextObject)
  };

  const businessIdentifiers = getBusinessIdentifiers({
    ...nextObject,
    fields
  });

  const metadata = {
    ...safeObject(nextObject?.metadata),
    aosDataContractVersion: AOS_OBJECT_DATA_CONTRACT_VERSION,
    fieldDefinitions: normalizedDefinitions
  };

  const object = {
    ...nextObject,
    fields,
    businessIdentifiers,
    fieldDefinitions: normalizedDefinitions,
    metadata
  };

  return {
    objectId: getObjectId(object),
    object,
    displayName: object?.displayName,
    businessIdentifiers,
    fields,
    fieldDefinitions: normalizedDefinitions,
    metadata,
    media: asArray(object?.media),
    dataContractVersion: AOS_OBJECT_DATA_CONTRACT_VERSION
  };
}
