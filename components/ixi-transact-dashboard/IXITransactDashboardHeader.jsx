const clean = value => String(value ?? "").trim();

export default function IXITransactDashboardHeader({
  entityLabel = "ENTITY REQUIRED",
  accountingPeriod = "",
  locationLabel = "ALL LOCATIONS",
  freshness = { label: "UNVERIFIED", state: "unknown" },
  generatedAt = "",
  attentionCount = 0,
  onRefresh,
  onSearch,
  searchValue = "",
  onSearchChange
}) {
  return (
    <header className="td-header">
      <div className="td-scope">
        <div className="td-scope-block">
          <span>ENTITY</span>
          <strong>{entityLabel}</strong>
        </div>
        <div className="td-scope-block">
          <span>PERIOD</span>
          <strong>{accountingPeriod || "SELECT PERIOD"}</strong>
        </div>
        <div className="td-scope-block td-scope-location">
          <span>LOCATION</span>
          <strong>{locationLabel}</strong>
        </div>
      </div>

      <div className="td-command-search">
        <span>⌘K</span>
        <input
          value={searchValue}
          onChange={event => onSearchChange?.(event.target.value)}
          onKeyDown={event => {
            if (event.key === "Enter") onSearch?.(event.currentTarget.value);
          }}
          placeholder="SEARCH RECORD, PASSPORT, CUSTOMER, VENDOR, WO, JE..."
          aria-label="Search IXI TRAN$ACT"
        />
      </div>

      <div className="td-header-actions">
        <button type="button" className="td-status" data-state={freshness.state} onClick={onRefresh}>
          <span className="td-live-dot" />
          <b>{freshness.label}</b>
          <small>{clean(generatedAt) ? new Date(generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "NO VERIFIED REFRESH"}</small>
        </button>
        <button type="button" className="td-attention-button">
          ATTENTION <b>{Number(attentionCount || 0)}</b>
        </button>
        <button type="button" className="td-user-button" aria-label="User and authority context">USER</button>
      </div>
    </header>
  );
}
