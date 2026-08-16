import { useMemo, useState } from "react";

import IXIMachineRail from "../../../IXIMachineRail";
import IXIAosCardHeaderControls from "../../card-runtime/modules/IXIAosCardHeaderControls";

const W = 298;
const H = 471;
const RAIL = 19;
const HEADER = 43;

export const LOCATION_FACE2_SKINS = Object.freeze([
  Object.freeze({ id: "v12", label: "V12" }),
  Object.freeze({ id: "steel", label: "STEEL" }),
  Object.freeze({ id: "blueprint", label: "BLUE" }),
  Object.freeze({ id: "industrial", label: "INDUSTRIAL" })
]);

function clean(value) {
  return String(value ?? "").trim();
}

function yn(value, fallback = "YES") {
  if (value === true) return "YES";
  if (value === false) return "NO";
  const normalized = clean(value).toUpperCase();
  return normalized === "YES" || normalized === "NO" ? normalized : fallback;
}

function OpsSection({ title, children }) {
  return (
    <section className="ops-section">
      <div className="ops-section-title">{title}</div>
      <div className="ops-section-body">{children}</div>
    </section>
  );
}

function OpsRow({
  icon = "•",
  label,
  value,
  editing = false,
  type = "text",
  onChange = null
}) {
  const display = type === "yesno" ? yn(value) : clean(value);

  return (
    <div className="ops-row">
      <span className="ops-icon">{icon}</span>
      <span className="ops-label">{label}</span>
      {editing && onChange ? (
        type === "yesno" ? (
          <select value={display || "YES"} onChange={event => onChange(event.target.value)}>
            <option>YES</option>
            <option>NO</option>
          </select>
        ) : (
          <input value={value ?? ""} onChange={event => onChange(event.target.value)} />
        )
      ) : (
        <strong>{display || "—"}</strong>
      )}
    </div>
  );
}

function OpsCell({
  icon = "•",
  label,
  value,
  editing = false,
  type = "text",
  onChange = null,
  emphasis = false
}) {
  const display = type === "yesno" ? yn(value) : clean(value);

  return (
    <div className={emphasis ? "ops-cell emphasis" : "ops-cell"}>
      <span className="ops-cell-icon">{icon}</span>
      <span className="ops-cell-label">{label}</span>
      {editing && onChange ? (
        type === "yesno" ? (
          <select value={display || "YES"} onChange={event => onChange(event.target.value)}>
            <option>YES</option>
            <option>NO</option>
          </select>
        ) : (
          <input value={value ?? ""} onChange={event => onChange(event.target.value)} />
        )
      ) : (
        <strong>{display || "—"}</strong>
      )}
    </div>
  );
}

function OpsRelationship({ label }) {
  return (
    <button type="button" className="ops-relationship">
      <span>{label}</span>
      <b>›</b>
    </button>
  );
}

