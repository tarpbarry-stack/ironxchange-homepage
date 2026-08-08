import {
  useEffect,
  useState
} from "react";

import {
  useDraggable
} from "@dnd-kit/core";

import ListingCard
  from "../ListingCard";

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

import {
  getListingId
} from "../../lib/listingFormatters";


/* =========================================================
   HELPERS
   ========================================================= */

function clean(value) {
  return String(
    value || ""
  ).trim();
}


function formatMoney(value) {
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
      currency: "USD",
      maximumFractionDigits: 0
    }
  );
}


function getMachineTitle(
  machine = {}
) {
  return (
    clean(machine.title) ||

    clean(
      machine.attributes
        ?.title
    ) ||

    [
      machine.year,
      machine.make,
      machine.model
    ]
      .filter(Boolean)
      .join(" ") ||

    "MACHINE"
  );
}


function getMachineImage(
  machine = {}
) {
  return (
    machine.imageUrls?.[0] ||

    machine.images?.[0]?.url ||

    machine.images?.[0]
      ?.attributes
      ?.variants
      ?.default
      ?.url ||

    machine.imageObjects?.[0]
      ?.url ||

    machine.ixiMedia
      ?.imageUrls?.[0] ||

    ""
  );
}


function getMachineLocation(
  machine = {}
) {
  return (
    clean(machine.location) ||

    clean(
      machine.publicData
        ?.location
    ) ||

    clean(
      machine.attributes
        ?.publicData
        ?.location
    ) ||

    ""
  );
}


function getMachineHours(
  machine = {}
) {
  return (
    machine.hours ||

    machine.publicData
      ?.hours ||

    machine.attributes
      ?.publicData
      ?.hours ||

    ""
  );
}


/* =========================================================
   SYSTEM INDEX / COLLECTION CARD
   ========================================================= */

