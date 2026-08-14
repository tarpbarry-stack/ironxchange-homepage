import IXIObjectConsoleShell
  from "../../ixi-object-system/IXIObjectConsoleShell";

import {
  IXI_CONSOLE_MAX_DEPTH,
  IXI_CONSOLE_SLOT_TYPES,
  IXI_CONSOLE_MODULE_FACES,

  getConsoleSlots,
  createConsoleSlot,
  removeConsoleSlot,
  cycleConsoleSlotFace,
  createConsoleSlotsPatch
} from "../../ixi-object-system/IXIConsoleEngine";


const PANEL_WIDTH =
  298;

const PANEL_OVERLAP =
  1;

const PANEL_GAP =
  -PANEL_OVERLAP;

const NATIVE_HEIGHT =
  471;


/* =========================================================
   IXI AOS
   LOCATION CONTAINER OBJECT CONSOLE

   PURPOSE

   This component owns ONLY the Location object's
   expandable console presentation.

   Face 1 remains the real Location Container Object card.

   Additional 298 × 471 slots are module surfaces.

   This component does NOT own:

   - canonical MOS object data
   - containment
   - relationships
   - workspace placement
   - Location field persistence
   - photo persistence
   - module calculations

   Console slot/depth state remains in ixiCardState through
   the existing universal IXI Console Engine.
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


export default function IXILocationObjectConsole({
  objectId,

  location,

  ixiCardState = {},

  updateIxiCardState,

  renderLocationCard
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
   * Slot 1 is permanently the real
   * Location Object Face 1.
   *
   * Opening the console creates the
   * first module surface beside it.
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

    const locationSlot =
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
          locationSlot?.slotId
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
     * =====================================================
     * PERMANENT LOCATION FACE 1
     * =====================================================
     *
     * This is the actual Location Container Object.
     *
     * The console does NOT recreate the Location card.
     * It calls the real card renderer supplied by the
     * AOS Workspace Board.
     */
    if (
      slot?.type ===
      IXI_CONSOLE_SLOT_TYPES.LISTING
    ) {
      return (
        typeof renderLocationCard ===
          "function"
          ? renderLocationCard({
              onOpenConsole:
                openConsole,

              consoleDepth:
                slots.length
            })
          : null
      );
    }


    /*
     * =====================================================
     * LOCATION MODULE FACES
     * =====================================================
     *
     * These are intentionally empty module surfaces for now.
     *
     * Next layer we plug real Location modules into this seam:
     *
     * ASSET VALUE
     * EMPLOYEES
     * EQUIPMENT
     * RELATIONSHIPS
     * EXPENSES
     * WORK ORDERS
     * etc.
     *
     * We are NOT inventing those modules in this file.
     */
    return (
      <div className="location-console-face">

        <div className="location-console-face-header">

          <div className="location-console-face-heading">

            <span>
              LOCATION
            </span>

            <h3>
              {
                location?.displayName ||
                location?.name ||
                location?.title ||
                "LOCATION"
              }
            </h3>

          </div>


          <div className="location-console-face-number">
            FACE {face}
          </div>

        </div>


        <div className="location-console-face-workspace">

          <div className="location-console-face-empty">

            <span>
              EMPTY MODULE
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
      className="location-console-root"

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

        /*
         * ===================================================
         * COMPLETE LOCATION CONSOLE
         * ===================================================
         */

        .location-console-root {
          width:
            max-content;

          max-width:
            none;

          position:
            relative;

          overflow:
            visible;
        }


        /*
         * ===================================================
         * NATIVE IXI CONSOLE GEOMETRY
         * ===================================================
         *
         * Same solved geometry as System Index:
         *
         * 298 × 471 per slot.
         * Adjacent slots overlap their border by 1px.
         */

        .location-console-root
        .ixi-console-panels {
          gap:
            0 !important;
        }


        .location-console-root
        .ixi-console-slot
        + .ixi-console-slot {
          margin-left:
            -${PANEL_OVERLAP}px;
        }


        .location-console-root
        .ixi-console-slot {
          height:
            ${NATIVE_HEIGHT}px;

          min-height:
            ${NATIVE_HEIGHT}px;

          max-height:
            ${NATIVE_HEIGHT}px;
        }


        .location-console-root
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


        /*
         * ===================================================
         * LOCATION MODULE PANEL
         * ===================================================
         */

        .location-console-face,
        .location-console-face * {
          box-sizing:
            border-box;
        }


        .location-console-face {
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
              circle
              at top left,
              rgba(
                255,
                196,
                0,
                .055
              ),
              transparent
              55%
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


        /*
         * ===================================================
         * MODULE HEADER
         * ===================================================
         */

        .location-console-face-header {
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


        .location-console-face-heading {
          min-width:
            0;

          flex:
            1 1 auto;
        }


        .location-console-face-heading span {
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


        .location-console-face-heading h3 {
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


        .location-console-face-number {
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


        /*
         * ===================================================
         * MODULE WORKSPACE
         * ===================================================
         */

        .location-console-face-workspace {
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


        .location-console-face-empty {
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


        .location-console-face-empty span {
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


        .location-console-face-empty strong {
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


/* =========================================================
   LOCATION CONSOLE GEOMETRY EXPORTS

   The Board uses these to reserve the complete physical
   footprint before scaling.

   Same contract as System Index.
   ========================================================= */

export function getLocationConsoleNativeWidth({
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


export function getLocationConsoleNativeHeight() {
  return NATIVE_HEIGHT;
}
