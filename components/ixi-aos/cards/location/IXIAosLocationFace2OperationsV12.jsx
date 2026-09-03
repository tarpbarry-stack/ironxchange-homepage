import { useMemo, useState } from "react";

import IXIObjectRail from "../../../ixi-object-system/IXIObjectRail";
import IXIAosCardHeaderControls from "../../card-runtime/modules/IXIAosCardHeaderControls";

const W = 298;
const H = 471;
const HEADER = 43;
const COMMANDS = 24;
const RAIL = 19;

export const LOCATION_FACE2_V12_LOCK = Object.freeze({
  face: 2,
  slug: "location-operations",
  version: 12,
  lockedId: "location-f2-v12",
  nativeWidth: W,
  nativeHeight: H,
  railHeight: RAIL,
  behavior: "single-vertical-scroll",
  designSystem: "v12-location-family"
});

export const LOCATION_FACE2_SKINS = Object.freeze([
  Object.freeze({ id: "v12", label: "V12" }),
  Object.freeze({ id: "steel", label: "STEEL" }),
  Object.freeze({ id: "blueprint", label: "BLUE" }),
  Object.freeze({ id: "industrial", label: "INDUSTRIAL" })
]);

const YES_NO = Object.freeze([
  Object.freeze({ value: "YES", label: "YES" }),
  Object.freeze({ value: "NO", label: "NO" })
]);

