import { useMemo, useState } from "react";

import IXIMachineRail from "../../../IXIMachineRail";
import IXIAosCardHeaderControls from "../../card-runtime/modules/IXIAosCardHeaderControls";

const NATIVE_WIDTH = 298;
const NATIVE_HEIGHT = 471;
const RAIL_HEIGHT = 19;
const HEADER_HEIGHT = 43;

function clean(value) {
  return String(value ?? "").trim();
}

function yn(value, fallback = "YES") {
  if (value === true) return "YES";
  if (value === false) return "NO";
  const normalized = clean(value).toUpperCase();
  if (normalized === "YES" || normalized === "NO") return normalized;
  return fallback;
}

function Section({ title, children }) {
  return (
    <section className="ops-section">
      <div className="ops-section-title">{title}</div>
      <div className="ops-section-body">{children}</div>
    </section>
  );
}

function TextRow({ icon = "•", label, value, editing = false, onChange = null }) {
  return (
    <div className="ops-field-row">
      <span className="ops-icon" aria-hidden="true">{icon}</span>
      <span className="ops-label">{label}</span>
      {editing ? (
        <input
          className="ops-inline-input"
          value={value ?? ""}
          onChange={event => onChange?.(event.target.value)}
        />
      ) : (
        <strong>{clean(value) || "—"}</strong>
      )}
    </div>
  );
}

function YesNoRow({ icon = "☑", label, value, editing = false, onChange = null, fallback = "YES" }) {
  const display = yn(value, fallback);
  return (
    <div className="ops-field-row">
      <span className="ops-icon" aria-hidden="true">{icon}</span>
      <span className="ops-label">{label}</span>
      {editing ? (
        <select
          className="ops-inline-input"
          value={display}
          onChange={event => onChange?.(event.target.value)}
        >
          <option value="YES">YES</option>
          <option value="NO">NO</option>
        </select>
      ) : (
        <strong>{display}</strong>
      )}
    </div>
  );
}

