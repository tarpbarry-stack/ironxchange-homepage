import {
  clean,
  getFieldDisplayValue,
  getFieldDefinitions,
  getFieldsByRole,
  getObjectFields,
  getObjectPresentation
} from "../../card-runtime/IXIAosSemanticObjectPresentation";

export const FACE1_LOCATION_FIELD_IDS = Object.freeze({
  customerId: "face1CustomerId",
  addressLine1: "face1AddressLine1",
  addressLine2: "face1AddressLine2"
});

const FACE1_LOCATION_DEFINITIONS = Object.freeze([
  {
    fieldId: FACE1_LOCATION_FIELD_IDS.customerId,
    label: "CUSTOMER YARD ID",
    fieldType: "text",
    presentationRole: "business-identifier",
    presentationOrder: 1,
    editable: true
  },
  {
    fieldId: FACE1_LOCATION_FIELD_IDS.addressLine1,
    label: "ADDRESS LINE 1",
    fieldType: "text",
    presentationRole: "descriptor-primary",
    presentationOrder: 2,
    editable: true
  },
  {
    fieldId: FACE1_LOCATION_FIELD_IDS.addressLine2,
    label: "CITY / STATE / ZIP",
    fieldType: "text",
    presentationRole: "descriptor-secondary",
    presentationOrder: 3,
    editable: true
  }
]);

function splitAddress(rawValue = "") {
  const raw = clean(rawValue);
  if (!raw) return ["", ""];

  const dotParts = raw.split(/\s*[·•]\s*/).map(clean).filter(Boolean);
  if (dotParts.length >= 2) return [dotParts[0], dotParts.slice(1).join(" · ")];

  const commaParts = raw.split(",").map(clean).filter(Boolean);
  if (commaParts.length >= 2) return [commaParts[0], commaParts.slice(1).join(", ")];

  return [raw, ""];
}

function getBusinessIdentifier(object = {}) {
  const definition = getFieldsByRole(object, "business-identifier")?.[0];
  const value = definition ? clean(getFieldDisplayValue(object, definition)) : "";
  return { definition, value };
}

export function getFace1LocationValues(object = {}) {
  const fields = getObjectFields(object);
  const presentation = getObjectPresentation(object);
  const { definition, value: businessIdentifier } = getBusinessIdentifier(object);
  const [fallbackAddressLine1, fallbackAddressLine2] = splitAddress(presentation?.primaryDescriptor);
  const definitions = getFieldDefinitions(object)
    .filter(item => item?.editable !== false && clean(item?.fieldId))
    .sort((a, b) => Number(a?.presentationOrder || 0) - Number(b?.presentationOrder || 0));
  const nonIdentifierDefinitions = definitions.filter(item => {
    const role = clean(item?.presentationRole || item?.semanticRole).toLowerCase();
    return role !== "business-identifier" && clean(item?.fieldId) !== "businessIdentifier";
  });
  const primaryDefinition = getFieldsByRole(object, "descriptor-primary")?.[0] || nonIdentifierDefinitions[0] || null;
  const secondaryDefinition = getFieldsByRole(object, "descriptor-secondary")?.[0] || nonIdentifierDefinitions[1] || null;
  const primaryValue = primaryDefinition ? clean(getFieldDisplayValue(object, primaryDefinition)) : "";
  const secondaryValue = secondaryDefinition ? clean(getFieldDisplayValue(object, secondaryDefinition)) : "";

  return {
    customerId: clean(fields?.[FACE1_LOCATION_FIELD_IDS.customerId]) || businessIdentifier,
    customerIdLabel: clean(definition?.label) || "CUSTOMER YARD ID",
    addressLine1: clean(fields?.[FACE1_LOCATION_FIELD_IDS.addressLine1]) || primaryValue || fallbackAddressLine1,
    addressLine2: clean(fields?.[FACE1_LOCATION_FIELD_IDS.addressLine2]) || secondaryValue || fallbackAddressLine2,
    businessIdentifierDefinition: definition
  };
}

export function buildFace1LocationEditObject(object = {}) {
  const values = getFace1LocationValues(object);
  const fields = {
    ...getObjectFields(object),
    [FACE1_LOCATION_FIELD_IDS.customerId]: values.customerId,
    [FACE1_LOCATION_FIELD_IDS.addressLine1]: values.addressLine1,
    [FACE1_LOCATION_FIELD_IDS.addressLine2]: values.addressLine2
  };

  return {
    ...object,
    fields,
    fieldDefinitions: FACE1_LOCATION_DEFINITIONS.map(definition => ({ ...definition }))
  };
}

export function restoreFace1LocationSave(originalObject = {}, payload = {}) {
  const editedObject = payload?.object || {};
  const editedFields = getObjectFields(editedObject);
  const originalFields = getObjectFields(originalObject);
  const originalPresentation = getObjectPresentation(originalObject);
  const { businessIdentifierDefinition } = getFace1LocationValues(originalObject);

  const customerId = clean(editedFields?.[FACE1_LOCATION_FIELD_IDS.customerId]);
  const addressLine1 = clean(editedFields?.[FACE1_LOCATION_FIELD_IDS.addressLine1]);
  const addressLine2 = clean(editedFields?.[FACE1_LOCATION_FIELD_IDS.addressLine2]);

  const nextFields = {
    ...originalFields,
    [FACE1_LOCATION_FIELD_IDS.customerId]: customerId,
    [FACE1_LOCATION_FIELD_IDS.addressLine1]: addressLine1,
    [FACE1_LOCATION_FIELD_IDS.addressLine2]: addressLine2
  };

  if (businessIdentifierDefinition?.fieldId) {
    nextFields[businessIdentifierDefinition.fieldId] = customerId;
  }

  const nextPresentation = {
    ...originalPresentation,
    primaryDescriptor: [addressLine1, addressLine2].filter(Boolean).join(" · ")
  };

  const nextObject = {
    ...originalObject,
    displayName: clean(payload?.displayName || editedObject?.displayName || originalObject?.displayName),
    fields: nextFields,
    presentation: nextPresentation,
    media: Array.isArray(payload?.media) ? payload.media : Array.isArray(editedObject?.media) ? editedObject.media : originalObject?.media
  };

  return {
    ...payload,
    objectId: payload?.objectId || nextObject?.objectId || nextObject?.id,
    object: nextObject,
    displayName: nextObject.displayName,
    fields: nextFields,
    media: nextObject.media
  };
}
