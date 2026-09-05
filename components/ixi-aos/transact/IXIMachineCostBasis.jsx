import { useMemo, useState } from "react";

import { getIXITransactModule } from "./IXITransactModuleRegistry";
import { getIXITransactRecordIndex } from "./IXITransactRecordIndex";
import { getIXIMachineCostBasis } from "./IXIMachineCostBasisEngine";

const clean = value => String(value ?? "").trim();
const upper = value => clean(value).toUpperCase();
const formatMoney = value => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
}).format(Number(value) || 0);
const formatDate = value => {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(parsed)).toUpperCase();
};

function ownedDays(acquiredAt) {
  const purchased = Date.parse(acquiredAt);
  if (!Number.isFinite(purchased)) return 0;
  return Math.max(1, Math.ceil((Date.now() - purchased) / 86400000));
}

export default function IXIMachineCostBasis({
  context = {},
  financialRecords = [],
  onOpenModule = null,
  onClose = null
}) {
  const projection = useMemo(() => {
    const index = getIXITransactRecordIndex(financialRecords);
    return getIXIMachineCostBasis(index);
  }, [financialRecords]);
  const [viewId, setViewId] = useState("");
  const selected = projection.categories.find(item => item.id === viewId) ||
    (viewId === "review" ? {
      id: "review",
      label: "REVIEW",
      amount: projection.reviewAmount,
      records: projection.reviewRecords
    } : null);
  const days = ownedDays(projection.acquiredAt);

  function navigateBack() {
    if (selected) setViewId("");
    else onClose?.();
  }

  function openRecord(record) {
    const moduleId = clean(record?.moduleId);
    const module = getIXITransactModule(moduleId) || {
      id: moduleId || "financial-reporting",
      label: upper(record?.documentType || "TRAN$ACT RECORD"),
      group: "record",
      documentType: record?.documentType || "record"
    };
    onOpenModule?.(module, context, {
      financialRecord: record?.source,
      financialDocument: record?.document,
      financialDocumentId: record?.id,
      presentation: "console",
      source: "machine-cost-basis-f2"
    });
  }

  return (
    <div className="machine-cost-basis">
      <header>
        <div>
          <span>IXI MACHINE · F$2</span>
          <strong>{selected ? selected.label : "COST BASIS"}</strong>
          <small>{clean(context?.primary?.label) || "AOS OBJECT"}</small>
        </div>
        <button type="button" onClick={navigateBack} aria-label="Back">‹</button>
      </header>

      <main>
        {selected ? (
          <section className="records">
            <div className="section-bar">
              <span>F$1 SOURCE · {selected.records.length} RECORDS</span>
              <strong>{formatMoney(selected.amount)}</strong>
            </div>
            {selected.records.length ? selected.records.map(record => (
              <button type="button" key={`${record.id}-${record.revision}`} onClick={() => openRecord(record)}>
                <div>
                  <strong>{record.number}</strong>
                  <small>{upper(record.status)} · {formatDate(record.occurredAt)}</small>
                </div>
                <b>{formatMoney(record.costBasis.amount)}</b>
                <i aria-hidden="true">›</i>
              </button>
            )) : (
              <div className="empty"><strong>NO SOURCE RECORDS</strong></div>
            )}
          </section>
        ) : (
          <>
            <section className="total-card">
              <span>TOTAL INVESTED</span>
              <strong>{formatMoney(projection.totalInvested)}</strong>
              <small>INCURRED COST · PAID + UNPAID</small>
            </section>

            <section className="split-kpis">
              <div><span>ACQUISITION</span><strong>{formatMoney(projection.acquisition)}</strong></div>
              <div><span>ADDED COSTS</span><strong>{formatMoney(projection.additionalCosts)}</strong></div>
            </section>

            {projection.categories.length ? (
              <section className="waterfall">
                {projection.categories.map(item => (
                  <button type="button" key={item.id} onClick={() => setViewId(item.id)}>
                    <span>{item.label}</span><strong>{formatMoney(item.amount)}</strong><b>›</b>
                  </button>
                ))}
              </section>
            ) : (
              <div className="empty">
                <strong>NO COST RECORDS</strong>
                <span>Machine costs will calculate from F$1 automatically.</span>
              </div>
            )}

            <section className="forward-view">
              <div><span>COMMITTED</span><strong>{formatMoney(projection.committed)}</strong></div>
              <div><span>PLANNED</span><strong>{formatMoney(projection.planned)}</strong></div>
              {projection.reviewCount ? (
                <button type="button" onClick={() => setViewId("review")}>
                  <span>REVIEW · {projection.reviewCount}</span>
                  <strong>{formatMoney(projection.reviewAmount)}</strong><b>›</b>
                </button>
              ) : null}
            </section>

            <section className="ownership">
              <div><span>OWNED</span><strong>{days ? `${days} DAYS` : "—"}</strong></div>
              <div><span>COST / OWNED DAY</span><strong>{days ? formatMoney(projection.totalInvested / days) : "—"}</strong></div>
            </section>
          </>
        )}
      </main>

      <style jsx>{`
        .machine-cost-basis,.machine-cost-basis *{box-sizing:border-box}
        .machine-cost-basis{position:relative;width:298px;height:471px;overflow:hidden;border:1px solid rgba(255,196,0,.28);border-radius:14px;background:linear-gradient(180deg,rgba(255,196,0,.045),transparent 31%),#0b0c0c;color:#f4f4f4;font-family:Inter,Arial,sans-serif;box-shadow:0 18px 34px rgba(0,0,0,.42)}
        header{height:61px;padding:10px 11px;border-bottom:1px solid rgba(255,255,255,.09);display:flex;align-items:flex-start;justify-content:space-between}
        header span{display:block;color:#ffc400;font-size:8px;font-weight:900;letter-spacing:.075em}
        header strong{display:block;max-width:244px;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:15px;line-height:1.08;font-weight:900}
        header small{display:block;max-width:244px;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#858b88;font-size:7px;font-weight:800;text-transform:uppercase}
        header button{width:30px;height:30px;margin:-1px -1px 0 6px;border:1px solid rgba(255,255,255,.14);border-radius:7px;background:#111313;color:#ffc400;font-size:21px;font-weight:900;cursor:pointer}
        main{position:absolute;inset:61px 0 9px;overflow-x:hidden;overflow-y:auto;padding:9px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.18) transparent}
        .total-card{min-height:70px;padding:10px 12px;border:1px solid rgba(255,196,0,.7);border-radius:8px;background:linear-gradient(135deg,rgba(255,196,0,.13),rgba(255,196,0,.025) 66%),#101313;box-shadow:inset 0 0 0 1px rgba(255,196,0,.08),0 0 16px rgba(255,196,0,.07)}
        .total-card span{display:block;color:#ffc400;font-size:8px;font-weight:950;letter-spacing:.06em}
        .total-card strong{display:block;margin-top:5px;font-size:26px;line-height:1;font-weight:950;letter-spacing:-.025em}
        .total-card small{display:block;margin-top:6px;color:#8f9692;font-size:7px;font-weight:850;letter-spacing:.04em}
        .split-kpis{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:7px}
        .split-kpis div,.ownership div{min-width:0;padding:8px 9px;border:1px solid rgba(255,255,255,.09);border-radius:7px;background:#101313}
        .split-kpis span,.ownership span,.forward-view span{display:block;color:#969c99;font-size:7px;font-weight:900;letter-spacing:.045em}
        .split-kpis strong{display:block;margin-top:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:950}
        .waterfall{margin-top:7px;border:1px solid rgba(255,255,255,.09);border-radius:8px;overflow:hidden}
        .waterfall button{position:relative;width:100%;min-height:34px;padding:7px 25px 7px 10px;border:0;border-bottom:1px solid rgba(255,255,255,.07);background:#0e1110;color:#f1f1f1;display:flex;align-items:center;justify-content:space-between;gap:8px;text-align:left;cursor:pointer}
        .waterfall button:last-child{border-bottom:0}
        .waterfall button:hover,.waterfall button:focus-visible,.records button:hover,.records button:focus-visible{outline:none;background:#151918}
        .waterfall span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:9px;font-weight:900}
        .waterfall strong{font-size:10px;font-weight:900}
        .waterfall b{position:absolute;right:9px;color:#ffc400;font-size:14px}
        .forward-view{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:7px}
        .forward-view>div,.forward-view>button{position:relative;min-width:0;min-height:42px;padding:7px 9px;border:1px solid rgba(255,255,255,.09);border-radius:7px;background:#101313;color:#f4f4f4;text-align:left}
        .forward-view strong{display:block;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;font-weight:950}
        .forward-view>button{grid-column:1/-1;border-color:rgba(255,196,0,.35);cursor:pointer}
        .forward-view>button span{color:#ffc400}.forward-view>button b{position:absolute;right:9px;top:14px;color:#ffc400;font-size:14px}
        .ownership{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:7px}
        .ownership div{padding-block:7px}.ownership strong{display:block;margin-top:4px;font-size:9px;font-weight:900}
        .empty{min-height:125px;margin-top:7px;padding:30px 20px;border:1px solid rgba(255,255,255,.08);border-radius:8px;background:#0e1110;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
        .empty strong{color:#ffc400;font-size:11px;font-weight:950}.empty span{margin-top:7px;color:#929895;font-size:8px;font-weight:800;line-height:1.45}
        .section-bar{min-height:45px;padding:8px 10px;border:1px solid rgba(255,196,0,.5);border-radius:7px;background:rgba(255,196,0,.055);display:flex;align-items:center;justify-content:space-between;gap:8px}
        .section-bar span{color:#ffc400;font-size:7px;font-weight:950;letter-spacing:.045em}.section-bar strong{font-size:12px;font-weight:950}
        .records>button{position:relative;width:100%;min-height:54px;padding:8px 82px 8px 10px;border:0;border-bottom:1px solid rgba(255,255,255,.07);background:#0e1110;color:#f1f1f1;text-align:left;cursor:pointer}
        .records>button:first-of-type{margin-top:7px;border-radius:8px 8px 0 0}.records>button:last-of-type{border-radius:0 0 8px 8px}
        .records>button div strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;font-weight:950}
        .records>button small{display:block;margin-top:5px;color:#8d9390;font-size:7px;font-weight:800}
        .records>button>b{position:absolute;right:23px;top:20px;color:#c0c4c2;font-size:9px;font-style:normal}.records>button i{position:absolute;right:9px;top:17px;color:#ffc400;font-size:15px;font-style:normal;font-weight:900}
      `}</style>
    </div>
  );
}