function Tile({ icon = "•", label, value, editing = false, onChange = null, type = "text", emphasis = false }) {
  const display = type === "yesno" ? yn(value) : clean(value);

  return (
    <div className={emphasis ? "ops-tile emphasis" : "ops-tile"}>
      <span className="ops-tile-icon" aria-hidden="true">{icon}</span>
      <span className="ops-tile-label">{label}</span>
      {editing ? (
        type === "yesno" ? (
          <select
            className="ops-tile-editor"
            value={display || "YES"}
            onChange={event => onChange?.(event.target.value)}
          >
            <option value="YES">YES</option>
            <option value="NO">NO</option>
          </select>
        ) : (
          <input
            className="ops-tile-editor"
            value={value ?? ""}
            onChange={event => onChange?.(event.target.value)}
          />
        )
      ) : (
        <strong>{display || "—"}</strong>
      )}
    </div>
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
  onSendFront = null,
  onSendBack = null,
  onCycleColor = null,
  onCycleOutline = null,
  armedDestination = "",
  onSendToArmedDestination = null
}) {
  const objectId = clean(object?.objectId || object?.id);
  const [editing, setEditing] = useState(Boolean(ixiState?.editingFace2));
  const [draftFields, setDraftFields] = useState(() => ({ ...(object?.fields || {}) }));

  const fields = editing ? draftFields : (object?.fields || {});
  const displayName = clean(object?.displayName) || "YARD NAME";

  const address = useMemo(() => {
    const cityStateZip = [
      [clean(fields.city), clean(fields.state)].filter(Boolean).join(", "),
      clean(fields.postalCode)
    ].filter(Boolean).join(" ");

    return [clean(fields.address1), cityStateZip]
      .filter(Boolean)
      .join(" · ");
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
          {editing ? (
            <input
              value={fields.gateCode ?? "4821"}
              onChange={event => patchField("gateCode", event.target.value)}
            />
          ) : (
            <strong><span className="lock">▣</span>{clean(fields.gateCode) || "4821"}</strong>
          )}
        </div>

        <Section title="ARRIVAL">
          <TextRow icon="⌖" label="ADDRESS" value={address} />
          <TextRow
            icon="⌖"
            label="GPS COORDINATES"
            value={clean(fields.gpsCoordinates) || "32.899110, -97.040339"}
            editing={editing}
            onChange={value => patchField("gpsCoordinates", value)}
          />
          <TextRow
            icon="●"
            label="YARD CONTACT"
            value={clean(fields.yardContact) || "JOHN CARTER"}
            editing={editing}
            onChange={value => patchField("yardContact", value)}
          />
          <TextRow
            icon="◴"
            label="HOURS OF OPERATION"
            value={clean(fields.yardHours) || "MON – SAT 6:00 AM – 6:00 PM"}
            editing={editing}
            onChange={value => patchField("yardHours", value)}
          />
          <YesNoRow
            label="APPOINTMENT REQUIRED"
            value={fields.appointmentRequired}
            fallback="NO"
            editing={editing}
            onChange={value => patchField("appointmentRequired", value)}
          />
          <YesNoRow
            label="CHECK-IN REQUIRED"
            value={fields.checkInRequired}
            fallback="YES"
            editing={editing}
            onChange={value => patchField("checkInRequired", value)}
          />
        </Section>

        <Section title="TRUCK ACCESS">
          <div className="ops-grid four">
            <Tile icon="▰" label="SEMI ACCESS" value={fields.semiAccess} type="yesno" editing={editing} onChange={value => patchField("semiAccess", value)} />
            <Tile icon="▱" label="53' TRAILER" value={fields.trailer53Access} type="yesno" editing={editing} onChange={value => patchField("trailer53Access", value)} />
            <Tile icon="▰" label="LOWBOY" value={fields.lowboyAccess} type="yesno" editing={editing} onChange={value => patchField("lowboyAccess", value)} />
            <Tile icon="▰" label="OVERSIZE" value={fields.oversizeAccess} type="yesno" editing={editing} onChange={value => patchField("oversizeAccess", value)} />
            <Tile icon="↪" label="DRIVE-THRU" value={yn(fields.driveThrough, "NO")} type="yesno" editing={editing} onChange={value => patchField("driveThrough", value)} />
            <Tile icon="⟳" label="TURNAROUND" value={fields.turnaround} type="yesno" editing={editing} onChange={value => patchField("turnaround", value)} />
            <Tile icon="↔" label="GATE WIDTH" value={clean(fields.gateWidth) || "32 FT"} editing={editing} onChange={value => patchField("gateWidth", value)} emphasis />
            <Tile icon="⌂" label="OVERHEAD" value={clean(fields.overheadClearance) || "OPEN"} editing={editing} onChange={value => patchField("overheadClearance", value)} emphasis />
          </div>
          <div className="ops-wide-fact">
            <span>⚠ WEIGHT RESTRICTION</span>
            {editing ? (
              <input value={fields.weightRestriction ?? "NO"} onChange={event => patchField("weightRestriction", event.target.value)} />
            ) : (
              <strong>{clean(fields.weightRestriction) || "NO"}</strong>
            )}
          </div>
        </Section>

        <Section title="LOADING & HANDLING">
          <div className="ops-grid two">
            <Tile icon="♜" label="LOADING / UNLOADING" value={fields.loadingUnloading} type="yesno" editing={editing} onChange={value => patchField("loadingUnloading", value)} />
            <Tile icon="♙" label="FORKLIFT" value={clean(fields.forkliftCapacity) || "YES · 15,000 LB"} editing={editing} onChange={value => patchField("forkliftCapacity", value)} />
            <Tile icon="♜" label="LOADING ASSISTANCE" value={fields.loadingAssistance} type="yesno" editing={editing} onChange={value => patchField("loadingAssistance", value)} />
            <Tile icon="♨" label="HEAVY LIFT" value={fields.heavyLift} type="yesno" editing={editing} onChange={value => patchField("heavyLift", value)} />
            <Tile icon="▤" label="DOCKS" value={yn(fields.docks, "NO")} type="yesno" editing={editing} onChange={value => patchField("docks", value)} />
            <Tile icon="◒" label="WET LOAD" value={fields.wetLoad} type="yesno" editing={editing} onChange={value => patchField("wetLoad", value)} />
            <Tile icon="▤" label="RAMPS" value={clean(fields.ramps) || "2"} editing={editing} onChange={value => patchField("ramps", value)} />
            <Tile icon="♧" label="GRADE-LEVEL LOADING" value={fields.gradeLevelLoading} type="yesno" editing={editing} onChange={value => patchField("gradeLevelLoading", value)} />
          </div>
        </Section>

        <Section title="YARD / SITE CONDITIONS">
          <div className="ops-grid four compact">
            <Tile icon="♜" label="SURFACE" value={clean(fields.surfaceType) || "GRAVEL / PAVED"} editing={editing} onChange={value => patchField("surfaceType", value)} />
            <Tile icon="◒" label="DRAINAGE" value={clean(fields.drainage) || "GOOD"} editing={editing} onChange={value => patchField("drainage", value)} />
            <Tile icon="☀" label="LIGHTED" value={fields.lighted} type="yesno" editing={editing} onChange={value => patchField("lighted", value)} />
            <Tile icon="♜" label="FENCED / GATED" value={fields.fencedGated} type="yesno" editing={editing} onChange={value => patchField("fencedGated", value)} />
          </div>
          <div className="ops-chip-row">
            {[
              ["STAGING AREA", "stagingArea"],
              ["TRAILER PARKING", "trailerParking"],
              ["OVERNIGHT PARKING", "overnightParking"],
              ["ALL-WEATHER", "allWeatherAccess"]
            ].map(([label, key]) => (
              <label key={key}>
                <span>● {label}</span>
                {editing ? (
                  <select value={yn(fields[key])} onChange={event => patchField(key, event.target.value)}>
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                  </select>
                ) : (
                  <strong>{yn(fields[key])}</strong>
                )}
              </label>
            ))}
          </div>
        </Section>

        <Section title="SERVICES & UTILITIES">
          <div className="ops-grid four compact">
            <Tile icon="ϟ" label="ELECTRIC" value={clean(fields.electricService) || "120/240/480"} editing={editing} onChange={value => patchField("electricService", value)} />
            <Tile icon="ϟ" label="THREE PHASE" value={fields.threePhase} type="yesno" editing={editing} onChange={value => patchField("threePhase", value)} />
            <Tile icon="✣" label="AIR" value={clean(fields.airService) || "120 PSI"} editing={editing} onChange={value => patchField("airService", value)} />
            <Tile icon="◉" label="WATER" value={fields.water} type="yesno" editing={editing} onChange={value => patchField("water", value)} />
            <Tile icon="▣" label="FUEL" value={clean(fields.fuel) || "DIESEL / DEF"} editing={editing} onChange={value => patchField("fuel", value)} />
            <Tile icon="▣" label="WASH AREA" value={fields.washArea} type="yesno" editing={editing} onChange={value => patchField("washArea", value)} />
            <Tile icon="↯" label="JUMP START" value={fields.jumpStart} type="yesno" editing={editing} onChange={value => patchField("jumpStart", value)} />
            <Tile icon="⌘" label="JUMPER CABLES" value={fields.jumperCables} type="yesno" editing={editing} onChange={value => patchField("jumperCables", value)} />
          </div>
        </Section>

        <Section title="SITE INSTRUCTIONS">
          <div className="site-instructions">
            <span>◴</span>
            {editing ? (
              <textarea
                value={fields.siteInstructions ?? ""}
                onChange={event => patchField("siteInstructions", event.target.value)}
              />
            ) : (
              <strong>{clean(fields.siteInstructions) || "ENTER NORTH GATE FROM RAMA DR. CALL ON ARRIVAL. LOWBOYS STAGE LEFT OF SHOP."}</strong>
            )}
          </div>
        </Section>

        <Section title="RELATIONSHIPS & INFRASTRUCTURE">
          <div className="relationship-row">
            {["SHOP", "LOADING AREA", "GATE", "FORKLIFT"].map(label => (
              <button type="button" key={label}>{label}<span>›</span></button>
            ))}
          </div>
        </Section>
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

      <style jsx global>{`
        .ixi-aos-location-f2,
        .ixi-aos-location-f2 * {
          box-sizing: border-box;
          font-family: Arial, Helvetica, sans-serif;
        }

        .ixi-aos-location-f2 {
          --f2-bg: #0d0e0e;
          --f2-panel: #101212;
          --f2-panel-2: #0a0b0b;
          --f2-border: rgba(255,255,255,.12);
          --f2-border-soft: rgba(255,255,255,.065);
          --f2-text: #eceeec;
          --f2-muted: rgba(255,255,255,.58);
          --f2-accent: #ffc400;
          --f2-cyan: #00c2ff;
          --f2-good: #9ad600;
          position: relative;
          width: ${NATIVE_WIDTH}px;
          min-width: ${NATIVE_WIDTH}px;
          max-width: ${NATIVE_WIDTH}px;
          height: ${NATIVE_HEIGHT}px;
          min-height: ${NATIVE_HEIGHT}px;
          max-height: ${NATIVE_HEIGHT}px;
          overflow: hidden;
          border: 1px solid var(--f2-border);
          border-radius: 14px;
          background: var(--f2-bg);
          color: var(--f2-text);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.04), 0 18px 34px rgba(0,0,0,.42);
          font-size: 10px;
          line-height: 1.15;
        }

        .ixi-aos-location-f2 .ops-header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: ${HEADER_HEIGHT}px;
          padding: 7px 10px 4px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          border-bottom: 1px solid var(--f2-border-soft);
          background: linear-gradient(180deg, rgba(255,255,255,.025), transparent);
          z-index: 5;
        }

        .ixi-aos-location-f2 .ops-identity {
          min-width: 0;
          flex: 1;
        }

        .ixi-aos-location-f2 .ops-identity span {
          display: block;
          color: var(--f2-accent);
          font-size: 6.4px;
          font-weight: 950;
          letter-spacing: .06em;
        }

        .ixi-aos-location-f2 .ops-identity strong {
          display: block;
          margin-top: 4px;
          overflow: hidden;
          color: #f4f4f4;
          font-size: 15px;
          font-weight: 950;
          line-height: 1;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ixi-aos-location-f2 .ops-scroll-body {
          position: absolute;
          top: ${HEADER_HEIGHT}px;
          left: 0;
          right: 0;
          bottom: ${RAIL_HEIGHT}px;
          overflow-x: hidden;
          overflow-y: auto;
          padding: 6px 6px 10px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,.15) transparent;
        }

        .ixi-aos-location-f2 .ops-scroll-body::-webkit-scrollbar { width: 4px; }
        .ixi-aos-location-f2 .ops-scroll-body::-webkit-scrollbar-track { background: transparent; }
        .ixi-aos-location-f2 .ops-scroll-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,.14); border-radius: 999px; }

        .ixi-aos-location-f2 .gate-code-row {
          height: 35px;
          display: grid;
          grid-template-columns: 72px minmax(0,1fr);
          align-items: center;
          padding: 0 8px;
          margin-bottom: 6px;
          border: 1px solid rgba(255,196,0,.38);
          border-radius: 5px;
          background: linear-gradient(180deg, rgba(255,196,0,.055), rgba(255,196,0,.01));
        }

        .ixi-aos-location-f2 .gate-code-row > span {
          color: var(--f2-accent);
          font-size: 6.4px;
          font-weight: 950;
        }

        .ixi-aos-location-f2 .gate-code-row strong {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #f4f4f4;
          font-size: 17px;
          font-weight: 950;
          letter-spacing: .06em;
        }

        .ixi-aos-location-f2 .gate-code-row .lock { color: rgba(255,255,255,.84); font-size: 12px; }
        .ixi-aos-location-f2 .gate-code-row input { width: 100%; height: 24px; }

        .ixi-aos-location-f2 .ops-section {
          margin: 0 0 6px;
          overflow: hidden;
          border: 1px solid var(--f2-border-soft);
          border-radius: 5px;
          background: linear-gradient(180deg, rgba(255,255,255,.018), transparent), var(--f2-panel-2);
        }

        .ixi-aos-location-f2 .ops-section-title {
          height: 19px;
          display: flex;
          align-items: center;
          padding: 0 7px;
          border-bottom: 1px solid var(--f2-border-soft);
          color: var(--f2-accent);
          font-size: 6.2px;
          font-weight: 950;
          letter-spacing: .055em;
        }

        .ixi-aos-location-f2 .ops-section-body { padding: 3px; }

        .ixi-aos-location-f2 .ops-field-row {
          min-height: 22px;
          display: grid;
          grid-template-columns: 16px 83px minmax(0,1fr);
          align-items: center;
          border-bottom: 1px solid rgba(255,255,255,.045);
        }

        .ixi-aos-location-f2 .ops-field-row:last-child { border-bottom: 0; }
        .ixi-aos-location-f2 .ops-icon { color: rgba(255,255,255,.72); font-size: 8px; text-align: center; }
        .ixi-aos-location-f2 .ops-label { color: rgba(255,255,255,.72); font-size: 5.9px; font-weight: 850; white-space: nowrap; }
        .ixi-aos-location-f2 .ops-field-row strong { min-width: 0; overflow: hidden; color: rgba(255,255,255,.92); font-size: 6.2px; font-weight: 900; text-overflow: ellipsis; white-space: nowrap; }

        .ixi-aos-location-f2 .ops-inline-input,
        .ixi-aos-location-f2 .ops-tile-editor,
        .ixi-aos-location-f2 .ops-wide-fact input,
        .ixi-aos-location-f2 .gate-code-row input,
        .ixi-aos-location-f2 .ops-chip-row select,
        .ixi-aos-location-f2 .site-instructions textarea {
          min-width: 0;
          border: 1px solid rgba(255,196,0,.32);
          border-radius: 3px;
          background: #070808;
          color: #fff;
          outline: none;
          font-size: 6px;
          font-weight: 850;
        }

        .ixi-aos-location-f2 .ops-inline-input { width: 100%; height: 17px; padding: 0 4px; }

        .ixi-aos-location-f2 .ops-grid { display: grid; gap: 2px; }
        .ixi-aos-location-f2 .ops-grid.four { grid-template-columns: repeat(4, minmax(0,1fr)); }
        .ixi-aos-location-f2 .ops-grid.two { grid-template-columns: repeat(2, minmax(0,1fr)); }

        .ixi-aos-location-f2 .ops-tile {
          min-width: 0;
          min-height: 38px;
          display: grid;
          grid-template-columns: 14px minmax(0,1fr);
          grid-template-rows: auto auto;
          align-items: center;
          padding: 4px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 3px;
          background: rgba(255,255,255,.018);
        }

        .ixi-aos-location-f2 .ops-grid.compact .ops-tile { min-height: 36px; }
        .ixi-aos-location-f2 .ops-tile-icon { grid-row: 1 / span 2; color: rgba(255,255,255,.72); font-size: 7px; }
        .ixi-aos-location-f2 .ops-tile-label { min-width: 0; color: rgba(255,255,255,.68); font-size: 5px; font-weight: 850; line-height: 1.08; overflow-wrap: anywhere; }
        .ixi-aos-location-f2 .ops-tile strong { min-width: 0; color: #f2f2ef; font-size: 6px; font-weight: 950; line-height: 1.05; overflow-wrap: anywhere; }
        .ixi-aos-location-f2 .ops-tile.emphasis strong { color: var(--f2-good); }
        .ixi-aos-location-f2 .ops-tile-editor { width: 100%; height: 17px; padding: 0 2px; }

        .ixi-aos-location-f2 .ops-wide-fact {
          height: 23px;
          display: grid;
          grid-template-columns: 1fr 70px;
          align-items: center;
          margin-top: 2px;
          padding: 0 7px;
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 3px;
        }

        .ixi-aos-location-f2 .ops-wide-fact span { color: rgba(255,255,255,.68); font-size: 5.6px; font-weight: 850; }
        .ixi-aos-location-f2 .ops-wide-fact strong { text-align: right; font-size: 6.4px; }
        .ixi-aos-location-f2 .ops-wide-fact input { width: 100%; height: 17px; padding: 0 3px; }

        .ixi-aos-location-f2 .ops-chip-row {
          display: grid;
          grid-template-columns: repeat(4, minmax(0,1fr));
          gap: 2px;
          padding-top: 3px;
        }

        .ixi-aos-location-f2 .ops-chip-row label {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 3px;
          border: 1px solid rgba(255,255,255,.045);
          border-radius: 3px;
        }

        .ixi-aos-location-f2 .ops-chip-row span { min-width: 0; color: rgba(255,255,255,.58); font-size: 4.7px; font-weight: 850; line-height: 1.05; }
        .ixi-aos-location-f2 .ops-chip-row strong { color: var(--f2-good); font-size: 5.8px; font-weight: 950; }
        .ixi-aos-location-f2 .ops-chip-row select { width: 100%; height: 16px; }

        .ixi-aos-location-f2 .site-instructions {
          min-height: 40px;
          display: grid;
          grid-template-columns: 18px minmax(0,1fr);
          align-items: center;
          gap: 4px;
          padding: 4px;
        }

        .ixi-aos-location-f2 .site-instructions > span { color: var(--f2-accent); text-align: center; }
        .ixi-aos-location-f2 .site-instructions strong { color: rgba(255,255,255,.84); font-size: 5.8px; font-weight: 850; line-height: 1.28; }
        .ixi-aos-location-f2 .site-instructions textarea { width: 100%; min-height: 34px; padding: 4px; resize: vertical; }

        .ixi-aos-location-f2 .relationship-row {
          display: grid;
          grid-template-columns: repeat(4, minmax(0,1fr));
          gap: 3px;
        }

        .ixi-aos-location-f2 .relationship-row button {
          height: 25px;
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 5px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 3px;
          background: rgba(255,255,255,.018);
          color: rgba(255,255,255,.82);
          font-size: 5.4px;
          font-weight: 900;
          white-space: nowrap;
        }

        .ixi-aos-location-f2 .relationship-row button span { color: var(--f2-cyan); font-size: 10px; }
      `}</style>
    </div>
  );
}
