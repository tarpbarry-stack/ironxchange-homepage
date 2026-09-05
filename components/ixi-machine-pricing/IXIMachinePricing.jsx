import { useEffect, useMemo, useState } from "react";

import { getIXITransactRecordIndex } from "../ixi-aos/transact/IXITransactRecordIndex";
import { getIXIMachineCostBasis } from "../ixi-aos/transact/IXIMachineCostBasisEngine";
import {
  IXI_PRICING_SCENARIOS,
  calculateIXIMachinePricing,
  normalizeIXIMachinePricingFile,
  restoreIXIMachinePricingRevision,
  saveIXIMachinePricingRevision
} from "./IXIMachinePricingEngine";

const clean = value => String(value ?? "").trim();
const money = value => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
}).format(Number(value) || 0);
const pct = value => `${Number(value || 0).toFixed(1)}%`;
const today = () => new Date().toISOString().slice(0, 10);
const uid = prefix => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;

function sourceObject(object = {}) {
  return object?.listing || object?.source || object;
}

function subjectDefaults(object = {}, context = {}) {
  const source = sourceObject(object);
  const attributes = source?.attributes || {};
  const publicData = attributes.publicData || source.publicData || {};
  const fields = source.fields || {};
  const label = clean(context?.primary?.label || source.displayName || source.title);
  const match = label.match(/^(\d{4})\s+([^\s]+)\s+(.+)$/);
  const rawPrice = source.price ?? publicData.price ?? fields.price ?? attributes.price;
  const currentAsk = rawPrice && typeof rawPrice === "object"
    ? Number(rawPrice.amount || 0) / 100
    : Number(rawPrice || 0);
  return {
    year: Number(publicData.year || fields.year || match?.[1] || 0),
    make: clean(publicData.make || fields.make || match?.[2]),
    model: clean(publicData.model || fields.model || match?.[3]),
    hours: Number(publicData.hours || fields.hours || source.hours || 0),
    configuration: clean(publicData.configuration || fields.configuration || publicData.description),
    location: clean(publicData.location || fields.location || source.location || context?.location?.label),
    currentAsk
  };
}

function Field({ label, children, wide = false }) {
  return <label className={wide ? "wide" : ""}><span>{label}</span>{children}</label>;
}

function NumberInput({ value, onChange, step = "1" }) {
  return <input type="number" inputMode="decimal" step={step} value={value || ""} onChange={event => onChange(Number(event.target.value || 0))} />;
}

function blankComparable(kind, subject = {}) {
  return {
    id: uid(kind === "sold" ? "sold" : "active"),
    source: kind === "sold" ? "Ritchie Bros." : "Sandhills",
    year: Number(subject.year || 0),
    make: clean(subject.make),
    model: clean(subject.model),
    hours: 0,
    price: 0,
    location: "",
    url: "",
    capturedAt: today(),
    saleDate: kind === "sold" ? today() : "",
    buyerPremium: "unknown",
    currency: "USD",
    quality: "usable",
    notes: "",
    included: true
  };
}

const EDITOR_SECTIONS = Object.freeze([
  { id: "subject", label: "SUBJECT", note: "MACHINE FACTS" },
  { id: "active", label: "ACTIVE MARKET", note: "FOR-SALE COMPS" },
  { id: "sold", label: "SOLD RESULTS", note: "AUCTION COMPS" },
  { id: "adjustments", label: "ADJUSTMENTS", note: "MACHINE DIFFERENCES" },
  { id: "costs", label: "SALES COSTS", note: "NET EXIT COST" },
  { id: "scenarios", label: "SCENARIOS", note: "MOVE · MARKET · HOLD" },
  { id: "history", label: "HISTORY", note: "SAVED REVISIONS" }
]);