export default function IXISystemIndexCard({
  index,

  objectId,

  dragHandleProps,

  ixiState = {},
  ixiCardState = {},

  onIxiStateChange,

  saved = false,

  armedDestination,

  onSendFront,
  onSendBack,

  onCycleColor,
  onCycleOutline,

  onSendToArmedDestination,

  onExposeObject,

  onOpenConsole
}) {
  const id =
    String(
      objectId ||
      index?.objectId ||
      ""
    );

  const items =
    Array.isArray(
      index?.items
    )
      ? index.items
      : [];


  /* ---------------------------------------------------------
     NORMAL CARD / BOARD STATE
     --------------------------------------------------------- */

  const boardColor =
    ixiState?.color ||
    "none";

  const boardOutline =
    Number(
      ixiState?.outline ?? 1
    );


  /* ---------------------------------------------------------
     COLLECTION DECK STATE
     --------------------------------------------------------- */

  const face =
    Math.max(
      1,
      Number(
        ixiState?.face || 1
      )
    );

  const {
    endDeckFace,
    isIdentityFace,
    isEndDeckFace,
    activeItemIndex,
    activeItem
  } =
    getCollectionDeckState({
      face,
      items
    });


  /*
   * Identity face has its own preview cursor.
   *
   * This does NOT change collection membership
   * and does NOT mean the child has been opened.
   *
   * It is simply "what is on deck."
   */
  const [previewItemIndex,
    setPreviewItemIndex] =
    useState(0);


  useEffect(() => {
    if (
      activeItemIndex >= 0
    ) {
      setPreviewItemIndex(
        activeItemIndex
      );
    }
  }, [activeItemIndex]);


  useEffect(() => {
    if (!items.length) {
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
          items.length - 1
        )
    );
  }, [items.length]);


  const previewItem =
    items[
      previewItemIndex
    ] || null;


  /*
   * Thumbnail rail highlights:
   *
   * Identity face:
   *   current preview/on-deck item
   *
   * Child face:
   *   actual active child
   *
   * End deck:
   *   nothing selected
   */
  const thumbActiveIndex =
    isIdentityFace
      ? (
          items.length
            ? previewItemIndex
            : -1
        )
      : activeItemIndex;


  /* ---------------------------------------------------------
     ACTIVE CHILD DRAG SURFACE
     --------------------------------------------------------- */

  const activeItemId =
    activeItem
      ? String(
          getListingId(
            activeItem
          )
        )
      : "";


  const activeItemIxiState =
    activeItemId
      ? (
          ixiCardState[
            activeItemId
          ] || {}
        )
      : {};


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
          "collection-child",

        objectId:
          activeItemId,

        sourceContainer:
          "system-index",

        sourceParentId:
          id,

        sourceParentType:
          "system-index",

        action:
          "expose"
      }
    });


  /* =========================================================
     FACE CONTROL
     ========================================================= */

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
        items
      })
    );
  }


  /*
   * CENTER BUTTON / FORWARD
   *
   * Special identity behavior:
   *
   * We already have an item selected
   * in the preview window.
   *
   * Therefore CENTER enters that
   * selected child's full card.
   *
   * Once inside the deck,
   * CENTER advances normally.
   */
  function goForward() {
    if (
      isIdentityFace &&
      items.length
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
        items
      })
    );
  }


  /*
   * RIGHT-OF-CENTER / BACKWARD
   */
  function goBackward() {
    setFace(
      getPreviousCollectionFace({
        face,
        items
      })
    );
  }


  /* =========================================================
     THUMBNAIL CONTROL
     ========================================================= */

  function selectThumb(
    item,
    itemIndex
  ) {
    /*
     * On identity:
     *
     * thumbnail selection ONLY changes
     * what is previewed.
     *
     * It does not enter the child.
     */
    if (isIdentityFace) {
      setPreviewItemIndex(
        itemIndex
      );

      return;
    }

    /*
     * Once browsing full children,
     * thumbnail click is direct navigation.
     */
    setFace(
      getCollectionFaceForItemIndex(
        itemIndex
      )
    );
  }


  /* =========================================================
     IDENTITY PREVIEW NAVIGATION
     ========================================================= */

  function previewPrevious(
    event
  ) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (!items.length) {
      return;
    }

    setPreviewItemIndex(
      current =>
        current <= 0
          ? items.length - 1
          : current - 1
    );
  }


  function previewNext(
    event
  ) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (!items.length) {
      return;
    }

    setPreviewItemIndex(
      current =>
        current >=
        items.length - 1
          ? 0
          : current + 1
    );
  }


  /* =========================================================
     CONSOLE
     ========================================================= */

  function openConsole(
    event
  ) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    onOpenConsole?.(
      index
    );
  }


  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <section
      className={[
        "system-index-card",
        "card",
        `board-color-${
          boardColor || "none"
        }`,
        `board-outline-${
          boardOutline || 1
        }`
      ].join(" ")}

      {...(
        isIdentityFace
          ? dragHandleProps ||
            {}
          : {}
      )}
    >

      {/* =====================================================
          MAIN FACE
          ===================================================== */}

      <div className="system-index-face">

        {/* ---------------------------------------------------
            FACE 1 — INDEX IDENTITY + LARGE PREVIEW
            --------------------------------------------------- */}

        {isIdentityFace ? (
          <div className="system-index-identity">

            <div className="index-topline">
              <div className="index-heading">
                <span>
                  SYSTEM INDEX
                </span>

                <h3>
                  {index?.displayName ||
                    index?.label ||
                    "INDEX"}
                </h3>
              </div>

              <div className="index-count">
                {items.length}
              </div>
            </div>


            {/* ---------- LARGE ACTIVE PREVIEW ---------- */}

            <div className="index-preview">

              {previewItem ? (
                <>
                  <div className="preview-photo">
                    {getMachineImage(
                      previewItem
                    ) ? (
                      <img
                        src={
                          getMachineImage(
                            previewItem
                          )
                        }

                        alt={
                          getMachineTitle(
                            previewItem
                          )
                        }

                        draggable={
                          false
                        }
                      />
                    ) : (
                      <div className="preview-photo-empty">
                        {index?.displayName ||
                          "OBJECT"}
                      </div>
                    )}


                    <div className="preview-position">
                      {previewItemIndex + 1}
                      {" / "}
                      {items.length}
                    </div>
                  </div>


                  <div className="preview-info">

                    <button
                      type="button"
                      className="preview-arrow preview-prev"
                      onPointerDown={
                        event =>
                          event.stopPropagation()
                      }
                      onClick={
                        previewPrevious
                      }
                      aria-label="Previous item"
                    >
                      ‹
                    </button>


                    <div className="preview-copy">

                      <strong>
                        {getMachineTitle(
                          previewItem
                        )}
                      </strong>

                      <div className="preview-meta">
                        {getMachineHours(
                          previewItem
                        ) ? (
                          <span>
                            {getMachineHours(
                              previewItem
                            )}
                            {" HRS"}
                          </span>
                        ) : null}

                        {getMachineLocation(
                          previewItem
                        ) ? (
                          <span>
                            {getMachineLocation(
                              previewItem
                            )}
                          </span>
                        ) : null}
                      </div>
<button
  type="button"
  className="preview-pull"
  onPointerDown={event => {
    event.preventDefault();
    event.stopPropagation();
  }}
  onClick={event => {
    event.preventDefault();
    event.stopPropagation();

    if (!previewItem) {
      return;
    }

    onExposeObject?.(
      previewItem,
      index
    );
  }}
>
  OUT
</button>
                    </div>


                    <button
                      type="button"
                      className="preview-arrow preview-next"
                      onPointerDown={
                        event =>
                          event.stopPropagation()
                      }
                      onClick={
                        previewNext
                      }
                      aria-label="Next item"
                    >
                      ›
                    </button>

                  </div>
                </>
              ) : (
                <div className="index-empty">
                  <span>
                    EMPTY
                  </span>

                  <strong>
                    {index?.displayName ||
                      index?.label ||
                      "INDEX"}
                  </strong>
                </div>
              )}

            </div>


            {/* ---------- SMALL SNAPSHOT ---------- */}

            <div className="index-snapshot">

              <div>
                <span>
                  OBJECTS
                </span>

                <strong>
                  {items.length}
                </strong>
              </div>

              <div>
                <span>
                  VALUE
                </span>

                <strong>
                  {formatMoney(
                    index?.value
                  )}
                </strong>
              </div>


              <button
                type="button"
                className="index-console-button"
                onPointerDown={
                  event =>
                    event.stopPropagation()
                }
                onClick={
                  openConsole
                }
              >
                OPEN
              </button>

            </div>

          </div>


        /* ---------------------------------------------------
           CHILD FACE — REAL MACHINE CARD
           --------------------------------------------------- */

        ) : activeItem ? (

          <div
            ref={
              setChildDragNodeRef
            }

            className={`system-index-child ${
              isChildDragging
                ? "is-dragging"
                : ""
            }`}

            {...childDragAttributes}
            {...childDragListeners}
          >

         <ListingCard
  key={String(
    getListingId(activeItem)
  )}

  listing={activeItem}

  cardContext="workspace"

  saved={false}
  showSave={false}

  machineFace={1}

  showMachineRail={false}

  useDndDrag={false}

  ixiState={
    activeItemIxiState
  }
/>
          </div>


        /* ---------------------------------------------------
           END DECK
           --------------------------------------------------- */

        ) : (

          <div className="system-index-end">

            <span>
              END DECK
            </span>

            <strong>
              {items.length}
            </strong>

            <p>
              OBJECTS REVIEWED
            </p>

            <button
              type="button"
              onPointerDown={
                event =>
                  event.stopPropagation()
              }
              onClick={
                openConsole
              }
            >
              OPEN INDEX
            </button>

          </div>

        )}

      </div>


      {/* =====================================================
          MOVING THUMB / ON-DECK RAIL
          ===================================================== */}

      <div className="system-index-thumb-shell">

        <IXICollectionThumbRail
          items={items}

          activeItemIndex={
            thumbActiveIndex
          }

          getItemId={item =>
            String(
              getListingId(
                item
              )
            )
          }

          getItemImage={
            getMachineImage
          }

          getItemLabel={
            getMachineTitle
          }

          onSelectItem={
            selectThumb
          }
        />

      </div>


      {/* =====================================================
          EXISTING IXI MACHINE RAIL
          ===================================================== */}

      <IXIMachineRail
        listing={index}

        saved={saved}

        boardColor={
          boardColor
        }

        boardOutline={
          boardOutline
        }

        machineFace={
          face
        }

        /*
         * IDENTITY:
         * center is available.
         *
         * CHILD:
         * home, next, previous, end all available.
         */
        railMode={
          isIdentityFace
            ? "next-lit"
            : "home-lit next-lit prev-lit end-lit"
        }

        /*
         * CENTER
         * forward / enter selected preview
         */
        onCycleMachineFace={
          goForward
        }

        /*
         * RIGHT OF CENTER
         * backward
         */
        onRailSend={
          goBackward
        }

        /*
         * LEFT HALF
         * first / identity
         */
        onSendFront={
          isIdentityFace
            ? onSendFront
            : goHome
        }

        /*
         * RIGHT HALF
         * last / end deck
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
         * SYNC / armed destination.
         *
         * We do NOT change Equipment
         * membership here.
         *
         * Active child may be exposed /
         * operated elsewhere.
         */
        onSendToArmedDestination={() => {
          if (!activeItem) {
            return;
          }

          onSendToArmedDestination?.(
            activeItem
          );

          onExposeObject?.(
            activeItem,
            index
          );
        }}
      />


      {/* =====================================================
          STYLE
          ===================================================== */}

      <style jsx>{`

        .system-index-card,
        .system-index-card * {
          box-sizing:
            border-box;
        }


        /* ===============================================
           V12 COLLECTION SHELL
           =============================================== */

        .system-index-card {
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


        /* ---------- board outline states ---------- */

        .system-index-card.board-outline-1 {
          outline-width: 1px;
        }

        .system-index-card.board-outline-3 {
          outline-width: 3px;
        }

        .system-index-card.board-outline-5 {
          outline-width: 5px;
        }

        .system-index-card.board-outline-0 {
          outline-width: 0;
        }


        .system-index-card.board-color-none {
          outline-color:
            rgba(
              255,
              255,
              255,
              .018
            );
        }

        .system-index-card.board-color-green {
          outline-color:
            rgba(
              56,
              161,
              105,
              .95
            );
        }

        .system-index-card.board-color-yellow {
          outline-color:
            rgba(
              255,
              196,
              0,
              .95
            );
        }

        .system-index-card.board-color-red {
          outline-color:
            rgba(
              229,
              62,
              62,
              .95
            );
        }

        .system-index-card.board-color-cyan {
          outline-color:
            rgba(
              0,
              194,
              255,
              .95
            );
        }

        .system-index-card.board-color-white {
          outline-color:
            rgba(
              255,
              255,
              255,
              .85
            );
        }

        .system-index-card.board-color-blue {
          outline-color:
            rgba(
              49,
              130,
              206,
              .95
            );
        }

        .system-index-card.board-color-orange {
          outline-color:
            rgba(
              249,
              133,
              18,
              .95
            );
        }


        /* ===============================================
           FACE WINDOW
           16 rail + 48 thumb rail
           =============================================== */

        .system-index-face {
          position: absolute;

          left: 0;
          right: 0;
          top: 0;

          bottom: 64px;

          overflow: hidden;
        }


        /* ===============================================
           IDENTITY FACE
           =============================================== */

        .system-index-identity {
          width: 100%;
          height: 100%;

          padding:
            12px 12px 8px;

          display: flex;
          flex-direction: column;

          min-height: 0;
        }


        .index-topline {
          height: 38px;
          min-height: 38px;

          position: relative;

          display: flex;
          align-items: flex-start;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .045
            );
        }


        .index-heading {
          min-width: 0;
        }


        .index-heading span {
          display: block;

          color: #ffc400;

          font-size: 6.5px;
          font-weight: 950;

          letter-spacing:
            .09em;

          text-transform:
            uppercase;
        }


        .index-heading h3 {
          margin:
            4px 0 0;

          max-width: 220px;

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


        .index-count {
          position: absolute;

          right: 0;
          top: 2px;

          color:
            rgba(
              255,
              255,
              255,
              .26
            );

          font-size: 8px;
          font-weight: 950;
        }


        /* ===============================================
           LARGE PREVIEW
           =============================================== */

        .index-preview {
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


        .preview-photo {
          position: relative;

          width: 100%;
          height: 137px;

          overflow: hidden;

          background: #090909;
        }


        .preview-photo img {
          width: 100%;
          height: 100%;

          display: block;

          object-fit: cover;
        }


        .preview-photo-empty {
          width: 100%;
          height: 100%;

          display: flex;

          align-items: center;
          justify-content: center;

          color:
            rgba(
              255,
              255,
              255,
              .12
            );

          font-size: 10px;
          font-weight: 950;

          letter-spacing:
            .08em;
        }


        .preview-position {
          position: absolute;

          right: 7px;
          top: 7px;

          height: 17px;

          padding: 0 6px;

          display: flex;

          align-items: center;
          justify-content: center;

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


        .preview-info {
          height: 52px;

          display: grid;

          20px
  minmax(0, 1fr)
  30px
  20px;

          align-items: center;

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

.preview-pull {
  height: 24px;

  padding: 0;

  border:
    1px solid
    rgba(0,194,255,.18);

  border-radius: 4px;

  background:
    rgba(0,194,255,.035);

  color:
    rgba(0,194,255,.62);

  font-size: 5.5px;
  font-weight: 950;

  cursor: pointer;
}

.preview-pull:hover {
  border-color:
    rgba(0,194,255,.46);

  background:
    rgba(0,194,255,.08);

  color:
    rgba(0,194,255,.95);
}
        .preview-copy {
          min-width: 0;

          padding: 0 4px;
        }


        .preview-copy strong {
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

          white-space: nowrap;
        }


        .preview-meta {
          margin-top: 4px;

          display: flex;

          align-items: center;

          gap: 8px;

          overflow: hidden;
        }


        .preview-meta span {
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

          white-space: nowrap;
        }


        .preview-arrow {
          width: 20px;
          height: 100%;

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


        .preview-arrow:hover {
          color: #ffc400;

          background:
            rgba(
              255,
              196,
              0,
              .025
            );
        }


        /* ===============================================
           SNAPSHOT / CONSOLE ACTUATOR
           =============================================== */

        .index-snapshot {
          min-height: 50px;

          margin-top: 7px;

          display: grid;

          grid-template-columns:
            1fr
            1.3fr
            42px;

          gap: 5px;
        }


        .index-snapshot > div {
          min-width: 0;

          padding:
            6px 7px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .045
            );

          border-radius: 5px;

          background:
            rgba(
              0,
              0,
              0,
              .20
            );
        }


        .index-snapshot span {
          display: block;

          color:
            rgba(
              255,
              255,
              255,
              .24
            );

          font-size: 5.5px;
          font-weight: 950;

          letter-spacing:
            .06em;
        }


        .index-snapshot strong {
          display: block;

          margin-top: 4px;

          overflow: hidden;

          color:
            rgba(
              255,
              255,
              255,
              .70
            );

          font-size: 8px;
          font-weight: 950;

          text-overflow:
            ellipsis;

          white-space: nowrap;
        }


        .index-console-button {
          border:
            1px solid
            rgba(
              255,
              196,
              0,
              .14
            );

          border-radius: 5px;

          background:
            rgba(
              255,
              196,
              0,
              .035
            );

          color:
            rgba(
              255,
              196,
              0,
              .58
            );

          font-size: 5.5px;
          font-weight: 950;

          letter-spacing:
            .06em;

          cursor: pointer;
        }


        .index-console-button:hover {
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
              .08
            );

          color: #ffc400;
        }


        /* ===============================================
           EMPTY
           =============================================== */

        .index-empty {
          height: 100%;

          display: flex;

          flex-direction: column;

          align-items: center;
          justify-content: center;

          gap: 7px;
        }


        .index-empty span {
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


        .index-empty strong {
          color:
            rgba(
              255,
              255,
              255,
              .20
            );

          font-size: 12px;
          font-weight: 950;
        }


        /* ===============================================
           REAL CHILD CARD FACE
           =============================================== */

        .system-index-child {
          width: 100%;
          height: 100%;

          overflow: hidden;

          cursor: grab;

          touch-action: none;
        }


        .system-index-child.is-dragging {
          opacity: .42;
        }


        /*
         * ListingCard normally owns the entire card.
         * It is intentionally clipped above our
         * shared thumb + command rails.
         */
        .system-index-child
        :global(.card) {
          width: 100% !important;
          max-width: none !important;

          height: 100% !important;
          min-height: 100% !important;

          border-radius:
            13px 13px 0 0 !important;
        }


        /* ===============================================
           END DECK
           =============================================== */

        .system-index-end {
          width: 100%;
          height: 100%;

          display: flex;

          flex-direction: column;

          align-items: center;
          justify-content: center;

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


        .system-index-end span {
          color: #ffc400;

          font-size: 9px;
          font-weight: 950;

          letter-spacing:
            .12em;
        }


        .system-index-end strong {
          color: #f4f4f4;

          font-size: 42px;
          font-weight: 950;

          line-height: 1;
        }


        .system-index-end p {
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


        .system-index-end button {
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


        .system-index-end button:hover {
          color: #ffc400;

          border-color:
            rgba(
              255,
              196,
              0,
              .42
            );
        }


        /* ===============================================
           THUMB FILMSTRIP
           =============================================== */

        .system-index-thumb-shell {
          position: absolute;

          left: 0;
          right: 0;

          bottom: 16px;

          height: 48px;

          overflow: hidden;

          z-index: 25;
        }


        :global(
          .system-index-thumb-shell
          .ixi-collection-thumb-rail
        ) {
          height: 48px;
        }

      `}</style>

    </section>
  );
}
