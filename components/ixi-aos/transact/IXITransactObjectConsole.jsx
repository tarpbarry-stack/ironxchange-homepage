import {
  useMemo,
  useState
} from "react";

import IXIObjectCardActuator from "../../ixi-chassis/IXIObjectCardActuator";
import {
  IXI_CONSOLE_MAX_DEPTH,
  IXI_CONSOLE_SLOT_TYPES,
  normalizeConsoleSlots,
  insertConsoleSlot,
  removeConsoleSlot
} from "../../ixi-chassis/IXIObjectConsoleEngine";
import {
  IXIAosCardCommandProvider
} from "../card-runtime/IXIAosCardCommandContext";
import IXIAosActionNotice from "../card-runtime/modules/IXIAosActionNotice";
import IXITransactApp from "./IXITransactApp";
import IXITransactConsolePanel from "./IXITransactConsolePanel";
import { createIXITransactContext } from "./IXITransactContext";

const PANEL_WIDTH = 298;
const PANEL_HEIGHT = 471;

export default function IXITransactObjectConsole({
  object = {},
  actor = {},
  entity = {},
  activeWorkOrder = null,
  permissions = [],
  ixiState = {},
  onIxiStateChange = null,
  onClose = null,
  onOpenModule = null,
  onSendFront = null,
  onSendBack = null,
  onCycleColor = null,
  onCycleOutline = null,
  armedDestination = "",
  onSendToArmedDestination = null
}) {
  const objectId = String(object?.objectId || object?.id || "").trim();

  const context = useMemo(
    () => createIXITransactContext({
      object,
      actor,
      entity,
      activeWorkOrder,
      permissions
    }),
    [object, actor, entity, activeWorkOrder, permissions]
  );

  const [slots, setSlots] = useState(() =>
    normalizeConsoleSlots(
      [{ slotId: "listing", type: IXI_CONSOLE_SLOT_TYPES.LISTING, face: 1 }],
      {
        maxSlots: IXI_CONSOLE_MAX_DEPTH,
        faces: [2]
      }
    )
  );

  const listingIndex = slots.findIndex(
    slot => slot.type === IXI_CONSOLE_SLOT_TYPES.LISTING
  );
  const atCapacity = slots.length >= IXI_CONSOLE_MAX_DEPTH;

  function add(side) {
    setSlots(current => insertConsoleSlot({
      slots: current,
      side,
      type: IXI_CONSOLE_SLOT_TYPES.MODULE,
      face: 2,
      maxSlots: IXI_CONSOLE_MAX_DEPTH,
      faces: [2],
      defaultFace: 2
    }));
  }

  function remove(slotId) {
    setSlots(current => removeConsoleSlot({
      slots: current,
      slotId,
      faces: [2],
      defaultFace: 2
    }));
  }

  return (
    <IXIAosCardCommandProvider
      object={object}
      objectId={objectId}
      ixiState={ixiState}
      onIxiStateChange={onIxiStateChange}
    >
      <div
        className="tx-console"
        style={{ width: `${slots.length * PANEL_WIDTH}px` }}
        data-ixi-transact-console-depth={slots.length}
      >
        {slots.map((slot, index) => {
          const isListing = slot.type === IXI_CONSOLE_SLOT_TYPES.LISTING;
          const first = index === 0;
          const last = index === slots.length - 1;
          const leftOfPrimary = index < listingIndex;

          return (
            <section
              key={slot.slotId}
              className={`tx-slot ${isListing ? "primary" : "module"}`}
            >
              {!atCapacity && first ? (
                <IXIObjectCardActuator
                  side="left"
                  variant="tall"
                  label="Add TRAN$ACT module left"
                  title="Add TRAN$ACT module left"
                  onClick={() => add("left")}
                />
              ) : null}

              {!atCapacity && last ? (
                <IXIObjectCardActuator
                  side="right"
                  variant="tall"
                  label="Add TRAN$ACT module right"
                  title="Add TRAN$ACT module right"
                  onClick={() => add("right")}
                />
              ) : null}

              {!isListing ? (
                <IXIObjectCardActuator
                  side={leftOfPrimary ? "right" : "left"}
                  variant="tall"
                  label="Close TRAN$ACT module"
                  title="Close TRAN$ACT module"
                  onClick={() => remove(slot.slotId)}
                />
              ) : null}

              {isListing ? (
                <>
                  <IXITransactApp
                    object={object}
                    actor={actor}
                    entity={entity}
                    activeWorkOrder={activeWorkOrder}
                    permissions={permissions}
                    onClose={onClose}
                    onOpenModule={onOpenModule}
                    onSendFront={onSendFront}
                    onSendBack={onSendBack}
                    onCycleColor={onCycleColor}
                    onCycleOutline={onCycleOutline}
                    armedDestination={armedDestination}
                    onSendToArmedDestination={onSendToArmedDestination}
                  />
                  <IXIAosActionNotice variant="field" />
                </>
              ) : (
                <IXITransactConsolePanel
                  context={context}
                  onOpenModule={onOpenModule}
                />
              )}
            </section>
          );
        })}

        <style jsx>{`
          .tx-console {
            position: relative;
            display: flex;
            align-items: flex-start;
            gap: 0;
            height: ${PANEL_HEIGHT}px;
            overflow: visible;
          }

          .tx-slot {
            position: relative;
            flex: 0 0 ${PANEL_WIDTH}px;
            width: ${PANEL_WIDTH}px;
            height: ${PANEL_HEIGHT}px;
            overflow: visible;
          }
        `}</style>
      </div>
    </IXIAosCardCommandProvider>
  );
}
