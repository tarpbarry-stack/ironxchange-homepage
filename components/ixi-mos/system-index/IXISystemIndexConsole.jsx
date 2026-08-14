import IXIObjectConsoleShell
  from "../../ixi-object-system/IXIObjectConsoleShell";

import {
  IXI_CONSOLE_MAX_DEPTH,
  IXI_CONSOLE_SLOT_TYPES,

  getConsoleSlots,
  insertConsoleSlot,
  removeConsoleSlot,
  cycleConsoleSlotFace,
  createConsoleSlotsPatch
} from "../../ixi-object-system/IXIConsoleEngine";


const PANEL_WIDTH = 298;
const PANEL_GAP = -1;
const NATIVE_HEIGHT = 471;


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


  /*
   * Existing IXI Console Engine owns
   * console structure/state.
   *
   * System Index does NOT invent another
   * console model.
   */
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


  function insertAfter(
    slotId
  ) {
    const nextSlots =
      insertConsoleSlot({
        slots,

        afterSlotId:
          slotId,

        maxSlots:
          IXI_CONSOLE_MAX_DEPTH
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
     */
    if (
      slot?.type ===
      IXI_CONSOLE_SLOT_TYPES
        .LISTING
    ) {
      return (
        typeof renderSystemIndexCard ===
          "function"
          ? renderSystemIndexCard()
          : null
      );
    }


    /*
     * Console Faces 2 / 3 / 4.
     *
     * These are intentionally generic
     * today.
     *
     * We will plug real Face definitions,
     * modules and AI-generated Faces into
     * this seam.
     */
    return (
      <div className="system-index-console-face">
        <div className="console-face-eyebrow">
          SYSTEM INDEX
        </div>

        <div className="console-face-name">
          {index?.displayName ||
            index?.label ||
            "INDEX"}
        </div>

        <div className="console-face-number">
          FACE {face}
        </div>

        <div className="console-face-empty">
          <span>
            EMPTY FACE
          </span>

          <strong>
            + MODULE
          </strong>
        </div>
      </div>
    );
  }


  return (
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
    >
      <style jsx>{`
        .system-index-console-face,
        .system-index-console-face * {
          box-sizing:
            border-box;
        }

        .system-index-console-face {
          width: 298px;
          height: 471px;

          padding:
            14px 14px 18px;

          position: relative;

          overflow: hidden;

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


        .console-face-eyebrow {
          color:
            #ffc400;

          font-size:
            6.5px;

          font-weight:
            950;

          letter-spacing:
            .09em;
        }


        .console-face-name {
          margin-top:
            4px;

          color:
            #f4f4f4;

          font-size:
            17px;

          font-weight:
            950;

          line-height:
            1;

          text-transform:
            uppercase;

          overflow:
            hidden;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }


        .console-face-number {
          margin-top:
            11px;

          padding-top:
            8px;

          border-top:
            1px solid
            rgba(
              255,
              255,
              255,
              .045
            );

          color:
            rgba(
              255,
              255,
              255,
              .34
            );

          font-size:
            9px;

          font-weight:
            950;

          letter-spacing:
            .08em;
        }


        .console-face-empty {
          position:
            absolute;

          left:
            14px;

          right:
            14px;

          top:
            120px;

          bottom:
            45px;

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
    </IXIObjectConsoleShell>
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
    ) +
    (
      Math.max(
        slots.length - 1,
        0
      ) *
      PANEL_GAP
    )
  );
}


export function getSystemIndexConsoleNativeHeight() {
  return NATIVE_HEIGHT;
}
