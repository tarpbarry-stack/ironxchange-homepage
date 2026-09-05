import {
  useState
} from "react";

import IXIScaledCardShell
  from "../../ixi-machine-object/IXIScaledCardShell";

import IXIObjectCardActuator
  from "../../ixi-chassis/IXIObjectCardActuator";

import IXIAosSkinRuntime
  from "../skin-runtime/IXIAosSkinRuntime";

import {
  IXI_CONSOLE_MAX_DEPTH,
  IXI_CONSOLE_SLOT_TYPES,
  createConsoleSlot,
  normalizeConsoleFaces,
  normalizeConsoleSlots,
  insertConsoleSlot,
  removeConsoleSlot,
  cycleConsoleSlotFace,
  assignConsoleSlotFace,
  createConsoleSlotsPatch
} from "../../ixi-chassis/IXIObjectConsoleEngine";

import IXIAosCardRenderer
  from "../card-runtime/IXIAosCardRenderer";

import IXIAosFaceRuntime
  from "../face-runtime/IXIAosFaceRuntime";


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

  projection = null,

  objects = [],

  cardDefinition = {},
  skinId =
    "ixi:skin:default",

  onCreateFace = null,

  onSaveObject = null,
  
  parentLabel = "",

  ixiCardState = {},

  updateIxiCardState,

  previewCardState = {},

  updatePreviewCardState,

  renderModule = null,

  studioEditing = false,

  selectedModuleId = "",

  onSelectModule = null,

  onSelectFace = null,

  enableCardScaling = false,

  cardScaleMode = "xl"
}) {

  const [
    faceCreatorSlotId,
    setFaceCreatorSlotId
  ] = useState("");

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
   * =====================================================
   * AVAILABLE CONSOLE FACES
   * =====================================================
   *
   * Face 1 is the permanent primary Object Card.
   * Every actual Card Face after Face 1 is eligible
   * for a console slot.
   */
  const availableConsoleFaces =
    normalizeConsoleFaces(
      faces
        .map(
          (
            face,
            index
          ) =>
            index + 1
        )
        .filter(
          faceNumber =>
            faceNumber > 1
        )
    );
  
  const activeStudioFace =
    normalizeAosFace(
      previewCardState
        ?.activeStudioFace ||
      previewCardState
        ?.face ||
      1,

      faceCount
    );
  
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
          IXI_CONSOLE_MAX_DEPTH,

        faces:
          availableConsoleFaces
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
    slots,
    faceList =
      availableConsoleFaces
  ) {
    patchObjectState(
      createConsoleSlotsPatch(
        slots,
        {
          faces:
            faceList,

          maxSlots:
            IXI_CONSOLE_MAX_DEPTH
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


    if (
      atCapacity
    ) {
      return;
    }


    const nextSlots =
      insertConsoleSlot({
        slots:
          consoleSlots,

        side,

        type:
          IXI_CONSOLE_SLOT_TYPES
            .EMPTY,

        maxSlots:
          IXI_CONSOLE_MAX_DEPTH,

        faces:
          availableConsoleFaces
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

        slotId,

        faces:
          availableConsoleFaces
      })
    );
  }


  function selectStudioFace(
    faceIndex,
    event
  ) {

    event?.preventDefault?.();
    event?.stopPropagation?.();


    const resolvedFace =
      normalizeAosFace(
        faceIndex,
        faceCount
      );


    const faceDefinition =
      faces[
        resolvedFace - 1
      ] ||
      null;


    updatePreviewCardState?.(
      objectId,
      {
        face:
          resolvedFace,

        activeStudioFace:
          resolvedFace
      }
    );


    onSelectFace?.({
      faceIndex:
        resolvedFace,

      faceId:
        faceDefinition?.faceId ||
        `face-${resolvedFace}`
    });
  }


  function cyclePanelFace(
    slotId,
    event
  ) {
    event?.preventDefault?.();
    event?.stopPropagation?.();


    if (
      !availableConsoleFaces.length
    ) {
      return;
    }


    const nextSlots =
      cycleConsoleSlotFace({
        slots:
          consoleSlots,

        slotId,

        faces:
          availableConsoleFaces
      });


    saveSlots(
      nextSlots
    );
  }


  function renderFace(
    faceIndex,
    {
      faceOnly = false
    } = {}
  ) {

    const resolvedFace =
      normalizeAosFace(
        faceIndex,
        faceCount
      );


    return (
      <IXIAosSkinRuntime
        skinId={
          skinId
        }
      >
        <IXIAosCardRenderer
          object={
            object
          }

          projection={
            projection
          }

          objects={
            Array.isArray(
              objects
            )
              ? objects
              : []
          }

          cardDefinition={
            cardDefinition
          }

          parentLabel={
            parentLabel
          }

          forcedFaceIndex={
            faceOnly
              ? resolvedFace
              : null
          }

          faceOnly={
            faceOnly
          }

          dragHandleProps={{}}

          ixiState={{
            ...objectState,

            face:
              faceOnly
                ? resolvedFace
                : activeStudioFace
          }}

          onIxiStateChange={
            (
              changedObjectId,
              patch
            ) => {
              const nextFace =
                normalizeAosFace(
                  patch?.face ??
                  activeStudioFace,
                  faceCount
                );


              updatePreviewCardState?.(
                changedObjectId ||
                objectId,
                {
                  ...patch,

                  face:
                    nextFace,

                  activeStudioFace:
                    nextFace
                }
              );


              const faceDefinition =
                faces[
                  nextFace - 1
                ] ||
                null;


              onSelectFace?.({
                faceIndex:
                  nextFace,

                faceId:
                  faceDefinition?.faceId ||
                  `face-${nextFace}`
              });
            }
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

          onSaveObject={
            onSaveObject
          }
        />
      </IXIAosSkinRuntime>
    );
  }


  function renderSecondaryFace(
    faceIndex
  ) {
    const resolvedFace =
      normalizeAosFace(
        faceIndex,
        faceCount
      );
    
    return (
      <IXIAosSkinRuntime
        skinId={
          skinId
        }
      >

        <IXIAosFaceRuntime
          object={
            object
          }

          cardDefinition={
            cardDefinition
          }

          faceNumber={
            resolvedFace
          }

          presentationMode={
            cardScaleMode
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

      </IXIAosSkinRuntime>
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

    const isEmpty =
      slot.type ===
      IXI_CONSOLE_SLOT_TYPES
        .EMPTY;

    if (
      isEmpty
    ) {

      const isLeftOfPrimary =
        slotIndex <
        listingSlotIndex;


      return (
        <section
          key={
            slot.slotId
          }

          className={`
            ixi-aos-console-slot
            empty-slot
          `}
        >

          <IXIObjectCardActuator
            side={
              isLeftOfPrimary
                ? "right"
                : "left"
            }

            variant="tall"

            label="Close empty console slot"

            title="Close empty console slot"

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


          <button
            type="button"

            className={`
              ixi-aos-empty-face-create
            `}

            onPointerDown={
              event => {
                event.preventDefault();
                event.stopPropagation();
              }
            }

            onClick={
              event => {
                event.preventDefault();
                event.stopPropagation();

                setFaceCreatorSlotId(
                  String(
                    slot.slotId
                  )
                );
              }
            }
          >
            <strong>
              +
            </strong>

            <span>
              ADD / CREATE FACE
            </span>
          </button>

          {String(
            faceCreatorSlotId
          ) ===
          String(
            slot.slotId
          ) ? (
            <div
              className={`
                ixi-aos-face-create-menu
              `}
              onPointerDown={
                event =>
                  event.stopPropagation()
              }
            >
              <strong>
                ADD FACE
              </strong>


              <div className="ixi-aos-existing-face-list">

                {availableConsoleFaces.length ? (
                  availableConsoleFaces.map(
                    faceIndex => {

                      const faceDefinition =
                        faces[
                          faceIndex - 1
                        ] ||
                        null;


                      const faceLabel =
                        String(
                          faceDefinition?.label ||
                          faceDefinition?.name ||
                          `FACE ${faceIndex}`
                        );


                      return (
                        <button
                          key={
                            faceIndex
                          }

                          type="button"

                          onClick={
                            event => {
                              event.preventDefault();
                              event.stopPropagation();


                              const nextSlots =
                                assignConsoleSlotFace({
                                  slots:
                                    consoleSlots,

                                  slotId:
                                    slot.slotId,

                                  face:
                                    faceIndex,

                                  faces:
                                    availableConsoleFaces
                                });


                              saveSlots(
                                nextSlots
                              );


                              updatePreviewCardState?.(
                                objectId,
                                {
                                  face:
                                    faceIndex,

                                  activeStudioFace:
                                    faceIndex
                                }
                              );


                              onSelectFace?.({
                                faceIndex,

                                faceId:
                                  faceDefinition?.faceId ||
                                  `face-${faceIndex}`
                              });


                              setFaceCreatorSlotId(
                                ""
                              );
                            }
                          }
                        >
                          {faceLabel}
                        </button>
                      );
                    }
                  )
                ) : (
                  <span className="ixi-aos-no-existing-faces">
                    NO EXISTING FACES
                  </span>
                )}

              </div>


              <button
                type="button"

                onClick={
                  event => {
                    event.preventDefault();
                    event.stopPropagation();


                    const created =
                      onCreateFace?.(
                        slot.slotId
                      );


                    if (
                      !created?.faceIndex
                    ) {
                      return;
                    }


                    const nextAvailableFaces =
                      normalizeConsoleFaces([
                        ...availableConsoleFaces,
                        created.faceIndex
                      ]);


                    const nextSlots =
                      assignConsoleSlotFace({
                        slots:
                          consoleSlots,

                        slotId:
                          slot.slotId,

                        face:
                          created.faceIndex,

                        faces:
                          nextAvailableFaces
                      });


                    saveSlots(
                      nextSlots,
                      nextAvailableFaces
                    );


                    updatePreviewCardState?.(
                      objectId,
                      {
                        face:
                          created.faceIndex,

                        activeStudioFace:
                          created.faceIndex
                      }
                    );


                    onSelectFace?.({
                      faceIndex:
                        created.faceIndex,

                      faceId:
                        created.faceId ||
                        `face-${created.faceIndex}`
                    });


                    setFaceCreatorSlotId(
                      ""
                    );
                  }
                }
              >
                CREATE NEW
              </button>


              <button
                type="button"

                className={`
                  cancel
                `}

                onClick={
                  event => {
                    event.preventDefault();
                    event.stopPropagation();

                    setFaceCreatorSlotId(
                      ""
                    );
                  }
                }
              >
                CANCEL
              </button>
            </div>
          ) : null}


        </section>
      );
    }


    if (
      isListing
    ) {

      return (
        <section
          key={
            slot.slotId
          }

          className={`
            ixi-aos-console-slot
            primary-slot
          `}
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

        className={`
          ixi-aos-console-slot
          module-slot
        `}
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
          slot.face,
          {
            faceOnly:
              true
          }
        )}

        <button
          type="button"

          className={[
            "ixi-aos-console-face-button",

            Number(
              activeStudioFace
            ) ===
            Number(
              slot.face
            )
              ? "active"
              : ""
          ]
            .filter(Boolean)
            .join(" ")}

          aria-label={
            `Edit Face ${slot.face}`
          }

          title={
            `Edit Face ${slot.face}`
          }

          onPointerDown={
            event => {
              event.preventDefault();
              event.stopPropagation();
            }
          }

          onClick={
            event =>
              selectStudioFace(
                slot.face,
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

        .ixi-aos-console-face-button.active {
          background:
            rgba(
              255,
              196,
              0,
              .98
            );

          box-shadow:
            0 0 8px
            rgba(
              255,
              196,
              0,
              .28
            );
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

        .ixi-aos-console-slot.empty-slot {
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .08
            );

          border-radius:
            13px;

          background:
            linear-gradient(
              180deg,
              rgba(
                255,
                255,
                255,
                .018
              ),
              rgba(
                255,
                255,
                255,
                0
              )
            ),
            #141414;

          overflow:
            hidden;
        }


        .ixi-aos-empty-face-create {
          box-sizing:
            border-box;

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
            10px;

          border:
            0;

          background:
            transparent;

          color:
            rgba(
              255,
              255,
              255,
              .34
            );

          cursor:
            pointer;
        }


        .ixi-aos-empty-face-create strong {
          font-size:
            42px;

          font-weight:
            300;

          line-height:
            1;

          color:
            rgba(
              255,
              196,
              0,
              .82
            );
        }


        .ixi-aos-empty-face-create span {
          font-size:
            8px;

          font-weight:
            950;

          letter-spacing:
            .7px;

          text-transform:
            uppercase;
        }


        .ixi-aos-empty-face-create:hover {
          background:
            rgba(
              255,
              196,
              0,
              .025
            );

          color:
            #ffc400;
        }


        .ixi-aos-empty-face-create:hover strong {
          color:
            #ffc400;
        }

        .ixi-aos-face-create-menu {
          position:
            absolute;

          left:
            50%;
          top:
            50%;

          z-index:
            300;

          width:
            176px;

          transform:
            translate(
              -50%,
              -50%
            );

          display:
            flex;

          flex-direction:
            column;

          gap:
            7px;

          padding:
            12px;

          border:
            1px solid
            rgba(
              255,
              196,
              0,
              .22
            );

          border-radius:
            8px;

          background:
            rgba(
              8,
              8,
              8,
              .98
            );

          box-shadow:
            0 18px 40px
            rgba(
              0,
              0,
              0,
              .55
            );
        }


        .ixi-aos-face-create-menu > strong {
          margin-bottom:
            3px;

          color:
            #ffc400;

          font-size:
            8px;

          font-weight:
            950;

          letter-spacing:
            .6px;
        }

        .ixi-aos-existing-face-list {
          width:
            100%;

          display:
            flex;

          flex-direction:
            column;

          gap:
            5px;

          max-height:
            190px;

          overflow-y:
            auto;

          overflow-x:
            hidden;

          scrollbar-width:
            none;
        }


        .ixi-aos-existing-face-list::-webkit-scrollbar {
          display:
            none;
        }


        .ixi-aos-existing-face-list > button {
          width:
            100%;

          height:
            28px;

          flex:
            0 0 28px;

          padding:
            0 8px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .08
            );

          border-radius:
            5px;

          background:
            rgba(
              255,
              255,
              255,
              .025
            );

          color:
            rgba(
              255,
              255,
              255,
              .72
            );

          font-size:
            7px;

          font-weight:
            950;

          letter-spacing:
            .45px;

          text-align:
            left;

          cursor:
            pointer;

          text-transform:
            uppercase;
        }


        .ixi-aos-existing-face-list > button:hover {
          border-color:
            rgba(
              255,
              196,
              0,
              .35
            );

          color:
            #ffc400;
        }


        .ixi-aos-no-existing-faces {
          display:
            block;

          padding:
            8px;

          color:
            rgba(
              255,
              255,
              255,
              .28
            );

          font-size:
            7px;

          font-weight:
            900;

          text-align:
            center;

          letter-spacing:
            .4px;
        }

        .ixi-aos-face-create-menu > button {
          width:
            100%;

          height:
            28px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .08
            );

          border-radius:
            5px;

          background:
            rgba(
              255,
              255,
              255,
              .025
            );

          color:
            rgba(
              255,
              255,
              255,
              .72
            );

          font-size:
            7px;

          font-weight:
            950;

          letter-spacing:
            .45px;

          cursor:
            pointer;
        }


        .ixi-aos-face-create-menu > button:hover {
          border-color:
            rgba(
              255,
              196,
              0,
              .35
            );

          color:
            #ffc400;
        }


        .ixi-aos-face-create-menu > button.cancel {
          color:
            rgba(
              255,
              255,
              255,
              .34
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
