import { useMemo } from "react";

import IXIObjectCardActuator from "../../ixi-chassis/IXIObjectCardActuator";
import {
  IXI_CONSOLE_MAX_DEPTH,
  IXI_CONSOLE_SLOT_TYPES,
  createConsoleSlot,
  normalizeConsoleSlots,
  insertConsoleSlot,
  removeConsoleSlot,
  assignConsoleSlotFace,
  createConsoleSlotsPatch
} from "../../ixi-chassis/IXIObjectConsoleEngine";

import { IXIAosCardCommandProvider } from "../card-runtime/IXIAosCardCommandContext";
import IXIAosActionNotice from "../card-runtime/modules/IXIAosActionNotice";
import {
  clean,
  getObjectLabel,
  getObjectPresentation,
  safeObject
} from "../card-runtime/IXIAosSemanticObjectPresentation";

import IXIAosCard001Location from "../cards/001/IXIAosCard001Location";
import IXIAosCard002Location from "../cards/002/IXIAosCard002Location";
import IXIAosCard003Location from "../cards/003/IXIAosCard003Location";
import IXIAosGenericConfiguredFaceV12 from "../cards/generic/IXIAosGenericConfiguredFaceV12";

const PANEL_WIDTH = 298;
const PANEL_HEIGHT = 471;
const AVAILABLE_FACES = Object.freeze([2, 3, 4, 5]);

function initialSlots() {
  return [createConsoleSlot({ type: IXI_CONSOLE_SLOT_TYPES.LISTING })];
}

function getConfiguredFace(object = {}, faceNumber = 2) {
  const presentation = getObjectPresentation(object);
  const faces = presentation?.faces;

  if (Array.isArray(faces)) {
    return safeObject(
      faces.find(face => Number(face?.face || face?.faceNumber || face?.index) === Number(faceNumber))
    );
  }

  if (faces && typeof faces === "object") {
    return safeObject(faces[String(faceNumber)] || faces[faceNumber]);
  }

  return safeObject(presentation?.[`face${faceNumber}`]);
}

function getFaceLabel(object = {}, faceNumber = 2) {
  const config = getConfiguredFace(object, faceNumber);
  return clean(config?.shortLabel || config?.title || config?.label) || `FACE ${faceNumber}`;
}

function getPrimaryCard(cardNumber = 1) {
  if (Number(cardNumber) === 3) return IXIAosCard003Location;
  if (Number(cardNumber) === 2) return IXIAosCard002Location;
  return IXIAosCard001Location;
}

