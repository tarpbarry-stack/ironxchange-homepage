import IXIAosV12LibraryReadability from "./IXIAosV12LibraryReadability";
import {
  buildFace1GenericEditObject,
  restoreFace1GenericSave
} from "./IXIAosFace1GenericEditContract";
import {
  BUSINESS_IDENTIFIER_FIELD_ID,
  getBusinessIdentifierValue
} from "../IXIAosObjectDataContract";

export default function IXIAosFace1CardRuntime({
  object = {},
  onSaveObject = null,
  maxFields = null,
  includeBusinessIdentifier = false,
  fixedBusinessIdentifierLabel = false,
  allowAddFields = false,
  cardNumber = null,
  children
}) {
  const face1Object = buildFace1GenericEditObject(object, { maxFields, includeBusinessIdentifier });
  if (allowAddFields) face1Object.metadata = { ...(face1Object.metadata || {}), face1AllowAddFields: true };

  const editableCardContract = Number(cardNumber) >= 1 && Number(cardNumber) <= 19;

  const handleSave = async payload => {
    const editedObject = payload?.object || payload;
    let restoredObject = restoreFace1GenericSave(object, editedObject, {
      allowAddedDefinitions: allowAddFields || editableCardContract,
      allowDefinitionEdits: editableCardContract
    });
    if (fixedBusinessIdentifierLabel) {
      const value = getBusinessIdentifierValue({
        ...restoredObject,
        businessIdentifiers: [],
        fields: {
          ...(restoredObject?.fields || {}),
          [BUSINESS_IDENTIFIER_FIELD_ID]: restoredObject?.fields?.[BUSINESS_IDENTIFIER_FIELD_ID]
        }
      });
      const existing = Array.isArray(restoredObject?.businessIdentifiers)
        ? restoredObject.businessIdentifiers
        : [];
      restoredObject = {
        ...restoredObject,
        businessIdentifiers: value
          ? [{ ...(existing[0] || {}), label: "ID", value }, ...existing.slice(1)]
          : []
      };
    }
    await onSaveObject?.({
      ...(payload && payload.object ? payload : {}),
      objectId: restoredObject?.objectId || restoredObject?.id,
      object: restoredObject,
      displayName: restoredObject.displayName,
      businessIdentifiers: Array.isArray(restoredObject?.businessIdentifiers) ? restoredObject.businessIdentifiers : [],
      fields: { ...(restoredObject?.fields || {}) },
      fieldDefinitions: Array.isArray(restoredObject?.fieldDefinitions) ? restoredObject.fieldDefinitions : [],
      metadata: { ...(restoredObject?.metadata || {}) },
      media: Array.isArray(restoredObject?.media) ? restoredObject.media : []
    });
  };

  const content = runtimeObject => typeof children === "function"
    ? children({ object: runtimeObject, onSaveObject: handleSave })
    : children;

  return (
    <div className="ixi-v12-library-readable" style={{ width: 298, height: 471 }}>
      {content(face1Object)}
      <IXIAosV12LibraryReadability />
    </div>
  );
}
