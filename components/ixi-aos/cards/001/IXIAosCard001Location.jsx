import { useMemo, useState } from "react";

import IXIMachineRail from "../../../IXIMachineRail";
import IXICollectionThumbRail from "../../../ixi-object-system/IXICollectionThumbRail";
import IXIAosPrimaryMediaPanel from "../../card-runtime/modules/IXIAosPrimaryMediaPanel";
import IXIAosInlineAddress from "../../card-runtime/modules/IXIAosInlineAddress";
import IXIAosInlineMetricStrip from "../../card-runtime/modules/IXIAosInlineMetricStrip";
import IXIAosRelationshipInfrastructurePanel from "../../card-runtime/modules/IXIAosRelationshipInfrastructurePanel";
import IXIAosCardHeaderControls from "../../card-runtime/modules/IXIAosCardHeaderControls";

const NATIVE_WIDTH = 298;
const NATIVE_HEIGHT = 471;
const RAIL_RESERVE = 19;
const THUMB_RAIL_HEIGHT = 57;
const PREVIEW_INFO_HEIGHT = 22;
const ACTIONS_HEIGHT = 23;
const ACTIONS_LIFT = 5;
const RELATIONSHIP_ACTION_GAP = 5;
const HEADER_HEIGHT = 42;
const LOWER_STACK_HEIGHT =
  THUMB_RAIL_HEIGHT +
  ACTIONS_LIFT +
  ACTIONS_HEIGHT +
  RELATIONSHIP_ACTION_GAP;

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function clean(value) {
  return String(value || "").trim();
}

function getItemId(item = {}, index = 0) {
  return clean(item?.objectId || item?.id || item?.uuid || `item-${index}`);
}

function getItemImage(item = {}) {
  const media = Array.isArray(item?.media) ? item.media : [];
  const first = media.find(entry =>
    typeof entry === "string"
      ? Boolean(clean(entry))
      : Boolean(entry?.url || entry?.src || entry?.imageUrl)
  );

  if (typeof first === "string") return first;

  return clean(
    first?.url ||
    first?.src ||
    first?.imageUrl ||
    item?.imageUrl ||
    item?.imageUrls?.[0] ||
    item?.images?.[0]?.url
  );
}

function getItemLabel(item = {}, index = 0) {
  return clean(
    item?.displayName ||
      item?.name ||
      item?.title ||
      [item?.fields?.year, item?.fields?.make, item?.fields?.model]
        .filter(Boolean)
        .join(" ") ||
      `OBJECT ${index + 1}`
  );
}

export const CARD_001_LOCATION = Object.freeze({
  cardNumber: 1,
  templateSlug: "location-standard",
  nativeWidth: NATIVE_WIDTH,
  nativeHeight: NATIVE_HEIGHT,
  railReserve: RAIL_RESERVE,
  label: "Location",
  section: "LOCATIONS & FACILITIES"
});

