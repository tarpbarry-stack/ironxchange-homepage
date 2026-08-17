import { useMemo, useState } from "react";

import IXIObjectRail from "../../../ixi-object-system/IXIObjectRail";
import IXIAosCardHeaderControls from "../../card-runtime/modules/IXIAosCardHeaderControls";
import {
  clean,
  getObjectRelationships
} from "../../card-runtime/IXIAosSemanticObjectPresentation";

const W = 298;
const H = 471;
const RAIL = 19;
const HEADER = 43;

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function asNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function money(value) {
  const n = asNumber(value);
  if (n === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(n);
}

function percent(value) {
  const n = asNumber(value);
  if (n === null) return "—";
  return `${n.toFixed(n % 1 ? 2 : 0)}%`;
}

function read(fields, financial, key, aliases = []) {
  const roots = [
    safeObject(financial),
    safeObject(financial?.financial),
    safeObject(financial?.summary),
    safeObject(financial?.metrics),
    safeObject(financial?.property),
    safeObject(financial?.lease),
    safeObject(financial?.operating),
    safeObject(financial?.tax),
    safeObject(financial?.budget),
    fields
  ];
  for (const root of roots) {
    for (const candidate of [key, ...aliases]) {
      const value = root?.[candidate];
      if (value !== undefined && value !== null && value !== "") return value;
    }
  }
  return "";
}

function Section({ title, children, tone = "" }) {
  return (
    <section className={`f3-section ${tone ? `tone-${tone}` : ""}`}>
      <h3>{title}</h3>
      <div className="f3-section-body">{children}</div>
    </section>
  );
}

function Row({ icon = "•", label, value, editing, onChange, type = "text", derived = false }) {
  const formatted = type === "money" ? money(value) : type === "percent" ? percent(value) : (clean(value) || "—");
  return (
    <div className="f3-row">
      <span className="f3-row-icon">{icon}</span>
      <span className="f3-row-label">{label}</span>
      {editing && !derived ? (
        <input value={value ?? ""} onChange={event => onChange?.(event.target.value)} />
      ) : (
        <strong>{formatted}</strong>
      )}
      {derived ? <em title="TRAN$ACT derived">TX</em> : null}
    </div>
  );
}

function Contact({ title, prefix, fields, editing, patch }) {
  const name = fields[`${prefix}Name`] ?? fields[prefix] ?? "";
  const role = fields[`${prefix}Role`] ?? "";
  const phone = fields[`${prefix}Phone`] ?? "";
  const email = fields[`${prefix}Email`] ?? "";
  return (
    <div className="f3-contact">
      <h4>{title}</h4>
      {editing ? (
        <div className="f3-contact-edit">
          <input value={name} placeholder="NAME" onChange={event => patch(`${prefix}Name`, event.target.value)} />
          <input value={role} placeholder="ROLE" onChange={event => patch(`${prefix}Role`, event.target.value)} />
          <input value={phone} placeholder="PHONE" onChange={event => patch(`${prefix}Phone`, event.target.value)} />
          <input value={email} placeholder="EMAIL" onChange={event => patch(`${prefix}Email`, event.target.value)} />
        </div>
      ) : (
        <>
          <strong>● {clean(name) || "—"}</strong>
          {role ? <span>{role}</span> : null}
          {phone ? <b>{phone}</b> : null}
          {email ? <small>{email}</small> : null}
        </>
      )}
    </div>
  );
}

function Summary({ label, value, type = "money", tone = "" }) {
  return (
    <div className={`f3-summary ${tone ? `tone-${tone}` : ""}`}>
      <span>{label}</span>
      <strong>{type === "percent" ? percent(value) : type === "text" ? (clean(value) || "—") : money(value)}</strong>
      <small>TRAN$ACT</small>
    </div>
  );
}

function Relationship({ relationship = {} }) {
  const label = clean(relationship?.displayLabel || relationship?.label || relationship?.type) || "RELATIONSHIP";
  const value = clean(relationship?.displayName || relationship?.value || relationship?.targetDisplayName || relationship?.secondary) || "OPEN";
  return (
    <button type="button" className="f3-relationship">
      <span>▣</span><b>{label}</b><strong>{value}</strong><i>›</i>
    </button>
  );
}

export default function IXIAosLocationFace3V12({
  mode = "owned",
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
  const leased = mode === "leased";
  const objectId = clean(object?.objectId || object?.id);
  const persisted = safeObject(object?.fields);
  const saved = safeObject(ixiState?.face3SavedFields);
  const sourceFields = Object.keys(saved).length ? saved : persisted;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(() => ({ ...sourceFields }));
  const fields = editing ? draft : sourceFields;
  const financial = financialSnapshot && typeof financialSnapshot === "object" ? financialSnapshot : runtimeData;
  const relationships = getObjectRelationships(object);
  const displayName = clean(object?.displayName || object?.name) || "YARD NAME";

  function patch(key, value) {
    setDraft(current => ({ ...current, [key]: value }));
  }

  function beginEdit() {
    setDraft({ ...sourceFields });
    setEditing(true);
  }

  async function saveEdit() {
    if (saving) return;
    setSaving(true);
    try {
      const nextFields = { ...persisted, ...draft, ownershipStatus: leased ? "LEASED" : "OWNED" };
      onIxiStateChange?.(objectId, { face3SavedFields: nextFields, editingFace3: false });
      await onSaveObject?.({ objectId, object: { ...object, fields: nextFields }, fields: nextFields, face: 3 });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function editRow(key, label, icon = "•") {
    return <Row icon={icon} label={label} value={fields[key]} editing={editing} onChange={value => patch(key, value)} />;
  }

  function txRow(key, label, aliases = [], icon = "•", type = "money") {
    return <Row icon={icon} label={label} value={read(fields, financial, key, aliases)} type={type} derived />;
  }

  const monthlyOperating = useMemo(() => {
    const direct = asNumber(read(fields, financial, "totalMonthlyOperatingCost", ["monthlyOperatingCost", "monthlyExpenses"]));
    if (direct !== null) return direct;
    return ["electricCost","waterCost","sewerCost","naturalGasCost","internetPhoneCost","wasteTrashCost","propertyTaxCost","insuranceCost","otherOperatingCost"]
      .reduce((sum, key) => sum + (asNumber(read(fields, financial, key)) || 0), 0);
  }, [fields, financial]);

  const monthlyOccupancy = useMemo(() => {
    const direct = asNumber(read(fields, financial, "totalMonthlyOccupancyCost", ["monthlyOccupancyCost"]));
    if (direct !== null) return direct;
    return ["baseRentMonthly","camOpexMonthly","propertyTaxPassThrough","insurancePassThrough","otherNnnMonthly"]
      .reduce((sum, key) => sum + (asNumber(read(fields, financial, key)) || 0), 0);
  }, [fields, financial]);

  const ownerPrefix = leased ? "landlord" : "propertyOwner";
  const managerPrefix = leased ? "leasingContact" : "propertyManager";

  function command(event, callback) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    callback?.(object);
  }

  return (
    <article className={`ixi-location-f3-v12 mode-${mode}`}>
      <header className="f3-head">
        <div className="f3-identity">
          <span>LOCATIONS & FACILITIES</span>
          <strong>{displayName}</strong>
        </div>
        {editing ? (
          <nav className="f3-save-actions">
            <button type="button" disabled={saving} onClick={saveEdit}>SAVE</button>
            <button type="button" disabled={saving} onClick={() => { setDraft({ ...sourceFields }); setEditing(false); }}>CANCEL</button>
          </nav>
        ) : (
          <IXIAosCardHeaderControls
            canAdd
            canEdit
            canTransact
            onAdd={() => onAddObject?.(object)}
            onToggleEdit={beginEdit}
            onTransact={() => onOpenTransact?.(object)}
            onHide={onHideObject}
            onDelete={onDeleteObject}
            onOpenConsole={onOpenConsole}
            skinId="v12"
          />
        )}
      </header>

      <main className="f3-scroll">
        <Section title="OWNERSHIP STATUS" tone={leased ? "lease" : "owned"}>
          <div className="f3-status-banner">
            <div className="f3-status-main">
              <b>{leased ? "⚿" : "▣"}</b>
              <div><strong>{leased ? "LEASED" : "OWNED"}</strong><small>{clean(fields.ownershipType) || (leased ? "OPERATING LEASE" : "FEE SIMPLE")}</small></div>
            </div>
            <div className="f3-status-date">
              <span>{leased ? "LEASE START" : "ACQUIRED"}</span>
              {editing ? <input value={leased ? (fields.leaseStartDate ?? "") : (fields.acquiredDate ?? "")} onChange={event => patch(leased ? "leaseStartDate" : "acquiredDate", event.target.value)} /> : <strong>{clean(leased ? fields.leaseStartDate : fields.acquiredDate) || "—"}</strong>}
            </div>
          </div>
        </Section>

        <div className="f3-contact-grid">
          <Contact title={leased ? "LANDLORD / LESSOR" : "PROPERTY OWNER"} prefix={ownerPrefix} fields={fields} editing={editing} patch={patch} />
          <Contact title={leased ? "PROPERTY MANAGER / LEASING CONTACT" : "PROPERTY MANAGER"} prefix={managerPrefix} fields={fields} editing={editing} patch={patch} />
        </div>

        {!leased ? (
          <>
            <Section title="PROPERTY OVERVIEW">
              <div className="f3-split">
                <div className="f3-list">
                  {editRow("propertyType", "PROPERTY TYPE", "◈")}
                  {editRow("parcelAssetId", "PARCEL / ASSET ID", "◇")}
                  {editRow("propertyAddress", "ADDRESS", "⌂")}
                  {editRow("landArea", "LAND AREA", "▰")}
                  {editRow("buildingArea", "BUILDING AREA", "▦")}
                  {editRow("yearBuilt", "YEAR BUILT", "□")}
                  {editRow("zoning", "ZONING", "♜")}
                  {editRow("taxId", "TAX ID", "#")}
                </div>
                <div className="f3-value-card">
                  <h4>PROPERTY VALUE</h4>
                  <p><span>LAND VALUE</span><strong>{money(read(fields, financial, "landValue"))}</strong></p>
                  <p><span>IMPROVEMENT VALUE</span><strong>{money(read(fields, financial, "improvementValue"))}</strong></p>
                  <hr />
                  <p className="hero"><span>TOTAL APPRAISED VALUE</span><strong>{money(read(fields, financial, "totalAppraisedValue", ["appraisedValue"]))}</strong></p>
                  <p><span>CURRENT VALUE</span><strong>{money(read(fields, financial, "currentValue"))}</strong></p>
                  <p><span>LAST APPRAISED</span><strong>{clean(read(fields, financial, "lastAppraised")) || "—"}</strong></p>
                </div>
              </div>
            </Section>

            <Section title="OPERATING COSTS (MONTHLY)">
              <div className="f3-cost-grid">
                {txRow("electricCost", "ELECTRIC", [], "ϟ")}
                {txRow("wasteTrashCost", "WASTE / TRASH", [], "▥")}
                {txRow("waterCost", "WATER", [], "◉")}
                {txRow("propertyTaxCost", "PROPERTY TAX", ["taxCost"], "◈")}
                {txRow("sewerCost", "SEWER", [], "♜")}
                {txRow("insuranceCost", "INSURANCE", [], "◈")}
                {txRow("naturalGasCost", "NATURAL GAS", [], "♨")}
                {txRow("otherOperatingCost", "OTHER COSTS", [], "◇")}
                {txRow("internetPhoneCost", "INTERNET / PHONE", [], "◉")}
              </div>
              <div className="f3-total"><span>TOTAL MONTHLY COSTS</span><strong>{money(monthlyOperating)}</strong></div>
            </Section>

            <Section title="ANNUAL SUMMARY (YTD)">
              <div className="f3-summary-grid three">
                <Summary label="TOTAL REVENUE (YTD)" value={read(fields, financial, "totalRevenueYtd", ["revenueYtd"])} tone="positive" />
                <Summary label="TOTAL EXPENSES (YTD)" value={read(fields, financial, "totalExpensesYtd", ["expensesYtd"])} tone="negative" />
                <Summary label="NET INCOME (YTD)" value={read(fields, financial, "netIncomeYtd")} tone="positive" />
              </div>
            </Section>

            <div className="f3-three-sections">
              <Section title="FINANCIAL RATIOS">
                {txRow("capRate", "CAP RATE", [], "", "percent")}
                {txRow("roiYtd", "ROI (YTD)", [], "", "percent")}
                {txRow("occupancy", "OCCUPANCY", [], "", "percent")}
                {txRow("grossMargin", "GROSS MARGIN", [], "", "percent")}
              </Section>
              <Section title="BUDGET OVERVIEW">
                {txRow("annualBudget", "ANNUAL BUDGET")}
                {txRow("ytdBudget", "YTD BUDGET")}
                {txRow("ytdActual", "YTD ACTUAL", ["totalExpensesYtd"])}
                {txRow("budgetVariance", "VARIANCE")}
              </Section>
              <Section title="TAX INFORMATION">
                {editRow("taxAuthority", "TAX AUTHORITY")}
                {editRow("taxYear", "TAX YEAR")}
                {editRow("assessedValue", "ASSESSED VALUE")}
                {editRow("taxRate", "TAX RATE")}
              </Section>
            </div>
          </>
        ) : (
          <>
            <Section title="LEASE OVERVIEW">
              <div className="f3-split">
                <div className="f3-list">
                  {editRow("leaseType", "LEASE TYPE", "◉")}
                  {editRow("leaseStartDate", "LEASE START DATE", "□")}
                  {editRow("leaseEndDate", "LEASE END DATE", "□")}
                  {editRow("renewalOption", "RENEWAL OPTION", "♜")}
                  {editRow("noticeRequired", "NOTICE REQUIRED", "□")}
                  {editRow("securityDeposit", "SECURITY DEPOSIT", "◈")}
                  {editRow("leaseUse", "USE", "▣")}
                </div>
                <div className="f3-value-card lease-card">
                  <h4>LEASE SUMMARY</h4>
                  <p><span>MONTHLY BASE RENT</span><strong>{money(read(fields, financial, "baseRentMonthly"))}</strong></p>
                  <p><span>ANNUAL BASE RENT</span><strong>{money(read(fields, financial, "baseRentAnnual"))}</strong></p>
                  <p><span>RENT ESCALATION</span><strong>{percent(read(fields, financial, "rentEscalation"))}</strong></p>
                  <p><span>ESCALATION TYPE</span><strong>{clean(read(fields, financial, "escalationType")) || "—"}</strong></p>
                  <p><span>NEXT ESCALATION</span><strong>{clean(read(fields, financial, "nextEscalation")) || "—"}</strong></p>
                </div>
              </div>
            </Section>

            <Section title="LEASE TERMS & COST STRUCTURE" tone="lease">
              <div className="f3-split">
                <div className="f3-list">
                  {txRow("baseRentMonthly", "BASE RENT (MONTHLY)", [], "▦")}
                  {txRow("camOpexMonthly", "CAM / OPEX (MONTHLY)", [], "◈")}
                  {txRow("propertyTaxPassThrough", "PROPERTY TAX (PASS-THRU)", [], "◈")}
                  {txRow("insurancePassThrough", "INSURANCE (PASS-THRU)", [], "◈")}
                  {txRow("otherNnnMonthly", "OTHER NNN (MONTHLY)", [], "♜")}
                  <div className="f3-total lease"><span>TOTAL MONTHLY OCCUPANCY COST</span><strong>{money(monthlyOccupancy)}</strong></div>
                </div>
                <div className="f3-lease-ytd">
                  <h4>LEASE COST SUMMARY (YTD)</h4>
                  <div className="f3-summary-grid two">
                    <Summary label="TOTAL RENT (YTD)" value={read(fields, financial, "totalRentYtd")} tone="lease" />
                    <Summary label="TOTAL PASS-THROUGH (YTD)" value={read(fields, financial, "totalPassThroughYtd")} tone="lease" />
                  </div>
                  <Summary label="TOTAL OCCUPANCY COST (YTD)" value={read(fields, financial, "totalOccupancyCostYtd")} tone="lease" />
                </div>
              </div>
            </Section>

            <Section title="OPERATING EXPENSES (MONTHLY)">
              <div className="f3-cost-grid">
                {txRow("electricCost", "ELECTRIC", [], "ϟ")}
                {txRow("internetPhoneCost", "INTERNET / PHONE", [], "◉")}
                {txRow("waterCost", "WATER", [], "◉")}
                {txRow("wasteTrashCost", "WASTE / TRASH", [], "▥")}
                {txRow("sewerCost", "SEWER", [], "♜")}
                {txRow("otherOperatingCost", "OTHER EXPENSES", [], "◇")}
                {txRow("naturalGasCost", "NATURAL GAS", [], "♨")}
              </div>
              <div className="f3-total lease"><span>TOTAL MONTHLY EXPENSES</span><strong>{money(monthlyOperating)}</strong></div>
            </Section>
          </>
        )}

        <Section title="NOTES">
          <div className="f3-notes">
            {editing ? <textarea value={fields.financialNotes ?? ""} onChange={event => patch("financialNotes", event.target.value)} /> : <strong>{clean(fields.financialNotes) || (leased ? "Lease terms, obligations and operating notes." : "Property financial and operating notes.")}</strong>}
          </div>
        </Section>

        <Section title="RELATIONSHIPS & INFRASTRUCTURE">
          <div className="f3-relationship-list">
            {relationships.length ? relationships.map((relationship, index) => <Relationship key={clean(relationship?.id || relationship?.relationshipId) || index} relationship={relationship} />) : (
              leased ? (
                <>
                  <Relationship relationship={{ label: "LEASE AGREEMENT", value: "LEASE RECORD" }} />
                  <Relationship relationship={{ label: "INSURANCE POLICY", value: "POLICY RECORD" }} />
                  <Relationship relationship={{ label: "UTILITY ACCOUNTS", value: "ACCOUNTS" }} />
                  <Relationship relationship={{ label: "LANDLORD CONTACT", value: "CONTACT" }} />
                  <Relationship relationship={{ label: "RENEWAL REMINDER", value: "REMINDER" }} />
                </>
              ) : (
                <>
                  <Relationship relationship={{ label: "BUDGET", value: "CURRENT FY" }} />
                  <Relationship relationship={{ label: "INSURANCE", value: "POLICY" }} />
                  <Relationship relationship={{ label: "TAX RECORD", value: "CURRENT YEAR" }} />
                  <Relationship relationship={{ label: "UTILITY ACCOUNTS", value: "ACCOUNTS" }} />
                  <Relationship relationship={{ label: "MAINTENANCE PLAN", value: "ACTIVE" }} />
                </>
              )
            )}
          </div>
        </Section>
      </main>

      <nav className="f3-commands">
        <button type="button" onClick={event => command(event, onRecall)}>↻ <span>RECALL</span></button>
        <button type="button" onClick={event => command(event, onBoard)}>▦ <span>BOARD</span></button>
        <button type="button" onClick={event => command(event, onReturn)}>↩ <span>RETURN</span></button>
      </nav>

      <IXIObjectRail
        object={object}
        saved={false}
        color={ixiState?.color || "none"}
        outline={Number(ixiState?.outline ?? 1)}
        face={3}
        onSendFront={onSendFront}
        onSendBack={onSendBack}
        onCycleColor={onCycleColor}
        onCycleOutline={onCycleOutline}
        armedDestination={armedDestination}
        onSendToArmedDestination={onSendToArmedDestination}
      />

      <style jsx global>{`
        .ixi-location-f3-v12,.ixi-location-f3-v12 *{box-sizing:border-box;font-family:Arial,Helvetica,sans-serif}
        .ixi-location-f3-v12{--y:#ffc400;--line:#343a35;--soft:#252a26;--text:#f4f5f4;--muted:#969d98;--lease:#a86cff;position:relative;width:${W}px;height:${H}px;overflow:hidden;border:1px solid #454b47;border-radius:13px;background:linear-gradient(180deg,#101310,#080a09);color:var(--text);box-shadow:inset 0 1px #ffffff12,0 18px 40px #0008;font-size:7px;line-height:1.15}
        .ixi-location-f3-v12 .f3-head{position:absolute;inset:0 0 auto;height:${HEADER}px;padding:7px 10px;border-bottom:1px solid #303531;background:linear-gradient(180deg,#171a18,#101210);z-index:40}
        .ixi-location-f3-v12 .f3-identity{width:185px}.ixi-location-f3-v12 .f3-identity>span{display:block;color:var(--y);font-size:6px;font-weight:950;letter-spacing:.08em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ixi-location-f3-v12 .f3-identity>strong{display:block;margin-top:4px;color:#f6f7f6;font-size:14px;font-weight:950;line-height:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .ixi-location-f3-v12 .f3-save-actions{position:absolute;top:9px;right:8px;display:flex;height:20px}.ixi-location-f3-v12 .f3-save-actions button{height:20px;padding:0 7px;border:0;border-left:1px solid #ffffff0e;background:transparent;color:#dfe3df;font-size:6px;font-weight:950;cursor:pointer}.ixi-location-f3-v12 .f3-save-actions button:first-child{color:var(--y)}
        .ixi-location-f3-v12 .f3-scroll{position:absolute;top:${HEADER}px;left:7px;right:7px;bottom:51px;padding:5px 0 8px;overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:#3d4540 #090b0a}
        .ixi-location-f3-v12 .f3-scroll::-webkit-scrollbar{width:5px;height:5px}.ixi-location-f3-v12 .f3-scroll::-webkit-scrollbar-track{background:#090b0a}.ixi-location-f3-v12 .f3-scroll::-webkit-scrollbar-thumb{background:#3d4540;border:1px solid #151916;border-radius:999px}.ixi-location-f3-v12 .f3-scroll::-webkit-scrollbar-thumb:hover{background:#555f58}.ixi-location-f3-v12 .f3-scroll::-webkit-scrollbar-corner{background:#090b0a}
        .ixi-location-f3-v12 .f3-section{margin:0 0 5px;overflow:hidden;border:1px solid var(--line);border-radius:5px;background:#101310}.ixi-location-f3-v12 .f3-section>h3{height:19px;margin:0;display:flex;align-items:center;padding:0 7px;border-bottom:1px solid var(--soft);background:#151916;color:var(--y);font-size:6px;font-weight:950;letter-spacing:.02em}.ixi-location-f3-v12 .f3-section.tone-lease>h3{color:var(--lease)}.ixi-location-f3-v12 .f3-section-body{background:#0d100e}
        .ixi-location-f3-v12 .f3-status-banner{min-height:58px;display:grid;grid-template-columns:1.12fr .88fr;align-items:center}.ixi-location-f3-v12 .f3-status-main{height:100%;display:grid;grid-template-columns:37px 1fr;align-items:center;padding:6px 8px;border-right:1px solid var(--soft)}.ixi-location-f3-v12 .f3-status-main>b{width:30px;height:30px;display:grid;place-items:center;border:1px solid #4c554f;border-radius:50%;color:#82ca19;font-size:17px}.ixi-location-f3-v12.mode-leased .f3-status-main>b{color:var(--lease)}.ixi-location-f3-v12 .f3-status-main strong{display:block;color:#82ca19;font-size:13px;font-weight:950}.ixi-location-f3-v12.mode-leased .f3-status-main strong{color:var(--lease)}.ixi-location-f3-v12 .f3-status-main small{display:block;margin-top:3px;color:#a8afaa;font-size:6px;font-weight:900}.ixi-location-f3-v12 .f3-status-date{padding:6px 8px}.ixi-location-f3-v12 .f3-status-date span{display:block;color:#a1a7a3;font-size:5px;font-weight:900}.ixi-location-f3-v12 .f3-status-date strong{display:block;margin-top:5px;font-size:8px}.ixi-location-f3-v12 input,.ixi-location-f3-v12 textarea{width:100%;min-width:0;border:1px solid #414844;border-radius:3px;background:#070908;color:#fff;outline:none;font-size:6px;font-weight:800}.ixi-location-f3-v12 input{height:19px;padding:0 4px}.ixi-location-f3-v12 textarea{min-height:50px;padding:5px;resize:vertical}.ixi-location-f3-v12 input:focus,.ixi-location-f3-v12 textarea:focus{border-color:var(--y)}
        .ixi-location-f3-v12 .f3-contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:5px}.ixi-location-f3-v12 .f3-contact{min-height:82px;padding:7px;border:1px solid var(--line);border-radius:5px;background:#101310;overflow:hidden}.ixi-location-f3-v12 .f3-contact h4,.ixi-location-f3-v12 .f3-value-card h4,.ixi-location-f3-v12 .f3-lease-ytd h4{margin:0 0 7px;color:var(--y);font-size:6px;font-weight:950}.ixi-location-f3-v12.mode-leased .f3-contact h4,.ixi-location-f3-v12.mode-leased .f3-lease-ytd h4{color:var(--lease)}.ixi-location-f3-v12 .f3-contact>strong{display:block;font-size:7px;line-height:1.25}.ixi-location-f3-v12 .f3-contact>span,.ixi-location-f3-v12 .f3-contact>small{display:block;margin-top:4px;color:#c1c6c2;font-size:5.5px}.ixi-location-f3-v12 .f3-contact>b{display:block;margin-top:5px;color:#82ca19;font-size:6px}.ixi-location-f3-v12.mode-leased .f3-contact>b{color:var(--lease)}.ixi-location-f3-v12 .f3-contact-edit{display:grid;gap:3px}
        .ixi-location-f3-v12 .f3-split{display:grid;grid-template-columns:1.42fr .92fr;gap:5px;padding:5px}.ixi-location-f3-v12 .f3-list{min-width:0;border:1px solid var(--soft);border-radius:4px;overflow:hidden}.ixi-location-f3-v12 .f3-row{min-height:22px;display:grid;grid-template-columns:16px minmax(70px,.95fr) minmax(0,1fr) 16px;align-items:center;gap:3px;padding:2px 4px;border-bottom:1px solid var(--soft)}.ixi-location-f3-v12 .f3-row:last-child{border-bottom:0}.ixi-location-f3-v12 .f3-row-icon{color:#a6ada8;text-align:center;font-size:8px}.ixi-location-f3-v12 .f3-row-label{color:#a6ada8;font-size:5.5px;font-weight:850;line-height:1.1}.ixi-location-f3-v12 .f3-row strong{min-width:0;color:#eef1ef;font-size:6px;font-weight:900;line-height:1.15;word-break:break-word}.ixi-location-f3-v12 .f3-row em{color:#747d77;font-size:4.5px;font-style:normal;font-weight:950;text-align:center}
        .ixi-location-f3-v12 .f3-value-card{padding:7px;border:1px solid var(--line);border-radius:4px;background:#111411}.ixi-location-f3-v12 .f3-value-card p{margin:0;min-height:25px;display:flex;align-items:center;justify-content:space-between;gap:5px;border-bottom:1px solid var(--soft)}.ixi-location-f3-v12 .f3-value-card p:last-child{border-bottom:0}.ixi-location-f3-v12 .f3-value-card span{color:#a6ada8;font-size:5px}.ixi-location-f3-v12 .f3-value-card strong{font-size:6px;text-align:right}.ixi-location-f3-v12 .f3-value-card hr{border:0;border-top:1px solid #3a413c}.ixi-location-f3-v12 .f3-value-card .hero{display:block;padding:5px 0}.ixi-location-f3-v12 .f3-value-card .hero span,.ixi-location-f3-v12 .f3-value-card .hero strong{display:block}.ixi-location-f3-v12 .f3-value-card .hero strong{margin-top:4px;color:#82ca19;font-size:11px;text-align:left}.ixi-location-f3-v12 .lease-card h4{color:var(--lease)}
        .ixi-location-f3-v12 .f3-cost-grid{display:grid;grid-template-columns:1fr 1fr;padding:4px}.ixi-location-f3-v12 .f3-cost-grid .f3-row:nth-child(odd){border-right:1px solid var(--soft)}.ixi-location-f3-v12 .f3-total{height:26px;display:flex;align-items:center;justify-content:flex-end;gap:12px;padding:0 8px;border-top:1px solid var(--soft)}.ixi-location-f3-v12 .f3-total span{color:var(--y);font-size:5.5px;font-weight:950}.ixi-location-f3-v12 .f3-total strong{font-size:9px}.ixi-location-f3-v12 .f3-total.lease span{color:var(--lease)}
        .ixi-location-f3-v12 .f3-summary-grid{display:grid;gap:5px;padding:5px}.ixi-location-f3-v12 .f3-summary-grid.three{grid-template-columns:repeat(3,1fr)}.ixi-location-f3-v12 .f3-summary-grid.two{grid-template-columns:repeat(2,1fr)}.ixi-location-f3-v12 .f3-summary{min-height:52px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:5px;border:1px solid var(--line);border-radius:4px;background:#111411;text-align:center}.ixi-location-f3-v12 .f3-summary span{color:#a6ada8;font-size:5px;font-weight:850}.ixi-location-f3-v12 .f3-summary strong{font-size:10px}.ixi-location-f3-v12 .f3-summary small{color:#606863;font-size:4px;font-weight:950}.ixi-location-f3-v12 .f3-summary.tone-positive strong{color:#82ca19}.ixi-location-f3-v12 .f3-summary.tone-negative strong{color:#ff5c4f}.ixi-location-f3-v12 .f3-summary.tone-lease strong{color:var(--lease)}
        .ixi-location-f3-v12 .f3-three-sections{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.ixi-location-f3-v12 .f3-three-sections .f3-row{grid-template-columns:minmax(0,1fr) minmax(0,.8fr) 12px}.ixi-location-f3-v12 .f3-three-sections .f3-row-icon{display:none}.ixi-location-f3-v12 .f3-three-sections .f3-row-label{padding-left:3px}.ixi-location-f3-v12 .f3-three-sections .f3-row strong{text-align:right}
        .ixi-location-f3-v12 .f3-lease-ytd{padding:7px;border:1px solid var(--line);border-radius:4px;background:#111411}.ixi-location-f3-v12 .f3-lease-ytd>.f3-summary{margin:0 5px 5px}
        .ixi-location-f3-v12 .f3-notes{padding:7px}.ixi-location-f3-v12 .f3-notes strong{display:block;min-height:38px;color:#d5d9d6;font-size:6px;line-height:1.45}
        .ixi-location-f3-v12 .f3-relationship-list{display:flex;flex-direction:column}.ixi-location-f3-v12 .f3-relationship{width:100%;min-height:23px;display:grid;grid-template-columns:17px minmax(72px,.75fr) minmax(0,1fr) 10px;align-items:center;gap:4px;padding:2px 5px;border:0;border-bottom:1px solid var(--soft);background:transparent;color:#edf0ee;text-align:left;cursor:pointer}.ixi-location-f3-v12 .f3-relationship:last-child{border-bottom:0}.ixi-location-f3-v12 .f3-relationship>span{color:#9fa7a1;text-align:center}.ixi-location-f3-v12 .f3-relationship>b{color:#a6ada8;font-size:5.5px}.ixi-location-f3-v12 .f3-relationship>strong{overflow:hidden;font-size:6px;text-overflow:ellipsis;white-space:nowrap}.ixi-location-f3-v12 .f3-relationship>i{color:#62c8ff;font-size:12px;font-style:normal}
        .ixi-location-f3-v12 .f3-commands{position:absolute;left:7px;right:7px;bottom:19px;height:27px;display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding-top:4px;border-top:1px solid #282e2a;background:#090b0a;z-index:35}.ixi-location-f3-v12 .f3-commands button{border:1px solid #343a35;border-radius:4px;background:#101310;color:#e5e8e6;font-size:6px;font-weight:950;cursor:pointer}.ixi-location-f3-v12 .f3-commands button:hover{border-color:#59635c;color:var(--y)}.ixi-location-f3-v12 .f3-commands span{margin-left:3px}
      `}</style>
    </article>
  );
}
