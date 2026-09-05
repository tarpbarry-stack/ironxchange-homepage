import IXIAosCommercialObjectEditor from "./IXIAosCommercialObjectEditor";
import IXIAosActionNotice from "./IXIAosActionNotice";
import { IXIAosCardCommandProvider } from "../IXIAosCardCommandContext";
import { runIXIActionNoticeLifecycle } from "../../../ixi-object-system/IXIActionNoticeEngine";
import { IXIAosEditorCommandProvider } from "../IXIAosEditorCommandContext";
import { getBusinessIdentifierValue } from "../IXIAosObjectDataContract";
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

function noticeTargetIdOf(object = {}) {
  return objectIdOf(object) ||
    clean(getBusinessIdentifierValue(object)) ||
    clean(object?.templateSlug || object?.metadata?.templateSlug) ||
    clean(object?.displayName || object?.name) ||
    "ixi-aos-editor-preview";
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
  faceNumber = 1,
  children
}) {
  const editSession = useIXIAosObjectEditSession({
    object,
    persistenceAdapter
  });
  const noticeObjectId = noticeTargetIdOf(editSession.runtimeObject);

  async function save(nextObject) {
    if (!nextObject || typeof nextObject !== "object") {
      throw new Error("Commercial editor save requires an object payload.");
    }

    return runIXIActionNoticeLifecycle({
      objectId: noticeObjectId,
      savingMessage: "SAVING...",
      successMessage: "SAVED",
      errorMessage: "NOT SAVED",
      commandId: "aos-object-save",
      source: "aos-commercial-editor",
      operation: () => editSession.save(nextObject)
    });
  }

  async function reloadLatest() {
    return runIXIActionNoticeLifecycle({
      objectId: noticeObjectId,
      savingMessage: "LOADING LATEST...",
      successMessage: "LATEST LOADED — REVIEW & SAVE",
      errorMessage: "LATEST NOT LOADED",
      commandId: "aos-object-rebase",
      source: "aos-commercial-editor",
      operation: () => editSession.reloadLatest()
    });
  }

  const rendered = typeof children === "function"
    ? children({ object: editSession.runtimeObject })
    : children;

  return (
    <IXIAosCardCommandProvider
      object={editSession.runtimeObject}
      objectId={noticeObjectId}
    >
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
            object={editSession.editorObject}
            saving={editSession.saving}
            error={editSession.error}
            conflict={editSession.conflict}
            onCancel={editSession.cancel}
            onSave={save}
            onReloadLatest={reloadLatest}
            mediaEnabled={mediaEnabled}
          />
        ) : null}

        <IXIAosActionNotice variant="field" />

        <style jsx>{`
          .ixi-aos-commercial-editor-bridge {
            position: relative;
            width: 298px;
            height: 471px;
          }
        `}</style>
      </div>
    </IXIAosCardCommandProvider>
  );
}
