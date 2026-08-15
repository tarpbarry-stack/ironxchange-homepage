import { useMemo, useState } from "react";

import IXIMachineRail from "../../../IXIMachineRail";
import IXIAosCardHeaderControls from "../../card-runtime/modules/IXIAosCardHeaderControls";

const NATIVE_WIDTH = 298;
const NATIVE_HEIGHT = 471;
const RAIL_HEIGHT = 19;
const HEADER_HEIGHT = 43;
const ACTIONS_HEIGHT = 27;

function clean(value) {
  return String(value ?? "").trim();
}

function yn(value, fallback = "YES") {
  if (value === true) return "YES";
  if (value === false) return "NO";
  return clean(value) || fallback;
}

function FieldRow({ icon = "•", label, value, editing = false, onChange = null }) {
  return (
    <div className="ops-field-row">
      <span className="ops-icon" aria-hidden="true">{icon}</span>
      <span className="ops-label">{label}</span>
      {editing ? (
        <input value={value || ""} onChange={event => onChange?.(event.target.value)} />
      ) : (
        <strong title={clean(value)}>{clean(value) || "—"}</strong>
      )}
      <button type="button" className="ops-edit-button" onClick={() => onChange?.(value)}>EDIT</button>
    </div>
  );
}

function Tile({ icon = "•", label, value, emphasis = false }) {
  return (
    <div className={emphasis ? "ops-tile emphasis" : "ops-tile"}>
      <span className="ops-tile-icon" aria-hidden="true">{icon}</span>
      <span className="ops-tile-label">{label}</span>
      <strong>{clean(value) || "—"}</strong>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="ops-section">
      <div className="ops-section-title">{title}</div>
      <div className="ops-section-body">{children}</div>
    </section>
  );
}

