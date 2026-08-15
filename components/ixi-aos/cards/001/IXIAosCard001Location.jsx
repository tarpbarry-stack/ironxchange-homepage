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
        .card001{
          --steel0:#090a0a;
          --steel1:#101212;
          --steel2:#171919;
          --steel3:#242727;
          --steel4:#3a3e3d;
          --line1:rgba(255,255,255,.075);
          --line2:rgba(255,255,255,.13);
          --text:#e7e8e5;
          --textStrong:#f4f4f0;
          --textDim:#777b78;
          --yellow:#ffc400;
          --blue:#00b7eb;
          position:relative;
          width:${NATIVE_WIDTH}px;min-width:${NATIVE_WIDTH}px;max-width:${NATIVE_WIDTH}px;
          height:${NATIVE_HEIGHT}px;min-height:${NATIVE_HEIGHT}px;max-height:${NATIVE_HEIGHT}px;
          overflow:hidden;
          border:1px solid #373a3a;
          border-radius:14px;
          background:
            radial-gradient(circle at 18% 8%,rgba(255,255,255,.028),transparent 22%),
            repeating-linear-gradient(135deg,rgba(255,255,255,.009) 0,rgba(255,255,255,.009) 1px,transparent 1px,transparent 5px),
            linear-gradient(180deg,#121414 0%,#0c0e0e 45%,#080909 100%);
          color:var(--text);
          font-family:"Roboto Condensed","Arial Narrow","Helvetica Neue",Arial,sans-serif;
          box-shadow:inset 0 1px 0 rgba(255,255,255,.10),inset 0 -1px 0 rgba(0,0,0,.92),0 18px 34px rgba(0,0,0,.50);
        }
        .card001::before{
          content:"";position:absolute;inset:4px;pointer-events:none;z-index:2;border:1px solid rgba(255,255,255,.035);border-radius:11px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.82)
        }
        .header{
          position:absolute;top:0;left:0;right:0;height:${HEADER_HEIGHT}px;
          padding:7px 12px 3px;display:flex;align-items:flex-start;justify-content:space-between;gap:8px;
          border-bottom:1px solid #030404;z-index:5;
          background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.008) 18%,transparent 40%),linear-gradient(90deg,#191b1b 0%,#101212 60%,#0a0b0b 100%);
          box-shadow:inset 0 1px 0 rgba(255,255,255,.10),inset 0 -1px 0 rgba(255,255,255,.035),0 2px 4px rgba(0,0,0,.65)
        }
        .header::before{content:"";position:absolute;left:7px;top:6px;bottom:6px;right:115px;border:1px solid rgba(255,255,255,.11);border-radius:4px;background:repeating-linear-gradient(135deg,rgba(255,255,255,.018) 0,rgba(255,255,255,.018) 1px,transparent 1px,transparent 4px);box-shadow:inset 0 0 0 1px rgba(0,0,0,.82),inset 0 1px 1px rgba(255,255,255,.035);pointer-events:none}
        .identity{position:relative;z-index:2;min-width:0;flex:1;padding:1px 7px 0 7px}.identity span{display:block;color:var(--yellow);font-size:6.5px;font-weight:950;letter-spacing:.08em;text-shadow:0 1px 0 #000,0 0 8px rgba(255,196,0,.10)}.identity strong{display:block;margin-top:4px;overflow:hidden;color:#ecece9;font-size:17px;font-weight:950;line-height:1;text-overflow:ellipsis;white-space:nowrap;letter-spacing:-.02em;text-shadow:0 1px 0 #000,0 -1px 0 rgba(255,255,255,.09)}
        .name-input{display:block;width:calc(100% - 92px);max-width:148px;height:20px;margin-top:2px;padding:0 5px;border:1px solid rgba(255,196,0,.52);border-radius:4px;background:linear-gradient(180deg,#151717,#090a0a);color:#f4f4f0;font-size:13px;font-weight:950;outline:none;text-transform:uppercase;box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 0 0 1px rgba(255,196,0,.05)}.name-input:focus{border-color:var(--yellow)}
        .body{position:absolute;top:${HEADER_HEIGHT}px;left:0;right:0;bottom:${RAIL_RESERVE + LOWER_STACK_HEIGHT}px;display:flex;flex-direction:column;overflow:hidden;padding:0}
        .photo{flex:none;margin:0;background:#020303;border-bottom:1px solid rgba(255,255,255,.10);box-shadow:inset 0 -1px 0 #000}
        .preview-info-strip{flex:none;height:${PREVIEW_INFO_HEIGHT}px;min-height:${PREVIEW_INFO_HEIGHT}px;display:grid;grid-template-columns:minmax(0,1fr) 32px 52px;align-items:center;border-top:1px solid rgba(255,255,255,.08);border-bottom:1px solid #030404;background:repeating-linear-gradient(135deg,rgba(255,255,255,.015) 0,rgba(255,255,255,.015) 1px,transparent 1px,transparent 4px),linear-gradient(180deg,#171919,#0c0e0e);box-shadow:inset 0 1px 0 rgba(255,255,255,.04),inset 0 -1px 0 #000}
        .preview-info-strip strong{min-width:0;overflow:hidden;padding:0 7px;color:#e6e7e3;font-size:8px;font-weight:950;text-overflow:ellipsis;text-transform:uppercase;white-space:nowrap;text-shadow:0 1px 0 #000}
        .preview-position{color:#bfc2bf;font-size:7px;font-weight:900;text-align:center}
        .preview-out{height:100%;padding:0;border:0;border-left:1px solid rgba(255,255,255,.07);background:linear-gradient(180deg,rgba(255,255,255,.018),transparent);color:var(--yellow);font-size:7px;font-weight:950;cursor:pointer}.preview-out:hover{background:rgba(255,196,0,.035)}.preview-out:disabled{color:rgba(255,255,255,.18)}
        .address{flex:none;width:258px;margin:-3px auto 0;text-align:center}
        .metrics{flex:none;width:270px;margin:-5px auto 0}
        .relationships{flex:1;min-height:0;margin:5px 6px 0;overflow:hidden;border:1px solid #272a2a;border-radius:5px;background:repeating-linear-gradient(135deg,rgba(255,255,255,.010) 0,rgba(255,255,255,.010) 1px,transparent 1px,transparent 4px),linear-gradient(180deg,#151717,#0d0f0f);box-shadow:inset 0 1px 0 rgba(255,255,255,.055),inset 0 -1px 0 #050606,0 1px 3px rgba(0,0,0,.65)}
        :global(.card001 .address .ixi-aos-inline-address){justify-content:center!important;text-align:center!important;background:linear-gradient(180deg,#141616,#0d0f0f)!important;border:1px solid #242727!important;border-radius:4px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.035),inset 0 -1px 0 #050606!important}
        :global(.card001 .address .ixi-aos-inline-address strong){width:100%!important;text-align:center!important;color:#e4e5e1!important;font-size:10px!important;text-shadow:0 1px 0 #000!important}
        :global(.card001 .metrics .ixi-aos-inline-metrics){width:270px!important;min-height:31px!important;justify-content:center!important;gap:0!important;padding:0!important;border:1px solid #242727!important;border-radius:4px!important;background:linear-gradient(180deg,#121414,#0b0c0c)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.035),inset 0 -1px 0 #050606!important;overflow:hidden!important}
        :global(.card001 .metrics .ixi-aos-inline-metric){gap:6px!important;padding:3px 8px!important;border-right:1px solid rgba(255,255,255,.055)!important;justify-content:center!important}
        :global(.card001 .metrics .ixi-aos-inline-metric:last-child){border-right:0!important}
        :global(.card001 .metrics .ixi-aos-inline-metric span){font-size:7px!important;color:rgba(255,196,0,.72)!important;letter-spacing:.055em!important}
        :global(.card001 .metrics .ixi-aos-inline-metric strong){font-size:12px!important;color:#ecece9!important;font-weight:950!important;text-shadow:0 1px 0 #000!important}
        :global(.card001 .relationships .ixi-aos-relationship-panel){height:100%!important;min-height:0!important;background:transparent!important}
        :global(.card001 .relationships .ixi-face-section-title){color:var(--yellow)!important;font-size:6.5px!important;letter-spacing:.08em!important;background:transparent!important;border:0!important;border-bottom:1px solid rgba(255,255,255,.055)!important;box-shadow:none!important;padding-left:7px!important}
        :global(.card001 .relationships .relationship-row){height:24px!important;border:1px solid #282b2b!important;border-radius:4px!important;background:linear-gradient(180deg,#171919,#0e1010)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.03),inset 0 -1px 0 #080909!important}
        :global(.card001 .relationships .relationship-row strong){color:#d6d7d3!important}
        :global(.card001 .relationships .relationship-row span){color:#747875!important}
        :global(.card001 .relationships .relationship-row b){color:var(--blue)!important}
        .edit-actions{position:absolute;right:7px;top:2px;display:flex;gap:4px;z-index:10}.edit-actions button{height:20px;padding:0 8px;border:1px solid #020303;border-radius:4px;background:linear-gradient(180deg,#1b1d1d,#0b0d0d);color:#ecece9;font-size:6px;font-weight:950;box-shadow:inset 0 1px 0 rgba(255,255,255,.11),inset 0 -1px 0 rgba(0,0,0,.95),0 1px 2px rgba(0,0,0,.75)}.edit-actions button:hover{color:var(--yellow);border-color:#4f5151}
        .actions{position:absolute;left:6px;right:6px;bottom:${RAIL_RESERVE + THUMB_RAIL_HEIGHT + ACTIONS_LIFT}px;height:${ACTIONS_HEIGHT}px;display:flex;align-items:center;justify-content:center;gap:6px;z-index:20}
        .actions button{height:19px;min-width:77px;padding:0 7px;border:1px solid #292c2c;border-radius:4px;background:linear-gradient(180deg,#171919,#0c0e0e);color:var(--blue);font-size:8px;font-weight:950;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.045),inset 0 -1px 0 #050606,0 1px 2px rgba(0,0,0,.55)}.actions button:hover{border-color:#444847;background:linear-gradient(180deg,#1d2020,#101212)}.actions span{margin-left:3px;color:#d6d7d3;font-size:6px;font-weight:950}
        .photo-rail{position:absolute;left:0;right:0;bottom:${RAIL_RESERVE}px;width:${NATIVE_WIDTH}px;height:${THUMB_RAIL_HEIGHT}px;overflow:hidden;margin:0;padding:0;z-index:21;background:repeating-linear-gradient(135deg,rgba(255,255,255,.009) 0,rgba(255,255,255,.009) 1px,transparent 1px,transparent 5px),#090a0a;border-top:1px solid rgba(255,255,255,.06)}
        .card-photo-nav{position:absolute;top:50%;transform:translateY(-50%);width:22px;height:${THUMB_RAIL_HEIGHT}px;border:none;background:rgba(0,0,0,.12);color:rgba(255,255,255,.62);font-size:28px;font-weight:300;cursor:pointer;z-index:30;opacity:.82;text-shadow:0 1px 0 #000}.card-photo-nav.left{left:0}.card-photo-nav.right{right:0}.card-photo-nav:hover{color:#fff;background:rgba(0,0,0,.28)}
        :global(.card001 .photo-rail .ixi-collection-thumb-rail){width:${NATIVE_WIDTH}px!important;height:${THUMB_RAIL_HEIGHT}px!important;margin:0!important;padding:2px 7px!important;align-items:center!important;background:transparent!important;border-top:0!important}
        :global(.card001 .photo-rail .ixi-collection-thumb){height:53px!important;border-color:#282b2b!important;background:linear-gradient(180deg,#151717,#0b0c0c)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.025),inset 0 -1px 0 #050606!important}
        :global(.card001 .photo-rail .ixi-collection-thumb.active){border-color:rgba(255,196,0,.92)!important;box-shadow:0 0 0 1px rgba(255,196,0,.12),0 0 10px rgba(255,196,0,.15)!important}
        :global(.card001 .photo-rail .ixi-thumb-label){background:#0d0f0f!important;color:#cfd0cd!important}
        :global(.card001 .ixi-aos-primary-media-panel){border-left:0!important;border-right:0!important;border-radius:0!important;background:#020303!important;box-shadow:inset 0 0 0 1px rgba(0,0,0,.62),inset 0 1px 0 rgba(255,255,255,.055)!important}
        :global(.card001 .ixi-aos-card-header-controls .header-action){border-color:#020303!important;background:linear-gradient(180deg,#181a1a 0%,#0d0f0f 52%,#080909 100%)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.11),inset 0 -1px 0 rgba(0,0,0,.95),0 1px 2px rgba(0,0,0,.75)!important;color:#b7bab8!important}
        :global(.card001 .ixi-aos-card-header-controls .header-action.add){color:var(--yellow)!important}
        :global(.card001 .ixi-aos-card-header-controls .header-action:hover),:global(.card001 .ixi-aos-card-header-controls .header-action.active){border-color:#4f5151!important;color:#fff!important;background:linear-gradient(180deg,#222525,#101212)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.13),0 0 0 1px rgba(255,196,0,.10),0 2px 5px rgba(0,0,0,.8)!important}
        :global(.card001 .ixi-aos-card-header-controls .header-action.add:hover){color:var(--yellow)!important}
      `}</style>
    </div>
  );
}
