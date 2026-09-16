import styles from "./IXITradeInSection.module.css";

const money = value => new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD",
}).format(Number(value || 0));

export default function IXITradeSummary({ trades = [] }) {
  if (!trades.length) return null;
  return <section className={styles.summary} aria-label="Invoice trade-ins">
    <h3>TRADE-INS</h3>
    {trades.map(trade => <div className={styles.summaryItem} key={trade.tradeId}>
      <strong>{trade.year} {trade.make} {trade.model}</strong>
      <span>SN {trade.serialNumber} · {trade.hours ?? "—"} HRS</span>
      <a href={`/p/${encodeURIComponent(trade.passportId)}`} target="_blank" rel="noopener noreferrer">
        PASSPORT {trade.passportId}
      </a>
      <b>ALLOWANCE {money(trade.allowance)}</b>
    </div>)}
  </section>;
}