export default function IXIAosLocationObjectConsole({
  cardNumber = 1,
  object = {},
  projection = null,
  objects = [],
  ixiState = {},
  onIxiStateChange = null,
  onSaveObject = null,
  onAddObject = null,
  onHideObject = null,
  onDeleteObject = null,
  onRecall = null,
  onBoard = null,
  onReturn = null,
  onExposeObject = null,
  primaryFace = 1,
  onPrimaryFaceChange = null,
  onOpenTransact = null,
  financialSnapshot = {},
  maintenanceSnapshot = {}
}) {
  const objectId = clean(object?.objectId || object?.id);

  const consoleSlots = useMemo(
    () => normalizeConsoleSlots(
      Array.isArray(ixiState?.consoleSlots) && ixiState.consoleSlots.length
        ? ixiState.consoleSlots
        : initialSlots(),
      { maxSlots: IXI_CONSOLE_MAX_DEPTH, faces: AVAILABLE_FACES }
    ),
    [ixiState?.consoleSlots]
  );

  const listingSlotIndex = consoleSlots.findIndex(
    slot => slot.type === IXI_CONSOLE_SLOT_TYPES.LISTING
  );
  const atCapacity = consoleSlots.length >= IXI_CONSOLE_MAX_DEPTH;
  const Card = getPrimaryCard(cardNumber);

  function stop(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
  }

  function saveSlots(nextSlots) {
    if (!objectId) return;
    onIxiStateChange?.(
      objectId,
      createConsoleSlotsPatch(nextSlots, {
        faces: AVAILABLE_FACES,
        maxSlots: IXI_CONSOLE_MAX_DEPTH
      })
    );
  }

  function addPanel(side, event) {
    stop(event);
    if (atCapacity) return;
    saveSlots(insertConsoleSlot({
      slots: consoleSlots,
      side,
      type: IXI_CONSOLE_SLOT_TYPES.EMPTY,
      maxSlots: IXI_CONSOLE_MAX_DEPTH,
      faces: AVAILABLE_FACES
    }));
  }

  function removePanel(slotId, event) {
    stop(event);
    saveSlots(removeConsoleSlot({ slots: consoleSlots, slotId, faces: AVAILABLE_FACES }));
  }

  function assignFace(slotId, face, event) {
    stop(event);
    saveSlots(assignConsoleSlotFace({ slots: consoleSlots, slotId, face, faces: AVAILABLE_FACES }));
  }

  function openConsoleFromCard() {
    if (atCapacity) return;
    saveSlots(insertConsoleSlot({
      slots: consoleSlots,
      side: "right",
      type: IXI_CONSOLE_SLOT_TYPES.EMPTY,
      maxSlots: IXI_CONSOLE_MAX_DEPTH,
      faces: AVAILABLE_FACES
    }));
  }

  const shared = {
    object,
    projection,
    objects: Array.isArray(objects) ? objects : [],
    ixiState,
    onIxiStateChange,
    onSaveObject,
    onAddObject,
    onHideObject,
    onDeleteObject,
    onOpenConsole: openConsoleFromCard,
    onRecall,
    onBoard,
    onReturn,
    onExposeObject,
    onOpenTransact
  };

  function renderFace(faceNumber) {
    const resolved = Math.min(5, Math.max(1, Number(faceNumber) || 1));
    if (resolved === 1) return <Card {...shared} />;

    const runtimeData = resolved === 3 || resolved === 4
      ? financialSnapshot
      : resolved === 5
        ? maintenanceSnapshot
        : {};

    return (
      <IXIAosGenericConfiguredFaceV12
        {...shared}
        faceNumber={resolved}
        runtimeData={runtimeData}
      />
    );
  }

  function renderOuterActuators(slotIndex) {
    const isFirst = slotIndex === 0;
    const isLast = slotIndex === consoleSlots.length - 1;

    return (
      <>
        {!atCapacity && isFirst ? (
          <IXIObjectCardActuator side="left" variant="tall" label="Add console face left" title="Add console face left" onClick={event => addPanel("left", event)} />
        ) : null}
        {!atCapacity && isLast ? (
          <IXIObjectCardActuator side="right" variant="tall" label="Add console face right" title="Add console face right" onClick={event => addPanel("right", event)} />
        ) : null}
      </>
    );
  }

  function renderSlot(slot, slotIndex) {
    const isListing = slot.type === IXI_CONSOLE_SLOT_TYPES.LISTING;
    const isEmpty = slot.type === IXI_CONSOLE_SLOT_TYPES.EMPTY;
    const isLeftOfPrimary = slotIndex < listingSlotIndex;

    if (isListing) {
      return (
        <section key={slot.slotId} className="aos-generic-console-slot primary-slot">
          {renderOuterActuators(slotIndex)}
          {renderFace(primaryFace)}
          <IXIAosActionNotice variant="office" />
        </section>
      );
    }

    if (isEmpty) {
      return (
        <section key={slot.slotId} className="aos-generic-console-slot empty-slot">
          <IXIObjectCardActuator side={isLeftOfPrimary ? "right" : "left"} variant="tall" label="Close empty console slot" title="Close empty console slot" onClick={event => removePanel(slot.slotId, event)} />
          {renderOuterActuators(slotIndex)}
          <div className="aos-face-picker">
            <strong>ADD FACE</strong>
            <span>{clean(getObjectPresentation(object)?.consoleLabel) || getObjectLabel(object)}</span>
            <div className="aos-face-grid">
              {AVAILABLE_FACES.map(faceNumber => (
                <button key={faceNumber} type="button" onClick={event => assignFace(slot.slotId, faceNumber, event)}>
                  <b>F{faceNumber}</b><span>{getFaceLabel(object, faceNumber)}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      );
    }

    return (
      <section key={slot.slotId} className="aos-generic-console-slot module-slot">
        <IXIObjectCardActuator side={isLeftOfPrimary ? "right" : "left"} variant="tall" label="Close console face" title="Close console face" onClick={event => removePanel(slot.slotId, event)} />
        {renderOuterActuators(slotIndex)}
        {renderFace(slot.face)}
        <IXIAosActionNotice variant="office" />
        <button type="button" className="aos-face-id" title={`Show F${slot.face} on primary card`} onClick={event => { stop(event); onPrimaryFaceChange?.(Number(slot.face)); }}>F{slot.face}</button>
      </section>
    );
  }

  return (
    <IXIAosCardCommandProvider object={object} objectId={objectId} ixiState={ixiState} onIxiStateChange={onIxiStateChange} onOpenTransact={onOpenTransact}>
      <div className="aos-generic-object-console" style={{ width: `${consoleSlots.length * PANEL_WIDTH}px` }} data-ixi-console-depth={consoleSlots.length}>
        {consoleSlots.map(renderSlot)}
        <style jsx global>{`
          .aos-generic-object-console,.aos-generic-object-console *{box-sizing:border-box}.aos-generic-object-console{position:relative;display:flex;align-items:flex-start;justify-content:flex-start;gap:0;overflow:visible}.aos-generic-console-slot{position:relative;flex:0 0 ${PANEL_WIDTH}px;width:${PANEL_WIDTH}px;height:${PANEL_HEIGHT}px;overflow:visible}.aos-generic-console-slot.empty-slot{overflow:hidden;border:1px solid rgba(255,255,255,.08);border-radius:13px;background:linear-gradient(180deg,rgba(255,255,255,.018),transparent),#141414}.aos-face-picker{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;gap:8px}.aos-face-picker>strong{color:#ffc400;font-size:12px;font-weight:950;letter-spacing:.08em}.aos-face-picker>span{max-width:190px;margin-bottom:8px;overflow:hidden;color:rgba(255,255,255,.4);font-size:6px;font-weight:900;letter-spacing:.06em;text-overflow:ellipsis;white-space:nowrap}.aos-face-grid{width:100%;display:grid;grid-template-columns:1fr 1fr;gap:6px}.aos-face-grid button{height:54px;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:4px;padding:0 9px;border:1px solid rgba(255,255,255,.08);border-radius:6px;background:rgba(255,255,255,.025);color:rgba(255,255,255,.68);cursor:pointer}.aos-face-grid button:hover{border-color:rgba(255,196,0,.35);background:rgba(255,196,0,.06)}.aos-face-grid b{color:#ffc400;font-size:9px;font-weight:950}.aos-face-grid span{max-width:100%;overflow:hidden;font-size:5.5px;font-weight:950;letter-spacing:.04em;text-overflow:ellipsis;white-space:nowrap}.aos-face-id{position:absolute;left:50%;bottom:-1px;width:34px;height:7px;transform:translateX(-50%);padding:0;border:0;border-radius:3px 3px 1px 1px;background:rgba(255,196,0,.92);color:#080808;font-size:4.5px;font-weight:950;cursor:pointer;z-index:180}
        `}</style>
      </div>
    </IXIAosCardCommandProvider>
  );
}
