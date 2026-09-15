import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildMachineLedger,
  filterMachineLedger,
  moneyLabel,
} from "./IXITransactMachineLedger.mjs";
import { historyBalanceDisplay, transactionDisplayTitle } from "./IXITransactDisplay.mjs";
import IXITransactDocumentActions from "./IXITransactDocumentActions";
import IXIPaymentStatusBadge from "../ixi-aos/transact/payments/IXIPaymentStatusBadge";
import styles from "./IXITransactWorkspace.module.css";

const defaults = {
  query: "",
  from: "",
  to: "",
  type: "",
  status: "",
  effect: "",
  direction: "desc",
};
const pageSize = 50;
const paymentStatus = (row) =>
  /PART/.test(row.paymentStatus || "")
    ? "PARTIAL"
    : row.paymentStatus || row.status;
export default function IXITransactMachineHistory({
  records,
  context,
  entity,
  currency = "USD",
  loading,
  refreshing = false,
  error,
  onOpenRecord,
  onMarkPaid,
  onRetry,
  recordCache,
  active = true,
  savedState = {},
}) {
  const [filters, setFilters] = useState(() => ({
    ...defaults,
    ...savedState.filters,
  }));
  const [selected, setSelected] = useState(
    () => new Set(savedState.selected || []),
  );
  const [page, setPage] = useState(savedState.page || 0);
  const [unit, setUnit] = useState(savedState.unit || currency);
  const [columns, setColumns] = useState(savedState.columns || []);
  const [help, setHelp] = useState(false);
  const table = useRef(null);
  const ledger = useMemo(
    () =>
      buildMachineLedger(records, { passportId: context.passportId, currency }),
    [records, context.passportId, currency],
  );
  const filtered = useMemo(
    () =>
      filterMachineLedger(ledger.rows, filters).filter(
        (row) => !filters.status || paymentStatus(row) === filters.status,
      ),
    [ledger.rows, filters],
  );
  const selectedRows = ledger.rows.filter((row) => selected.has(row.id));
  const total = ledger.totals[unit] || ledger.totals[ledger.currencies[0]];
  const displayCurrency = ledger.totals[unit] ? unit : ledger.currencies[0];
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const paged = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const [visibleStart, setVisibleStart] = useState(0);
  const preloadIds = paged
    .slice(visibleStart, visibleStart + 16)
    .map((row) => row.id)
    .join("|");
  useEffect(() => {
    if (active && !loading && !refreshing && !error)
      recordCache?.prefetch(preloadIds.split("|").filter(Boolean));
    else recordCache?.cancelPrefetch();
  }, [recordCache, preloadIds, loading, refreshing, error, active]);
  useEffect(() => () => recordCache?.cancelPrefetch(), [recordCache]);
  useEffect(() => {
    Object.assign(savedState, {
      filters,
      selected: [...selected],
      page: safePage,
      unit,
      columns,
    });
  }, [savedState, filters, selected, safePage, unit, columns]);
  useEffect(() => {
    if (!loading && table.current)
      table.current.scrollTop = savedState.scroll || 0;
  }, [loading, savedState]);
  const setFilter = (key, value) => {
    setPage(0);
    setVisibleStart(0);
    setFilters((current) => ({ ...current, [key]: value }));
  };
  const toggle = (id) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allSelected =
    filtered.length > 0 && filtered.every((row) => selected.has(row.id));
  const tile = (label, key, effect) => (
    <button
      type="button"
      className={styles.metric}
      data-active={filters.effect === effect}
      aria-pressed={filters.effect === effect}
      onClick={() =>
        setFilter("effect", filters.effect === effect ? "" : effect)
      }
    >
      <span>{label}</span>
      <strong>
        {loading
          ? "—"
          : key === "hours"
            ? `${total.hours.toLocaleString("en-US", { maximumFractionDigits: 4 })} h`
            : moneyLabel(total[key], displayCurrency)}
      </strong>
    </button>
  );
  const optionalColumns = [
    ["costCents", "Cost"],
    ["revenueCents", "Revenue"],
    ["receivedCents", "Received"],
    ["runningCostCents", "Running cost"],
  ];
  return (
    <section
      className={styles.history}
      aria-label="Machine transaction history"
    >
      <div className={styles.historyHeading}>
        <span>LIFETIME TOTALS · {displayCurrency}</span>
        {ledger.currencies.length > 1 ? (
          <select
            aria-label="Summary currency"
            value={displayCurrency}
            onChange={(event) => setUnit(event.target.value)}
          >
            {ledger.currencies.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        ) : null}
      </div>
      <div className={styles.metrics}>
        {tile("COST", "costCents", "cost")}
        {tile("INVOICED", "revenueCents", "revenue")}
        {tile("MONEY RECEIVED", "receivedCents", "received")}
        <button
          type="button"
          className={styles.metric}
          title="How totals work"
          onClick={() => setHelp((value) => !value)}
          aria-expanded={help}
        >
          <span>MARGIN · ⓘ</span>
          <strong>
            {loading
              ? "—"
              : moneyLabel(total.marginCents, displayCurrency)}
          </strong>
        </button>
        {tile("CUSTOMER BALANCE", "receivableCents", "receivable")}
        {tile("UNPAID COSTS", "payableCents", "payable")}
        {tile("PENDING COSTS", "pendingCents", "pending")}
        {tile("LABOR", "hours", "hours")}
      </div>
      {help ? (
        <div className={styles.basis}>
          <strong>Lifetime totals stay unchanged by list filters.</strong>
          <p>
            Cost includes acquisition and recognized costs, less credits.
            Invoiced revenue excludes stated tax and unbilled contracts. Money
            received is recorded receipts. Customer balance and unpaid costs use
            saved payments and credits. Pending costs remain separate until
            recognized. Labor uses saved time entries.
          </p>
          <p>
            Margin = invoiced revenue − recorded cost
            {!loading && !error
              ? `: ${moneyLabel(total.revenueCents, displayCurrency)} − ${moneyLabel(total.costCents, displayCurrency)} = ${moneyLabel(total.marginCents, displayCurrency)}`
              : ""}
            . This machine performance measure may differ from ledger profit.
          </p>
        </div>
      ) : null}
      {!loading && !error && ledger.warnings.length ? (
        <details className={styles.notice}>
          <summary>
            {ledger.reviewRows.length} records need review · totals include
            classified effects
          </summary>
          <button type="button" onClick={() => setFilter("effect", "review")}>
            Show records to review
          </button>
          {ledger.warnings.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </details>
      ) : null}
      <div className={styles.filters}>
        <input
          className={styles.search}
          type="search"
          aria-label="Search records"
          value={filters.query}
          placeholder="Search records…"
          onChange={(event) => setFilter("query", event.target.value)}
        />
        <select
          aria-label="Transaction type"
          value={filters.type}
          onChange={(event) => setFilter("type", event.target.value)}
        >
          <option value="">All types</option>
          {[...new Set(ledger.rows.map((row) => row.type))]
            .sort()
            .map((type) => (
              <option key={type} value={type}>
                {type.replaceAll("-", " ")}
              </option>
            ))}
        </select>
        <select
          aria-label="Payment status"
          value={filters.status}
          onChange={(event) => setFilter("status", event.target.value)}
        >
          <option value="">All statuses</option>
          {[...new Set(ledger.rows.map(paymentStatus))]
            .filter(Boolean)
            .sort()
            .map((status) => (
              <option key={status}>{status}</option>
            ))}
        </select>
        <details className={styles.popover}>
          <summary>Dates{filters.from || filters.to ? " •" : ""}</summary>
          <div>
            <label>
              From
              <input
                type="date"
                value={filters.from}
                onChange={(event) => setFilter("from", event.target.value)}
              />
            </label>
            <label>
              Through
              <input
                type="date"
                min={filters.from}
                value={filters.to}
                onChange={(event) => setFilter("to", event.target.value)}
              />
            </label>
            <label>
              Order
              <select
                value={filters.direction}
                onChange={(event) => setFilter("direction", event.target.value)}
              >
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
            </label>
          </div>
        </details>
        <details className={styles.popover}>
          <summary>Columns</summary>
          <div>
            {optionalColumns.map(([key, label]) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={columns.includes(key)}
                  onChange={() =>
                    setColumns((value) =>
                      value.includes(key)
                        ? value.filter((item) => item !== key)
                        : [...value, key],
                    )
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </details>
        <IXITransactDocumentActions
          compact
          rows={filtered}
          allRows={ledger.rows}
          selectedRows={selectedRows}
          context={context}
          entity={entity}
          ledger={ledger}
          disabled={loading || refreshing || Boolean(error)}
        />
      </div>
      {Object.entries(filters).some(
        ([key, value]) => value !== defaults[key],
      ) ? (
        <div className={styles.filterStatus}>
          <span>
            {filtered.length} matching records
            {filters.effect ? ` · ${filters.effect.toUpperCase()}` : ""} ·
            totals above are lifetime
          </span>
          <button
            type="button"
            onClick={() => {
              setFilters({ ...defaults });
              setPage(0);
            }}
          >
            Clear filters
          </button>
        </div>
      ) : null}
      {error ? (
        <div role="alert" className={styles.notice}>
          <p>{error}{!loading ? " Showing last-known transactions. Balances need refresh; any confirmed save remains saved." : ""}</p>
          <button type="button" onClick={onRetry}>
            RETRY HISTORY
          </button>
        </div>
      ) : refreshing && !loading ? <p role="status" className={styles.notice}>Updating balances · showing last-known transactions…</p> : null}
      {loading ? (
        <p role="status" className={styles.empty}>
          Loading transaction history…
        </p>
      ) : (
        <>
          <div
            className={styles.tableWrap}
            ref={table}
            onScroll={(event) => {
              savedState.scroll = event.currentTarget.scrollTop;
              const top = event.currentTarget.getBoundingClientRect().top;
              const rows = [
                ...event.currentTarget.querySelectorAll("tbody tr"),
              ];
              const first = rows.findIndex(
                (row) => row.getBoundingClientRect().bottom > top + 36,
              );
              setVisibleStart(Math.max(0, first));
            }}
          >
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>
                    <label className={styles.rowSelect}><input
                      type="checkbox"
                      aria-label="Select all filtered transactions"
                      checked={allSelected}
                      onChange={() =>
                        setSelected((current) => {
                          const next = new Set(current);
                          filtered.forEach((row) =>
                            allSelected
                              ? next.delete(row.id)
                              : next.add(row.id),
                          );
                          return next;
                        })
                      }
                    /></label>
                  </th>
                  <th>Date / Number</th>
                  <th>Party</th>
                  <th className={styles.money}>Amount</th>
                  <th className={styles.money}>Balance</th>
                  <th>Status</th>
                  {optionalColumns
                    .filter(([key]) => columns.includes(key))
                    .map(([key, label]) => (
                      <th className={styles.money} key={key}>
                        {label}
                      </th>
                    ))}
                  <th aria-label="Open transaction" />
                </tr>
              </thead>
              <tbody>
                {paged.map((row) => (
                  <tr key={row.id} data-review={row.review}>
                    <td>
                      <label className={styles.rowSelect}><input
                        type="checkbox"
                        aria-label={`Select ${transactionDisplayTitle(row.document, row.title)}`}
                        checked={selected.has(row.id)}
                        onChange={() => toggle(row.id)}
                      /></label>
                    </td>
                    <td>
                      <span>{row.date || "Date missing"}</span>
                      <strong>
                        {transactionDisplayTitle(row.document, row.title)}
                      </strong>
                    </td>
                    <td>
                      <strong>{row.party || "—"}</strong>
                      {row.review ? (
                        <small title={row.reason}>Review required</small>
                      ) : null}
                    </td>
                    <td className={styles.money}>
                      {row.amountCents == null
                        ? "—"
                        : moneyLabel(row.amountCents, row.currency)}
                    </td>
                    <td className={styles.money} title={historyBalanceDisplay(row).description} aria-label={historyBalanceDisplay(row).description}>
                      {row.openCents == null || row.openCents === 0
                        ? historyBalanceDisplay(row).label
                        : moneyLabel(row.openCents, row.currency)}
                    </td>
                    <td>
                      <IXIPaymentStatusBadge status={paymentStatus(row)} kind={row.paymentStatus || ["PAID", "UNPAID", "PARTIAL", "DUE", "OVERDUE"].includes(paymentStatus(row)) ? "payment" : "transaction"} />
                    </td>
                    {optionalColumns
                      .filter(([key]) => columns.includes(key))
                      .map(([key]) => (
                        <td className={styles.money} key={key}>
                          {moneyLabel(row[key], row.currency)}
                        </td>
                      ))}
                    <td>
                      <button
                        type="button"
                        aria-label={`View ${transactionDisplayTitle(row.document, row.title)}`}
                        onPointerEnter={() =>
                          recordCache
                            ?.load(row.id, { foreground: false })
                            .catch(() => {})
                        }
                        onFocus={() =>
                          recordCache
                            ?.load(row.id, { foreground: false })
                            .catch(() => {})
                        }
                        onClick={() => onOpenRecord(row)}
                      >
                        VIEW
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!filtered.length ? (
            <p className={styles.empty}>
              {ledger.rows.length
                ? "No transactions match these filters."
                : "No transactions have been recorded for this Passport."}
            </p>
          ) : null}
          <div className={styles.pagination}>
            <span>
              {filtered.length} records · {selectedRows.length} selected · Page{" "}
              {safePage + 1} of {pageCount}
            </span>
            <div className={styles.actions}>
              {selectedRows.length === 1 &&
              selectedRows[0].paymentAction &&
              onMarkPaid ? (
                <button
                  type="button"
                  disabled={refreshing || Boolean(error)}
                  onClick={() => onMarkPaid(selectedRows[0].id)}
                >
                  {selectedRows[0].paymentAction}
                </button>
              ) : null}
              <button
                type="button"
                disabled={safePage === 0}
                onClick={() => setPage(safePage - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                disabled={safePage + 1 >= pageCount}
                onClick={() => setPage(safePage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
