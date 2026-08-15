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
.card001,.card001 *{box-sizing:border-box;}.card001{--steel-0:#050606;--steel-1:#090a0a;--steel-2:#0d0f0f;--steel-3:#131515;--steel-4:#191b1b;--steel-5:#232626;--steel-hi:#4b5050;--line-soft:rgba(255,255,255,.045);--line-mid:rgba(255,255,255,.10);--line-hard:rgba(255,255,255,.18);--text:#ecece8;--text-mid:#a4a7a4;--text-dim:#666a68;--amber:#ffc400;--amber-dim:#8b6b00;--cyan:#00bde9;position:relative;width:${NATIVE_WIDTH}px;min-width:${NATIVE_WIDTH}px;max-width:${NATIVE_WIDTH}px;height:${NATIVE_HEIGHT}px;min-height:${NATIVE_HEIGHT}px;max-height:${NATIVE_HEIGHT}px;overflow:hidden;border:1px solid #323535;border-radius:14px;color:var(--text);background:radial-gradient(circle at 18% 9%,rgba(255,255,255,.025),transparent 22%),repeating-linear-gradient(135deg,rgba(255,255,255,.010) 0px,rgba(255,255,255,.010) 1px,transparent 1px,transparent 5px),linear-gradient(180deg,#111313 0%,#0b0d0d 52%,#070808 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.11),inset 0 0 0 2px rgba(0,0,0,.55),inset 0 -1px 0 #000,0 16px 30px rgba(0,0,0,.48);}.card001::before{content:"";position:absolute;inset:3px;z-index:0;pointer-events:none;border:1px solid rgba(255,255,255,.035);border-radius:11px;box-shadow:inset 0 1px 0 rgba(255,255,255,.018),inset 0 -1px 0 rgba(0,0,0,.7);}.header{position:absolute;top:0;left:0;right:0;height:${HEADER_HEIGHT}px;padding:6px 10px 4px 10px;display:flex;align-items:flex-start;justify-content:space-between;gap:7px;z-index:5;border-bottom:1px solid #020303;background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.008) 22%,transparent 23%),linear-gradient(90deg,#181a1a,#0d0f0f 72%,#090a0a);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),inset 0 -1px 0 rgba(255,255,255,.035),0 2px 4px rgba(0,0,0,.72);}.identity{position:relative;min-width:0;flex:1;height:31px;padding:4px 10px 3px 10px;overflow:hidden;border:1px solid #343838;border-radius:5px;background:repeating-linear-gradient(135deg,rgba(255,255,255,.018) 0,rgba(255,255,255,.018) 1px,transparent 1px,transparent 4px),linear-gradient(180deg,#181a1a,#101212);box-shadow:inset 0 1px 0 rgba(255,255,255,.10),inset 0 0 0 1px rgba(0,0,0,.75),0 1px 2px rgba(0,0,0,.75);}.identity::before,.identity::after{content:"";position:absolute;top:5px;width:4px;height:4px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#8e9291 0 12%,#373a39 18% 47%,#080909 52% 100%);box-shadow:0 17px 0 #1c1f1e;}.identity::before{left:4px;}.identity::after{right:4px;}.identity span{display:block;position:relative;z-index:2;color:var(--amber);font-size:6.5px;line-height:1;font-weight:950;letter-spacing:.09em;}.identity strong{display:block;position:relative;z-index:2;margin-top:4px;overflow:hidden;color:#f1f1ed;font-size:16px;line-height:1;font-weight:950;letter-spacing:-.025em;text-overflow:ellipsis;white-space:nowrap;text-shadow:0 1px 0 #000,0 -1px 0 rgba(255,255,255,.08);}.name-input{position:relative;z-index:4;display:block;width:calc(100% - 4px);max-width:none;height:18px;margin-top:2px;padding:0 5px;border:1px solid rgba(255,196,0,.55);border-radius:3px;outline:none;background:linear-gradient(180deg,#0b0c0c,#050606);color:#f4f4f1;font-size:12px;line-height:18px;font-weight:950;text-transform:uppercase;box-shadow:inset 0 1px 2px rgba(0,0,0,.8),0 0 0 1px rgba(255,196,0,.08);}.name-input:focus{border-color:var(--amber);}.body{position:absolute;top:${HEADER_HEIGHT}px;left:0;right:0;bottom:${RAIL_RESERVE + LOWER_STACK_HEIGHT}px;display:flex;flex-direction:column;overflow:hidden;padding:0;background:linear-gradient(180deg,rgba(255,255,255,.005),transparent);}.photo{position:relative;flex:none;margin:0;background:#020303;box-shadow:inset 0 1px 0 #000,inset 0 -1px 0 rgba(255,255,255,.05);}.photo::after{content:"";position:absolute;inset:0;pointer-events:none;border-bottom:1px solid rgba(255,255,255,.10);box-shadow:inset 0 0 0 1px rgba(0,0,0,.52);}:global(.card001 .ixi-aos-primary-media-panel){border:0!important;border-left:0!important;border-right:0!important;border-radius:0!important;background:#020303!important;}:global(.card001 .ixi-aos-primary-media-panel img){filter:none!important;opacity:1!important;}.preview-info-strip{position:relative;flex:none;height:${PREVIEW_INFO_HEIGHT}px;min-height:${PREVIEW_INFO_HEIGHT}px;display:grid;grid-template-columns:minmax(0,1fr) 32px 52px;align-items:center;border-top:1px solid rgba(255,255,255,.10);border-bottom:1px solid #020303;background:repeating-linear-gradient(135deg,rgba(255,255,255,.014) 0,rgba(255,255,255,.014) 1px,transparent 1px,transparent 4px),linear-gradient(180deg,#181a1a,#0c0e0e);box-shadow:inset 0 1px 0 rgba(255,255,255,.05),inset 0 -1px 0 #000;}.preview-info-strip::before{content:"";position:absolute;left:5px;right:5px;bottom:2px;height:1px;opacity:.45;background:linear-gradient(90deg,var(--amber) 0 36px,rgba(255,255,255,.05) 36px 100%);}.preview-info-strip strong{min-width:0;overflow:hidden;padding:0 7px;color:#e5e6e2;font-size:7.5px;line-height:1;font-weight:950;text-overflow:ellipsis;text-transform:uppercase;white-space:nowrap;}.preview-position{color:#707371;font-size:6.5px;font-weight:900;text-align:center;}.preview-out{height:100%;padding:0;border:0;border-left:1px solid rgba(255,255,255,.055);background:linear-gradient(180deg,rgba(255,255,255,.025),transparent);color:var(--amber);font-size:7px;font-weight:950;cursor:pointer;}.preview-out:hover{color:#ffe05c;background:rgba(255,196,0,.035);}.preview-out:disabled{color:rgba(255,255,255,.16);}.address{position:relative;flex:none;width:270px;margin:4px auto 0;padding:0;overflow:hidden;border:1px solid #292c2c;border-radius:5px;background:linear-gradient(180deg,rgba(255,255,255,.025),rgba(255,255,255,.004)),#0e1010;box-shadow:inset 0 1px 0 rgba(255,255,255,.045),inset 0 -1px 0 #050606,0 1px 2px rgba(0,0,0,.65);}.address::before{content:"";position:absolute;left:7px;top:50%;width:3px;height:3px;margin-top:-1.5px;border-radius:50%;background:#454847;box-shadow:253px 0 0 #454847;}:global(.card001 .address .ixi-aos-inline-address){width:100%!important;min-height:27px!important;justify-content:center!important;padding:4px 14px!important;text-align:center!important;border:0!important;background:transparent!important;}:global(.card001 .address .ixi-aos-inline-address strong){width:100%!important;color:#e7e8e4!important;font-size:9.5px!important;font-weight:950!important;text-align:center!important;text-shadow:0 1px 0 #000;}:global(.card001 .address input){border:1px solid rgba(255,196,0,.42)!important;border-radius:3px!important;outline:none!important;background:#080909!important;color:#eee!important;box-shadow:inset 0 1px 2px rgba(0,0,0,.8)!important;}.metrics{position:relative;flex:none;width:270px;margin:4px auto 0;overflow:hidden;border:1px solid #292c2c;border-radius:5px;background:linear-gradient(180deg,#141616,#0b0d0d);box-shadow:inset 0 1px 0 rgba(255,255,255,.045),inset 0 -1px 0 #030404,0 1px 2px rgba(0,0,0,.60);}:global(.card001 .metrics .ixi-aos-inline-metrics){width:100%!important;min-height:31px!important;display:flex!important;justify-content:space-around!important;align-items:center!important;gap:0!important;padding:3px 4px!important;border:0!important;background:transparent!important;}:global(.card001 .metrics .ixi-aos-inline-metric){position:relative!important;flex:1 1 0!important;justify-content:center!important;gap:6px!important;min-width:0!important;}:global(.card001 .metrics .ixi-aos-inline-metric:not(:last-child)::after){content:""!important;position:absolute!important;right:0!important;top:4px!important;bottom:4px!important;width:1px!important;background:linear-gradient(transparent,rgba(255,255,255,.10),transparent)!important;}:global(.card001 .metrics .ixi-aos-inline-metric span){color:rgba(255,196,0,.78)!important;font-size:6.7px!important;font-weight:950!important;letter-spacing:.065em!important;}:global(.card001 .metrics .ixi-aos-inline-metric strong){color:#eeeeeb!important;font-size:11.5px!important;font-weight:950!important;text-shadow:0 1px 0 #000!important;}.relationships{position:relative;flex:1;min-height:0;margin:5px 6px 0;padding:3px;overflow:hidden;border:1px solid #323636;border-radius:6px;background:repeating-linear-gradient(135deg,rgba(255,255,255,.013) 0px,rgba(255,255,255,.013) 1px,transparent 1px,transparent 4px),linear-gradient(180deg,#171919 0%,#0c0e0e 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.075),inset 0 0 0 1px rgba(0,0,0,.7),inset 0 -1px 0 #000,0 1px 3px rgba(0,0,0,.7);}.relationships::before,.relationships::after{content:"";position:absolute;top:5px;z-index:10;width:4px;height:4px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#858989 0 12%,#363a39 18% 46%,#090a0a 52% 100%);}.relationships::before{left:5px;}.relationships::after{right:5px;}:global(.card001 .relationships .ixi-aos-relationship-panel){height:100%!important;min-height:0!important;overflow:hidden!important;border:0!important;border-radius:3px!important;background:linear-gradient(180deg,rgba(255,255,255,.018),rgba(0,0,0,.08))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.025)!important;}:global(.card001 .relationships .ixi-face-section-title){height:21px!important;display:flex!important;align-items:center!important;margin:0 4px 3px!important;padding:0 7px!important;border-bottom:1px solid rgba(255,255,255,.065)!important;color:var(--amber)!important;font-size:6.5px!important;line-height:1!important;font-weight:950!important;letter-spacing:.09em!important;text-shadow:0 1px 0 #000!important;}:global(.card001 .relationships button),:global(.card001 .relationships [role="button"]){border-color:#2c2f2f!important;border-radius:4px!important;background:linear-gradient(180deg,#171919,#0d0f0f)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.035),inset 0 -1px 0 #060707!important;}:global(.card001 .relationships button:hover),:global(.card001 .relationships [role="button"]:hover){border-color:#454949!important;background:linear-gradient(180deg,#1d2020,#111313)!important;}.edit-actions{position:absolute;right:7px;top:2px;display:flex;gap:4px;z-index:10;}.edit-actions button{position:relative;height:20px;padding:0 8px;border:1px solid #282b2b;border-radius:4px;background:linear-gradient(180deg,#171919,#080909);color:var(--amber);font-size:6px;line-height:18px;font-weight:950;box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 1px 2px rgba(0,0,0,.7);cursor:pointer;}.edit-actions button:hover{border-color:rgba(255,196,0,.45);color:#ffe166;}.actions{position:absolute;left:6px;right:6px;bottom:${RAIL_RESERVE + THUMB_RAIL_HEIGHT + ACTIONS_LIFT}px;height:${ACTIONS_HEIGHT}px;display:grid;grid-template-columns:repeat(3,1fr);gap:4px;z-index:20;padding:2px 3px;border:1px solid #292d2c;border-radius:4px;background:linear-gradient(180deg,#141616,#090a0a);box-shadow:inset 0 1px 0 rgba(255,255,255,.045),0 1px 2px rgba(0,0,0,.70);}.actions button{position:relative;height:17px;min-width:0;padding:0 5px;border:0;border-right:1px solid rgba(255,255,255,.055);border-radius:0;background:transparent;color:var(--cyan);font-size:7px;font-weight:950;cursor:pointer;}.actions button:last-child{border-right:0;}.actions button:hover{background:linear-gradient(180deg,rgba(0,189,233,.055),transparent);}.actions span{margin-left:3px;color:#b6b8b6;font-size:6px;font-weight:950;letter-spacing:.025em;}.photo-rail{position:absolute;left:0;right:0;bottom:${RAIL_RESERVE}px;width:${NATIVE_WIDTH}px;height:${THUMB_RAIL_HEIGHT}px;overflow:hidden;margin:0;padding:0;z-index:21;border-top:1px solid rgba(255,255,255,.09);background:repeating-linear-gradient(135deg,rgba(255,255,255,.010) 0,rgba(255,255,255,.010) 1px,transparent 1px,transparent 5px),#090a0a;box-shadow:inset 0 1px 0 rgba(255,255,255,.025);}:global(.card001 .photo-rail .ixi-collection-thumb-rail){width:${NATIVE_WIDTH}px!important;height:${THUMB_RAIL_HEIGHT}px!important;margin:0!important;padding:3px 10px!important;align-items:center!important;background:transparent!important;}:global(.card001 .photo-rail .ixi-collection-thumb){height:51px!important;border:1px solid #292d2c!important;border-radius:5px!important;background:linear-gradient(180deg,rgba(255,255,255,.025),rgba(0,0,0,.12)),#101212!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.035),inset 0 -1px 0 #050606!important;}:global(.card001 .photo-rail .ixi-collection-thumb.is-active),:global(.card001 .photo-rail .ixi-collection-thumb[data-active="true"]),:global(.card001 .photo-rail .ixi-collection-thumb[aria-current="true"]){border-color:var(--amber)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.055),inset 0 0 0 1px rgba(255,196,0,.14),0 0 7px rgba(255,196,0,.10)!important;}.card-photo-nav{position:absolute;top:50%;width:19px;height:${THUMB_RAIL_HEIGHT}px;transform:translateY(-50%);border:none;background:linear-gradient(90deg,rgba(0,0,0,.72),rgba(0,0,0,.08));color:rgba(255,255,255,.46);font-size:27px;line-height:${THUMB_RAIL_HEIGHT}px;font-weight:300;cursor:pointer;z-index:30;opacity:.85;}.card-photo-nav.left{left:0;}.card-photo-nav.right{right:0;background:linear-gradient(-90deg,rgba(0,0,0,.72),rgba(0,0,0,.08));}.card-photo-nav:hover{color:#fff;}:global(.card001 .header button){border-color:#242727!important;background:linear-gradient(180deg,#171919,#080909)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.055),0 1px 2px rgba(0,0,0,.75)!important;}:global(.card001 .header button:hover){border-color:#454949!important;background:linear-gradient(180deg,#202323,#0d0f0f)!important;}:global(.card001 .ixi-machine-rail){height:${RAIL_RESERVE}px!important;min-height:${RAIL_RESERVE}px!important;max-height:${RAIL_RESERVE}px!important;border-top-color:rgba(255,255,255,.10)!important;background:linear-gradient(180deg,#111313,#080909)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.035)!important;}button{-webkit-tap-highlight-color:transparent;}button:active{transform:translateY(1px);}button:focus-visible,input:focus-visible{outline:1px solid var(--amber);outline-offset:1px;}
      `}</style>
    </div>
  );
}
