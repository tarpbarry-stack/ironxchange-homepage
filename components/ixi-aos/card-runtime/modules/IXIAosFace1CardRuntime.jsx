import IXIAosV12LibraryReadability from "./IXIAosV12LibraryReadability";
import IXIAosV12Face1EditPatch from "./IXIAosV12Face1EditPatch";
import {
  buildFace1GenericEditObject,
  restoreFace1GenericSave
} from "./IXIAosFace1GenericEditContract";

export default function IXIAosFace1CardRuntime({
  object = {},
  onSaveObject = null,
  maxFields = null,
  includeBusinessIdentifier = false,
  allowAddFields = false,
  children
}) {
  const face1Object = buildFace1GenericEditObject(object, { maxFields, includeBusinessIdentifier });
  if (allowAddFields) {
    face1Object.metadata = { ...(face1Object.metadata || {}), face1AllowAddFields: true };
  }

  const handleSave = async payload => {
    const editedObject = payload?.object || payload;
    const restoredObject = restoreFace1GenericSave(object, editedObject, { allowAddedDefinitions: allowAddFields });
    await onSaveObject?.({
      ...(payload && payload.object ? payload : {}),
      objectId: restoredObject?.objectId || restoredObject?.id,
      object: restoredObject,
      displayName: restoredObject.displayName,
      fields: { ...(restoredObject?.fields || {}) },
      fieldDefinitions: Array.isArray(restoredObject?.fieldDefinitions) ? restoredObject.fieldDefinitions : [],
      metadata: { ...(restoredObject?.metadata || {}) },
      media: Array.isArray(restoredObject?.media) ? restoredObject.media : []
    });
  };

  return (
    <div className="ixi-v12-library-readable ixi-v12-face1-edit" style={{ width: 298, height: 471 }}>
      {typeof children === "function" ? children({ object: face1Object, onSaveObject: handleSave }) : children}
      <IXIAosV12LibraryReadability />
      <IXIAosV12Face1EditPatch />
    </div>
  );
}
