import { cleanMachineTitle } from "../../../lib/listingFormatters";
const clean = value => String(value ?? "").trim();
const displayDate = value => /^\d{4}-\d{2}-\d{2}$/.test(clean(value))
  ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`)) : "Not recorded";
export default function IXISoldFrontFace({ listing, photo, photoIndex, photoCount, onPhoto, onOpenTransact }) {
  const sale = listing.soldSummary;
  const price = sale.salePrice == null ? "Not recorded" : new Intl.NumberFormat("en-US", { style: "currency", currency: sale.currency || "USD", maximumFractionDigits: 2 }).format(sale.salePrice);
  return <section className="sold-front" aria-label={`Sold ${listing.title || sale.label}`}>
    <div className="sold-photo">
      {photo ? <img src={photo} alt={listing.title || sale.label} loading="lazy" draggable={false} /> : <div className="sold-photo-missing">PHOTO NOT AVAILABLE</div>}
      <strong className="sold-sign">SOLD</strong>
      {sale.status === "returned" ? <span className="returned">RETURNED TO INVENTORY</span> : null}
      {photoCount > 1 ? <><button type="button" className="previous" aria-label="Previous photo" onClick={event => onPhoto(event, -1)}>‹</button><button type="button" className="next" aria-label="Next photo" onClick={event => onPhoto(event, 1)}>›</button><span className="photo-position">{photoIndex + 1}/{photoCount}</span></> : null}
    </div>
    <div className="sold-facts">
      <h3>{cleanMachineTitle(listing.title || sale.label)}</h3>
      <div className="identity"><span>SN {listing.serialNumber || listing.publicData?.serialNumber || "—"}</span><span>{sale.passportId}</span></div>
      <div className="sale-price"><span>SALE PRICE</span><strong>{price}</strong></div>
      <dl><div><dt>DATE SOLD</dt><dd>{displayDate(sale.saleDate)}</dd></div><div><dt>BUYER</dt><dd title={sale.buyerLabel}>{sale.buyerLabel || "Not recorded"}</dd></div><div><dt>SOLD BY</dt><dd title={sale.soldByLabel}>{sale.soldByLabel || "Not recorded"}</dd></div></dl>
      <div className="sold-actions"><span className={`settlement ${sale.settlementStatus}`}>SETTLEMENT {sale.settlementStatus === "closed" ? "CLOSED" : "OPEN"}</span><button type="button" onClick={onOpenTransact} aria-label="Open sold machine TRANSACT">TRAN$ACT ↗</button></div>
    </div>
    <style jsx>{`
      .sold-front{height:calc(100% - 28px);min-height:0;display:flex;flex-direction:column;background:#10130f;color:#f3f4ee;overflow:hidden}
      .sold-photo{height:39%;min-height:135px;position:relative;flex-shrink:0;background:#171d17}.sold-photo img{width:100%;height:100%;object-fit:cover}.sold-photo-missing{height:100%;display:grid;place-items:center;color:#aab3a5;font-size:12px}
      .sold-sign{position:absolute;top:12px;left:12px;padding:4px 14px;background:#f1c400;color:#11150e;font-size:30px;font-weight:950;letter-spacing:2px;line-height:1.15;border:2px solid #15170f;box-shadow:0 2px 12px #0008}
      .returned{position:absolute;bottom:0;left:0;right:0;padding:5px;text-align:center;background:#151c15e8;color:#d4e8d5;font-size:10px;font-weight:800}
      .sold-photo button{position:absolute;top:47%;width:30px;height:36px;border:1px solid #fff4;background:#10180ebb;color:white;font-size:25px;border-radius:4px;cursor:pointer}.previous{left:7px}.next{right:7px}.photo-position{position:absolute;right:10px;top:10px;background:#111b;font-size:11px;padding:3px 7px;border-radius:10px}
      .sold-facts{flex:1;min-height:0;padding:11px 12px 5px;display:flex;flex-direction:column;gap:7px}.sold-facts h3{margin:0;font-size:17px;line-height:1.15;font-weight:850;overflow-wrap:anywhere}.identity{display:flex;justify-content:space-between;gap:5px;color:#afb7ac;font-size:10px;line-height:1.25;flex-wrap:wrap}
      .sale-price{display:flex;align-items:baseline;justify-content:space-between;gap:6px;padding:7px 0;border-top:1px solid #3e4433;border-bottom:1px solid #3e4433}.sale-price span{font-size:10px;font-weight:800;color:#bec7b7}.sale-price strong{font-size:25px;font-weight:850;letter-spacing:-.7px}
      dl{margin:0;display:grid;gap:6px}dl div{display:grid;grid-template-columns:64px minmax(0,1fr);gap:8px;align-items:baseline}dt{font-size:10px;color:#aeb8a6;font-weight:800}dd{margin:0;font-size:13px;line-height:1.2;font-weight:700;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      .sold-actions{display:flex;align-items:center;justify-content:space-between;gap:5px;margin-top:auto;padding-top:5px}.settlement{font-size:10px;font-weight:850;padding:5px;background:#443b0c;color:#ffe56c;border:1px solid #7b6b20;border-radius:3px}.settlement.closed{background:#133723;border-color:#32784d;color:#b5e6c7}.sold-actions button{background:#efc500;border:1px solid #ffe568;color:#171b11;font-size:11px;font-weight:900;padding:7px 8px;cursor:pointer;border-radius:3px}
      button:focus-visible{outline:2px solid #fff;outline-offset:2px}
    `}</style>
  </section>;
}
