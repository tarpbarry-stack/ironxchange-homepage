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
  createConsoleSlotsPatch
} from "../../ixi-chassis/IXIObjectConsoleEngine";

import IXIAosCardRuntime
  from "../card-runtime/IXIAosCardRuntime";


const AOS_PANEL_WIDTH =
  298;

const AOS_PANEL_HEIGHT =
  471;


function createInitialSlots() {
  return [
    createConsoleSlot({
      type:
        IXI_CONSOLE_SLOT_TYPES
          .LISTING
    })
  ];
}


function normalizeAosFace(
  value,
  faceCount
) {
  const count =
    Math.max(
      1,
      Number(faceCount) || 1
    );

  const face =
    Math.max(
      1,
      Number(value) || 1
    );

  return Math.min(
    face,
    count
  );
}


function getNextAosFace(
  current,
  faceCount
) {
  const count =
    Math.max(
      1,
      Number(faceCount) || 1
    );

  const face =
    normalizeAosFace(
      current,
      count
    );

  return face >= count
    ? 1
    : face + 1;
}


export default function IXIAosObjectConsole({
  object = {},

  objectId = "",

  cardDefinition = {},

  parentLabel = "",

  ixiCardState = {},

  updateIxiCardState,

  previewCardState = {},

  updatePreviewCardState,

  renderModule = null,

  studioEditing = false,

  selectedModuleId = "",

  onSelectModule = null,

  enableCardScaling = false,

  cardScaleMode = "xl"
}) {

  const id =
    String(
      objectId ||
      object?.objectId ||
      ""
    );


  const objectState =
    ixiCardState?.[id] ||
    previewCardState ||
    {};


  const faces =
    Array.isArray(
      cardDefinition?.faces
    )
      ? cardDefinition.faces
      : [];


  const faceCount =
    Math.max(
      1,
      faces.length
    );


  /*
   * Existing engine uses Face 2/3/4 as
   * its historical module-face vocabulary.
   *
   * For AOS the slot face is simply the
   * actual Card Face index.
   *
   * We therefore preserve the slot model
   * but normalize its face against this
   * Card Definition.
   */
  const storedSlots =
    Array.isArray(
      objectState.consoleSlots
    ) &&
    objectState.consoleSlots.length
      ? objectState.consoleSlots
      : createInitialSlots();


  const consoleSlots =
    normalizeConsoleSlots(
      storedSlots,
      {
        maxSlots:
          IXI_CONSOLE_MAX_DEPTH
      }
    );


  const listingSlotIndex =
    consoleSlots.findIndex(
      slot =>
        slot.type ===
        IXI_CONSOLE_SLOT_TYPES
          .LISTING
    );


  const atCapacity =
    consoleSlots.length >=
    IXI_CONSOLE_MAX_DEPTH;


  function patchObjectState(
    patch
  ) {

    if (!id) {
      return;
    }


    if (
      typeof updateIxiCardState ===
      "function"
    ) {
      updateIxiCardState(
        id,
        patch
      );

      return;
    }


    updatePreviewCardState?.(
      id,
      patch
    );
  }


  function saveSlots(
    slots
  ) {
    patchObjectState(
      createConsoleSlotsPatch(
        slots
      )
    );
  }


  function addPanel(
    side,
    event
  ) {

    event?.preventDefault?.();
    event?.stopPropagation?.();


    if (
      atCapacity ||
      faceCount <= 1
    ) {
      return;
    }


    /*
     * Choose a useful next Face based on
     * how many secondary panels exist.
     */
    const moduleCount =
      consoleSlots.filter(
        slot =>
          slot.type ===
          IXI_CONSOLE_SLOT_TYPES
            .MODULE
      ).length;


    const nextFace =
      (
        moduleCount %
        Math.max(
          faceCount - 1,
          1
        )
      ) + 2;


    const nextSlots =
      insertConsoleSlot({
        slots:
          consoleSlots,

        side,

        face:
          normalizeAosFace(
            nextFace,
            faceCount
          ),

        maxSlots:
          IXI_CONSOLE_MAX_DEPTH
      });


    saveSlots(
      nextSlots
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
        slots:
          consoleSlots,

        slotId
      })
    );
  }


  function cyclePanelFace(
    slotId,
    event
  ) {

    event?.preventDefault?.();
    event?.stopPropagation?.();


    const nextSlots =
      consoleSlots.map(
        slot => {

          if (
            String(slot.slotId) !==
            String(slotId)
          ) {
            return slot;
          }


          if (
            slot.type ===
            IXI_CONSOLE_SLOT_TYPES
              .LISTING
          ) {
            return slot;
          }


          return {
            ...slot,

            face:
              getNextAosFace(
                slot.face,
                faceCount
              )
          };
        }
      );


    saveSlots(
      nextSlots
    );
  }


  function renderFace(
    faceIndex
  ) {

    const resolvedFace =
      normalizeAosFace(
        faceIndex,
        faceCount
      );


    return (
      <IXIAosCardRuntime
        object={
          object
        }

        cardDefinition={
          cardDefinition
        }

        parentLabel={
          parentLabel
        }

        /*
         * Tell Runtime exactly which Face
         * this console slot owns.
         */
        forcedFaceIndex={
          resolvedFace
        }

        dragHandleProps={{}}

        ixiState={{
          face:
            resolvedFace
        }}

        onIxiStateChange={
          () => {}
        }

        renderModule={
          renderModule
        }

        studioEditing={
          studioEditing
        }

        selectedModuleId={
          selectedModuleId
        }

        onSelectModule={
          onSelectModule
        }
      />
    );
  }


  function renderSlot(
    slot,
    slotIndex
  ) {

    const isListing =
      slot.type ===
      IXI_CONSOLE_SLOT_TYPES
        .LISTING;


    const isFirst =
      slotIndex === 0;


    const isLast =
      slotIndex ===
      consoleSlots.length - 1;


    if (
      isListing
    ) {

      return (
        <section
          key={
            slot.slotId
          }

          className="
            ixi-aos-console-slot
            primary-slot
          "
        >

          {!atCapacity &&
          isFirst ? (
            <IXIObjectCardActuator
              side="left"

              variant="tall"

              label="Add console face left"

              title="Add console face left"

              onClick={
                event =>
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

              label="Add console face right"

              title="Add console face right"

              onClick={
                event =>
                  addPanel(
                    "right",
                    event
                  )
              }
            />
          ) : null}


          {renderFace(1)}

        </section>
      );
    }


    const isLeftOfPrimary =
      slotIndex <
      listingSlotIndex;


    return (
      <section
        key={
          slot.slotId
        }

        className="
          ixi-aos-console-slot
          module-slot
        "
      >

        <IXIObjectCardActuator
          side={
            isLeftOfPrimary
              ? "right"
              : "left"
          }

          variant="tall"

          label="Close console face"

          title="Close console face"

          onClick={
            event =>
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

            label="Add console face left"

            title="Add console face left"

            onClick={
              event =>
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

            label="Add console face right"

            title="Add console face right"

            onClick={
              event =>
                addPanel(
                  "right",
                  event
                )
            }
          />
        ) : null}


        {renderFace(
          slot.face
        )}


        <button
          type="button"

          className="
            ixi-aos-console-face-button
          "

          aria-label={
            `Change Face ${slot.face}`
          }

          title={
            `Face ${slot.face}`
          }

          onPointerDown={
            event => {
              event.preventDefault();
              event.stopPropagation();
            }
          }

          onClick={
            event =>
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
    consoleSlots.length *
    AOS_PANEL_WIDTH;


  const console = (
    <div
      className="ixi-aos-object-console"

      style={{
        width:
          `${nativeWidth}px`
      }}

      data-ixi-console-depth={
        consoleSlots.length
      }
    >

      {consoleSlots.map(
        renderSlot
      )}


      <style jsx global>{`

        .ixi-aos-object-console {
          position:
            relative;

          display:
            flex;

          align-items:
            flex-start;

          justify-content:
            flex-start;

          gap:
            0;

          overflow:
            visible;
        }


        .ixi-aos-console-slot {
          position:
            relative;

          flex:
            0 0 ${AOS_PANEL_WIDTH}px;

          width:
            ${AOS_PANEL_WIDTH}px;

          min-width:
            ${AOS_PANEL_WIDTH}px;

          max-width:
            ${AOS_PANEL_WIDTH}px;

          height:
            ${AOS_PANEL_HEIGHT}px;

          min-height:
            ${AOS_PANEL_HEIGHT}px;

          max-height:
            ${AOS_PANEL_HEIGHT}px;

          overflow:
            visible;
        }


        .ixi-aos-console-face-button {
          position:
            absolute;

          left:
            50%;

          bottom:
            -1px;

          width:
            34px;

          height:
            5px;

          transform:
            translateX(
              -50%
            );

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
            150;
        }


        .ixi-aos-console-face-button:hover {
          background:
            rgba(
              255,
              196,
              0,
              .95
            );
        }

      `}</style>

    </div>
  );


  if (
    enableCardScaling
  ) {
    return (
      <IXIScaledCardShell
        size={
          cardScaleMode
        }

        objectFamily="object"

        nativeWidth={
          nativeWidth
        }

        nativeHeight={
          AOS_PANEL_HEIGHT
        }
      >

        {console}

      </IXIScaledCardShell>
    );
  }


  return console;
}
