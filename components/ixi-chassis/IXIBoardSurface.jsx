import { useEffect, useState } from "react";
import { IXIMobileCardContext } from "../ixi-mobile/IXIMobileCardContext";

import {
  getIXIScalePreset
} from "../../lib/ixiObjectGeometry";

export default function IXIBoardSurface({
  scaleMode = "xl",
  mobileCards = false,
  centerRows = false,

  columnGap,
  rowGap,

  className = "",
  style = {},

  children,
  ...surfaceProps
}) {
  const [mobile, setMobile] = useState(false);
  const [density, setDensity] = useState("I");
  useEffect(() => {
    if (!mobileCards) return;
    const query = window.matchMedia("(max-width: 850px)");
    const sync = () => setMobile(query.matches);
    sync();
    try { setDensity(sessionStorage.getItem("ixi-mobile-card-density") === "II" ? "II" : "I"); } catch {}
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, [mobileCards]);

  function selectDensity(value) {
    setDensity(value);
    try { sessionStorage.setItem("ixi-mobile-card-density", value); } catch {}
  }

  const preset =
    getIXIScalePreset(
      scaleMode
    );

  const resolvedColumnGap =
  Number.isFinite(
    Number(columnGap)
  )
    ? Number(columnGap)
    : preset.columnGap;

const resolvedRowGap =
  Number.isFinite(
    Number(rowGap)
  )
    ? Number(rowGap)
    : preset.rowGap;

  return (
    <IXIMobileCardContext.Provider value={mobileCards && mobile}>
    <section
      {...surfaceProps}
      className={[
        "ixi-board-surface",
        mobileCards ? "ixi-mobile-card-board" : "",
        centerRows
          ? "ixi-board-surface-centered"
          : "",
        className
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        ...style,
        "--ixi-board-column-gap":
          `${resolvedColumnGap}px`,

        "--ixi-board-row-gap":
          `${resolvedRowGap}px`
      }}
      data-ixi-mobile-card-density={mobileCards ? density : undefined}
      data-ixi-scale-mode={
        scaleMode
      }
    >
    {mobileCards && <nav className="ixi-mobile-card-density" aria-label="Card density">
      {["I", "II"].map(value => <button type="button" key={value} aria-label={value === "I" ? "One card per row" : "Two cards per row"} aria-pressed={density === value} onClick={() => selectDensity(value)}>{value}</button>)}
    </nav>}
      {children}

      <style jsx>{`
        .ixi-mobile-card-density { display: none; }
        @media (max-width: 850px) {
          .ixi-mobile-card-density { display: grid; grid-column: 1 / -1; width: 100%; grid-template-columns: 1fr 1fr; gap: 6px; margin: 0; }
          .ixi-mobile-card-density button { min-height: 46px; border: 1px solid #353936; border-radius: 9px; background: #111; color: #929792; font: 900 16px Inter, sans-serif; touch-action: manipulation; }
          .ixi-mobile-card-density button[aria-pressed="true"] { color: #ffc400; border-color: #ffc400; background: #19160b; }
          .ixi-mobile-card-density button:focus-visible { outline: 2px solid #ffc400; outline-offset: 2px; }
          .ixi-board-surface.ixi-mobile-card-board { box-sizing: border-box; display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px 4px; padding: 0 4px; }
          .ixi-mobile-card-board[data-ixi-mobile-card-density="II"] { grid-template-columns: repeat(2, minmax(0, 1fr)); padding-inline: 2px; gap: 10px 4px; }
          .ixi-mobile-card-board :global(.ixi-board-sortable-card) { width: 100% !important; max-width: 100% !important; min-width: 0; touch-action: pan-y pinch-zoom; }
          .ixi-mobile-card-board :global(.ixi-board-sortable-card.ixi-console-expanded),
          .ixi-mobile-card-board :global(.ixi-board-load-boundary) { grid-column: 1 / -1; }
        }

        .ixi-board-surface {
          width: 100%;
          min-width: 0;

          display: flex;
          flex-flow: row wrap;

          align-items: flex-start;
          align-content: flex-start;
          justify-content: flex-start;

          column-gap:
            var(
              --ixi-board-column-gap
            );

          row-gap:
            var(
              --ixi-board-row-gap
            );
        }

        .ixi-board-surface-centered {
          justify-content: center;
        }

        .ixi-board-surface
        :global(
          .ixi-board-sortable-card
        ) {
          position: relative;

          flex: 0 0 auto;

          width: max-content;
          max-width: none;
          min-width: 0;

          height: max-content;
          min-height: 0;

          justify-self: auto;
          align-self: flex-start;
        }
      `}</style>
    </section>
    </IXIMobileCardContext.Provider>
  );
}
