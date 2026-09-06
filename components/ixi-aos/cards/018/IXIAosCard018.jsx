import { useState } from "react";

import IXISystemIndexCard from "../../../ixi-mos/IXISystemIndexCard";

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
  onExposeObject = null,
  onOpenTransact = null,
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
        .ixi-card-018{position:relative;width:298px;height:471px;font-family:Arial,Helvetica,sans-serif}
        .c018-editor{position:absolute;inset:7px 7px 24px;z-index:200;overflow:hidden;border:1px solid #4a504c;border-radius:8px;background:#0a0d0b;box-shadow:0 18px 40px #000c;color:#eef1ef}
        .c018-editor header{height:42px;display:flex;align-items:center;justify-content:space-between;padding:0 9px;border-bottom:1px solid #303531;background:#151916}.c018-editor header small{display:block;color:#ffc400;font-size:6px;font-weight:950}.c018-editor header strong{display:block;margin-top:3px;font-size:10px}.c018-editor nav{display:flex;gap:4px}.c018-editor button{height:22px;padding:0 7px;border:1px solid #4a504c;border-radius:4px;background:#0e110f;color:#dfe3e0;font-size:6px;font-weight:950}.c018-editor button:last-child{border-color:#ffc40066;color:#ffc400}.c018-editor main{padding:12px}.c018-editor label span{display:block;margin-bottom:5px;color:#8b938d;font-size:6px;font-weight:950}.c018-editor input{width:100%;height:29px;padding:0 8px;border:1px solid #3c433f;border-radius:4px;background:#111411;color:#fff;font-size:9px;font-weight:900;outline:none}.c018-editor input:focus{border-color:#ffc400}.c018-editor p{margin:12px 0 0;color:#69716c;font-size:6px;font-weight:800;line-height:1.5}
      `}</style>
    </div>
  );
}
