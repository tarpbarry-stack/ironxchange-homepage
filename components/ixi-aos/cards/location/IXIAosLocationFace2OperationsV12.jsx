import { useMemo, useState } from "react";

import IXIMachineRail from "../../../IXIMachineRail";
import IXIAosCardHeaderControls from "../../card-runtime/modules/IXIAosCardHeaderControls";

const W = 298;
const H = 471;
const RAIL = 19;

export const LOCATION_FACE2_V12_LOCK = Object.freeze({
  face: 2,
  slug: "location-operations",
  version: 12,
  lockedId: "location-f2-v12",
  nativeWidth: W,
  nativeHeight: H,
  railHeight: RAIL,
  behavior: "single-vertical-scroll"
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
  const cityState = [clean(fields.city), clean(fields.state)]
    .filter(Boolean)
    .join(", ");

  return [cityState, clean(fields.postalCode)]
    .filter(Boolean)
    .join(" ");
}

function getFieldDisplayValue(fields = {}, row = {}) {
  if (row.synthetic && row.id === "cityStateZip") {
    return getCityStateZip(fields) || row.fallback || "—";
  }

  const raw = fields?.[row.id];

  if (row.type === "yesno") {
    return normalizeYesNo(raw, row.fallback || "YES");
  }

  return clean(raw) || row.fallback || "—";
}

function Section({ title, children }) {
  return (
    <section className="ops-section">
      <div className="ops-section-title">{title}</div>
      <div className="ops-section-body">{children}</div>
    </section>
  );
}

function EditableRow({
  row,
  fields,
  editAll,
  activeField,
  saving,
  onBeginField,
  onPatch,
  onCommitField
}) {
  const isEditing = editAll || activeField === row.id;
  const display = getFieldDisplayValue(fields, row);

  if (row.synthetic && row.id === "cityStateZip") {
    return (
      <div className="ops-row ops-row-city">
        <span className="ops-icon">{row.icon}</span>
        <span className="ops-label">{row.label}</span>
        {isEditing ? (
          <div className="ops-inline-triple">
            <input
              value={fields.city ?? ""}
              placeholder="CITY"
              onChange={event => onPatch("city", event.target.value)}
            />
            <input
              value={fields.state ?? ""}
              placeholder="ST"
              onChange={event => onPatch("state", event.target.value)}
            />
            <input
              value={fields.postalCode ?? ""}
              placeholder="ZIP"
              onChange={event => onPatch("postalCode", event.target.value)}
            />
          </div>
        ) : (
          <strong>{display}</strong>
        )}
        {!editAll ? (
          <button
            type="button"
            className="ops-row-edit"
            disabled={saving}
            onClick={() => activeField === row.id
              ? onCommitField(["city", "state", "postalCode"])
              : onBeginField(row.id)}
          >
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
          <select
            value={normalizeYesNo(fields?.[row.id], row.fallback || "YES")}
            onChange={event => onPatch(row.id, event.target.value)}
          >
            {YES_NO.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        ) : (
          <input
            type={row.type === "number" ? "number" : "text"}
            value={fields?.[row.id] ?? ""}
            placeholder={row.fallback || ""}
            onChange={event => onPatch(row.id, event.target.value)}
          />
        )
      ) : (
        <strong>{display}</strong>
      )}
      {!editAll ? (
        <button
          type="button"
          className="ops-row-edit"
          disabled={saving}
          onClick={() => activeField === row.id
            ? onCommitField([row.id])
            : onBeginField(row.id)}
        >
          {activeField === row.id ? "SAVE" : "EDIT"}
        </button>
      ) : null}
    </div>
  );
}

function RelationshipRow({ relationship = {}, index = 0 }) {
  const label = clean(
    relationship?.displayLabel ||
    relationship?.label ||
    relationship?.relationshipLabel ||
    relationship?.name
  ) || `RELATIONSHIP ${index + 1}`;

  const value = clean(
    relationship?.displayName ||
    relationship?.value ||
    relationship?.targetDisplayName ||
    relationship?.targetLabel
  ) || "—";

  return (
    <button type="button" className="ops-relationship">
      <span>{label}</span>
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
  const persistedFields = useMemo(() => ({
    ...(object?.fields || {}),
    ...(ixiState?.face2SavedFields && typeof ixiState.face2SavedFields === "object"
      ? ixiState.face2SavedFields
      : {})
  }), [object?.fields, ixiState?.face2SavedFields]);

  const [draft, setDraft] = useState(() => ({ ...persistedFields }));
  const [editAll, setEditAll] = useState(false);
  const [activeField, setActiveField] = useState("");
  const [saving, setSaving] = useState(false);
  const displayName = clean(object?.displayName || object?.name) || "YARD NAME";
  const relationships = Array.isArray(object?.relationships) ? object.relationships : [];

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
        onIxiStateChange?.(objectId, {
          face2SavedFields: { ...nextFields },
          editingFace2: false
        });
      }

      await onSaveObject?.({
        objectId,
        object: {
          ...object,
          fields: {
            ...(object?.fields || {}),
            ...nextFields
          }
        },
        fields: {
          ...(object?.fields || {}),
          ...nextFields
        },
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

  const visibleFields = editAll || activeField ? draft : persistedFields;
  const verifiedDate = clean(visibleFields.lastVerifiedDate) || "AUG 12, 2026";
  const verifiedBy = clean(visibleFields.lastVerifiedBy) || "JOHN CARTER";

  return (
    <div className={`ixi-aos-location-f2 skin-${skinId}`}>
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
          <div className="ops-header-actions">
            <button type="button" className="ops-edit-all" onClick={beginEditAll}>EDIT ALL</button>
            <IXIAosCardHeaderControls
              canAdd
              canEdit={false}
              editing={false}
              onAdd={onAddObject}
              onHide={onHideObject}
              onDelete={onDeleteObject}
              onOpenConsole={onOpenConsole}
              skinId={skinId}
              skinOptions={LOCATION_FACE2_SKINS}
              onSkinChange={onSkinChange}
            />
          </div>
        )}
      </header>

      <div className="ops-scroll">
        <div className="gate-code">
          <span>GATE CODE</span>
          {editAll || activeField === "gateCode" ? (
            <input
              value={visibleFields.gateCode ?? ""}
              placeholder="4821"
              onChange={event => patch("gateCode", event.target.value)}
            />
          ) : (
            <strong>▣ {clean(visibleFields.gateCode) || "4821"}</strong>
          )}
          {!editAll ? (
            <button
              type="button"
              className="ops-row-edit gate-edit"
              disabled={saving}
              onClick={() => activeField === "gateCode"
                ? commitField(["gateCode"])
                : beginField("gateCode")}
            >
              {activeField === "gateCode" ? "SAVE" : "EDIT"}
            </button>
          ) : null}
        </div>

        {FIELD_GROUPS.map(group => (
          <Section key={group.id} title={group.label}>
            {group.rows.map(row => (
              <EditableRow
                key={row.id}
                row={row}
                fields={visibleFields}
                editAll={editAll}
                activeField={activeField}
                saving={saving}
                onBeginField={beginField}
                onPatch={patch}
                onCommitField={commitField}
              />
            ))}
          </Section>
        ))}

        <Section title="SITE INSTRUCTIONS">
          <div className="site-instructions">
            {editAll || activeField === "siteInstructions" ? (
              <textarea
                value={visibleFields.siteInstructions ?? ""}
                placeholder="ENTER SITE ACCESS / ARRIVAL / STAGING INSTRUCTIONS"
                onChange={event => patch("siteInstructions", event.target.value)}
              />
            ) : (
              <strong>{clean(visibleFields.siteInstructions) || "ENTER NORTH GATE FROM RAMA DR. CALL ON ARRIVAL. LOWBOYS STAGE LEFT OF SHOP."}</strong>
            )}
            {!editAll ? (
              <button
                type="button"
                className="ops-row-edit instruction-edit"
                disabled={saving}
                onClick={() => activeField === "siteInstructions"
                  ? commitField(["siteInstructions"])
                  : beginField("siteInstructions")}
              >
                {activeField === "siteInstructions" ? "SAVE" : "EDIT"}
              </button>
            ) : null}
          </div>
        </Section>

        <Section title="RELATIONSHIPS & INFRASTRUCTURE">
          <div className="relationship-list">
            {relationships.length ? (
              relationships.map((relationship, index) => (
                <RelationshipRow
                  key={clean(relationship?.id || relationship?.relationshipId) || index}
                  relationship={relationship}
                  index={index}
                />
              ))
            ) : (
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
          <EditableRow
            row={{ id: "lastVerifiedDate", label: "LAST VERIFIED", icon: "✓", fallback: verifiedDate }}
            fields={visibleFields}
            editAll={editAll}
            activeField={activeField}
            saving={saving}
            onBeginField={beginField}
            onPatch={patch}
            onCommitField={commitField}
          />
          <EditableRow
            row={{ id: "lastVerifiedBy", label: "VERIFIED BY", icon: "●", fallback: verifiedBy }}
            fields={visibleFields}
            editAll={editAll}
            activeField={activeField}
            saving={saving}
            onBeginField={beginField}
            onPatch={patch}
            onCommitField={commitField}
          />
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
        .ixi-aos-location-f2,.ixi-aos-location-f2 *{box-sizing:border-box;font-family:Arial,Helvetica,sans-serif}
        .ixi-aos-location-f2{--bg:#0d0e0e;--panel:#101212;--panel2:#0a0b0b;--border:rgba(255,255,255,.12);--soft:rgba(255,255,255,.065);--text:#eceeec;--muted:rgba(255,255,255,.58);--accent:#ffc400;--link:#00c2ff;position:relative;width:${W}px;height:${H}px;overflow:hidden;border:1px solid var(--border);border-radius:14px;background:var(--bg);color:var(--text);box-shadow:0 18px 34px rgba(0,0,0,.42);font-size:8.2px;line-height:1.15}
        .ixi-aos-location-f2.skin-steel{--bg:#101214;--panel:#191c1e;--panel2:#111315;--border:rgba(210,220,224,.22);--soft:rgba(210,220,224,.10);--accent:#d9dde0;--link:#ffc400;background:linear-gradient(135deg,#17191b,#0d0f10)}
        .ixi-aos-location-f2.skin-blueprint{--bg:#071119;--panel:#0b1a24;--panel2:#07141d;--border:rgba(61,184,255,.25);--soft:rgba(61,184,255,.12);--accent:#54c7ff;--link:#54c7ff;background:linear-gradient(180deg,#0a1720,#050b10)}
        .ixi-aos-location-f2.skin-industrial{--bg:#17120a;--panel:#241c0f;--panel2:#171107;--border:rgba(255,190,65,.27);--soft:rgba(255,190,65,.10);--accent:#ffc400;--link:#ffc400;background:linear-gradient(145deg,#281d0e,#100c07)}
        .ixi-aos-location-f2 .ops-header{height:43px;display:flex;align-items:center;justify-content:space-between;padding:6px 7px 5px 9px;border-bottom:1px solid var(--border);background:linear-gradient(180deg,rgba(255,255,255,.035),transparent)}
        .ixi-aos-location-f2 .ops-identity{min-width:0;display:flex;flex-direction:column;gap:2px}.ixi-aos-location-f2 .ops-identity span{font-size:7.2px;font-weight:900;letter-spacing:.08em;color:var(--accent)}.ixi-aos-location-f2 .ops-identity strong{font-size:16px;line-height:1;font-weight:900;letter-spacing:-.025em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px}
        .ixi-aos-location-f2 .ops-header-actions,.ixi-aos-location-f2 .ops-edit-actions{display:flex;align-items:center;gap:4px}.ixi-aos-location-f2 .ops-edit-all,.ixi-aos-location-f2 .ops-edit-actions button{height:24px;padding:0 7px;border-radius:4px;border:1px solid var(--border);background:#0a0b0b;color:var(--text);font-size:7px;font-weight:900;letter-spacing:.04em;cursor:pointer}.ixi-aos-location-f2 .ops-edit-actions button:first-child{border-color:color-mix(in srgb,var(--accent) 58%,transparent);color:var(--accent)}
        .ixi-aos-location-f2 .ops-scroll{position:absolute;top:43px;bottom:${RAIL}px;left:0;right:0;overflow-y:auto;overflow-x:hidden;padding:6px 6px 10px;scrollbar-width:thin;scrollbar-color:var(--accent) rgba(255,255,255,.05)}
        .ixi-aos-location-f2 .ops-scroll::-webkit-scrollbar{width:4px}.ixi-aos-location-f2 .ops-scroll::-webkit-scrollbar-track{background:rgba(255,255,255,.04)}.ixi-aos-location-f2 .ops-scroll::-webkit-scrollbar-thumb{background:var(--accent);border-radius:8px}
        .ixi-aos-location-f2 .gate-code{position:relative;display:grid;grid-template-columns:68px minmax(0,1fr) 31px;align-items:center;min-height:38px;margin-bottom:6px;padding:6px 5px 6px 9px;border:1px solid color-mix(in srgb,var(--accent) 45%,transparent);border-radius:7px;background:linear-gradient(90deg,color-mix(in srgb,var(--accent) 8%,transparent),rgba(255,255,255,.015))}.ixi-aos-location-f2 .gate-code>span{font-size:8px;font-weight:900;color:var(--accent)}.ixi-aos-location-f2 .gate-code>strong{font-size:17px;letter-spacing:.04em}.ixi-aos-location-f2 .gate-code input{width:100%;height:24px}
        .ixi-aos-location-f2 .ops-section{margin:0 0 6px;border:1px solid var(--border);border-radius:7px;overflow:hidden;background:var(--panel);box-shadow:inset 0 1px rgba(255,255,255,.025)}.ixi-aos-location-f2 .ops-section-title{height:22px;display:flex;align-items:center;padding:0 8px;border-bottom:1px solid var(--border);background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(0,0,0,.08));color:var(--accent);font-size:7.8px;font-weight:900;letter-spacing:.045em}.ixi-aos-location-f2 .ops-section-body{background:var(--panel2)}
        .ixi-aos-location-f2 .ops-row{min-height:24px;display:grid;grid-template-columns:17px minmax(88px,1.05fr) minmax(0,1fr) 31px;gap:4px;align-items:center;padding:3px 5px;border-bottom:1px solid var(--soft)}.ixi-aos-location-f2 .ops-row:last-child{border-bottom:0}.ixi-aos-location-f2 .ops-icon{display:flex;justify-content:center;color:rgba(255,255,255,.72);font-size:9px}.ixi-aos-location-f2 .ops-label{color:rgba(255,255,255,.70);font-size:6.55px;line-height:1.05;font-weight:700;letter-spacing:.02em}.ixi-aos-location-f2 .ops-row strong{min-width:0;color:var(--text);font-size:6.9px;line-height:1.12;font-weight:800;word-break:break-word}.ixi-aos-location-f2 .ops-row input,.ixi-aos-location-f2 .ops-row select,.ixi-aos-location-f2 .gate-code input,.ixi-aos-location-f2 .site-instructions textarea{border:1px solid rgba(255,255,255,.16);border-radius:3px;background:#050606;color:#fff;outline:none;font-size:7px;font-weight:700}.ixi-aos-location-f2 .ops-row input,.ixi-aos-location-f2 .ops-row select{width:100%;height:19px;padding:1px 4px}.ixi-aos-location-f2 .ops-row input:focus,.ixi-aos-location-f2 .ops-row select:focus,.ixi-aos-location-f2 .site-instructions textarea:focus,.ixi-aos-location-f2 .gate-code input:focus{border-color:var(--accent)}
        .ixi-aos-location-f2 .ops-row-edit{height:18px;padding:0 4px;border:1px solid rgba(255,255,255,.15);border-radius:3px;background:#141616;color:#e6e8e6;font-size:5.8px;font-weight:900;letter-spacing:.02em;cursor:pointer}.ixi-aos-location-f2 .ops-row-edit:hover{border-color:var(--accent);color:var(--accent)}.ixi-aos-location-f2 .gate-edit{height:22px}.ixi-aos-location-f2 .ops-inline-triple{display:grid;grid-template-columns:1fr 31px 44px;gap:2px}.ixi-aos-location-f2 .ops-inline-triple input{min-width:0;padding:1px 2px;font-size:6px}
        .ixi-aos-location-f2 .site-instructions{position:relative;min-height:55px;padding:8px 40px 8px 9px}.ixi-aos-location-f2 .site-instructions strong{display:block;font-size:7.4px;line-height:1.35;letter-spacing:.025em}.ixi-aos-location-f2 .site-instructions textarea{width:100%;min-height:58px;resize:vertical;padding:5px 6px}.ixi-aos-location-f2 .instruction-edit{position:absolute;right:6px;top:8px}
        .ixi-aos-location-f2 .relationship-list{display:flex;flex-direction:column}.ixi-aos-location-f2 .ops-relationship{display:grid;grid-template-columns:minmax(80px,.8fr) minmax(0,1fr) 12px;align-items:center;gap:4px;width:100%;min-height:24px;padding:3px 7px;border:0;border-bottom:1px solid var(--soft);background:transparent;color:var(--text);text-align:left;cursor:pointer}.ixi-aos-location-f2 .ops-relationship:last-child{border-bottom:0}.ixi-aos-location-f2 .ops-relationship span{font-size:6.5px;color:rgba(255,255,255,.66);font-weight:700}.ixi-aos-location-f2 .ops-relationship strong{font-size:6.8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ixi-aos-location-f2 .ops-relationship b{font-size:13px;color:var(--link);font-weight:500}.ixi-aos-location-f2 .ops-relationship:hover{background:rgba(255,255,255,.035)}
      `}</style>
    </div>
  );
}
