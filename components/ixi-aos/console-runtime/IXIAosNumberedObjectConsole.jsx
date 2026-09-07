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
import IXIAosCardIdentityFace from "../card-runtime/IXIAosCardIdentityFace";
import IXIAosGenericConfiguredFaceV12 from "../cards/generic/IXIAosGenericConfiguredFaceV12";

const PANEL_WIDTH = 298;
const PANEL_HEIGHT = 471;
const AVAILABLE_FACES = Object.freeze([2, 3, 4, 5]);

const clean = value => String(value ?? "").trim();

function initialSlots() {
  return [createConsoleSlot({ type: IXI_CONSOLE_SLOT_TYPES.LISTING })];
}

function normalizedSlots(ixiState = {}) {
  return normalizeConsoleSlots(
    Array.isArray(ixiState?.consoleSlots) && ixiState.consoleSlots.length
      ? ixiState.consoleSlots
      : initialSlots(),
    { maxSlots: IXI_CONSOLE_MAX_DEPTH, faces: AVAILABLE_FACES }
  );
}

export function getNumberedAosConsoleNativeWidth({ objectId, ixiCardState = {} }) {
  const id = clean(objectId);
  const state = ixiCardState?.[id] || {};
  const slots = state?.transactVisible
    ? normalizeConsoleSlots(
        Array.isArray(state?.transactConsoleSlots) && state.transactConsoleSlots.length
          ? state.transactConsoleSlots
          : [{ slotId: "listing", type: IXI_CONSOLE_SLOT_TYPES.LISTING, face: 1 }],
        { maxSlots: IXI_CONSOLE_MAX_DEPTH, faces: [2, 3, 4, 5, 6] }
      )
    : normalizedSlots(state);

  return Math.max(1, slots.length) * PANEL_WIDTH + 2;
}

