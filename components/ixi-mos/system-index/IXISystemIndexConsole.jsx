import IXIObjectCardActuator
  from "../../ixi-chassis/IXIObjectCardActuator";

import {
  IXI_CONSOLE_MAX_DEPTH,
  IXI_CONSOLE_SLOT_TYPES,
  IXI_CONSOLE_MODULE_FACES,
  getConsoleSlots,
  insertConsoleSlot,
  removeConsoleSlot,
  cycleConsoleSlotFace,
  createConsoleSlotsPatch
} from "../../ixi-chassis/IXIObjectConsoleEngine";


const PANEL_WIDTH = 298;
const PANEL_HEIGHT = 471;
const PANEL_OVERLAP = 1;


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
          IXI_CONSOLE_MAX_DEPTH,

        faces:
          IXI_CONSOLE_MODULE_FACES
      }
    );

  const listingSlotIndex =
    slots.findIndex(
      slot =>
        slot?.type ===
        IXI_CONSOLE_SLOT_TYPES.LISTING
    );

  const atCapacity =
    slots.length >=
    IXI_CONSOLE_MAX_DEPTH;


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
            IXI_CONSOLE_MAX_DEPTH,

          faces:
            IXI_CONSOLE_MODULE_FACES
        }
      )
    );
  }


  function addPanel(
    side,
    event
  ) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (atCapacity) {
      return;
    }

    const nextSlots =
      insertConsoleSlot({
        slots,
        side,

        type:
          IXI_CONSOLE_SLOT_TYPES.MODULE,

        maxSlots:
          IXI_CONSOLE_MAX_DEPTH,

        faces:
          IXI_CONSOLE_MODULE_FACES
      });

    saveSlots(
      nextSlots
    );
  }


  function openConsole(
    event
  ) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    /*
     * OPEN CONSOLE from the System Index
     * More menu opens the first face on
     * the RIGHT, matching the normal IXI
     * console direction.
     *
     * If the console is already open,
     * do not manufacture another panel.
     */
    if (
      slots.length > 1
    ) {
      return;
    }

    addPanel(
      "right",
      event
    );
  }


  function removePanel(
    slotId,
    event
  ) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    saveSlots(
      removeConsoleSlot({
        slots,
        slotId,
        faces:
          IXI_CONSOLE_MODULE_FACES
      })
    );
  }


  function cyclePanelFace(
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
          IXI_CONSOLE_MODULE_FACES
      })
    );
  }


  function renderModuleFace(
    slot
  ) {
    const face =
      Number(
        slot?.face
      ) || 2;

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


  function renderSlot(
    slot,
    slotIndex
  ) {
    const isListing =
      slot?.type ===
      IXI_CONSOLE_SLOT_TYPES.LISTING;

    const isFirst =
      slotIndex === 0;

    const isLast =
      slotIndex ===
      slots.length - 1;


    if (isListing) {
      return (
        <section
          key={
            slot.slotId
          }
          className="system-index-console-slot primary-slot"
        >
          {!atCapacity &&
          isFirst ? (
            <IXIObjectCardActuator
              side="left"
              variant="tall"
              label="Open System Index console left"
              title="Open System Index console left"
              onClick={event =>
                addPanel(
                  "left",
                  event
                )
              }
            />
          ) : null}

          {!atCapacity &&
          isLast ? (
            <IXIObjectCardActuator
              side="right"
              variant="tall"
              label="Open System Index console right"
              title="Open System Index console right"
              onClick={event =>
                addPanel(
                  "right",
                  event
                )
              }
            />
          ) : null}

          {typeof renderSystemIndexCard ===
          "function"
            ? renderSystemIndexCard({
                onOpenConsole:
                  openConsole,

                consoleDepth:
                  slots.length
              })
            : null}
        </section>
      );
    }


    const isLeftOfPrimary =
      listingSlotIndex >= 0 &&
      slotIndex <
        listingSlotIndex;


    return (
      <section
        key={
          slot.slotId
        }
        className="system-index-console-slot module-slot"
      >
        <IXIObjectCardActuator
          side={
            isLeftOfPrimary
              ? "right"
              : "left"
          }
          variant="tall"
          label="Close System Index console face"
          title="Close System Index console face"
          onClick={event =>
            removePanel(
              slot.slotId,
              event
            )
          }
        />

        {!atCapacity &&
        isFirst ? (
          <IXIObjectCardActuator
            side="left"
            variant="tall"
            label="Open System Index console left"
            title="Open System Index console left"
            onClick={event =>
              addPanel(
                "left",
                event
              )
            }
          />
        ) : null}

        {!atCapacity &&
        isLast ? (
          <IXIObjectCardActuator
            side="right"
            variant="tall"
            label="Open System Index console right"
            title="Open System Index console right"
            onClick={event =>
              addPanel(
                "right",
                event
              )
            }
          />
        ) : null}

        {renderModuleFace(
          slot
        )}

        <button
          type="button"
          className="system-index-console-face-button"
          aria-label={
            `Change System Index console face — current Face ${slot.face}`
          }
          title={
            `Change face — current Face ${slot.face}`
          }
          onPointerDown={event => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={event =>
            cyclePanelFace(
              slot.slotId,
              event
            )
          }
        />
      </section>
    );
  }


  const nativeWidth =
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
    );


  return (
    <div
      className="system-index-console-root"
      style={{
        width:
          `${nativeWidth}px`
      }}
      data-console-depth={
        slots.length
      }
    >
      {slots.map(
        renderSlot
      )}

      <style jsx global>{`
        .system-index-console-root {
          position: relative;

          display: flex;
          align-items: flex-start;
          justify-content: flex-start;

          gap: 0;

          max-width: none;
          min-width: 0;

          overflow: visible;
        }


        .system-index-console-slot {
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


        .system-index-console-slot
        + .system-index-console-slot {
          margin-left:
            -${PANEL_OVERLAP}px;
        }


        /*
         * IMPORTANT:
         *
         * System Index uses the SAME proven
         * IXIObjectCardActuator component as
         * Inventory / Auction / Object Studio.
         *
         * No midpoint shell actuator CSS exists
         * in this component.
         */


        .system-index-console-face,
        .system-index-console-face * {
          box-sizing: border-box;
        }


        .system-index-console-face {
          width: ${PANEL_WIDTH}px;
          min-width: ${PANEL_WIDTH}px;
          max-width: ${PANEL_WIDTH}px;

          height: ${PANEL_HEIGHT}px;
          min-height: ${PANEL_HEIGHT}px;
          max-height: ${PANEL_HEIGHT}px;

          padding: 12px 12px 16px;

          position: relative;

          overflow: hidden;

          border:
            1px solid
            rgba(255,255,255,.08);

          border-radius: 14px;

          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,.035),
              rgba(255,255,255,.006)
            ),
            radial-gradient(
              circle at top left,
              rgba(255,196,0,.055),
              transparent 55%
            ),
            #101010;

          box-shadow:
            inset 0 1px 0
              rgba(255,255,255,.04),
            0 18px 34px
              rgba(0,0,0,.42);
        }


        .console-face-header {
          height: 38px;

          display: flex;
          align-items: flex-start;
          justify-content: space-between;

          gap: 8px;

          border-bottom:
            1px solid
            rgba(255,255,255,.045);
        }


        .console-face-heading {
          min-width: 0;
          flex: 1 1 auto;
        }


        .console-face-heading span {
          display: block;

          color: #ffc400;

          font-size: 6.5px;
          font-weight: 950;
          letter-spacing: .09em;

          text-transform: uppercase;
        }


        .console-face-heading h3 {
          margin: 4px 0 0;

          overflow: hidden;

          color: #f4f4f4;

          font-size: 17px;
          font-weight: 950;
          line-height: 1;

          text-overflow: ellipsis;
          text-transform: uppercase;
          white-space: nowrap;
        }


        .console-face-number {
          flex: 0 0 auto;

          padding-top: 2px;

          color:
            rgba(255,255,255,.32);

          font-size: 8px;
          font-weight: 950;
          letter-spacing: .08em;
        }


        .console-face-workspace {
          position: absolute;

          left: 12px;
          right: 12px;
          top: 58px;
          bottom: 28px;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          gap: 8px;

          border:
            1px dashed
            rgba(255,255,255,.08);

          border-radius: 8px;

          background:
            rgba(255,255,255,.012);
        }


        .console-face-workspace span {
          color:
            rgba(255,255,255,.20);

          font-size: 9px;
          font-weight: 950;
          letter-spacing: .09em;
        }


        .console-face-workspace strong {
          color:
            rgba(0,194,255,.72);

          font-size: 10px;
          font-weight: 950;
        }


        .system-index-console-face-button {
          position: absolute;

          left: 50%;
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
            rgba(255,255,255,.18);

          cursor: pointer;

          z-index: 150;
        }


        .system-index-console-face-button:hover {
          background:
            rgba(255,196,0,.95);

          box-shadow:
            0 0 8px
            rgba(255,196,0,.38);
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
          IXI_CONSOLE_MAX_DEPTH,

        faces:
          IXI_CONSOLE_MODULE_FACES
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
  return PANEL_HEIGHT;
}
