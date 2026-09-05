import {
  useCallback,
  useMemo,
  useState
} from "react";

import IXIObjectCardActuator from "../../ixi-chassis/IXIObjectCardActuator";
import {
  IXI_CONSOLE_MAX_DEPTH,
  IXI_CONSOLE_SLOT_TYPES,
  normalizeConsoleSlots,
  insertConsoleSlot,
  removeConsoleSlot,
  cycleConsoleSlotFace
} from "../../ixi-chassis/IXIObjectConsoleEngine";
import {
  runIXIActionNoticeLifecycle
} from "../../ixi-object-system/IXIActionNoticeEngine";
import {
  IXIAosCardCommandProvider
} from "../card-runtime/IXIAosCardCommandContext";
import IXIAosActionNotice from "../card-runtime/modules/IXIAosActionNotice";
import IXITransactApp from "./IXITransactApp";
import IXITransactConsolePanel from "./IXITransactConsolePanel";
import { createIXITransactContext } from "./IXITransactContext";

const PANEL_WIDTH = 298;
const PANEL_HEIGHT = 471;

const TRANSACT_CONSOLE_FACES = [
  2,
  3,
  4
];

function getLifecycleCopy(moduleId = "", payload = {}) {
  const id = String(moduleId || "").trim();

  if (id === "work-order-create") {
    return {
      savingMessage: "CREATING WORK ORDER...",
      successMessage: result => {
        const number =
          payload?.workOrder?.identity?.number ||
          payload?.workOrder?.workOrderNumber ||
          payload?.workOrder?.number ||
          "";
        return number
          ? `WORK ORDER ${number} CREATED`
          : "WORK ORDER CREATED";
      },
      errorMessage: "WORK ORDER CREATE FAILED"
    };
  }

  if (id === "note-save") {
    return {
      savingMessage: "SAVING NOTE...",
      successMessage: "NOTE SAVED",
      errorMessage: "NOTE SAVE FAILED"
    };
  }

  if (id === "photo-save") {
    const count = Array.isArray(payload?.documents)
      ? payload.documents.length
      : 0;

    return {
      savingMessage: count > 1
        ? `SAVING ${count} PHOTOS...`
        : "SAVING PHOTO...",
      successMessage: count > 1
        ? `${count} PHOTOS ADDED`
        : "PHOTO ADDED",
      errorMessage: "PHOTO SAVE FAILED"
    };
  }

  return null;
}