export default function IXIAosNumberedObjectConsole({
  cardNumber = 7,
  object = {},
  projection = null,
  children = [],
  parentLabel = "",
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
  onOpenTransact = null,
  onSendFront = null,
  onSendBack = null,
  onCycleColor = null,
  onCycleOutline = null,
  onRailSend = null,
  armedDestination = "",
  onSendToArmedDestination = null,
  onCycleFace = null,
  renderPrimaryCard = null
}) {
  const objectId = clean(object?.objectId || object?.id?.uuid || object?.id);
  const consoleSlots = useMemo(() => normalizedSlots(ixiState), [ixiState?.consoleSlots]);
  const listingSlotIndex = consoleSlots.findIndex(slot => slot.type === IXI_CONSOLE_SLOT_TYPES.LISTING);
  const atCapacity = consoleSlots.length >= IXI_CONSOLE_MAX_DEPTH;

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
    children,
    objects: children,
    parentLabel,
    ixiState,
    onIxiStateChange,
    onSaveObject,
    onAddObject,
    onHideObject,
    onDeleteObject,
    onRecall,
    onBoard,
    onReturn,
    onExposeObject,
    onOpenConsole: openConsoleFromCard,
    onOpenTransact,
    onSendFront,
    onSendBack,
    onCycleColor,
    onCycleOutline,
    onRailSend,
    armedDestination,
    onSendToArmedDestination,
    onCycleFace,
    skinId: "v12"
  };

  function renderFace(faceNumber) {
    if (Number(faceNumber) === 1) {
      return typeof renderPrimaryCard === "function"
        ? renderPrimaryCard(shared)
        : null;
    }

    if (Number(faceNumber) === 2) {
      return <IXIAosCardIdentityFace cardNumber={cardNumber} {...shared} />;
    }

    return (
      <IXIAosGenericConfiguredFaceV12
        {...shared}
        cardNumber={cardNumber}
        faceNumber={faceNumber}
      />
    );
  }

  function renderOuterActuators(slotIndex) {
    const isFirst = slotIndex === 0;
    const isLast = slotIndex === consoleSlots.length - 1;
    return (
      <>
        {!atCapacity && isFirst ? <IXIObjectCardActuator side="left" variant="tall" label="Add console face left" title="Add console face left" onClick={event => addPanel("left", event)} /> : null}
        {!atCapacity && isLast ? <IXIObjectCardActuator side="right" variant="tall" label="Add console face right" title="Add console face right" onClick={event => addPanel("right", event)} /> : null}
      </>
    );
  }

  function renderSlot(slot, slotIndex) {
    const isListing = slot.type === IXI_CONSOLE_SLOT_TYPES.LISTING;
    const isEmpty = slot.type === IXI_CONSOLE_SLOT_TYPES.EMPTY;
    const isLeftOfPrimary = slotIndex < listingSlotIndex;

    if (isListing) {
      return (
        <section key={slot.slotId} className="aos-numbered-console-slot primary-slot">
          {renderOuterActuators(slotIndex)}
          {renderFace(1)}
          <IXIAosActionNotice variant="office" />
        </section>
      );
    }

    if (isEmpty) {
      return (
        <section key={slot.slotId} className="aos-numbered-console-slot empty-slot">
          <IXIObjectCardActuator side={isLeftOfPrimary ? "right" : "left"} variant="tall" label="Close empty console slot" title="Close empty console slot" onClick={event => removePanel(slot.slotId, event)} />
          {renderOuterActuators(slotIndex)}
          <div className="aos-numbered-face-picker">
            <strong>ADD FACE</strong>
            <span>IXI AOS CONSOLE</span>
            <div>
              {AVAILABLE_FACES.map(faceNumber => (
                <button key={faceNumber} type="button" onClick={event => assignFace(slot.slotId, faceNumber, event)}>
                  <b>F{faceNumber}</b><small>{faceNumber === 2 ? "CARD ID" : `FACE ${faceNumber}`}</small>
                </button>
              ))}
            </div>
          </div>
        </section>
      );
    }

    return (
      <section key={slot.slotId} className="aos-numbered-console-slot module-slot">
        <IXIObjectCardActuator side={isLeftOfPrimary ? "right" : "left"} variant="tall" label="Close console face" title="Close console face" onClick={event => removePanel(slot.slotId, event)} />
        {renderOuterActuators(slotIndex)}
        {renderFace(slot.face)}
        <IXIAosActionNotice variant="office" />
      </section>
    );
  }

  return (
    <IXIAosCardCommandProvider object={object} objectId={objectId} ixiState={ixiState} onIxiStateChange={onIxiStateChange} onOpenTransact={onOpenTransact}>
      <div className="aos-numbered-object-console" style={{ width: `${consoleSlots.length * PANEL_WIDTH}px` }} data-ixi-console-depth={consoleSlots.length}>
        {consoleSlots.map(renderSlot)}
        <style jsx global>{`
          .aos-numbered-object-console,.aos-numbered-object-console *{box-sizing:border-box}.aos-numbered-object-console{position:relative;display:flex;align-items:flex-start;justify-content:flex-start;gap:0;overflow:visible}.aos-numbered-console-slot{position:relative;flex:0 0 ${PANEL_WIDTH}px;width:${PANEL_WIDTH}px;height:${PANEL_HEIGHT}px;overflow:visible}.aos-numbered-console-slot.empty-slot{overflow:hidden;border:1px solid rgba(255,255,255,.08);border-radius:13px;background:linear-gradient(180deg,rgba(255,255,255,.018),transparent),#141414}.aos-numbered-face-picker{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;gap:9px}.aos-numbered-face-picker>strong{color:#ffc400;font-size:12px;font-weight:950;letter-spacing:.08em}.aos-numbered-face-picker>span{color:rgba(255,255,255,.38);font-size:6px;font-weight:900;letter-spacing:.08em}.aos-numbered-face-picker>div{width:100%;display:grid;grid-template-columns:1fr 1fr;gap:6px}.aos-numbered-face-picker button{height:54px;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:4px;padding:0 9px;border:1px solid rgba(255,255,255,.08);border-radius:6px;background:rgba(255,255,255,.025);color:rgba(255,255,255,.68);cursor:pointer}.aos-numbered-face-picker button:hover{border-color:rgba(255,196,0,.35);background:rgba(255,196,0,.06)}.aos-numbered-face-picker b{color:#ffc400;font-size:9px;font-weight:950}.aos-numbered-face-picker small{font-size:5.5px;font-weight:950;letter-spacing:.04em}
        `}</style>
      </div>
    </IXIAosCardCommandProvider>
  );
}
