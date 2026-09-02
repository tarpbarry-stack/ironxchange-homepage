import {
  IXI_CARD_SCALE_LABELS,
  IXI_CARD_SCALE_STEPS,
  getCardScaleIndex,
  getCardScaleModeAtIndex,
  stepCardScaleMode
} from "./IXIScaleEngine";

export default function IXICardScaleControl({
  value = "xl",
  onChange,
  surfaceLabel = "Cards"
}) {
  const currentIndex =
    getCardScaleIndex(value);
  const currentMode =
    getCardScaleModeAtIndex(currentIndex);

  function selectMode(nextMode) {
    if (
      nextMode !== currentMode &&
      typeof onChange === "function"
    ) {
      onChange(nextMode);
    }
  }

  return (
    <div
      className="ixi-card-scale-control"
      role="group"
      aria-label={`${surfaceLabel} card size`}
      data-ixi-card-scale-control="true"
      data-ixi-card-scale-mode={currentMode}
    >
      <button
        type="button"
        className="ixi-card-scale-step-button"
        aria-label={`Make ${surfaceLabel} cards larger`}
        onClick={() =>
          selectMode(
            stepCardScaleMode(currentMode, 1)
          )
        }
        disabled={
          currentIndex ===
          IXI_CARD_SCALE_STEPS.length - 1
        }
      >
        +
      </button>

      <label className="ixi-card-scale-meter">
        <span
          className="ixi-card-scale-bars"
          aria-hidden="true"
        >
          {[...IXI_CARD_SCALE_STEPS]
            .reverse()
            .map(mode => {
              const index =
                IXI_CARD_SCALE_STEPS.indexOf(mode);

              return (
                <i
                  key={mode}
                  data-lit={
                    index <= currentIndex
                      ? "true"
                      : "false"
                  }
                  data-current={
                    index === currentIndex
                      ? "true"
                      : "false"
                  }
                  style={{
                    height: `${10 + index * 2}px`
                  }}
                />
              );
            })}
        </span>

        <input
          type="range"
          min="0"
          max={IXI_CARD_SCALE_STEPS.length - 1}
          step="1"
          value={currentIndex}
          onChange={event =>
            selectMode(
              getCardScaleModeAtIndex(
                event.target.value
              )
            )
          }
          aria-label={`${surfaceLabel} card scale`}
          aria-valuetext={
            IXI_CARD_SCALE_LABELS[currentMode]
          }
        />
      </label>

      <button
        type="button"
        className="ixi-card-scale-step-button"
        aria-label={`Make ${surfaceLabel} cards smaller`}
        onClick={() =>
          selectMode(
            stepCardScaleMode(currentMode, -1)
          )
        }
        disabled={currentIndex === 0}
      >
        −
      </button>

      <strong className="ixi-card-scale-label">
        {IXI_CARD_SCALE_LABELS[currentMode]}
      </strong>

      <style jsx>{`
        .ixi-card-scale-control {
          position: fixed;
          right: 24px;
          bottom: 24px;
          z-index: 9999;
          min-width: 224px;
          min-height: 50px;
          display: grid;
          grid-template-columns:
            40px minmax(92px, 1fr) 40px;
          grid-template-rows: 34px 12px;
          align-items: center;
          gap: 0 8px;
          padding: 7px 8px 5px;
          border: 1px solid rgba(255, 196, 0, .55);
          border-radius: 8px;
          background: #111;
          color: #ffc400;
          box-shadow:
            0 14px 34px rgba(0, 0, 0, .42),
            inset 0 1px 0 rgba(255, 255, 255, .06);
          backdrop-filter: blur(14px);
        }

        .ixi-card-scale-step-button {
          width: 40px;
          height: 34px;
          display: grid;
          place-items: center;
          padding: 0;
          border: 0;
          border-radius: 6px;
          background: transparent;
          color: #ffc400;
          font-size: 22px;
          font-weight: 650;
          line-height: 1;
          cursor: pointer;
        }

        .ixi-card-scale-step-button:hover:not(:disabled),
        .ixi-card-scale-step-button:focus-visible {
          background: rgba(255, 196, 0, .10);
          outline: none;
          box-shadow: 0 0 0 3px rgba(255, 196, 0, .12);
        }

        .ixi-card-scale-step-button:disabled {
          color: rgba(255, 255, 255, .18);
          cursor: default;
          opacity: .7;
        }

        .ixi-card-scale-meter {
          height: 28px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 3px;
          border-radius: 7px;
        }

        .ixi-card-scale-bars {
          width: 100%;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: space-around;
          gap: 5px;
          pointer-events: none;
        }

        .ixi-card-scale-bars i {
          width: 3px;
          flex: 0 0 3px;
          display: block;
          border-radius: 999px;
          background: rgba(255, 255, 255, .16);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, .08);
          transition:
            background .16s ease,
            box-shadow .16s ease,
            transform .16s ease;
        }

        .ixi-card-scale-bars i[data-lit="true"] {
          background: rgba(255, 196, 0, .76);
          box-shadow: 0 0 7px rgba(255, 196, 0, .24);
        }

        .ixi-card-scale-bars i[data-current="true"] {
          background: #ffc400;
          box-shadow: 0 0 10px rgba(255, 196, 0, .64);
          transform: scaleX(1.45);
        }

        .ixi-card-scale-meter input {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          margin: 0;
          opacity: 0;
          cursor: ew-resize;
          direction: rtl;
        }

        .ixi-card-scale-meter:focus-within {
          outline: 2px solid rgba(255, 196, 0, .72);
          outline-offset: 2px;
          box-shadow: 0 0 0 4px rgba(255, 196, 0, .10);
        }

        .ixi-card-scale-label {
          grid-column: 1 / -1;
          color: rgba(255, 255, 255, .54);
          font-size: 9px;
          font-weight: 900;
          line-height: 1;
          letter-spacing: .12em;
          text-align: center;
        }

        @media (max-width: 850px) {
          .ixi-card-scale-control {
            right: 12px;
            bottom: 12px;
            min-width: 210px;
          }
        }
      `}</style>
    </div>
  );
}
