export default function IXIPocketR1({
  rightPocketMode,
  machineContainers,
  armedDestination,
  WorkspaceDropPad,
  movePocketToStack,
  recallPocketToBoard,
  rotatePocket,
  toggleArmedDestination,
  sendPocketToTheater,
  pocketThumbSize,
  getListingById,
  IXISortableMachineCard,
  getIxiColorValue,
  ixiCardState
}) {
  return (
    <>

 <section
  data-pocket-target="pocketRight"
  className={`ixi-pocket-left ixi-pocket-right pocket-mode-${rightPocketMode} ${
  (machineContainers.pocketRight || []).length ? "occupied" : ""
} ${
  armedDestination === "pocketRight" ? "destination-armed" : ""
}`}
>
<WorkspaceDropPad
  id="pocketRight"
  data-pocket-pad-target="pocketRight"
  className="ixi-pocket-catch-pad catch-r1"
  style={{
    position: "absolute",
    right: -20,
    left: "auto",
    top: "12px",
    width: "360px",
    height: "140px",
    pointerEvents: "auto",
    zIndex: 1,
    background: "transparent",
outline: "none"
  }}
/>

<div className="ixi-pocket-topline">
  <span>II</span>
  <strong>IX-128</strong>
</div>
  
  <div
  className={`ixi-pocket-action-rail right ${
  (machineContainers.pocketRight || []).length === 0 ? "is-empty" : "has-machines"
} pocket-mode-${rightPocketMode}`}
>
<button type="button" className="ixi-pocket-rail-action send" data-label="SEND" />

<button
  type="button"
  className="ixi-pocket-rail-action board"
  data-label="BOARD"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    recallPocketToBoard("pocketRight");
  }}
/>

<button
  type="button"
  className="ixi-pocket-rail-action stack"
  data-label="ACTIVE STACK"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();

    movePocketToStack(
      "pocketRight",
      "top"
    );
  }}
/>

<button
  type="button"
  className="ixi-pocket-rail-action theater"
  data-label="IXI THEATER"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();

    sendPocketToTheater?.("pocketRight");
  }}
/>
</div>

<button
  type="button"
  className={`ixi-pocket-loop-square right ${
  (machineContainers.pocketRight || []).length > 0 &&
  rightPocketMode !== "closed"
    ? "is-visible"
    : ""
}`}
  title="Loop Pocket"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    rotatePocket("pocketRight");
  }}
/>
    
<button
  type="button"
className={`ixi-pocket-direct-button right ${
  (machineContainers.pocketRight || []).length > 0 &&
  rightPocketMode === "closed"
    ? "has-load"
    : ""
} ${
  (machineContainers.pocketRight || []).length > 0 &&
  rightPocketMode !== "closed"
    ? "is-live"
    : ""
}`}
title="Right pocket"
onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();

  toggleArmedDestination("pocketRight");
}}
/>
  

