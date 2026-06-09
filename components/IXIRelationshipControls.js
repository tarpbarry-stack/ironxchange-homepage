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
    if (isRealColor(state?.color)) colors.add(state.color);
  });

  return colors;
}

function getExistingOutlines(ixiCardState = {}) {
  const outlines = new Set();

  Object.values(ixiCardState || {}).forEach(state => {
    if (isRealOutline(state?.outline)) outlines.add(String(state.outline));
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
  setPocketThumbSize = null,
  isMachineDragging = false
}) {
  const [railRevealed, setRailRevealed] = useState(false);
  const [armedPocket, setArmedPocket] = useState(null);
  const [parkBrakeOn, setParkBrakeOn] = useState(false);

  const existingColors = getExistingColors(ixiCardState);
  const existingOutlines = getExistingOutlines(ixiCardState);

  const hasAnyRelationship = Object.values(ixiCardState || {}).some(
    state => isRealColor(state?.color) || isRealOutline(state?.outline)
  );

  const machineControlsHinted = hasAnyRelationship || isMachineDragging;

  function toggleRailReveal() {
    setRailRevealed(current => !current);
  }

  function togglePocketArm(pocketId) {
    setArmedPocket(current => (current === pocketId ? null : pocketId));
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
    if (!activeColors.includes("none")) onToggleColor("none");
    onToggleOutline(outline);
  }

  return (
    <div
      className={`ixi-relationship-shell ${
        railRevealed ? "revealed" : ""
      } ${machineControlsHinted ? "machine-hinted" : ""} ${className}`}
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
        <div className="ixi-pocket-left-cluster">
          <div className="ixi-pocket-indicator-stack left">
            <button
              type="button"
              className={`ixi-pocket-indicator pocket-left-top ${
                armedPocket === "LT" ? "armed" : ""
              }`}
              onClick={() => togglePocketArm("LT")}
              aria-label="Arm left top pocket"
              title="Left Top Pocket"
            />

            <button
              type="button"
              className={`ixi-pocket-indicator pocket-left-bottom ${
                armedPocket === "LB" ? "armed" : ""
              }`}
              onClick={() => togglePocketArm("LB")}
              aria-label="Arm left bottom pocket"
              title="Left Bottom Pocket"
            />
          </div>

          <button
            type="button"
            className="ixi-theater-button"
            aria-label="IXI Theater"
            title="IXI Theater"
          >
            <span>T</span>
          </button>

<button
  type="button"
  className="ixi-active-stack-button"
  aria-label="Active stack"
  title="Active Stack"
>
  <span>A</span>
</button>
  </div>
    
        <div className="ixi-pocket-right-cluster">
          <button
            type="button"
            className={`ixi-park-brake ${parkBrakeOn ? "engaged" : ""}`}
            onClick={() => setParkBrakeOn(current => !current)}
            aria-label={parkBrakeOn ? "Park brake engaged" : "Park brake off"}
            title={parkBrakeOn ? "Park Brake Engaged" : "Park Brake"}
          >
            <span className="park-left">(</span>
            <span className="park-core">P</span>
            <span className="park-right">)</span>
          </button>

          <div className="ixi-pocket-indicator-stack right">
            <button
              type="button"
              className={`ixi-pocket-indicator pocket-right-top ${
                armedPocket === "RT" ? "armed" : ""
              }`}
              onClick={() => togglePocketArm("RT")}
              aria-label="Arm right top pocket"
              title="Right Top Pocket"
            />

            <button
              type="button"
              className={`ixi-pocket-indicator pocket-right-bottom ${
                armedPocket === "RB" ? "armed" : ""
              }`}
              onClick={() => togglePocketArm("RB")}
              aria-label="Arm right bottom pocket"
              title="Right Bottom Pocket"
            />
          </div>
        </div>
      </div>

      <div className="ixi-relationship-controls">
        {COLOR_CONTROLS.map(color => (
          <div key={color} className="ixi-color-with-thumb">
            <button
              type="button"
              className={`ixi-relationship-color color-${color} stage-${getColorStage(
                color
              )}`}
              onClick={() => onToggleColor(color)}
              aria-label={`Filter ${color}`}
            />
          </div>
        ))}

        {OUTLINE_CONTROLS.map(outline => (
          <button
            key={outline}
            type="button"
            className={`ixi-relationship-outline outline-${outline} stage-${getOutlineStage(
              outline
            )}`}
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

  overflow: hidden;
}

    .ixi-relationship-head {
  height: 10px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  position: relative;
  top: -4px;

  margin: 0 auto 4px;
}
        .ixi-relationship-head span {
          opacity: 0;
          color: rgba(255,196,0,.82);
          font-size: 7px;
          font-weight: 950;
          letter-spacing: .65px;
          transition:
            opacity .42s ease,
            color .42s ease,
            text-shadow .42s ease;
        }

        .ixi-relationship-shell.machine-hinted .ixi-relationship-head span {
          opacity: .38;
          color: rgba(255,196,0,.48);
          text-shadow: none;
        }

        .ixi-relationship-shell.revealed .ixi-relationship-head span {
          opacity: 1;
          color: rgba(255,196,0,.82);
          text-shadow: 0 0 8px rgba(255,196,0,.16);
        }

        .ixi-pocket-indicator-row {
 width: 14px;
height: 4px;

  display: flex;
  align-items: flex-end;
  justify-content: space-between;

  margin: 2px auto -2px;

  pointer-events: none;
}

     .ixi-pocket-left-cluster,
.ixi-pocket-right-cluster {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  position: relative;
}

        .ixi-pocket-indicator-stack {
          display: grid;
          gap: 20px;
          position: relative;
          top: 21px;
        }

        .ixi-theater-button {
          position: relative;
          top: 13px;
          left: 10px;
          width: var(--ixi-square-size);
          height: var(--ixi-square-size);
          border: 1px solid rgba(255,255,255,0);
          background: transparent;
          color: rgba(255,255,255,0);
          padding: 0;
          cursor: pointer;
          pointer-events: auto;
          opacity: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--ixi-square-font);
          font-weight: 950;
          line-height: 1;
          transition:
            opacity .18s ease,
            color .18s ease,
            border-color .18s ease,
            text-shadow .18s ease,
            transform .18s ease;
        }

        .ixi-active-stack-button {
  position: relative;
  top: 13px;
  left: 18px;
 
  width: 12px;
  height: 12px;

  border: 1px solid rgba(255,255,255,0);
  background: transparent;

  color: rgba(255,255,255,0);

  padding: 0;
  cursor: pointer;
  pointer-events: auto;

  opacity: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 8px;
  font-weight: 950;
  line-height: 1;

  transition:
    opacity .18s ease,
    color .18s ease,
    border-color .18s ease,
    text-shadow .18s ease,
    transform .18s ease;
}

.ixi-relationship-shell.revealed .ixi-active-stack-button {
  opacity: 1;
  color: rgba(255,255,255,.12);
  border-color: rgba(255,255,255,.10);
}

.ixi-relationship-shell.revealed .ixi-active-stack-button:hover {
  color: rgba(0,194,255,.55);
  border-color: rgba(0,194,255,.42);
  transform: translateY(-1px);
  text-shadow: 0 0 5px rgba(0,194,255,.18);
}

        

        .ixi-relationship-shell.revealed .ixi-theater-button {
          opacity: 1;
          color: rgba(255,255,255,.12);
          border-color: rgba(255,255,255,.10);
        }

        .ixi-relationship-shell.revealed .ixi-theater-button:hover {
          color: rgba(0,194,255,.55);
          border-color: rgba(0,194,255,.42);
          transform: translateY(-1px);
          text-shadow: 0 0 5px rgba(0,194,255,.18);
        }

        .ixi-park-brake {
          position: relative;
          top: 13px;
          right: 10px;          
          border: 0;
          background: transparent;
          padding: 0;
          margin-right: 2px;
          cursor: pointer;
          pointer-events: auto;
          color: rgba(255,255,255,0);
          font-size: 11px;
          font-weight: 950;
          display: flex;
          align-items: center;
          gap: 1px;
          opacity: 0;
          transition:
            color .18s ease,
            text-shadow .18s ease,
            transform .18s ease,
            opacity .18s ease;
        }

        .ixi-relationship-shell.revealed .ixi-park-brake {
          color: rgba(255,255,255,.10);
          opacity: 1;
        }

        .ixi-relationship-shell.revealed .ixi-park-brake:hover {
          color: rgba(220,38,38,.58);
          transform: translateY(-1px);
          text-shadow: 0 0 5px rgba(220,38,38,.18);
        }

        .ixi-park-brake.engaged {
          color: rgba(220,38,38,.92);
          opacity: 1;
          text-shadow: 0 0 6px rgba(220,38,38,.28);
        }

        .park-left,
        .park-right {
          opacity: .75;
        }

        .park-core {
          font-weight: 950;
        }

        .ixi-pocket-indicator {
          width: var(--ixi-pocket-width);
          height: var(--ixi-pocket-height);
          border: 0;
          border-radius: 1px;
          background: rgba(255,255,255,.045);
          padding: 0;
          pointer-events: auto;
          cursor: pointer;
          position: relative;
          overflow: visible;
          opacity: .62;
          transition:
            background .16s ease,
            box-shadow .16s ease,
            opacity .16s ease;
        }

        .ixi-pocket-indicator::before {
          content: "";
          position: absolute;
          left: -14px;
          right: -14px;
          top: -10px;
          bottom: -10px;
          pointer-events: auto;
        }

        .ixi-relationship-shell.revealed .ixi-pocket-indicator {
          background: rgba(255,255,255,.16);
          opacity: 1;
        }

        .ixi-pocket-indicator.armed {
          background: rgba(0,194,255,.38);
          opacity: .82;
          box-shadow: 0 0 4px rgba(0,194,255,.16);
        }

        .ixi-relationship-shell.revealed .ixi-pocket-indicator.armed {
          background: rgba(0,194,255,.95);
          opacity: 1;
          box-shadow:
            0 0 5px rgba(0,194,255,.45),
            0 0 12px rgba(0,194,255,.24);
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
          box-shadow: 0 0 8px rgba(255,196,0,.42);
        }

       .ixi-relationship-controls {
  width: 100%;
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
          opacity: .46;
          filter: grayscale(.35);
          box-shadow: none;
        }

        .ixi-relationship-shell.revealed .stage-exists {
          opacity: .58;
          filter: grayscale(.22);
          box-shadow: 0 0 6px rgba(255,255,255,.035);
        }

        .stage-selected {
          opacity: 1;
          filter: grayscale(0);
          transform: translateY(-1px);
          border-color: rgba(255,255,255,.18);
          box-shadow:
            0 0 0 1px rgba(255,255,255,.08),
            0 0 10px rgba(255,255,255,.08);
        }

        .ixi-relationship-outline.stage-dead {
          opacity: .16;
          background: transparent;
          border-color: rgba(255,255,255,.04);
          box-shadow: none;
        }

        .ixi-relationship-shell.revealed .ixi-relationship-outline.stage-dead {
          opacity: .34;
          border-color: rgba(255,255,255,.075);
        }

        .ixi-relationship-outline.stage-dead::after {
          background: rgba(255,255,255,.14);
        }

        .ixi-relationship-outline.stage-exists {
          opacity: .52;
          border-color: rgba(255,255,255,.095);
          box-shadow: none;
        }

        .ixi-relationship-shell.revealed .ixi-relationship-outline.stage-exists {
          opacity: .62;
          border-color: rgba(255,255,255,.12);
          box-shadow: 0 0 6px rgba(255,255,255,.035);
        }

        .ixi-relationship-outline.stage-exists::after {
          background: rgba(255,255,255,.38);
        }

        .ixi-relationship-outline.stage-selected {
          opacity: 1;
          border-color: rgba(255,255,255,.18);
          box-shadow:
            0 0 0 1px rgba(255,255,255,.08),
            0 0 10px rgba(255,255,255,.08);
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
  width: 24px;
  height: 12px;

  display: grid;
  grid-template-rows: repeat(3, 2px);
  gap: 2px;

  margin-right: 6px;

  border: 0;
  background: transparent;

  padding: 0;
  cursor: pointer;

  position: relative;
  top: 1px;
  left: 6px;
}

.ixi-thumb-size-toggle span {
  width: 18px;
  height: 2px;

  display: block;

  border: 0;
  border-radius: 1px;

  background: rgba(255,255,255,.035);

  transition:
    background .16s ease,
    box-shadow .16s ease,
    opacity .16s ease;
}

.ixi-thumb-size-toggle.thumb-setting-small span:nth-child(3),
.ixi-thumb-size-toggle.thumb-setting-medium span:nth-child(2),
.ixi-thumb-size-toggle.thumb-setting-medium span:nth-child(3),
.ixi-thumb-size-toggle.thumb-setting-large span:nth-child(1),
.ixi-thumb-size-toggle.thumb-setting-large span:nth-child(2),
.ixi-thumb-size-toggle.thumb-setting-large span:nth-child(3) {
  background: rgba(255,255,255,.085);
  box-shadow: none;
}

.ixi-relationship-shell.revealed .ixi-thumb-size-toggle span {
  background: rgba(255,255,255,.10);
}

.ixi-relationship-shell.revealed
  .ixi-thumb-size-toggle.thumb-setting-small
  span:nth-child(3),
.ixi-relationship-shell.revealed
  .ixi-thumb-size-toggle.thumb-setting-medium
  span:nth-child(2),
.ixi-relationship-shell.revealed
  .ixi-thumb-size-toggle.thumb-setting-medium
  span:nth-child(3),
.ixi-relationship-shell.revealed
  .ixi-thumb-size-toggle.thumb-setting-large
  span:nth-child(1),
.ixi-relationship-shell.revealed
  .ixi-thumb-size-toggle.thumb-setting-large
  span:nth-child(2),
.ixi-relationship-shell.revealed
  .ixi-thumb-size-toggle.thumb-setting-large
  span:nth-child(3) {
  background: rgba(255,255,255,.32);
  box-shadow: none;
}
         
       @media (max-width: 900px) {
  .ixi-relationship-controls {
    gap: 9px;
  }

  .ixi-relationship-color {
    width: 16px;
  }

  .ixi-relationship-outline {
    width: 20px;
  }

  .ixi-pocket-left-cluster,
  .ixi-pocket-right-cluster {
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