export default function IXIMachinePricing({
  context = {},
  object = {},
  financialRecords = [],
  pricingFile = null,
  onPricingFileChange = null,
  onClose = null
}) {
  const defaults = useMemo(() => ({
    subject: subjectDefaults(object, context),
    actor: context.actor || {}
  }), [object, context]);
  const investedCost = useMemo(() => {
    const index = getIXITransactRecordIndex(financialRecords);
    return getIXIMachineCostBasis(index).totalInvested;
  }, [financialRecords]);
  const normalized = useMemo(
    () => normalizeIXIMachinePricingFile(pricingFile || {}, defaults),
    [pricingFile, defaults]
  );
  const [draft, setDraft] = useState(normalized);
  const [editing, setEditing] = useState(false);
  const [section, setSection] = useState("");
  const [comparableId, setComparableId] = useState("");
  const [previewScenarioId, setPreviewScenarioId] = useState(normalized.selectedScenario);

  useEffect(() => {
    setDraft(normalized);
    setPreviewScenarioId(normalized.selectedScenario);
  }, [normalized]);

  const projection = useMemo(
    () => calculateIXIMachinePricing(draft, { investedCost }),
    [draft, investedCost]
  );
  const displayedScenario = projection.scenarios.find(item => item.id === previewScenarioId) || projection.selected;

  function beginEdit(target = "") {
    setEditing(true);
    setSection(target);
    setComparableId("");
  }

  function cancelEdit() {
    setDraft(normalized);
    setEditing(false);
    setSection("");
    setComparableId("");
  }

  function saveModel() {
    const currentProjection = calculateIXIMachinePricing(draft, { investedCost });
    const saved = saveIXIMachinePricingRevision(draft, currentProjection, context.actor || {});
    onPricingFileChange?.(saved);
    setDraft(saved);
    setPreviewScenarioId(saved.selectedScenario);
    setEditing(false);
    setSection("");
    setComparableId("");
  }

  function navigateBack() {
    if (comparableId) setComparableId("");
    else if (section) setSection("");
    else if (editing) cancelEdit();
    else onClose?.();
  }

  function updateGroup(group, key, value) {
    setDraft(current => ({
      ...current,
      [group]: { ...current[group], [key]: value }
    }));
  }

  function updateComparable(kind, id, patch) {
    const key = kind === "sold" ? "soldComparables" : "activeComparables";
    setDraft(current => ({
      ...current,
      [key]: current[key].map(item => item.id === id ? { ...item, ...patch } : item)
    }));
  }

  function addComparable(kind) {
    const key = kind === "sold" ? "soldComparables" : "activeComparables";
    const next = blankComparable(kind, draft.subject);
    setDraft(current => ({ ...current, [key]: [...current[key], next] }));
    setSection(kind);
    setComparableId(next.id);
  }

  function removeComparable(kind, id) {
    const key = kind === "sold" ? "soldComparables" : "activeComparables";
    setDraft(current => ({ ...current, [key]: current[key].filter(item => item.id !== id) }));
    setComparableId("");
  }

  function restoreRevision(revision) {
    setDraft(current => restoreIXIMachinePricingRevision(current, revision));
    setSection("");
  }

  const title = editing
    ? comparableId ? "COMPARABLE" : section ? EDITOR_SECTIONS.find(item => item.id === section)?.label : "PRICING FILE"
    : "PRICING";

  return (
    <div className="machine-pricing">
      <header>
        <div className="heading">
          <span>IXI MACHINE · F$3</span>
          <strong>{title}</strong>
          <small>{clean(context?.primary?.label) || "AOS OBJECT"}</small>
        </div>
        {editing ? (
          <div className="edit-actions">
            <button type="button" className="edit-back" onClick={navigateBack} aria-label="Back">‹</button>
            <button type="button" onClick={cancelEdit}>CANCEL</button>
            <button type="button" className="save" onClick={saveModel}>SAVE</button>
          </div>
        ) : (
          <button type="button" className="back" onClick={navigateBack} aria-label="Back">‹</button>
        )}
      </header>

      <main>
        {!editing ? (
          <Summary
            projection={projection}
            displayedScenario={displayedScenario}
            previewScenarioId={previewScenarioId}
            setPreviewScenarioId={setPreviewScenarioId}
            onEdit={beginEdit}
          />
        ) : comparableId ? (
          <ComparableEditor
            kind={section}
            comparable={(section === "sold" ? draft.soldComparables : draft.activeComparables).find(item => item.id === comparableId)}
            onChange={patch => updateComparable(section, comparableId, patch)}
            onDelete={() => removeComparable(section, comparableId)}
          />
        ) : section ? (
          <SectionEditor
            section={section}
            draft={draft}
            projection={projection}
            setDraft={setDraft}
            updateGroup={updateGroup}
            onAddComparable={addComparable}
            onOpenComparable={setComparableId}
            onRestore={restoreRevision}
          />
        ) : (
          <PricingDirectory draft={draft} projection={projection} onOpen={setSection} setDraft={setDraft} />
        )}
      </main>

      <style jsx>{`
        .machine-pricing,.machine-pricing *{box-sizing:border-box}.machine-pricing{position:relative;width:298px;height:471px;overflow:hidden;border:1px solid rgba(255,196,0,.32);border-radius:14px;background:linear-gradient(180deg,rgba(255,196,0,.05),transparent 31%),#0b0c0c;color:#f4f4f4;font-family:Inter,Arial,sans-serif;box-shadow:0 18px 34px rgba(0,0,0,.42)}
        header{height:61px;padding:9px 10px 8px;border-bottom:1px solid rgba(255,255,255,.09);display:flex;align-items:flex-start;justify-content:space-between;gap:6px}.heading{min-width:0}.heading span{display:block;color:#ffc400;font-size:8px;font-weight:900;letter-spacing:.075em}.heading strong{display:block;max-width:145px;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:15px;line-height:1.08;font-weight:900}.heading small{display:block;max-width:145px;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#858b88;font-size:7px;font-weight:800;text-transform:uppercase}.back{width:30px;height:30px;margin:0;border:1px solid rgba(255,255,255,.14);border-radius:7px;background:#111313;color:#ffc400;font-size:21px;font-weight:900;cursor:pointer}.edit-actions{display:flex;gap:3px}.edit-actions button{height:28px;padding:0 6px;border:1px solid rgba(255,255,255,.13);border-radius:5px;background:#101212;color:#aaa;font-size:6px;font-weight:950;cursor:pointer}.edit-actions .edit-back{width:25px;padding:0;color:#ffc400;font-size:17px}.edit-actions .save{border-color:#ffc400;background:#ffc400;color:#0a0b0a}
        main{position:absolute;inset:61px 0 9px;overflow-x:hidden;overflow-y:auto;padding:9px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.18) transparent}
        :global(.pricing-section-title){margin:0 1px 7px;color:#ffc400;font-size:8px;font-weight:950;letter-spacing:.06em}
        :global(.pricing-form-grid){display:grid;grid-template-columns:1fr 1fr;gap:7px}
        :global(.pricing-form-grid label){display:block;min-width:0}:global(.pricing-form-grid label.wide){grid-column:1/-1}:global(.pricing-form-grid label>span){display:block;margin:0 0 4px;color:#919793;font-size:6px;font-weight:900;letter-spacing:.04em}
        :global(.pricing-form-grid input),:global(.pricing-form-grid select),:global(.pricing-form-grid textarea){width:100%;height:29px;padding:5px 6px;border:1px solid rgba(255,255,255,.12);border-radius:5px;background:#0c0e0d;color:#f3f3f3;font:800 8px/1.2 Inter,Arial,sans-serif;outline:none}:global(.pricing-form-grid textarea){height:55px;resize:vertical}:global(.pricing-form-grid input:focus),:global(.pricing-form-grid select:focus),:global(.pricing-form-grid textarea:focus){border-color:rgba(255,196,0,.65);box-shadow:0 0 0 1px rgba(255,196,0,.08)}
        :global(.pricing-list){border:1px solid rgba(255,255,255,.09);border-radius:8px;overflow:hidden}:global(.pricing-list>button){position:relative;width:100%;min-height:48px;padding:8px 28px 8px 9px;border:0;border-bottom:1px solid rgba(255,255,255,.07);background:#0e1110;color:#f2f2f2;text-align:left;cursor:pointer}:global(.pricing-list>button:last-child){border-bottom:0}:global(.pricing-list>button:hover),:global(.pricing-list>button:focus-visible){outline:none;background:#151918}:global(.pricing-list strong){display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:9px;font-weight:950}:global(.pricing-list span){display:block;margin-top:4px;color:#969c99;font-size:7px;font-weight:800}:global(.pricing-list b){position:absolute;right:9px;top:16px;color:#ffc400;font-size:15px}
        :global(.source-link){display:flex;height:25px;margin-top:5px;border:1px solid rgba(255,196,0,.3);border-radius:4px;background:rgba(255,196,0,.035);color:#ffc400;align-items:center;justify-content:center;font-size:6px;font-weight:950;text-decoration:none}:global(.pricing-add){width:100%;height:34px;margin-top:7px;border:1px solid rgba(255,196,0,.35);border-radius:6px;background:rgba(255,196,0,.04);color:#ffc400;font-size:7px;font-weight:950;cursor:pointer}:global(.pricing-delete){width:100%;height:32px;margin-top:8px;border:1px solid rgba(255,85,85,.28);border-radius:6px;background:rgba(255,85,85,.035);color:#ff7373;font-size:7px;font-weight:950;cursor:pointer}
      `}</style>
    </div>
  );
}

