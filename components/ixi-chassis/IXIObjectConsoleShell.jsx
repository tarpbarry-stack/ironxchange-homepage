export default function IXIObjectConsoleShell({
  slots = [],

  panelWidth = 300,
  panelGap = 0,

  maxSlots = 4,

  renderPanel,

  onInsertAfter,
  onRemoveSlot,
  onCycleSlotFace
}) {
  const safeSlots =
    Array.isArray(slots) &&
    slots.length
      ? slots
      : [
          {
            slotId: "slot-1",
            face: 1
          }
        ];

  const shellWidth =
    (
      safeSlots.length *
      panelWidth
    ) +
    (
      Math.max(
        safeSlots.length - 1,
        0
      ) *
      panelGap
    );

  return (
    <div
      className="ixi-console-shell"
      style={{
        width: `${shellWidth}px`
      }}
      data-ixi-console-depth={
        safeSlots.length
      }
    >
      <div
        className="ixi-console-panels"
        style={{
          gap: `${panelGap}px`
        }}
      >
        {safeSlots.map(
          (
            slot,
            slotIndex
          ) => {
            const slotId =
              String(
                slot?.slotId ||
                `slot-${slotIndex + 1}`
              );

            const face =
              Math.max(
                1,
                Number(slot?.face) || 1
              );

            const canRemove =
              safeSlots.length > 1;

            const canInsert =
              safeSlots.length <
              maxSlots;

            return (
              <section
                key={slotId}
                className="ixi-console-slot"
                style={{
                  width:
                    `${panelWidth}px`,

                  flexBasis:
                    `${panelWidth}px`
                }}
                data-ixi-console-slot={
                  slotId
                }
                data-ixi-console-face={
                  face
                }
              >
                <button
                  type="button"
                  className={[
                    "ixi-console-edge-button",
                    "left",
                    canRemove
                      ? "is-live"
                      : "is-dormant"
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  disabled={!canRemove}
                  aria-label={
                    "Close console panel"
                  }
                  title={
                    "Close panel"
                  }
                  onPointerDown={event => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onClick={event => {
                    event.preventDefault();
                    event.stopPropagation();

                    if (!canRemove) {
                      return;
                    }

                    onRemoveSlot?.(
                      slotId
                    );
                  }}
                />

                <div className="ixi-console-panel-content">
                  {typeof renderPanel ===
                  "function"
                    ? renderPanel({
                        slot,
                        slotId,
                        slotIndex,
                        face
                      })
                    : null}
                </div>

                <button
                  type="button"
                  className={[
                    "ixi-console-edge-button",
                    "right",
                    canInsert
                      ? "is-live"
                      : "is-dormant"
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  disabled={!canInsert}
                  aria-label={
                    "Open console panel"
                  }
                  title={
                    "Open panel"
                  }
                  onPointerDown={event => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onClick={event => {
                    event.preventDefault();
                    event.stopPropagation();

                    if (!canInsert) {
                      return;
                    }

                    onInsertAfter?.(
                      slotId
                    );
                  }}
                />

                <button
                  type="button"
                  className="ixi-console-face-button"
                  aria-label={
                    "Change console face"
                  }
                  title={
                    `Change face — current Face ${face}`
                  }
                  onPointerDown={event => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onClick={event => {
                    event.preventDefault();
                    event.stopPropagation();

                    onCycleSlotFace?.(
                      slotId
                    );
                  }}
                >
                  <span />
                </button>
              </section>
            );
          }
        )}
      </div>

      <style jsx>{`
        .ixi-console-shell,
        .ixi-console-shell * {
          box-sizing: border-box;
        }

        .ixi-console-shell {
          position: relative;

          max-width: none;
          min-width: 0;

          overflow: visible;
        }

        .ixi-console-panels {
          width: 100%;

          display: flex;
          align-items: stretch;

          overflow: visible;
        }

        .ixi-console-slot {
          position: relative;

          min-width: 0;
          flex-grow: 0;
          flex-shrink: 0;

          overflow: visible;
        }

        .ixi-console-panel-content {
          width: 100%;
          height: 100%;

          min-width: 0;

          position: relative;

          overflow: hidden;
        }

        .ixi-console-edge-button {
          position: absolute;

          top: 50%;

          width: 5px;
          height: 36px;

          transform:
            translateY(-50%);

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .18
            );

          border-radius: 2px;

          padding: 0;

          background:
            rgba(
              255,
              255,
              255,
              .13
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
              .08
            ),
            0 2px 6px
            rgba(
              0,
              0,
              0,
              .28
            );
        }

        .ixi-console-edge-button.left {
          left: 0;
        }

        .ixi-console-edge-button.right {
          right: 0;
        }

        .ixi-console-edge-button.is-live:hover {
          border-color:
            rgba(
              255,
              196,
              0,
              .62
            );

          background:
            rgba(
              255,
              196,
              0,
              .82
            );

          box-shadow:
            0 0 8px
            rgba(
              255,
              196,
              0,
              .26
            );
        }

        .ixi-console-edge-button.is-dormant {
          opacity: .18;
          cursor: default;
        }

        .ixi-console-face-button {
          position: absolute;

          left: 50%;
          bottom: 0;

          width: 36px;
          height: 7px;

          transform:
            translateX(-50%);

          border: 0;
          border-radius:
            3px 3px 1px 1px;

          padding: 0;

          background:
            rgba(
              255,
              255,
              255,
              .13
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
              .10
            ),
            0 2px 5px
            rgba(
              0,
              0,
              0,
              .30
            );
        }

        .ixi-console-face-button span {
          display: block;

          width: 20px;
          height: 2px;

          margin: 0 auto;

          border-radius: 2px;

          background:
            rgba(
              255,
              255,
              255,
              .30
            );
        }

        .ixi-console-face-button:hover {
          background:
            rgba(
              255,
              196,
              0,
              .92
            );

          box-shadow:
            0 0 8px
            rgba(
              255,
              196,
              0,
              .30
            );
        }

        .ixi-console-face-button:hover span {
          background:
            rgba(
              0,
              0,
              0,
              .58
            );
        }
      `}</style>
    </div>
  );
}
