import IXIObjectConsoleShell
  from "../../ixi-chassis/IXIObjectConsoleShell";

import {
  IXI_CONSOLE_MAX_DEPTH,
  IXI_CONSOLE_SLOT_TYPES,
  IXI_CONSOLE_MODULE_FACES,

  getConsoleSlots,
  createConsoleSlot,
  removeConsoleSlot,
  cycleConsoleSlotFace,
  createConsoleSlotsPatch
} from "../../ixi-chassis/IXIObjectConsoleEngine";

const PANEL_WIDTH = 298;
const PANEL_OVERLAP = 1;
const PANEL_GAP = -PANEL_OVERLAP;
const NATIVE_HEIGHT = 471;


/* =========================================================
   IXI AOS
   SYSTEM INDEX SMART CONTAINER CONSOLE

   PURPOSE

   This component owns ONLY the System Index console
   presentation shell.

   It does NOT own:
   - canonical object data
   - containment
   - relationships
   - workspace placement
   - business nomenclature
   - card data
   - module calculations

   Console slot/depth state remains in ixiCardState through
   the existing IXI console-state contract.
   ========================================================= */


function getNextModuleFace(
  slots = []
) {
  const moduleCount =
    slots.filter(
      slot =>
        slot?.type ===
        IXI_CONSOLE_SLOT_TYPES.MODULE
    ).length;

  return (
    IXI_CONSOLE_MODULE_FACES[
      moduleCount %
      IXI_CONSOLE_MODULE_FACES.length
    ] ||
    IXI_CONSOLE_MODULE_FACES[0] ||
    2
  );
}


function insertModuleSlotAfter({
  slots = [],
  afterSlotId
}) {
  if (
    !Array.isArray(slots) ||
    slots.length >=
      IXI_CONSOLE_MAX_DEPTH
  ) {
    return slots;
  }

  const nextSlot =
    createConsoleSlot({
      type:
        IXI_CONSOLE_SLOT_TYPES.MODULE,

      face:
        getNextModuleFace(
          slots
        )
    });

  const targetIndex =
    slots.findIndex(
      slot =>
        String(
          slot?.slotId || ""
        ) ===
        String(
          afterSlotId || ""
        )
    );

  const insertIndex =
    targetIndex >= 0
      ? targetIndex + 1
      : slots.length;

  const next = [
    ...slots
  ];

  next.splice(
    insertIndex,
    0,
    nextSlot
  );

  return next.slice(
    0,
    IXI_CONSOLE_MAX_DEPTH
  );
}