function Summary({ projection, displayedScenario, previewScenarioId, setPreviewScenarioId, onEdit }) {
  return <>
    <section className="price-hero">
      <span>{displayedScenario.label} ASK</span>
      <strong>{money(displayedScenario.askingPrice)}</strong>
      <small>EST. CLOSE {money(displayedScenario.expectedClose)} · {displayedScenario.saleDays}</small>
    </section>
    <div className="scenario-tabs">
      {projection.scenarios.map(item => <button type="button" key={item.id} className={previewScenarioId === item.id ? "on" : ""} onClick={() => setPreviewScenarioId(item.id)}>{item.label}</button>)}
    </div>
    <section className="deal-grid">
      <div><span>BREAK-EVEN ASK</span><strong>{money(projection.breakEvenAsk)}</strong></div>
      <div><span>INVESTED · F$2</span><strong>{money(projection.investedCost)}</strong></div>
      <div className={displayedScenario.profit < 0 ? "negative" : "positive"}><span>PROJECTED PROFIT</span><strong>{money(displayedScenario.profit)}</strong></div>
      <div><span>MARGIN / ROI</span><strong>{pct(displayedScenario.marginPercent)} / {pct(displayedScenario.roiPercent)}</strong></div>
    </section>
    <section className="evidence">
      <div><span>ACTIVE MARKET</span><strong>{projection.active.count}</strong><small>MEDIAN {money(projection.active.median)}</small></div>
      <div><span>SOLD · {projection.file.subject.soldWindowMonths} MO</span><strong>{projection.sold.count}</strong><small>MEDIAN {money(projection.sold.median)}</small></div>
      <div><span>EVIDENCE</span><strong>{projection.confidence}</strong><small>ADJ. {money(projection.adjustments)}</small></div>
    </section>
    <section className="net-row"><span>NET PROCEEDS</span><strong>{money(displayedScenario.netProceeds)}</strong></section>
    <div className="summary-actions">
      <button type="button" onClick={() => onEdit("")}>{projection.file.revision ? "EDIT MODEL" : "START PRICING FILE"}</button>
      <button type="button" onClick={() => onEdit("active")}>VIEW COMPS</button>
    </div>
    <div className={`model-state ${projection.evidenceIssues.length ? "review" : ""}`}>{projection.file.status.toUpperCase()} · REV {projection.file.revision || "NEW"} · {projection.confidence}{projection.evidenceIssues.length ? ` · REVIEW ${projection.evidenceIssues.length}` : ""}</div>
    <style jsx>{`
      .price-hero{min-height:72px;padding:10px 12px;border:1px solid rgba(255,196,0,.72);border-radius:8px;background:linear-gradient(135deg,rgba(255,196,0,.14),rgba(255,196,0,.025) 66%),#101313;box-shadow:inset 0 0 0 1px rgba(255,196,0,.08),0 0 16px rgba(255,196,0,.07)}.price-hero span{display:block;color:#ffc400;font-size:8px;font-weight:950;letter-spacing:.06em}.price-hero strong{display:block;margin-top:5px;font-size:27px;line-height:1;font-weight:950;letter-spacing:-.025em}.price-hero small{display:block;margin-top:7px;color:#9ba19e;font-size:7px;font-weight:850}.scenario-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-top:7px}.scenario-tabs button{height:25px;border:1px solid rgba(255,255,255,.1);border-radius:5px;background:#0d100f;color:#8e9491;font-size:7px;font-weight:950;cursor:pointer}.scenario-tabs button.on{border-color:#ffc400;color:#ffc400;background:rgba(255,196,0,.06)}.deal-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:7px}.deal-grid div{min-width:0;height:47px;padding:7px 8px;border:1px solid rgba(255,255,255,.09);border-radius:6px;background:#101313}.deal-grid span,.evidence span{display:block;color:#929895;font-size:6px;font-weight:900;letter-spacing:.04em}.deal-grid strong{display:block;margin-top:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;font-weight:950}.deal-grid .positive strong{color:#72e08d}.deal-grid .negative strong{color:#ff7373}.evidence{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-top:7px}.evidence div{min-width:0;padding:7px;border:1px solid rgba(255,255,255,.08);border-radius:6px;background:#0e1110}.evidence strong{display:block;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#ffc400;font-size:10px;font-weight:950}.evidence small{display:block;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#888e8b;font-size:5.5px;font-weight:800}.net-row{height:38px;margin-top:7px;padding:0 9px;border:1px solid rgba(255,255,255,.09);border-radius:6px;background:#101313;display:flex;align-items:center;justify-content:space-between}.net-row span{color:#969c99;font-size:7px;font-weight:950}.net-row strong{font-size:12px;font-weight:950}.summary-actions{display:grid;grid-template-columns:1.35fr 1fr;gap:6px;margin-top:7px}.summary-actions button{height:34px;border:1px solid rgba(255,196,0,.42);border-radius:6px;background:#101312;color:#ffc400;font-size:7px;font-weight:950;cursor:pointer}.summary-actions button:first-child{background:#ffc400;color:#080908}.model-state{margin-top:7px;color:#666d69;font-size:6px;font-weight:850;text-align:center}.model-state.review{color:#ffc400}
    `}</style>
  </>;
}

