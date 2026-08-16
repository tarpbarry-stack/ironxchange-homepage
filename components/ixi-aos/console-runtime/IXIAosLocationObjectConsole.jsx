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

import {
  IXIAosCardCommandProvider
} from "../card-runtime/IXIAosCardCommandContext";

import IXIAosCard001Location from "../cards/001/IXIAosCard001Location";
import IXIAosCard002Location from "../cards/002/IXIAosCard002Location";
import IXIAosCard003Location from "../cards/003/IXIAosCard003Location";
import IXIAosLocationFace2Operations from "../cards/location/IXIAosLocationFace2Operations";
import IXIAosLocationFace3Financial from "../cards/location/IXIAosLocationFace3FinancialApp";
import IXIAosLocationFace4Obligations from "../cards/location/IXIAosLocationFace4Obligations";
import IXIAosLocationFace5Maintenance from "../cards/location/IXIAosLocationFace5Maintenance";

const PANEL_WIDTH = 298;
const PANEL_HEIGHT = 471;
const AVAILABLE_FACES = Object.freeze([2, 3, 4, 5]);

const FACE_LABELS = Object.freeze({
  2: "OPERATIONS",
  3: "FINANCIAL",
  4: "EXPENSES",
  5: "MAINTENANCE"
});

const clean = value => String(value || "").trim();

function initialSlots() {
  return [createConsoleSlot({ type: IXI_CONSOLE_SLOT_TYPES.LISTING })];
}