export default function IXIAosLocationFace2Operations({
  object = {},
  ixiState = {},
  onIxiStateChange = null,
  onSaveObject = null,
  onAddObject = null,
  onHideObject = null,
  onDeleteObject = null,
  onOpenConsole = null,
  onOpenTransact = null,
  skinId = "v12",
  onSkinChange = null,
  onSendFront = null,
  onSendBack = null,
  onCycleColor = null,
  onCycleOutline = null,
  armedDestination = "",
  onSendToArmedDestination = null
}) {
  const objectId = clean(object?.objectId || object?.id);
  const savedFields =
    ixiState?.face2SavedFields && typeof ixiState.face2SavedFields === "object"
      ? ixiState.face2SavedFields
      : object?.fields || {};

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(() => ({ ...savedFields }));

  const fields = editing ? draft : savedFields;
  const displayName = clean(object?.displayName) || "YARD NAME";

  const address = useMemo(() => {
    const cityStateZip = [
      [clean(fields.city), clean(fields.state)].filter(Boolean).join(", "),
      clean(fields.postalCode)
    ]
      .filter(Boolean)
      .join(" ");

    return [clean(fields.address1), cityStateZip].filter(Boolean).join(" · ");
  }, [fields.address1, fields.city, fields.state, fields.postalCode]);

  function patch(key, value) {
    setDraft(current => ({ ...current, [key]: value }));
  }

  function beginEdit() {
    setDraft({ ...savedFields });
    setEditing(true);
  }

  function cancelEdit() {
    setDraft({ ...savedFields });
    setEditing(false);
  }

  async function saveEdit() {
    if (saving) return;
    setSaving(true);

    try {
      if (objectId) {
        onIxiStateChange?.(objectId, {
          face2SavedFields: { ...draft },
          editingFace2: false
        });
      }

      await onSaveObject?.({
        objectId,
        object: {
          ...object,
          fields: {
            ...(object?.fields || {}),
            ...draft
          }
        },
        fields: {
          ...(object?.fields || {}),
          ...draft
        },
        face: 2
      });

      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`ixi-aos-location-f2 skin-${skinId}`}>
      <header className="ops-header">
        <div className="ops-identity">
          <span>LOCATIONS FACE 2 · OPERATIONS</span>
          <strong>{displayName}</strong>
        </div>

        {editing ? (
          <div className="ops-edit-actions">
            <button disabled={saving} onClick={saveEdit}>SAVE</button>
            <button disabled={saving} onClick={cancelEdit}>CANCEL</button>
          </div>
        ) : (
          <IXIAosCardHeaderControls
            canAdd
            canEdit
            canTransact={typeof onOpenTransact === "function"}
            editing={false}
            onAdd={() => onAddObject?.(object)}
            onToggleEdit={beginEdit}
            onTransact={onOpenTransact}
            onHide={onHideObject}
            onDelete={onDeleteObject}
            onOpenConsole={onOpenConsole}
            skinId={skinId}
            skinOptions={LOCATION_FACE2_SKINS}
            onSkinChange={onSkinChange}
          />
        )}
      </header>

      <div className="ops-scroll">
        <div className="gate-code">
          <span>GATE CODE</span>
          {editing ? (
            <input value={fields.gateCode ?? "4821"} onChange={event => patch("gateCode", event.target.value)} />
          ) : (
            <strong>▣ {clean(fields.gateCode) || "4821"}</strong>
          )}
        </div>

        <OpsSection title="ARRIVAL">
          <OpsRow icon="⌖" label="ADDRESS" value={address} />
          <OpsRow icon="⌖" label="GPS COORDINATES" value={clean(fields.gpsCoordinates) || "32.899110, -97.040339"} editing={editing} onChange={value => patch("gpsCoordinates", value)} />
          <OpsRow icon="●" label="YARD CONTACT" value={clean(fields.yardContact) || "JOHN CARTER · 432-555-0186"} editing={editing} onChange={value => patch("yardContact", value)} />
          <OpsRow icon="◴" label="HOURS" value={clean(fields.yardHours) || "MON–SAT 6:00 AM–6:00 PM"} editing={editing} onChange={value => patch("yardHours", value)} />
          <OpsRow icon="☑" label="APPOINTMENT REQUIRED" value={fields.appointmentRequired} type="yesno" editing={editing} onChange={value => patch("appointmentRequired", value)} />
          <OpsRow icon="☑" label="CHECK-IN REQUIRED" value={fields.checkInRequired} type="yesno" editing={editing} onChange={value => patch("checkInRequired", value)} />
        </OpsSection>

        <OpsSection title="TRUCK ACCESS">
          <div className="ops-grid two">
            <OpsCell icon="▰" label="SEMI" value={fields.semiAccess} type="yesno" editing={editing} onChange={value => patch("semiAccess", value)} />
            <OpsCell icon="▱" label="53' TRAILER" value={fields.trailer53Access} type="yesno" editing={editing} onChange={value => patch("trailer53Access", value)} />
            <OpsCell icon="▰" label="LOWBOY" value={fields.lowboyAccess} type="yesno" editing={editing} onChange={value => patch("lowboyAccess", value)} />
            <OpsCell icon="▰" label="OVERSIZE" value={fields.oversizeAccess} type="yesno" editing={editing} onChange={value => patch("oversizeAccess", value)} />
            <OpsCell icon="↪" label="DRIVE-THRU" value={yn(fields.driveThrough, "NO")} type="yesno" editing={editing} onChange={value => patch("driveThrough", value)} />
            <OpsCell icon="⟳" label="TURNAROUND" value={fields.turnaround} type="yesno" editing={editing} onChange={value => patch("turnaround", value)} />
            <OpsCell icon="↔" label="GATE WIDTH" value={clean(fields.gateWidth) || "32 FT"} editing={editing} onChange={value => patch("gateWidth", value)} emphasis />
            <OpsCell icon="⌂" label="CLEARANCE" value={clean(fields.overheadClearance) || "OPEN"} editing={editing} onChange={value => patch("overheadClearance", value)} emphasis />
          </div>
          <div className="ops-wide">
            <span>⚠ WEIGHT RESTRICTION</span>
            {editing ? (
              <input value={fields.weightRestriction ?? "NO"} onChange={event => patch("weightRestriction", event.target.value)} />
            ) : (
              <strong>{clean(fields.weightRestriction) || "NO"}</strong>
            )}
          </div>
        </OpsSection>

        <OpsSection title="LOADING & HANDLING">
          <div className="ops-grid two">
            <OpsCell icon="♜" label="UNLOADING" value={fields.loadingUnloading} type="yesno" editing={editing} onChange={value => patch("loadingUnloading", value)} />
            <OpsCell icon="♜" label="ASSISTANCE" value={fields.loadingAssistance} type="yesno" editing={editing} onChange={value => patch("loadingAssistance", value)} />
            <OpsCell icon="▤" label="DOCKS" value={clean(fields.docks) || "0"} editing={editing} onChange={value => patch("docks", value)} />
            <OpsCell icon="▤" label="RAMPS" value={clean(fields.ramps) || "2"} editing={editing} onChange={value => patch("ramps", value)} />
            <OpsCell icon="♙" label="FORKLIFT" value={clean(fields.forkliftCapacity) || "15,000 LB"} editing={editing} onChange={value => patch("forkliftCapacity", value)} />
            <OpsCell icon="♨" label="HEAVY LIFT" value={fields.heavyLift} type="yesno" editing={editing} onChange={value => patch("heavyLift", value)} />
            <OpsCell icon="◒" label="WET LOAD" value={fields.wetLoad} type="yesno" editing={editing} onChange={value => patch("wetLoad", value)} />
            <OpsCell icon="♧" label="GRADE LEVEL" value={fields.gradeLevelLoading} type="yesno" editing={editing} onChange={value => patch("gradeLevelLoading", value)} />
          </div>
        </OpsSection>

        <OpsSection title="YARD / SITE CONDITIONS">
          <div className="ops-grid four">
            <OpsCell label="SURFACE" value={clean(fields.surfaceType) || "GRAVEL / PAVED"} editing={editing} onChange={value => patch("surfaceType", value)} />
            <OpsCell label="DRAINAGE" value={clean(fields.drainage) || "GOOD"} editing={editing} onChange={value => patch("drainage", value)} />
            <OpsCell label="LIGHTED" value={fields.lighted} type="yesno" editing={editing} onChange={value => patch("lighted", value)} />
            <OpsCell label="FENCED / GATED" value={fields.fencedGated} type="yesno" editing={editing} onChange={value => patch("fencedGated", value)} />
          </div>
        </OpsSection>

        <OpsSection title="SERVICES & UTILITIES">
          <div className="ops-grid four">
            <OpsCell label="ELECTRIC" value={clean(fields.electricService) || "120/240/480"} editing={editing} onChange={value => patch("electricService", value)} />
            <OpsCell label="THREE PHASE" value={fields.threePhase} type="yesno" editing={editing} onChange={value => patch("threePhase", value)} />
            <OpsCell label="AIR" value={clean(fields.airService) || "120 PSI"} editing={editing} onChange={value => patch("airService", value)} />
            <OpsCell label="WATER" value={fields.water} type="yesno" editing={editing} onChange={value => patch("water", value)} />
            <OpsCell label="FUEL" value={clean(fields.fuel) || "DIESEL / DEF"} editing={editing} onChange={value => patch("fuel", value)} />
            <OpsCell label="WASH AREA" value={fields.washArea} type="yesno" editing={editing} onChange={value => patch("washArea", value)} />
            <OpsCell label="JUMP START" value={fields.jumpStart} type="yesno" editing={editing} onChange={value => patch("jumpStart", value)} />
            <OpsCell label="JUMPER CABLES" value={fields.jumperCables} type="yesno" editing={editing} onChange={value => patch("jumperCables", value)} />
          </div>
        </OpsSection>

        <OpsSection title="SITE INSTRUCTIONS">
          <div className="site-instructions">
            {editing ? (
              <textarea value={fields.siteInstructions ?? ""} onChange={event => patch("siteInstructions", event.target.value)} />
            ) : (
              <strong>{clean(fields.siteInstructions) || "ENTER NORTH GATE FROM RAMA DR. CALL ON ARRIVAL. LOWBOYS STAGE LEFT OF SHOP."}</strong>
            )}
          </div>
        </OpsSection>

        <OpsSection title="RELATIONSHIPS & INFRASTRUCTURE">
          <div className="relationship-grid">
            {["SHOP", "LOADING AREA", "GATE", "FORKLIFT"].map(label => (
              <OpsRelationship key={label} label={label} />
            ))}
          </div>
        </OpsSection>
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
        .ixi-aos-location-f2,.ixi-aos-location-f2 *{box-sizing:border-box;font-family:Arial,Helvetica,sans-serif}
        .ixi-aos-location-f2{--bg:#0d0e0e;--panel:#101212;--panel2:#0a0b0b;--border:rgba(255,255,255,.11);--soft:rgba(255,255,255,.06);--text:#eceeec;--muted:rgba(255,255,255,.58);--accent:#ffc400;--good:#9ad600;--link:#00c2ff;position:relative;width:${W}px;height:${H}px;overflow:hidden;border:1px solid var(--border);border-radius:14px;background:var(--bg);color:var(--text);box-shadow:0 18px 34px rgba(0,0,0,.42);font-size:10px;line-height:1.15}
        .ixi-aos-location-f2.skin-steel{--bg:#101214;--panel:#191c1e;--panel2:#111315;--border:rgba(210,220,224,.22);--soft:rgba(210,220,224,.10);--accent:#d9dde0;--good:#ffc400;--link:#ffc400;background:linear-gradient(135deg,#17191b,#0d0f10)}
        .ixi-aos-location-f2.skin-blueprint{--bg:#071119;--panel:#0b1a24;--panel2:#07141d;--border:rgba(61,184,255,.25);--soft:rgba(61,184,255,.12);--accent:#54c7ff;--good:#ffc400;--link:#54c7ff;background:linear-gradient(180deg,#0a1720,#050b10)}
        .ixi-aos-location-f2.skin-industrial{--bg:#15110a;--panel:#211a0e;--panel2:#171107;--border:rgba(255,190,65,.24);--soft:rgba(255,190,65,.10);--accent:#ffc400;--good:#f0eee5;--link:#ffc400;background:linear-gradient(135deg,#1e170c,#0e0b07)}
        .ops-header{position:absolute;inset:0 0 auto;height:${HEADER}px;padding:7px 8px 4px 10px;display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid var(--soft);background:linear-gradient(180deg,rgba(255,255,255,.025),transparent);z-index:50}
        .ops-identity{min-width:0;max-width:145px;flex:1}.ops-identity span{display:block;color:var(--accent);font-size:6.3px;font-weight:950;letter-spacing:.06em}.ops-identity strong{display:block;margin-top:4px;overflow:hidden;color:#f4f4f4;font-size:15px;font-weight:950;line-height:1;text-overflow:ellipsis;white-space:nowrap}
        .ops-edit-actions{display:flex;gap:4px}.ops-edit-actions button{height:25px;padding:0 7px;border:1px solid var(--border);border-radius:4px;background:#080909;color:var(--accent);font-size:6px;font-weight:950}
        .ops-scroll{position:absolute;top:${HEADER}px;left:0;right:0;bottom:${RAIL}px;overflow-y:auto;overflow-x:hidden;padding:6px 6px 10px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.15) transparent}.ops-scroll::-webkit-scrollbar{width:4px}.ops-scroll::-webkit-scrollbar-track{background:transparent}.ops-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,.14);border-radius:99px}
        .gate-code{height:35px;display:grid;grid-template-columns:72px 1fr;align-items:center;padding:0 8px;margin-bottom:6px;border:1px solid color-mix(in srgb,var(--accent) 38%,transparent);border-radius:5px;background:color-mix(in srgb,var(--accent) 4%,transparent)}.gate-code span{color:var(--accent);font-size:6.4px;font-weight:950}.gate-code strong{font-size:17px;letter-spacing:.06em}.gate-code input{width:100%;height:23px}
        .ops-section{margin:0 0 6px;overflow:hidden;border:1px solid var(--soft);border-radius:5px;background:var(--panel2)}.ops-section-title{height:19px;display:flex;align-items:center;padding:0 7px;border-bottom:1px solid var(--soft);color:var(--accent);font-size:6.2px;font-weight:950;letter-spacing:.055em}.ops-section-body{padding:3px}
        .ops-row{min-height:22px;display:grid;grid-template-columns:16px 84px minmax(0,1fr);align-items:center;border-bottom:1px solid var(--soft)}.ops-row:last-child{border-bottom:0}.ops-icon{font-size:8px;text-align:center}.ops-label{color:var(--muted);font-size:5.8px;font-weight:900;white-space:nowrap}.ops-row strong{min-width:0;overflow:hidden;font-size:6.2px;font-weight:900;text-overflow:ellipsis;white-space:nowrap}.ops-row input,.ops-row select{width:100%;height:17px}
        .ops-grid{display:grid;gap:2px}.ops-grid.two{grid-template-columns:repeat(2,minmax(0,1fr))}.ops-grid.four{grid-template-columns:repeat(4,minmax(0,1fr))}
        .ops-cell{min-width:0;min-height:38px;display:grid;grid-template-columns:14px minmax(0,1fr);grid-template-rows:auto auto;align-items:center;padding:4px;border:1px solid var(--soft);border-radius:3px;background:color-mix(in srgb,var(--panel) 90%,white 2%);overflow:hidden}.ops-cell-icon{grid-row:1/span 2;font-size:7px}.ops-cell-label{min-width:0;color:var(--muted);font-size:5px;font-weight:900;line-height:1.08;overflow-wrap:anywhere}.ops-cell strong{min-width:0;color:#f2f2ef;font-size:6.2px;font-weight:950;line-height:1.05;overflow-wrap:anywhere}.ops-cell.emphasis strong{color:var(--good)}.ops-cell input,.ops-cell select{width:100%;height:17px;min-width:0}
        .ops-wide{height:23px;display:grid;grid-template-columns:1fr 70px;align-items:center;margin-top:2px;padding:0 7px;border:1px solid var(--soft);border-radius:3px}.ops-wide span{color:var(--muted);font-size:5.6px;font-weight:850}.ops-wide strong{text-align:right;font-size:6.4px}.ops-wide input{width:100%;height:17px}
        .site-instructions{min-height:40px;padding:6px}.site-instructions strong{font-size:5.8px;line-height:1.28}.site-instructions textarea{width:100%;min-height:34px;resize:vertical}
        .relationship-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:3px}.ops-relationship{height:25px;min-width:0;display:flex;align-items:center;justify-content:space-between;padding:0 5px;border:1px solid var(--border);border-radius:3px;background:var(--panel);color:#eee;font-size:5.4px;font-weight:900}.ops-relationship b{color:var(--link);font-size:10px}
        .ixi-aos-location-f2 input,.ixi-aos-location-f2 select,.ixi-aos-location-f2 textarea{border:1px solid color-mix(in srgb,var(--accent) 35%,transparent);border-radius:3px;background:#070808;color:#fff;outline:none;font-size:6px;font-weight:850;padding:0 3px}
      `}</style>
    </div>
  );
}
