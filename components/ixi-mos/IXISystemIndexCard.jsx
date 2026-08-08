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


function clean(value) {
  return String(
    value || ""
  ).trim();
}


function formatMoney(
  value
) {
  const amount =
    Number(value || 0);

  if (!Number.isFinite(amount)) {
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

    ""
  );
}


function getMachineLabel(
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

  onExposeObject
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

  const face =
    Number(
      ixiState?.face || 1
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
      ? ixiCardState[
          activeItemId
        ] || {}
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


  function setFace(
    nextFace
  ) {
    onIxiStateChange?.(
      id,
      {
        face: nextFace
      }
    );
  }


  function nextFace() {
    setFace(
      getNextCollectionFace({
        face,
        items
      })
    );
  }


  function previousFace() {
    setFace(
      getPreviousCollectionFace({
        face,
        items
      })
    );
  }


  function firstFace() {
    setFace(
      getFirstCollectionFace()
    );
  }


  function lastFace() {
    setFace(
      getLastCollectionFace({
        items
      })
    );
  }


  function selectItem(
    item,
    itemIndex
  ) {
    setFace(
      getCollectionFaceForItemIndex(
        itemIndex
      )
    );
  }


  return (
    <section
      className="system-index-card card"

      {...(
        isIdentityFace
          ? dragHandleProps ||
            {}
          : {}
      )}
    >
      <div className="system-index-face">
        {isIdentityFace ? (
          <div className="system-index-identity">
            <div className="index-kicker">
              SYSTEM INDEX
            </div>

            <h3>
              {index?.displayName ||
                index?.label ||
                "INDEX"}
            </h3>

            <div className="index-stats">
              <div>
                <strong>
                  {items.length}
                </strong>

                <span>
                  Objects
                </span>
              </div>

              <div>
                <strong>
                  {formatMoney(
                    index?.value
                  )}
                </strong>

                <span>
                  Value
                </span>
              </div>
            </div>

            <div className="index-hint">
              BROWSE BELOW
            </div>
          </div>
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
              listing={
                activeItem
              }

              saved={false}

              showSave={false}

              machineFace={1}

              useDndDrag={false}

              ixiState={
                activeItemIxiState
              }
            />
          </div>
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
          </div>
        )}
      </div>


      <IXICollectionThumbRail
        items={items}

        activeItemIndex={
          activeItemIndex
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
          getMachineLabel
        }

        onSelectItem={
          selectItem
        }
      />


      <IXIMachineRail
        listing={index}

        saved={saved}

        machineFace={face}

        railMode={
          isIdentityFace
            ? "next-lit"
            : "home-lit next-lit prev-lit end-lit"
        }

        onCycleMachineFace={
          nextFace
        }

        onRailSend={
          previousFace
        }

        onSendFront={
          isIdentityFace
            ? onSendFront
            : firstFace
        }

        onSendBack={
          isIdentityFace
            ? onSendBack
            : lastFace
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


      <style jsx>{`
        .system-index-card,
        .system-index-card * {
          box-sizing:
            border-box;
        }

        .system-index-card {
          position: relative;

          width: 298px;
          min-width: 298px;
          max-width: 298px;

          height: 391px;
          min-height: 391px;
          max-height: 391px;

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

        .system-index-face {
          position: absolute;

          left: 0;
          right: 0;
          top: 0;

          bottom: 64px;

          overflow: hidden;
        }

        .system-index-identity {
          width: 100%;
          height: 100%;

          padding:
            18px 16px;

          display: flex;
          flex-direction: column;
        }

        .index-kicker {
          color: #ffc400;

          font-size: 8px;
          font-weight: 950;
          letter-spacing:
            .08em;
        }

        .system-index-identity h3 {
          margin:
            7px 0 0;

          color: #f4f4f4;

          font-size: 22px;
          font-weight: 950;

          line-height: 1;

          text-transform:
            uppercase;
        }

        .index-stats {
          margin-top: 30px;

          display: grid;

          grid-template-columns:
            1fr;

          gap: 12px;
        }

        .index-stats div {
          padding:
            14px 12px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .06
            );

          border-radius:
            10px;

          background:
            rgba(
              0,
              0,
              0,
              .26
            );
        }

        .index-stats strong {
          display: block;

          color: #f2f2f2;

          font-size: 23px;
          font-weight: 950;

          line-height: 1;
        }

        .index-stats span {
          display: block;

          margin-top: 6px;

          color:
            rgba(
              255,
              255,
              255,
              .38
            );

          font-size: 8px;
          font-weight: 950;

          letter-spacing:
            .08em;

          text-transform:
            uppercase;
        }

        .index-hint {
          margin-top: auto;

          color:
            rgba(
              255,
              255,
              255,
              .20
            );

          font-size: 7px;
          font-weight: 950;

          letter-spacing:
            .10em;
        }

        .system-index-child {
          width: 100%;
          height: 100%;

          overflow: hidden;

          cursor: grab;

          touch-action:
            none;
        }

        .system-index-child.is-dragging {
          opacity: .42;
        }

        .system-index-end {
          width: 100%;
          height: 100%;

          display: flex;
          flex-direction: column;

          align-items:
            center;

          justify-content:
            center;

          gap: 8px;

          background:
            radial-gradient(
              circle
              at center,
              rgba(
                255,
                196,
                0,
                .08
              ),
              transparent
                55%
            ),
            #101010;

          text-align:
            center;
        }

        .system-index-end span {
          color: #ffc400;

          font-size: 10px;
          font-weight: 950;

          letter-spacing:
            .12em;
        }

        .system-index-end strong {
          color: #f4f4f4;

          font-size: 44px;
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
              .38
            );

          font-size: 9px;
          font-weight: 950;

          letter-spacing:
            .08em;
        }

        :global(
          .system-index-card
          .ixi-collection-thumb-rail
        ) {
          position: absolute;

          left: 0;
          right: 0;

          bottom: 16px;

          z-index: 25;
        }
      `}</style>
    </section>
  );
}