{rightPocketMode !== "closed" &&
 (machineContainers.pocketRight || []).length > 0 && (
  <div className={`ixi-pocket-thumbs r1-thumbs thumb-size-${pocketThumbSize}`}>
    {(machineContainers.pocketRight || []).slice(0, 7).map((machineId, index) => {
      const machine = getListingById(machineId);

      if (!machine) return null;

      const image =
        machine.image ||
        machine.imageUrl ||
        machine.images?.[0] ||
        machine.images?.[0]?.url ||
        machine.publicData?.image ||
        machine.publicData?.imageUrl ||
        machine.publicData?.images?.[0] ||
        machine.attributes?.publicData?.image ||
        machine.attributes?.publicData?.imageUrl ||
        machine.attributes?.publicData?.images?.[0];

return (
  <IXISortableMachineCard
  key={`right-pocket-thumb-${machineId}`}
  id={machineId}
  containerId="pocketRight"
  className="ixi-pocket-thumb-dnd"
  style={{
    left: `${rightPocketMode === "open" ? index * 44 : rightPocketMode === "peek" ? index * 16 : index * 8}px`,
    zIndex: index + 1
  }}
>
    {({ dragHandleProps }) => (
      <div
  className="ixi-pocket-thumb"
  {...dragHandleProps}
  style={{
    borderColor: getIxiColorValue(
      ixiCardState[String(machineId)]?.color
    ),
    boxShadow: `0 0 0 ${Number(ixiCardState[String(machineId)]?.outline || 1)}px ${getIxiColorValue(
      ixiCardState[String(machineId)]?.color
    )}`
  }}
>
        {image ? (
          <img
            src={typeof image === "string" ? image : image?.url}
            alt=""
          />
        ) : (
          <span>
            {machine.year || machine.publicData?.year || ""}
            {" "}
            {machine.make || machine.publicData?.make || ""}
          </span>
        )}
      </div>
    )}
  </IXISortableMachineCard>
);
    })}
  </div>
)}  
  </section>    
      <style jsx>{`
         * {
          box-sizing: border-box;
        }

        :global(body) {
          margin: 0;
          font-family: Arial, sans-serif;
          background: #0b0b0b;
          color: #d6d6d6;
        }

        main {
           min-height: 72vh;
  padding: 14px 5% 58px;
          background:
            radial-gradient(circle at 50% 0%, rgba(255,196,0,.05), transparent 34%),
            linear-gradient(180deg, rgba(255,255,255,.014), rgba(255,255,255,0)),
            #0b0b0b;
        }

       .saved-environment-shell {
  width: 100%;
  margin: 0 auto;
}



       

/* =============================== */
/* IXI POCKET STATION CHASSIS V12  */
/* =============================== */

.ixi-command-chassis {
  --station-w: 150px;
  --station-h: 102px;
  --control-half: 320px;
  --station-gap: clamp(24px, 2.1vw, 40px);

  width: 100%;
  margin: -14 auto 20px;

  position: relative;

  display: block;
}

.ixi-command-center {
  position: relative;
  z-index: 5;

  width: min(100%, 680px);
  min-width: 0;

  margin: 0 auto;

  display: flex;
  justify-content: center;
}

.ixi-command-left,
.ixi-command-right {
  position: absolute;
  top: 56px;

  width: calc((var(--station-w) * 2) + var(--station-gap));
  height: var(--station-h);

  pointer-events: none;
  z-index: 3;
}

.ixi-command-left {
  right: calc(50% + var(--control-half) + var(--station-gap));
  left: auto;
}

.ixi-command-right {
  left: calc(50% + var(--control-half) + var(--station-gap));
  right: auto;
}

.ixi-pocket-row {
  width: 100%;
  height: var(--station-h);

  margin: 0;

  display: grid;
  grid-template-columns: var(--station-w) var(--station-w);
  gap: var(--station-gap);

  position: relative;
  z-index: 2;

  pointer-events: none;
}

/* Base station shell */
.ixi-pocket-left,
.ixi-pocket-right {
  width: var(--station-w);
  max-width: var(--station-w);
  height: var(--station-h);

  margin: 0;
  padding: 8px;

  position: relative;
  top: auto;

  cursor: default !important;

  border: 1px solid rgba(255,255,255,.055);
  border-radius: 16px 10px 16px 10px;

  background:
    linear-gradient(180deg, rgba(255,255,255,.024), rgba(255,255,255,0)),
    radial-gradient(circle at top left, rgba(255,196,0,.035), transparent 60%),
    rgba(7,7,7,.76);

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.028),
    0 8px 18px rgba(0,0,0,.20);

  overflow: visible;

  pointer-events: auto;
  z-index: 8;
}

.ixi-pocket-left::before,
.ixi-pocket-right::before {
  content: "";

  position: absolute;
  left: 9px;
  right: 9px;
  top: 8px;

  height: 1px;

  background: rgba(255,196,0,.16);
  pointer-events: none;
}

/* Wide order:
   III | I | SEARCH | II | IV
*/
.ixi-pocket-l2 {
  grid-column: 1;
  grid-row: 1;
}

.ixi-command-left .ixi-pocket-left:not(.ixi-pocket-l2) {
  grid-column: 2;
  grid-row: 1;
}

.ixi-command-right .ixi-pocket-right:not(.ixi-pocket-r2) {
  grid-column: 1;
  grid-row: 1;
}

.ixi-pocket-r2 {
  grid-column: 2;
  grid-row: 1;
}

/* =============================== */
/* IXI DESTINATION STATES          */
/* =============================== */

.ixi-pocket-left.occupied,
.ixi-pocket-right.occupied {
  border-color: rgba(255,196,0,.24);

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.028),
    0 8px 18px rgba(0,0,0,.20),
    0 0 12px rgba(255,196,0,.08);
}

.ixi-pocket-left.destination-armed,
.ixi-pocket-right.destination-armed {
  border-color: rgba(0,194,255,.72);

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.04),
    0 8px 18px rgba(0,0,0,.20),
    0 0 18px rgba(0,194,255,.22);
}

.ixi-pocket-left.destination-armed::before,
.ixi-pocket-right.destination-armed::before {
  background: rgba(0,194,255,.82);
}

/* Roman numerals + loop actuator follow pocket state */

/* empty / dormant */
.ixi-pocket-left .ixi-pocket-topline span,
.ixi-pocket-right .ixi-pocket-topline span {
  color: rgba(255,255,255,.18);
  text-shadow: none;
}

.ixi-pocket-left .ixi-pocket-loop-square,
.ixi-pocket-right .ixi-pocket-loop-square {
  border-color: rgba(255,255,255,.18);
  background: rgba(255,255,255,.10);
  box-shadow: none;
}

/* occupied = yellow */
.ixi-pocket-left.occupied .ixi-pocket-topline span,
.ixi-pocket-right.occupied .ixi-pocket-topline span {
  color: rgba(255,196,0,.86);
  text-shadow:
    0 0 8px rgba(255,196,0,.18),
    0 0 14px rgba(255,196,0,.08);
}

.ixi-pocket-left.occupied .ixi-pocket-loop-square,
.ixi-pocket-right.occupied .ixi-pocket-loop-square {
  border-color: rgba(255,196,0,.42);
  background: rgba(255,196,0,.34);
  box-shadow: 0 0 8px rgba(255,196,0,.16);
}

/* armed = cyan, overrides occupied */
.ixi-pocket-left.destination-armed .ixi-pocket-topline span,
.ixi-pocket-right.destination-armed .ixi-pocket-topline span {
  color: rgba(0,194,255,.92);
  text-shadow:
    0 0 8px rgba(0,194,255,.26),
    0 0 16px rgba(0,194,255,.12);
}

.ixi-pocket-left.destination-armed .ixi-pocket-loop-square,
.ixi-pocket-right.destination-armed .ixi-pocket-loop-square {
  border-color: rgba(0,194,255,.72);
  background: rgba(0,194,255,.76);
  box-shadow:
    0 0 8px rgba(0,194,255,.28),
    0 0 16px rgba(0,194,255,.12);
}
/* Armed destination action rail */

.ixi-pocket-left.destination-armed .ixi-pocket-rail-action,
.ixi-pocket-right.destination-armed .ixi-pocket-rail-action {
  background: rgba(0,194,255,.38) !important;

  box-shadow:
    0 0 6px rgba(0,194,255,.18),
    0 0 12px rgba(0,194,255,.08);
}

.ixi-pocket-left.destination-armed .ixi-pocket-action-rail,
.ixi-pocket-right.destination-armed .ixi-pocket-action-rail {
  filter: drop-shadow(0 0 6px rgba(0,194,255,.22));
}

/* =============================== */
/* 1250px → 851px STACKED MODE     */
/* =============================== */

@media (max-width: 1250px) and (min-width: 851px) {
  .ixi-command-chassis {
    --control-half: 210px;
    --station-gap: 20px;
  }

  .ixi-command-left,
  .ixi-command-right {
    top: -5px;

    width: var(--station-w);
    height: calc((var(--station-h) * 2) + 34px);
  }

  .ixi-command-left {
    right: calc(50% + var(--control-half) + 20px);
  }

  .ixi-command-right {
    left: calc(50% + var(--control-half) + 20px);
  }

  .ixi-pocket-row {
    grid-template-columns: var(--station-w);
    grid-template-rows: var(--station-h) var(--station-h);
    gap: 20px;
  }

  .ixi-command-left .ixi-pocket-left:not(.ixi-pocket-l2) {
    grid-column: 1;
    grid-row: 1;
  }

  .ixi-command-right .ixi-pocket-right:not(.ixi-pocket-r2) {
    grid-column: 1;
    grid-row: 1;
  }

  .ixi-pocket-l2 {
    grid-column: 1;
    grid-row: 2;
  }

  .ixi-pocket-r2 {
    grid-column: 1;
    grid-row: 2;
  }
}

/* =============================== */
/* MOBILE — NO VISIBLE STATIONS    */
/* =============================== */

@media (max-width: 850px) {
  .ixi-command-left,
  .ixi-command-right,
  .ixi-pocket-row,
  .ixi-pocket-left,
  .ixi-pocket-right {
    display: none !important;
  }
}



       .workspace-controls {
  margin: 0 auto;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

    .ixi-toolbar {
  width: 600px;
  max-width: 100%;

  margin: 18px auto 0;
  position: relative;
  left: 10px;
  
  padding: 0;

  display: grid;

  grid-template-columns:
    repeat(8, 1fr)
    repeat(3, 1fr);

  justify-content: center;
  align-items: center;

  gap: 4px;
}

        .ixi-toolbar button {
          border: none;
          background: transparent;
          padding: 0;
          cursor: pointer;
        }

        .ixi-toolbar button:hover {
          transform: translateY(-1px);

          box-shadow:
            0 0 0 1px rgba(255,255,255,.03),
            0 0 8px rgba(255,196,0,.10);
        }

        .ixi-color-filter.active,
        .ixi-thickness-filter.active {
          box-shadow:
            0 0 0 1px rgba(255,196,0,.08),
            0 0 12px rgba(255,196,0,.18);

          border-color: rgba(255,196,0,.24) !important;
        }

        .ixi-color-filter {
          width: 20px !important;
          height: 8px !important;
          border: 1px solid rgba(255,255,255,.055) !important;
          border-radius: 1px !important;
          padding: 0 !important;

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.025),
            inset 0 -1px 0 rgba(0,0,0,.32);
        }

        .ixi-color-filter.color-none {
          background: rgba(255,255,255,.035) !important;
        }

        .ixi-color-filter.color-green {
          background: rgba(56,161,105,.42) !important;
        }

        .ixi-color-filter.color-yellow {
          background: rgba(255,196,0,.42) !important;
        }

        .ixi-color-filter.color-red {
          background: rgba(229,62,62,.42) !important;
        }

        .ixi-color-filter.color-cyan {
          background: rgba(0,194,255,.42) !important;
        }

        .ixi-color-filter.color-white {
          background: rgba(255,255,255,.34) !important;
        }

        .ixi-color-filter.color-blue {
          background: rgba(49,130,206,.42) !important;
        }

        .ixi-color-filter.color-orange {
          background: rgba(249,133,18,.42) !important;
        }

        .ixi-thickness-filter {
  width: 24px;
  height: 14px;
  border: 1px solid rgba(255,255,255,.055) !important;
  border-radius: 3px;
  background: rgba(255,255,255,.018) !important;
  position: relative;

  margin-left: -2px;
  margin-right: -2px;
}
        .ixi-thickness-filter::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 15px;
  transform: translate(-50%, -50%);
  background: rgba(255,255,255,.28);
}

        .ixi-thickness-filter.thin::after {
          height: 1px;
        }

        .ixi-thickness-filter.medium::after {
          height: 3px;
        }

        .ixi-thickness-filter.thick::after {
          height: 5px;
        }


@keyframes ixiPocketPulse {
  0%, 100% {
    opacity: .48;
    transform: translateX(-50%) scale(.82);
  }

  50% {
    opacity: 1;
    transform: translateX(-50%) scale(1.08);
  }
}


/* =============================== */
/* IXI POCKET CATCH ZONE DEBUG     */
/* =============================== */

/* Base catch pad is inert unless explicitly assigned */
.ixi-pocket-catch-pad {
  position: absolute;
  pointer-events: none;
  z-index: 1;
}

/* L1 local catch only */
.ixi-pocket-catch-pad.catch-l1 {
  left: 0;
  right: auto;
  top: 92px;

  width: 360px;
  height: 140px;

  pointer-events: auto;

  background: transparent;
outline: none;
}

/* R1 local catch only */
.ixi-pocket-catch-pad.catch-r1 {
  right: 20;
  left: auto;
  top: 92px;

  width: 340px;
  height: 140px;

  pointer-events: auto;

  background: transparent;
outline: none;
}

/* L2 screen-left lower catch lane only */
.ixi-pocket-l2 .ixi-pocket-catch-pad.out-left {
  position: fixed;

  left: 0;
  right: auto;
  top: 405px;

  width: 150px;
  height: calc(100vh - 405px);

  pointer-events: auto;
  z-index: 999;

 background: transparent;
outline: none;
}

/* R2 screen-right lower catch lane only */
.ixi-pocket-r2 .ixi-pocket-catch-pad.out-right {
  position: fixed;

  right: 0;
  left: auto;
  top: 420px;

  width: 150px;
  height: calc(100vh - 420px);

  pointer-events: auto;
  z-index: 999;

  background: transparent;
outline: none;
}

.ixi-pocket-thumbs.thumb-size-small {
  --pocket-thumb-w: 72px;
  --pocket-thumb-h: 48px;
  --pocket-thumbs-top: 30px;
}

.ixi-pocket-thumbs.thumb-size-medium {
  --pocket-thumb-w: 90px;
  --pocket-thumb-h: 60px;
  --pocket-thumbs-top: 30px;
}

.ixi-pocket-thumbs.thumb-size-large {
  --pocket-thumb-w: 108px;
  --pocket-thumb-h: 72px;
  --pocket-thumbs-top: 23px;
}

.ixi-pocket-right .ixi-pocket-thumbs {
  left: 50%;
  right: auto;
}

.ixi-pocket-right .ixi-pocket-thumbs.r1-thumbs {
  left: 50%;
  right: auto;
  transform: translateX(-50%);
}
/* PEEK POCKET COVER */


.ixi-pocket-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ixi-pocket-thumb span {
  display: block;
  padding: 5px;

  color: rgba(255,255,255,.62);

  font-size: 7px;
  font-weight: 900;
  line-height: 1.1;
}

/* Station states — no accordion fan */
.ixi-pocket-left.pocket-mode-closed .ixi-pocket-thumbs,
.ixi-pocket-right.pocket-mode-closed .ixi-pocket-thumbs {
  opacity: .28;
}

.ixi-pocket-left.pocket-mode-peek .ixi-pocket-thumbs,
.ixi-pocket-right.pocket-mode-peek .ixi-pocket-thumbs,
.ixi-pocket-left.pocket-mode-open .ixi-pocket-thumbs,
.ixi-pocket-right.pocket-mode-open .ixi-pocket-thumbs {
  opacity: 1;
}

.ixi-pocket-left.occupied .ixi-pocket-thumb,
.ixi-pocket-right.occupied .ixi-pocket-thumb {
  border-color: rgba(255,196,0,.22);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.045),
    0 8px 16px rgba(0,0,0,.30),
    0 0 12px rgba(255,196,0,.055);
}

/* =============================== */
/* IXI POCKET STATION INNER GUTS   */
/* =============================== */

.ixi-pocket-thumb {
  width: var(--pocket-thumb-w, 90px) !important;
  height: var(--pocket-thumb-h, 60px) !important;

  position: absolute !important;
  left: 50% !important;
  right: auto !important;
  top: auto !important;
  bottom: 0 !important;

  transform: translateX(-50%) !important;

  overflow: hidden !important;

  border: 1px solid rgba(255,255,255,.12);
  border-radius: 7px 7px 0 0;

  background:
    linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,0) 34%),
    linear-gradient(135deg, rgba(255,255,255,.018), transparent 45%),
    rgba(18,18,18,.94);

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.04),
    0 8px 16px rgba(0,0,0,.30);

  z-index: 34;
}

.ixi-pocket-thumbs {
  position: absolute;
  left: 50%;
  top: var(--pocket-thumbs-top, 30px);
  width: calc(100% - 14px);
  height: var(--pocket-thumb-h, 60px);

  transform: translateX(-50%);
  overflow: visible;

  border: 0;
  background: transparent;

  border: 1px dashed rgba(255,255,255,.08);
  border-radius: 11px 7px 11px 7px;

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.018),
      rgba(255,255,255,0) 20%
    ),
    linear-gradient(
      0deg,
      rgba(255,255,255,.02),
      transparent 30%
    ),
    rgba(10,10,10,.44);

  pointer-events: auto;
  z-index: 30;
}

.ixi-pocket-thumb::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 1px;
  background: rgba(255,255,255,.12);
  z-index: 2;
  pointer-events: none;
}

.ixi-pocket-left::after,
.ixi-pocket-right::after {
  content: "3";

  position: absolute;
  left: 7px;
  right: 7px;
  top: 25px;
  bottom: 7px;

  border: 1px dashed rgba(255,255,255,.08);
  border-radius: 11px 7px 11px 7px;

  background:
    linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0) 20%),
    rgba(10,10,10,.38);

  color: rgba(255,255,255,.22);
  font-size: 5.8px;
  font-weight: 950;
  letter-spacing: .55px;

  display: flex;
  align-items: flex-end;
  justify-content: flex-start;

  padding: 0 0 6px 8px;

  pointer-events: none;
  z-index: 12;
}


.ixi-pocket-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ixi-pocket-thumb span {
  display: block;
  padding: 5px;

  color: rgba(255,255,255,.62);

  font-size: 7px;
  font-weight: 900;
  line-height: 1.1;
}

.ixi-pocket-topline {
  position: absolute;
  left: 9px;
  top: 10px;

  display: flex;
  align-items: center;
  gap: 5px;

  pointer-events: none;
}

.ixi-pocket-topline span {
  color: rgba(255,196,0,.86);

  font-size: 7.5px;
  font-weight: 950;
  letter-spacing: .72px;
  text-transform: uppercase;
}

.ixi-pocket-topline strong {
  color: rgba(255,255,255,.12);

  font-size: 5px;
  font-weight: 950;
  letter-spacing: .58px;
  text-transform: uppercase;
}

:global(.ixi-pocket-thumb) {
  width: var(--pocket-thumb-w, 90px) !important;
  height: var(--pocket-thumb-h, 60px) !important;
  overflow: hidden !important;
}

:global(.ixi-pocket-thumb > div) {
  width: 100% !important;
  height: 100% !important;
  overflow: hidden !important;
}

:global(.ixi-pocket-thumb img) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  display: block !important;
}

/* =============================== */
/* IXI POCKET STATION BUTTONS V12  */
/* existing buttons, new shell home */
/* =============================== */

.ixi-pocket-action-rail {
  position: absolute;
  top: 13px;
  right: 9px;
  
  width: 82px;
  height: 4px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  background: transparent;

  z-index: 80;
  pointer-events: auto;
}

.ixi-pocket-action-rail.left,
.ixi-pocket-action-rail.right {
  right: 9px;
  left: auto;
}

.ixi-pocket-rail-action {
  position: relative;

  width: 15px;
  height: 4px;

  border: 0;
  border-radius: 2px;

  background: rgba(255,255,255,.12);

  padding: 0;
  cursor: pointer;
}

.ixi-pocket-action-rail.is-empty {
  background: transparent;
}

.ixi-pocket-action-rail.is-empty .ixi-pocket-rail-action {
  opacity: .28;
  pointer-events: auto;
}

.ixi-pocket-action-rail.has-machines.pocket-mode-closed {
  background: transparent;
}

.ixi-pocket-action-rail.has-machines.pocket-mode-closed .ixi-pocket-rail-action {
  opacity: .48;
  pointer-events: auto;
  background: rgba(255,196,0,.20);
}

.ixi-pocket-action-rail.has-machines.pocket-mode-peek .ixi-pocket-rail-action,
.ixi-pocket-action-rail.has-machines.pocket-mode-open .ixi-pocket-rail-action {
  opacity: 1;
  pointer-events: auto;
  background: rgba(255,255,255,.14);
}

.ixi-pocket-rail-action:hover {
  background: rgba(255,196,0,.86) !important;
  box-shadow: 0 0 8px rgba(255,196,0,.22);
}

.ixi-pocket-rail-action:hover::after {
  content: attr(data-label);

  position: absolute;
  bottom: 12px;
  left: 50%;

  transform: translateX(-50%);

  white-space: nowrap;

  color: rgba(255,255,255,.72);
  font-size: 6.5px;
  font-weight: 950;
  letter-spacing: .55px;
  text-transform: uppercase;

  pointer-events: none;
}

/* LOADED + STAGED/OPEN = four row-2 search-surface dashes */
.ixi-pocket-action-rail.has-machines.pocket-mode-peek,
.ixi-pocket-action-rail.has-machines.pocket-mode-open {
  background: transparent;
}

/* ACTUAL BUTTON — real click target */
.ixi-pocket-direct-button {
  position: absolute;

  left: 50%;
  bottom: -1px;

  width: 34px;
  height: 5px;

  transform: translateX(-50%);

  border: 0;
  border-radius: 3px 3px 1px 1px;

  background: rgba(255,255,255,.18);

  padding: 0;
  cursor: pointer;

  z-index: 120;
  pointer-events: auto;

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.12),
    0 1px 3px rgba(0,0,0,.32);
}

.ixi-pocket-direct-button.left,
.ixi-pocket-direct-button.right {
  left: 50%;
  right: auto;
  bottom: -1px;
  transform: translateX(-50%);
}

.ixi-pocket-direct-button:hover,
.ixi-pocket-direct-button.is-live {
  background: rgba(255,196,0,.95);
  box-shadow: 0 0 8px rgba(255,196,0,.38);
}

.ixi-pocket-direct-button.has-load {
  background: rgba(255,196,0,.34);
}

/* square thumb-loop actuator, rides above the power dash */
.ixi-pocket-loop-square {
  position: absolute;

  width: 4px;
  height: 14px;

  border: 1px solid rgba(255,255,255,.22);
  border-radius: 1px;

  background: rgba(255,255,255,.12);

  padding: 0;

  cursor: pointer;

  z-index: 99999;
  pointer-events: auto;

  opacity: 0;
}

.ixi-pocket-loop-square.is-visible {
  opacity: 1;
}

.ixi-pocket-loop-square.left {
  top: 68px;
  right: -2px;
}

.ixi-pocket-loop-square.right {
  top: 68px;
  left: -2px;
}

.ixi-pocket-loop-square:hover {
  border-color: rgba(255,196,0,.62);
  background: rgba(255,196,0,.72);
}
/* Roll-top cover: fixed dash/lip, cover moves behind it *


/* =============================== */
/* IXI ACTIVE STACK COMMAND PAD    */
/* GLOBAL — SAVED MASTER CHASSIS   */
/* =============================== */

:global(.active-stack-zone) {
  width: min(100%, 1320px);
  max-width: 1320px;

  margin: 10px auto 24px;

  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;

  align-items: center;
  justify-items: center;

  position: relative;
  z-index: 20;
}

:global(.active-stack) {
  width: 100%;
  position: relative;

  display: grid;
  justify-items: center;
}

:global(.active-stack-dash) {
  width: 34px;
  height: 8px;

  display: block;

  border: 0;
  border-bottom: 3px solid rgba(255,255,255,.14);

  background: transparent;

  cursor: pointer;
  padding: 0;
  margin: 0;

  position: relative;
  z-index: 8;
}

:global(.active-stack-dash:hover) {
  border-bottom-color: rgba(255,196,0,.48);
  box-shadow: 0 3px 8px rgba(255,196,0,.12);
}

:global(.active-stack.open .active-stack-dash) {
  border-bottom-color: rgba(255,196,0,.58);
  box-shadow: 0 3px 10px rgba(255,196,0,.14);
}

:global(.active-stack.has-machines .active-stack-dash) {
  border-bottom-color: rgba(255,196,0,.78);
  box-shadow: 0 3px 12px rgba(255,196,0,.24);
}

:global(.active-stack.has-machines .active-stack-dash::after) {
  content: "";

  position: absolute;
  left: 50%;
  top: 8px;

  width: 5px;
  height: 5px;

  transform: translateX(-50%);

  background: rgba(255,196,0,.92);
  box-shadow: 0 0 8px rgba(255,196,0,.38);
}

/* tray surface */
:global(.active-stack-tray) {
  width: min(100%, 1180px);
  min-height: 230px;

  margin: 8px auto 0;
  padding: 42px 46px 18px;

  position: relative;
  display: block;
  overflow: visible;
  isolation: isolate;

  border: 1px dashed rgba(255,196,0,.14);
  border-radius: 10px;

  background:
    linear-gradient(
      180deg,
      rgba(255,196,0,.035),
      rgba(255,196,0,.008) 48%,
      rgba(255,255,255,.010)
    ),
    rgba(8,8,8,.86);

  box-shadow:
    inset 0 0 0 1px rgba(255,255,255,.025),
    0 0 18px rgba(255,196,0,.045);
}

:global(.active-stack-tray.stack-armed) {
  border-color: rgba(255,196,0,.58);

  background:
    linear-gradient(
      180deg,
      rgba(255,196,0,.065),
      rgba(255,196,0,.014)
    ),
    rgba(8,8,8,.90);

  box-shadow:
    inset 0 0 0 1px rgba(255,196,0,.10),
    0 0 24px rgba(255,196,0,.16);
}

:global(.active-stack-tray::before) {
  content: "ACTIVE STACK DROP ZONE";

  position: absolute;
  left: 14px;
  top: 12px;

  color: rgba(255,255,255,.30);

  font-size: 7px;
  font-weight: 950;
  letter-spacing: .72px;
  text-transform: uppercase;

  pointer-events: none;
  z-index: 1;
}

/* corner destination dashes */
:global(.active-stack-pocket-corners) {
  position: absolute;
  inset: 0;

  pointer-events: none;
  z-index: 42;
}

:global(.stack-pocket-power) {
  position: absolute;

  width: 18px;
  height: 4px;

  border: 0;
  border-radius: 2px;

  background: rgba(0,194,255,.42);

  padding: 0;
  cursor: pointer;
  pointer-events: auto;

  box-shadow: none;
}

:global(.stack-pocket-power:hover) {
  background: rgba(0,194,255,.92);
  box-shadow: 0 0 8px rgba(0,194,255,.30);
}

:global(.stack-pocket-power.top-left) {
  top: 27px;
  left: 14px;
}

:global(.stack-pocket-power.top-right) {
  top: 27px;
  right: 14px;
}

:global(.stack-pocket-power.bottom-left) {
  bottom: 12px;
  left: 14px;
}

:global(.stack-pocket-power.bottom-right) {
  bottom: 12px;
  right: 14px;
}

/* center action rail */
:global(.active-stack-command-pad) {
  position: absolute;
  top: 12px;
  left: 50%;

  width: 150px;
  height: 4px;

  transform: translateX(-50%);

  display: flex;
  align-items: center;
  justify-content: space-between;

  background: transparent;

  z-index: 46;
  pointer-events: auto;
}

:global(.stack-rail-action) {
  position: relative;

  width: 28px;
  height: 4px;

  border: 0;
  border-radius: 0;

  background: rgba(255,255,255,.13);

  padding: 0;
  cursor: pointer;
}

:global(.stack-rail-action:hover) {
  background: rgba(255,196,0,.86);
  box-shadow: 0 0 8px rgba(255,196,0,.22);
}

:global(.stack-rail-action:hover::after) {
  content: attr(data-label);

  position: absolute;
  bottom: 12px;
  left: 50%;

  transform: translateX(-50%);

  white-space: nowrap;

  color: rgba(255,255,255,.72);

  font-size: 7px;
  font-weight: 950;
  letter-spacing: .6px;
  text-transform: uppercase;

  pointer-events: none;
}

:global(.active-stack-send-menu) {
  position: absolute;
  top: 28px;
  left: 50%;

  width: 190px;
  height: 4px;

  transform: translateX(-50%);

  display: flex;
  align-items: center;
  justify-content: space-between;

  z-index: 47;
  pointer-events: auto;
}

:global(.stack-send-option) {
  position: relative;

  width: 28px;
  height: 4px;

  border: 0;
  border-radius: 0;

  background: rgba(255,255,255,.13);

  padding: 0;
  cursor: pointer;
}

:global(.stack-send-option:hover) {
  background: rgba(0,194,255,.86);
  box-shadow: 0 0 8px rgba(0,194,255,.22);
}

:global(.stack-send-option:hover::after) {
  content: attr(data-label);

  position: absolute;
  bottom: 12px;
  left: 50%;

  transform: translateX(-50%);

  white-space: nowrap;

  color: rgba(255,255,255,.72);

  font-size: 7px;
  font-weight: 950;
  letter-spacing: .6px;
  text-transform: uppercase;

  pointer-events: none;
}

/* card field */
:global(.active-stack-dropzone) {
  min-height: 175px;

  position: relative;
  z-index: 2;

  align-items: start;

  border: 1px dashed rgba(255,255,255,.08);
  border-radius: 9px;

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.018),
      rgba(255,255,255,0)
    ),
    rgba(10,10,10,.42);
}

:global(.active-stack-dropzone.stack-horizontal) {
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;

  gap: 18px;

  overflow-x: auto;
  overflow-y: hidden;

  padding: 10px 8px 12px;

  scrollbar-width: thin;
}

:global(.active-stack-dropzone.stack-vertical) {
  display: grid;

  grid-template-columns:
    repeat(auto-fill, minmax(250px, 300px));

  gap: 18px;

  justify-content: center;

  padding: 10px 8px 12px;
}

:global(.active-stack-dropzone.stack-horizontal .active-stack-card) {
  flex: 0 0 285px;
  width: 285px;
  min-width: 285px;
}

:global(.active-stack-dropzone.stack-vertical .active-stack-card) {
  width: 100%;
}

:global(.active-stack-card) {
  position: relative;
  z-index: 3;

  transition:
    transform .15s ease,
    opacity .15s ease,
    box-shadow .15s ease;
}

:global(.active-stack-card:hover) {
  transform: translateY(-2px);
}

:global(.active-stack-card.stack-dragging) {
  z-index: 9999;
  opacity: .96;

  transform: translateY(-4px) scale(1.015);

  box-shadow:
    0 18px 36px rgba(0,0,0,.42),
    0 0 0 1px rgba(255,196,0,.18);
}

:global(.active-stack-card.stack-ghost-target) {
  transform: translateX(8px);
}

        .cards {
          max-width: 1920px;
          margin: 0 auto;

          min-height: 260px;

          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 300px));
          gap: 22px;
          align-items: start;
          justify-content: center;
        }

        .cards.single-card {
          grid-template-columns: minmax(250px, 300px);
          justify-content: center;
        }

        :global(.ixi-drag-overlay-card) {
  width: 300px;
  max-width: 300px;
  pointer-events: none;
  z-index: 999999;
}

:global(.ixi-board-sortable-card) {
  width: 100%;
  max-width: 300px;
  min-width: 250px;

  justify-self: center;
  align-self: start;

  touch-action: none;
}

:global(.ixi-board-sortable-card > *) {
  width: 100%;
}
        .empty {
          max-width: 520px;
          margin: 38px auto 0;
          padding: 38px 28px;

          text-align: center;

          border: 1px solid rgba(255,255,255,.06);
          border-radius: 14px;

          background:
            linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0)),
            #111;

          box-shadow:
            0 14px 34px rgba(0,0,0,.18);
        }

        .empty h3 {
          margin: 0 0 8px;
          color: #f2f2f2;
          font-size: 16px;
          font-weight: 950;
        }

        .empty p {
          margin: 0;
          color: rgba(255,255,255,.42);
          font-size: 12px;
        }
.mobile-search-surface {
  display: none;
}

.desktop-search-surface {
  display: block;
}
@media (max-width: 850px) {
  main {
    padding: 18px 4% 48px;
  }

  .desktop-search-surface {
  display: none;
}

.mobile-search-surface {
  display: block;
}

  .workspace-head {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  margin-bottom: 14px;
}

  .workspace-head h1 {
    font-size: 25px;
  }

  .ixi-command-chassis {
    display: block;
    max-width: 100%;
    margin: 0 auto 18px;
  }

  .ixi-command-center {
    width: 100%;
    max-width: 100%;
  }

  .workspace-controls {
    width: 100%;
    max-width: 100%;
    margin: 0 auto 18px;
  }

  .ixi-command-left,
  .ixi-command-right,
  .ixi-pocket-row,
  .ixi-pocket-left,
  .ixi-pocket-right,
  .active-stack-zone {
    display: none !important;
  }

 .ixi-toolbar {
  width: max-content;
  max-width: 100%;

  margin: 12px auto 0;
  left: 0;

  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: center;

  gap: 16px;
}
.ixi-color-filter {
  flex: 0 0 20px;
}

.ixi-thickness-filter {
  flex: 0 0 24px;
  margin-top: 0;
}
  .ixi-thickness-filter {
    margin-top: 6px;
  }

  .cards {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .cards.single-card {
    grid-template-columns: 1fr;
  }
}
      `}</style>
    </>
  );
}
