import { useState } from "react";

import IXIMachineRail from "../../../IXIMachineRail";
import IXIAosCardHeaderControls from "../../card-runtime/modules/IXIAosCardHeaderControls";

const SKINS = [
  { id: "stock", label: "STOCK CERTIFICATE" },
  { id: "bond", label: "BOND CERTIFICATE" },
  { id: "modern-money", label: "MODERN MONEY" },
  { id: "old-currency", label: "OLD CURRENCY" }
];

const clean = value => String(value ?? "").trim();
const money = value => `$${Number(value || 0).toLocaleString()}`;

function Section({ title, children }) {
  return (
    <section className="f3-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, value, editing, onChange }) {
  return (
    <label className="f3-row">
      <span>{label}</span>
      {editing && onChange ? (
        <input value={value ?? ""} onChange={event => onChange(event.target.value)} />
      ) : (
        <b>{clean(value) || "—"}</b>
      )}
    </label>
  );
}

function MoneyRow(props) {
  return <Row {...props} value={props.editing ? props.value : money(props.value)} />;
}

export const LOCATION_FACE_3_FINANCIAL = Object.freeze({
  faceNumber: 3,
  faceId: "location-f3-financial",
  label: "FINANCIAL INFORMATION",
  variants: ["owned", "leased"],
  skinIds: SKINS.map(item => item.id),
  version: 12
});

export default function IXIAosLocationFace3Financial({
  object = {},
  ixiState = {},
  onIxiStateChange = null,
  onSaveObject = null,
  onAddObject = null,
  onHideObject = null,
  onDeleteObject = null,
  onOpenConsole = null,
  skinId = "stock",
  onSkinChange = null,
  ...rail
}) {
  const objectId = clean(object.objectId || object.id);
  const savedFields =
    ixiState.face3SavedFields && typeof ixiState.face3SavedFields === "object"
      ? ixiState.face3SavedFields
      : object.fields || {};

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ ...savedFields });
  const [saving, setSaving] = useState(false);

  const fields = editing ? draft : savedFields;
  const leased = clean(fields.ownershipStatus).toLowerCase() === "leased";
  const skin = clean(ixiState.face3Skin) || clean(skinId) || "stock";

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
      onIxiStateChange?.(objectId, { face3SavedFields: { ...draft } });
      await onSaveObject?.({
        objectId,
        object: {
          ...object,
          fields: { ...(object.fields || {}), ...draft }
        },
        fields: { ...draft },
        face: 3
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function changeSkin(nextSkin) {
    if (!nextSkin) return;
    onIxiStateChange?.(objectId, { face3Skin: nextSkin });
    onSkinChange?.(nextSkin, object);
  }

  const monthlyCost = leased
    ? Number(fields.baseRentMonthly || 18750) +
      Number(fields.camMonthly || 4250) +
      Number(fields.propertyTaxMonthly || 2980) +
      Number(fields.insuranceMonthly || 1450)
    : Number(fields.electric || 4250) +
      Number(fields.water || 1150) +
      Number(fields.sewer || 980) +
      Number(fields.naturalGas || 2100) +
      Number(fields.propertyTaxMonthly || 2980) +
      Number(fields.insuranceMonthly || 1450);

  return (
    <div className={`f3-financial skin-${skin}`}>
      <div className="currency-ornament" aria-hidden="true" />

      <header className="f3-header">
        <div className="f3-ident">
          <span>LOCATIONS &amp; FACILITIES</span>
          <b>{clean(object.displayName) || "YARD NAME"}</b>
        </div>

        {editing ? (
          <div className="f3-save-actions">
            <button type="button" disabled={saving} onClick={saveEdit}>SAVE</button>
            <button type="button" disabled={saving} onClick={cancelEdit}>CANCEL</button>
          </div>
        ) : (
          <IXIAosCardHeaderControls
            canAdd
            canEdit
            onAdd={onAddObject}
            onToggleEdit={beginEdit}
            onHide={onHideObject}
            onDelete={onDeleteObject}
            onOpenConsole={onOpenConsole}
            skinId={skin}
            skinOptions={SKINS}
            onSkinChange={changeSkin}
          />
        )}
      </header>

      <main className="f3-scroll">
        <div className="face-banner">F3 · FINANCIAL INFORMATION ({leased ? "LEASED" : "OWNED"})</div>

        <div className={`ownership ${leased ? "lease" : "owned"}`}>
          <div className="ownership-seal">{leased ? "◆" : "⌂"}</div>
          <div className="ownership-copy">
            <span>OWNERSHIP STATUS</span>
            <b>{leased ? "LEASED" : "OWNED"}</b>
            <small>{leased ? fields.leaseType || "OPERATING LEASE" : fields.ownershipType || "FEE SIMPLE"}</small>
          </div>
          <div className="ownership-date">
            <span>{leased ? "LEASE START" : "ACQUIRED"}</span>
            <b>{leased ? fields.leaseStartDate || "MAR 12, 2023" : fields.acquiredDate || "MAR 12, 2018"}</b>
          </div>
        </div>

        <div className="f3-columns">
          <Section title={leased ? "LANDLORD / LESSOR" : "PROPERTY OWNER"}>
            <Row
              label="ENTITY"
              value={leased ? fields.landlord || "DFW INDUSTRIAL HOLDINGS LLC" : fields.propertyOwner || "IRONXCHANGE HOLDINGS LLC"}
              editing={editing}
              onChange={value => patch(leased ? "landlord" : "propertyOwner", value)}
            />
            <Row
              label="CONTACT"
              value={leased ? fields.landlordContact || "JOHN MILLER" : fields.ownerContact || "JOHN CARTER"}
              editing={editing}
              onChange={value => patch(leased ? "landlordContact" : "ownerContact", value)}
            />
            <Row
              label="PHONE"
              value={leased ? fields.landlordPhone || "214-555-0186" : fields.ownerPhone || "432-555-0186"}
              editing={editing}
              onChange={value => patch(leased ? "landlordPhone" : "ownerPhone", value)}
            />
          </Section>

          <Section title="PROPERTY MANAGER">
            <Row label="NAME" value={fields.propertyManager || "JOHN CARTER"} editing={editing} onChange={value => patch("propertyManager", value)} />
            <Row label="PHONE" value={fields.managerPhone || "432-555-0186"} editing={editing} onChange={value => patch("managerPhone", value)} />
            <Row label="EMAIL" value={fields.managerEmail || "yard@ironxchange.com"} editing={editing} onChange={value => patch("managerEmail", value)} />
          </Section>
        </div>

        {leased ? (
          <>
            <Section title="LEASE OVERVIEW">
              <div className="f3-columns inner">
                <div>
                  <Row label="LEASE TYPE" value={fields.leaseType || "NNN (TRIPLE NET)"} editing={editing} onChange={value => patch("leaseType", value)} />
                  <Row label="LEASE START" value={fields.leaseStartDate || "MAR 12, 2023"} editing={editing} onChange={value => patch("leaseStartDate", value)} />
                  <Row label="LEASE END" value={fields.leaseEndDate || "MAR 11, 2028"} editing={editing} onChange={value => patch("leaseEndDate", value)} />
                </div>
                <div>
                  <MoneyRow label="BASE RENT" value={fields.baseRentMonthly || 18750} editing={editing} onChange={value => patch("baseRentMonthly", value)} />
                  <Row label="ESCALATION" value={fields.rentEscalation || "3.00%"} editing={editing} onChange={value => patch("rentEscalation", value)} />
                  <Row label="RENEWAL" value={fields.renewalOption || "1–5 YR OPTION"} editing={editing} onChange={value => patch("renewalOption", value)} />
                </div>
              </div>
            </Section>

            <Section title="LEASE TERMS & COST STRUCTURE">
              <MoneyRow label="BASE RENT" value={fields.baseRentMonthly || 18750} editing={editing} onChange={value => patch("baseRentMonthly", value)} />
              <MoneyRow label="CAM / OPEX" value={fields.camMonthly || 4250} editing={editing} onChange={value => patch("camMonthly", value)} />
              <MoneyRow label="PROPERTY TAX" value={fields.propertyTaxMonthly || 2980} editing={editing} onChange={value => patch("propertyTaxMonthly", value)} />
              <MoneyRow label="INSURANCE" value={fields.insuranceMonthly || 1450} editing={editing} onChange={value => patch("insuranceMonthly", value)} />
              <div className="f3-total">TOTAL MONTHLY OCCUPANCY <b>{money(monthlyCost)}</b></div>
            </Section>
          </>
        ) : (
          <>
            <Section title="PROPERTY VALUE SUMMARY">
              <div className="value-summary">
                <div className="big-value">
                  <span>TOTAL APPRAISED VALUE</span>
                  <b>{money(fields.currentValue || 8750000)}</b>
                </div>
                <div>
                  <MoneyRow label="LAND VALUE" value={fields.landValue || 2750000} editing={editing} onChange={value => patch("landValue", value)} />
                  <MoneyRow label="IMPROVEMENT VALUE" value={fields.improvementValue || 6000000} editing={editing} onChange={value => patch("improvementValue", value)} />
                  <MoneyRow label="CURRENT VALUE" value={fields.currentValue || 8750000} editing={editing} onChange={value => patch("currentValue", value)} />
                  <Row label="LAST APPRAISED" value={fields.lastAppraised || "AUG 12, 2024"} editing={editing} onChange={value => patch("lastAppraised", value)} />
                </div>
              </div>
            </Section>

            <Section title="OPERATING COSTS (MONTHLY)">
              <div className="f3-columns inner">
                <div>
                  <MoneyRow label="ELECTRIC" value={fields.electric || 4250} editing={editing} onChange={value => patch("electric", value)} />
                  <MoneyRow label="WATER" value={fields.water || 1150} editing={editing} onChange={value => patch("water", value)} />
                  <MoneyRow label="SEWER" value={fields.sewer || 980} editing={editing} onChange={value => patch("sewer", value)} />
                  <MoneyRow label="NATURAL GAS" value={fields.naturalGas || 2100} editing={editing} onChange={value => patch("naturalGas", value)} />
                </div>
                <div>
                  <MoneyRow label="PROPERTY TAX" value={fields.propertyTaxMonthly || 2980} editing={editing} onChange={value => patch("propertyTaxMonthly", value)} />
                  <MoneyRow label="INSURANCE" value={fields.insuranceMonthly || 1450} editing={editing} onChange={value => patch("insuranceMonthly", value)} />
                  <MoneyRow label="OTHER COSTS" value={fields.otherMonthlyCosts || 450} editing={editing} onChange={value => patch("otherMonthlyCosts", value)} />
                </div>
              </div>
              <div className="f3-total">TOTAL MONTHLY COSTS <b>{money(monthlyCost)}</b></div>
            </Section>

            <Section title="ANNUAL SUMMARY (YTD)">
              <div className="summary-grid">
                <b>{money(fields.revenueYtd || 2130450)}<small>TOTAL REVENUE</small></b>
                <b className="expense">{money(fields.expensesYtd || 1073200)}<small>TOTAL EXPENSES</small></b>
                <b>{money(fields.netIncomeYtd || 1057250)}<small>NET INCOME</small></b>
              </div>
            </Section>

            <div className="triple-grid">
              <Section title="FINANCIAL RATIOS">
                <Row label="CAP RATE" value={fields.capRate || "7.65%"} />
                <Row label="ROI (YTD)" value={fields.roiYtd || "12.42%"} />
                <Row label="OCCUPANCY" value={fields.occupancy || "78%"} />
                <Row label="GROSS MARGIN" value={fields.grossMargin || "49.6%"} />
              </Section>
              <Section title="BUDGET OVERVIEW">
                <MoneyRow label="ANNUAL BUDGET" value={fields.annualBudget || 2450000} />
                <MoneyRow label="YTD BUDGET" value={fields.ytdBudget || 1225000} />
                <MoneyRow label="YTD ACTUAL" value={fields.expensesYtd || 1073200} />
                <MoneyRow label="VARIANCE" value={fields.budgetVariance || -151800} />
              </Section>
              <Section title="TAX INFORMATION">
                <Row label="TAX AUTHORITY" value={fields.taxAuthority || "DALLAS COUNTY"} />
                <Row label="TAX YEAR" value={fields.taxYear || "2025"} />
                <MoneyRow label="ASSESSED VALUE" value={fields.assessedValue || 8750000} />
                <Row label="TAX RATE" value={fields.taxRate || "2.135%"} />
              </Section>
            </div>
          </>
        )}

        <Section title="NOTES">
          <div className="notes">
            {editing ? (
              <textarea value={fields.financialNotes || ""} onChange={event => patch("financialNotes", event.target.value)} />
            ) : (
              clean(fields.financialNotes) ||
              (leased
                ? "Triple Net lease. Tenant responsible for utilities, insurance and property tax."
                : "Primary yard for DFW region. All values shown are operational AOS financial data.")
            )}
          </div>
        </Section>

        <Section title="RELATIONSHIPS & INFRASTRUCTURE">
          <div className="relationship-grid">
            {(leased
              ? ["LEASE AGREEMENT", "INSURANCE POLICY", "UTILITY ACCOUNTS", "LANDLORD CONTACT", "RENEWAL REMINDER"]
              : ["BUDGET", "INSURANCE", "TAX RECORD", "UTILITY ACCOUNTS", "MAINTENANCE PLAN"]
            ).map(label => (
              <button type="button" key={label}>{label}<b>›</b></button>
            ))}
          </div>
        </Section>
      </main>

      <IXIMachineRail
        listing={object}
        saved={false}
        boardColor="none"
        boardOutline={1}
        machineFace={3}
        {...rail}
      />

      <style jsx global>{`
        .f3-financial,.f3-financial *{box-sizing:border-box}.f3-financial{--paper:#eef0df;--paper2:#e6ead3;--ink:#153b22;--ink-soft:rgba(21,59,34,.58);--accent:#214f2e;--line:rgba(21,59,34,.28);--line-soft:rgba(21,59,34,.14);--panel:rgba(255,255,255,.22);--money:#214f2e;--negative:#a83a2f;position:relative;width:298px;height:471px;overflow:hidden;border:1px solid var(--ink);border-radius:8px;background:var(--paper);color:var(--ink);font-family:Georgia,"Times New Roman",serif;box-shadow:0 18px 34px rgba(0,0,0,.28)}
        .f3-financial::before,.f3-financial::after{content:"";position:absolute;pointer-events:none;z-index:1}.f3-financial::before{inset:3px;border:1px double var(--line);border-radius:6px}.f3-financial::after{inset:7px;border:1px solid var(--line-soft);border-radius:4px}
        .f3-financial .currency-ornament{position:absolute;inset:0;pointer-events:none;z-index:0;background-image:repeating-radial-gradient(ellipse at 10% 10%,transparent 0 6px,var(--line-soft) 6.5px 7px,transparent 7.5px 13px),repeating-radial-gradient(ellipse at 90% 90%,transparent 0 7px,var(--line-soft) 7.5px 8px,transparent 8.5px 14px),repeating-linear-gradient(45deg,transparent 0 8px,var(--line-soft) 8.5px 9px,transparent 9.5px 17px);opacity:.25}
        .f3-financial.skin-stock{--paper:#eef0df;--paper2:#e2e8cf;--ink:#173e25;--accent:#285b35;--line:rgba(23,62,37,.30);--line-soft:rgba(23,62,37,.13);--money:#2b6339;background:radial-gradient(circle at 20% 0%,rgba(255,255,255,.75),transparent 34%),linear-gradient(180deg,#f4f3df,#e9ecd7 52%,#dde5cb)}
        .f3-financial.skin-bond{--paper:#edf0ea;--paper2:#e2e8e8;--ink:#163c70;--accent:#1e4d85;--line:rgba(22,60,112,.30);--line-soft:rgba(22,60,112,.13);--money:#163c70;background:radial-gradient(circle at 80% 5%,rgba(255,255,255,.78),transparent 32%),linear-gradient(180deg,#f4f5ec,#e8eeee 55%,#dce6e8)}
        .f3-financial.skin-modern-money{--paper:#eef1df;--paper2:#e7ead6;--ink:#314b25;--accent:#416332;--line:rgba(49,75,37,.24);--line-soft:rgba(49,75,37,.11);--money:#294a25;border-radius:9px;background:radial-gradient(circle at 50% 16%,rgba(255,255,255,.88),transparent 34%),linear-gradient(180deg,#f7f5e8,#edf1dd 60%,#e1e7d2)}
        .f3-financial.skin-old-currency{--paper:#d8c08a;--paper2:#c9ae72;--ink:#4c3515;--accent:#655023;--line:rgba(76,53,21,.36);--line-soft:rgba(76,53,21,.17);--money:#5a421c;background:radial-gradient(circle at 18% 10%,rgba(255,246,202,.35),transparent 24%),radial-gradient(circle at 90% 70%,rgba(104,67,20,.12),transparent 38%),linear-gradient(180deg,#dfc997,#d1b779 55%,#c3a667)}
        .f3-financial.skin-old-currency .currency-ornament{opacity:.42;filter:sepia(.4)}
        .f3-financial.skin-modern-money .currency-ornament{opacity:.13}.f3-financial.skin-bond .currency-ornament{opacity:.22}
        .f3-financial .f3-header{position:absolute;inset:0 0 auto;height:43px;padding:7px 12px 4px;display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid var(--line);background:linear-gradient(180deg,rgba(255,255,255,.28),rgba(255,255,255,.05));z-index:6}.f3-financial .f3-ident span{display:block;color:var(--accent);font:900 6px Arial,sans-serif;letter-spacing:.05em}.f3-financial .f3-ident b{display:block;margin-top:4px;font-size:15px;line-height:1}.f3-financial .f3-save-actions{display:flex;gap:4px}.f3-financial .f3-save-actions button{height:24px;padding:0 7px;border:1px solid var(--line);border-radius:3px;background:rgba(255,255,255,.32);color:var(--ink);font:900 6px Arial,sans-serif}
        .f3-financial .f3-scroll{position:absolute;top:43px;bottom:19px;left:0;right:0;overflow-y:auto;overflow-x:hidden;padding:5px 7px 11px;z-index:3;scrollbar-width:thin;scrollbar-color:var(--line) transparent}.f3-financial .f3-scroll::-webkit-scrollbar{width:3px}.f3-financial .f3-scroll::-webkit-scrollbar-thumb{background:var(--line);border-radius:9px}
        .f3-financial .face-banner{height:17px;margin:0 0 5px;display:flex;align-items:center;justify-content:center;border:1px solid var(--line);background:linear-gradient(180deg,var(--accent),color-mix(in srgb,var(--accent) 72%,#000));color:#f6f1dc;font:900 6px Arial,sans-serif;letter-spacing:.05em;clip-path:polygon(3% 0,97% 0,100% 50%,97% 100%,3% 100%,0 50%)}
        .f3-financial.skin-old-currency .face-banner{color:#f4e6bd}.f3-financial .ownership,.f3-financial .f3-section{position:relative;border:1px solid var(--line);border-radius:4px;background:linear-gradient(180deg,rgba(255,255,255,.30),rgba(255,255,255,.12));margin-bottom:5px;overflow:hidden}.f3-financial .ownership{min-height:54px;display:grid;grid-template-columns:40px 1fr 86px;align-items:center;padding:5px 7px}.f3-financial .ownership-seal{width:34px;height:34px;display:flex;align-items:center;justify-content:center;border:2px double var(--accent);border-radius:50%;font-size:17px}.f3-financial .ownership-copy span,.f3-financial .ownership-date span{display:block;color:var(--ink-soft);font:900 5px Arial,sans-serif}.f3-financial .ownership-copy b{display:block;margin:2px 0;color:var(--money);font-size:14px}.f3-financial .ownership-copy small{display:block;color:var(--accent);font:900 6px Arial,sans-serif}.f3-financial .ownership-date{padding-left:7px;border-left:1px solid var(--line)}.f3-financial .ownership-date b{display:block;margin-top:4px;font:900 7px Arial,sans-serif}.f3-financial .ownership.lease .ownership-copy b{color:#6840a1}
        .f3-financial .f3-columns{display:grid;grid-template-columns:1fr 1fr;gap:4px}.f3-financial .f3-columns.inner{padding:3px}.f3-financial .f3-section>h3{height:18px;margin:0;padding:5px 6px;border-bottom:1px solid var(--line);background:linear-gradient(180deg,rgba(255,255,255,.22),rgba(0,0,0,.02));color:var(--accent);font:900 6px Arial,sans-serif;letter-spacing:.04em}.f3-financial .f3-section>div:not(.value-summary):not(.summary-grid):not(.triple-grid){padding:3px}.f3-financial .f3-row{min-height:22px;display:grid;grid-template-columns:1fr 1.25fr;align-items:center;gap:2px;padding:0 4px;border-bottom:1px solid var(--line-soft)}.f3-financial .f3-row:last-child{border-bottom:0}.f3-financial .f3-row span{color:var(--ink-soft);font:900 5px Arial,sans-serif}.f3-financial .f3-row b{min-width:0;overflow:hidden;color:var(--ink);font:900 6px Arial,sans-serif;text-overflow:ellipsis}.f3-financial input,.f3-financial textarea{width:100%;border:1px solid var(--line);border-radius:2px;background:rgba(255,255,255,.46);color:var(--ink);font:800 6px Arial,sans-serif;outline:none}.f3-financial input{height:17px;padding:0 3px}.f3-financial textarea{min-height:34px;padding:4px;resize:vertical}
        .f3-financial .value-summary{display:grid;grid-template-columns:1fr 1.25fr;gap:4px;padding:4px}.f3-financial .big-value{position:relative;min-height:77px;display:flex;flex-direction:column;justify-content:center;padding:7px;border:1px solid var(--line);background:radial-gradient(circle at 50% 55%,rgba(255,255,255,.46),transparent 68%);text-align:center}.f3-financial .big-value::before{content:"";position:absolute;inset:4px;border:1px solid var(--line-soft);border-radius:50% 25%}.f3-financial .big-value span{position:relative;color:var(--ink-soft);font:900 5px Arial,sans-serif}.f3-financial .big-value b{position:relative;margin-top:7px;color:var(--money);font-size:16px}.f3-financial .f3-total{padding:6px!important;text-align:right;color:var(--accent);font:900 6px Arial,sans-serif}.f3-financial .f3-total b{margin-left:8px;color:var(--money);font-size:9px}.f3-financial .summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:3px;padding:4px}.f3-financial .summary-grid>b{padding:7px 2px;border:1px solid var(--line);background:rgba(255,255,255,.18);color:var(--money);font-size:8px;text-align:center}.f3-financial .summary-grid>b.expense{color:var(--negative)}.f3-financial .summary-grid small{display:block;margin-top:3px;color:var(--ink-soft);font:900 5px Arial,sans-serif}.f3-financial .triple-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:3px;margin-bottom:5px}.f3-financial .triple-grid .f3-section{margin-bottom:0}.f3-financial .triple-grid .f3-row{grid-template-columns:1.08fr 1fr;min-height:20px;padding:0 3px}.f3-financial .triple-grid .f3-row span{font-size:4.5px}.f3-financial .triple-grid .f3-row b{font-size:5px}
        .f3-financial .notes{padding:7px!important;font:italic 6px/1.35 Georgia,serif}.f3-financial .relationship-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:3px;padding:4px!important}.f3-financial .relationship-grid button{min-width:0;height:35px;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;padding:3px;border:1px solid var(--line);border-radius:3px;background:rgba(255,255,255,.16);color:var(--ink);font:900 4.8px Arial,sans-serif;text-align:left}.f3-financial .relationship-grid button b{align-self:flex-end;color:var(--accent);font-size:9px}
        .f3-financial.skin-stock .f3-section>h3,.f3-financial.skin-stock .face-banner{box-shadow:inset 0 1px rgba(255,255,255,.25)}.f3-financial.skin-bond .f3-section>h3{background:linear-gradient(180deg,rgba(35,79,132,.12),rgba(255,255,255,.12))}.f3-financial.skin-modern-money .f3-section{border-radius:6px}.f3-financial.skin-modern-money::before{border-style:solid}.f3-financial.skin-old-currency .f3-section>h3{background:linear-gradient(180deg,rgba(86,63,24,.18),rgba(255,255,255,.05))}.f3-financial.skin-old-currency .f3-row b,.f3-financial.skin-old-currency .relationship-grid button{font-family:Georgia,"Times New Roman",serif}
      `}</style>
    </div>
  );
}