function PricingDirectory({ draft, projection, onOpen, setDraft }) {
  return <>
    <div className="pricing-section-title">PRICING FILE · REV {draft.revision || "NEW"}</div>
    <div className="status-row">
      <span>MODEL STATUS</span>
      <button type="button" className={draft.status === "draft" ? "on" : ""} onClick={() => setDraft(current => ({ ...current, status: "draft" }))}>DRAFT</button>
      <button type="button" className={draft.status === "approved" ? "on" : ""} onClick={() => setDraft(current => ({ ...current, status: "approved" }))}>APPROVED</button>
    </div>
    <div className="directory-grid">
      {EDITOR_SECTIONS.map(item => <button type="button" key={item.id} onClick={() => onOpen(item.id)}><span>{item.note}</span><strong>{item.label}</strong><small>{item.id === "active" ? `${projection.active.count} INCLUDED` : item.id === "sold" ? `${projection.sold.count} INCLUDED` : item.id === "history" ? `${draft.history.length} SAVED` : "OPEN"}</small><b>›</b></button>)}
    </div>
    <style jsx>{`
      .status-row{height:37px;padding:0 6px;border:1px solid rgba(255,255,255,.09);border-radius:6px;background:#0f1211;display:grid;grid-template-columns:1fr 54px 64px;gap:4px;align-items:center}.status-row span{color:#929895;font-size:6px;font-weight:900}.status-row button{height:23px;border:1px solid rgba(255,255,255,.1);border-radius:4px;background:#0a0c0b;color:#878d89;font-size:6px;font-weight:950}.status-row button.on{border-color:#ffc400;color:#ffc400}.directory-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:7px}.directory-grid button{position:relative;height:76px;padding:10px 18px 8px 9px;border:1px solid rgba(255,255,255,.09);border-radius:7px;background:linear-gradient(180deg,#141716,#0e1010);color:#f2f2f2;text-align:left;cursor:pointer}.directory-grid span{display:block;color:#7f8582;font-size:5.5px;font-weight:900}.directory-grid strong{display:block;margin-top:8px;font-size:9px;font-weight:950}.directory-grid small{display:block;margin-top:7px;color:#ffc400;font-size:5.5px;font-weight:850}.directory-grid b{position:absolute;right:8px;top:29px;color:#ffc400;font-size:15px}
    `}</style>
  </>;
}