const FIELD_GROUPS = Object.freeze([
  Object.freeze({
    id: "arrival",
    label: "ARRIVAL",
    rows: Object.freeze([
      { id: "address1", label: "ADDRESS", icon: "⌖", fallback: "2400 AVIATION DRIVE" },
      { id: "cityStateZip", label: "CITY / STATE / ZIP", icon: "⌖", fallback: "DFW AIRPORT, TX 75261", synthetic: true },
      { id: "gpsCoordinates", label: "GPS COORDINATES", icon: "⌖", fallback: "32.899110, -97.040339" },
      { id: "yardContact", label: "YARD CONTACT", icon: "●", fallback: "JOHN CARTER" },
      { id: "yardContactPhone", label: "CONTACT PHONE", icon: "☎", fallback: "432-555-0186" },
      { id: "yardHours", label: "HOURS OF OPERATION", icon: "◴", fallback: "MONDAY – SATURDAY · 6:00 AM – 6:00 PM" },
      { id: "appointmentRequired", label: "APPOINTMENT REQUIRED", icon: "☑", type: "yesno", fallback: "NO" },
      { id: "checkInRequired", label: "CHECK-IN REQUIRED", icon: "☑", type: "yesno", fallback: "YES" }
    ])
  }),
  Object.freeze({
    id: "truck-access",
    label: "TRUCK ACCESS",
    rows: Object.freeze([
      { id: "semiAccess", label: "SEMI ACCESS", icon: "▰", type: "yesno", fallback: "YES" },
      { id: "trailer53Access", label: "53' TRAILER ACCESS", icon: "▱", type: "yesno", fallback: "YES" },
      { id: "lowboyAccess", label: "LOWBOY ACCESS", icon: "▰", type: "yesno", fallback: "YES" },
      { id: "oversizeAccess", label: "OVERSIZE LOAD ACCESS", icon: "▰", type: "yesno", fallback: "YES" },
      { id: "driveThrough", label: "DRIVE-THRU", icon: "↪", type: "yesno", fallback: "NO" },
      { id: "turnaroundAvailable", label: "TURNAROUND AVAILABLE", icon: "⟳", type: "yesno", fallback: "YES" },
      { id: "gateWidth", label: "GATE WIDTH", icon: "↔", fallback: "32 FT" },
      { id: "overheadClearance", label: "OVERHEAD CLEARANCE", icon: "⌂", fallback: "OPEN" },
      { id: "weightRestriction", label: "WEIGHT RESTRICTION", icon: "⚠", fallback: "NO" }
    ])
  }),
  Object.freeze({
    id: "loading",
    label: "LOADING & HANDLING",
    rows: Object.freeze([
      { id: "loadingUnloading", label: "LOADING / UNLOADING", icon: "♜", type: "yesno", fallback: "YES" },
      { id: "loadingAssistance", label: "LOADING ASSISTANCE", icon: "♜", type: "yesno", fallback: "YES" },
      { id: "docksAvailable", label: "DOCKS", icon: "▤", type: "yesno", fallback: "NO" },
      { id: "dockCount", label: "DOCK COUNT", icon: "#", type: "number", fallback: "0" },
      { id: "rampsAvailable", label: "RAMPS", icon: "▤", type: "yesno", fallback: "YES" },
      { id: "rampCount", label: "RAMP COUNT", icon: "#", type: "number", fallback: "2" },
      { id: "gradeLevelLoading", label: "GRADE-LEVEL LOADING", icon: "♧", type: "yesno", fallback: "YES" },
      { id: "forkliftAvailable", label: "FORKLIFT", icon: "♙", type: "yesno", fallback: "YES" },
      { id: "forkliftCapacity", label: "FORKLIFT CAPACITY", icon: "↥", fallback: "15,000 LB" },
      { id: "heavyLift", label: "HEAVY LIFT", icon: "♨", type: "yesno", fallback: "YES" },
      { id: "craneAvailable", label: "CRANE", icon: "⌁", type: "yesno", fallback: "NO" },
      { id: "telehandlerAvailable", label: "TELEHANDLER", icon: "▰", type: "yesno", fallback: "NO" },
      { id: "wetLoad", label: "WET LOAD", icon: "◒", type: "yesno", fallback: "YES" }
    ])
  }),
  Object.freeze({
    id: "site",
    label: "YARD / SITE CONDITIONS",
    rows: Object.freeze([
      { id: "surfaceType", label: "SURFACE TYPE", icon: "⌘", fallback: "GRAVEL / PAVED" },
      { id: "yardCondition", label: "YARD CONDITION", icon: "⌁", fallback: "LEVEL" },
      { id: "drainage", label: "DRAINAGE", icon: "≋", fallback: "GOOD" },
      { id: "allWeatherAccess", label: "ALL-WEATHER ACCESS", icon: "☂", type: "yesno", fallback: "YES" },
      { id: "exteriorLighting", label: "EXTERIOR LIGHTING", icon: "☼", type: "yesno", fallback: "YES" },
      { id: "fenced", label: "FENCED", icon: "╫", type: "yesno", fallback: "YES" },
      { id: "gated", label: "GATED", icon: "▣", type: "yesno", fallback: "YES" },
      { id: "securityCameras", label: "SECURITY CAMERAS", icon: "◉", type: "yesno", fallback: "YES" },
      { id: "coveredLoading", label: "COVERED LOADING", icon: "⌂", type: "yesno", fallback: "NO" },
      { id: "stagingArea", label: "STAGING AREA", icon: "▤", type: "yesno", fallback: "YES" },
      { id: "trailerParking", label: "TRAILER PARKING", icon: "▱", type: "yesno", fallback: "YES" },
      { id: "overnightParking", label: "OVERNIGHT PARKING", icon: "◐", type: "yesno", fallback: "NO" }
    ])
  }),
  Object.freeze({
    id: "utilities",
    label: "SERVICES & UTILITIES",
    rows: Object.freeze([
      { id: "electricAvailable", label: "ELECTRIC", icon: "ϟ", type: "yesno", fallback: "YES" },
      { id: "electricService", label: "ELECTRIC SERVICE", icon: "ϟ", fallback: "120V / 240V / 480V" },
      { id: "threePhase", label: "THREE PHASE", icon: "ϟ", type: "yesno", fallback: "YES" },
      { id: "airAvailable", label: "AIR", icon: "↯", type: "yesno", fallback: "YES" },
      { id: "airPressure", label: "AIR PRESSURE", icon: "↯", fallback: "120 PSI" },
      { id: "water", label: "WATER", icon: "◒", type: "yesno", fallback: "YES" },
      { id: "fuelType", label: "FUEL", icon: "▣", fallback: "DIESEL" },
      { id: "defAvailable", label: "DEF", icon: "◒", type: "yesno", fallback: "YES" },
      { id: "washArea", label: "WASH AREA", icon: "♨", type: "yesno", fallback: "YES" },
      { id: "batteryCharger", label: "BATTERY CHARGER", icon: "▣", type: "yesno", fallback: "YES" },
      { id: "jumpStart", label: "JUMP START", icon: "ϟ", type: "yesno", fallback: "YES" },
      { id: "jumperCables", label: "JUMPER CABLES", icon: "⌁", type: "yesno", fallback: "YES" },
      { id: "weldingAvailable", label: "WELDING", icon: "⌁", type: "yesno", fallback: "YES" },
      { id: "torchCutting", label: "TORCH / CUTTING", icon: "⌁", type: "yesno", fallback: "YES" },
      { id: "tireAir", label: "TIRE AIR", icon: "◉", type: "yesno", fallback: "YES" },
      { id: "wasteOilDisposal", label: "WASTE OIL DISPOSAL", icon: "◒", type: "yesno", fallback: "YES" }
    ])
  })
]);

