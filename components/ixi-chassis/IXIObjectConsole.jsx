import IXIScaledCardShell
  from "../ixi-machine-object/IXIScaledCardShell";

import IXIObjectCardActuator
  from "./IXIObjectCardActuator";

import IXIAuctionObjectFace2
  from "../ixi-auction-object/IXIAuctionObjectFace2";

import IXIAuctionObjectFace3
  from "../ixi-auction-object/IXIAuctionObjectFace3";

import IXIAuctionObjectFace4
  from "../ixi-auction-object/IXIAuctionObjectFace4";

const AUCTION_FACE_MIN = 2;
const AUCTION_FACE_MAX = 4;

function normalizeAuctionFace(
  value,
  fallback = AUCTION_FACE_MIN
) {
  const face = Number(value);

  return [
    2,
    3,
    4
  ].includes(face)
    ? face
    : fallback;
}

function getNextAuctionFace(
  currentFace
) {
  const current =
    normalizeAuctionFace(
      currentFace
    );

  return current >= AUCTION_FACE_MAX
    ? AUCTION_FACE_MIN
    : current + 1;
}

export default function IXIObjectConsole({
  objectId,
  item,

  cardFamily = "marketplace",
  sellerCardProps = {},

  ixiCardState = {},
  updateIxiCardState,

  enableCardScaling = false,
  cardScaleMode = "xl",

  dragHandleProps,

  renderParentCard
}) {
  const id =
    String(objectId || "");

  const objectState =
    ixiCardState?.[id] || {};

  const isAuctionCard =
    cardFamily === "auction";

  const consoleLeftOpen =
    objectState.consoleLeftOpen ===
    true;

  const consoleRightOpen =
    objectState.consoleRightOpen ===
    true;

  const consoleLeftFace =
    normalizeAuctionFace(
      objectState.consoleLeftFace
    );

  const consoleRightFace =
    normalizeAuctionFace(
      objectState.consoleRightFace
    );

  const consoleDepth =
    1 +
    (consoleLeftOpen ? 1 : 0) +
    (consoleRightOpen ? 1 : 0);

  function patchObjectState(
    patch = {}
  ) {
    if (!id) return;

    updateIxiCardState?.(
      id,
      {
        ...patch,

        consoleUpdatedAt:
          Date.now()
      }
    );
  }

  function toggleObjectConsoleSide(
    side,
    event
  ) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    const nextLeftOpen =
      side === "left"
        ? !consoleLeftOpen
        : consoleLeftOpen;

    const nextRightOpen =
      side === "right"
        ? !consoleRightOpen
        : consoleRightOpen;

    const nextDepth =
      1 +
      (nextLeftOpen ? 1 : 0) +
      (nextRightOpen ? 1 : 0);

    patchObjectState({
      consoleLeftOpen:
        nextLeftOpen,

      consoleRightOpen:
        nextRightOpen,

      consoleDepth:
        nextDepth,

      consoleOpen:
        nextDepth > 1
    });
  }

  function cycleLeftConsoleFace(
    event
  ) {
    event.preventDefault();
    event.stopPropagation();

    patchObjectState({
      consoleLeftFace:
        getNextAuctionFace(
          consoleLeftFace
        )
    });
  }

  function cycleRightConsoleFace(
    event
  ) {
    event.preventDefault();
    event.stopPropagation();

    patchObjectState({
      consoleRightFace:
        getNextAuctionFace(
          consoleRightFace
        )
    });
  }

  function renderAuctionFace(
    face
  ) {
    if (face === 3) {
      return (
        <IXIAuctionObjectFace3
          listing={item}
          dragHandleProps={
            dragHandleProps
          }
        />
      );
    }

    if (face === 4) {
      return (
        <IXIAuctionObjectFace4
          listing={item}
          dragHandleProps={
            dragHandleProps
          }
          auctionDispositionBusy={
            sellerCardProps
              .auctionDispositionBusy
          }
          onAuctionDisposition={
            sellerCardProps
              .onAuctionDisposition
          }
        />
      );
    }

    return (
      <IXIAuctionObjectFace2
        listing={item}

        sourceListingUrl={
          sellerCardProps
            .sourceListingUrl ||
          ""
        }

        dragHandleProps={
          dragHandleProps
        }

        sellerMode={true}

        lotNumberValue={
          sellerCardProps
            .lotNumberValue
        }

        onLotNumberChange={
          sellerCardProps
            .onLotNumberChange
        }

        onLotNumberKeyDown={
          sellerCardProps
            .onLotNumberKeyDown
        }

        hoursValue={
          sellerCardProps
            .hoursValue
        }

        onHoursChange={
          sellerCardProps
            .onHoursChange
        }

        onHoursKeyDown={
          sellerCardProps
            .onHoursKeyDown
        }

        openingBidValue={
          sellerCardProps
            .priceValue
        }

        onOpeningBidChange={
          sellerCardProps
            .onPriceChange
        }

        onOpeningBidKeyDown={
          sellerCardProps
            .onPriceKeyDown
        }
      />
    );
  }

  function renderConsolePanel(
    side
  ) {
    const isLeft =
      side === "left";

    const face =
      isLeft
        ? consoleLeftFace
        : consoleRightFace;

    const cycleFace =
      isLeft
        ? cycleLeftConsoleFace
        : cycleRightConsoleFace;

    const closeSide =
      event =>
        toggleObjectConsoleSide(
          side,
          event
        );

    const panel = (
      <div className="ixi-object-console-panel">
        <IXIObjectCardActuator
          side={
            isLeft
              ? "right"
              : "left"
          }
          label={
            isLeft
              ? "Close console left"
              : "Close console right"
          }
          title={
            isLeft
              ? "Close console left"
              : "Close console right"
          }
          onClick={closeSide}
        />

        {renderAuctionFace(face)}

        <button
          type="button"
          className="ixi-object-console-face-button"
          aria-label={
            isLeft
              ? "Change left auction face"
              : "Change right auction face"
          }
          title={
            `Auction face ${face}`
          }
          onPointerDown={event => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={cycleFace}
        />
      </div>
    );

    return (
      <div
        className={`ixi-object-console-panel-wrap ${
          isLeft
            ? "left-panel"
            : "right-panel"
        }`}
      >
        {enableCardScaling ? (
          <IXIScaledCardShell
            size={cardScaleMode}
          >
            {panel}
          </IXIScaledCardShell>
        ) : (
          panel
        )}
      </div>
    );
  }

  const parentCard =
    typeof renderParentCard ===
    "function"
      ? renderParentCard({
          consoleDepth,

          consoleLeftOpen,
          consoleRightOpen,

          onExpandConsoleLeft:
            event =>
              toggleObjectConsoleSide(
                "left",
                event
              ),

          onExpandConsoleRight:
            event =>
              toggleObjectConsoleSide(
                "right",
                event
              )
        })
      : null;

  return (
    <div className="ixi-object-console">
      {consoleLeftOpen &&
      isAuctionCard
        ? renderConsolePanel(
            "left"
          )
        : null}

      <div className="ixi-object-console-parent">
        {enableCardScaling ? (
          <IXIScaledCardShell
            size={cardScaleMode}
          >
            {parentCard}
          </IXIScaledCardShell>
        ) : (
          parentCard
        )}
      </div>

      {consoleRightOpen &&
      isAuctionCard
        ? renderConsolePanel(
            "right"
          )
        : null}

      <style jsx>{`
        .ixi-object-console {
          position: relative;

          width: 100%;

          display: flex;
          flex-direction: row;
          align-items: flex-start;

          gap: 0;

          overflow: visible;
        }

        .ixi-object-console-parent {
          position: relative;
          flex: 0 0 auto;
          min-width: 0;
        }

        .ixi-object-console-panel-wrap {
          position: relative;
          flex: 0 0 auto;
          min-width: 0;
        }

        .ixi-object-console-panel-wrap.left-panel {
          margin-right: -1px;
        }

        .ixi-object-console-panel-wrap.right-panel {
          margin-left: -1px;
        }

        .ixi-object-console-panel {
          box-sizing: border-box;

          width: 100%;

          height: 471px;
          min-height: 471px;
          max-height: 471px;

          position: relative;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .10
            );

          border-radius: 13px;

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

        .ixi-object-console-face-button {
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
            rgba(
              255,
              255,
              255,
              .18
            );

          cursor: pointer;

          z-index: 120;
          pointer-events: auto;

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

        .ixi-object-console-face-button:hover {
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
}