function SectionEditor({ section, draft, projection, setDraft, updateGroup, onAddComparable, onOpenComparable, onRestore }) {
  if (section === "subject") return <SubjectEditor draft={draft} updateGroup={updateGroup} />;
  if (section === "active" || section === "sold") {
    const records = section === "sold" ? draft.soldComparables : draft.activeComparables;
    return <>
      <div className="pricing-section-title">{section === "sold" ? `${draft.subject.soldWindowMonths}-MONTH SOLD RESULTS` : `ACTIVE MARKET · ±${draft.subject.hourTolerancePercent}% LIKE HOURS`}</div>
      {section === "active" ? <ActiveCohortSummary active={projection.active} /> : <SoldSummary sold={projection.sold} />}
      <div className="pricing-list">{records.map(item => <button type="button" key={item.id} onClick={() => onOpenComparable(item.id)}><strong>{item.year || "YEAR"} {item.make || "MAKE"} {item.model || "MODEL"}</strong><span>{item.hours ? `${item.hours.toLocaleString()} HRS · ` : ""}{money(item.price)} · {item.source}{item.included === false ? " · EXCLUDED" : ""}</span><b>›</b></button>)}</div>
      <button type="button" className="pricing-add" onClick={() => onAddComparable(section)}>+ ADD {section === "sold" ? "SOLD RESULT" : "ACTIVE LISTING"}</button>
    </>;
  }
  if (section === "adjustments") return <AdjustmentEditor draft={draft} updateGroup={updateGroup} projection={projection} />;
  if (section === "costs") return <CostEditor draft={draft} updateGroup={updateGroup} projection={projection} />;
  if (section === "scenarios") return <ScenarioEditor draft={draft} setDraft={setDraft} projection={projection} />;
  return <HistoryEditor history={draft.history} onRestore={onRestore} />;
}

