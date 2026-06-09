import React, { useState } from "react";

const COLOR_CONTROLS = [
  "none",
  "green",
  "yellow",
  "red",
  "cyan",
  "white",
  "blue",
  "orange"
];

const OUTLINE_CONTROLS = [1, 3, 5];

function isRealColor(color) {
  return color && color !== "none";
}

function isRealOutline(outline) {
  return Number(outline) > 1;
}

function getExistingColors(ixiCardState = {}) {
  const colors = new Set();

  Object.values(ixiCardState || {}).forEach(state => {
    if (isRealColor(state?.color)) {
      colors.add(state.color);
    }
  });

  return colors;
}

function getExistingOutlines(ixiCardState = {}) {
  const outlines = new Set();

  Object.values(ixiCardState || {}).forEach(state => {
    if (isRealOutline(state?.outline)) {
      outlines.add(String(state.outline));
    }
  });

  return outlines;
}

export default function IXIRelationshipControls({
  ixiCardState = {},
  activeColors = [],
  onToggleColor = () => {},
  activeOutline = "all",
  onToggleOutline = () => {},
  className = "",
  pocketThumbSize = "medium",
  setPocketThumbSize = null
}) {
  
  const [railRevealed, setRailRevealed] = useState(false);

  const existingColors = getExistingColors(ixiCardState);
  const existingOutlines = getExistingOutlines(ixiCardState);

  const hasAnyRelationship = Object.values(ixiCardState || {}).some(state =>
    isRealColor(state?.color) || isRealOutline(state?.outline)
  );

  function toggleRailReveal() {
    setRailRevealed(current => !current);
  }

  function getColorStage(color) {
    if (activeColors.includes(color)) return "selected";
    if (existingColors.has(color)) return "exists";
    return "dead";
  }

  function getOutlineStage(outline) {
    if (String(activeOutline) === String(outline)) return "selected";
    if (existingOutlines.has(String(outline))) return "exists";
    return "dead";
  }

  function handleOutlineClick(outline) {
    if (!activeColors.includes("none")) {
      onToggleColor("none");
    }

    onToggleOutline(outline);
  }

return (
  <div
    className={`ixi-relationship-shell ${
      railRevealed ? "revealed" : ""
    } ${className}`}
  >
    <div className="ixi-relationship-head">
      <span>IXI Machine Controls™</span>

      <button
        type="button"
        className="ixi-relationship-power"
        onClick={toggleRailReveal}
        aria-label="Toggle machine controls"
      />
    </div>

<div className="ixi-pocket-indicator-row">
  <div className="ixi-pocket-indicator-stack left">
    <button type="button" className="ixi-pocket-indicator pocket-left-top" />
    <button type="button" className="ixi-pocket-indicator pocket-left-bottom" />
  </div>

  <div className="ixi-pocket-indicator-stack right">
    <button type="button" className="ixi-pocket-indicator pocket-right-top" />
    <button type="button" className="ixi-pocket-indicator pocket-right-bottom" />
  </div>
</div>
          
   <div className="ixi-relationship-controls">
         
  {COLOR_CONTROLS.map(color => (
    <div key={color} className="ixi-color-with-thumb">
      <button
        type="button"
        className={`ixi-relationship-color color-${color} stage-${getColorStage(color)}`}
        onClick={() => onToggleColor(color)}
        aria-label={`Filter ${color}`}
      />
    </div>
  ))}

  {OUTLINE_CONTROLS.map(outline => (
    <button
      key={outline}
      type="button"
      className={`ixi-relationship-outline outline-${outline} stage-${getOutlineStage(outline)}`}
      onClick={() => handleOutlineClick(outline)}
      aria-label={`Filter outline ${outline}`}
    />
  ))}
{setPocketThumbSize && (
  <button
    type="button"
    className={`ixi-thumb-size-toggle thumb-setting-${pocketThumbSize}`}
    onClick={() => {
      if (pocketThumbSize === "small") return setPocketThumbSize("medium");
      if (pocketThumbSize === "medium") return setPocketThumbSize("large");
      return setPocketThumbSize("small");
    }}
    aria-label={`Pocket thumb size ${pocketThumbSize}`}
    title={`Pocket thumbs ${pocketThumbSize}`}
  >
    <span />
    <span />
    <span />
  </button>
)}

</div>

      {hasAnyRelationship && (
        <div className="ixi-mobile-nav-row">
          <a href="/browse" className="ixi-mobile-nav-link">
            IXI MARKETPLACE
          </a>

          <a href="/theater" className="ixi-mobile-nav-link">
            IXI THEATER
          </a>
        </div>
      )}

      <style jsx>{`
       .ixi-relationship-shell {
  width: 100%;
  max-width: 100%;
  margin: 14px auto 0;
}

        .ixi-relationship-head {
          height: 10px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          margin: 0 auto 4px;
        }

        .ixi-relationship-head span {
          opacity: 0;

          color: rgba(255,196,0,.82);

          font-size: 8px;
          font-weight: 950;
          letter-spacing: .65px;

          transition: opacity .18s ease;
        }

        .ixi-relationship-shell.revealed .ixi-relationship-head span {
          opacity: 1;
        }

      .ixi-pocket-indicator-row {
  width: 100%;
  height: 22px;

  display: flex;
  align-items: flex-end;
  justify-content: space-between;

  margin: 8px auto -6px;

  pointer-events: none;
}
.ixi-pocket-indicator-stack {
  display: grid;
  gap: 20px;

  position: relative;
  top: 13px;
}
.ixi-pocket-indicator {
  width: 9px;
  height: 2px;

  border: 0;
  border-radius: 1px;

  background: rgba(255,255,255,.16);

  padding: 0;
  pointer-events: auto;
  cursor: pointer;
}

        .ixi-relationship-power {
          width: 18px;
          height: 4px;

          border: 0;
          border-radius: 2px;

          background: rgba(255,255,255,.18);

          padding: 0;
          cursor: pointer;
        }

        .ixi-relationship-shell.revealed .ixi-relationship-power {
          background: rgba(255,196,0,.95);

          box-shadow:
            0 0 8px rgba(255,196,0,.42);
        }

        .ixi-relationship-controls {
          width: max-content;
          max-width: 100%;

          margin: 0 auto;
          padding: 0;

          display: flex;
          flex-wrap: nowrap;
          justify-content: center;
          align-items: center;

          gap: 14px;
        }

        .ixi-relationship-color,
        .ixi-relationship-outline {
          border: 1px solid rgba(255,255,255,.04);
          background: transparent;
          padding: 0;
          cursor: pointer;

          opacity: .12;
          filter: grayscale(1);

          transition:
            opacity .16s ease,
            box-shadow .16s ease,
            border-color .16s ease,
            transform .16s ease,
            filter .16s ease;
        }

        .ixi-relationship-shell.revealed .stage-dead {
          opacity: .34;
          filter: grayscale(1);
          border-color: rgba(255,255,255,.075);
        }

        .ixi-relationship-color {
          width: 20px;
          height: 8px;
          border-radius: 1px;
        }

        .ixi-relationship-outline {
          width: 24px;
          height: 14px;
          border-radius: 3px;
          position: relative;
          margin-left: -2px;
          margin-right: -2px;
        }

        .ixi-relationship-outline::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;

          width: 15px;

          transform: translate(-50%, -50%);

          background: rgba(255,255,255,.18);
        }

        .outline-1::after {
          height: 1px;
        }

        .outline-3::after {
          height: 3px;
        }

        .outline-5::after {
          height: 5px;
        }

        .stage-dead {
          background: transparent !important;
          box-shadow: none;
        }

        .ixi-relationship-color.stage-dead {
          background: transparent !important;
        }

        .stage-exists {
          opacity: .82;
          filter: grayscale(.05);

          box-shadow:
            0 0 10px rgba(255,255,255,.06);
        }

        .stage-selected {
          opacity: 1;
          filter: grayscale(0);

          transform: translateY(-1px);

          border-color: rgba(255,196,0,.46);

          box-shadow:
            0 0 0 1px rgba(255,196,0,.22),
            0 0 18px rgba(255,196,0,.28);
        }

        .ixi-relationship-outline.stage-dead {
          opacity: .16;
          background: transparent;
          border-color: rgba(255,255,255,.04);
          box-shadow: none;
        }

        .ixi-relationship-shell.revealed
        .ixi-relationship-outline.stage-dead {
          opacity: .34;
          border-color: rgba(255,255,255,.075);
        }

        .ixi-relationship-outline.stage-dead::after {
          background: rgba(255,255,255,.14);
        }

        .ixi-relationship-outline.stage-exists {
          opacity: .82;
          border-color: rgba(255,255,255,.14);

          box-shadow:
            0 0 10px rgba(255,255,255,.06);
        }

        .ixi-relationship-outline.stage-exists::after {
          background: rgba(255,255,255,.58);
        }

        .ixi-relationship-outline.stage-selected {
          opacity: 1;

          border-color: rgba(255,196,0,.46);

          box-shadow:
            0 0 0 1px rgba(255,196,0,.22),
            0 0 18px rgba(255,196,0,.28);
        }

        .ixi-relationship-outline.stage-selected::after {
          background: rgba(255,255,255,.82);
        }

        .ixi-relationship-color:hover,
        .ixi-relationship-outline:hover {
          transform: translateY(-1px);
        }

        .color-none {
          background: rgba(255,255,255,.12);
        }

        .color-green {
          background: rgba(56,161,105,.82);
        }

        .color-yellow {
          background: rgba(255,196,0,.82);
        }

        .color-red {
          background: rgba(229,62,62,.82);
        }

        .color-cyan {
          background: rgba(0,194,255,.82);
        }

        .color-white {
          background: rgba(255,255,255,.72);
        }

        .color-blue {
          background: rgba(49,130,206,.82);
        }

        .color-orange {
          background: rgba(249,133,18,.82);
        }

        .ixi-mobile-nav-row {
          display: none;
        }

        .ixi-mobile-nav-link {
          color: rgba(0,194,255,.72);
          text-decoration: none;

          font-size: 8px;
          font-weight: 950;
          letter-spacing: .55px;

          white-space: nowrap;
        }

        .ixi-mobile-nav-link:hover {
          color: rgba(0,194,255,.95);
          text-shadow: 0 0 8px rgba(0,194,255,.22);
        }

       .ixi-thumb-size-toggle {
  width: 20px;
  height: 8px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  margin-right: 6px;

  border: 0;
  background: transparent;

  padding: 0;
  cursor: pointer;

  position: relative;
  top: -1px;
  left: 6px;
}

.ixi-thumb-size-toggle span {
  width: 3px;
  height: 8px;

  display: block;

  border: 0;
  border-radius: 1px;

  background: rgba(255,255,255,.10);
}

.ixi-thumb-size-toggle.thumb-setting-small span:nth-child(1),
.ixi-thumb-size-toggle.thumb-setting-medium span:nth-child(1),
.ixi-thumb-size-toggle.thumb-setting-medium span:nth-child(2),
.ixi-thumb-size-toggle.thumb-setting-large span:nth-child(1),
.ixi-thumb-size-toggle.thumb-setting-large span:nth-child(2),
.ixi-thumb-size-toggle.thumb-setting-large span:nth-child(3) {
  background: rgba(255,255,255,.32);
  box-shadow: none;
}

.ixi-color-with-thumb {
  display: flex;
  flex-direction: row;
  align-items: center;

  gap: 8px;
}
        @media (max-width: 850px) {
          .ixi-relationship-shell {
            width: 100%;
            margin: 14px auto 0;
          }

          .ixi-relationship-controls {
            margin: 14px auto 0;
            gap: 14px;
          }

          .ixi-mobile-nav-row {
            width: 100%;
            margin-top: 10px;

            display: flex;
            justify-content: center;
            align-items: center;

            gap: 28px;
          }
        }
      `}</style>
    </div>
  );
}
