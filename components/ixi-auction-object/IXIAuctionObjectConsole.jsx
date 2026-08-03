import IXIScaledCardShell
  from "../ixi-machine-object/IXIScaledCardShell";

import IXIObjectCardActuator
  from "../ixi-chassis/IXIObjectCardActuator";

import IXIAuctionObjectFace2
  from "./IXIAuctionObjectFace2";

import IXIAuctionObjectFace3
  from "./IXIAuctionObjectFace3";

import IXIAuctionObjectFace4
  from "./IXIAuctionObjectFace4";

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

export default function IXIAuctionObjectConsole({
  objectId,
  objectId,
  item,

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

  const childCard = (
    <div className="ixi-console-child-card">
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
        onClick={event =>
          toggleObjectConsoleSide(
            side,
            event
          )
        }
      />

      {renderAuctionFace(face)}

      <button
        type="button"
        className="ixi-console-child-face-button"
        aria-label={
          isLeft
            ? "Change left auction face"
            : "Change right auction face"
        }
        title={`Auction face ${face}`}
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
    className={`ixi-console-child-wrap ${
      isLeft
        ? "left-child"
        : "right-child"
    }`}
  >
    {childCard}
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
  
    const consoleNativePanelWidth =
  298;

const consoleOverlap =
  1;

const consoleNativeWidth =
  (
    consoleDepth *
    consoleNativePanelWidth
  ) -
  (
    Math.max(
      consoleDepth - 1,
      0
    ) *
    consoleOverlap
  );

const consoleNativeHeight =
  471;

const assembledConsole = (
  <div
    className="ixi-object-console"
    style={{
      width:
        `${consoleNativeWidth}px`
    }}
  >
    {consoleLeftOpen
  ? renderConsolePanel("left")
  : null}

    <div className="ixi-object-console-parent">
      {parentCard}
    </div>

   {consoleRightOpen
  ? renderConsolePanel("right")
  : null}

    <style jsx global>{`
      .ixi-object-console {
        position: relative;

        display: flex;
        flex-direction: row;
        align-items: flex-start;

        gap: 0;

        overflow: visible;
      }

     .ixi-object-console-parent {
  position: relative;

  flex: 0 0 298px;

  width: 298px;
  min-width: 298px;
  max-width: 298px;

  overflow: visible;
}

      .ixi-console-child-wrap {
  position: relative;

  flex: 0 0 298px;

  width: 298px;
  min-width: 298px;
  max-width: 298px;

  overflow: visible;
}

      .ixi-console-child-wrap.left-child {
        margin-right: -1px;
      }

      .ixi-console-child-wrap.right-child {
        margin-left: -1px;
      }

      .ixi-console-child-card {
  box-sizing: border-box;

  width: 298px;
  min-width: 298px;
  max-width: 298px;

  height: 471px;
  min-height: 471px;
  max-height: 471px;

        position: relative;

        border:
          1px solid
          rgba(255, 255, 255, .10);

        border-radius: 13px;

        background:
          linear-gradient(
            180deg,
            rgba(28, 31, 36, .98),
            rgba(15, 17, 20, .98)
          );

        box-shadow:
          0 10px 28px
            rgba(0, 0, 0, .34),
          inset 0 1px 0
            rgba(255, 255, 255, .04);

        overflow: visible;
      }

      .ixi-console-child-face-button {
        position: absolute;

        left: 50%;
        right: auto;
        bottom: -1px;

        width: 34px;
        height: 5px;

        transform: translateX(-50%);

        padding: 0;
        border: 0;

        border-radius:
          3px 3px 1px 1px;

        background:
          rgba(255, 255, 255, .18);

        cursor: pointer;

        z-index: 120;
        pointer-events: auto;

        box-shadow:
          inset 0 1px 0
            rgba(255, 255, 255, .12),
          0 1px 3px
            rgba(0, 0, 0, .32);
      }

      .ixi-console-child-face-button:hover {
        background:
          rgba(255, 196, 0, .95);

        box-shadow:
          0 0 8px
            rgba(255, 196, 0, .38);
      }
    `}</style>
  </div>
);

return enableCardScaling ? (
 <IXIScaledCardShell
  size={cardScaleMode}
 objectFamily="auction"
  nativeWidth={
    consoleNativeWidth
  }
  nativeHeight={
    consoleNativeHeight
  }
>
    {assembledConsole}
  </IXIScaledCardShell>
) : (
  assembledConsole
);
}