export default function IXIAosLocationObjectConsole({
  templateSlug = "location-standard",
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
  financialMode = "owned",
  f2skin = "v12",
  onF2SkinChange = null,
  primaryFace = 1,
  onPrimaryFaceChange = null,
  onOpenTransact = null
}) {
  const objectId = clean(object?.objectId || object?.id);

  const consoleSlots = useMemo(
    () => normalizeConsoleSlots(
      Array.isArray(ixiState?.consoleSlots) && ixiState.consoleSlots.length
        ? ixiState.consoleSlots
        : initialSlots(),
      {
        maxSlots: IXI_CONSOLE_MAX_DEPTH,
        faces: AVAILABLE_FACES
      }
    ),
    [ixiState?.consoleSlots]
  );

  const listingSlotIndex = consoleSlots.findIndex(
    slot => slot.type === IXI_CONSOLE_SLOT_TYPES.LISTING
  );
  const atCapacity = consoleSlots.length >= IXI_CONSOLE_MAX_DEPTH;

  const financialObject = {
    ...object,
    fields: {
      ...(object?.fields || {}),
      ownershipStatus: financialMode
    }
  };

  const Card =
    templateSlug === "location-standard-003"
      ? IXIAosCard003Location
      : templateSlug === "location-standard-002"
        ? IXIAosCard002Location
        : IXIAosCard001Location;

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
    saveSlots(removeConsoleSlot({
      slots: consoleSlots,
      slotId,
      faces: AVAILABLE_FACES
    }));
  }

  function assignFace(slotId, face, event) {
    stop(event);
    saveSlots(assignConsoleSlotFace({
      slots: consoleSlots,
      slotId,
      face,
      faces: AVAILABLE_FACES
    }));
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
    object: financialObject,
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
    onExposeObject
  };

  function renderFace(faceNumber) {
    const resolved = Math.min(5, Math.max(1, Number(faceNumber) || 1));

    if (resolved === 5) {
      return <IXIAosLocationFace5Maintenance {...shared} demoMode />;
    }

    if (resolved === 4) {
      return <IXIAosLocationFace4Obligations {...shared} demoMode />;
    }

    if (resolved === 3) {
      return <IXIAosLocationFace3Financial {...shared} />;
    }

    if (resolved === 2) {
      return (
        <IXIAosLocationFace2Operations
          {...shared}
          skinId={f2skin}
          onSkinChange={onF2SkinChange}
        />
      );
    }

    return <Card {...shared} />;
  }

  function renderOuterActuators(slotIndex) {
    const isFirst = slotIndex === 0;
    const isLast = slotIndex === consoleSlots.length - 1;

    return (
      <>
        {!atCapacity && isFirst ? (
          <IXIObjectCardActuator
            side="left"
            variant="tall"
            label="Add console face left"
            title="Add console face left"
            onClick={event => addPanel("left", event)}
          />
        ) : null}

        {!atCapacity && isLast ? (
          <IXIObjectCardActuator
            side="right"
            variant="tall"
            label="Add console face right"
            title="Add console face right"
            onClick={event => addPanel("right", event)}
          />
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
        <section key={slot.slotId} className="location-console-slot primary-slot">
          {renderOuterActuators(slotIndex)}
          {renderFace(primaryFace)}
        </section>
      );
    }

    if (isEmpty) {
      return (
        <section key={slot.slotId} className="location-console-slot empty-slot">
          <IXIObjectCardActuator
            side={isLeftOfPrimary ? "right" : "left"}
            variant="tall"
            label="Close empty console slot"
            title="Close empty console slot"
            onClick={event => removePanel(slot.slotId, event)}
          />

          {renderOuterActuators(slotIndex)}

          <div className="empty-face-picker">
            <strong>ADD FACE</strong>
            <span>LOCATION MANAGEMENT</span>

            <div className="face-grid">
              {AVAILABLE_FACES.map(faceNumber => (
                <button
                  key={faceNumber}
                  type="button"
                  onClick={event => assignFace(slot.slotId, faceNumber, event)}
                >
                  <b>F{faceNumber}</b>
                  <span>{FACE_LABELS[faceNumber]}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      );
    }

    return (
      <section key={slot.slotId} className="location-console-slot module-slot">
        <IXIObjectCardActuator
          side={isLeftOfPrimary ? "right" : "left"}
          variant="tall"
          label="Close console face"
          title="Close console face"
          onClick={event => removePanel(slot.slotId, event)}
        />

        {renderOuterActuators(slotIndex)}
        {renderFace(slot.face)}

        <button
          type="button"
          className="face-id"
          title={`Show F${slot.face} on primary card`}
          onClick={event => {
            stop(event);
            onPrimaryFaceChange?.(Number(slot.face));
          }}
        >
          F{slot.face}
        </button>
      </section>
    );
  }

  return (
    <IXIAosCardCommandProvider
      object={financialObject}
      objectId={objectId}
      ixiState={ixiState}
      onIxiStateChange={onIxiStateChange}
      onOpenTransact={onOpenTransact}
    >
      <div
        className="location-object-console"
        style={{ width: `${consoleSlots.length * PANEL_WIDTH}px` }}
        data-ixi-console-depth={consoleSlots.length}
      >
        {consoleSlots.map(renderSlot)}

        <style jsx global>{`
          .location-object-console,
          .location-object-console * {
            box-sizing: border-box;
          }

          .location-object-console {
            position: relative;
            display: flex;
            align-items: flex-start;
            justify-content: flex-start;
            gap: 0;
            overflow: visible;
          }

          .location-console-slot {
            position: relative;
            flex: 0 0 ${PANEL_WIDTH}px;
            width: ${PANEL_WIDTH}px;
            min-width: ${PANEL_WIDTH}px;
            max-width: ${PANEL_WIDTH}px;
            height: ${PANEL_HEIGHT}px;
            min-height: ${PANEL_HEIGHT}px;
            max-height: ${PANEL_HEIGHT}px;
            overflow: visible;
          }

          .location-console-slot.empty-slot {
            overflow: hidden;
            border: 1px solid rgba(255,255,255,.08);
            border-radius: 13px;
            background: linear-gradient(180deg,rgba(255,255,255,.018),transparent),#141414;
          }

          .empty-face-picker {
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 24px;
            gap: 8px;
          }

          .empty-face-picker > strong {
            color: #ffc400;
            font-size: 12px;
            font-weight: 950;
            letter-spacing: .08em;
          }

          .empty-face-picker > span {
            margin-bottom: 8px;
            color: rgba(255,255,255,.34);
            font-size: 6px;
            font-weight: 900;
            letter-spacing: .08em;
          }

          .face-grid {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
          }

          .face-grid button {
            height: 54px;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            justify-content: center;
            gap: 4px;
            padding: 0 9px;
            border: 1px solid rgba(255,255,255,.08);
            border-radius: 6px;
            background: rgba(255,255,255,.025);
            color: rgba(255,255,255,.68);
            cursor: pointer;
          }

          .face-grid button:hover {
            border-color: rgba(255,196,0,.35);
            background: rgba(255,196,0,.06);
          }

          .face-grid b {
            color: #ffc400;
            font-size: 9px;
            font-weight: 950;
          }

          .face-grid span {
            font-size: 5.5px;
            font-weight: 950;
            letter-spacing: .04em;
          }

          .face-id {
            position: absolute;
            left: 50%;
            bottom: -1px;
            width: 34px;
            height: 7px;
            transform: translateX(-50%);
            padding: 0;
            border: 0;
            border-radius: 3px 3px 1px 1px;
            background: rgba(255,196,0,.92);
            color: #080808;
            font-size: 4.5px;
            font-weight: 950;
            cursor: pointer;
            z-index: 180;
          }
        `}</style>
      </div>
    </IXIAosCardCommandProvider>
  );
}
