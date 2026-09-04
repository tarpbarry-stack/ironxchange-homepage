import IXIAosCommercialObjectEditor from "./IXIAosCommercialObjectEditor";
import { runIXIActionNoticeLifecycle } from "../../../ixi-object-system/IXIActionNoticeEngine";
import { IXIAosEditorCommandProvider } from "../IXIAosEditorCommandContext";
import useIXIAosObjectEditSession from "./useIXIAosObjectEditSession";

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
 * The normal card face is untouched. The bridge publishes the canonical EDIT
 * command through context and opens the shared commercial editor explicitly.
 * It never infers taxonomy or parent meaning and it never substitutes sample data.
 */
export default function IXIAosCommercialEditorBridge({
  object = {},
  onSaveObject = null,
  persistenceAdapter = onSaveObject,
  mediaEnabled = true,
  minimumCustomFields = 0,
  faceNumber = 1,
  children
}) {
  const editSession = useIXIAosObjectEditSession({
    object,
    persistenceAdapter
  });

  async function save(nextObject) {
    if (!nextObject || typeof nextObject !== "object") {
      throw new Error("Commercial editor save requires an object payload.");
    }

    const objectId = objectIdOf(nextObject) || objectIdOf(editSession.runtimeObject);
    return runIXIActionNoticeLifecycle({
      objectId,
      savingMessage: "SAVING...",
      successMessage: "SAVED",
      errorMessage: "NOT SAVED",
      commandId: "aos-object-save",
      source: "aos-commercial-editor",
      operation: () => editSession.save(nextObject)
    });
  }

  const rendered = typeof children === "function"
    ? children({ object: editSession.runtimeObject })
    : children;

  return (
    <div
      className="ixi-aos-commercial-editor-bridge"
      data-commercial-editor-bridge
      data-editor-face={Number(faceNumber) || 1}
    >
      <IXIAosEditorCommandProvider
        openEditor={editSession.begin}
        faceNumber={faceNumber}
      >
        {rendered}
      </IXIAosEditorCommandProvider>

      {editSession.editing ? (
        <IXIAosCommercialObjectEditor
          object={editSession.runtimeObject}
          saving={editSession.saving}
          error={editSession.error}
          conflict={editSession.conflict}
          onCancel={editSession.cancel}
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
