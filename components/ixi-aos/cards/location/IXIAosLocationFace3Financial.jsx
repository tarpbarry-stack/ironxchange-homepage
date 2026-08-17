import { useMemo, useState } from "react";

import IXIMachineRail from "../../../IXIMachineRail";
import IXIAosCardHeaderControls from "../../card-runtime/modules/IXIAosCardHeaderControls";
import {
  clean,
  getObjectRelationships
} from "../../card-runtime/IXIAosSemanticObjectPresentation";

const W = 298;
const H = 471;
const RAIL = 19;
const HEADER = 43;

export const LOCATION_FACE_3_FINANCIAL = Object.freeze({
  faceNumber: 3,
  version: 12,
  nativeWidth: W,
  nativeHeight: H,
  railHeight: RAIL,
  renderer: "location-financial-v12",
  modes: Object.freeze(["owned", "leased"])
});

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function number(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function money(value) {
  const parsed = number(value);
  if (parsed === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(parsed);
}

function percent(value) {
  const parsed = number(value);
  return parsed === null ? "—" : `${parsed.toFixed(parsed % 1 ? 2 : 0)}%`;
}

function display(value, fallback = "—") {
  const resolved = clean(value);
  return resolved || fallback;
}

function titleCase(value) {
  return clean(value)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function readValue(fields, runtimeData, key, aliases = []) {
  const runtime = safeObject(runtimeData);
  const sources = [
    runtime,
    safeObject(runtime.financial),
    safeObject(runtime.summary),
    safeObject(runtime.metrics),
    safeObject(runtime.property),
    safeObject(runtime.lease),
    safeObject(runtime.operating),
    safeObject(runtime.tax),
    safeObject(runtime.budget),
    fields
  ];

  const keys = [key, ...aliases];
  for (const source of sources) {
    for (const candidate of keys) {
      const value = source?.[candidate];
      if (value !== undefined && value !== null && value !== "") return value;
    }
  }
  return "";
}

function getMode(fields = {}) {
  const raw = clean(
    fields.ownershipStatus ||
    fields.propertyStatus ||
    fields.occupancyType ||
    fields.locationFinancialMode ||
    "owned"
  ).toLowerCase();

  return raw.includes("lease") || raw.includes("rent")
    ? "leased"
    : "owned";
}

function Section({ title, tone = "default", children }) {
  return (
    <section className={`fin-section tone-${tone}`}>
      <div className="fin-section-title">{title}</div>
      <div className="fin-section-body">{children}</div>
    </section>
  );
}

function FieldRow({
  icon = "•",
  label,
  value,
  editing = false,
  type = "text",
  onChange = null,
  derived = false,
  tone = "default"
}) {
  const formatted = type === "money"
    ? money(value)
    : type === "percent"
      ? percent(value)
      : display(value);

  return (
    <div className={`fin-row tone-${tone}`}>
      <span className="fin-row-icon">{icon}</span>
      <span className="fin-row-label">{label}</span>
      {editing && !derived && onChange ? (
        type === "textarea" ? (
          <textarea value={value ?? ""} onChange={event => onChange(event.target.value)} />
        ) : (
          <input value={value ?? ""} onChange={event => onChange(event.target.value)} />
        )
      ) : (
        <strong>{formatted}</strong>
      )}
      {derived ? <em title="Derived financial value">TX</em> : null}
    </div>
  );
}

function ContactCard({
  title,
  name,
  role,
  phone,
  email,
  editing,
  onChange,
  prefix
}) {
  return (
    <div className="fin-contact">
      <span>{title}</span>
      <div className="contact-person">
        <b>●</b>
        <strong>{display(name, "—")}</strong>
      </div>
      {editing ? (
        <div className="contact-edit">
          <input value={name ?? ""} placeholder="NAME" onChange={event => onChange(`${prefix}Name`, event.target.value)} />
          <input value={role ?? ""} placeholder="ROLE" onChange={event => onChange(`${prefix}Role`, event.target.value)} />
          <input value={phone ?? ""} placeholder="PHONE" onChange={event => onChange(`${prefix}Phone`, event.target.value)} />
          <input value={email ?? ""} placeholder="EMAIL" onChange={event => onChange(`${prefix}Email`, event.target.value)} />
        </div>
      ) : (
        <>
          <small>{display(role, "")}</small>
          <i>{display(phone, "")}</i>
          <small>{display(email, "")}</small>
        </>
      )}
    </div>
  );
}

function SummaryCell({ label, value, type = "money", tone = "default", derived = true }) {
  const formatted = type === "money"
    ? money(value)
    : type === "percent"
      ? percent(value)
      : display(value);

  return (
    <div className={`fin-summary-cell tone-${tone}`}>
      <span>{label}</span>
      <strong>{formatted}</strong>
      {derived ? <small>TRAN$ACT</small> : null}
    </div>
  );
}

function RelationshipRow({ relationship }) {
  const label = clean(
    relationship?.displayLabel ||
    relationship?.label ||
    relationship?.type ||
    "RELATIONSHIP"
  );
  const value = clean(
    relationship?.displayName ||
    relationship?.value ||
    relationship?.name ||
    relationship?.secondary ||
    ""
  );

  return (
    <button type="button" className="fin-relationship">
      <span>▣</span>
      <b>{label}</b>
      <strong>{value || "OPEN"}</strong>
      <i>›</i>
    </button>
  );
}

export default function IXIAosLocationFace3Financial({
  object = {},
  ixiState = {},
  onIxiStateChange = null,
  onSaveObject = null,
  onAddObject = null,
  onHideObject = null,
  onDeleteObject = null,
  onOpenConsole = null,
  onOpenTransact = null,
  runtimeData = {},
  financialSnapshot = null,
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
  const persisted = safeObject(object?.fields);
  const savedFields = safeObject(ixiState?.face3SavedFields);
  const sourceFields = Object.keys(savedFields).length ? savedFields : persisted;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(() => ({ ...sourceFields }));
  const fields = editing ? draft : sourceFields;
  const financial = financialSnapshot && typeof financialSnapshot === "object"
    ? financialSnapshot
    : runtimeData;
  const mode = getMode(fields);
  const leased = mode === "leased";
  const relationships = getObjectRelationships(object);
  const displayName = clean(object?.displayName) || "YARD NAME";

  const monthlyOperatingCost = useMemo(() => {
    const explicit = number(readValue(fields, financial, "totalMonthlyOperatingCost", ["monthlyOperatingCost", "monthlyExpenses"]));
    if (explicit !== null) return explicit;
    return ["electricCost", "waterCost", "sewerCost", "naturalGasCost", "internetPhoneCost", "wasteTrashCost", "propertyTaxCost", "insuranceCost", "otherOperatingCost"]
      .map(key => number(readValue(fields, financial, key)) || 0)
      .reduce((sum, value) => sum + value, 0);
  }, [fields, financial]);

  const monthlyLeaseCost = useMemo(() => {
    const explicit = number(readValue(fields, financial, "totalMonthlyOccupancyCost", ["monthlyOccupancyCost"]));
    if (explicit !== null) return explicit;
    return ["baseRentMonthly", "camOpexMonthly", "propertyTaxPassThrough", "insurancePassThrough", "otherNnnMonthly"]
      .map(key => number(readValue(fields, financial, key)) || 0)
      .reduce((sum, value) => sum + value, 0);
  }, [fields, financial]);

  function patch(key, value) {
    setDraft(current => ({ ...current, [key]: value }));
  }

  function beginEdit() {
    setDraft({ ...sourceFields });
    setEditing(true);
  }

  function cancelEdit() {
    setDraft({ ...sourceFields });
    setEditing(false);
  }

  async function saveEdit() {
    if (saving) return;
    setSaving(true);
    try {
      const nextFields = { ...persisted, ...draft };
      if (objectId) {
        onIxiStateChange?.(objectId, {
          face3SavedFields: { ...draft },
          editingFace3: false
        });
      }
      await onSaveObject?.({
        objectId,
        object: { ...object, fields: nextFields },
        fields: nextFields,
        face: 3
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function editField(key, label, type = "text", icon = "•") {
    return (
      <FieldRow
        icon={icon}
        label={label}
        value={fields[key]}
        type={type}
        editing={editing}
        onChange={value => patch(key, value)}
      />
    );
  }

  function derivedField(key, label, type = "money", aliases = [], icon = "•", tone = "default") {
    return (
      <FieldRow
        icon={icon}
        label={label}
        value={readValue(fields, financial, key, aliases)}
        type={type}
        derived
        tone={tone}
      />
    );
  }

  const managerPrefix = leased ? "leasingContact" : "propertyManager";
  const ownerPrefix = leased ? "landlord" : "propertyOwner";

  return (
    <div className={`ixi-aos-location-f3 skin-${skinId} mode-${mode}`}>
      <header className="fin-header">
        <div className="fin-identity">
          <span>LOCATIONS & FACILITIES · FACE 3</span>
          <strong>{displayName}</strong>
        </div>
        {editing ? (
          <div className="fin-edit-actions">
            <button type="button" disabled={saving} onClick={saveEdit}>SAVE</button>
            <button type="button" disabled={saving} onClick={cancelEdit}>CANCEL</button>
          </div>
        ) : (
          <IXIAosCardHeaderControls
            canAdd
            canEdit
            canTransact
            editing={false}
            onAdd={onAddObject}
            onToggleEdit={beginEdit}
            onTransact={onOpenTransact}
            onHide={onHideObject}
            onDelete={onDeleteObject}
            onOpenConsole={onOpenConsole}
            skinId={skinId}
            onSkinChange={onSkinChange}
          />
        )}
      </header>

      <div className="fin-scroll">
        <Section title="OWNERSHIP STATUS" tone={leased ? "lease" : "owned"}>
          <div className="ownership-banner">
            <div className="ownership-state">
              <b>{leased ? "◉" : "▣"}</b>
              {editing ? (
                <select
                  value={leased ? "LEASED" : "OWNED"}
                  onChange={event => patch("ownershipStatus", event.target.value)}
                >
                  <option>OWNED</option>
                  <option>LEASED</option>
                </select>
              ) : (
                <strong>{leased ? "LEASED" : "OWNED"}</strong>
              )}
              <small>{display(fields.ownershipType, leased ? "OPERATING LEASE" : "FEE SIMPLE")}</small>
            </div>
            <div className="ownership-date">
              <span>{leased ? "LEASE START" : "ACQUIRED"}</span>
              {editing ? (
                <input
                  value={leased ? (fields.leaseStartDate ?? "") : (fields.acquiredDate ?? "")}
                  onChange={event => patch(leased ? "leaseStartDate" : "acquiredDate", event.target.value)}
                />
              ) : (
                <strong>{display(leased ? fields.leaseStartDate : fields.acquiredDate)}</strong>
              )}
            </div>
          </div>
        </Section>

        <div className="fin-contact-grid">
          <ContactCard
            title={leased ? "LANDLORD / LESSOR" : "PROPERTY OWNER"}
            name={fields[`${ownerPrefix}Name`] || fields[ownerPrefix]}
            role={fields[`${ownerPrefix}Role`]}
            phone={fields[`${ownerPrefix}Phone`]}
            email={fields[`${ownerPrefix}Email`]}
            editing={editing}
            onChange={patch}
            prefix={ownerPrefix}
          />
          <ContactCard
            title={leased ? "PROPERTY MANAGER / LEASING CONTACT" : "PROPERTY MANAGER"}
            name={fields[`${managerPrefix}Name`] || fields[managerPrefix]}
            role={fields[`${managerPrefix}Role`]}
            phone={fields[`${managerPrefix}Phone`]}
            email={fields[`${managerPrefix}Email`]}
            editing={editing}
            onChange={patch}
            prefix={managerPrefix}
          />
        </div>

        {!leased ? (
          <>
            <Section title="PROPERTY OVERVIEW">
              <div className="fin-split">
                <div className="fin-list">
                  {editField("propertyType", "PROPERTY TYPE", "text", "◈")}
                  {editField("parcelAssetId", "PARCEL / ASSET ID", "text", "◇")}
                  {editField("propertyAddress", "ADDRESS", "text", "⌂")}
                  {editField("landArea", "LAND AREA", "text", "▰")}
                  {editField("buildingArea", "BUILDING AREA", "text", "▦")}
                  {editField("yearBuilt", "YEAR BUILT", "text", "□")}
                  {editField("zoning", "ZONING", "text", "♜")}
                  {editField("taxId", "TAX ID", "text", "#")}
                </div>
                <div className="fin-value-card">
                  <span>PROPERTY VALUE</span>
                  <p><small>LAND VALUE</small><strong>{money(readValue(fields, financial, "landValue"))}</strong></p>
                  <p><small>IMPROVEMENT VALUE</small><strong>{money(readValue(fields, financial, "improvementValue"))}</strong></p>
                  <hr />
                  <p className="hero"><small>TOTAL APPRAISED VALUE</small><strong>{money(readValue(fields, financial, "totalAppraisedValue", ["appraisedValue"]))}</strong></p>
                  <p><small>CURRENT VALUE</small><strong>{money(readValue(fields, financial, "currentValue"))}</strong></p>
                  <p><small>LAST APPRAISED</small><strong>{display(readValue(fields, financial, "lastAppraised"))}</strong></p>
                </div>
              </div>
            </Section>

            <Section title="OPERATING COSTS (MONTHLY)">
              <div className="fin-cost-grid">
                {derivedField("electricCost", "ELECTRIC", "money", [], "ϟ")}
                {derivedField("wasteTrashCost", "WASTE / TRASH", "money", [], "▥")}
                {derivedField("waterCost", "WATER", "money", [], "◉")}
                {derivedField("propertyTaxCost", "PROPERTY TAX", "money", ["taxCost"], "◈")}
                {derivedField("sewerCost", "SEWER", "money", [], "♜")}
                {derivedField("insuranceCost", "INSURANCE", "money", [], "◈")}
                {derivedField("naturalGasCost", "NATURAL GAS", "money", [], "♨")}
                {derivedField("otherOperatingCost", "OTHER COSTS", "money", [], "◇")}
                {derivedField("internetPhoneCost", "INTERNET / PHONE", "money", [], "◉")}
              </div>
              <div className="fin-total"><span>TOTAL MONTHLY COSTS</span><strong>{money(monthlyOperatingCost)}</strong></div>
            </Section>

            <Section title="ANNUAL SUMMARY (YTD)">
              <div className="fin-summary-grid three">
                <SummaryCell label="TOTAL REVENUE (YTD)" value={readValue(fields, financial, "totalRevenueYtd", ["revenueYtd"])} tone="positive" />
                <SummaryCell label="TOTAL EXPENSES (YTD)" value={readValue(fields, financial, "totalExpensesYtd", ["expensesYtd"])} tone="negative" />
                <SummaryCell label="NET INCOME (YTD)" value={readValue(fields, financial, "netIncomeYtd")} tone="positive" />
              </div>
            </Section>

            <div className="fin-triple">
              <Section title="FINANCIAL RATIOS">
                {derivedField("capRate", "CAP RATE", "percent", [], "")}
                {derivedField("roiYtd", "ROI (YTD)", "percent", [], "")}
                {derivedField("occupancy", "OCCUPANCY", "percent", [], "")}
                {derivedField("grossMargin", "GROSS MARGIN", "percent", [], "")}
              </Section>
              <Section title="BUDGET OVERVIEW">
                {derivedField("annualBudget", "ANNUAL BUDGET", "money", [], "")}
                {derivedField("ytdBudget", "YTD BUDGET", "money", [], "")}
                {derivedField("ytdActual", "YTD ACTUAL", "money", ["totalExpensesYtd"], "", "negative")}
                {derivedField("budgetVariance", "VARIANCE", "money", [], "", "negative")}
              </Section>
              <Section title="TAX INFORMATION">
                {editField("taxAuthority", "TAX AUTHORITY")}
                {editField("taxYear", "TAX YEAR")}
                {editField("assessedValue", "ASSESSED VALUE", "text")}
                {editField("taxRate", "TAX RATE", "text")}
              </Section>
            </div>
          </>
        ) : (
          <>
            <Section title="LEASE OVERVIEW">
              <div className="fin-split">
                <div className="fin-list">
                  {editField("leaseType", "LEASE TYPE", "text", "◉")}
                  {editField("leaseStartDate", "LEASE START DATE", "text", "□")}
                  {editField("leaseEndDate", "LEASE END DATE", "text", "□")}
                  {editField("renewalOption", "RENEWAL OPTION", "text", "♜")}
                  {editField("noticeRequired", "NOTICE REQUIRED", "text", "□")}
                  {editField("securityDeposit", "SECURITY DEPOSIT", "text", "◈")}
                  {editField("leaseUse", "USE", "text", "▣")}
                </div>
                <div className="fin-value-card lease-card">
                  <span>LEASE SUMMARY</span>
                  <p><small>MONTHLY BASE RENT</small><strong>{money(readValue(fields, financial, "baseRentMonthly"))}</strong></p>
                  <p><small>ANNUAL BASE RENT</small><strong>{money(readValue(fields, financial, "baseRentAnnual"))}</strong></p>
                  <p><small>RENT ESCALATION</small><strong>{percent(readValue(fields, financial, "rentEscalation"))}</strong></p>
                  <p><small>ESCALATION TYPE</small><strong>{display(readValue(fields, financial, "escalationType"))}</strong></p>
                  <p><small>NEXT ESCALATION</small><strong>{display(readValue(fields, financial, "nextEscalation"))}</strong></p>
                </div>
              </div>
            </Section>

            <Section title="LEASE TERMS & COST STRUCTURE" tone="lease">
              <div className="fin-split">
                <div className="fin-list">
                  {derivedField("baseRentMonthly", "BASE RENT (MONTHLY)", "money", [], "▦")}
                  {derivedField("camOpexMonthly", "CAM / OPEX (MONTHLY)", "money", [], "◈")}
                  {derivedField("propertyTaxPassThrough", "PROPERTY TAX (PASS-THRU)", "money", [], "◈")}
                  {derivedField("insurancePassThrough", "INSURANCE (PASS-THRU)", "money", [], "◈")}
                  {derivedField("otherNnnMonthly", "OTHER NNN (MONTHLY)", "money", [], "♜")}
                  <div className="fin-total lease-total"><span>TOTAL MONTHLY OCCUPANCY COST</span><strong>{money(monthlyLeaseCost)}</strong></div>
                </div>
                <div className="lease-ytd">
                  <span>LEASE COST SUMMARY (YTD)</span>
                  <div className="fin-summary-grid two">
                    <SummaryCell label="TOTAL RENT (YTD)" value={readValue(fields, financial, "totalRentYtd")} tone="lease" />
                    <SummaryCell label="TOTAL PASS-THROUGH (YTD)" value={readValue(fields, financial, "totalPassThroughYtd")} tone="lease" />
                  </div>
                  <SummaryCell label="TOTAL OCCUPANCY COST (YTD)" value={readValue(fields, financial, "totalOccupancyCostYtd")} tone="lease" />
                </div>
              </div>
            </Section>

            <Section title="OPERATING EXPENSES (MONTHLY)">
              <div className="fin-cost-grid">
                {derivedField("electricCost", "ELECTRIC", "money", [], "ϟ")}
                {derivedField("internetPhoneCost", "INTERNET / PHONE", "money", [], "◉")}
                {derivedField("waterCost", "WATER", "money", [], "◉")}
                {derivedField("wasteTrashCost", "WASTE / TRASH", "money", [], "▥")}
                {derivedField("sewerCost", "SEWER", "money", [], "♜")}
                {derivedField("otherOperatingCost", "OTHER EXPENSES", "money", [], "◇")}
                {derivedField("naturalGasCost", "NATURAL GAS", "money", [], "♨")}
              </div>
              <div className="fin-total lease-total"><span>TOTAL MONTHLY EXPENSES</span><strong>{money(monthlyOperatingCost)}</strong></div>
            </Section>
          </>
        )}

        <Section title="NOTES">
          <FieldRow
            icon="▧"
            label="FINANCIAL / PROPERTY NOTES"
            value={fields.financialNotes}
            type="textarea"
            editing={editing}
            onChange={value => patch("financialNotes", value)}
          />
        </Section>

        <Section title="RELATIONSHIPS & INFRASTRUCTURE">
          <div className="fin-relationships">
            {relationships.length ? relationships.map((relationship, index) => (
              <RelationshipRow key={relationship?.id || index} relationship={relationship} />
            )) : (
              [
                leased ? ["LEASE AGREEMENT", fields.leaseAgreement || "OPEN"] : ["BUDGET", fields.budgetReference || "OPEN"],
                ["INSURANCE POLICY", fields.insurancePolicy || "OPEN"],
                ["TAX RECORD", fields.taxRecord || fields.taxId || "OPEN"],
                ["UTILITY ACCOUNTS", fields.utilityAccounts || "OPEN"],
                [leased ? "LANDLORD CONTACT" : "MAINTENANCE PLAN", leased ? (fields.landlordName || "OPEN") : (fields.maintenancePlan || "OPEN")]
              ].map(([label, value]) => (
                <RelationshipRow key={label} relationship={{ label, value }} />
              ))
            )}
          </div>
        </Section>
      </div>

      <IXIMachineRail
        listing={object}
        saved={false}
        boardColor="none"
        boardOutline={1}
        machineFace={3}
        onSendFront={onSendFront}
        onSendBack={onSendBack}
        onCycleColor={onCycleColor}
        onCycleOutline={onCycleOutline}
        armedDestination={armedDestination}
        onSendToArmedDestination={onSendToArmedDestination}
      />

      <style jsx global>{`
        .ixi-aos-location-f3,.ixi-aos-location-f3 *{box-sizing:border-box;font-family:Arial,Helvetica,sans-serif}.ixi-aos-location-f3{--bg:#0c0e0d;--panel:#101312;--panel2:#0a0c0b;--border:rgba(255,255,255,.11);--soft:rgba(255,255,255,.06);--text:#edf0ed;--muted:rgba(255,255,255,.57);--accent:#ffc400;--green:#86d112;--red:#ff5f50;--lease:#b96cff;position:relative;width:${W}px;height:${H}px;overflow:hidden;border:1px solid var(--border);border-radius:14px;background:linear-gradient(180deg,#111412,#090b0a);color:var(--text);box-shadow:0 18px 34px rgba(0,0,0,.42);font-size:9px;line-height:1.15}.ixi-aos-location-f3.skin-steel{--bg:#101214;--panel:#191c1e;--panel2:#111315;--border:rgba(210,220,224,.22);--soft:rgba(210,220,224,.10);--accent:#d9dde0;background:linear-gradient(135deg,#17191b,#0d0f10)}.ixi-aos-location-f3.skin-blueprint{--bg:#071119;--panel:#0b1a24;--panel2:#07141d;--border:rgba(61,184,255,.25);--soft:rgba(61,184,255,.12);--accent:#54c7ff;background:linear-gradient(180deg,#0a1720,#050b10)}.fin-header{position:absolute;top:0;left:0;right:0;height:${HEADER}px;padding:8px 10px;border-bottom:1px solid var(--border);background:rgba(10,12,11,.97);z-index:100}.fin-identity{max-width:185px}.fin-identity>span{display:block;color:var(--accent);font-size:6px;font-weight:950;letter-spacing:.05em}.fin-identity>strong{display:block;margin-top:5px;overflow:hidden;color:#f4f5f4;font-size:15px;font-weight:950;line-height:1;text-overflow:ellipsis;white-space:nowrap}.fin-edit-actions{position:absolute;top:10px;right:8px;display:flex;gap:4px}.fin-edit-actions button{height:21px;padding:0 7px;border:1px solid var(--border);border-radius:4px;background:#111;color:#ddd;font-size:6px;font-weight:950}.fin-edit-actions button:first-child{color:var(--accent)}.fin-scroll{position:absolute;top:${HEADER}px;left:0;right:0;bottom:${RAIL}px;padding:6px;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;scrollbar-width:thin}.fin-section{margin-bottom:6px;border:1px solid var(--border);border-radius:6px;background:linear-gradient(180deg,rgba(255,255,255,.018),transparent),var(--panel);overflow:hidden}.fin-section-title{height:21px;display:flex;align-items:center;padding:0 7px;border-bottom:1px solid var(--soft);color:var(--accent);font-size:6.5px;font-weight:950;letter-spacing:.025em}.tone-lease>.fin-section-title,.mode-leased .lease-total span,.mode-leased .lease-ytd>span{color:var(--lease)}.fin-section-body{padding:5px}.ownership-banner{display:grid;grid-template-columns:1.15fr .85fr;min-height:52px}.ownership-state{display:grid;grid-template-columns:28px 1fr;grid-template-rows:1fr 1fr;align-items:center;padding:4px 8px;border-right:1px solid var(--border)}.ownership-state>b{grid-row:1/3;display:grid;place-items:center;width:26px;height:26px;border:1px solid var(--border);border-radius:50%;color:var(--green);font-size:15px}.mode-leased .ownership-state>b,.mode-leased .ownership-state>strong{color:var(--lease)}.ownership-state>strong,.ownership-state>select{color:var(--green);font-size:12px;font-weight:950}.ownership-state>small{color:var(--muted);font-size:6px;font-weight:850}.ownership-date{display:flex;flex-direction:column;justify-content:center;gap:5px;padding:6px 8px}.ownership-date span{color:var(--muted);font-size:5.5px;font-weight:900}.ownership-date strong{font-size:8px}.ownership-date input,.ownership-state select{width:100%;height:21px;border:1px solid var(--border);border-radius:3px;background:#070908;color:#fff;font-size:7px}.fin-contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:6px}.fin-contact{min-height:82px;padding:7px;border:1px solid var(--border);border-radius:6px;background:var(--panel)}.fin-contact>span{display:block;margin-bottom:6px;color:var(--accent);font-size:6px;font-weight:950}.contact-person{display:flex;align-items:center;gap:5px;margin-bottom:3px}.contact-person b{color:var(--green);font-size:10px}.mode-leased .contact-person b{color:var(--lease)}.contact-person strong{font-size:7px}.fin-contact>small,.fin-contact>i{display:block;margin:4px 0;color:var(--muted);font-size:5.5px;font-style:normal}.fin-contact>i{color:var(--green);font-weight:900}.mode-leased .fin-contact>i{color:var(--lease)}.contact-edit{display:flex;flex-direction:column;gap:3px}.contact-edit input{height:18px;padding:0 4px;border:1px solid var(--border);border-radius:3px;background:#070908;color:#fff;font-size:6px}.fin-split{display:grid;grid-template-columns:1.35fr .9fr;gap:5px}.fin-list{min-width:0}.fin-row{min-height:24px;display:grid;grid-template-columns:15px minmax(0,1fr) minmax(58px,.85fr) 18px;align-items:center;border-bottom:1px solid var(--soft)}.fin-row:last-child{border-bottom:0}.fin-row-icon{color:#aab0ac;font-size:8px;text-align:center}.fin-row-label{color:#aeb4b0;font-size:5.5px;font-weight:850}.fin-row strong{overflow:hidden;color:#f0f2f0;font-size:6.4px;font-weight:900;text-align:right;text-overflow:ellipsis;white-space:nowrap}.fin-row em{justify-self:end;padding:2px 3px;border:1px solid var(--soft);border-radius:2px;color:#8b928e;font-size:4px;font-style:normal;font-weight:950}.fin-row input,.fin-row textarea{width:100%;min-width:0;border:1px solid var(--border);border-radius:3px;background:#060807;color:#fff;font-size:6px}.fin-row input{height:19px;padding:0 4px}.fin-row textarea{height:46px;padding:4px;resize:vertical}.fin-value-card{padding:6px;border:1px solid var(--border);border-radius:5px;background:var(--panel2)}.fin-value-card>span,.lease-ytd>span{display:block;margin-bottom:7px;color:var(--accent);font-size:6px;font-weight:950}.fin-value-card p{display:flex;justify-content:space-between;gap:6px;margin:0;padding:6px 0;border-bottom:1px solid var(--soft)}.fin-value-card p:last-child{border-bottom:0}.fin-value-card p small{color:var(--muted);font-size:5px}.fin-value-card p strong{font-size:6px;text-align:right}.fin-value-card p.hero{display:block}.fin-value-card p.hero strong{display:block;margin-top:5px;color:var(--green);font-size:10px;text-align:left}.lease-card p.hero strong,.mode-leased .lease-card>span{color:var(--lease)}.fin-value-card hr{border:0;border-top:1px solid var(--border);margin:5px 0}.fin-cost-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 9px}.fin-total{height:26px;display:flex;align-items:center;justify-content:flex-end;gap:16px;padding:0 6px;border-top:1px solid var(--border)}.fin-total span{color:var(--accent);font-size:5.5px;font-weight:950}.fin-total strong{font-size:8px}.fin-summary-grid{display:grid;gap:5px}.fin-summary-grid.three{grid-template-columns:repeat(3,1fr)}.fin-summary-grid.two{grid-template-columns:repeat(2,1fr)}.fin-summary-cell{min-height:56px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;padding:5px;border:1px solid var(--border);border-radius:5px;background:var(--panel2);text-align:center}.fin-summary-cell span{color:var(--muted);font-size:5px;font-weight:850}.fin-summary-cell strong{font-size:10px}.fin-summary-cell small{color:#6f7772;font-size:3.8px;font-weight:900}.fin-summary-cell.tone-positive strong{color:var(--green)}.fin-summary-cell.tone-negative strong,.fin-row.tone-negative strong{color:var(--red)}.fin-summary-cell.tone-lease strong{color:var(--lease)}.fin-triple{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-bottom:6px}.fin-triple .fin-section{margin:0}.fin-triple .fin-section-body{padding:4px}.fin-triple .fin-row{grid-template-columns:minmax(0,1fr) minmax(38px,.8fr) 0}.fin-triple .fin-row-icon,.fin-triple .fin-row em{display:none}.fin-triple .fin-row-label{font-size:4.7px}.fin-triple .fin-row strong{font-size:5.2px}.lease-ytd{padding:6px;border:1px solid var(--border);border-radius:5px;background:var(--panel2)}.lease-ytd>.fin-summary-cell{margin-top:5px}.fin-relationships{display:flex;flex-direction:column}.fin-relationship{min-height:27px;display:grid;grid-template-columns:18px minmax(0,.8fr) minmax(0,1fr) 12px;align-items:center;padding:0 5px;border:0;border-bottom:1px solid var(--soft);background:transparent;color:#ddd;text-align:left}.fin-relationship:last-child{border-bottom:0}.fin-relationship>span{color:#aaa;font-size:9px}.fin-relationship>b{overflow:hidden;color:#aeb4b0;font-size:5.5px;text-overflow:ellipsis;white-space:nowrap}.fin-relationship>strong{overflow:hidden;font-size:5.8px;text-overflow:ellipsis;white-space:nowrap}.fin-relationship>i{color:#49bfff;font-size:12px;font-style:normal;text-align:right}.fin-scroll::-webkit-scrollbar{width:5px}.fin-scroll::-webkit-scrollbar-track{background:#080a09}.fin-scroll::-webkit-scrollbar-thumb{border-radius:5px;background:#333a35}.ixi-aos-location-f3 :global(.ixi-machine-rail){position:absolute!important;left:0!important;right:0!important;bottom:0!important;height:${RAIL}px!important;z-index:120}
      `}</style>
    </div>
  );
}
