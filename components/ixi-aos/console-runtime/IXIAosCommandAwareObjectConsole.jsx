import {
  IXIAosCardCommandProvider
} from "../card-runtime/IXIAosCardCommandContext";

import IXIAosObjectConsole from "./IXIAosObjectConsole";

const clean = value => String(value || "").trim();

export default function IXIAosCommandAwareObjectConsole(props) {
  const {
    object = {},
    objectId = "",
    ixiCardState = {},
    updateIxiCardState = null,
    previewCardState = {},
    updatePreviewCardState = null,
    onOpenTransact = null
  } = props;

  const resolvedObjectId = clean(
    objectId ||
    object?.objectId ||
    object?.id ||
    object?.uuid
  );

  const objectState =
    ixiCardState?.[resolvedObjectId] ||
    previewCardState ||
    {};

  function updateObjectState(changedObjectId, patch = {}) {
    const id = clean(changedObjectId) || resolvedObjectId;

    if (!id) {
      return;
    }

    if (typeof updateIxiCardState === "function") {
      updateIxiCardState(id, patch);
      return;
    }

    updatePreviewCardState?.(id, patch);
  }

  return (
    <IXIAosCardCommandProvider
      object={object}
      objectId={resolvedObjectId}
      ixiState={objectState}
      onIxiStateChange={updateObjectState}
      onOpenTransact={onOpenTransact}
    >
      <IXIAosObjectConsole {...props} />
    </IXIAosCardCommandProvider>
  );
}
