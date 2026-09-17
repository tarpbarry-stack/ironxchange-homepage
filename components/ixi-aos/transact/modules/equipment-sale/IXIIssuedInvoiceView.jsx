import { createPortal } from "react-dom";

const money = value => Number(value || 0).toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function IXIIssuedInvoiceView({ invoice, position, loading, error, trades = [], stageRail, expanded, onExpand, onClose, onContinue, onTrades, sold }) {
  const content = <section className={`es-issued ${expanded ? "expanded" : ""}`} aria-label="Issued invoice">
    <header><div><small>ISSUED INVOICE</small><h2>{invoice.documentNumber || "INVOICE"}</h2></div>
      <button type="button" onClick={expanded ? onClose : onExpand}>{expanded ? "RETURN TO CARD" : "EXPAND"}</button>
    </header>
    {stageRail}
    <div className="es-issued-body">
      <h3>{invoice.metadata?.customer?.name || "Customer"}</h3>
      <p>{invoice.metadata?.asset?.label || invoice.description}</p>
      <dl>
        <div><dt>Sale total</dt><dd>{money(position.invoiceAmount)}</dd></div>
        <div><dt>Money received</dt><dd>{money(position.received)}</dd></div>
        <div><dt>Trade credit</dt><dd>{loading ? "Checking…" : money(position.tradeCredit)}</dd></div>
        {position.credited > position.tradeCredit ? <div><dt>Other credits</dt><dd>{money(position.credited - position.tradeCredit)}</dd></div> : null}
        <div className="es-issued-balance"><dt>Balance due</dt><dd>{loading || error ? "Checking…" : money(position.balance)}</dd></div>
      </dl>
      {error ? <p role="alert">{error} Open SOLD to check the current balance.</p> : null}
      <p className="es-issued-next">{sold ? "This sale is already recorded." : error ? "Continue to SOLD to review the saved payments and credits." : loading ? "Checking the saved payments and credits…" : position.balance <= 0.005 ? "Balance cleared. Continue to SOLD to finish this sale." : "Continue to SOLD to record money received and finish this sale."}</p>
      {onTrades ? <button type="button" className="es-issued-trades" onClick={onTrades}>OPEN TRADES{trades.length ? ` · ${trades.length}` : ""}</button> : null}
      <details><summary>Invoice details</summary><dl>
        <div><dt>Issued invoice amount</dt><dd>{money(invoice.totals?.customerTotal ?? invoice.totals?.total)}</dd></div>
        <div><dt>Invoice date</dt><dd>{String(invoice.occurredAt || "").slice(0, 10) || "—"}</dd></div>
        <div><dt>Due date</dt><dd>{String(invoice.dueDate || "").slice(0, 10) || "—"}</dd></div>
        <div><dt>Payment terms</dt><dd>{invoice.paymentTerms || "—"}</dd></div>
        <div><dt>Customer PO</dt><dd>{invoice.externalReference || "—"}</dd></div>
      </dl>{invoice.memo ? <p>{invoice.memo}</p> : null}
        {trades.map(trade => <p key={trade.tradeId}>{trade.year} {trade.make} {trade.model} · {money(trade.allowance)}<br />SN {trade.serialNumber}</p>)}
      </details>
    </div>
    <footer><button type="button" disabled={!onContinue} onClick={onContinue}>{sold ? "VIEW SOLD" : "CONTINUE TO SOLD"}</button></footer>
    <style jsx>{`
      .es-issued{display:flex;flex-direction:column;min-width:0;height:100%;background:#0b0d0c;color:#f5f5ef;font-family:inherit}
      .es-issued.expanded{position:fixed;inset:0;z-index:2147483000;height:100dvh;overflow:auto}
      header{display:flex;gap:12px;justify-content:space-between;align-items:center;padding:12px;border-bottom:1px solid #343831}
      small{color:#ffc400;font-size:11px;font-weight:800}h2{font-size:16px;margin:4px 0;overflow-wrap:anywhere}h3{font-size:17px;margin:0 0 6px}
      button,summary{min-height:44px;font-size:12px;font-weight:800;cursor:pointer}button{border:1px solid #555d50;border-radius:4px;padding:10px;background:#1c211a;color:#f5f5ef}
      .es-issued-body{padding:14px;overflow:auto;min-height:0;flex:1}.expanded .es-issued-body{width:min(100%,760px);box-sizing:border-box;margin:auto}
      p{font-size:13px;line-height:1.5;overflow-wrap:anywhere;color:#bec7bb;margin:8px 0 14px}dl{margin:12px 0}dl>div{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:10px 0;border-bottom:1px solid #30372c}dt{font-size:13px;color:#b9c1b4}dd{margin:0;font-size:15px;font-weight:800;text-align:right;overflow-wrap:anywhere}
      .es-issued-balance dd{font-size:24px;color:#ffc400}.es-issued-next{font-size:14px;color:#f5f5ef}.es-issued-trades{width:100%;margin-bottom:12px}summary{display:flex;align-items:center;color:#ffc400}details{border-top:1px solid #343831}
      footer{padding:12px;border-top:1px solid #343831;background:#0b0d0c;position:sticky;bottom:0}footer button{width:100%;background:#ffc400;border-color:#ffc400;color:#080a07;font-size:14px}button:disabled{opacity:.4}button:focus-visible,summary:focus-visible{outline:2px solid #ffc400;outline-offset:2px}
    `}</style>
  </section>;
  return expanded ? createPortal(content, document.body) : content;
}