function ActiveCohortSummary({ active }) {
  return <div className="cohort-summary">
    <div className="cohort-head"><span>YEAR</span><span>LOWER HRS</span><span>LIKE HRS</span><span>HIGHER HRS</span></div>
    {active.cohorts.map(cohort => <div className="cohort-row" key={cohort.yearDelta}>
      <strong>{cohort.year || "—"}<small>{cohort.count} FOR SALE</small></strong>
      {cohort.bands.map(band => <span key={band.id}>{band.count}<small>{band.lowest ? `${money(band.lowest.price)} · ${Number(band.lowest.hours || 0).toLocaleString()}H` : "—"}</small></span>)}
    </div>)}
    <style jsx>{`.cohort-summary{margin-bottom:7px;border:1px solid rgba(255,255,255,.09);border-radius:7px;background:#0f1211;overflow:hidden}.cohort-head,.cohort-row{display:grid;grid-template-columns:47px repeat(3,minmax(0,1fr));align-items:center}.cohort-head{min-height:24px;padding:0 5px;background:rgba(255,196,0,.045);color:#8e9490;font-size:5px;font-weight:950}.cohort-row{min-height:43px;padding:5px;border-top:1px solid rgba(255,255,255,.065)}.cohort-row>strong{font-size:8px}.cohort-row>strong small{display:block;margin-top:4px;color:#797f7b;font-size:4.5px}.cohort-row>span{min-width:0;text-align:center;color:#ffc400;font-size:8px;font-weight:950}.cohort-row>span small{display:block;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#999f9b;font-size:4.5px;font-weight:800}`}</style>
  </div>;
}

function SoldSummary({ sold }) {
  return <div className="sold-summary">
    <div><span>RESULTS</span><strong>{sold.count}</strong></div>
    <div><span>LOW</span><strong>{money(sold.low)}</strong></div>
    <div><span>MEDIAN</span><strong>{money(sold.median)}</strong></div>
    <div><span>HIGH</span><strong>{money(sold.high)}</strong></div>
    <style jsx>{`.sold-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;margin-bottom:7px}.sold-summary div{min-width:0;padding:7px 5px;border:1px solid rgba(255,255,255,.09);border-radius:6px;background:#0f1211}.sold-summary span{display:block;color:#8e9490;font-size:5px;font-weight:950}.sold-summary strong{display:block;margin-top:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#ffc400;font-size:8px;font-weight:950}`}</style>
  </div>;
}

