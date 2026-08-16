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
  onOpenTransact = null,
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
  const draftDisplayName =
    editDraft?.displayName ?? object?.displayName ?? "MIDLAND YARD";

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

        {editing ? (
          <div className="edit-actions">
            <button type="button" disabled={saving} onClick={saveEdit}>SAVE</button>
            <button type="button" disabled={saving} onClick={cancelEdit}>CANCEL</button>
          </div>
        ) : (
          <IXIAosCardHeaderControls
            canAdd
            canEdit
            canTransact={typeof onOpenTransact === "function"}
            onAdd={() => onAddObject?.(runtimeObject)}
            onToggleEdit={beginEdit}
            onTransact={onOpenTransact}
            onHide={onHideObject}
            onDelete={onDeleteObject}
            onOpenConsole={onOpenConsole}
          />
        )}
      </header>

      <main className="body">
        <div className="photo">
          <IXIAosPrimaryMediaPanel
            object={runtimeObject}
            moduleDefinition={{ config: { height: 142 } }}
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
                height: 134
              }
            }}
          />
        </div>
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
        .card001{position:relative;width:${NATIVE_WIDTH}px;min-width:${NATIVE_WIDTH}px;max-width:${NATIVE_WIDTH}px;height:${NATIVE_HEIGHT}px;min-height:${NATIVE_HEIGHT}px;max-height:${NATIVE_HEIGHT}px;overflow:hidden;border:1px solid rgba(255,255,255,.09);border-radius:15px;background:radial-gradient(130% 70% at 50% -8%,rgba(255,255,255,.05),transparent 43%),linear-gradient(180deg,#111214 0%,#0c0d0e 58%,#0a0b0c 100%);color:#f4f5f6;box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 18px 42px rgba(0,0,0,.44)}
        .header{position:absolute;top:0;left:0;right:0;height:${HEADER_HEIGHT}px;padding:7px 8px 3px 10px;display:flex;align-items:flex-start;justify-content:space-between;gap:6px;border-bottom:1px solid rgba(255,255,255,.05);z-index:50}
        .identity{min-width:0;flex:1;padding-top:1px;max-width:145px}.identity span{display:block;color:rgba(255,196,0,.88);font-size:6.6px;font-weight:800;letter-spacing:.095em}.identity strong{display:block;margin-top:4px;overflow:hidden;color:rgba(255,255,255,.97);font-size:17.5px;font-weight:800;line-height:.98;text-overflow:ellipsis;white-space:nowrap;letter-spacing:-.025em}
        .name-input{display:block;width:132px;height:20px;margin-top:2px;padding:0 6px;border:1px solid rgba(255,196,0,.38);border-radius:5px;background:rgba(0,0,0,.36);color:#f4f4f4;font-size:12px;font-weight:800;outline:none;text-transform:uppercase}.name-input:focus{border-color:rgba(255,196,0,.78)}
        .edit-actions{display:flex;gap:0;border:1px solid rgba(255,255,255,.07);border-radius:6px;overflow:hidden}.edit-actions button{height:23px;padding:0 8px;border:0;border-right:1px solid rgba(255,255,255,.055);background:transparent;color:rgba(255,255,255,.72);font-size:6px;font-weight:850}.edit-actions button:first-child{color:#ffc400}.edit-actions button:last-child{border-right:0}
        .body{position:absolute;top:${HEADER_HEIGHT}px;left:0;right:0;bottom:${RAIL_RESERVE + LOWER_STACK_HEIGHT}px;display:flex;flex-direction:column;overflow:hidden;padding:0}
        .photo{flex:none;margin:0;background:#08090a}
        .preview-info-strip{flex:none;height:${PREVIEW_INFO_HEIGHT}px;min-height:${PREVIEW_INFO_HEIGHT}px;display:grid;grid-template-columns:minmax(0,1fr) 32px 52px;align-items:center;border-top:1px solid rgba(255,255,255,.045);border-bottom:1px solid rgba(255,255,255,.045);background:#0a0b0c}
        .preview-info-strip strong{min-width:0;overflow:hidden;padding:0 8px;color:rgba(255,255,255,.84);font-size:7.8px;font-weight:790;text-overflow:ellipsis;text-transform:uppercase;white-space:nowrap}
        .preview-position{color:rgba(255,255,255,.32);font-size:6.8px;font-weight:740;text-align:center}
        .preview-out{height:100%;padding:0;border:0;border-left:1px solid rgba(255,255,255,.045);background:transparent;color:#ffc400;font-size:7.8px;font-weight:850}.preview-out:hover{background:rgba(255,196,0,.03)}.preview-out:disabled{color:rgba(255,255,255,.16)}
        .address{flex:none;width:272px;margin:0 auto;text-align:center}
        .metrics{flex:none;width:276px;margin:-2px auto 0}
        .relationships{flex:1;min-height:0;margin:4px 10px 0;overflow:hidden}
        :global(.card001 .address .ixi-aos-inline-address){height:28px!important;min-height:28px!important;justify-content:center!important;text-align:center!important;padding:0 3px!important;background:transparent!important;border:0!important}
        :global(.card001 .address .ixi-aos-inline-address strong){width:100%!important;text-align:center!important;color:rgba(255,255,255,.9)!important;font-size:10.7px!important;font-weight:760!important;letter-spacing:-.01em!important}
        :global(.card001 .metrics .ixi-aos-inline-metrics){width:276px!important;min-height:34px!important;justify-content:center!important;gap:0!important;padding:3px 0!important;border-top:1px solid rgba(255,255,255,.045)!important;border-bottom:1px solid rgba(255,255,255,.045)!important;background:transparent!important}
        :global(.card001 .metrics .ixi-aos-inline-metric){min-width:90px!important;gap:6px!important;justify-content:center!important;border-right:1px solid rgba(255,255,255,.04)!important}.card001 :global(.ixi-aos-inline-metric:last-child){border-right:0!important}
        :global(.card001 .metrics .ixi-aos-inline-metric span){font-size:7.2px!important;color:rgba(255,196,0,.66)!important;letter-spacing:.07em!important;font-weight:780!important}
        :global(.card001 .metrics .ixi-aos-inline-metric strong){font-size:12.7px!important;color:rgba(255,255,255,.96)!important;font-weight:790!important;letter-spacing:-.025em!important}
        :global(.card001 .relationships .ixi-aos-relationship-panel){height:100%!important;min-height:0!important}
        :global(.card001 .relationships .ixi-face-section){border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important}
        :global(.card001 .relationships .ixi-face-section-title){color:rgba(255,196,0,.78)!important;font-size:6.8px!important;letter-spacing:.09em!important;font-weight:800!important;padding-left:1px!important}
        :global(.card001 .relationships .relationship-row){height:21px!important;padding:0 2px!important;border:0!important;border-bottom:1px solid rgba(255,255,255,.045)!important;border-radius:0!important;background:transparent!important;grid-template-columns:minmax(0,1fr) auto 8px!important}
        :global(.card001 .relationships .relationship-row:hover){background:rgba(255,255,255,.018)!important;border-bottom-color:rgba(255,196,0,.15)!important}
        :global(.card001 .relationships .relationship-row strong){font-size:7.5px!important;color:rgba(255,255,255,.86)!important;font-weight:780!important;letter-spacing:.005em!important}
        :global(.card001 .relationships .relationship-row span){font-size:6.7px!important;color:rgba(255,255,255,.43)!important;font-weight:710!important}
        :global(.card001 .relationships .relationship-row b){color:rgba(255,255,255,.42)!important;font-size:10px!important;font-weight:500!important}
        .actions{position:absolute;left:10px;right:10px;bottom:${RAIL_RESERVE + THUMB_RAIL_HEIGHT + ACTIONS_LIFT}px;height:${ACTIONS_HEIGHT}px;display:grid;grid-template-columns:1fr 1fr 1fr;align-items:center;gap:0;border-top:1px solid rgba(255,255,255,.045);border-bottom:1px solid rgba(255,255,255,.03);z-index:20}
        .actions button{height:22px;min-width:0;padding:0 4px;border:0;border-right:1px solid rgba(255,255,255,.04);border-radius:0;background:transparent;color:rgba(255,255,255,.42);font-size:8.4px;font-weight:700;cursor:pointer}.actions button:last-child{border-right:0}.actions button:hover{background:rgba(255,255,255,.018);color:#ffc400}.actions span{margin-left:3px;color:rgba(255,255,255,.64);font-size:6.7px;font-weight:780;letter-spacing:.025em}
        .photo-rail{position:absolute;left:0;right:0;bottom:${RAIL_RESERVE}px;width:${NATIVE_WIDTH}px;height:${THUMB_RAIL_HEIGHT}px;overflow:hidden;margin:0;padding:0;border-top:1px solid rgba(255,255,255,.045);background:rgba(0,0,0,.11);z-index:21}
        .card-photo-nav{position:absolute;top:50%;transform:translateY(-50%);width:20px;height:${THUMB_RAIL_HEIGHT}px;border:none;background:linear-gradient(90deg,rgba(0,0,0,.28),transparent);color:rgba(255,255,255,.38);font-size:25px;font-weight:300;cursor:pointer;z-index:30;opacity:.78}.card-photo-nav.right{right:0;background:linear-gradient(270deg,rgba(0,0,0,.28),transparent)}.card-photo-nav.left{left:0}
        :global(.card001 .photo-rail .ixi-collection-thumb-rail){width:${NATIVE_WIDTH}px!important;height:${THUMB_RAIL_HEIGHT}px!important;margin:0!important;padding:2px 7px!important;align-items:center!important;background:transparent!important}
        :global(.card001 .photo-rail .ixi-collection-thumb){height:53px!important;border-color:rgba(255,255,255,.065)!important;border-radius:5px!important;background:rgba(255,255,255,.01)!important;box-shadow:none!important}
        :global(.card001 .photo-rail .ixi-collection-thumb[aria-current="true"]){border-color:rgba(255,196,0,.62)!important;box-shadow:inset 0 0 0 1px rgba(255,196,0,.14)!important}
        :global(.card001 .ixi-aos-primary-media-panel){border-left:0!important;border-right:0!important;border-radius:0!important;background:#08090a!important;box-shadow:inset 0 -1px 0 rgba(255,255,255,.04)!important}
        :global(.card001 .ixi-aos-card-header-controls){top:7px!important;right:7px!important;height:23px!important;gap:0!important;border:1px solid rgba(255,255,255,.06)!important;border-radius:7px!important;overflow:visible!important;background:rgba(0,0,0,.10)!important}
        :global(.card001 .ixi-aos-card-header-controls .header-action){height:22px!important;min-width:27px!important;padding:0 7px!important;border-left:1px solid rgba(255,255,255,.045)!important;background:transparent!important;color:rgba(255,255,255,.5)!important}
        :global(.card001 .ixi-aos-card-header-controls > .header-action:first-child){border-left:0!important}
        :global(.card001 .ixi-aos-card-header-controls .header-action.add){font-size:16px!important;font-weight:450!important;color:#ffc400!important}
        :global(.card001 .ixi-aos-card-header-controls .header-action.edit){min-width:39px!important;font-size:6.4px!important;color:rgba(255,255,255,.62)!important}
        :global(.card001 .ixi-aos-card-header-controls .header-action.transact){font-size:15px!important;font-weight:450!important;color:#ffc400!important}
        :global(.card001 .ixi-aos-card-header-controls .header-action.menu){font-size:15px!important;color:rgba(255,255,255,.46)!important}
        :global(.card001 .ixi-aos-card-header-controls .header-action:hover){background:rgba(255,255,255,.025)!important;color:#ffc400!important}
      `}</style>
    </div>
  );
}