export default function IXIAosCard001Location({
  object = {},
  projection = null,
  objects = [],
  ixiState = {},
  onIxiStateChange = null,
  onSaveObject = null,
  onAddObject = null,
  onHideObject = null,
  onDeleteObject = null,
  onOpenConsole = null,
  onRecall = null,
  onBoard = null,
  onReturn = null,
  onExposeObject = null,
  onSendFront = null,
  onSendBack = null,
  onCycleColor = null,
  onCycleOutline = null,
  armedDestination = "",
  onSendToArmedDestination = null
}) {
  const objectId = String(object?.objectId || object?.id || "");
  const [saving, setSaving] = useState(false);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [mediaDraft, setMediaDraft] = useState(() =>
    Array.isArray(object?.media) ? object.media : []
  );

  const editDraft = safeObject(ixiState?.editDraft);
  const draftFields = safeObject(editDraft?.fields);
  const editing = Boolean(ixiState?.editing);
  const draftDisplayName = editDraft?.displayName ?? object?.displayName ?? "MIDLAND YARD";

  const runtimeObject = useMemo(
    () => ({
      ...object,
      displayName: draftDisplayName,
      media: mediaDraft,
      fields: {
        ...safeObject(object?.fields),
        ...draftFields
      }
    }),
    [object, draftDisplayName, draftFields, mediaDraft]
  );

  const childItems = Array.isArray(objects) ? objects : [];
  const activeChildIndex = childItems.length
    ? Math.min(Math.max(selectedChildIndex, 0), childItems.length - 1)
    : -1;
  const activeChild = activeChildIndex >= 0 ? childItems[activeChildIndex] : null;
  const activeChildTitle = activeChild
    ? getItemLabel(activeChild, activeChildIndex)
    : "NO OBJECT SELECTED";

  function patchField(fieldId, value) {
    if (!objectId) return;
    onIxiStateChange?.(objectId, {
      editDraft: {
        ...editDraft,
        fields: { ...draftFields, [fieldId]: value }
      }
    });
  }

  function patchDisplayName(value) {
    if (!objectId) return;
    onIxiStateChange?.(objectId, {
      editDraft: {
        ...editDraft,
        displayName: value,
        fields: { ...draftFields }
      }
    });
  }

  function addPhoto(photo) {
    const url = clean(photo?.url);
    if (!url) return;
    setMediaDraft(current => [
      {
        url,
        name: clean(photo?.name),
        type: clean(photo?.type),
        size: Number(photo?.size || 0),
        source: "user-upload"
      },
      ...current
    ]);
  }

  function beginEdit() {
    if (!objectId) return;
    onIxiStateChange?.(objectId, {
      editing: true,
      editDraft: {
        displayName: object?.displayName || "MIDLAND YARD",
        fields: { ...safeObject(object?.fields) }
      }
    });
  }

  async function saveEdit() {
    if (!objectId || saving) return;
    setSaving(true);
    try {
      await onSaveObject?.({
        objectId,
        object: runtimeObject,
        displayName: runtimeObject.displayName,
        fields: { ...safeObject(runtimeObject?.fields) },
        media: [...mediaDraft]
      });
      onIxiStateChange?.(objectId, { editing: false, editDraft: null });
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setMediaDraft(Array.isArray(object?.media) ? object.media : []);
    onIxiStateChange?.(objectId, { editing: false, editDraft: null });
  }

  function previewPrevious(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (!childItems.length) return;
    setSelectedChildIndex(current =>
      current <= 0 ? childItems.length - 1 : current - 1
    );
  }

  function previewNext(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (!childItems.length) return;
    setSelectedChildIndex(current =>
      current >= childItems.length - 1 ? 0 : current + 1
    );
  }

  function exposeSelected(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (!activeChild) return;
    onExposeObject?.(activeChild, runtimeObject);
  }

  const metrics = {
    moduleType: "inline-metric-strip",
    config: {
      metrics: [
        { metricId: "assets", label: "ASSETS", source: "projection", key: "assetCount", type: "number" },
        { metricId: "value", label: "VALUE", source: "projection", key: "totalAssetValue", type: "money" },
        { metricId: "employees", label: "EMPLOYEES", source: "projection", key: "employeeCount", type: "number" }
      ]
    }
  };

  return (
    <div className="card001 card board-color-none board-outline-1">
      <header className="header">
        <div className="identity">
          <span>LOCATIONS &amp; FACILITIES</span>
          {editing ? (
            <input
              className="name-input"
              value={draftDisplayName}
              autoFocus
              onPointerDown={event => event.stopPropagation()}
              onChange={event => patchDisplayName(event.target.value)}
            />
          ) : (
            <strong>{runtimeObject.displayName}</strong>
          )}
        </div>
        <IXIAosCardHeaderControls
          canAdd
          canEdit
          editing={editing}
          onAdd={onAddObject}
          onToggleEdit={beginEdit}
          onHide={onHideObject}
          onDelete={onDeleteObject}
          onOpenConsole={onOpenConsole}
        />
      </header>

      <main className="body">
        <div className="photo">
          <IXIAosPrimaryMediaPanel
            object={runtimeObject}
            moduleDefinition={{ config: { height: 158 } }}
            editing={editing}
            onAddPhoto={addPhoto}
          />
        </div>

        <div className="preview-info-strip">
          <strong title={activeChildTitle}>{activeChildTitle}</strong>
          <span className="preview-position">
            {activeChild ? `${activeChildIndex + 1}/${childItems.length}` : "0/0"}
          </span>
          <button
            type="button"
            className="preview-out"
            disabled={!activeChild}
            title="Put this object on Board"
            onPointerDown={event => event.stopPropagation()}
            onClick={exposeSelected}
          >
            OUT ↗
          </button>
        </div>

        <div className="address">
          <IXIAosInlineAddress
            object={runtimeObject}
            editing={editing}
            onFieldChange={patchField}
          />
        </div>

        <div className="metrics">
          <IXIAosInlineMetricStrip
            object={runtimeObject}
            projection={projection}
            moduleDefinition={metrics}
          />
        </div>

        <div className="relationships">
          <IXIAosRelationshipInfrastructurePanel
            object={runtimeObject}
            moduleDefinition={{
              config: {
                title: "RELATIONSHIPS & INFRASTRUCTURE",
                height: 150
              }
            }}
          />
        </div>

        {editing ? (
          <div className="edit-actions">
            <button type="button" disabled={saving} onClick={saveEdit}>SAVE</button>
            <button type="button" disabled={saving} onClick={cancelEdit}>CANCEL</button>
          </div>
        ) : null}
      </main>

      <div className="actions">
        <button type="button" onClick={() => onRecall?.(runtimeObject)}>↻ <span>RECALL</span></button>
        <button type="button" onClick={() => onBoard?.(runtimeObject)}>▦ <span>BOARD</span></button>
        <button type="button" onClick={() => onReturn?.(runtimeObject)}>↩ <span>RETURN</span></button>
      </div>

      <div className="photo-rail">
        <IXICollectionThumbRail
          items={childItems}
          activeItemIndex={activeChildIndex}
          getItemId={getItemId}
          getItemImage={getItemImage}
          getItemLabel={getItemLabel}
          onSelectItem={(item, index) => setSelectedChildIndex(index)}
        />
        {childItems.length > 1 ? (
          <>
            <button type="button" className="card-photo-nav left" onPointerDown={event => event.stopPropagation()} onClick={previewPrevious}>‹</button>
            <button type="button" className="card-photo-nav right" onPointerDown={event => event.stopPropagation()} onClick={previewNext}>›</button>
          </>
        ) : null}
      </div>

      <IXIMachineRail
        listing={runtimeObject}
        saved={false}
        boardColor="none"
        boardOutline={1}
        machineFace={1}
        onSendFront={onSendFront}
        onSendBack={onSendBack}
        onCycleColor={onCycleColor}
        onCycleOutline={onCycleOutline}
        armedDestination={armedDestination}
        onSendToArmedDestination={onSendToArmedDestination}
      />

      <style jsx>{`
        .card001,.card001 *{box-sizing:border-box}
        .card001{position:relative;width:${NATIVE_WIDTH}px;min-width:${NATIVE_WIDTH}px;max-width:${NATIVE_WIDTH}px;height:${NATIVE_HEIGHT}px;min-height:${NATIVE_HEIGHT}px;max-height:${NATIVE_HEIGHT}px;overflow:hidden;border:1px solid rgba(255,255,255,.10);border-radius:14px;background:linear-gradient(180deg,rgba(255,255,255,.025),transparent 30%),#101010;color:#f4f4f4;box-shadow:inset 0 1px 0 rgba(255,255,255,.04),0 18px 34px rgba(0,0,0,.42)}
        .header{position:absolute;top:0;left:0;right:0;height:${HEADER_HEIGHT}px;padding:7px 12px 3px;display:flex;align-items:flex-start;justify-content:space-between;gap:8px;border-bottom:1px solid rgba(255,255,255,.045);z-index:5}
        .identity{min-width:0;flex:1}.identity span{display:block;color:#ffc400;font-size:6.5px;font-weight:950;letter-spacing:.08em}.identity strong{display:block;margin-top:4px;overflow:hidden;color:#f4f4f4;font-size:17px;font-weight:950;line-height:1;text-overflow:ellipsis;white-space:nowrap}
        .name-input{display:block;width:calc(100% - 92px);max-width:148px;height:20px;margin-top:2px;padding:0 5px;border:1px solid rgba(255,196,0,.40);border-radius:4px;background:#090909;color:#f4f4f4;font-size:13px;font-weight:950;outline:none;text-transform:uppercase}.name-input:focus{border-color:#ffc400}
        .body{position:absolute;top:${HEADER_HEIGHT}px;left:0;right:0;bottom:${RAIL_RESERVE + LOWER_STACK_HEIGHT}px;display:flex;flex-direction:column;overflow:hidden;padding:0}
        .photo{flex:none;margin:0}
        .preview-info-strip{flex:none;height:${PREVIEW_INFO_HEIGHT}px;min-height:${PREVIEW_INFO_HEIGHT}px;display:grid;grid-template-columns:minmax(0,1fr) 32px 52px;align-items:center;border-top:1px solid rgba(255,255,255,.05);border-bottom:1px solid rgba(255,255,255,.045);background:#0a0a0a}
        .preview-info-strip strong{min-width:0;overflow:hidden;padding:0 7px;color:rgba(255,255,255,.86);font-size:7.5px;font-weight:950;text-overflow:ellipsis;text-transform:uppercase;white-space:nowrap}
        .preview-position{color:rgba(255,255,255,.30);font-size:6.5px;font-weight:900;text-align:center}
        .preview-out{height:100%;padding:0;border:0;border-left:1px solid rgba(255,255,255,.045);background:transparent;color:#ffc400;font-size:7px;font-weight:950}.preview-out:disabled{color:rgba(255,255,255,.18)}
        .