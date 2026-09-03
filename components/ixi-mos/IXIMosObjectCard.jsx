import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  useDraggable
} from "@dnd-kit/core";

import IXIObjectDropTarget
  from "../ixi-chassis/IXIObjectDropTarget";

import IXIMachineRail
  from "../IXIMachineRail";

import IXICollectionThumbRail
  from "../ixi-object-system/IXICollectionThumbRail";

import {
  getCollectionDeckState,
  getNextCollectionFace,
  getPreviousCollectionFace,
  getFirstCollectionFace,
  getLastCollectionFace,
  getCollectionFaceForItemIndex
} from "../ixi-object-system/IXICollectionDeckEngine";


/* =========================================================
   HELPERS
   ========================================================= */

function clean(value) {
  return String(
    value || ""
  ).trim();
}


function formatMoney(
  value,
  currency = "USD"
) {
  const amount =
    Number(value || 0);

  if (
    !Number.isFinite(amount)
  ) {
    return "$0";
  }

  return amount.toLocaleString(
    "en-US",
    {
      style: "currency",
      currency:
        currency || "USD",
      maximumFractionDigits: 0
    }
  );
}


function getObjectId(
  object = {}
) {
  return String(
    object?.objectId ||
    object?.id ||
    ""
  );
}


function getObjectName(
  object = {}
) {
  return (
    clean(
      object?.displayName
    ) ||
    clean(
      object?.name
    ) ||
    clean(
      object?.title
    ) ||
    "OBJECT"
  );
}


function getObjectImage(
  object = {}
) {
  const media =
    Array.isArray(
      object?.media
    )
      ? object.media
      : [];

  const firstMedia =
    media.find(item => {
      if (
        typeof item ===
        "string"
      ) {
        return Boolean(
          clean(item)
        );
      }

      return Boolean(
        item?.url ||
        item?.src ||
        item?.imageUrl
      );
    });

  if (
    typeof firstMedia ===
    "string"
  ) {
    return firstMedia;
  }

  return (
    firstMedia?.url ||
    firstMedia?.src ||
    firstMedia?.imageUrl ||

    object?.imageUrl ||

    object?.imageUrls?.[0] ||

    object?.images?.[0]?.url ||

    ""
  );
}


function getObjectSecondaryText(
  object = {}
) {
  return (
    clean(
      object?.factualTitle
    ) ||
    clean(
      object?.customerAssetId
    ) ||
    clean(
      object?.fields
        ?.location
    ) ||
    clean(
      object?.fields
        ?.effectiveLocation
    ) ||
    ""
  );
}


function getObjectValue(
  object = {}
) {
  const value =
    object?.value ??
    object?.estimatedValue ??
    object?.marketValue ??
    0;

  const numeric =
    Number(value);

  return Number.isFinite(
    numeric
  )
    ? numeric
    : 0;
}


/*
 * Generic AOS objects may receive
 * their direct children from several
 * projections while we finish the
 * universal AWS relationship bridge.
 *
 * The card itself does NOT decide
 * canonical membership.
 *
 * It consumes whichever direct-child
 * collection the workspace supplies.
 */
function resolveItems({
  items,
  object,
  projection
}) {
  if (
    Array.isArray(items)
  ) {
    return items;
  }

  if (
    Array.isArray(
      object?.items
    )
  ) {
    return object.items;
  }

  if (
    Array.isArray(
      object?.children
    )
  ) {
    return object.children;
  }

  if (
    Array.isArray(
      projection?.directContents
    )
  ) {
    return projection.directContents;
  }

  if (
    Array.isArray(
      projection?.items
    )
  ) {
    return projection.items;
  }

  return [];
}


/* =========================================================
   UNIVERSAL AOS OBJECT / CONTAINER CARD
   ========================================================= */

