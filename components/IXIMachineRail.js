// IXI Machine Rail
// Card-level machine control strip.
// One half of IXI Machine Controls™.
// The other half is IXIEnvironmentRail.

export default function IXIMachineRail({
  listing,
  saved,
  boardColor,
  boardOutline,
  onSendFront,
  onSendBack,
  onCycleColor,
  onCycleOutline,
  onEndRelationship,
  onToggleSaved,
  armedDestination,
  onSendToArmedDestination
}) {
 return (
  <>
    <div className="board-command-rail">
    <button
      type="button"
      className="rail-zone rail-half"
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        onSendFront?.(listing);
      }}
    />

    <button
      type="button"
      className="rail-zone rail-color"
      onClick={onCycleColor}
    />

   <button
  type="button"
  className="rail-zone rail-width rail-width-strength"
  onClick={onCycleOutline}
  aria-label="Change relationship strength"
/>

<button
  type="button"
  className="rail-zone rail-flip"
  onClick={e => {
    e.preventDefault();
    e.stopPropagation();
  }}
  aria-label="Flip card"
/>

<button
  type="button"
  className="rail-zone rail-send"
  onClick={e => {
    e.preventDefault();
    e.stopPropagation();
  }}
  aria-label="Send machine"
/>

<button
  type="button"
  className={`rail-zone rail-sync ${
  armedDestination ? "destination-armed" : ""
}`}
  onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();
  onSendToArmedDestination?.(listing);
}}
  aria-label="Sync machine"
