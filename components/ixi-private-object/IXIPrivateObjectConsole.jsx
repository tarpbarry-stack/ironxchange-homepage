import IXIScaledCardShell
  from "../ixi-machine-object/IXIScaledCardShell";

import IXIObjectCardActuator
  from "../ixi-chassis/IXIObjectCardActuator";

import {
  renderPrivatePanel
} from "./IXIPrivateConsolePanels";

import {
  IXI_CONSOLE_MAX_DEPTH,
  IXI_CONSOLE_SLOT_TYPES,
  createConsoleSlot,
  normalizeConsoleSlots,
  insertConsoleSlot,
  removeConsoleSlot,
  cycleConsoleSlotFace,
  getNextConsoleDefaultFace,
  createConsoleSlotsPatch
} from "../ixi-chassis/IXIObjectConsoleEngine";

const PRIVATE_NATIVE_PANEL_WIDTH =
  300;

const PRIVATE_NATIVE_HEIGHT =
  475;

const PRIVATE_SEAM_OVERLAP =
  0;

function getLegacyConsoleSlots(
  objectState = {}
) {
  const slots = [];

  if (
    objectState.consoleLeftOpen ===
    true
  ) {
    slots.push(
      createConsoleSlot({
        type:
          IXI_CONSOLE_SLOT_TYPES
            .MODULE,

        face:
          objectState
            .consoleLeftFace || 2
      })
    );
  }

  slots.push(
    createConsoleSlot({
      type:
        IXI_CONSOLE_SLOT_TYPES
          .LISTING
    })
  );

  if (
    objectState.consoleRightOpen ===
    true
  ) {
    slots.push(
      createConsoleSlot({
        type:
          IXI_CONSOLE_SLOT_TYPES
            .MODULE,

        face:
          objectState
            .consoleRightFace || 3
      })
    );
  }

  return normalizeConsoleSlots(
    slots
  );
}

