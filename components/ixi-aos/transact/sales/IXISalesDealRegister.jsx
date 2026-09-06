import { IXI_SALES_STAGES } from "./IXISalesDealEngine";
import { canCloseIXISalesDeal } from "./IXISalesDealCommands";
import { salesStagePresentation } from "./IXISalesStagePresentation";

const money = value => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value || 0));
const clean = value => String(value ?? "").trim();

export function IXISalesStageRail({ deal, activeStageId = "", onOpenStage, onStartStage }) {
  return <><div className="ixi-deal-stage-rail" aria-label={`Sales stages for ${deal?.customer || "customer"}`}>
    {IXI_SALES_STAGES.map(stage => {
      const { entry, completed, startable, selected, state } = salesStagePresentation(deal, stage.id, activeStageId);
      // The rail is navigation, not an authorization or accounting control.
      // Every stage stays openable so an operator can inspect it, recover a
      // legacy transaction, or enter an authorized manual override. The stage
      // form remains responsible for validating what may be committed.
      return <button key={stage.id} type="button" className={`${state}${selected ? " selected" : ""}`} onClick={() => entry ? onOpenStage?.(stage, entry, deal) : onStartStage?.(stage, deal)} aria-current={selected ? "step" : undefined} aria-label={`${entry || completed ? "Open" : startable ? "Start" : "Open"} step ${stage.number}, ${stage.label}`}><i>{completed ? "✓" : stage.number}</i><span>{stage.label}</span></button>;
    })}
  </div></>;
}

export default function IXISalesDealRegister({ deals = [], moduleLabel = "SALES", primaryStageId = "quote", allowDirectInvoice = false, onBack, onNewDeal, onNewDirectInvoice, onOpenDeal, onOpenStage, onStartStage, onCloseDeal }) {
  const active = deals.filter(deal => !deal.terminal);
  const closed = deals.length - active.length;
  const primaryStage = IXI_SALES_STAGES.find(stage => stage.id === primaryStageId) || IXI_SALES_STAGES[0];
  return <div className="ixi-sales-register">
    <header><button type="button" onClick={onBack}>‹</button><div><span>IXI TRAN$ACT · PASSPORT SALES</span><strong>{moduleLabel}</strong></div><i>{deals.length}</i></header>
    <section className="ixi-sales-register-summary"><div><span>ACTIVE DEALS</span><strong>{active.length}</strong></div><div><span>CLOSED / DEAD</span><strong>{closed}</strong></div></section>
    <div className="ixi-sales-register-label">CUSTOMER DEAL THREADS</div>
    <main>{deals.length ? deals.map(deal => {
      const primaryEntry = deal?.stageRecords?.[primaryStage.id];
      return <article key={deal.dealId} className={deal.terminal ? "terminal" : "active"}><button className="ixi-deal-head" type="button" onClick={() => primaryEntry ? onOpenDeal?.(primaryStage, primaryEntry, deal) : onStartStage?.(primaryStage, deal)} aria-label={`Open ${primaryStage.label} for ${deal.customer}`}><div><strong>{deal.customer}</strong><small>{deal.dealId}</small></div><div><b>{money(primaryEntry?.amount ?? deal.amount)}</b><span>OPEN {primaryStage.label} ›</span></div></button><IXISalesStageRail deal={deal} activeStageId={primaryStage.id} onOpenStage={onOpenStage} onStartStage={onStartStage} /><footer><span>CURRENT · {clean(deal.currentStage).replace(/-/g, " ").toUpperCase()}</span><span>{clean(deal.updatedAt).slice(0, 10) || "NO DATE"}</span>{canCloseIXISalesDeal(deal) ? <button type="button" onClick={() => onCloseDeal?.(deal)}>MARK LOST</button> : null}</footer></article>;
    }) : <div className="ixi-sales-register-empty"><strong>NO {primaryStage.label} RECORDS</strong><span>Only customer deals with an existing {primaryStage.label.toLowerCase()} appear in this module.</span></div>}</main>
    <button className="ixi-sales-register-new" type="button" onClick={onNewDeal}>+ NEW CUSTOMER DEAL</button>
    {allowDirectInvoice ? <button className="ixi-sales-register-direct" type="button" onClick={onNewDirectInvoice}>+ CONTROLLED DIRECT INVOICE</button> : null}
    <footer>ONE PASSPORT · MANY CUSTOMER DEALS · ONE WINNING SALE</footer>
  </div>;
}
