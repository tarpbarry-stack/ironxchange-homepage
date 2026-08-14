import IXIScaledCardShell
  from "../../ixi-machine-object/IXIScaledCardShell";

import IXIObjectCardActuator
  from "../../ixi-chassis/IXIObjectCardActuator";

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
} from "../../ixi-chassis/IXIObjectConsoleEngine";


const SYSTEM_INDEX_NATIVE_PANEL_WIDTH =
  298;

const SYSTEM_INDEX_NATIVE_HEIGHT =
  471;

/*
 * COPY THE WORKING PRIVATE CONSOLE:
 * its panels meet edge-to-edge.
 */
const SYSTEM_INDEX_SEAM_OVERLAP =
  0;


/* =========================================================
   LEGACY STATE → CURRENT SLOT MODEL

   This is copied directly from the working Private console
   architecture.

   Face 1 is the permanent System Index card.
   Module faces can exist to its left and/or right.
   ========================================================= */

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


/* =========================================================
   SYSTEM INDEX CONSOLE
   ========================================================= */

export default function IXISystemIndexConsole({
  objectId,
  index,

  ixiCardState = {},
  updateIxiCardState,

  enableCardScaling = false,
  cardScaleMode = "xl",

  renderSystemIndexCard
}) {
  const id =
    String(
      objectId || ""
    );

  const objectState =
    ixiCardState?.[id] || {};


  /* =======================================================
     SAME SLOT RESOLUTION AS PRIVATE CONSOLE
     ======================================================= */

  const hasSavedSlotModel =
    Array.isArray(
      objectState.consoleSlots
    ) &&
    objectState.consoleSlots.length >
      0;

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


  /*
   * EXACT SAME PHYSICAL WIDTH FORMULA
   * AS THE WORKING PRIVATE CONSOLE.
   */
  const consoleNativeWidth =
    (
      consoleDepth *
      SYSTEM_INDEX_NATIVE_PANEL_WIDTH
    ) -
    (
      Math.max(
        consoleDepth - 1,
        0
      ) *
      SYSTEM_INDEX_SEAM_OVERLAP
    );


  /* =======================================================
     STATE
     ======================================================= */

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


  /* =======================================================
     ADD MODULE

     COPIED FROM PRIVATE CONSOLE.
     ======================================================= */

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


  /* =======================================================
     OPEN FROM ⋮ MENU

     First console module opens RIGHT.
     ======================================================= */

  function openConsole(
    event
  ) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (
      consoleDepth > 1 ||
      atCapacity
    ) {
      return;
    }

    addConsoleModule(
      "right",
      event
    );
  }


  /* =======================================================
     REMOVE MODULE
     ======================================================= */

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


  /* =======================================================
     CYCLE MODULE FACE
     ======================================================= */

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


  /* =======================================================
     MODULE FACE

     This is the ONLY System Index-specific face rendering
     in the copied console architecture.
     ======================================================= */

  function renderSystemIndexModule(
    slot
  ) {
    const face =
      Number(
        slot?.face
      ) || 2;

    return (
      <div className="system-index-module-face">

        <div className="system-index-module-header">

          <div className="system-index-module-heading">
            <span>
              SYSTEM INDEX
            </span>

            <h3>
              {index?.displayName ||
                index?.label ||
                "INDEX"}
            </h3>
          </div>

          <div className="system-index-module-number">
            FACE {face}
          </div>

        </div>


        <div className="system-index-module-workspace">

          <div className="system-index-module-empty">
            <span>
              EMPTY FACE
            </span>

            <strong>
              + MODULE
            </strong>
          </div>

        </div>

      </div>
    );
  }


  /* =======================================================
     MODULE SLOT

     DIRECT COPY OF PRIVATE CONSOLE STRUCTURE.
     ======================================================= */

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
        key={
          slot.slotId
        }
        className="
          ixi-system-index-console-slot
          ixi-system-index-console-module-slot
        "
      >
        <div className="ixi-system-index-console-module-card">

          <IXIObjectCardActuator
            side={
              closeActuatorSide
            }

            variant="tall"

            label="Close System Index module"
            title="Close System Index module"

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

              label="Add System Index module left"
              title="Add System Index module left"

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

              label="Add System Index module right"
              title="Add System Index module right"

              onClick={event =>
                addConsoleModule(
                  "right",
                  event
                )
              }
            />
          ) : null}


          {renderSystemIndexModule(
            slot
          )}


          <button
            type="button"

            className="
              ixi-system-index-console-face-button
            "

            aria-label={
              `Change System Index face ${slot.face}`
            }

            title={
              `System Index face ${slot.face}`
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


  /* =======================================================
     FACE 1 / SYSTEM INDEX SLOT

     DIRECT COPY OF PRIVATE CONSOLE LISTING SLOT BEHAVIOR.
     ======================================================= */

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

  const parentCard =
    typeof renderSystemIndexCard ===
    "function"
      ? renderSystemIndexCard({
          consoleDepth,

          onOpenConsole:
            openConsole
        })
      : null;

  return (
    <div
      key={
        slot.slotId
      }

      className="
        ixi-system-index-console-slot
        ixi-system-index-console-listing-slot
      "
    >

      {canExpandLeft ? (
        <IXIObjectCardActuator
          side="left"

          variant="tall"

          label="Add System Index module left"
          title="Add System Index module left"

          onClick={event =>
            addConsoleModule(
              "left",
              event
            )
          }
        />
      ) : null}


      {parentCard}


      {canExpandRight ? (
        <IXIObjectCardActuator
          side="right"

          variant="tall"

          label="Add System Index module right"
          title="Add System Index module right"

          onClick={event =>
            addConsoleModule(
              "right",
              event
            )
          }
        />
      ) : null}

    </div>
  );
}


  /* =======================================================
     ASSEMBLED CONSOLE

     THIS IS THE SAME STRUCTURE AS PRIVATE.
     ======================================================= */

  const assembledConsole = (
    <div
      className="
        ixi-system-index-object-console
      "

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

        /* ===============================================
           EXACT PRIVATE-CONSOLE PHYSICS
           =============================================== */

        .ixi-system-index-object-console {
          position: relative;

          display: flex;
          flex-direction: row;
          align-items: flex-start;

          gap: 0;

          overflow: visible;
        }


        .ixi-system-index-console-slot {
          position: relative;

          flex:
            0 0
            ${SYSTEM_INDEX_NATIVE_PANEL_WIDTH}px;

          width:
            ${SYSTEM_INDEX_NATIVE_PANEL_WIDTH}px;

          min-width:
            ${SYSTEM_INDEX_NATIVE_PANEL_WIDTH}px;

          max-width:
            ${SYSTEM_INDEX_NATIVE_PANEL_WIDTH}px;

          height:
            ${SYSTEM_INDEX_NATIVE_HEIGHT}px;

          min-height:
            ${SYSTEM_INDEX_NATIVE_HEIGHT}px;

          max-height:
            ${SYSTEM_INDEX_NATIVE_HEIGHT}px;

          overflow: visible;
        }


        .ixi-system-index-console-slot +
        .ixi-system-index-console-slot {
          margin-left:
            -${SYSTEM_INDEX_SEAM_OVERLAP}px;
        }


        .ixi-system-index-console-listing-slot {
          z-index: 5;
        }


        .ixi-system-index-console-module-slot {
          z-index: 4;
        }


        /* ===============================================
           MODULE CARD
           =============================================== */

        .ixi-system-index-console-module-card {
          box-sizing: border-box;

          position: relative;

          width:
            ${SYSTEM_INDEX_NATIVE_PANEL_WIDTH}px;

          min-width:
            ${SYSTEM_INDEX_NATIVE_PANEL_WIDTH}px;

          max-width:
            ${SYSTEM_INDEX_NATIVE_PANEL_WIDTH}px;

          height:
            ${SYSTEM_INDEX_NATIVE_HEIGHT}px;

          min-height:
            ${SYSTEM_INDEX_NATIVE_HEIGHT}px;

          max-height:
            ${SYSTEM_INDEX_NATIVE_HEIGHT}px;

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


        /* ===============================================
           MODULE FACE
           =============================================== */

        .system-index-module-face,
        .system-index-module-face * {
          box-sizing:
            border-box;
        }


        .system-index-module-face {
          position:
            absolute;

          inset:
            0;

          padding:
            12px 12px 16px;

          overflow:
            hidden;
        }


        .system-index-module-header {
          height:
            38px;

          display:
            flex;

          align-items:
            flex-start;

          justify-content:
            space-between;

          gap:
            8px;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .045
            );
        }


        .system-index-module-heading {
          min-width:
            0;

          flex:
            1 1 auto;
        }


        .system-index-module-heading span {
          display:
            block;

          color:
            #ffc400;

          font-size:
            6.5px;

          font-weight:
            950;

          letter-spacing:
            .09em;

          text-transform:
            uppercase;
        }


        .system-index-module-heading h3 {
          margin:
            4px 0 0;

          overflow:
            hidden;

          color:
            #f4f4f4;

          font-size:
            17px;

          font-weight:
            950;

          line-height:
            1;

          text-overflow:
            ellipsis;

          text-transform:
            uppercase;

          white-space:
            nowrap;
        }


        .system-index-module-number {
          flex:
            0 0 auto;

          padding-top:
            2px;

          color:
            rgba(
              255,
              255,
              255,
              .32
            );

          font-size:
            8px;

          font-weight:
            950;

          letter-spacing:
            .08em;
        }


        .system-index-module-workspace {
          position:
            absolute;

          left:
            12px;

          right:
            12px;

          top:
            58px;

          bottom:
            28px;
        }


        .system-index-module-empty {
          width:
            100%;

          height:
            100%;

          display:
            flex;

          flex-direction:
            column;

          align-items:
            center;

          justify-content:
            center;

          gap:
            8px;

          border:
            1px dashed
            rgba(
              255,
              255,
              255,
              .08
            );

          border-radius:
            8px;

          background:
            rgba(
              255,
              255,
              255,
              .012
            );
        }


        .system-index-module-empty span {
          color:
            rgba(
              255,
              255,
              255,
              .20
            );

          font-size:
            9px;

          font-weight:
            950;

          letter-spacing:
            .09em;
        }


        .system-index-module-empty strong {
          color:
            rgba(
              0,
              194,
              255,
              .72
            );

          font-size:
            10px;

          font-weight:
            950;
        }


        /* ===============================================
           FACE CYCLE ACTUATOR

           Same physical control as Private console.
           =============================================== */

        .ixi-system-index-console-face-button {
          position:
            absolute;

          left:
            50%;

          right:
            auto;

          bottom:
            -1px;

          width:
            34px;

          height:
            5px;

          transform:
            translateX(-50%);

          padding:
            0;

          border:
            0;

          border-radius:
            3px 3px 1px 1px;

          background:
            rgba(
              255,
              255,
              255,
              .18
            );

          cursor:
            pointer;

          z-index:
            120;

          pointer-events:
            auto;

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


        .ixi-system-index-console-face-button:hover {
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


  /* =======================================================
     SAME SCALING RETURN AS PRIVATE CONSOLE
     ======================================================= */

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
        SYSTEM_INDEX_NATIVE_HEIGHT
      }
    >
      {assembledConsole}
    </IXIScaledCardShell>
  ) : (
    assembledConsole
  );
}


/* =========================================================
   OPTIONAL GEOMETRY EXPORTS
   ========================================================= */

export function getSystemIndexConsoleNativeWidth({
  objectId,
  ixiCardState = {}
}) {
  const id =
    String(
      objectId || ""
    );

  const objectState =
    ixiCardState?.[id] || {};

  const hasSavedSlotModel =
    Array.isArray(
      objectState.consoleSlots
    ) &&
    objectState.consoleSlots.length >
      0;

  const consoleSlots =
    hasSavedSlotModel
      ? normalizeConsoleSlots(
          objectState.consoleSlots
        )
      : getLegacyConsoleSlots(
          objectState
        );

  return (
    (
      consoleSlots.length *
      SYSTEM_INDEX_NATIVE_PANEL_WIDTH
    ) -
    (
      Math.max(
        consoleSlots.length - 1,
        0
      ) *
      SYSTEM_INDEX_SEAM_OVERLAP
    )
  );
}


export function getSystemIndexConsoleNativeHeight() {
  return SYSTEM_INDEX_NATIVE_HEIGHT;
}
