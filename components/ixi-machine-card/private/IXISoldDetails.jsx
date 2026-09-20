const clean = value => String(value ?? "").trim();
const displayDate = value => /^\d{4}-\d{2}-\d{2}$/.test(clean(value))
  ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`)) : "Not recorded";
export default function IXISoldDetails({ listing, onOpenTransact }) {
  const sale = listing.soldSummary;
  const price = sale.salePrice == null ? "Not recorded" : new Intl.NumberFormat("en-US", { style: "currency", currency: sale.currency || "USD", maximumFractionDigits: 2 }).format(sale.salePrice);
  return <section className="sold-facts" aria-label="Sale details">
      <div className="identity"><span>SN {listing.serialNumber || listing.publicData?.serialNumber || "—"}</span><span>{sale.passportId}</span></div>
      <div className="sale-price"><span>SALE PRICE</span><strong>{price}</strong></div>
      <dl><div><dt>DATE SOLD</dt><dd>{displayDate(sale.saleDate)}</dd></div><div><dt>BUYER</dt><dd title={sale.buyerLabel}>{sale.buyerLabel || "Not recorded"}</dd></div><div><dt>SOLD BY</dt><dd title={sale.soldByLabel}>{sale.soldByLabel || "Not recorded"}</dd></div></dl>
      <div className="sold-actions"><span className={`settlement ${sale.settlementStatus}`}>SETTLEMENT {sale.settlementStatus === "closed" ? "CLOSED" : "OPEN"}</span><button type="button" onClick={onOpenTransact} aria-label="Open sold machine TRANSACT">TRAN$ACT ↗</button></div>
    <style jsx>{`
      .sold-facts{flex:1;min-height:0;display:flex;flex-direction:column;gap:6px;color:#f3f4ee;font-family:'IXI Sold Inter','Inter Variable',Inter,ui-sans-serif,sans-serif}
      .identity{display:flex;justify-content:space-between;gap:6px;color:#aab3a7;font-size:9px;line-height:1.4;font-weight:450;flex-wrap:wrap}
      .sale-price{display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding:6px 0;border-top:1px solid #3e4433;border-bottom:1px solid #3e4433}
      .sale-price span{font-size:10px;line-height:1.4;letter-spacing:.035em;font-weight:600;color:#b8c2b1}
      .sale-price strong{font-size:22px;line-height:1.15;font-weight:700;letter-spacing:-.025em;font-variant-numeric:tabular-nums}
      dl{margin:0;display:grid;gap:6px}
      dl div{display:grid;grid-template-columns:66px minmax(0,1fr);gap:8px;align-items:baseline}
      dt{font-size:9px;line-height:1.4;letter-spacing:.035em;color:#aeb8a6;font-weight:600}
      dd{margin:0;font-size:11px;line-height:1.4;font-weight:550;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      .sold-actions{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto;padding-top:4px}
      .settlement{font-size:9px;line-height:1.3;font-weight:650;padding:5px 6px;background:#443b0c;color:#ffe56c;border:1px solid #7b6b20;border-radius:4px;white-space:nowrap}
      .settlement.closed{background:#133723;border-color:#32784d;color:#b5e6c7}
      .sold-actions button{background:#efc500;border:1px solid #ffe568;color:#171b11;font-family:inherit;font-size:10px;line-height:1.4;font-weight:750;padding:8px 9px;cursor:pointer;border-radius:4px;white-space:nowrap}

      button:focus-visible{outline:2px solid #fff;outline-offset:2px}
    `}</style>
  </section>;
}
