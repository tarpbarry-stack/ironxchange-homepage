import { useState } from "react";

import IXISystemIndexCard from "../../../ixi-mos/IXISystemIndexCard";
import IXIObjectRail from "../../../ixi-object-system/IXIObjectRail";
import IXIAosCardHeaderControls from "../../card-runtime/modules/IXIAosCardHeaderControls";
import IXIAosCardHeaderIdentity from "../../card-runtime/modules/IXIAosCardHeaderIdentity";

export const CARD_018 = Object.freeze({
  cardNumber: 18,
  templateSlug: "aos-card-018",
  nativeWidth: 298,
  nativeHeight: 471,
  railReserve: 23,
  version: 12,
  renderer: "system-index-equipment-container"
});

function clean(value) {
  return String(value ?? "").trim();
}

export default function IXIAosCard018({
  object = {},
  children = [],
  objects = [],
  ixiState = {},
  ixiCardState = {},
  onIxiStateChange = null,
  onSaveObject = null,
  onAddObject = null,
  onHideObject = null,
  onDeleteObject = null,
  onExposeObject = null,
  onOpenTransact = null,
  onCycleFace = null,
  onRecall = null,
  onBoard = null,
  onReturn = null,
  onSendFront = null,
  onSendBack = null,
  onCycleColor = null,
  onCycleOutline = null,
  onSendToArmedDestination = null,
  armedDestination = "",
  dragHandleProps = null
}) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(clean(object?.displayName));
  const items = Array.isArray(children) && children.length ? children : (Array.isArray(objects) ? objects : []);
  const objectId = clean(object?.objectId || object?.id?.uuid || object?.id);

  async function saveName(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    const displayName = clean(draftName) || clean(object?.displayName) || "EQUIPMENT";
    await onSaveObject?.({ object: { ...object, displayName } });
    setEditing(false);
  }

  return (
    <IXIAosCardHeaderIdentity object={object}>
    <div className="ixi-card-018" data-card-number="018" data-card-skin="v12">
      <IXISystemIndexCard
        index={{ ...object, items }}
        objectId={objectId}
        dragHandleProps={dragHandleProps}
        ixiState={ixiState}
        ixiCardState={ixiCardState}
        onIxiStateChange={onIxiStateChange}
        armedDestination={armedDestination}
        onSendFront={onSendFront}
        onSendBack={onSendBack}
        onCycleColor={onCycleColor}
        onCycleOutline={onCycleOutline}
        onSendToArmedDestination={onSendToArmedDestination}
        onExposeObject={onExposeObject}
        onOpenConsole={onOpenTransact}
        onExposeContents={() => onBoard?.(object)}
        onGatherContents={() => onRecall?.(object)}
        onReturnContents={() => onReturn?.(object)}
        onAddObject={onAddObject}
        onSavePresentation={(_, action = {}) => {
          if (action?.intent === "edit-face-1") {
            setDraftName(clean(object?.displayName));
            setEditing(true);
          }
        }}
      />

      {!editing ? (
        <header className="c018-head">
          <div className="c018-identity">
            <span>{clean(object?.singularLabel) || "CONTAINER"}</span>
            <h2>{clean(object?.displayName) || "UNTITLED CONTAINER"}</h2>
          </div>
          <IXIAosCardHeaderControls
            canAdd={typeof onAddObject === "function"}
            canEdit
            canTransact={typeof onOpenTransact === "function"}
            onAdd={() => onAddObject?.(object)}
            onToggleEdit={() => { setDraftName(clean(object?.displayName)); setEditing(true); }}
            onTransact={() => onOpenTransact?.(object)}
            onHide={onHideObject}
            onDelete={onDeleteObject}
            onOpenConsole={onOpenTransact}
            skinId="v12"
          />
        </header>
      ) : null}

      <IXIObjectRail
        object={object}
        saved={false}
        color={ixiState?.color || "none"}
        outline={Number(ixiState?.outline ?? 1)}
        face={1}
        onSendFront={onSendFront}
        onSendBack={onSendBack}
        onCycleColor={onCycleColor}
        onCycleOutline={onCycleOutline}
        onCycleFace={onCycleFace}
        armedDestination={armedDestination}
        onSendToArmedDestination={onSendToArmedDestination}
      />

      {editing ? (
        <form className="c018-editor" onSubmit={saveName} onPointerDown={event => event.stopPropagation()}>
          <header>
            <div><small>CARD 018 · FACE 1</small><strong>EDIT EQUIPMENT INDEX</strong></div>
            <nav><button type="button" onClick={() => setEditing(false)}>CANCEL</button><button type="submit">SAVE</button></nav>
          </header>
          <main>
            <label><span>INDEX NAME</span><input autoFocus value={draftName} onChange={event => setDraftName(event.target.value)} /></label>
            <p>The child deck, values, media and relationships remain canonical AOS data.</p>
          </main>
        </form>
      ) : null}

      <style jsx>{`
        .ixi-card-018{position:relative;width:298px;height:471px;overflow:hidden;border-radius:13px;background:#090b0a;font-family:'Inter Variable',Inter,Arial,Helvetica,sans-serif;box-shadow:inset 0 1px rgba(255,255,255,.045),0 18px 42px rgba(0,0,0,.46)}
        .ixi-card-018:before{content:"";position:absolute;inset:0;z-index:250;border:1px solid #454b47;border-radius:13px;box-shadow:inset 0 1px rgba(255,255,255,.055),inset 0 -1px rgba(0,194,255,.09);pointer-events:none}
        .ixi-card-018:after{content:"";position:absolute;inset:7px 7px 24px;z-index:80;border:1px solid rgba(255,255,255,.075);border-radius:9px;box-shadow:inset 0 1px rgba(255,255,255,.025);pointer-events:none}
        :global(.ixi-card-018 .system-index-card){border-color:#454b47!important;border-radius:13px!important;background:radial-gradient(circle at 84% 12%,rgba(23,73,94,.11),transparent 26%),linear-gradient(180deg,#111412,#080a09)!important;box-shadow:inset 0 1px rgba(255,255,255,.07),0 18px 40px rgba(0,0,0,.53)!important}
        :global(.ixi-card-018 .system-index-card>.board-command-rail){display:none!important}
        :global(.ixi-card-018 .index-topline){display:none!important}
        :global(.ixi-card-018 .system-index-identity){padding-top:54px!important}
        .c018-head{position:absolute;inset:0 0 auto;height:48px;padding:7px 10px;border-bottom:1px solid #303531;background:linear-gradient(180deg,#181b19,#101210);z-index:120}.c018-identity{max-width:188px}.c018-identity>span{display:block;color:#ffc400;font-size:7px;font-weight:950;letter-spacing:.08em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.c018-identity h2{margin:4px 0 0;color:#f7f8f7;font-size:13px;font-weight:950;line-height:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .c018-editor{position:absolute;inset:7px 7px 24px;z-index:200;overflow:hidden;border:1px solid #4a504c;border-radius:8px;background:#0a0d0b;box-shadow:0 18px 40px #000c;color:#eef1ef}
        .c018-editor header{height:42px;display:flex;align-items:center;justify-content:space-between;padding:0 9px;border-bottom:1px solid #303531;background:#151916}.c018-editor header small{display:block;color:#ffc400;font-size:6px;font-weight:950}.c018-editor header strong{display:block;margin-top:3px;font-size:10px}.c018-editor nav{display:flex;gap:4px}.c018-editor button{height:22px;padding:0 7px;border:1px solid #4a504c;border-radius:4px;background:#0e110f;color:#dfe3e0;font-size:6px;font-weight:950}.c018-editor button:last-child{border-color:#ffc40066;color:#ffc400}.c018-editor main{padding:12px}.c018-editor label span{display:block;margin-bottom:5px;color:#8b938d;font-size:6px;font-weight:950}.c018-editor input{width:100%;height:29px;padding:0 8px;border:1px solid #3c433f;border-radius:4px;background:#111411;color:#fff;font-size:9px;font-weight:900;outline:none}.c018-editor input:focus{border-color:#ffc400}.c018-editor p{margin:12px 0 0;color:#69716c;font-size:6px;font-weight:800;line-height:1.5}
      `}</style>
    </div>
    </IXIAosCardHeaderIdentity>
  );
}