function SubjectEditor({ draft, updateGroup }) {
  return <><div className="pricing-section-title">SUBJECT MACHINE</div><div className="pricing-form-grid">
    <Field label="YEAR"><NumberInput value={draft.subject.year} onChange={value => updateGroup("subject", "year", value)} /></Field>
    <Field label="HOURS"><NumberInput value={draft.subject.hours} onChange={value => updateGroup("subject", "hours", value)} /></Field>
    <Field label="MAKE"><input value={draft.subject.make} onChange={event => updateGroup("subject", "make", event.target.value)} /></Field>
    <Field label="MODEL"><input value={draft.subject.model} onChange={event => updateGroup("subject", "model", event.target.value)} /></Field>
    <Field label="CURRENT ASK"><NumberInput value={draft.subject.currentAsk} onChange={value => updateGroup("subject", "currentAsk", value)} /></Field>
    <Field label="LIKE-HOUR RANGE %"><NumberInput value={draft.subject.hourTolerancePercent} onChange={value => updateGroup("subject", "hourTolerancePercent", value)} /></Field>
    <Field label="SOLD WINDOW"><select value={draft.subject.soldWindowMonths} onChange={event => updateGroup("subject", "soldWindowMonths", Number(event.target.value))}><option value={6}>6 MONTHS</option><option value={12}>12 MONTHS</option></select></Field>
    <Field label="LOCATION"><input value={draft.subject.location} onChange={event => updateGroup("subject", "location", event.target.value)} /></Field>
    <Field label="CONFIGURATION" wide><textarea value={draft.subject.configuration} onChange={event => updateGroup("subject", "configuration", event.target.value)} /></Field>
  </div></>;
}

function ComparableEditor({ kind, comparable, onChange, onDelete }) {
  if (!comparable) return null;
  return <><div className="pricing-section-title">{kind === "sold" ? "SOLD RESULT" : "ACTIVE LISTING"}</div><div className="pricing-form-grid">
    <Field label="SOURCE"><input value={comparable.source} onChange={event => onChange({ source: event.target.value })} /></Field>
    <Field label="QUALITY"><select value={comparable.quality} onChange={event => onChange({ quality: event.target.value })}><option value="strong">STRONG</option><option value="usable">USABLE</option><option value="weak">WEAK</option></select></Field>
    <Field label="YEAR"><NumberInput value={comparable.year} onChange={value => onChange({ year: value })} /></Field>
    <Field label="HOURS"><NumberInput value={comparable.hours} onChange={value => onChange({ hours: value })} /></Field>
    <Field label="MAKE"><input value={comparable.make} onChange={event => onChange({ make: event.target.value })} /></Field>
    <Field label="MODEL"><input value={comparable.model} onChange={event => onChange({ model: event.target.value })} /></Field>
    <Field label={kind === "sold" ? "SALE PRICE" : "ASKING PRICE"}><NumberInput value={comparable.price} onChange={value => onChange({ price: value })} /></Field>
    <Field label="LOCATION"><input value={comparable.location} onChange={event => onChange({ location: event.target.value })} /></Field>
    {kind === "sold" ? <><Field label="SALE DATE"><input type="date" value={comparable.saleDate} onChange={event => onChange({ saleDate: event.target.value })} /></Field><Field label="BUYER PREMIUM"><select value={comparable.buyerPremium} onChange={event => onChange({ buyerPremium: event.target.value })}><option value="unknown">UNKNOWN</option><option value="included">INCLUDED</option><option value="excluded">EXCLUDED</option></select></Field></> : <Field label="CAPTURED DATE"><input type="date" value={comparable.capturedAt} onChange={event => onChange({ capturedAt: event.target.value })} /></Field>}
    <Field label="SOURCE LINK" wide><input type="url" value={comparable.url} onChange={event => onChange({ url: event.target.value })} placeholder="https://" />{comparable.url ? <a className="source-link" href={comparable.url} target="_blank" rel="noreferrer">OPEN SOURCE ↗</a> : null}</Field>
    <Field label="NOTES" wide><textarea value={comparable.notes} onChange={event => onChange({ notes: event.target.value })} /></Field>
    <Field label="USE IN MODEL" wide><select value={comparable.included ? "yes" : "no"} onChange={event => onChange({ included: event.target.value === "yes" })}><option value="yes">INCLUDED</option><option value="no">EXCLUDED — PRESERVE RECORD</option></select></Field>
  </div><button type="button" className="pricing-delete" onClick={onDelete}>DELETE COMPARABLE</button></>;
}

const ADJUSTMENT_FIELDS = [["year","YEAR"],["hours","HOURS"],["condition","CONDITION"],["configuration","CONFIGURATION"],["location","LOCATION"],["other","OTHER"]];
function AdjustmentEditor({ draft, updateGroup, projection }) {
  return <><div className="pricing-section-title">COMPARABLE ADJUSTMENTS · {money(projection.adjustments)}</div><div className="pricing-form-grid">{ADJUSTMENT_FIELDS.map(([key,label]) => <Field key={key} label={`${label} ADJUSTMENT`}><NumberInput value={draft.adjustments[key]} onChange={value => updateGroup("adjustments", key, value)} /></Field>)}<Field label="ANALYST NOTES" wide><textarea value={draft.adjustments.notes} onChange={event => updateGroup("adjustments", "notes", event.target.value)} /></Field></div></>;
}

