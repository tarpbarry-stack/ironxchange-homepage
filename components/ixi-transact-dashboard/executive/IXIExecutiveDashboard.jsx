const safeArray = value => Array.isArray(value) ? value : [];
const money = (value, currency = "USD") => value === null || value === undefined
  ? "—"
  : new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value));
const percent = value => value === null || value === undefined ? "—" : `${Number(value).toFixed(1)}%`;

function Kpi({ label, value, sub, state = "" }) {
  return (
    <button type="button" className={`td-kpi ${state}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{sub || "VERIFIED IXI FINANCIAL PROJECTION"}</small>
    </button>
  );
}

function MiniTrend({ rows = [], valueKey = "value" }) {
  const values = safeArray(rows)
    .map(item => Number(item?.[valueKey] ?? item?.value ?? item?.amount))
    .filter(Number.isFinite);
  if (values.length < 2) return <div className="td-chart-empty">PROJECTION SERIES NOT AVAILABLE</div>;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * 100;
    const y = 92 - ((value - min) / range) * 78;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg className="td-mini-chart" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function AttentionPanel({ items = [], currency = "USD", onOpenRecord }) {
  return (
    <section className="td-panel td-attention-panel">
      <div className="td-panel-head"><div><span>COMMAND QUEUE</span><strong>ATTENTION</strong></div><b>{items.length}</b></div>
      <div className="td-attention-list">
        {items.length ? items.slice(0, 12).map((item, index) => (
          <button
            type="button"
            className={`td-attention-item sev-${item.severity || "attention"}`}
            key={item.alertId || `${item.title}-${index}`}
            onClick={() => onOpenRecord?.(item)}
          >
            <i />
            <div>
              <strong>{item.title}</strong>
              <span>{item.detail || item.sourceRecordId || item.type}</span>
            </div>
            <b>{item.amount === null || item.amount === undefined ? item.actionLabel || "OPEN" : money(item.amount, currency)}</b>
          </button>
        )) : <div className="td-empty-state compact">NO ACTIVE ATTENTION ITEMS IN THIS PROJECTION</div>}
      </div>
    </section>
  );
}

export default function IXIExecutiveDashboard({ model, onOpenRecord }) {
  const currency = model?.currency || "USD";
  const kpis = model?.kpis || {};
  const position = model?.financialPosition || {};
  const control = model?.control || {};

  return (
    <div className="td-executive">
      <div className="td-workspace-title">
        <div><span>IXI TRAN$ACT · V13 DESKTOP</span><h1>EXECUTIVE COMMAND</h1></div>
        <div className="td-workspace-meta"><span>PROJECTION</span><strong>{model?.projectionVersion || "UNVERSIONED"}</strong></div>
      </div>

      <section className="td-kpi-strip">
        <Kpi label="REVENUE" value={money(kpis.revenue, currency)} />
        <Kpi label="NET INCOME" value={money(kpis.netIncome, currency)} sub={`MARGIN ${percent(kpis.netMargin)}`} state={kpis.netIncome !== null && kpis.netIncome < 0 ? "bad" : ""} />
        <Kpi label="CASH" value={money(kpis.cash, currency)} />
        <Kpi label="OPEN A/R" value={money(kpis.openAR, currency)} />
        <Kpi label="OPEN A/P" value={money(kpis.openAP, currency)} />
        <Kpi label="CLOSE CONTROL" value={control.closeReady ? "READY" : control.periodStatus ? control.periodStatus.toUpperCase() : "—"} state={control.closeReady ? "good" : ""} />
      </section>

      <div className="td-exec-grid">
        <section className="td-panel td-performance-panel">
          <div className="td-panel-head"><div><span>PERFORMANCE</span><strong>REVENUE + INCOME TREND</strong></div><small>SERVER PROJECTION</small></div>
          <div className="td-chart-stage"><MiniTrend rows={model?.revenueTrend} valueKey="revenue" /></div>
          <div className="td-panel-foot-grid">
            <div><span>REVENUE</span><b>{money(kpis.revenue, currency)}</b></div>
            <div><span>NET</span><b>{money(kpis.netIncome, currency)}</b></div>
            <div><span>MARGIN</span><b>{percent(kpis.netMargin)}</b></div>
          </div>
        </section>

        <AttentionPanel items={model?.attention || []} currency={currency} onOpenRecord={onOpenRecord} />

        <section className="td-panel td-cash-panel">
          <div className="td-panel-head"><div><span>LIQUIDITY</span><strong>CASH FORWARD POSITION</strong></div><small>TREASURY</small></div>
          <div className="td-chart-stage cash"><MiniTrend rows={model?.cashTrend} valueKey="endingCash" /></div>
          <div className="td-large-number"><span>BOOK CASH</span><strong>{money(kpis.cash, currency)}</strong></div>
        </section>

        <section className="td-panel td-profit-panel">
          <div className="td-panel-head"><div><span>OPERATING ECONOMICS</span><strong>TOP / BOTTOM PROFITABILITY</strong></div><small>DIMENSIONAL</small></div>
          <div className="td-profit-list">
            {safeArray(model?.profitability).length ? safeArray(model.profitability).slice(0, 8).map((item, index) => (
              <button type="button" key={item.key || item.passportId || index} onClick={() => onOpenRecord?.(item)}>
                <span>{item.label || item.name || item.key || item.passportId || "DIMENSION"}</span>
                <b className={Number(item.netIncome ?? item.net ?? 0) < 0 ? "negative" : ""}>{money(item.netIncome ?? item.net, currency)}</b>
                <small>{item.marginPercent !== undefined ? `${Number(item.marginPercent).toFixed(1)}% MARGIN` : item.dimension || "PROFITABILITY"}</small>
              </button>
            )) : <div className="td-empty-state compact">NO DIMENSIONAL PROFITABILITY PROJECTION</div>}
          </div>
        </section>
      </div>

      <section className="td-position-strip">
        <div><span>ASSETS</span><strong>{money(position.assets, currency)}</strong></div>
        <div><span>LIABILITIES</span><strong>{money(position.liabilities, currency)}</strong></div>
        <div><span>EQUITY</span><strong>{money(position.equity, currency)}</strong></div>
        <div><span>WORKING CAPITAL</span><strong>{money(position.workingCapital, currency)}</strong></div>
        <div><span>CURRENT RATIO</span><strong>{position.currentRatio === null || position.currentRatio === undefined ? "—" : Number(position.currentRatio).toFixed(2)}</strong></div>
        <div className={Number(control.postingExceptions || 0) > 0 ? "bad" : "good"}><span>POSTING EXCEPTIONS</span><strong>{control.postingExceptions ?? "—"}</strong></div>
      </section>
    </div>
  );
}
