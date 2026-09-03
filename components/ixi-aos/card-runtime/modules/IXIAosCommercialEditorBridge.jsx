import { useEffect, useState } from "react";

import IXIAosCommercialObjectEditor from "./IXIAosCommercialObjectEditor";
import { runIXIActionNoticeLifecycle } from "../../ixi-object-system/IXIActionNoticeEngine";

function clean(value) {
  return String(value ?? "").trim();
}

function objectIdOf(object = {}) {
  return clean(
    object?.objectId ||
    object?.id?.uuid ||
    object?.id ||
    object?.uuid ||
    object?.passportId
  );
}

/*
 * Commercial edit bridge for numbered AOS cards.
 *
 * The normal card face is untouched. The bridge intercepts only the canonical
 * IXIAosCardHeaderControls EDIT command and opens the shared commercial editor.
 * It never infers taxonomy or parent meaning and it never substitutes sample data.
 */
export default function IXIAosCommercialEditorBridge({
  object = {},
  onSaveObject = null,
  mediaEnabled = true,
  minimumCustomFields = 0,
  children
}) {
  const [runtimeObject, setRuntimeObject] = useState(object);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRuntimeObject(object);
  }, [object]);

  function captureEdit(event) {
    const target = event?.target;
    const button = target?.closest?.("button.header-action.edit");
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();
    setEditing(true);
  }

  async function save(nextObject) {
    if (!nextObject || typeof nextObject !== "object") {
      throw new Error("Commercial editor save requires an object payload.");
    }

    const objectId = objectIdOf(nextObject) || objectIdOf(runtimeObject);
    setSaving(true);

    try {
      await runIXIActionNoticeLifecycle({
        objectId,
        savingMessage: "SAVING...",
        successMessage: "SAVED",
        errorMessage: "NOT SAVED",
        commandId: "aos-object-save",
        source: "aos-commercial-editor",
        operation: async () => {
          if (typeof onSaveObject === "function") {
            await onSaveObject({
              objectId,
              object: nextObject,
              displayName: nextObject.displayName,
              fields: { ...(nextObject?.fields || {}) },
              fieldDefinitions: Array.isArray(nextObject?.fieldDefinitions)
                ? nextObject.fieldDefinitions
                : [],
              media: Array.isArray(nextObject?.media) ? nextObject.media : [],
              metadata: { ...(nextObject?.metadata || {}) }
            });
          }
          return nextObject;
        }
      });

      setRuntimeObject(nextObject);
      setEditing(false);
      return nextObject;
    } finally {
      setSaving(false);
    }
  }

  const rendered = typeof children === "function"
    ? children({ object: runtimeObject })
    : children;

  return (
    <div
      className="ixi-aos-commercial-editor-bridge"
      data-commercial-editor-bridge
      onClickCapture={captureEdit}
    >
      {rendered}

      {editing ? (
        <IXIAosCommercialObjectEditor
          object={runtimeObject}
          saving={saving}
          onCancel={() => setEditing(false)}
          onSave={save}
          mediaEnabled={mediaEnabled}
          minimumCustomFields={minimumCustomFields}
        />
      ) : null}

      <style jsx>{`
        .ixi-aos-commercial-editor-bridge {
          position: relative;
          width: 298px;
          height: 471px;
        }
      `}</style>
    </div>
  );
}
