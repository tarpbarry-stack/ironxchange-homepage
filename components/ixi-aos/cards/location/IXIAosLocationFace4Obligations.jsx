import { useMemo, useState } from "react";

import IXIMachineRail from "../../../IXIMachineRail";
import IXIAosCardHeaderControls from "../../card-runtime/modules/IXIAosCardHeaderControls";
import {
  createIXILocationFinancialViewModel,
  postIXILocationObligationBill,
  recordIXILocationObligationPayment
} from "../../financial-runtime/IXIAosLocationFinancialRuntime";

const SKINS = [
  { id: "v12", label: "V12" },
  { id: "steel", label: "STEEL" },
  { id: "blueprint", label: "BLUE" },
  { id: "industrial", label: "INDUSTRIAL" }
];

const clean = value => String(value ?? "").trim();
const money = value => `$${Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const dateLabel = value => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return clean(value).toUpperCase();
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(date).toUpperCase();
};

const OWNED_DEMO = [
  ["property-tax","PROPERTY TAX","property tax",37500,"yearly","2026-11-30","paid",false,37500,"owner"],
  ["property-insurance","PROPERTY INSURANCE","insurance",17400,"yearly","2027-01-01","active",false,17400,"owner"],
  ["mortgage-note","MORTGAGE / NOTE","mortgage",28450,"monthly","2026-09-01","auto",true,227600,"owner"],
  ["electric","ELECTRIC","utility",4250,"monthly","2026-08-22","open",false,29750,"owner"],
  ["water-sewer","WATER / SEWER","utility",2130,"monthly","2026-08-28","open",false,16940,"owner"],
  ["natural-gas","NATURAL GAS","utility",2100,"monthly","2026-08-25","open",false,15820,"owner"],
  ["waste","WASTE SERVICE","utility",420,"monthly","2026-09-01","auto",true,2940,"owner"],
  ["internet","INTERNET / PHONE","utility",350,"monthly","2026-08-30","auto",true,2950,"owner"],
  ["security","SECURITY SERVICE","service-contract",375,"monthly","2026-09-15","auto",true,2625,"owner"]
];

const LEASED_DEMO = [
  ["base-rent","BASE RENT","rent",18750,"monthly","2026-09-01","auto",true,168750,"tenant"],
  ["cam-opex","CAM / OPEX","cam",4250,"monthly","2026-09-01","open",false,38250,"tenant"],
  ["tax-pass","PROPERTY TAX PASS-THRU","property tax",2980,"monthly","2026-09-01","open",false,28430,"pass-through"],
  ["insurance-pass","INSURANCE PASS-THRU","insurance",1450,"monthly","2026-09-01","open",false,14500,"pass-through"],
  ["other-nnn","OTHER NNN","nnn",1000,"monthly","2026-09-01","open",false,9600,"pass-through"],
  ["electric-tenant","ELECTRIC (TENANT)","utility",4250,"monthly","2026-08-22","open",false,29750,"tenant"],
  ["water-tenant","WATER / SEWER (TENANT)","utility",2130,"monthly","2026-08-28","open",false,16940,"tenant"],
  ["waste-tenant","WASTE SERVICE (TENANT)","utility",420,"monthly","2026-09-01","auto",true,2940,"tenant"],
  ["internet-tenant","INTERNET / PHONE (TENANT)","utility",350,"monthly","2026-08-30","auto",true,2450,"tenant"]
];

function demoRows(mode) {
  return (mode === "leased" ? LEASED_DEMO : OWNED_DEMO).map(row => ({
    obligationId: row[0], label: row[1], category: row[2], amount: row[3], frequency: row[4], nextDue: row[5], status: row[6], autoPay: row[7], ytdPaid: row[8], responsibleParty: row[9]
  }));
}

function Metric({ label, value, tone = "" }) {
  return <div className={`f4-metric ${tone}`}><span>{label}</span><b>{value}</b></div>;
}

function Section({ title, children, tone = "" }) {
  return <section className={`f4-section ${tone}`}><h3>{title}</h3>{children}</section>;
}

function Status({ value }) {
  const status = clean(value || "open").toLowerCase();
  return <span className={`f4-status s-${status}`}>{status === "auto" ? "AUTO" : status.toUpperCase()}</span>;
}

export const LOCATION_FACE_4_OBLIGATIONS = Object.freeze({
  faceNumber: 4,
  faceId: "location-f4-expenses-obligations",
  label: "EXPENSES & OBLIGATIONS",
  variants: ["owned", "leased"],
  financialSystem: "ixi-financial-v1",
  version: 12
});

export default function IXIAosLocationFace4Obligations({
  object = {},
  ixiState = {},
  financialSnapshot = {},
  demoMode = false,
  onIxiStateChange = null,
  onSaveObject = null,
  onAddObject = null,
  onHideObject = null,
  onDeleteObject = null,
  onOpenConsole = null,
  onFinancialRefresh = null,
  skinId = "v12",
  onSkinChange = null,
  ...rail
}) {
  const objectId = clean(object.objectId || object.id);
  const ownershipMode = clean(object?.fields?.ownershipStatus).toLowerCase() === "leased" ? "leased" : "owned";
  const savedObligations = Array.isArray(ixiState.face4Obligations)
    ? ixiState.face4Obligations
    : Array.isArray(object?.fields?.financialObligations)
      ? object.fields.financialObligations
      : demoMode ? demoRows(ownershipMode) : [];

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(savedObligations);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const skin = clean(ixiState.face4Skin || skinId || "v12");

  const runtimeObject = useMemo(() => ({ ...object, fields: { ...(object.fields || {}), financialObligations: editing ? draft : savedObligations } }), [object, editing, draft, savedObligations]);
  const view = useMemo(() => createIXILocationFinancialViewModel({ object: runtimeObject, financialSnapshot }), [runtimeObject, financialSnapshot]);

  function changeSkin(nextSkin) {
    onIxiStateChange?.(objectId, { face4Skin: nextSkin });
    onSkinChange?.(nextSkin, object);
  }

  function beginEdit() {
    setDraft(savedObligations.map(item => ({ ...item })));
    setEditing(true);
  }

  function cancelEdit() {
    setDraft(savedObligations.map(item => ({ ...item })));
    setEditing(false);
  }

  async function saveEdit() {
    const next = draft.map(item => ({ ...item }));
    onIxiStateChange?.(objectId, { face4Obligations: next });
    await onSaveObject?.({
      objectId,
      object: { ...object, fields: { ...(object.fields || {}), financialObligations: next } },
      fields: { financialObligations: next },
      face: 4
    });
    setEditing(false);
  }

  function patch(index, key, value) {
    setDraft(current => current.map((item, i) => i === index ? { ...item, [key]: value } : item));
  }

  async function runFinancialAction(kind, obligation) {
    if (!view.passportId) {
      setMessage("PASSPORT REQUIRED FOR FINANCIAL POSTING");
      return;
    }
    const id = clean(obligation.obligationId);
    setBusyId(`${kind}:${id}`);
    setMessage("");
    try {
      const result = kind === "pay"
        ? await recordIXILocationObligationPayment({ object, obligation })
        : await postIXILocationObligationBill({ object, obligation });
      setMessage(kind === "pay" ? "PAYMENT RECORDED" : "BILL POSTED");
      onFinancialRefresh?.(result);
    } catch (error) {
      setMessage(clean(error?.message) || "FINANCIAL COMMAND FAILED");
    } finally {
      setBusyId("");
    }
  }

  const next = view.nextObligation;
  const leaseTone = ownershipMode === "leased" ? "lease" : "owned";
  const obligationsTitle = ownershipMode === "leased" ? "LEASE OBLIGATIONS" : "PROPERTY OBLIGATIONS";
  const serviceRows = ownershipMode === "leased"
    ? [
        ["RENT ESCALATION (3.0%)", "MAR 12, 2027"],
        ["RENEWAL NOTICE (180 DAYS)", "NOV 11, 2027"],
        ["LEASE EXPIRATION", "MAR 11, 2028"],
        ["OPTION PERIOD (1 × 5 YRS)", "MAR 12, 2028"],
        ["INSURANCE CERT RENEWAL", "JAN 01, 2027"]
      ]
    : [
        ["HVAC CONTRACT", "$1,250 / QTR"],
        ["LANDSCAPING", "$850 / MO"],
        ["PEST CONTROL", "$180 / MO"],
        ["FIRE INSPECTION", "$650 / YR"],
        ["GATE MAINTENANCE", "$300 / MO"]
      ];

  const responsibilityRows = [
    ["PROPERTY TAX", "TENANT"], ["INSURANCE", "TENANT"], ["CAM / OPEX", "TENANT"], ["UTILITIES", "TENANT"], ["REPAIRS & MAINTENANCE", "TENANT"], ["STRUCTURE / ROOF", "LANDLORD"]
  ];

  return <div className={`f4-obligations skin-${skin} ${leaseTone}`}>
    <header className="f4-header">
      <div className="f4-ident"><span>LOCATIONS &amp; FACILITIES</span><b>{clean(object.displayName) || "YARD NAME"}</b></div>
      {editing ? <div className="f4-save"><button onClick={saveEdit}>SAVE</button><button onClick={cancelEdit}>CANCEL</button></div> : <IXIAosCardHeaderControls canAdd canEdit onAdd={onAddObject} onToggleEdit={beginEdit} onHide={onHideObject} onDelete={onDeleteObject} onOpenConsole={onOpenConsole} skinId={skin} skinOptions={SKINS} onSkinChange={changeSkin}/>} 
    </header>

    <main className="f4-scroll">
      <div className="f4-banner">F4 · EXPENSES &amp; OBLIGATIONS ({ownershipMode.toUpperCase()})</div>
      <div className="f4-control">
        <div className="f4-next"><span>NEXT OBLIGATION</span><strong>{next?.label || "NO OPEN OBLIGATION"}</strong><b>{next ? money(next.amount) : "—"}</b><small>{next ? `DUE ${dateLabel(next.nextDue)}` : "NO DUE DATE"}</small>{next ? <Status value={next.status}/> : null}</div>
        <Metric label="DUE 30 DAYS" value={money(view.due30Days)} />
        <Metric label="OVERDUE" value={money(view.overdue)} tone="danger" />
        <Metric label="YTD PAID" value={money(view.ytdPaid)} />
      </div>

      <Section title={obligationsTitle} tone={leaseTone}>
        <div className="f4-table-head"><span>OBLIGATION</span><span>AMOUNT</span><span>FREQ</span><span>NEXT DUE</span><span>STATUS</span><span>YTD PAID</span></div>
        <div className="f4-table">
          {view.obligations.map((item, index) => <div className="f4-row" key={item.obligationId || index}>
            {editing ? <input value={item.label} onChange={e=>patch(index,"label",e.target.value)}/> : <strong>{item.label}</strong>}
            {editing ? <input type="number" value={item.amount} onChange={e=>patch(index,"amount",e.target.value)}/> : <b>{money(item.amount)}</b>}
            {editing ? <select value={item.frequency} onChange={e=>patch(index,"frequency",e.target.value)}><option>monthly</option><option>quarterly</option><option>yearly</option><option>one-time</option></select> : <span>{item.frequency.toUpperCase()}</span>}
            {editing ? <input type="date" value={item.nextDue?.slice(0,10)||""} onChange={e=>patch(index,"nextDue",e.target.value)}/> : <span>{dateLabel(item.nextDue)}</span>}
            {editing ? <select value={item.status} onChange={e=>patch(index,"status",e.target.value)}><option>open</option><option>scheduled</option><option>auto</option><option>active</option><option>paid</option><option>overdue</option></select> : <Status value={item.status}/>} 
            <b>{money(item.ytdPaid)}</b>
            {!editing ? <div className="f4-row-actions"><button disabled={!!busyId} onClick={()=>runFinancialAction("bill",item)}>{busyId===`bill:${item.obligationId}`?"…":"BILL"}</button><button disabled={!!busyId} onClick={()=>runFinancialAction("pay",item)}>{busyId===`pay:${item.obligationId}`?"…":"PAY"}</button></div> : null}
          </div>)}
        </div>
      </Section>

      <div className="f4-two">
        <Section title={ownershipMode === "leased" ? "LEASE DEADLINES & EVENTS" : "UPCOMING (NEXT 60 DAYS)"} tone={leaseTone}>
          <div className="f4-list">{ownershipMode === "leased" ? serviceRows.map(([a,b])=><div key={a}><span>{a}</span><b>{b}</b></div>) : view.obligations.filter(x=>x.nextDue).slice().sort((a,b)=>new Date(a.nextDue)-new Date(b.nextDue)).slice(0,5).map(x=><div key={x.obligationId}><span>{dateLabel(x.nextDue).replace(/, 2026$/,'')} · {x.label}</span><b>{money(x.amount)}</b></div>)}</div>
          <button className="f4-wide-action">{ownershipMode === "leased" ? "VIEW LEASE CALENDAR" : "VIEW FULL CALENDAR"}<span>›</span></button>
        </Section>
        <Section title={ownershipMode === "leased" ? "TENANT RESPONSIBILITIES" : "SERVICE CONTRACTS"} tone={leaseTone}>
          <div className="f4-list">{(ownershipMode === "leased" ? responsibilityRows : serviceRows).map(([a,b])=><div key={a}><span>{a}</span><b>{b}</b></div>)}</div>
          <button className="f4-wide-action">{ownershipMode === "leased" ? "VIEW RESPONSIBILITY MATRIX" : "MANAGE CONTRACTS"}<span>›</span></button>
        </Section>
      </div>

      <Section title="RELATIONSHIPS & INFRASTRUCTURE" tone={leaseTone}>
        <div className="f4-relations">{(ownershipMode === "leased" ? ["LEASE AGREEMENT","LANDLORD / LESSOR","PROPERTY MANAGER","INSURANCE POLICY","UTILITY ACCOUNTS","SERVICE CONTRACTS"] : ["PROPERTY TAX ACCOUNT","INSURANCE POLICY","LOAN / MORTGAGE","UTILITY ACCOUNTS","SERVICE CONTRACTS","VENDORS / PAYEES"]).map(label=><button key={label}>{label}<b>›</b></button>)}</div>
      </Section>

      <Section title="NOTES" tone={leaseTone}><div className="f4-notes">{ownershipMode === "leased" ? "Triple Net lease. Tenant responsibility is stored by obligation; lease language remains authoritative." : "Recurring property obligations are schedules. Bills and payments post into IXI Financial and are attributed to this Location Passport."}</div></Section>
      {message ? <div className="f4-message">{message}</div> : null}
    </main>

    <IXIMachineRail listing={object} saved={false} boardColor="none" boardOutline={1} machineFace={4} {...rail}/>

    <style jsx global>{`
      .f4-obligations,.f4-obligations *{box-sizing:border-box}.f4-obligations{--bg:#0c0e0e;--panel:#111414;--line:#292d2c;--muted:#8d9490;--text:#f0f1ef;--accent:#ffc400;--good:#87cf15;--bad:#ff3c2e;position:relative;width:298px;height:471px;overflow:hidden;border:1px solid var(--line);border-radius:14px;background:var(--bg);color:var(--text);font-family:Arial,Helvetica,sans-serif;box-shadow:0 16px 32px rgba(0,0,0,.42)}.f4-obligations.lease{--accent:#b875ff}.f4-obligations.skin-steel{--bg:#111416;--panel:#191c1e;--line:#3b4245;--accent:#d9dde0}.f4-obligations.skin-blueprint{--bg:#071119;--panel:#0b1a24;--line:#17435b;--accent:#54c7ff}.f4-obligations.skin-industrial{--bg:#171108;--panel:#21190d;--line:#594321;--accent:#ffc400}.f4-obligations.skin-blueprint.lease{--accent:#9b79ff}.f4-obligations .f4-header{position:absolute;top:0;left:0;right:0;height:43px;padding:7px 10px 4px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;z-index:6}.f4-ident span{display:block;color:#ffc400;font-size:6px;font-weight:950;letter-spacing:.04em}.f4-ident b{display:block;margin-top:4px;font-size:15px;line-height:1}.f4-save{display:flex;gap:4px}.f4-save button{height:23px;border:1px solid var(--line);border-radius:4px;background:#090a0a;color:var(--accent);font-size:6px;font-weight:950}.f4-scroll{position:absolute;top:43px;bottom:19px;left:0;right:0;overflow-y:auto;overflow-x:hidden;padding:5px 6px 10px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.14) transparent}.f4-scroll::-webkit-scrollbar{width:3px}.f4-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,.14);border-radius:99px}.f4-banner{height:18px;display:flex;align-items:center;justify-content:center;margin-bottom:5px;border:1px solid color-mix(in srgb,var(--accent) 45%,transparent);border-radius:4px;background:color-mix(in srgb,var(--accent) 8%,transparent);color:var(--accent);font-size:6px;font-weight:950}.f4-control{display:grid;grid-template-columns:2.4fr repeat(3,.8fr);gap:3px;margin-bottom:5px}.f4-next,.f4-metric{min-width:0;height:57px;border:1px solid var(--line);border-radius:5px;background:linear-gradient(180deg,rgba(255,255,255,.025),transparent);padding:5px}.f4-next{position:relative}.f4-next>span{display:block;color:var(--accent);font-size:5.5px;font-weight:950}.f4-next strong{display:block;margin-top:4px;max-width:125px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:7px}.f4-next>b{display:block;margin-top:2px;color:var(--good);font-size:13px}.lease .f4-next>b{color:var(--accent)}.f4-next small{position:absolute;right:5px;top:20px;color:var(--text);font-size:5px;font-weight:900}.f4-next .f4-status{position:absolute;right:5px;bottom:5px}.f4-metric{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.f4-metric span{font-size:5px;color:var(--muted);font-weight:900}.f4-metric b{margin-top:5px;font-size:10px}.f4-metric.danger b{color:var(--bad)}.f4-section{margin-bottom:5px;border:1px solid var(--line);border-radius:5px;background:var(--panel);overflow:hidden}.f4-section h3{height:19px;margin:0;padding:5px 6px;border-bottom:1px solid var(--line);color:var(--accent);font-size:6px;font-weight:950;letter-spacing:.035em}.f4-table-head,.f4-row{display:grid;grid-template-columns:1.55fr .65fr .55fr .75fr .55fr .65fr;align-items:center;gap:2px}.f4-table-head{height:18px;padding:0 5px;color:var(--muted);font-size:4.5px;font-weight:900}.f4-row{position:relative;min-height:28px;padding:3px 5px;border-top:1px solid rgba(255,255,255,.035);font-size:5.3px}.f4-row>strong,.f4-row>b,.f4-row>span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.f4-row>strong{font-size:5.7px}.f4-row>input,.f4-row>select{width:100%;min-width:0;height:18px;border:1px solid var(--line);background:#080909;color:var(--text);font-size:5px}.f4-status{display:inline-flex;width:max-content;max-width:100%;padding:2px 4px;border:1px solid color-mix(in srgb,var(--accent) 38%,transparent);border-radius:3px;color:var(--accent);font-size:4.6px;font-weight:950}.f4-status.s-paid,.f4-status.s-active,.f4-status.s-auto{color:var(--good);border-color:rgba(135,207,21,.35)}.lease .f4-status.s-auto{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 40%,transparent)}.f4-status.s-overdue{color:var(--bad);border-color:rgba(255,60,46,.35)}.f4-row-actions{position:absolute;right:4px;bottom:2px;display:none;gap:2px}.f4-row:hover .f4-row-actions{display:flex}.f4-row-actions button{height:13px;padding:0 4px;border:1px solid var(--line);border-radius:2px;background:#070808;color:var(--accent);font-size:4px;font-weight:950}.f4-two{display:grid;grid-template-columns:1fr 1fr;gap:4px}.f4-list{padding:4px 6px}.f4-list>div{min-height:21px;display:flex;align-items:center;justify-content:space-between;gap:4px;border-bottom:1px solid rgba(255,255,255,.035);font-size:5.2px}.f4-list>div span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.f4-list>div b{white-space:nowrap}.f4-wide-action{width:calc(100% - 8px);height:22px;margin:0 4px 4px;border:1px solid var(--line);border-radius:3px;background:#0a0b0b;color:var(--text);font-size:5px;font-weight:950}.f4-wide-action span{float:right;color:var(--accent);font-size:10px}.f4-relations{display:grid;grid-template-columns:repeat(3,1fr);gap:3px;padding:4px}.f4-relations button{min-width:0;height:37px;padding:4px;border:1px solid var(--line);border-radius:3px;background:#0b0c0c;color:var(--text);font-size:4.5px;font-weight:900;text-align:left}.f4-relations button b{float:right;color:var(--accent);font-size:9px}.f4-notes{padding:7px;font-size:5.4px;line-height:1.35;color:var(--muted)}.f4-message{margin:5px 0;padding:6px;border:1px solid color-mix(in srgb,var(--accent) 35%,transparent);border-radius:4px;color:var(--accent);font-size:5px;font-weight:950;text-align:center}
    `}</style>
  </div>;
}