export default function IXIMosObjectCard({
  object = {},

  /*
   * Direct child objects.
   *
   * We will wire this explicitly from
   * the AOS workspace registry next.
   */
  items = null,

  projection = null,

  parentLabel = "",

  dragHandleProps = null,

  ixiState = {},
  ixiCardState = {},

  onIxiStateChange = null,

  saved = false,

  armedDestination = "",

  onSendFront = null,
  onSendBack = null,

  onCycleColor = null,
  onCycleOutline = null,

  onSendToArmedDestination = null,

  onExposeObject = null,

  onExposeContents = null,
  onGatherContents = null,

  onAddChild = null,

  onSaveName = null,
  onDelete = null,

  onOpen = null,

  workspaceDropPolicy = null,
  workspaceDropSurface = "",

  onOpenConsole = null,

  renderIdentityFace = null,

  /*
   * Future Object Studio actions.
   * Preserved so we do not destroy
   * today's API surface.
   */
  onAddMedia = null,
  onCreateWorkOrder = null,
  onAddExpense = null,
  onScanQr = null
}) {

  /* =======================================================
     IDENTITY
     ======================================================= */

  const id =
    getObjectId(
      object
    );

  const displayName =
    getObjectName(
      object
    );

  const resolvedParentLabel =
    clean(
      parentLabel
    ) ||
    clean(
      object?.metadata
        ?.parentDisplayName
    ) ||
    "OBJECT";


  const isContainer =
    Boolean(
      object?.capabilities
        ?.canContain
    );


  const directItems =
    resolveItems({
      items,
      object,
      projection
    });


  const totalValue =
    directItems.reduce(
      (total, item) =>
        total +
        getObjectValue(item),
      0
    );


  /* =======================================================
     NAMING
     ======================================================= */

  const creationState =
    clean(
      object?.metadata
        ?.creationState
    );

  const isNaming =
    creationState ===
    "naming";


  const inputRef =
    useRef(null);


  const [
    draftName,
    setDraftName
  ] =
    useState(
      isNaming
        ? ""
        : displayName
    );


  const [
    savingName,
    setSavingName
  ] =
    useState(false);


  const [
    nameError,
    setNameError
  ] =
    useState("");


  useEffect(() => {
    if (
      isNaming &&
      inputRef.current
    ) {
      inputRef.current
        .focus();
    }
  }, [
    isNaming,
    id
  ]);


  useEffect(() => {
    if (!isNaming) {
      setDraftName(
        displayName
      );
    }
  }, [
    isNaming,
    displayName
  ]);


  async function saveName(
    event = null
  ) {
    event
      ?.preventDefault?.();

    event
      ?.stopPropagation?.();

    const nextName =
      clean(
        draftName
      );

    if (!nextName) {
      setNameError(
        "Name is required."
      );

      inputRef.current
        ?.focus();

      return;
    }

    if (
      !id ||
      savingName
    ) {
      return;
    }

    setSavingName(true);
    setNameError("");

    try {
      await onSaveName?.({
        objectId:
          id,

        displayName:
          nextName
      });
    } catch (error) {
      console.error(
        "AOS OBJECT NAME SAVE FAILED:",
        error
      );

      setNameError(
        error?.message ||
        "Could not save object."
      );
    } finally {
      setSavingName(false);
    }
  }


  function handleNameKeyDown(
    event
  ) {
    if (
      event.key ===
      "Enter"
    ) {
      saveName(
        event
      );
    }
  }


  /* =======================================================
     DELETE
     ======================================================= */

  async function deleteObject(
    event
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (
      typeof onDelete !==
      "function"
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete ${displayName}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      await onDelete(
        object
      );
    } catch (error) {
      console.error(
        "AOS OBJECT DELETE FAILED:",
        error
      );

      window.alert(
        error?.message ||
        "Could not delete object."
      );
    }
  }


  /* =======================================================
     DROP TARGET
     ======================================================= */

  const [
    isDropAccepting,
    setIsDropAccepting
  ] =
    useState(false);


  const dropTargetObject =
    isContainer
      ? {
          ...object,

          objectId:
            id,

          workspaceDropPolicy:
            workspaceDropPolicy ||
            object
              ?.workspaceDropPolicy ||
            {
              enabled:
                true,

              /*
               * Universal AOS container.
               *
               * Empty accepted types means
               * open acceptance through the
               * existing IXI acceptance
               * engine.
               */
              acceptedObjectTypes:
                []
            }
        }
      : object;


  /* =======================================================
     COLLECTION / DECK STATE
     ======================================================= */

  const face =
    Math.max(
      1,
      Number(
        ixiState?.face ||
        1
      )
    );


  const {
    isIdentityFace,
    isEndDeckFace,
    activeItemIndex,
    activeItem
  } =
    getCollectionDeckState({
      face,
      items:
        directItems
    });


  const [
    previewItemIndex,
    setPreviewItemIndex
  ] =
    useState(0);


  useEffect(() => {
    if (
      activeItemIndex >= 0
    ) {
      setPreviewItemIndex(
        activeItemIndex
      );
    }
  }, [
    activeItemIndex
  ]);


  useEffect(() => {
    if (
      !directItems.length
    ) {
      setPreviewItemIndex(0);

      return;
    }

    setPreviewItemIndex(
      current =>
        Math.min(
          Math.max(
            current,
            0
          ),
          directItems.length - 1
        )
    );
  }, [
    directItems.length
  ]);


  const previewItem =
    directItems[
      previewItemIndex
    ] || null;


  const thumbActiveIndex =
    isIdentityFace
      ? (
          directItems.length
            ? previewItemIndex
            : -1
        )
      : activeItemIndex;


  /* =======================================================
     ACTIVE CHILD DRAG
     ======================================================= */

  const activeItemId =
    activeItem
      ? getObjectId(
          activeItem
        )
      : "";


  const {
    attributes:
      childDragAttributes,

    listeners:
      childDragListeners,

    setNodeRef:
      setChildDragNodeRef,

    isDragging:
      isChildDragging
  } =
    useDraggable({
      id:
        activeItemId ||
        `${id}-inactive-child`,

      disabled:
        isIdentityFace ||
        isEndDeckFace ||
        !activeItemId,

      data: {
        type:
          "ixi-object",

        objectId:
          activeItemId,

        objectType:
          clean(
            activeItem
              ?.objectType
          ) ||
          "object",

        objectFamily:
          clean(
            activeItem
              ?.objectFamily
          ) ||
          "object",

        sourceContainerId:
          id,

        sourceParentId:
          id,

        sourceParentType:
          clean(
            object
              ?.objectType
          ) ||
          "object",

        action:
          "expose"
      }
    });


  /* =======================================================
     FACE CONTROL
     ======================================================= */

  function setFace(
    nextFace
  ) {
    if (!id) {
      return;
    }

    onIxiStateChange?.(
      id,
      {
        face:
          Number(
            nextFace || 1
          )
      }
    );
  }


  function goHome() {
    setFace(
      getFirstCollectionFace()
    );
  }


  function goEnd() {
    setFace(
      getLastCollectionFace({
        items:
          directItems
      })
    );
  }


  function goForward() {
    if (
      isIdentityFace &&
      directItems.length
    ) {
      setFace(
        getCollectionFaceForItemIndex(
          previewItemIndex
        )
      );

      return;
    }

    setFace(
      getNextCollectionFace({
        face,
        items:
          directItems
      })
    );
  }


  function goBackward() {
    setFace(
      getPreviousCollectionFace({
        face,
        items:
          directItems
      })
    );
  }


  function previewPrevious(
    event
  ) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (
      !directItems.length
    ) {
      return;
    }

    setPreviewItemIndex(
      current =>
        current <= 0
          ? directItems.length - 1
          : current - 1
    );
  }


  function previewNext(
    event
  ) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (
      !directItems.length
    ) {
      return;
    }

    setPreviewItemIndex(
      current =>
        current >=
          directItems.length - 1
          ? 0
          : current + 1
    );
  }


  function selectThumb(
    item,
    itemIndex
  ) {
    if (
      isIdentityFace
    ) {
      setPreviewItemIndex(
        itemIndex
      );

      return;
    }

    setFace(
      getCollectionFaceForItemIndex(
        itemIndex
      )
    );
  }


  /* =======================================================
     OPERATIONS
     ======================================================= */

  function addChild(
    event
  ) {
    event.preventDefault();
    event.stopPropagation();

    onAddChild?.(
      object
    );
  }


  function exposeContents(
    event
  ) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    onExposeContents?.(
      object
    );
  }


  function gatherContents(
    event
  ) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    onGatherContents?.(
      object
    );
  }


  function openConsole(
    event
  ) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    onOpenConsole?.(
      object
    );
  }


  /* =======================================================
     BOARD STATE
     ======================================================= */

  const boardColor =
    ixiState?.color ||
    "none";


  const boardOutline =
    Number(
      ixiState?.outline ??
      1
    );


  const actionNotice =
    ixiState?.actionNotice ||
    null;


  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <section
      className={[
        "aos-object-card",
        "card",

        isContainer
          ? "aos-container-card"
          : "",

        isDropAccepting
          ? "ixi-container-drop-accepting"
          : "",

        `board-color-${
          boardColor || "none"
        }`,

        `board-outline-${
          boardOutline || 1
        }`
      ]
        .filter(Boolean)
        .join(" ")}

      {...(
        isIdentityFace
          ? dragHandleProps || {}
          : {}
      )}

      data-aos-object-id={
        id
      }
    >

      {/* ===================================================
          ACTION NOTICE
          =================================================== */}

      {actionNotice?.message ? (
        <div
          className={[
            "aos-action-notice",
            `tone-${
              actionNotice
                ?.tone ||
              "success"
            }`
          ].join(" ")}
        >
          {actionNotice.message}
        </div>
      ) : null}


      {/* ===================================================
          MAIN FACE WINDOW
          =================================================== */}

      <div className="aos-object-face">

        {isContainer ? (
          <IXIObjectDropTarget
            targetObject={
              dropTargetObject
            }

            targetObjectId={
              id
            }

            targetSurface={
              workspaceDropSurface
            }

            className={`
              aos-object-drop-on-zone
            `}

            onDropStateChange={({
              accepting
            }) => {
              setIsDropAccepting(
                accepting
              );
            }}
          />
        ) : null}


        {/* =================================================
            IDENTITY / CONTAINER FACE
            ================================================= */}

        {isIdentityFace ? (
  typeof renderIdentityFace ===
    "function" ? (
    renderIdentityFace({
      object,

      parentLabel:
        resolvedParentLabel,

      projection,

      items:
        directItems,

      ixiState,

      ixiCardState,

      onAddChild,

      onSaveName,

      onAddMedia,

      onExposeContents,

      onGatherContents,

      onOpenConsole
    })
  ) : (
  <div className="aos-object-identity">

            <div className="aos-topline">

              <div className="aos-heading">

                <span>
                  {resolvedParentLabel}
                </span>

                {isNaming ? (
                  <div
                    className={`
                      aos-name-editor
                    `}
                    onPointerDown={
                      event =>
                        event
                          .stopPropagation()
                    }
                  >
                    <input
                      ref={
                        inputRef
                      }

                      value={
                        draftName
                      }

                      placeholder="
                        NAME OBJECT
                      "

                      disabled={
                        savingName
                      }

                      onChange={
                        event => {
                          setDraftName(
                            event
                              .target
                              .value
                          );

                          if (
                            nameError
                          ) {
                            setNameError(
                              ""
                            );
                          }
                        }
                      }

                      onKeyDown={
                        handleNameKeyDown
                      }

                      spellCheck={
                        false
                      }
                    />

                    <button
                      type="button"

                      disabled={
                        savingName
                      }

                      onPointerDown={
                        event =>
                          event
                            .stopPropagation()
                      }

                      onClick={
                        saveName
                      }
                    >
                      {savingName
                        ? "..."
                        : "SAVE"}
                    </button>
                  </div>
                ) : (
                  <h3>
                    {displayName}
                  </h3>
                )}

              </div>


              <div className="aos-top-actions">

                {isContainer &&
                typeof onAddChild ===
                  "function" ? (
                  <button
                    type="button"

                    className={`
                      aos-add-button
                    `}

                    title="
                      Add child object
                    "

                    onPointerDown={
                      event =>
                        event
                          .stopPropagation()
                    }

                    onClick={
                      addChild
                    }
                  >
                    +
                  </button>
                ) : null}


                {typeof onDelete ===
                  "function" ? (
                  <button
                    type="button"

                    className={`
                      aos-delete-button
                    `}

                    title="
                      Delete object
                    "

                    onPointerDown={
                      event =>
                        event
                          .stopPropagation()
                    }

                    onClick={
                      deleteObject
                    }
                  >
                    ×
                  </button>
                ) : null}


                {isContainer ? (
                  <div className="aos-count">
                    {directItems.length}
                  </div>
                ) : null}

              </div>

            </div>


            {nameError ? (
              <div className="aos-name-error">
                {nameError}
              </div>
            ) : null}


            {/* ===============================================
                LARGE ACTIVE CHILD PREVIEW
                =============================================== */}

            <div className="aos-preview">

              {isContainer &&
              previewItem ? (
                <>

                  <div className="aos-preview-photo">

                    {getObjectImage(
                      previewItem
                    ) ? (
                      <img
                        src={
                          getObjectImage(
                            previewItem
                          )
                        }

                        alt={
                          getObjectName(
                            previewItem
                          )
                        }

                        draggable={
                          false
                        }
                      />
                    ) : (
                      <div className={`
                        aos-preview-photo-empty
                      `}>
                        {getObjectName(
                          previewItem
                        )}
                      </div>
                    )}


                    <div className={`
                      aos-preview-position
                    `}>
                      {previewItemIndex + 1}
                      {" / "}
                      {directItems.length}
                    </div>

                  </div>


                  <div className="aos-preview-info">

                    <button
                      type="button"

                      className={`
                        aos-preview-arrow
                      `}

                      onPointerDown={
                        event =>
                          event
                            .stopPropagation()
                      }

                      onClick={
                        previewPrevious
                      }

                      aria-label="
                        Previous object
                      "
                    >
                      ‹
                    </button>


                    <div className="aos-preview-copy">

                      <strong>
                        {getObjectName(
                          previewItem
                        )}
                      </strong>

                      <div className="aos-preview-meta">
                        {getObjectSecondaryText(
                          previewItem
                        ) ? (
                          <span>
                            {getObjectSecondaryText(
                              previewItem
                            )}
                          </span>
                        ) : (
                          <span>
                            OBJECT
                          </span>
                        )}
                      </div>

                    </div>


                    <button
                      type="button"

                      className={`
                        aos-preview-pull
                      `}

                      onPointerDown={
                        event => {
                          event
                            .preventDefault();

                          event
                            .stopPropagation();
                        }
                      }

                      onClick={
                        event => {
                          event
                            .preventDefault();

                          event
                            .stopPropagation();

                          if (
                            !previewItem
                          ) {
                            return;
                          }

                          onExposeObject?.(
                            previewItem,
                            object
                          );
                        }
                      }
                    >
                      OUT
                    </button>


                    <button
                      type="button"

                      className={`
                        aos-preview-arrow
                      `}

                      onPointerDown={
                        event =>
                          event
                            .stopPropagation()
                      }

                      onClick={
                        previewNext
                      }

                      aria-label="
                        Next object
                      "
                    >
                      ›
                    </button>

                  </div>

                </>
              ) : (

                <div className="aos-empty">

                  <span>
                    {isContainer
                      ? "EMPTY"
                      : "OBJECT"}
                  </span>

                  <strong>
                    {displayName}
                  </strong>

                </div>

              )}

            </div>


            {/* ===============================================
                SNAPSHOT / BOARD / RECALL
                =============================================== */}

            <div className="aos-snapshot">

              <div className="aos-stat">

                <span>
                  OBJECTS
                </span>

                <strong>
                  {isContainer
                    ? directItems.length
                    : "—"}
                </strong>

              </div>


              <div className="aos-stat">

                <span>
                  VALUE
                </span>

                <strong>
                  {formatMoney(
                    isContainer
                      ? totalValue
                      : getObjectValue(
                          object
                        ),

                    object?.currency ||
                    "USD"
                  )}
                </strong>

              </div>


              {isContainer ? (
                <div className={`
                  aos-content-actions
                `}>

                  <button
                    type="button"

                    onPointerDown={
                      event =>
                        event
                          .stopPropagation()
                    }

                    onClick={
                      exposeContents
                    }

                    title="
                      Send direct contents
                      to Board
                    "
                  >
                    BOARD
                  </button>


                  <button
                    type="button"

                    onPointerDown={
                      event =>
                        event
                          .stopPropagation()
                    }

                    onClick={
                      gatherContents
                    }

                    title="
                      Recall direct contents
                      to this container
                    "
                  >
                    RECALL
                  </button>

                </div>
              ) : (

                <div className={`
                  aos-object-actions
                `}>

                  <button
                    type="button"

                    onPointerDown={
                      event =>
                        event
                          .stopPropagation()
                    }

                    onClick={
                      event => {
                        event.preventDefault();
                        event.stopPropagation();

                        onOpen?.(
                          object
                        );
                      }
                    }
                  >
                    OPEN
                  </button>

                </div>

              )}

            </div>

                   </div>

        )

        /* =================================================
           CHILD FACE
           ================================================= */

        ) : activeItem ? (
          <div
            ref={
              setChildDragNodeRef
            }

            className={[
              "aos-child-face",

              isChildDragging
                ? "is-dragging"
                : ""
            ]
              .filter(Boolean)
              .join(" ")}

            {...childDragAttributes}
            {...childDragListeners}
          >

            <div className="aos-child-header">

              <span>
                {displayName}
              </span>

              <strong>
                {getObjectName(
                  activeItem
                )}
              </strong>

            </div>


            <div className="aos-child-visual">

              {getObjectImage(
                activeItem
              ) ? (
                <img
                  src={
                    getObjectImage(
                      activeItem
                    )
                  }

                  alt={
                    getObjectName(
                      activeItem
                    )
                  }

                  draggable={
                    false
                  }
                />
              ) : (
                <div className={`
                  aos-child-empty
                `}>
                  {getObjectName(
                    activeItem
                  )}
                </div>
              )}

            </div>


            <div className="aos-child-info">

              <strong>
                {getObjectName(
                  activeItem
                )}
              </strong>

              <span>
                {getObjectSecondaryText(
                  activeItem
                ) ||
                "AOS OBJECT"}
              </span>

            </div>

          </div>


        /* =================================================
           END DECK
           ================================================= */

        ) : (

          <div className="aos-end">

            <span>
              END DECK
            </span>

            <strong>
              {directItems.length}
            </strong>

            <p>
              OBJECTS REVIEWED
            </p>

            {typeof onOpenConsole ===
              "function" ? (
              <button
                type="button"

                onPointerDown={
                  event =>
                    event
                      .stopPropagation()
                }

                onClick={
                  openConsole
                }
              >
                OPEN OBJECT
              </button>
            ) : null}

          </div>

        )}

      </div>


      {/* ===================================================
          CHILD THUMB RAIL
          =================================================== */}

      <div className="aos-thumb-shell">

        <IXICollectionThumbRail
          items={
            directItems
          }

          activeItemIndex={
            thumbActiveIndex
          }

          getItemId={
            item =>
              getObjectId(
                item
              )
          }

          getItemImage={
            getObjectImage
          }

          getItemLabel={
            getObjectName
          }

          onSelectItem={
            selectThumb
          }
        />

      </div>


      {/* ===================================================
          STANDARD IXI MACHINE RAIL
          =================================================== */}

      <IXIMachineRail
        listing={
          object
        }

        saved={
          saved
        }

        boardColor={
          boardColor
        }

        boardOutline={
          boardOutline
        }

        machineFace={
          face
        }

        railMode={
          isIdentityFace
            ? "next-lit"
            : "home-lit next-lit prev-lit end-lit"
        }

        /*
         * CENTER:
         * enter selected object /
         * advance deck.
         */
        onCycleMachineFace={
          goForward
        }

        /*
         * RIGHT OF CENTER:
         * previous object.
         */
        onRailSend={
          goBackward
        }

        /*
         * LEFT END:
         * normal board-front command
         * while home;
         * HOME while inside deck.
         */
        onSendFront={
          isIdentityFace
            ? onSendFront
            : goHome
        }

        /*
         * RIGHT END:
         * normal board-back command
         * while home;
         * END DECK while browsing.
         */
        onSendBack={
          isIdentityFace
            ? onSendBack
            : goEnd
        }

        onCycleColor={
          onCycleColor
        }

        onCycleOutline={
          onCycleOutline
        }

        armedDestination={
          armedDestination
        }

        /*
         * Armed Destination operates
         * selected child when browsing.
         *
         * On home face it operates this
         * object itself.
         */
        onSendToArmedDestination={() => {
          const target =
            activeItem ||
            object;

          onSendToArmedDestination?.(
            target
          );

          if (activeItem) {
            onExposeObject?.(
              activeItem,
              object
            );
          }
        }}
      />


      {/* ===================================================
          STYLE
          =================================================== */}

      <style jsx>{`

        .aos-object-card,
        .aos-object-card * {
          box-sizing:
            border-box;
        }


        /* ===============================================
           UNIVERSAL AOS CARD CHASSIS
           =============================================== */

        .aos-object-card {
          position: relative;

          width: 298px;
          min-width: 298px;
          max-width: 298px;

          height: 471px;
          min-height: 471px;
          max-height: 471px;

          overflow: hidden;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .08
            );

          outline:
            1px solid
            rgba(
              255,
              255,
              255,
              .018
            );

          outline-offset: 0;

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

          cursor: grab;
        }


        /* ===============================================
           BOARD COLOR / OUTLINE
           =============================================== */

        .aos-object-card.board-outline-0 {
          outline-width: 0;
        }

        .aos-object-card.board-outline-1 {
          outline-width: 1px;
        }

        .aos-object-card.board-outline-3 {
          outline-width: 3px;
        }

        .aos-object-card.board-outline-5 {
          outline-width: 5px;
        }

        .aos-object-card.board-color-none {
          outline-color:
            rgba(
              255,
              255,
              255,
              .018
            );
        }

        .aos-object-card.board-color-green {
          outline-color:
            rgba(
              56,
              161,
              105,
              .95
            );
        }

        .aos-object-card.board-color-yellow {
          outline-color:
            rgba(
              255,
              196,
              0,
              .95
            );
        }

        .aos-object-card.board-color-red {
          outline-color:
            rgba(
              229,
              62,
              62,
              .95
            );
        }

        .aos-object-card.board-color-cyan {
          outline-color:
            rgba(
              0,
              194,
              255,
              .95
            );
        }

        .aos-object-card.board-color-white {
          outline-color:
            rgba(
              255,
              255,
              255,
              .85
            );
        }

        .aos-object-card.board-color-blue {
          outline-color:
            rgba(
              49,
              130,
              206,
              .95
            );
        }

        .aos-object-card.board-color-orange {
          outline-color:
            rgba(
              249,
              133,
              18,
              .95
            );
        }


        /* ===============================================
           DROP ACCEPTANCE
           =============================================== */

        :global(
          .aos-object-drop-on-zone
        ) {
          position: absolute;

          left: 4%;
          right: 4%;

          top: 8%;
          bottom: 8%;

          z-index: 18;

          pointer-events: none;

          background:
            transparent;
        }


        .aos-object-card
        .ixi-container-drop-accepting {
          border-color:
            rgba(
              255,
              196,
              0,
              .92
            );
        }


        .aos-object-card.ixi-container-drop-accepting {
          border-color:
            rgba(
              255,
              196,
              0,
              .92
            );

          outline:
            1px solid
            rgba(
              255,
              196,
              0,
              .36
            );

          box-shadow:
            0 0 0 1px
            rgba(
              255,
              196,
              0,
              .20
            ),

            0 0 18px
            rgba(
              255,
              196,
              0,
              .24
            ),

            0 0 36px
            rgba(
              255,
              196,
              0,
              .10
            ),

            inset
            0 0 18px
            rgba(
              255,
              196,
              0,
              .035
            ),

            inset
            0 1px 0
            rgba(
              255,
              255,
              255,
              .05
            );
        }


        /* ===============================================
           FACE WINDOW
           =============================================== */

        .aos-object-face {
          position: absolute;

          left: 0;
          right: 0;
          top: 0;

          bottom: 64px;

          overflow: hidden;
        }


        /* ===============================================
           IDENTITY
           =============================================== */

        .aos-object-identity {
          width: 100%;
          height: 100%;

          padding:
            12px 12px 8px;

          display: flex;
          flex-direction: column;

          min-height: 0;
        }


        .aos-topline {
          height: 38px;
          min-height: 38px;

          position: relative;

          display: flex;

          align-items:
            flex-start;

          justify-content:
            space-between;

          gap: 8px;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .045
            );
        }


        .aos-heading {
          min-width: 0;
          flex: 1;
        }


        .aos-heading > span {
          display: block;

          overflow: hidden;

          color: #ffc400;

          font-size: 6.5px;
          font-weight: 950;

          letter-spacing:
            .09em;

          text-transform:
            uppercase;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }


        .aos-heading h3 {
          margin:
            4px 0 0;

          max-width: 200px;

          overflow: hidden;

          color: #f4f4f4;

          font-size: 17px;
          font-weight: 950;

          line-height: 1;

          text-overflow:
            ellipsis;

          white-space: nowrap;

          text-transform:
            uppercase;
        }


        .aos-top-actions {
          display: flex;

          align-items:
            center;

          gap: 6px;

          flex: 0 0 auto;
        }


        .aos-add-button,
        .aos-delete-button {
          width: 20px;
          height: 20px;

          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          padding: 0;

          border-radius: 4px;

          background:
            rgba(
              255,
              255,
              255,
              .025
            );

          font-weight: 900;

          line-height: 1;

          cursor: pointer;

          position: relative;

          z-index: 100;
        }


        .aos-add-button {
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .10
            );

          color:
            rgba(
              255,
              255,
              255,
              .52
            );

          font-size: 15px;
        }


        .aos-add-button:hover {
          color: #ffc400;

          border-color:
            rgba(
              255,
              196,
              0,
              .38
            );

          background:
            rgba(
              255,
              196,
              0,
              .06
            );
        }


        .aos-delete-button {
          border:
            1px solid
            rgba(
              229,
              62,
              62,
              .24
            );

          color:
            rgba(
              229,
              62,
              62,
              .62
            );

          font-size: 14px;
        }


        .aos-delete-button:hover {
          color:
            rgba(
              255,
              90,
              90,
              .96
            );

          border-color:
            rgba(
              229,
              62,
              62,
              .58
            );

          background:
            rgba(
              229,
              62,
              62,
              .08
            );
        }


        .aos-count {
          min-width: 14px;

          padding-top: 5px;

          color:
            rgba(
              255,
              255,
              255,
              .26
            );

          font-size: 8px;
          font-weight: 950;

          text-align: right;
        }


        /* ===============================================
           NAME EDITOR
           =============================================== */

        .aos-name-editor {
          margin-top: 3px;

          display: flex;

          align-items:
            center;

          gap: 5px;

          max-width: 205px;
        }


        .aos-name-editor input {
          width: 154px;
          min-width: 0;

          height: 22px;

          padding: 0 6px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .12
            );

          border-radius: 4px;

          outline: none;

          background:
            rgba(
              0,
              0,
              0,
              .32
            );

          color: #f4f4f4;

          font-size: 9px;
          font-weight: 900;
        }


        .aos-name-editor input:focus {
          border-color:
            rgba(
              0,
              194,
              255,
              .56
            );

          box-shadow:
            0 0 0 1px
            rgba(
              0,
              194,
              255,
              .10
            );
        }


        .aos-name-editor button {
          height: 22px;

          padding: 0 6px;

          border:
            1px solid
            rgba(
              255,
              196,
              0,
              .28
            );

          border-radius: 4px;

          background:
            rgba(
              255,
              196,
              0,
              .05
            );

          color: #ffc400;

          font-size: 6px;
          font-weight: 950;

          cursor: pointer;
        }


        .aos-name-error {
          position: absolute;

          top: 50px;
          left: 12px;
          right: 12px;

          z-index: 30;

          color:
            rgba(
              255,
              90,
              90,
              .90
            );

          font-size: 7px;
          font-weight: 900;
        }


        /* ===============================================
           PREVIEW
           =============================================== */

        .aos-preview {
          height: 190px;
          min-height: 190px;

          margin-top: 8px;

          overflow: hidden;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .055
            );

          border-radius: 8px;

          background:
            rgba(
              7,
              7,
              7,
              .78
            );
        }


        .aos-preview-photo {
          position: relative;

          width: 100%;
          height: 137px;

          overflow: hidden;

          background: #090909;
        }


        .aos-preview-photo img {
          width: 100%;
          height: 100%;

          display: block;

          object-fit: cover;
        }


        .aos-preview-photo-empty {
          width: 100%;
          height: 100%;

          padding: 18px;

          display: flex;

          align-items:
            center;

          justify-content:
            center;

          color:
            rgba(
              255,
              255,
              255,
              .16
            );

          font-size: 11px;
          font-weight: 950;

          letter-spacing:
            .08em;

          text-align: center;

          text-transform:
            uppercase;
        }


        .aos-preview-position {
          position: absolute;

          right: 7px;
          top: 7px;

          height: 17px;

          padding: 0 6px;

          display: flex;

          align-items:
            center;

          justify-content:
            center;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .12
            );

          border-radius:
            999px;

          background:
            rgba(
              0,
              0,
              0,
              .58
            );

          color:
            rgba(
              255,
              255,
              255,
              .72
            );

          font-size: 6px;
          font-weight: 950;
        }


        .aos-preview-info {
          height: 52px;

          display: grid;

          grid-template-columns:
            20px
            minmax(0, 1fr)
            30px
            20px;

          align-items:
            center;

          background:
            linear-gradient(
              180deg,
              rgba(
                255,
                255,
                255,
                .018
              ),
              transparent
            ),
            #101010;
        }


        .aos-preview-arrow {
          width: 20px;
          height: 100%;

          padding: 0;

          border: 0;

          background:
            transparent;

          color:
            rgba(
              255,
              255,
              255,
              .22
            );

          font-size: 17px;
          font-weight: 800;

          cursor: pointer;
        }


        .aos-preview-arrow:hover {
          color: #ffc400;

          background:
            rgba(
              255,
              196,
              0,
              .025
            );
        }


        .aos-preview-copy {
          min-width: 0;

          padding: 0 4px;
        }


        .aos-preview-copy strong {
          display: block;

          overflow: hidden;

          color:
            rgba(
              255,
              255,
              255,
              .82
            );

          font-size: 8.5px;
          font-weight: 950;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }


        .aos-preview-meta {
          margin-top: 4px;

          overflow: hidden;
        }


        .aos-preview-meta span {
          display: block;

          overflow: hidden;

          color:
            rgba(
              255,
              255,
              255,
              .30
            );

          font-size: 6px;
          font-weight: 900;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }


        .aos-preview-pull {
          height: 24px;

          padding: 0;

          border:
            1px solid
            rgba(
              0,
              194,
              255,
              .18
            );

          border-radius: 4px;

          background:
            rgba(
              0,
              194,
              255,
              .035
            );

          color:
            rgba(
              0,
              194,
              255,
              .62
            );

          font-size: 5.5px;
          font-weight: 950;

          cursor: pointer;
        }


        .aos-preview-pull:hover {
          border-color:
            rgba(
              0,
              194,
              255,
              .46
            );

          background:
            rgba(
              0,
              194,
              255,
              .08
            );

          color:
            rgba(
              0,
              194,
              255,
              .95
            );
        }


        /* ===============================================
           EMPTY
           =============================================== */

        .aos-empty {
          width: 100%;
          height: 100%;

          display: flex;

          flex-direction:
            column;

          align-items:
            center;

          justify-content:
            center;

          gap: 7px;

          text-align: center;
        }


        .aos-empty span {
          color:
            rgba(
              255,
              196,
              0,
              .52
            );

          font-size: 7px;
          font-weight: 950;
        }


        .aos-empty strong {
          max-width: 210px;

          overflow: hidden;

          color:
            rgba(
              255,
              255,
              255,
              .20
            );

          font-size: 12px;
          font-weight: 950;

          text-overflow:
            ellipsis;

          white-space: nowrap;

          text-transform:
            uppercase;
        }


        /* ===============================================
           SNAPSHOT
           =============================================== */

        .aos-snapshot {
          display: grid;

          grid-template-columns:
            62px
            82px
            minmax(0, 1fr);

          align-items:
            stretch;

          gap: 6px;

          margin-top: 8px;
        }


        .aos-stat {
          min-width: 0;

          height: 34px;

          padding: 5px 7px;

          display: flex;

          flex-direction:
            column;

          justify-content:
            center;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .055
            );

          border-radius: 5px;

          background:
            rgba(
              255,
              255,
              255,
              .018
            );
        }


        .aos-stat span {
          color:
            rgba(
              255,
              255,
              255,
              .28
            );

          font-size: 6px;
          font-weight: 900;

          letter-spacing:
            .55px;
        }


        .aos-stat strong {
          margin-top: 2px;

          overflow: hidden;

          color:
            rgba(
              255,
              255,
              255,
              .78
            );

          font-size: 10px;
          font-weight: 950;

          line-height: 1;

          text-overflow:
            ellipsis;

          white-space: nowrap;
        }


        .aos-content-actions {
          min-width: 0;

          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 5px;
        }


        .aos-content-actions button,
        .aos-object-actions button {
          min-width: 0;
          height: 34px;

          padding: 0 5px;

          border:
            1px solid
            rgba(
              0,
              194,
              255,
              .12
            );

          border-radius: 5px;

          background:
            rgba(
              0,
              194,
              255,
              .022
            );

          color:
            rgba(
              255,
              255,
              255,
              .48
            );

          font-size: 6.5px;
          font-weight: 950;

          letter-spacing:
            .4px;

          cursor: pointer;
        }


        .aos-content-actions button:hover,
        .aos-object-actions button:hover {
          border-color:
            rgba(
              0,
              194,
              255,
              .42
            );

          background:
            rgba(
              0,
              194,
              255,
              .07
            );

          color:
            rgba(
              0,
              194,
              255,
              .92
            );
        }


        .aos-object-actions {
          display: grid;

          grid-template-columns:
            1fr;
        }


        /* ===============================================
           CHILD FACE
           =============================================== */

        .aos-child-face {
          width: 100%;
          height: 100%;

          overflow: hidden;

          cursor: grab;

          touch-action: none;
        }


        .aos-child-face.is-dragging {
          opacity: .42;
        }


        .aos-child-header {
          height: 52px;

          padding:
            12px 12px 8px;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .045
            );
        }


        .aos-child-header span {
          display: block;

          overflow: hidden;

          color: #ffc400;

          font-size: 6.5px;
          font-weight: 950;

          letter-spacing:
            .09em;

          text-transform:
            uppercase;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }


        .aos-child-header strong {
          display: block;

          margin-top: 4px;

          overflow: hidden;

          color: #f4f4f4;

          font-size: 17px;
          font-weight: 950;

          line-height: 1;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;

          text-transform:
            uppercase;
        }


        .aos-child-visual {
          width: 100%;
          height: 245px;

          overflow: hidden;

          background: #090909;
        }


        .aos-child-visual img {
          width: 100%;
          height: 100%;

          display: block;

          object-fit: cover;
        }


        .aos-child-empty {
          width: 100%;
          height: 100%;

          padding: 22px;

          display: flex;

          align-items:
            center;

          justify-content:
            center;

          color:
            rgba(
              255,
              255,
              255,
              .16
            );

          font-size: 18px;
          font-weight: 950;

          text-align: center;

          text-transform:
            uppercase;
        }


        .aos-child-info {
          height: 58px;

          padding:
            10px 12px;

          background:
            linear-gradient(
              180deg,
              rgba(
                255,
                255,
                255,
                .018
              ),
              transparent
            ),
            #101010;
        }


        .aos-child-info strong {
          display: block;

          overflow: hidden;

          color:
            rgba(
              255,
              255,
              255,
              .86
            );

          font-size: 11px;
          font-weight: 950;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }


        .aos-child-info span {
          display: block;

          margin-top: 5px;

          overflow: hidden;

          color:
            rgba(
              255,
              255,
              255,
              .32
            );

          font-size: 7px;
          font-weight: 900;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }


        /* ===============================================
           END DECK
           =============================================== */

        .aos-end {
          width: 100%;
          height: 100%;

          display: flex;

          flex-direction:
            column;

          align-items:
            center;

          justify-content:
            center;

          gap: 8px;

          background:
            radial-gradient(
              circle at center,
              rgba(
                255,
                196,
                0,
                .08
              ),
              transparent 55%
            ),
            #101010;

          text-align: center;
        }


        .aos-end span {
          color: #ffc400;

          font-size: 9px;
          font-weight: 950;

          letter-spacing:
            .12em;
        }


        .aos-end strong {
          color: #f4f4f4;

          font-size: 42px;
          font-weight: 950;

          line-height: 1;
        }


        .aos-end p {
          margin: 0;

          color:
            rgba(
              255,
              255,
              255,
              .34
            );

          font-size: 7px;
          font-weight: 950;

          letter-spacing:
            .08em;
        }


        .aos-end button {
          margin-top: 8px;

          height: 25px;

          padding: 0 10px;

          border:
            1px solid
            rgba(
              255,
              196,
              0,
              .18
            );

          border-radius: 5px;

          background:
            rgba(
              255,
              196,
              0,
              .04
            );

          color:
            rgba(
              255,
              196,
              0,
              .62
            );

          font-size: 6px;
          font-weight: 950;

          cursor: pointer;
        }


        /* ===============================================
           THUMB RAIL
           =============================================== */

        .aos-thumb-shell {
          position: absolute;

          left: 0;
          right: 0;

          bottom: 16px;

          height: 48px;

          overflow: hidden;

          z-index: 25;
        }


        :global(
          .aos-thumb-shell
          .ixi-collection-thumb-rail
        ) {
          height: 48px;
        }


        /* ===============================================
           ACTION NOTICE
           =============================================== */

        .aos-action-notice {
          position: absolute;

          left: 10px;
          right: 10px;
          top: 8px;

          min-height: 24px;

          padding: 6px 8px;

          display: flex;

          align-items:
            center;

          justify-content:
            center;

          z-index: 500;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .10
            );

          border-radius: 5px;

          background:
            rgba(
              7,
              7,
              7,
              .94
            );

          color:
            rgba(
              255,
              255,
              255,
              .82
            );

          font-size: 7px;
          font-weight: 950;

          letter-spacing:
            .05em;

          text-align: center;
        }


        .aos-action-notice.tone-success {
          border-color:
            rgba(
              56,
              161,
              105,
              .38
            );
        }


        .aos-action-notice.tone-warning {
          border-color:
            rgba(
              255,
              196,
              0,
              .42
            );
        }


        .aos-action-notice.tone-error {
          border-color:
            rgba(
              229,
              62,
              62,
              .46
            );
        }

      `}</style>

    </section>
  );
}