export default function IXIAosLocationFace2Operations({
  object = {},
  ixiState = {},
  onIxiStateChange = null,
  onAddObject = null,
  onHideObject = null,
  onDeleteObject = null,
  onOpenConsole = null,
  onRecall = null,
  onBoard = null,
  onReturn = null,
  onSendFront = null,
  onSendBack = null,
  onCycleColor = null,
  onCycleOutline = null,
  armedDestination = "",
  onSendToArmedDestination = null
}) {
  const objectId = clean(object?.objectId || object?.id);
  const [editing, setEditing] = useState(false);
  const [draftFields, setDraftFields] = useState(() => ({ ...(object?.fields || {}) }));

  const fields = editing ? draftFields : (object?.fields || {});
  const displayName = clean(object?.displayName) || "YARD NAME";

  const address = useMemo(() => {
    const cityStateZip = [
      [clean(fields.city), clean(fields.state)].filter(Boolean).join(", "),
      clean(fields.postalCode)
    ].filter(Boolean).join(" ");
    return [clean(fields.address1), cityStateZip].filter(Boolean).join(" · ");
  }, [fields.address1, fields.city, fields.state, fields.postalCode]);

  function patchField(key, value) {
    setDraftFields(current => ({ ...current, [key]: value }));
  }

  function beginEdit() {
    setDraftFields({ ...(object?.fields || {}) });
    setEditing(true);
    if (objectId) onIxiStateChange?.(objectId, { editingFace2: true });
  }

  function finishEdit() {
    setEditing(false);
    if (objectId) {
      onIxiStateChange?.(objectId, {
        editingFace2: false,
        face2DraftFields: { ...draftFields }
      });
    }
  }

  const relationshipItems = [
    ["SHOP", "shop"],
    ["LOADING AREA", "loadingArea"],
    ["GATE", "gate"],
    ["FORKLIFT", "forklift"]
  ];

  return (
    <div className="ixi-aos-location-f2 card board-color-none board-outline-1">
      <header className="ops-header">
        <div className="ops-identity">
          <span>LOCATIONS FACE 2 · OPERATIONS</span>
          <strong>{displayName}</strong>
        </div>
        <IXIAosCardHeaderControls
          canAdd
          canEdit
          editing={editing}
          onAdd={onAddObject}
          onToggleEdit={editing ? finishEdit : beginEdit}
          onHide={onHideObject}
          onDelete={onDeleteObject}
          onOpenConsole={onOpenConsole}
        />
      </header>

      <div className="ops-scroll-body">
        <div className="gate-code-row">
          <span>GATE CODE</span>
          <strong>▣ {clean(fields.gateCode) || "4821"}</strong>
          <button type="button" onClick={beginEdit}>EDIT</button>
        </div>

        <Section title="ARRIVAL">
          <FieldRow icon="⌖" label="ADDRESS" value={address} editing={false} />
          <FieldRow icon="⌖" label="GPS COORDINATES" value={clean(fields.gpsCoordinates) || "32.899110, -97.040339"} editing={editing} onChange={value => patchField("gpsCoordinates", value)} />
          <FieldRow icon="●" label="YARD CONTACT" value={clean(fields.yardContact) || "JOHN CARTER"} editing={editing} onChange={value => patchField("yardContact", value)} />
          <FieldRow icon="◴" label="HOURS OF OPERATION" value={clean(fields.yardHours) || "MON – SAT 6:00 AM – 6:00 PM"} editing={editing} onChange={value => patchField("yardHours", value)} />
          <FieldRow icon="☑" label="APPOINTMENT REQUIRED" value={yn(fields.appointmentRequired, "NO")} editing={editing} onChange={value => patchField("appointmentRequired", value)} />
          <FieldRow icon="☑" label="CHECK-IN REQUIRED" value={yn(fields.checkInRequired, "YES")} editing={editing} onChange={value => patchField("checkInRequired", value)} />
        </Section>

        <Section title="TRUCK ACCESS">
          <div className="ops-grid four">
            <Tile icon="▰" label="SEMI ACCESS" value={yn(fields.semiAccess)} />
            <Tile icon="▱" label="53' TRAILER" value={yn(fields.trailer53Access)} />
            <Tile icon="▰" label="LOWBOY" value={yn(fields.lowboyAccess)} />
            <Tile icon="▰" label="OVERSIZE" value={yn(fields.oversizeAccess)} />
            <Tile icon="↪" label="DRIVE-THRU" value={yn(fields.driveThrough, "NO")} />
            <Tile icon="⟳" label="TURNAROUND" value={yn(fields.turnaround)} />
            <Tile icon="↔" label="GATE WIDTH" value={clean(fields.gateWidth) || "32 FT"} emphasis />
            <Tile icon="⌂" label="OVERHEAD" value={clean(fields.overheadClearance) || "OPEN"} emphasis />
          </div>
          <div className="ops-wide-fact"><span>⚠ WEIGHT RESTRICTION</span><strong>{clean(fields.weightRestriction) || "NO"}</strong></div>
        </Section>

        <Section title="LOADING & HANDLING">
          <div className="ops-grid two">
            <Tile icon="♜" label="LOADING / UNLOADING" value={yn(fields.loadingUnloading)} />
            <Tile icon="♙" label="FORKLIFT" value={clean(fields.forkliftCapacity) || "YES · 15,000 LB"} />
            <Tile icon="♜" label="LOADING ASSISTANCE" value={yn(fields.loadingAssistance)} />
            <Tile icon="♨" label="HEAVY LIFT" value={yn(fields.heavyLift)} />
            <Tile icon="▤" label="DOCKS" value={yn(fields.docks, "NO")} />
            <Tile icon="◒" label="WET LOAD" value={yn(fields.wetLoad)} />
            <Tile icon="▤" label="RAMPS" value={clean(fields.ramps) || "2"} />
            <Tile icon="♧" label="GRADE-LEVEL LOADING" value={yn(fields.gradeLevelLoading)} />
          </div>
        </Section>

        <Section title="YARD / SITE CONDITIONS">
          <div className="ops-grid four compact">
            <Tile icon="♜" label="SURFACE" value={clean(fields.surfaceType) || "GRAVEL / PAVED"} />
            <Tile icon="◒" label="DRAINAGE" value={clean(fields.drainage) || "GOOD"} />
            <Tile icon="☀" label="LIGHTED" value={yn(fields.lighted)} />
            <Tile icon="♜" label="FENCED / GATED" value={yn(fields.fencedGated)} />
          </div>
          <div className="ops-chip-row">
            <span>● STAGING AREA&nbsp; {yn(fields.stagingArea)}</span>
            <span>● TRAILER PARKING&nbsp; {yn(fields.trailerParking)}</span>
            <span>● OVERNIGHT PARKING&nbsp; {yn(fields.overnightParking)}</span>
            <span>● ALL-WEATHER&nbsp; {yn(fields.allWeatherAccess)}</span>
          </div>
        </Section>

        <Section title="SERVICES & UTILITIES">
          <div className="ops-grid four compact">
            <Tile icon="ϟ" label="ELECTRIC" value={clean(fields.electricService) || "120/240/480"} />
            <Tile icon="ϟ" label="THREE PHASE" value={yn(fields.threePhase)} />
            <Tile icon="✣" label="AIR" value={clean(fields.airService) || "120 PSI"} />
            <Tile icon="◉" label="WATER" value={yn(fields.water)} />
            <Tile icon="▣" label="FUEL" value={clean(fields.fuel) || "DIESEL / DEF"} />
            <Tile icon="▣" label="WASH AREA" value={yn(fields.washArea)} />
            <Tile icon="↯" label="JUMP START" value={yn(fields.jumpStart)} />
            <Tile icon="⌘" label="JUMPER CABLES" value={yn(fields.jumperCables)} />
          </div>
        </Section>

        <Section title="SITE INSTRUCTIONS">
          <div className="site-instructions">
            <span>◴</span>
            {editing ? (
              <textarea value={fields.siteInstructions || ""} onChange={event => patchField("siteInstructions", event.target.value)} />
            ) : (
              <strong>{clean(fields.siteInstructions) || "ENTER NORTH GATE FROM RAMA DR. CALL ON ARRIVAL. LOWBOYS STAGE LEFT OF SHOP."}</strong>
            )}
            <button type="button" onClick={beginEdit}>EDIT</button>
          </div>
        </Section>

        <Section title="RELATIONSHIPS & INFRASTRUCTURE">
          <div className="relationship-row">
            {relationshipItems.map(([label]) => (
              <button type="button" key={label}>{label}<span>›</span></button>
            ))}
          </div>
        </Section>
      </div>

      <div className="ops-actions">
        <button type="button" onClick={() => onRecall?.(object)}>↻ <span>RECALL</span></button>
        <button type="button" onClick={() => onBoard?.(object)}>▦ <span>BOARD</span></button>
        <button type="button" onClick={() => onReturn?.(object)}>↩ <span>RETURN</span></button>
      </div>

      <IXIMachineRail
        listing={object}
        saved={false}
        boardColor="none"
        boardOutline={1}
        machineFace={2}
        onSendFront={onSendFront}
        onSendBack={onSendBack}
        onCycleColor={onCycleColor}
        onCycleOutline={onCycleOutline}
        armedDestination={armedDestination}
        onSendToArmedDestination={onSendToArmedDestination}
      />

      <style jsx>{`
        .ixi-aos-location-f2,.ixi-aos-location-f2 *{box-sizing:border-box}
        .ixi-aos-location-f2{
          --f2-bg:#0d0e0e;
          --f2-panel:#121414;
          --f2-panel-2:#0a0b0b;
          --f2-border:rgba(255,255,255,.10);
          --f2-border-soft:rgba(255,255,255,.055);
          --f2-text:#eceeec;
          --f2-muted:rgba(255,255,255,.55);
          --f2-dim:rgba(255,255,255,.32);
          --f2-accent:#ffc400;
          --f2-cyan:#00c2ff;
          --f2-good:#9ad600;
          position:relative;width:${NATIVE_WIDTH}px;height:${NATIVE_HEIGHT}px;overflow:hidden;
          border:1px solid var(--f2-border);border-radius:14px;background:var(--f2-bg);color:var(--f2-text);
          box-shadow:inset 0 1px 0 rgba(255,255,255,.04),0 18px 34px rgba(0,0,0,.42);
          font-family:inherit;
        }
        .ops-header{position:absolute;top:0;left:0;right:0;height:${HEADER_HEIGHT}px;padding:7px 10px 4px;display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid var(--f2-border-soft);background:linear-gradient(180deg,rgba(255,255,255,.025),transparent);z-index:5}
        .ops-identity{min-width:0;flex:1}.ops-identity span{display:block;color:var(--f2-accent);font-size:6.4px;font-weight:950;letter-spacing:.06em}.ops-identity strong{display:block;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:15px;line-height:1;font-weight:950}
        .ops-scroll-body{position:absolute;top:${HEADER_HEIGHT}px;left:0;right:0;bottom:${RAIL_HEIGHT + ACTIONS_HEIGHT}px;overflow-y:auto;overflow-x:hidden;padding:5px 6px 8px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.15) transparent}
        .ops-scroll-body::-webkit-scrollbar{width:4px}.ops-scroll-body::-webkit-scrollbar-track{background:transparent}.ops-scroll-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.14);border-radius:999px}.ops-scroll-body::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.25)}
        .gate-code-row{height:35px;display:grid;grid-template-columns:72px 1fr 40px;align-items:center;padding:0 7px;margin-bottom:6px;border:1px solid rgba(255,196,0,.38);border-radius:5px;background:linear-gradient(180deg,rgba(255,196,0,.055),rgba(255,196,0,.01))}.gate-code-row span{color:var(--f2-accent);font-size:6.5px;font-weight:950}.gate-code-row strong{font-size:17px;letter-spacing:.06em}.gate-code-row button,.ops-edit-button,.site-instructions button{height:19px;border:1px solid var(--f2-border);border-radius:3px;background:#0b0c0c;color:rgba(255,255,255,.72);font-size:6px;font-weight:950;cursor:pointer}
        .ops-section{margin-bottom:6px;border:1px solid var(--f2-border-soft);border-radius:5px;background:linear-gradient(180deg,rgba(255,255,255,.018),transparent),var(--f2-panel-2);overflow:hidden}.ops-section-title{height:20px;display:flex;align-items:center;padding:0 7px;color:var(--f2-accent);font-size:6.4px;font-weight:950;letter-spacing:.065em;border-bottom:1px solid var(--f2-border-soft)}.ops-section-body{padding:3px}
        .ops-field-row{min-height:23px;display:grid;grid-template-columns:18px 92px minmax(0,1fr) 34px;align-items:center;border-bottom:1px solid rgba(255,255,255,.04)}.ops-field-row:last-child{border-bottom:0}.ops-icon{color:rgba(255,255,255,.72);font-size:8px;text-align:center}.ops-label{color:rgba(255,255,255,.72);font-size:6px;font-weight:850}.ops-field-row strong{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:rgba(255,255,255,.90);font-size:6.6px;font-weight:900}.ops-field-row input{min-width:0;width:100%;height:18px;border:1px solid rgba(255,196,0,.35);border-radius:3px;background:#070808;color:#fff;font-size:6.5px;padding:0 4px;outline:none}.ops-edit-button{height:16px;font-size:5.5px}
        .ops-grid{display:grid;gap:2px}.ops-grid.four{grid-template-columns:repeat(4,minmax(0,1fr))}.ops-grid.two{grid-template-columns:repeat(2,minmax(0,1fr))}.ops-tile{min-height:39px;display:grid;grid-template-columns:15px 1fr;grid-template-rows:auto auto;align-items:center;padding:4px;border:1px solid rgba(255,255,255,.055);border-radius:3px;background:rgba(255,255,255,.018)}.ops-tile-icon{grid-row:1/span 2;color:rgba(255,255,255,.70);font-size:8px}.ops-tile-label{font-size:5.2px;font-weight:850;color:rgba(255,255,255,.66);line-height:1.15}.ops-tile strong{color:#f2f2ef;font-size:6.4px;font-weight:950;line-height:1.1}.ops-tile.emphasis strong{color:var(--f2-good)}.ops-grid.compact .ops-tile{min-height:36px}
        .ops-wide-fact{height:23px;margin-top:2px;padding:0 7px;display:flex;align-items:center;justify-content:space-between;border:1px solid rgba(255,255,255,.05);border-radius:3px}.ops-wide-fact span{font-size:5.7px;font-weight:850;color:rgba(255,255,255,.68)}.ops-wide-fact strong{font-size:6.5px}
        .ops-chip-row{display:flex;gap:5px;flex-wrap:wrap;padding:5px 4px 2px}.ops-chip-row span{color:rgba(255,255,255,.62);font-size:5.3px;font-weight:850}.ops-chip-row span::first-letter{color:var(--f2-good)}
        .site-instructions{min-height:42px;display:grid;grid-template-columns:18px minmax(0,1fr) 34px;gap:3px;align-items:center;padding:4px}.site-instructions>span{color:var(--f2-accent);text-align:center}.site-instructions strong{font-size:6px;line-height:1.35;font-weight:850;color:rgba(255,255,255,.84)}.site-instructions textarea{width:100%;min-height:34px;resize:vertical;border:1px solid rgba(255,196,0,.35);border-radius:3px;background:#070808;color:#fff;font-size:6px;padding:4px;outline:none}
        .relationship-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:3px}.relationship-row button{height:25px;display:flex;align-items:center;justify-content:space-between;padding:0 6px;border:1px solid rgba(255,255,255,.08);border-radius:3px;background:rgba(255,255,255,.018);color:rgba(255,255,255,.82);font-size:5.8px;font-weight:900}.relationship-row button span{color:var(--f2-cyan);font-size:10px}
        .ops-actions{position:absolute;left:0;right:0;bottom:${RAIL_HEIGHT}px;height:${ACTIONS_HEIGHT}px;display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid var(--f2-border-soft);background:#090a0a;z-index:6}.ops-actions button{border:0;border-right:1px solid rgba(255,255,255,.05);background:transparent;color:var(--f2-cyan);font-size:7px;font-weight:950}.ops-actions button:last-child{border-right:0}.ops-actions span{margin-left:4px;color:rgba(255,255,255,.66);font-size:6px}
      `}</style>
    </div>
  );
}