const COST_FIELDS = [["commissionPercent","COMMISSION %","0.1"],["slippagePercent","NEGOTIATION / SLIPPAGE %","0.1"],["platformFees","PLATFORM / AUCTION FEES"],["freightContribution","FREIGHT CONTRIBUTION"],["remainingWork","REMAINING WORK"],["warrantyReserve","WARRANTY RESERVE"],["carryingCost","EXPECTED CARRYING COST"],["other","OTHER CLOSING COST"]];
function CostEditor({ draft, updateGroup, projection }) {
  return <><div className="pricing-section-title">SELLING COSTS · FIXED {money(projection.fixedCosts)}</div><div className="pricing-form-grid">{COST_FIELDS.map(([key,label,step]) => <Field key={key} label={label}><NumberInput value={draft.salesCosts[key]} step={step} onChange={value => updateGroup("salesCosts", key, value)} /></Field>)}</div></>;
}

function ScenarioEditor({ draft, setDraft, projection }) {
  function update(id, patch) { setDraft(current => ({ ...current, scenarios: current.scenarios.map(item => item.id === id ? { ...item, ...patch } : item) })); }
  return <><div className="pricing-section-title">PRICING SCENARIOS</div><div className="scenario-editor">{IXI_PRICING_SCENARIOS.map(meta => { const saved = draft.scenarios.find(item => item.id === meta.id); const calculated = projection.scenarios.find(item => item.id === meta.id); return <section key={meta.id} className={draft.selectedScenario === meta.id ? "selected" : ""}><button type="button" onClick={() => setDraft(current => ({ ...current, selectedScenario: meta.id }))}>{meta.label}<span>{draft.selectedScenario === meta.id ? "SELECTED" : "SELECT"}</span></button><div><label>ASK<NumberInput value={saved.askingPrice} onChange={value => update(meta.id, { askingPrice: value })} /></label><label>SALE SPEED<input value={saved.saleDays} onChange={event => update(meta.id, { saleDays: event.target.value })} /></label></div><small>EST. CLOSE {money(calculated.expectedClose)} · PROFIT {money(calculated.profit)} · MARGIN {pct(calculated.marginPercent)}</small></section>; })}</div><style jsx>{`.scenario-editor{display:flex;flex-direction:column;gap:7px}.scenario-editor section{padding:8px;border:1px solid rgba(255,255,255,.09);border-radius:7px;background:#0f1211}.scenario-editor section.selected{border-color:rgba(255,196,0,.62)}.scenario-editor section>button{width:100%;padding:0;border:0;background:transparent;color:#f3f3f3;display:flex;justify-content:space-between;font-size:10px;font-weight:950}.scenario-editor section>button span{color:#ffc400;font-size:6px}.scenario-editor section>div{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:7px}.scenario-editor label{color:#8d9390;font-size:6px;font-weight:900}.scenario-editor input{width:100%;height:28px;margin-top:4px;padding:5px 6px;border:1px solid rgba(255,255,255,.11);border-radius:4px;background:#090b0a;color:#f3f3f3;font-size:8px;font-weight:850}.scenario-editor small{display:block;margin-top:7px;color:#8d9390;font-size:6px;font-weight:800}`}</style></>;
}

function HistoryEditor({ history, onRestore }) {
  return <><div className="pricing-section-title">SAVED PRICING REVISIONS</div>{history.length ? <div className="pricing-list">{history.map(item => <button type="button" key={item.revision} onClick={() => onRestore(item.revision)}><strong>REV {item.revision} · {item.status.toUpperCase()} · {money(item.askingPrice)}</strong><span>{clean(item.savedAt).slice(0,10)} · {item.savedBy || "IXI USER"} · PROFIT {money(item.projectedProfit)}</span><b>↺</b></button>)}</div> : <div className="history-empty">NO SAVED REVISIONS</div>}<style jsx>{`.history-empty{min-height:150px;border:1px solid rgba(255,255,255,.08);border-radius:8px;background:#0e1110;color:#7f8582;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900}`}</style></>;
}