export default function IXIPrivateObjectConsole({
  objectId,
  item,

  sellerCardProps = {},

  ixiCardState = {},
  updateIxiCardState,

  enableCardScaling = false,
  cardScaleMode = "xl",

  dragHandleProps,

  renderParentCard
}) {
  const id =
    String(objectId || "");

  const objectState =
    ixiCardState?.[id] || {};

  const hasSavedSlotModel =
    Array.isArray(
      objectState.consoleSlots
    ) &&
    objectState.consoleSlots.length > 0;

  const consoleSlots =
    hasSavedSlotModel
      ? normalizeConsoleSlots(
          objectState.consoleSlots
        )
      : getLegacyConsoleSlots(
          objectState
        );

  const consoleDepth =
    consoleSlots.length;

  const listingSlotIndex =
    consoleSlots.findIndex(
      slot =>
        slot.type ===
        IXI_CONSOLE_SLOT_TYPES
          .LISTING
    );

  const consoleLeftOpen =
    listingSlotIndex > 0;

  const consoleRightOpen =
    listingSlotIndex <
    consoleSlots.length - 1;

  const atCapacity =
    consoleDepth >=
    IXI_CONSOLE_MAX_DEPTH;

  const consoleNativeWidth =
    (
      consoleDepth *
      PRIVATE_NATIVE_PANEL_WIDTH
    ) -
    (
      Math.max(
        consoleDepth - 1,
        0
      ) *
      PRIVATE_SEAM_OVERLAP
    );

  function patchObjectState(
    patch = {}
  ) {
    if (!id) {
      return;
    }

    updateIxiCardState?.(
      id,
      {
        ...patch,

        consoleUpdatedAt:
          Date.now()
      }
    );
  }

  function saveConsoleSlots(
    nextSlots
  ) {
    patchObjectState(
      createConsoleSlotsPatch(
        nextSlots
      )
    );
  }

  function addConsoleModule(
    side,
    event
  ) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (atCapacity) {
      return;
    }

    const face =
      getNextConsoleDefaultFace(
        consoleSlots
      );

    const nextSlots =
      insertConsoleSlot({
        slots:
          consoleSlots,

        side,

        face,

        maxSlots:
          IXI_CONSOLE_MAX_DEPTH
      });

    saveConsoleSlots(
      nextSlots
    );
  }

  function removeConsoleModule(
    slotId,
    event
  ) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    const nextSlots =
      removeConsoleSlot({
        slots:
          consoleSlots,

        slotId
      });

    saveConsoleSlots(
      nextSlots
    );
  }

  function cycleModuleFace(
    slotId,
    event
  ) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    const nextSlots =
      cycleConsoleSlotFace({
        slots:
          consoleSlots,

        slotId
      });

    saveConsoleSlots(
      nextSlots
    );
  }

  function renderModuleSlot(
    slot,
    slotIndex
  ) {
    const isLeftOfListing =
      slotIndex <
      listingSlotIndex;

    const closeActuatorSide =
      isLeftOfListing
        ? "right"
        : "left";

    const isFirstSlot =
      slotIndex === 0;

    const isLastSlot =
      slotIndex ===
      consoleSlots.length - 1;

    const showLeftExpansion =
      !atCapacity &&
      isFirstSlot;

    const showRightExpansion =
      !atCapacity &&
      isLastSlot;

    return (
      <div
        key={slot.slotId}

        className={`
          ixi-private-console-slot
          ixi-private-console-module-slot
        `}
      >
        <div className="ixi-private-console-module-card">
         <IXIObjectCardActuator
  side={
    closeActuatorSide
  }

  variant="tall"

  label="Close private module"

  title="Close private module"

  onClick={event =>
    removeConsoleModule(
      slot.slotId,
      event
    )
  }
/>
          
          {showLeftExpansion ? (
            <IXIObjectCardActuator
  side="left"

  variant="tall"

  label="Add private module left"

  title="Add private module left"

  onClick={event =>
    addConsoleModule(
      "left",
      event
    )
  }
/>
          ) : null}

          {showRightExpansion ? (
            <IXIObjectCardActuator
  side="right"

  variant="tall"

  label="Add private module right"

  title="Add private module right"

  onClick={event =>
    addConsoleModule(
      "right",
      event
    )
  }
/>
          ) : null}

          {renderPrivatePanel({
            face:
              slot.face,

            listing:
              item,

            dragHandleProps,

            sellerCardProps,

            sourceListingUrl:
              sellerCardProps
                .sourceListingUrl ||
              "",

            priceValue:
              sellerCardProps
                .priceValue,

            onPriceChange:
              sellerCardProps
                .onPriceChange,

            onPriceKeyDown:
              sellerCardProps
                .onPriceKeyDown,

            savingPrice:
              sellerCardProps
                .savingPrice,

            hoursValue:
              sellerCardProps
                .hoursValue,

            onHoursChange:
              sellerCardProps
                .onHoursChange,

            onHoursKeyDown:
              sellerCardProps
                .onHoursKeyDown,

            descriptionValue:
              sellerCardProps
                .descriptionValue,

            onDescriptionChange:
              sellerCardProps
                .onDescriptionChange,

            onDescriptionKeyDown:
              sellerCardProps
                .onDescriptionKeyDown,

            savingDescription:
              sellerCardProps
                .savingDescription,

            locationValue:
              sellerCardProps
                .locationValue,

            onLocationChange:
              sellerCardProps
                .onLocationChange,

            onLocationKeyDown:
              sellerCardProps
                .onLocationKeyDown,

            machineAccess:
              sellerCardProps
                .machineAccess,

            machineChannel:
              sellerCardProps
                .machineChannel,

            machinePlacementBusy:
              sellerCardProps
                .machinePlacementBusy,

            onMachinePlacementChange:
              sellerCardProps
                .onMachinePlacementChange,

            isPaused:
              sellerCardProps
                .isPaused,

            onEdit:
              sellerCardProps
                .onEdit,

            onPause:
              sellerCardProps
                .onPause,

            onReactivate:
              sellerCardProps
                .onReactivate,

            onDelete:
              sellerCardProps
                .onDelete
          })}

          <button
            type="button"

            className={`
              ixi-private-console-face-button
            `}

            aria-label={
              `Change private face ${slot.face}`
            }

            title={
              `Private face ${slot.face}`
            }

            onPointerDown={event => {
              event.preventDefault();
              event.stopPropagation();
            }}

            onClick={event =>
              cycleModuleFace(
                slot.slotId,
                event
              )
            }
          />
        </div>
      </div>
    );
  }

  function renderListingSlot(
    slot,
    slotIndex
  ) {
    const isFirstSlot =
      slotIndex === 0;

    const isLastSlot =
      slotIndex ===
      consoleSlots.length - 1;

    const canExpandLeft =
      !atCapacity &&
      isFirstSlot;

    const canExpandRight =
      !atCapacity &&
      isLastSlot;

    /*
     * When the console reaches capacity,
     * both parent expansion actuators must
     * disappear regardless of the Listing
     * Card's current slot position.
     */
    const parentConsoleLeftOpen =
      consoleLeftOpen ||
      atCapacity;

    const parentConsoleRightOpen =
      consoleRightOpen ||
      atCapacity;

    const parentCard =
      typeof renderParentCard ===
      "function"
        ? renderParentCard({
            consoleDepth,

            consoleLeftOpen:
              parentConsoleLeftOpen,

            consoleRightOpen:
              parentConsoleRightOpen,

            onExpandConsoleLeft:
              canExpandLeft
                ? event =>
                    addConsoleModule(
                      "left",
                      event
                    )
                : undefined,

            onExpandConsoleRight:
              canExpandRight
                ? event =>
                    addConsoleModule(
                      "right",
                      event
                    )
                : undefined
          })
        : null;

    return (
      <div
        key={slot.slotId}

        className={`
          ixi-private-console-slot
          ixi-private-console-listing-slot
        `}
      >
        {parentCard}
      </div>
    );
  }

  const assembledConsole = (
    <div
      className={`
        ixi-private-object-console
      `}

      style={{
        width:
          `${consoleNativeWidth}px`
      }}

      data-console-depth={
        consoleDepth
      }

      data-console-capacity={
        atCapacity
          ? "full"
          : "available"
      }
    >
      {consoleSlots.map(
        (
          slot,
          slotIndex
        ) => {
          if (
            slot.type ===
            IXI_CONSOLE_SLOT_TYPES
              .LISTING
          ) {
            return renderListingSlot(
              slot,
              slotIndex
            );
          }

          return renderModuleSlot(
            slot,
            slotIndex
          );
        }
      )}

      <style jsx global>{`
        .ixi-private-object-console {
          position: relative;

          display: flex;
          flex-direction: row;
          align-items: flex-start;

          gap: 0;

          overflow: visible;
        }

        .ixi-private-console-slot {
          position: relative;

          flex:
            0 0
            ${PRIVATE_NATIVE_PANEL_WIDTH}px;

          width:
            ${PRIVATE_NATIVE_PANEL_WIDTH}px;

          min-width:
            ${PRIVATE_NATIVE_PANEL_WIDTH}px;

          max-width:
            ${PRIVATE_NATIVE_PANEL_WIDTH}px;

          height:
            ${PRIVATE_NATIVE_HEIGHT}px;

          min-height:
            ${PRIVATE_NATIVE_HEIGHT}px;

          max-height:
            ${PRIVATE_NATIVE_HEIGHT}px;

          overflow: visible;
        }

        .ixi-private-console-slot +
        .ixi-private-console-slot {
          margin-left:
            -${PRIVATE_SEAM_OVERLAP}px;
        }

        .ixi-private-console-listing-slot {
          z-index: 5;
        }

        .ixi-private-console-module-slot {
          z-index: 4;
        }

        .ixi-private-console-module-card {
          box-sizing: border-box;

          position: relative;

          width:
            ${PRIVATE_NATIVE_PANEL_WIDTH}px;

          min-width:
            ${PRIVATE_NATIVE_PANEL_WIDTH}px;

          max-width:
            ${PRIVATE_NATIVE_PANEL_WIDTH}px;

          height:
            ${PRIVATE_NATIVE_HEIGHT}px;

          min-height:
            ${PRIVATE_NATIVE_HEIGHT}px;

          max-height:
            ${PRIVATE_NATIVE_HEIGHT}px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .10
            );

          border-radius:
            13px;

          background:
            linear-gradient(
              180deg,
              rgba(
                28,
                31,
                36,
                .98
              ),
              rgba(
                15,
                17,
                20,
                .98
              )
            );

          box-shadow:
            0 10px 28px
              rgba(
                0,
                0,
                0,
                .34
              ),
            inset 0 1px 0
              rgba(
                255,
                255,
                255,
                .04
              );

          overflow: visible;
        }

        .ixi-private-console-face-button {
          position: absolute;

          left: 50%;
          right: auto;
          bottom: -1px;

          width: 34px;
          height: 5px;

          transform:
            translateX(-50%);

          padding: 0;
          border: 0;

          border-radius:
            3px 3px 1px 1px;

          background:
            rgba(
              255,
              255,
              255,
              .18
            );

          cursor: pointer;

          z-index: 120;
          pointer-events: auto;

          box-shadow:
            inset 0 1px 0
              rgba(
                255,
                255,
                255,
                .12
              ),
            0 1px 3px
              rgba(
                0,
                0,
                0,
                .32
              );
        }

        .ixi-private-console-face-button:hover {
          background:
            rgba(
              255,
              196,
              0,
              .95
            );

          box-shadow:
            0 0 8px
              rgba(
                255,
                196,
                0,
                .38
              );
        }
      `}</style>
    </div>
  );

  return enableCardScaling ? (
    <IXIScaledCardShell
      size={
        cardScaleMode
      }

      objectFamily="private"

      nativeWidth={
        consoleNativeWidth
      }

      nativeHeight={
        PRIVATE_NATIVE_HEIGHT
      }
    >
      {assembledConsole}
    </IXIScaledCardShell>
  ) : (
    assembledConsole
  );
}
