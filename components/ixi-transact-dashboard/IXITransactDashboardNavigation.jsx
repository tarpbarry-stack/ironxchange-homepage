const GROUPS = [
  { label: "", items: [{ id: "executive", label: "EXECUTIVE", sub: "Company condition" }] },
  { label: "MONEY IN", items: [
    { id: "ar", label: "COLLECTIONS / A/R", sub: "Receivables · promises · disputes" },
    { id: "invoices", label: "CUSTOMER INVOICES", sub: "Revenue documents" },
    { id: "sales", label: "ASSET SALES", sub: "Proceeds · disposition" }
  ] },
  { label: "MONEY OUT", items: [
    { id: "ap", label: "PAYABLES / A/P", sub: "Bills · holds · payments" },
    { id: "bills", label: "BILLS / APPROVALS", sub: "Intake · match · authority" },
    { id: "purchase-orders", label: "PURCHASE ORDERS", sub: "Request · receive · close" }
  ] },
  { label: "CASH", items: [
    { id: "treasury", label: "TREASURY", sub: "Cash position · forecast" },
    { id: "reconciliation", label: "RECONCILIATION", sub: "Book · bank · difference" }
  ] },
  { label: "ACCOUNTING", items: [
    { id: "gl", label: "GENERAL LEDGER", sub: "Journal · controls" },
    { id: "close", label: "PERIOD CLOSE", sub: "Exceptions · readiness" }
  ] },
  { label: "REPORTING", items: [
    { id: "reporting", label: "FINANCIAL REPORTS", sub: "P&L · Balance · Cash Flow" },
    { id: "profitability", label: "PROFITABILITY", sub: "Asset · location · customer" }
  ] },
  { label: "OPERATIONS", items: [
    { id: "work-orders", label: "WORK ORDERS", sub: "Operational cost truth" },
    { id: "assets", label: "ASSETS", sub: "Passport economics" },
    { id: "service", label: "SERVICE", sub: "Quote · work · invoice" },
    { id: "rental", label: "RENTAL", sub: "Income · expense" }
  ] }
];

export default function IXITransactDashboardNavigation({ activeWorkspace = "executive", onSelect }) {
  return (
    <aside className="td-nav" aria-label="IXI TRAN$ACT navigation">
      <div className="td-nav-brand">
        <span>IXI</span>
        <strong>TRAN$ACT</strong>
        <small>FINANCIAL COMMAND</small>
      </div>
      <div className="td-nav-scroll">
        {GROUPS.map((group, groupIndex) => (
          <section className="td-nav-group" key={`${group.label}-${groupIndex}`}>
            {group.label ? <div className="td-nav-group-label">{group.label}</div> : null}
            {group.items.map(item => (
              <button
                type="button"
                key={item.id}
                className={`td-nav-item ${activeWorkspace === item.id ? "on" : ""}`}
                onClick={() => onSelect?.(item.id)}
              >
                <span>{item.label}</span>
                <small>{item.sub}</small>
              </button>
            ))}
          </section>
        ))}
      </div>
      <div className="td-nav-foot">
        <span className="td-live-dot" /> AWS IXI FINANCIAL
      </div>
    </aside>
  );
}