export default function IXITransactObjectConsole({
  object = {},
  layoutObjectId = "",
  actor = {},
  entity = {},
  activeWorkOrder = null,
  activeTechWorkOrder = null,
  financialRecords = [],
  onFinancialRecordsChange = null,
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
  const objectId = String(
    object?.objectId ||
    object?.mosObjectId ||
    object?.passportId ||
    ""
  ).trim();

  const stateObjectId =
    String(layoutObjectId || objectId)
      .trim();

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

  const persistModuleOrder = useCallback((nextOrder = []) => {
    if (
      !stateObjectId ||
      typeof onIxiStateChange !==
        "function"
    ) {
      return null;
    }

    return onIxiStateChange(
      stateObjectId,
      {
        transactModuleOrder:
          nextOrder
      }
    );
  }, [
    stateObjectId,
    onIxiStateChange
  ]);

  const [slots, setSlots] = useState(() =>
    normalizeConsoleSlots(
      Array.isArray(
        ixiState?.transactConsoleSlots
      ) &&
      ixiState.transactConsoleSlots.length
        ? ixiState.transactConsoleSlots
        : [
            {
              slotId: "listing",
              type:
                IXI_CONSOLE_SLOT_TYPES
                  .LISTING,
              face: 1
            }
          ],
      {
        maxSlots:
          IXI_CONSOLE_MAX_DEPTH,
        faces:
          TRANSACT_CONSOLE_FACES
      }
    )
  );

  const listingIndex = slots.findIndex(
    slot => slot.type === IXI_CONSOLE_SLOT_TYPES.LISTING
  );
  const atCapacity = slots.length >= IXI_CONSOLE_MAX_DEPTH;

  function saveSlots(nextSlots) {
    const normalized =
      normalizeConsoleSlots(
        nextSlots,
        {
          maxSlots:
            IXI_CONSOLE_MAX_DEPTH,
          faces:
            TRANSACT_CONSOLE_FACES
        }
      );

    setSlots(normalized);

    if (
      stateObjectId &&
      typeof onIxiStateChange ===
        "function"
    ) {
      onIxiStateChange(
        stateObjectId,
        {
          transactConsoleSlots:
            normalized,
          transactConsoleDepth:
            normalized.length,
          transactConsoleOpen:
            normalized.length > 1,
          transactConsoleUpdatedAt:
            Date.now()
        }
      );
    }
  }

  function add(side) {
    saveSlots(
      insertConsoleSlot({
        slots,
        side,
        type:
          IXI_CONSOLE_SLOT_TYPES
            .MODULE,
        face: 2,
        maxSlots:
          IXI_CONSOLE_MAX_DEPTH,
        faces:
          TRANSACT_CONSOLE_FACES,
        defaultFace: 2
      })
    );
  }

  function remove(slotId) {
    saveSlots(
      removeConsoleSlot({
        slots,
        slotId,
        faces:
          TRANSACT_CONSOLE_FACES,
        defaultFace: 2
      })
    );
  }

  function cycleFace(
    slotId,
    event
  ) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    saveSlots(
      cycleConsoleSlotFace({
        slots,
        slotId,
        faces:
          TRANSACT_CONSOLE_FACES,
        defaultFace: 2
      })
    );
  }

  async function handleOpenModule(item, moduleContext, payload = {}) {
    const moduleId = String(item?.id || "").trim();
    const lifecycle = getLifecycleCopy(moduleId, payload);

    // Expense owns its own command lifecycle inside IXIExpenseCommands.
    // Other module-open actions that do not represent persistence pass through.
    if (!lifecycle || moduleId === "expense-save") {
      return onOpenModule?.(item, moduleContext, payload);
    }

    return runIXIActionNoticeLifecycle({
      objectId,
      commandId:
        payload?.commandId ||
        payload?.note?.identity?.clientRequestId ||
        payload?.photo?.identity?.clientRequestId ||
        payload?.workOrder?.identity?.workOrderId ||
        "",
      source: `ixi-transact-${moduleId}`,
      ...lifecycle,
      operation: async () => {
        return onOpenModule?.(item, moduleContext, payload);
      }
    });
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
              data-ixi-transact-console-face={
                isListing
                  ? 1
                  : slot.face
              }
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
                    activeTechWorkOrder={activeTechWorkOrder}
                    financialRecords={financialRecords}
                    onFinancialRecordsChange={onFinancialRecordsChange}
                    permissions={permissions}
                    onClose={onClose}
                    onOpenModule={handleOpenModule}
                    onSendFront={onSendFront}
                    onSendBack={onSendBack}
                    onCycleColor={onCycleColor}
                    onCycleOutline={onCycleOutline}
                    armedDestination={armedDestination}
                    onSendToArmedDestination={onSendToArmedDestination}
                    moduleOrder={ixiState?.transactModuleOrder}
                    onModuleOrderChange={persistModuleOrder}
                  />
                  <IXIAosActionNotice variant="field" />
                </>
              ) : (
                <>
                  <IXITransactConsolePanel
                    context={context}
                    face={slot.face}
                    onOpenModule={handleOpenModule}
                  />

                  <button
                    type="button"
                    className="tx-console-face-button"
                    aria-label={
                      `Change TRAN$ACT console face ${slot.face}`
                    }
                    title={
                      `TRAN$ACT face ${slot.face}`
                    }
                    onPointerDown={event => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onClick={event =>
                      cycleFace(
                        slot.slotId,
                        event
                      )
                    }
                  >
                    <span />
                  </button>
                </>
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

          .tx-console-face-button {
            position: absolute;
            left: 50%;
            bottom: 0;
            width: 36px;
            height: 7px;
            transform:
              translateX(-50%);
            padding: 0;
            border: 0;
            border-radius:
              3px 3px 1px 1px;
            background:
              rgba(255,255,255,.18);
            cursor: pointer;
            z-index: 120;
            pointer-events: auto;
            box-shadow:
              inset 0 1px 0
                rgba(255,255,255,.12),
              0 1px 3px
                rgba(0,0,0,.32);
          }

          .tx-console-face-button span {
            display: block;
            width: 20px;
            height: 2px;
            margin: 0 auto;
            border-radius: 2px;
            background:
              rgba(255,255,255,.32);
          }

          .tx-console-face-button:hover,
          .tx-console-face-button:focus-visible {
            outline: none;
            background:
              rgba(255,196,0,.95);
            box-shadow:
              0 0 8px
                rgba(255,196,0,.38);
          }

          .tx-console-face-button:hover span,
          .tx-console-face-button:focus-visible span {
            background:
              rgba(0,0,0,.62);
          }
        `}</style>
      </div>
    </IXIAosCardCommandProvider>
  );
}
