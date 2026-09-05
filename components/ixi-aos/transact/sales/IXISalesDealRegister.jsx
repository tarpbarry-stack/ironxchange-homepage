import { IXI_SALES_STAGES } from "./IXISalesDealEngine";
import { canCloseIXISalesDeal } from "./IXISalesDealCommands";

const money = value => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value || 0));
const clean = value => String(value ?? "").trim();

function canStartStage(deal, stageId) {
  if (stageId === "sales-order") return Boolean(deal?.stageRecords?.quote);
  if (stageId === "invoice") return Boolean(deal?.stageRecords?.signed);
  if (stageId === "sold") return Boolean(deal?.stageRecords?.invoice);
  if (stageId === "settlement") return Boolean(deal?.stageRecords?.sold);
  return false;
}

export function IXISalesStageRail({ deal, onOpenStage, onStartStage }) {
  return <><div className="ixi-deal-stage-rail" aria-label={`Sales stages for ${deal?.customer || "customer"}`}>
    {IXI_SALES_STAGES.map(stage => {
      const entry = deal?.stageRecords?.[stage.id];
      const startable = !entry && canStartStage(deal, stage.id);
      return <button key={stage.id} type="button" className={entry ? "available" : startable ? "startable" : "missing"} disabled={!entry && !startable} onClick={() => entry ? onOpenStage?.(stage, entry, deal) : startable && onStartStage?.(stage, deal)} aria-label={`${entry ? "Open" : startable ? "Start" : "No"} ${stage.label}`}><i>{entry ? "✓" : stage.number}</i><span>{stage.label}</span></button>;
    })}
  </div></>;
}

export default function IXISalesDealRegister({ deals = [], moduleLabel = "SALES", allowDirectInvoice = false, onBack, onNewDeal, onNewDirectInvoice, onOpenStage, onStartStage, onCloseDeal }) {
  const active = deals.filter(deal => !deal.terminal);
  const closed = deals.length - active.length;
  return <div className="ixi-sales-register">
    <header><button type="button" onClick={onBack}>‹</button><div><span>IXI TRAN$ACT · PASSPORT SALES</span><strong>{moduleLabel}</strong></div><i>{deals.length}</i></header>
    <section className="ixi-sales-register-summary"><div><span>ACTIVE DEALS</span><strong>{active.length}</strong></div><div><span>CLOSED / DEAD</span><strong>{closed}</strong></div></section>
    <div className="ixi-sales-register-label">CUSTOMER DEAL THREADS</div>
    <main>{deals.length ? deals.map(deal => <article key={deal.dealId} className={deal.terminal ? "terminal" : "active"}><div className="ixi-deal-head"><div><strong>{deal.customer}</strong><small>{deal.dealId}</small></div><div><b>{money(deal.amount)}</b><span>{clean(deal.status || "OPEN").toUpperCase()}</span></div></div><IXISalesStageRail deal={deal} onOpenStage={onOpenStage} onStartStage={onStartStage} /><footer><span>CURRENT · {clean(deal.currentStage).replace(/-/g, " ").toUpperCase()}</span><span>{clean(deal.updatedAt).slice(0, 10) || "NO DATE"}</span>{canCloseIXISalesDeal(deal) ? <button type="button" onClick={() => onCloseDeal?.(deal)}>MARK LOST</button> : null}</footer></article>) : <div className="ixi-sales-register-empty"><strong>NO CUSTOMER DEALS YET</strong><span>Start a separate deal thread for each interested customer.</span></div>}</main>
    <button className="ixi-sales-register-new" type="button" onClick={onNewDeal}>+ NEW CUSTOMER DEAL</button>
    {allowDirectInvoice ? <button className="ixi-sales-register-direct" type="button" onClick={onNewDirectInvoice}>+ CONTROLLED DIRECT INVOICE</button> : null}
    <footer>ONE PASSPORT · MANY CUSTOMER DEALS · ONE WINNING SALE</footer>
  </div>;
}