function clean(value) {
  return String(value ?? "").trim();
}

function normalizeYesNo(value, fallback = "YES") {
  if (value === true) return "YES";
  if (value === false) return "NO";
  const normalized = clean(value).toUpperCase();
  return normalized === "YES" || normalized === "NO" ? normalized : fallback;
}

function getCityStateZip(fields = {}) {
  const cityState = [clean(fields.city), clean(fields.state)].filter(Boolean).join(", ");
  return [cityState, clean(fields.postalCode)].filter(Boolean).join(" ");
}

function getFieldDisplayValue(fields = {}, row = {}) {
  if (row.synthetic && row.id === "cityStateZip") {
    return getCityStateZip(fields) || row.fallback || "—";
  }
  if (row.type === "yesno") {
    return normalizeYesNo(fields?.[row.id], row.fallback || "YES");
  }
  return clean(fields?.[row.id]) || row.fallback || "—";
}

function Section({ title, children }) {
  return (
    <section className="ops-section">
      <h3>{title}</h3>
      <div className="ops-section-body">{children}</div>
    </section>
  );
}

function EditableRow({ row, fields, editAll, activeField, saving, onBeginField, onPatch, onCommitField }) {
  const isEditing = editAll || activeField === row.id;
  const display = getFieldDisplayValue(fields, row);

  if (row.synthetic && row.id === "cityStateZip") {
    return (
      <div className="ops-row">
        <span className="ops-icon">{row.icon}</span>
        <span className="ops-label">{row.label}</span>
        {isEditing ? (
          <div className="ops-inline-triple">
            <input value={fields.city ?? ""} placeholder="CITY" onChange={event => onPatch("city", event.target.value)} />
            <input value={fields.state ?? ""} placeholder="ST" onChange={event => onPatch("state", event.target.value)} />
            <input value={fields.postalCode ?? ""} placeholder="ZIP" onChange={event => onPatch("postalCode", event.target.value)} />
          </div>
        ) : <strong>{display}</strong>}
        {!editAll ? (
          <button type="button" className="ops-row-edit" disabled={saving} onClick={() => activeField === row.id ? onCommitField() : onBeginField(row.id)}>
            {activeField === row.id ? "SAVE" : "EDIT"}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="ops-row">
      <span className="ops-icon">{row.icon || "•"}</span>
      <span className="ops-label">{row.label}</span>
      {isEditing ? (
        row.type === "yesno" ? (
          <select value={normalizeYesNo(fields?.[row.id], row.fallback || "YES")} onChange={event => onPatch(row.id, event.target.value)}>
            {YES_NO.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        ) : (
          <input type={row.type === "number" ? "number" : "text"} value={fields?.[row.id] ?? ""} placeholder={row.fallback || ""} onChange={event => onPatch(row.id, event.target.value)} />
        )
      ) : <strong>{display}</strong>}
      {!editAll ? (
        <button type="button" className="ops-row-edit" disabled={saving} onClick={() => activeField === row.id ? onCommitField() : onBeginField(row.id)}>
          {activeField === row.id ? "SAVE" : "EDIT"}
        </button>
      ) : null}
    </div>
  );
}

function RelationshipRow({ relationship = {}, index = 0 }) {
  const label = clean(relationship?.displayLabel || relationship?.label || relationship?.relationshipLabel || relationship?.name) || `RELATIONSHIP ${index + 1}`;
  const value = clean(relationship?.displayName || relationship?.value || relationship?.targetDisplayName || relationship?.targetLabel) || "—";
  return (
    <button type="button" className="ops-relationship">
      <span className="rel-icon">▣</span>
      <span className="rel-label">{label}</span>
      <strong>{value}</strong>
      <b>›</b>
    </button>
  );
}

export default function IXIAosLocationFace2OperationsV12({
  object = {},
  ixiState = {},
  onIxiStateChange = null,
  onSaveObject = null,
  onAddObject = null,
  onHideObject = null,
  onDeleteObject = null,
  onOpenConsole = null,
  onOpenTransact = null,
  onRecall = null,
  onBoard = null,
  onReturn = null,
  skinId = "v12",
  onSkinChange = null,
  onSendFront = null,
  onSendBack = null,
  onCycleColor = null,
  onCycleOutline = null,
  armedDestination = "",
  onSendToArmedDestination = null,
  skinOptions = []
}) {
  const objectId = clean(object?.objectId || object?.id);
  const persistedFields = useMemo(() => ({
    ...(object?.fields || {}),
    ...(ixiState?.face2SavedFields && typeof ixiState.face2SavedFields === "object" ? ixiState.face2SavedFields : {})
  }), [object?.fields, ixiState?.face2SavedFields]);

  const [draft, setDraft] = useState(() => ({ ...persistedFields }));
  const [editAll, setEditAll] = useState(false);
  const [activeField, setActiveField] = useState("");
  const [saving, setSaving] = useState(false);
  const displayName = clean(object?.displayName || object?.name) || "YARD NAME";
  const relationships = Array.isArray(object?.relationships) ? object.relationships : [];
  const visibleFields = editAll || activeField ? draft : persistedFields;

  function beginField(fieldId) {
    setDraft(current => ({ ...persistedFields, ...current }));
    setActiveField(fieldId);
  }

  function patch(fieldId, value) {
    setDraft(current => ({ ...current, [fieldId]: value }));
  }

  async function persist(nextFields) {
    if (saving) return;
    setSaving(true);
    try {
      if (objectId) {
        onIxiStateChange?.(objectId, { face2SavedFields: { ...nextFields }, editingFace2: false });
      }
      await onSaveObject?.({
        objectId,
        object: { ...object, fields: { ...(object?.fields || {}), ...nextFields } },
        fields: { ...(object?.fields || {}), ...nextFields },
        face: 2
      });
    } finally {
      setSaving(false);
    }
  }

  async function commitField() {
    await persist(draft);
    setActiveField("");
  }

  function beginEditAll() {
    setDraft({ ...persistedFields });
    setActiveField("");
    setEditAll(true);
  }

  async function saveEditAll() {
    await persist(draft);
    setEditAll(false);
    setActiveField("");
  }

  function cancelEditAll() {
    setDraft({ ...persistedFields });
    setEditAll(false);
    setActiveField("");
  }

  function command(event, callback) {
    event.preventDefault();
    event.stopPropagation();
    callback?.(object);
  }

  return (
    <article className={`ixi-aos-location-f2 skin-${skinId}`}>
      <header className="ops-header">
        <div className="ops-identity">
          <span>LOCATIONS & FACILITIES</span>
          <strong>{displayName}</strong>
        </div>

        {editAll ? (
          <div className="ops-edit-actions">
            <button type="button" disabled={saving} onClick={saveEditAll}>SAVE</button>
            <button type="button" disabled={saving} onClick={cancelEditAll}>CANCEL</button>
          </div>
        ) : (
          <IXIAosCardHeaderControls
            canAdd={typeof onAddObject === "function"}
            canEdit
            canTransact={typeof onOpenTransact === "function"}
            editing={false}
            onAdd={() => onAddObject?.(object)}
            onToggleEdit={beginEditAll}
            onTransact={() => onOpenTransact?.(object)}
            onHide={onHideObject}
            onDelete={onDeleteObject}
            onOpenConsole={onOpenConsole}
            skinId={skinId}
            skinOptions={skinOptions}
            onSkinChange={onSkinChange}
          />
        )}
      </header>

      <main className="ops-scroll">
        <section className="gate-code">
          <div className="gate-mark">▣</div>
          <div className="gate-copy"><span>GATE CODE</span>{editAll || activeField === "gateCode" ? <input value={visibleFields.gateCode ?? ""} placeholder="4821" onChange={event => patch("gateCode", event.target.value)} /> : <strong>{clean(visibleFields.gateCode) || "4821"}</strong>}</div>
          {!editAll ? <button type="button" className="ops-row-edit gate-edit" disabled={saving} onClick={() => activeField === "gateCode" ? commitField() : beginField("gateCode")}>{activeField === "gateCode" ? "SAVE" : "EDIT"}</button> : null}
        </section>

        {FIELD_GROUPS.map(group => (
          <Section key={group.id} title={group.label}>
            {group.rows.map(row => (
              <EditableRow key={row.id} row={row} fields={visibleFields} editAll={editAll} activeField={activeField} saving={saving} onBeginField={beginField} onPatch={patch} onCommitField={commitField} />
            ))}
          </Section>
        ))}

        <Section title="SITE INSTRUCTIONS">
          <div className="site-instructions">
            <span className="instruction-icon">✎</span>
            {editAll || activeField === "siteInstructions" ? <textarea value={visibleFields.siteInstructions ?? ""} placeholder="ENTER SITE ACCESS / ARRIVAL / STAGING INSTRUCTIONS" onChange={event => patch("siteInstructions", event.target.value)} /> : <strong>{clean(visibleFields.siteInstructions) || "ENTER NORTH GATE FROM RAMA DR. CALL ON ARRIVAL. LOWBOYS STAGE LEFT OF SHOP."}</strong>}
            {!editAll ? <button type="button" className="ops-row-edit instruction-edit" disabled={saving} onClick={() => activeField === "siteInstructions" ? commitField() : beginField("siteInstructions")}>{activeField === "siteInstructions" ? "SAVE" : "EDIT"}</button> : null}
          </div>
        </Section>

        <Section title="RELATIONSHIPS & INFRASTRUCTURE">
          <div className="relationship-list">
            {relationships.length ? relationships.map((relationship, index) => <RelationshipRow key={clean(relationship?.id || relationship?.relationshipId) || index} relationship={relationship} index={index} />) : (
              <>
                <RelationshipRow relationship={{ label: "SHOP", value: "YARD SHOP" }} />
                <RelationshipRow relationship={{ label: "LOADING AREA", value: "MAIN LOADING" }} />
                <RelationshipRow relationship={{ label: "GATE", value: "NORTH GATE" }} />
                <RelationshipRow relationship={{ label: "FORKLIFT", value: "CAT DP70N" }} />
                <RelationshipRow relationship={{ label: "FUEL TANK", value: "DIESEL TANK 01" }} />
              </>
            )}
          </div>
        </Section>

        <Section title="VERIFICATION">
          <EditableRow row={{ id: "lastVerifiedDate", label: "LAST VERIFIED", icon: "✓", fallback: "AUG 12, 2026" }} fields={visibleFields} editAll={editAll} activeField={activeField} saving={saving} onBeginField={beginField} onPatch={patch} onCommitField={commitField} />
          <EditableRow row={{ id: "lastVerifiedBy", label: "VERIFIED BY", icon: "●", fallback: "JOHN CARTER" }} fields={visibleFields} editAll={editAll} activeField={activeField} saving={saving} onBeginField={beginField} onPatch={patch} onCommitField={commitField} />
        </Section>
      </main>

      <nav className="ops-commands">
        <button type="button" onClick={event => command(event, onRecall)}>↻ <span>RECALL</span></button>
        <button type="button" onClick={event => command(event, onBoard)}>▦ <span>BOARD</span></button>
        <button type="button" onClick={event => command(event, onReturn)}>↩ <span>RETURN</span></button>
      </nav>

      <IXIObjectRail
        object={object}
        saved={false}
        color={ixiState?.color || "none"}
        outline={Number(ixiState?.outline ?? 1)}
        face={2}
        onSendFront={onSendFront}
        onSendBack={onSendBack}
        onCycleColor={onCycleColor}
        onCycleOutline={onCycleOutline}
        armedDestination={armedDestination}
        onSendToArmedDestination={onSendToArmedDestination}
      />

      <style jsx global>{`
        .ixi-aos-location-f2,.ixi-aos-location-f2 *{box-sizing:border-box}
        .ixi-aos-location-f2{--y:#ffc400;--line:#343a35;--soft:#252a26;--surface:#101310;--surface2:#0b0e0c;--text:#f4f5f4;--muted:#969d98;position:relative;width:${W}px;height:${H}px;overflow:hidden;border:1px solid #454b47;border-radius:13px;background:linear-gradient(180deg,#101310,#080a09);color:var(--text);font-family:Arial,Helvetica,sans-serif;box-shadow:inset 0 1px #ffffff12,0 18px 40px #0008}
        .ixi-aos-location-f2.skin-steel{--y:#d9dde0;--line:#444b4f;--soft:#2b3033;--surface:#171a1c;--surface2:#101315;background:linear-gradient(180deg,#171a1c,#0d0f10)}
        .ixi-aos-location-f2.skin-blueprint{--y:#54c7ff;--line:#23404f;--soft:#122b38;--surface:#0b1a24;--surface2:#07141d;background:linear-gradient(180deg,#0a1720,#050b10)}
        .ixi-aos-location-f2.skin-industrial{--y:#ffc400;--line:#554424;--soft:#332816;--surface:#211a0e;--surface2:#171107;background:linear-gradient(180deg,#241b0f,#100c07)}

        .ixi-aos-location-f2 .ops-header{position:absolute;inset:0 0 auto;height:${HEADER}px;padding:7px 10px;border-bottom:1px solid #303531;background:linear-gradient(180deg,#171a18,#101210);z-index:40}
        .ixi-aos-location-f2 .ops-identity{width:185px;min-width:0}.ixi-aos-location-f2 .ops-identity>span{display:block;overflow:hidden;color:var(--y);font-size:6px;font-weight:950;letter-spacing:.08em;text-overflow:ellipsis;white-space:nowrap}.ixi-aos-location-f2 .ops-identity>strong{display:block;margin-top:4px;overflow:hidden;color:#f6f7f6;font-size:14px;font-weight:950;line-height:1;text-overflow:ellipsis;white-space:nowrap}
        .ixi-aos-location-f2 .ops-edit-actions{position:absolute;top:9px;right:8px;display:flex;height:20px}.ixi-aos-location-f2 .ops-edit-actions button{height:20px;padding:0 7px;border:0;border-left:1px solid rgba(255,255,255,.055);background:transparent;color:rgba(255,255,255,.62);font-size:6px;font-weight:950;cursor:pointer}.ixi-aos-location-f2 .ops-edit-actions button:first-child{border-left:0;color:var(--y)}

        .ixi-aos-location-f2 .ops-scroll{position:absolute;top:${HEADER}px;bottom:${COMMANDS + RAIL}px;left:7px;right:7px;display:flex;flex-direction:column;gap:5px;padding:5px 0 8px;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:#3d4540 #090b0a}
        .ixi-aos-location-f2 .ops-scroll::-webkit-scrollbar{width:5px}.ixi-aos-location-f2 .ops-scroll::-webkit-scrollbar-track{background:#090b0a}.ixi-aos-location-f2 .ops-scroll::-webkit-scrollbar-thumb{border:1px solid #151916;border-radius:999px;background:#3d4540}.ixi-aos-location-f2 .ops-scroll::-webkit-scrollbar-thumb:hover{background:#555f58}.ixi-aos-location-f2 .ops-scroll::-webkit-scrollbar-corner{background:#090b0a}

        .ixi-aos-location-f2 .gate-code{flex:0 0 43px;display:grid;grid-template-columns:25px minmax(0,1fr) 34px;align-items:center;margin:0;padding:0 5px;border:1px solid var(--line);border-radius:5px;background:var(--surface)}.ixi-aos-location-f2 .gate-mark{display:grid;place-items:center;width:20px;height:27px;border-right:1px solid var(--soft);color:var(--y);font-size:12px}.ixi-aos-location-f2 .gate-copy{min-width:0;padding-left:7px}.ixi-aos-location-f2 .gate-copy span{display:block;color:var(--muted);font-size:5px;font-weight:900;letter-spacing:.05em}.ixi-aos-location-f2 .gate-copy strong{display:block;margin-top:3px;color:#f4f5f4;font-size:12px;font-weight:950;letter-spacing:.04em}.ixi-aos-location-f2 .gate-copy input{width:100%;height:18px;margin-top:2px}

        .ixi-aos-location-f2 .ops-section{flex:0 0 auto;margin:0;overflow:hidden;border:1px solid var(--line);border-radius:5px;background:var(--surface)}.ixi-aos-location-f2 .ops-section h3{height:19px;margin:0;display:flex;align-items:center;padding:0 7px;border-bottom:1px solid var(--soft);background:#151916;color:var(--y);font-size:6px;font-weight:950;letter-spacing:.03em}.ixi-aos-location-f2 .ops-section-body{background:var(--surface2)}
        .ixi-aos-location-f2 .ops-row{min-height:21px;display:grid;grid-template-columns:15px minmax(91px,1.08fr) minmax(0,1fr) 31px;gap:3px;align-items:center;padding:2px 4px;border-bottom:1px solid var(--soft)}.ixi-aos-location-f2 .ops-row:last-child{border-bottom:0}.ixi-aos-location-f2 .ops-icon{display:flex;justify-content:center;color:#9aa19c;font-size:8px}.ixi-aos-location-f2 .ops-label{overflow:hidden;color:#969d98;font-size:5.7px;font-weight:900;line-height:1.05;text-overflow:ellipsis;white-space:nowrap}.ixi-aos-location-f2 .ops-row strong{min-width:0;overflow:hidden;color:#e8ebe9;font-size:6.25px;font-weight:900;line-height:1.15;text-overflow:ellipsis;white-space:nowrap}
        .ixi-aos-location-f2 .ops-row input,.ixi-aos-location-f2 .ops-row select,.ixi-aos-location-f2 .gate-copy input,.ixi-aos-location-f2 .site-instructions textarea{border:1px solid #3a403c;border-radius:3px;background:#080a09;color:#f4f5f4;outline:none;font:800 6px Arial}.ixi-aos-location-f2 .ops-row input,.ixi-aos-location-f2 .ops-row select{width:100%;height:17px;padding:0 3px}.ixi-aos-location-f2 .ops-row input:focus,.ixi-aos-location-f2 .ops-row select:focus,.ixi-aos-location-f2 .site-instructions textarea:focus,.ixi-aos-location-f2 .gate-copy input:focus{border-color:var(--y)}
        .ixi-aos-location-f2 .ops-row-edit{height:17px;padding:0 4px;border:1px solid #343a35;border-radius:3px;background:#111411;color:#969d98;font-size:5px;font-weight:950;cursor:pointer}.ixi-aos-location-f2 .ops-row-edit:hover{border-color:#545d57;color:var(--y)}.ixi-aos-location-f2 .gate-edit{height:19px}.ixi-aos-location-f2 .ops-inline-triple{display:grid;grid-template-columns:1fr 28px 40px;gap:2px}.ixi-aos-location-f2 .ops-inline-triple input{min-width:0;padding:0 2px;font-size:5.5px}

        .ixi-aos-location-f2 .site-instructions{position:relative;min-height:50px;display:grid;grid-template-columns:18px minmax(0,1fr) 31px;gap:5px;align-items:start;padding:7px 4px}.ixi-aos-location-f2 .instruction-icon{display:grid;place-items:center;width:18px;height:18px;border:1px solid var(--line);border-radius:3px;color:var(--y);font-size:9px}.ixi-aos-location-f2 .site-instructions strong{padding-top:1px;color:#e8ebe9;font-size:6.3px;font-weight:900;line-height:1.35}.ixi-aos-location-f2 .site-instructions textarea{width:100%;min-height:48px;padding:4px;resize:vertical}.ixi-aos-location-f2 .instruction-edit{margin-top:0}

        .ixi-aos-location-f2 .relationship-list{display:flex;flex-direction:column}.ixi-aos-location-f2 .ops-relationship{width:100%;min-height:21px;display:grid;grid-template-columns:15px 78px minmax(0,1fr) 10px;gap:3px;align-items:center;padding:2px 5px;border:0;border-bottom:1px solid var(--soft);background:transparent;color:var(--text);text-align:left;cursor:pointer}.ixi-aos-location-f2 .ops-relationship:last-child{border-bottom:0}.ixi-aos-location-f2 .rel-icon{color:#969d98;font-size:7px}.ixi-aos-location-f2 .rel-label{overflow:hidden;color:#969d98;font-size:5.5px;font-weight:900;text-overflow:ellipsis;white-space:nowrap}.ixi-aos-location-f2 .ops-relationship strong{overflow:hidden;color:#e8ebe9;font-size:6px;font-weight:900;text-overflow:ellipsis;white-space:nowrap}.ixi-aos-location-f2 .ops-relationship b{color:var(--y);font-size:11px;font-weight:500}.ixi-aos-location-f2 .ops-relationship:hover{background:#ffffff08}

        .ixi-aos-location-f2 .ops-commands{position:absolute;left:7px;right:7px;bottom:${RAIL}px;height:${COMMANDS}px;display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:3px 0;border-top:1px solid #202521;background:#090b0a;z-index:35}.ixi-aos-location-f2 .ops-commands button{height:18px;border:1px solid var(--line);border-radius:4px;background:#0f1210;color:#bcc2be;font-size:6px;font-weight:950;cursor:pointer}.ixi-aos-location-f2 .ops-commands button span{margin-left:3px}.ixi-aos-location-f2 .ops-commands button:hover{border-color:#555d58;color:var(--y)}
      `}</style>
    </article>
  );
}
