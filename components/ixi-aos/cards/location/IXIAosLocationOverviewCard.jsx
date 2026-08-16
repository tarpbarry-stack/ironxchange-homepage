import { useMemo, useState } from "react";

import IXIMachineRail from "../../../IXIMachineRail";
import IXICollectionThumbRail from "../../../ixi-object-system/IXICollectionThumbRail";
import IXIAosPrimaryMediaPanel from "../../card-runtime/modules/IXIAosPrimaryMediaPanel";
import IXIAosInlineAddress from "../../card-runtime/modules/IXIAosInlineAddress";
import IXIAosInlineMetricStrip from "../../card-runtime/modules/IXIAosInlineMetricStrip";
import IXIAosRelationshipInfrastructurePanel from "../../card-runtime/modules/IXIAosRelationshipInfrastructurePanel";
import IXIAosCardHeaderControls from "../../card-runtime/modules/IXIAosCardHeaderControls";

const W = 298;
const H = 471;
const RAIL = 19;
const HEADER = 43;
const THUMBS = 57;
const COMMANDS = 25;

function clean(value) {
  return String(value ?? "").trim();
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function itemId(item = {}, index = 0) {
  return clean(item.objectId || item.id || item.uuid || `item-${index}`);
}

function itemImage(item = {}) {
  const media = Array.isArray(item.media) ? item.media : [];
  const first = media.find(entry =>
    typeof entry === "string"
      ? Boolean(clean(entry))
      : Boolean(entry?.url || entry?.src || entry?.imageUrl)
  );
  if (typeof first === "string") return first;
  return clean(first?.url || first?.src || first?.imageUrl || item.imageUrl || item.imageUrls?.[0] || item.images?.[0]?.url);
}

function itemLabel(item = {}, index = 0) {
  return clean(
    item.displayName ||
      item.name ||
      item.title ||
      [item?.fields?.year, item?.fields?.make, item?.fields?.model].filter(Boolean).join(" ") ||
      `OBJECT ${index + 1}`
  );
}

const metricsDefinition = {
  moduleType: "inline-metric-strip",
  config: {
    metrics: [
      { metricId: "assets", label: "ASSETS", source: "projection", key: "assetCount", type: "number" },
      { metricId: "value", label: "VALUE", source: "projection", key: "totalAssetValue", type: "money" },
      { metricId: "employees", label: "EMPLOYEES", source: "projection", key: "employeeCount", type: "number" }
    ]
  }
};

export default function IXIAosLocationOverviewCard({
  variant = "001",
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
  const objectId = clean(object.objectId || object.id);
  const [saving, setSaving] = useState(false);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [mediaDraft, setMediaDraft] = useState(() => Array.isArray(object.media) ? object.media : []);

  const editDraft = safeObject(ixiState.editDraft);
  const draftFields = safeObject(editDraft.fields);
  const editing = Boolean(ixiState.editing);
  const draftDisplayName = editDraft.displayName ?? object.displayName ?? "YARD NAME";

  const runtimeObject = useMemo(() => ({
    ...object,
    displayName: draftDisplayName,
    media: mediaDraft,
    fields: {
      ...safeObject(object.fields),
      ...draftFields
    }
  }), [object, draftDisplayName, draftFields, mediaDraft]);

  const children = Array.isArray(objects) ? objects : [];
  const activeIndex = children.length ? Math.min(Math.max(selectedChildIndex, 0), children.length - 1) : -1;
  const activeChild = activeIndex >= 0 ? children[activeIndex] : null;
  const activeTitle = activeChild ? itemLabel(activeChild, activeIndex) : "NO OBJECT SELECTED";

  const contactName = clean(runtimeObject?.fields?.yardContact) || "JOHN CARTER";
  const contactPhone = clean(runtimeObject?.fields?.yardPhone) || "432-555-0186";

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
    setMediaDraft(current => [{
      url,
      name: clean(photo?.name),
      type: clean(photo?.type),
      size: Number(photo?.size || 0),
      source: "user-upload"
    }, ...current]);
  }

  function beginEdit() {
    if (!objectId) return;
    onIxiStateChange?.(objectId, {
      editing: true,
      editDraft: {
        displayName: object.displayName || "YARD NAME",
        fields: { ...safeObject(object.fields) }
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
        fields: { ...safeObject(runtimeObject.fields) },
        media: [...mediaDraft]
      });
      onIxiStateChange?.(objectId, { editing: false, editDraft: null });
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setMediaDraft(Array.isArray(object.media) ? object.media : []);
    onIxiStateChange?.(objectId, { editing: false, editDraft: null });
  }

  function previousChild(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (!children.length) return;
    setSelectedChildIndex(current => current <= 0 ? children.length - 1 : current - 1);
  }

  function nextChild(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (!children.length) return;
    setSelectedChildIndex(current => current >= children.length - 1 ? 0 : current + 1);
  }

  function exposeSelected(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (!activeChild) return;
    onExposeObject?.(activeChild, runtimeObject);
  }

  const hasThumbs = variant !== "002";
  const relationshipHeight = variant === "002" ? 260 : variant === "003" ? 146 : 118;

  return (
    <div className={`ixi-location-overview ixi-location-${variant}`}>
      <header className="loc-head">
        <div className="loc-identity">
          <span>LOCATIONS &amp; FACILITIES</span>
          {editing ? (
            <input
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
          <div className="loc-edit-actions">
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

      <main className="loc-body">
        {variant === "003" ? (
          <div className="loc-split-top">
            <div className="loc-media split-media">
              <IXIAosPrimaryMediaPanel
                object={runtimeObject}
                moduleDefinition={{ config: { height: 84 } }}
                editing={editing}
                onAddPhoto={addPhoto}
              />
            </div>
            <div className="loc-contact-card">
              <div className="loc-contact-address">
                <span className="loc-pin">⌖</span>
                <IXIAosInlineAddress object={runtimeObject} editing={editing} onFieldChange={patchField} />
              </div>
              <div className="loc-contact-person">
                <strong>{contactName}</strong>
                <span>{contactPhone}</span>
              </div>
            </div>
          </div>
        ) : variant === "001" ? (
          <div className="loc-media">
            <IXIAosPrimaryMediaPanel
              object={runtimeObject}
              moduleDefinition={{ config: { height: 112 } }}
              editing={editing}
              onAddPhoto={addPhoto}
            />
          </div>
        ) : null}

        {variant !== "002" ? (
          <div className="loc-preview">
            <strong title={activeTitle}>{activeTitle}</strong>
            <span>{activeChild ? `${activeIndex + 1}/${children.length}` : "0/0"}</span>
            <button type="button" disabled={!activeChild} onPointerDown={event => event.stopPropagation()} onClick={exposeSelected}>OUT ↗</button>
          </div>
        ) : null}

        {variant !== "003" ? (
          <div className="loc-address-card">
            <span className="loc-pin">⌖</span>
            <IXIAosInlineAddress object={runtimeObject} editing={editing} onFieldChange={patchField} />
          </div>
        ) : null}

        <div className="loc-metrics">
          <IXIAosInlineMetricStrip object={runtimeObject} projection={projection} moduleDefinition={metricsDefinition} />
        </div>

        <div className="loc-relationships">
          <IXIAosRelationshipInfrastructurePanel
            object={runtimeObject}
            moduleDefinition={{ config: { title: "RELATIONSHIPS & INFRASTRUCTURE", height: relationshipHeight } }}
          />
        </div>
      </main>

      <div className="loc-commands">
        <button type="button" onClick={() => onRecall?.(runtimeObject)}>↻ <span>RECALL</span></button>
        <button type="button" onClick={() => onBoard?.(runtimeObject)}>▦ <span>BOARD</span></button>
        <button type="button" onClick={() => onReturn?.(runtimeObject)}>↩ <span>RETURN</span></button>
      </div>

      {hasThumbs ? (
        <div className="loc-thumbs">
          <IXICollectionThumbRail
            items={children}
            activeItemIndex={activeIndex}
            getItemId={itemId}
            getItemImage={itemImage}
            getItemLabel={itemLabel}
            onSelectItem={(item, index) => setSelectedChildIndex(index)}
          />
          {children.length > 1 ? (
            <>
              <button type="button" className="loc-nav left" onPointerDown={event => event.stopPropagation()} onClick={previousChild}>‹</button>
              <button type="button" className="loc-nav right" onPointerDown={event => event.stopPropagation()} onClick={nextChild}>›</button>
            </>
          ) : null}
        </div>
      ) : null}

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
        .ixi-location-overview,.ixi-location-overview *{box-sizing:border-box}
        .ixi-location-overview{--bg:#090b0d;--s1:#0f1317;--s2:#14191f;--s3:#181e25;--line:rgba(255,255,255,.095);--line2:rgba(255,255,255,.055);--text:#f4f6f7;--muted:#8d969e;--yellow:#ffc400;position:relative;width:${W}px;height:${H}px;overflow:hidden;border:1px solid rgba(255,255,255,.11);border-radius:15px;background:radial-gradient(130% 72% at 50% -8%,rgba(255,255,255,.052),transparent 43%),linear-gradient(180deg,#111419 0%,#0b0e11 54%,#080a0c 100%);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Arial,sans-serif;box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 18px 42px rgba(0,0,0,.46)}
        .loc-head{position:absolute;inset:0 0 auto;height:${HEADER}px;padding:7px 9px 4px 10px;border-bottom:1px solid var(--line2);background:linear-gradient(180deg,rgba(255,255,255,.024),transparent);z-index:40}
        .loc-identity{width:150px;min-width:0}.loc-identity>span{display:block;color:var(--yellow);font-size:6.6px;font-weight:850;letter-spacing:.105em}.loc-identity>strong{display:block;margin-top:4px;overflow:hidden;color:#fafafa;font-family:Georgia,"Times New Roman",serif;font-size:17px;font-weight:800;line-height:1;letter-spacing:-.02em;text-overflow:ellipsis;white-space:nowrap}.loc-identity>input{width:142px;height:22px;margin-top:3px;padding:0 6px;border:1px solid rgba(255,196,0,.42);border-radius:5px;background:#0b0d0f;color:#fff;font-size:11px;font-weight:800;outline:none;text-transform:uppercase}
        .loc-edit-actions{position:absolute;top:9px;right:8px;display:flex;border:1px solid var(--line);border-radius:7px;overflow:hidden}.loc-edit-actions button{height:22px;padding:0 8px;border:0;border-right:1px solid var(--line2);background:transparent;color:#aeb5ba;font-size:6px;font-weight:850}.loc-edit-actions button:first-child{color:var(--yellow)}.loc-edit-actions button:last-child{border-right:0}
        .loc-body{position:absolute;top:${HEADER}px;left:0;right:0;display:flex;flex-direction:column;min-height:0;overflow:hidden}.ixi-location-001 .loc-body,.ixi-location-003 .loc-body{bottom:${RAIL + THUMBS + COMMANDS + 7}px}.ixi-location-002 .loc-body{bottom:${RAIL + COMMANDS + 7}px;padding:8px 11px 0;gap:7px}
        .loc-media{flex:0 0 112px;background:#060809;border-bottom:1px solid var(--line2);overflow:hidden}.split-media{flex:initial;width:149px;height:84px;border-right:1px solid var(--line);border-bottom:0}.loc-media :global(.ixi-aos-primary-media-panel){margin:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:#060809!important}
        .loc-split-top{flex:0 0 84px;display:grid;grid-template-columns:149px 149px;border-bottom:1px solid var(--line2)}
        .loc-contact-card{height:84px;padding:7px 8px 6px;background:linear-gradient(180deg,var(--s2),var(--s1));display:grid;grid-template-rows:1fr 24px}.loc-contact-address{display:grid;grid-template-columns:12px minmax(0,1fr);align-items:center;gap:4px;min-height:0}.loc-contact-person{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:6px;border-top:1px solid var(--line2);padding-top:5px}.loc-contact-person strong{overflow:hidden;color:#f2f4f5;font-size:7.4px;font-weight:800;text-overflow:ellipsis;white-space:nowrap}.loc-contact-person span{color:#89929a;font-size:6.2px;font-weight:700;white-space:nowrap}
        .loc-preview{flex:0 0 22px;display:grid;grid-template-columns:minmax(0,1fr) 34px 52px;align-items:center;border-bottom:1px solid var(--line2);background:linear-gradient(180deg,#0d1013,#090b0d)}.loc-preview>strong{min-width:0;overflow:hidden;padding:0 8px;color:#e8ebed;font-size:7.5px;font-weight:780;text-overflow:ellipsis;white-space:nowrap}.loc-preview>span{color:#6f7880;font-size:6.5px;font-weight:700;text-align:center}.loc-preview>button{height:100%;border:0;border-left:1px solid var(--line2);background:transparent;color:var(--yellow);font-size:7.2px;font-weight:850;cursor:pointer}.loc-preview>button:disabled{opacity:.25}
        .loc-address-card{flex:0 0 34px;margin:5px 10px 0;display:grid;grid-template-columns:18px minmax(0,1fr);align-items:center;padding:0 8px;border:1px solid var(--line);border-radius:7px;background:linear-gradient(180deg,var(--s2),var(--s1));box-shadow:inset 0 1px 0 rgba(255,255,255,.02)}.ixi-location-002 .loc-address-card{flex:0 0 53px;margin:0;padding:0 12px}.loc-pin{color:var(--yellow);font-size:10px;text-align:center}
        .loc-address-card :global(.ixi-aos-inline-address),.loc-contact-address :global(.ixi-aos-inline-address){width:100%!important;min-height:0!important;height:auto!important;padding:0!important;border:0!important;background:transparent!important}.loc-address-card :global(.ixi-aos-inline-address strong),.loc-contact-address :global(.ixi-aos-inline-address strong){width:100%!important;color:#eef1f3!important;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif!important;font-size:8.2px!important;font-weight:760!important;line-height:1.2!important;text-align:left!important;white-space:normal!important}.ixi-location-002 .loc-address-card :global(.ixi-aos-inline-address strong){font-size:8.8px!important}
        .loc-metrics{flex:0 0 43px;margin:5px 10px 0}.ixi-location-002 .loc-metrics{margin:0;flex-basis:44px}.loc-metrics :global(.ixi-aos-inline-metrics){width:100%!important;height:100%!important;min-height:0!important;display:grid!important;grid-template-columns:1fr 1.25fr 1fr!important;gap:4px!important;padding:0!important;border:0!important;background:transparent!important}.loc-metrics :global(.ixi-aos-inline-metric){min-width:0!important;height:100%!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:4px!important;border:1px solid var(--line)!important;border-radius:7px!important;background:linear-gradient(180deg,var(--s2),var(--s1))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.025)!important}.loc-metrics :global(.ixi-aos-inline-metric span){color:#c49a00!important;font-size:6.5px!important;font-weight:850!important;letter-spacing:.10em!important}.loc-metrics :global(.ixi-aos-inline-metric strong){color:#fff!important;font-size:12.2px!important;font-weight:800!important;line-height:1!important;letter-spacing:-.02em!important}
        .loc-relationships{min-height:0;margin:6px 10px 0;overflow:hidden;border:1px solid var(--line);border-radius:8px;background:linear-gradient(180deg,var(--s2),#0c0f12);box-shadow:inset 0 1px 0 rgba(255,255,255,.025)}.ixi-location-001 .loc-relationships{flex:1}.ixi-location-003 .loc-relationships{flex:1}.ixi-location-002 .loc-relationships{margin:0;flex:1}
        .loc-relationships :global(.ixi-aos-relationship-panel){width:100%!important;max-height:none!important}.loc-relationships :global(.aos-relationship-section){border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important}.loc-relationships :global(.ixi-face-section-title){height:27px!important;min-height:27px!important;display:flex!important;align-items:center!important;padding:0 10px 0 13px!important;border-bottom:1px solid var(--line)!important;background:linear-gradient(180deg,rgba(255,255,255,.026),rgba(255,255,255,.008))!important;color:var(--yellow)!important;font-size:6.9px!important;font-weight:850!important;letter-spacing:.08em!important;position:relative!important}.loc-relationships :global(.ixi-face-section-title::before){content:""!important;position:absolute!important;left:0!important;top:0!important;bottom:0!important;width:3px!important;background:var(--yellow)!important}.loc-relationships :global(.panel-scroll){height:calc(100% - 27px)!important;padding:3px 5px 5px!important}.loc-relationships :global(.relationship-row){height:24px!important;min-height:24px!important;padding:0 7px!important;border:0!important;border-bottom:1px solid rgba(255,255,255,.05)!important;border-radius:0!important;background:rgba(255,255,255,.008)!important}.loc-relationships :global(.relationship-row:nth-child(even)){background:rgba(255,255,255,.022)!important}.loc-relationships :global(.relationship-row strong){color:#eef1f3!important;font-size:7.5px!important;font-weight:780!important}.loc-relationships :global(.relationship-row span){color:#8f979e!important;font-size:6.7px!important;font-weight:700!important}.loc-relationships :global(.relationship-row b){color:#d2a800!important;font-size:10px!important}
        .loc-commands{position:absolute;left:10px;right:10px;height:${COMMANDS}px;display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid var(--line2);border-bottom:1px solid var(--line2);z-index:20}.ixi-location-001 .loc-commands,.ixi-location-003 .loc-commands{bottom:${RAIL + THUMBS + 4}px}.ixi-location-002 .loc-commands{bottom:${RAIL + 3}px}.loc-commands button{border:0;border-right:1px solid var(--line2);background:transparent;color:#aab0b5;font-size:6.4px;font-weight:780;cursor:pointer}.loc-commands button:last-child{border-right:0}.loc-commands button span{margin-left:3px}.loc-commands button:hover{color:#fff}
        .loc-thumbs{position:absolute;left:0;right:0;bottom:${RAIL}px;height:${THUMBS}px;border-top:1px solid var(--line2);background:#080a0b;z-index:18;overflow:hidden}.loc-nav{position:absolute;top:0;bottom:0;width:16px;border:0;background:linear-gradient(90deg,#080a0b 55%,transparent);color:rgba(255,255,255,.35);font-size:27px;z-index:25;cursor:pointer}.loc-nav.left{left:0}.loc-nav.right{right:0;transform:none;background:linear-gradient(270deg,#080a0b 55%,transparent)}
      `}</style>
    </div>
  );
}