export default function IXISystemIndexConsole({
  objectId,
  index,

  ixiCardState = {},
  updateIxiCardState,

  renderSystemIndexCard
}) {
  const id =
    String(
      objectId || ""
    ).trim();


  const slots =
    getConsoleSlots(
      ixiCardState,
      id,
      {
        maxSlots:
          IXI_CONSOLE_MAX_DEPTH
      }
    );


  function saveSlots(
    nextSlots
  ) {
    if (!id) {
      return;
    }

    updateIxiCardState?.(
      id,
      createConsoleSlotsPatch(
        nextSlots,
        {
          maxSlots:
            IXI_CONSOLE_MAX_DEPTH
        }
      )
    );
  }


  /*
   * OPEN CONSOLE
   *
   * The permanent Listing/System Index slot is slot 1.
   * Opening the console means adding one module Face beside
   * it if no second slot exists yet.
   */
  function openConsole(
    event
  ) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (
      slots.length > 1
    ) {
      return;
    }

    const listingSlot =
      slots.find(
        slot =>
          slot?.type ===
          IXI_CONSOLE_SLOT_TYPES.LISTING
      ) ||
      slots[0];

    const nextSlots =
      insertModuleSlotAfter({
        slots,

        afterSlotId:
          listingSlot?.slotId
      });

    saveSlots(
      nextSlots
    );
  }


  function insertAfter(
    slotId
  ) {
    const nextSlots =
      insertModuleSlotAfter({
        slots,
        afterSlotId:
          slotId
      });

    saveSlots(
      nextSlots
    );
  }


  function removeSlot(
    slotId
  ) {
    const nextSlots =
      removeConsoleSlot({
        slots,
        slotId
      });

    saveSlots(
      nextSlots
    );
  }


  function cycleSlotFace(
    slotId
  ) {
    const nextSlots =
      cycleConsoleSlotFace({
        slots,
        slotId
      });

    saveSlots(
      nextSlots
    );
  }


  function renderPanel({
    slot,
    face
  }) {
    /*
     * Permanent System Index Face 1.
     *
     * The System Index card remains the actual parent card.
     * We pass the real console opener back into that card.
     */
    if (
      slot?.type ===
      IXI_CONSOLE_SLOT_TYPES.LISTING
    ) {
      return (
        typeof renderSystemIndexCard ===
          "function"
          ? renderSystemIndexCard({
              onOpenConsole:
                openConsole,

              consoleDepth:
                slots.length
            })
          : null
      );
    }


    /*
     * Module Faces are deliberately generic here.
     *
     * The console shell exists now.
     * Face/module content gets plugged into this seam next.
     */
    return (
      <div className="system-index-console-face">

        <div className="console-face-header">
          <div className="console-face-heading">
            <span>
              SYSTEM INDEX
            </span>

            <h3>
              {index?.displayName ||
                index?.label ||
                "INDEX"}
            </h3>
          </div>

          <div className="console-face-number">
            FACE {face}
          </div>
        </div>


        <div className="console-face-workspace">

          <div className="console-face-empty">
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


  return (
    <div
      className="system-index-console-root"
      data-console-depth={
        slots.length
      }
    >
      <IXIObjectConsoleShell
        slots={
          slots
        }

        panelWidth={
          PANEL_WIDTH
        }

        panelGap={
          PANEL_GAP
        }

        maxSlots={
          IXI_CONSOLE_MAX_DEPTH
        }

        renderPanel={
          renderPanel
        }

        onInsertAfter={
          insertAfter
        }

        onRemoveSlot={
          removeSlot
        }

        onCycleSlotFace={
          cycleSlotFace
        }
      />


      <style jsx global>{`
        .system-index-console-root {
          width: max-content;
          max-width: none;

          position: relative;

          overflow: visible;
        }


        /*
         * Native AOS doctrine:
         *
         * every console panel is 298 × 471.
         *
         * Adjacent panels overlap their border by 1px.
         * IXIObjectConsoleShell calculates the total native
         * width with panelGap = -1. This margin makes the
         * actual rendered geometry match that calculation.
         */
        .system-index-console-root
        .ixi-console-panels {
          gap: 0 !important;
        }

/*
 * SYSTEM INDEX FACE 1 ALREADY OWNS
 * THE IXI RAIL.
 *
 * Do not draw the generic console
 * face-cycle actuator over that rail.
 */
.system-index-console-root
.ixi-console-slot[data-ixi-console-face="1"]
> .ixi-console-face-button {
  display: none !important;
}


        .system-index-console-root
        .ixi-console-slot
        + .ixi-console-slot {
          margin-left:
            -${PANEL_OVERLAP}px;
        }


        .system-index-console-root
        .ixi-console-slot {
          height:
            ${NATIVE_HEIGHT}px;

          min-height:
            ${NATIVE_HEIGHT}px;

          max-height:
            ${NATIVE_HEIGHT}px;
        }


        .system-index-console-root
        .ixi-console-panel-content {
          height:
            ${NATIVE_HEIGHT}px;

          min-height:
            ${NATIVE_HEIGHT}px;

          max-height:
            ${NATIVE_HEIGHT}px;

          overflow:
            visible;
        }


        .system-index-console-face,
        .system-index-console-face * {
          box-sizing:
            border-box;
        }


        .system-index-console-face {
          width:
            ${PANEL_WIDTH}px;

          min-width:
            ${PANEL_WIDTH}px;

          max-width:
            ${PANEL_WIDTH}px;

          height:
            ${NATIVE_HEIGHT}px;

          min-height:
            ${NATIVE_HEIGHT}px;

          max-height:
            ${NATIVE_HEIGHT}px;

          padding:
            12px 12px 16px;

          position:
            relative;

          overflow:
            hidden;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .08
            );

          border-radius:
            14px;

          background:
            linear-gradient(
              180deg,
              rgba(
                255,
                255,
                255,
                .035
              ),
              rgba(
                255,
                255,
                255,
                .006
              )
            ),
            radial-gradient(
              circle at top left,
              rgba(
                255,
                196,
                0,
                .055
              ),
              transparent 55%
            ),
            #101010;

          box-shadow:
            inset
            0 1px 0
            rgba(
              255,
              255,
              255,
              .04
            ),
            0 18px 34px
            rgba(
              0,
              0,
              0,
              .42
            );
        }


        .console-face-header {
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


        .console-face-heading {
          min-width:
            0;

          flex:
            1 1 auto;
        }


        .console-face-heading span {
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


        .console-face-heading h3 {
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


        .console-face-number {
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


        .console-face-workspace {
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


        .console-face-empty {
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


        .console-face-empty span {
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


        .console-face-empty strong {
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
      `}</style>
    </div>
  );
}


export function getSystemIndexConsoleNativeWidth({
  objectId,
  ixiCardState = {}
}) {
  const slots =
    getConsoleSlots(
      ixiCardState,
      objectId,
      {
        maxSlots:
          IXI_CONSOLE_MAX_DEPTH
      }
    );

  return (
    (
      slots.length *
      PANEL_WIDTH
    ) -
    (
      Math.max(
        slots.length - 1,
        0
      ) *
      PANEL_OVERLAP
    )
  );
}

export function getSystemIndexConsoleNativeHeight() {
  return NATIVE_HEIGHT;
}