/>
    
    <button
      type="button"
      className="rail-zone rail-half"
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        onSendBack?.(listing);
      }}
    />
  </div>

    <style jsx>{`      

.board-command-rail {
  position: absolute;
  left: 0px;
  right: 0px;
  bottom: -1px;

  height: 16px;
  min-height: 16px;
  max-height: 16px;

 display: grid;

grid-template-columns:
  .55fr
  1.15fr
  .65fr
  1fr
  1fr
  1fr
  .55fr;

  border-top: 1px solid rgba(0,194,255,.18);
  border-radius: 0 0 10px 10px;

  background:
    linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,0)),
    linear-gradient(90deg, rgba(0,194,255,.045), transparent 18%, transparent 82%, rgba(255,196,0,.028)),
    rgba(15,15,15,.96);

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.045),
    inset 0 -1px 0 rgba(0,0,0,.34),
    0 -1px 0 rgba(0,0,0,.28);

  overflow: hidden;
  z-index: 30;
}

.board-command-rail::before {
  content: "";

  position: absolute;
  left: 0;
  right: 0;
  top: 0;

  height: 1px;

  background:
    linear-gradient(
      90deg,
      transparent,
      rgba(255,255,255,.06),
      transparent
    );
}

.rail-zone {
  position: relative;
  border: none;
  border-right: 1px solid rgba(255,255,255,.04);
  background: transparent;
  cursor: pointer;
  padding: 0;

  transition:
    background .14s ease,
    box-shadow .14s ease,
    transform .14s ease;
}

.rail-zone:last-child {
  border-right: none;
}

.rail-zone::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;

  width: 14px;
  height: 4px;

  transform: translate(-50%, -50%);

  border-radius: 999px;

  background: rgba(255,255,255,.18);

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.08),
    0 0 4px rgba(255,255,255,.045);

  transition:
    background .14s ease,
    box-shadow .14s ease,
    opacity .14s ease,
    width .14s ease,
    transform .14s ease;
}

/* END DASHES */
.rail-half::after {
  width: 8px;
  opacity: .72;
}

/* COLOR DASH — follows selected IXI color */
.card.board-color-none .rail-color::after {
  background: rgba(255,255,255,.24);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.08),
    0 0 4px rgba(255,255,255,.055);
}

.card.board-color-green .rail-color::after {
  background: rgba(56,161,105,.76);
  box-shadow: 0 0 6px rgba(56,161,105,.18);
}

.card.board-color-yellow .rail-color::after {
  background: rgba(255,196,0,.82);

  box-shadow:
    0 0 8px rgba(255,196,0,.24),
    0 0 14px rgba(255,196,0,.08);
}

.card.board-color-red .rail-color::after {
  background: rgba(229,62,62,.78);
  box-shadow: 0 0 6px rgba(229,62,62,.18);
}

.card.board-color-cyan .rail-color::after {
  background: rgba(0,194,255,.76);
  box-shadow: 0 0 6px rgba(0,194,255,.18);
}

.card.board-color-white .rail-color::after {
  background: rgba(255,255,255,.58);
  box-shadow: 0 0 6px rgba(255,255,255,.14);
}

.card.board-color-blue .rail-color::after {
  background: rgba(49,130,206,.78);
  box-shadow: 0 0 6px rgba(49,130,206,.18);
}

.card.board-color-orange .rail-color::after {
  background: rgba(249,133,18,.78);
  box-shadow: 0 0 6px rgba(249,133,18,.18);
}


.rail-width-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 0;
}

.rail-width-split::after {
  display: none;
}

.rail-width-half {
  position: relative;
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
}

.rail-width-strength {
  border-right: 1px solid rgba(0,194,255,.075);
}

.rail-width-half::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;

  width: 7px;
  height: 4px;

  transform: translate(-50%, -50%);
  border-radius: 999px;

  background: rgba(255,255,255,.18);
}

.rail-width-end::after {
  width: 5px;
  height: 5px;

  border-radius: 1px;

  background: rgba(255,255,255,.22);

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.08),
    0 0 4px rgba(255,255,255,.045);
}

.rail-width-end:hover::after {
  background: rgba(255,255,255,.38);
}


/* WIDTH DASH — follows selected color, 3 strength states */
.card.board-outline-1 .rail-width-strength::after {
  width: 9px;
  opacity: .46;
  box-shadow: none;
}

.card.board-outline-3 .rail-width-strength::after {
  width: 12px;
  opacity: .68;
  box-shadow: 0 0 5px rgba(255,255,255,.08);
}

.card.board-outline-5 .rail-width-strength::after {
  width: 15px;
  opacity: .92;
  box-shadow: 0 0 7px rgba(255,255,255,.12);
}

.card.board-color-none .rail-width-strength::after {
  background: rgba(255,255,255,.28);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.08),
    0 0 4px rgba(255,255,255,.06);
}

.card.board-color-green .rail-width-strength::after {
  background: rgba(56,161,105,.78);
}

.card.board-color-yellow .rail-width-strength::after {
  background: rgba(255,196,0,.82);
}

.card.board-color-red .rail-width-strength::after {
  background: rgba(229,62,62,.82);
}

.card.board-color-cyan .rail-width-strength::after {
  background: rgba(0,194,255,.82);
}

.card.board-color-white .rail-width-strength::after {
  background: rgba(255,255,255,.70);
}

.card.board-color-blue .rail-width-strength::after {
  background: rgba(49,130,206,.82);
}

.card.board-color-orange .rail-width-strength::after {
  background: rgba(249,133,18,.82);
}

/* PIN DASH — placeholder, dash only */
.rail-pin::after {
  background: rgba(255,255,255,.12);
}

/* SAVE DASH — dash only, yellow when saved */
.rail-save::after {
  background: rgba(255,255,255,.12);
}

.rail-save.saved::after {
  background: rgba(255,196,0,.72);
  box-shadow:
    0 0 6px rgba(255,196,0,.24);
}

/* HOVER */
.rail-zone:hover {
  transform: translateY(-1px);

  background:
    linear-gradient(
      180deg,
      rgba(0,194,255,.06),
      rgba(0,194,255,.015)
    );

  box-shadow:
    inset 0 0 0 1px rgba(0,194,255,.12),
    0 0 10px rgba(0,194,255,.06);
}

.rail-zone:hover::after {
  background: rgba(0,194,255,.68);
  transform: translate(-50%, -50%) scaleX(1.08);

  box-shadow:
    0 0 6px rgba(0,194,255,.48),
    0 0 14px rgba(0,194,255,.24);
}

/* KEEP SAVE YELLOW ON HOVER WHEN SAVED */
.rail-save.saved:hover::after {
  background: rgba(255,196,0,.82);
  box-shadow:
    0 0 7px rgba(255,196,0,.30);
}

.destination-armed {
  background: rgba(0,194,255,.92) !important;
  box-shadow: 0 0 10px rgba(0,194,255,.28);
}

.rail-sync.destination-armed::after {
  background: rgba(0,194,255,.92) !important;

  box-shadow:
    0 0 7px rgba(0,194,255,.42),
    0 0 14px rgba(0,194,255,.20);
}

                `}</style>
  </>
);
}
