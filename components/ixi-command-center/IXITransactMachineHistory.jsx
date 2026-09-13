import { useEffect, useMemo, useState } from "react";
import {
  buildMachineLedger,
  filterMachineLedger,
  moneyLabel,
} from "./IXITransactMachineLedger.mjs";
import IXITransactDocumentActions from "./IXITransactDocumentActions";
import styles from "./IXITransactWorkspace.module.css";

const pageSize = 50;
export default function IXITransactMachineHistory({
  records,
  context,
  entity,
  currency = "USD",
  loading,
  error,
  onOpenRecord,
  onMarkPaid,
  onRetry,
}) {
  const [filters, setFilters] = useState({
    query: "",
    from: "",
    to: "",
    type: "",
    effect: "",
    direction: "desc",
  });
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(0);
  const [unit, setUnit] = useState(currency);
  const ledger = useMemo(
    () =>
      buildMachineLedger(records, { passportId: context.passportId, currency }),
    [records, context.passportId, currency],
  );
  const filtered = useMemo(
    () => filterMachineLedger(ledger.rows, filters),
    [ledger.rows, filters],
  );
  const selectedRows = ledger.rows.filter((row) => selected.has(row.id));
  const total = ledger.totals[unit] || ledger.totals[ledger.currencies[0]];
  const displayCurrency = ledger.totals[unit] ? unit : ledger.currencies[0];
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const paged = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);
  useEffect(() => setPage(0), [filters]);
  const setFilter = (key, value) =>
    setFilters((current) => ({ ...current, [key]: value }));
  function toggle(id) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  const allSelected =
    filtered.length > 0 && filtered.every((row) => selected.has(row.id));
  const tile = (label, key, effect, detail) => (
    <button
      type="button"
      className={styles.metric}
      data-active={filters.effect === effect}
      onClick={() =>
        setFilter("effect", filters.effect === effect ? "" : effect)
      }
    >
      <span>{label}</span>
      <strong>
        {loading || error
          ? "—"
          : key === "hours"
            ? `${total.hours.toLocaleString("en-US", { maximumFractionDigits: 4 })} h`
            : moneyLabel(total[key], displayCurrency)}
      </strong>
      <small>{detail}</small>
    </button>
  );
  return (
    <section
      className={styles.history}
      aria-label="Machine transaction history"
    >
      <div className={styles.historyHeading}>
        <div>
          <span>LIFETIME FINANCIAL POSITION</span>
          <h2>TRANSACTION HISTORY</h2>
          <p>Recorded costs, revenue and cash for {context.title}.</p>
        </div>
        {ledger.currencies.length > 1 ? (
          <label>
            CURRENCY
            <select
              value={displayCurrency}
              onChange={(event) => setUnit(event.target.value)}
            >
              {ledger.currencies.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      <div className={styles.metrics}>
        {tile(
          "RECORDED MACHINE COST",
          "costCents",
          "cost",
          "Acquisition + recognized costs − credits",
        )}
        {tile(
          "INVOICED REVENUE",
          "revenueCents",
          "revenue",
          "Excludes stated tax and unbilled contracts",
        )}
        {tile(
          "MONEY RECEIVED",
          "receivedCents",
          "received",
          "Recorded cash receipts",
        )}
        {tile(
          "CUSTOMER BALANCE",
          "receivableCents",
          "receivable",
          "Open invoices after payments and credits",
        )}
        {tile(
          "UNPAID COSTS",
          "payableCents",
          "payable",
          "Bills, unpaid expenses and reimbursements",
        )}
        {tile(
          "PENDING COSTS",
          "pendingCents",
          "pending",
          "Separate until approved / recognized",
        )}
        {tile("LABOR TIME", "hours", "hours", "Recorded time entries")}
        <div className={styles.metric}>
          <span>RECORDED MARGIN</span>
          <strong>
            {loading || error
              ? "—"
              : moneyLabel(total.marginCents, displayCurrency)}
          </strong>
          <small>Invoiced revenue less recorded machine costs</small>
        </div>
      </div>
      <p className={styles.basis}>
        Lifetime totals stay visible when you filter the records. Recorded
        margin is a machine performance view; ledger profit may differ.
      </p>
      {!loading && !error && ledger.warnings.length ? (
        <div className={styles.notice}>
          <button type="button" onClick={() => setFilter("effect", "review")}>
            REVIEW {ledger.reviewRows.length} RECORDS
          </button>
          {ledger.warnings.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      ) : null}
      <div className={styles.filters}>
        <label className={styles.search}>
          SEARCH RECORDS
          <input
            type="search"
            value={filters.query}
            placeholder="Record, party, amount description or ID…"
            onChange={(event) => setFilter("query", event.target.value)}
          />
        </label>
        <label>
          TYPE
          <select
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
        </label>
        <label>
          FROM
          <input
            type="date"
            value={filters.from}
            onChange={(event) => setFilter("from", event.target.value)}
          />
        </label>
        <label>
          THROUGH
          <input
            type="date"
            min={filters.from}
            value={filters.to}
            onChange={(event) => setFilter("to", event.target.value)}
          />
        </label>
        <label>
          ORDER
          <select
            value={filters.direction}
            onChange={(event) => setFilter("direction", event.target.value)}
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() =>
            setFilters({
              query: "",
              from: "",
              to: "",
              type: "",
              effect: "",
              direction: "desc",
            })
          }
        >
          CLEAR FILTERS
          {filters.effect ? ` · ${filters.effect.toUpperCase()}` : ""}
        </button>
      </div>
      <IXITransactDocumentActions
        rows={filtered}
        allRows={ledger.rows}
        selectedRows={selectedRows}
        context={context}
        entity={entity}
        ledger={ledger}
        disabled={loading || Boolean(error)}
      />
      {error ? (
        <div role="alert" className={styles.notice}>
          <p>{error}</p>
          <button type="button" onClick={onRetry}>
            RETRY HISTORY
          </button>
        </div>
      ) : loading ? (
        <p role="status">Loading lifetime financial history…</p>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>
                    <input
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
                    />
                  </th>
                  <th>DATE / RECORD</th>
                  <th>PARTY / STATUS</th>
                  <th>COST</th>
                  <th>REVENUE</th>
                  <th>RECEIVED</th>
                  <th>RUNNING COST</th>
                  <th aria-label="Open transaction" />
                </tr>
              </thead>
              <tbody>
                {paged.map((row) => (
                  <tr key={row.id} data-review={row.review}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Select ${row.title}`}
                        checked={selected.has(row.id)}
                        onChange={() => toggle(row.id)}
                      />
                    </td>
                    <td>
                      <span>{row.date || "Date missing"}</span>
                      <strong>{row.title}</strong>
                      <small>
                        {row.type} · {row.id}
                      </small>
                    </td>
                    <td>
                      <strong>{row.party || "—"}</strong>
                      <span>{row.paymentStatus || row.status}</span>
                      <small>
                        {row.review
                          ? row.reason
                          : row.pendingCents
                            ? `Pending ${moneyLabel(row.pendingCents, row.currency)}`
                            : row.reason}
                      </small>
                    </td>
                    <td>
                      {row.costCents
                        ? moneyLabel(row.costCents, row.currency)
                        : "—"}
                    </td>
                    <td>
                      {row.revenueCents
                        ? moneyLabel(row.revenueCents, row.currency)
                        : "—"}
                    </td>
                    <td>
                      {row.receivedCents
                        ? moneyLabel(row.receivedCents, row.currency)
                        : "—"}
                    </td>
                    <td>{moneyLabel(row.runningCostCents, row.currency)}</td>
                    <td>
                      {row.paymentAction && onMarkPaid ? (
                        <button
                          type="button"
                          onClick={() => onMarkPaid(row.id)}
                        >
                          {row.paymentAction}
                        </button>
                      ) : null}
                      <button type="button" onClick={() => onOpenRecord(row)}>
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
                : "No financial transactions have been recorded for this Passport."}
            </p>
          ) : null}
          <div className={styles.pagination}>
            <span>
              {filtered.length} records · {selectedRows.length} selected · Page{" "}
              {safePage + 1} of {pageCount}
            </span>
            <div className={styles.actions}>
              <button
                type="button"
                disabled={safePage === 0}
                onClick={() => setPage(safePage - 1)}
              >
                PREVIOUS
              </button>
              <button
                type="button"
                disabled={safePage + 1 >= pageCount}
                onClick={() => setPage(safePage + 1)}
              >
                NEXT
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
