import { useMemo, useState } from "react";
import {
  createIXITreasuryAccount,
  validateIXITreasuryAccount,
  createIXITreasuryReconciliation,
  validateIXITreasuryReconciliation,
  hydrateIXITreasuryAccounts,
  hydrateIXITreasuryReconciliations,
} from "./IXITreasuryContract";
import { buildIXITreasuryProjection } from "./IXITreasuryProjectionEngine";
import {
  saveIXITreasuryAccount,
  postIXITreasuryOpeningBalance,
  postIXITreasuryAdjustment,
  postIXITreasuryTransfer,
  postIXITreasuryReconciliation,
} from "./IXITreasuryCommands";
import { getIXITreasuryPolicy } from "./IXITreasuryPolicyEngine";
import IXITreasuryStyles from "./IXITreasuryStyles";
const clean = (value) => String(value ?? "").trim();
const money = (value, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(Number(value || 0));
const today = () => new Date().toISOString().slice(0, 10);
const COPY = {
  en: {
    title: "CASH / TREASURY",
    sub: "Cash position · control · forecast",
    total: "TOTAL CASH",
    available: "AVAILABLE CASH",
    expected: "EXPECTED IN · 7D",
    out: "SCHEDULED OUT · 7D",
    accounts: "FINANCIAL ACCOUNTS",
    add: "+ ADD ACCOUNT",
    create: "CREATE ACCOUNT",
    opening: "OPENING BALANCE",
    activity: "ACCOUNT CONTROL",
    adjust: "ADJUST",
    transfer: "TRANSFER",
    reconcile: "RECONCILE",
    back: "‹ TREASURY",
  },
  es: {
    title: "CAJA / TESORERÍA",
    sub: "Posición de efectivo · control · pronóstico",
    total: "EFECTIVO TOTAL",
    available: "EFECTIVO DISPONIBLE",
    expected: "ENTRADAS · 7D",
    out: "SALIDAS · 7D",
    accounts: "CUENTAS FINANCIERAS",
    add: "+ AGREGAR CUENTA",
    create: "CREAR CUENTA",
    opening: "SALDO INICIAL",
    activity: "CONTROL DE CUENTA",
    adjust: "AJUSTAR",
    transfer: "TRANSFERIR",
    reconcile: "CONCILIAR",
    back: "‹ TESORERÍA",
  },
};
function Field({ label, children }) {
  return (
    <div className="tr-field">
      <label>{label}</label>
      {children}
    </div>
  );
}
const responseRecord = (response) =>
  response?.data?.record || response?.record || null;
export default function IXITreasuryApp({
  context = {},
  object = {},
  financialRecords = [],
  expectedInflows = [],
  scheduledOutflows = [],
  language = "en",
  onBack = null,
  onRecordChange = null,
  onFinancialRecordsChange = null,
}) {
  const [lang, setLang] = useState(language === "es" ? "es" : "en"),
    t = COPY[lang],
    [accounts, setAccounts] = useState([]),
    [reconciliations, setReconciliations] = useState([]),
    [localFinancial, setLocalFinancial] = useState([]),
    [mode, setMode] = useState("dashboard"),
    [selectedId, setSelectedId] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [accountInput, setAccountInput] = useState({
    name: "",
    accountType: "checking",
    institution: "",
    last4: "",
    currency: "USD",
    openingDate: today(),
    openingBalance: "",
    openingSource: "bank-statement",
    openingReference: "",
    minimumCash: "0",
  });
  const [action, setAction] = useState({
    kind: "adjust",
    amount: "",
    direction: "out",
    date: today(),
    reference: "",
    reason: "",
    toAccountId: "",
  });
  const [recon, setRecon] = useState({
    statementDate: today(),
    statementBalance: "",
    statementReference: "",
    depositsInTransit: "0",
    outstandingPayments: "0",
    otherReconcilingItems: "0",
    notes: "",
  });
  const records = useMemo(() => {
    const map = new Map();
    [
      ...(Array.isArray(financialRecords) ? financialRecords : []),
      ...localFinancial,
    ].forEach((record, index) => {
      const document =
          record?.financialDocument ||
          record?.record?.financialDocument ||
          record,
        key = clean(document?.financialDocumentId) || `local-${index}`;
      map.set(key, record);
    });
    return [...map.values()];
  }, [financialRecords, localFinancial]);
  const canonicalAccounts = useMemo(
      () => hydrateIXITreasuryAccounts(records),
      [records],
    ),
    canonicalReconciliations = useMemo(
      () => hydrateIXITreasuryReconciliations(records),
      [records],
    ),
    resolvedAccounts = useMemo(() => {
      const map = new Map(
        [...accounts, ...canonicalAccounts].map((item) => [
          clean(item.identity?.accountId),
          item,
        ]),
      );
      return [...map.values()];
    }, [accounts, canonicalAccounts]),
    resolvedReconciliations = useMemo(
      () =>
        [...reconciliations, ...canonicalReconciliations].filter(
          (item, index, list) =>
            list.findIndex(
              (candidate) =>
                clean(candidate.identity?.reconciliationId) ===
                clean(item.identity?.reconciliationId),
            ) === index,
        ),
      [reconciliations, canonicalReconciliations],
    ),
    policy = useMemo(() => getIXITreasuryPolicy({ context }), [context]);
  const projection = useMemo(
    () =>
      buildIXITreasuryProjection({
        accounts: resolvedAccounts,
        financialRecords: records,
        expectedInflows,
        scheduledOutflows,
      }),
    [resolvedAccounts, records, expectedInflows, scheduledOutflows],
  );
  const selected =
    projection.accounts.find((item) => item.accountId === selectedId) || null;
  async function notify(record, change) {
    await onRecordChange?.(record, change, context);
  }
  async function createAccount() {
    if (busy) return;
    if (!policy.canManageAccounts) {
      setError("Treasury account authority is required.");
      return;
    }
    const draft = createIXITreasuryAccount({ context, input: accountInput }),
      check = validateIXITreasuryAccount(draft);
    if (!check.valid) {
      setError(
        "Account name, opening date and valid opening balance are required.",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const created = await saveIXITreasuryAccount({
          object,
          context,
          account: draft,
        }),
        saved = created.account,
        createdRecord = responseRecord(created.response);
      if (createdRecord) setLocalFinancial((list) => [...list, createdRecord]);
      setAccounts((list) => [...list, saved]);
      let opening = { response: null, financialDocumentId: "" };
      if (Number(saved.opening.amount) !== 0) {
        opening = await postIXITreasuryOpeningBalance({
          object,
          context,
          account: saved,
          metadata: { source: "ixi-transact-treasury" },
        });
        const openingRecord = responseRecord(opening.response);
        if (openingRecord)
          setLocalFinancial((list) => [...list, openingRecord]);
      }
      await onFinancialRecordsChange?.();
      await notify(saved, {
        action: "create-account",
        financialResponse: created.response,
        openingFinancialResponse: opening.response,
      });
      setSelectedId(saved.identity.accountId);
      setMode("account");
    } catch (cause) {
      setError(
        clean(cause?.message) || "Treasury account could not be created.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function postAdjustment() {
    if (!selected || busy) return;
    if (!policy.canPostMovements) {
      setError("Treasury movement authority is required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await postIXITreasuryAdjustment({
          object,
          context,
          account: selected.account,
          input: action,
          metadata: { source: "ixi-transact-treasury" },
        }),
        record = responseRecord(result.response);
      if (record) setLocalFinancial((list) => [...list, record]);
      await onFinancialRecordsChange?.();
      await notify(selected.account, {
        action: "cash-adjustment",
        financialResponse: result.response,
        adjustment: {
          ...action,
          financialDocumentId: result.financialDocumentId,
        },
      });
      setAction((x) => ({ ...x, amount: "", reference: "", reason: "" }));
    } catch (cause) {
      setError(clean(cause?.message) || "Adjustment failed.");
    } finally {
      setBusy(false);
    }
  }
  async function postTransfer() {
    if (!selected || busy) return;
    if (!policy.canPostMovements) {
      setError("Treasury movement authority is required.");
      return;
    }
    const target = resolvedAccounts.find(
      (a) => a.identity?.accountId === action.toAccountId,
    );
    if (!target) {
      setError("Choose a destination account.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await postIXITreasuryTransfer({
          object,
          context,
          fromAccount: selected.account,
          toAccount: target,
          input: action,
          metadata: { source: "ixi-transact-treasury" },
        }),
        record = responseRecord(result.response);
      if (record) setLocalFinancial((list) => [...list, record]);
      await onFinancialRecordsChange?.();
      await notify(selected.account, {
        action: "transfer",
        financialResponse: result.response,
        transfer: {
          ...action,
          fromAccountId: selected.accountId,
          toAccountId: target.identity.accountId,
          financialDocumentId: result.financialDocumentId,
        },
      });
      setAction((x) => ({ ...x, amount: "", reference: "", toAccountId: "" }));
    } catch (cause) {
      setError(clean(cause?.message) || "Transfer failed.");
    } finally {
      setBusy(false);
    }
  }
  async function saveReconciliation() {
    if (!selected || busy) return;
    if (!policy.canReconcile) {
      setError("Treasury reconciliation authority is required.");
      return;
    }
    const draft = createIXITreasuryReconciliation({
        account: selected.account,
        input: { ...recon, bookBalance: selected.bookBalance },
      }),
      check = validateIXITreasuryReconciliation(draft);
    if (!check.valid) {
      setError("Statement date and balance are required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await postIXITreasuryReconciliation({
          object,
          context,
          account: selected.account,
          reconciliation: draft,
        }),
        record = responseRecord(result.response);
      if (record) setLocalFinancial((list) => [...list, record]);
      setReconciliations((list) => [...list, result.reconciliation]);
      await onFinancialRecordsChange?.();
      await notify(selected.account, {
        action: "reconciliation",
        reconciliation: result.reconciliation,
        financialResponse: result.response,
      });
      setRecon({
        statementDate: today(),
        statementBalance: "",
        statementReference: "",
        depositsInTransit: "0",
        outstandingPayments: "0",
        otherReconcilingItems: "0",
        notes: "",
      });
    } catch (cause) {
      setError(clean(cause?.message) || "Reconciliation failed.");
    } finally {
      setBusy(false);
    }
  }
  if (mode === "new")
    return (
      <div className="ixi-treasury">
        <div className="tr-head">
          <div>
            <div className="tr-kicker">IXI TRAN$ACT</div>
            <strong>{t.create}</strong>
            <small>
              OPENING BALANCE ESTABLISHES THE STARTING BOOK POSITION
            </small>
          </div>
          <button
            className="tr-back"
            onClick={() => {
              setMode("dashboard");
              setError("");
            }}
          >
            CANCEL
          </button>
        </div>
        <div className="tr-form">
          <Field label="ACCOUNT NAME *">
            <input
              value={accountInput.name}
              onChange={(e) =>
                setAccountInput((x) => ({ ...x, name: e.target.value }))
              }
              placeholder="Operating Checking"
            />
          </Field>
          <div className="tr-grid2">
            <Field label="TYPE">
              <select
                value={accountInput.accountType}
                onChange={(e) =>
                  setAccountInput((x) => ({
                    ...x,
                    accountType: e.target.value,
                  }))
                }
              >
                <option value="checking">CHECKING</option>
                <option value="savings">SAVINGS</option>
                <option value="cash">CASH</option>
                <option value="clearing">CLEARING</option>
                <option value="money-market">MONEY MARKET</option>
              </select>
            </Field>
            <Field label="CURRENCY">
              <select
                value={accountInput.currency}
                onChange={(e) =>
                  setAccountInput((x) => ({ ...x, currency: e.target.value }))
                }
              >
                <option>USD</option>
              </select>
            </Field>
          </div>
          <div className="tr-grid2">
            <Field label="INSTITUTION">
              <input
                value={accountInput.institution}
                onChange={(e) =>
                  setAccountInput((x) => ({
                    ...x,
                    institution: e.target.value,
                  }))
                }
                placeholder="First National"
              />
            </Field>
            <Field label="LAST 4">
              <input
                value={accountInput.last4}
                onChange={(e) =>
                  setAccountInput((x) => ({ ...x, last4: e.target.value }))
                }
                maxLength={4}
              />
            </Field>
          </div>
          <div className="tr-section">{t.opening}</div>
          <div className="tr-grid2">
            <Field label="AS OF *">
              <input
                type="date"
                value={accountInput.openingDate}
                onChange={(e) =>
                  setAccountInput((x) => ({
                    ...x,
                    openingDate: e.target.value,
                  }))
                }
              />
            </Field>
            <Field label="BOOK BALANCE *">
              <input
                inputMode="decimal"
                value={accountInput.openingBalance}
                onChange={(e) =>
                  setAccountInput((x) => ({
                    ...x,
                    openingBalance: e.target.value,
                  }))
                }
              />
            </Field>
          </div>
          <div className="tr-grid2">
            <Field label="SOURCE">
              <select
                value={accountInput.openingSource}
                onChange={(e) =>
                  setAccountInput((x) => ({
                    ...x,
                    openingSource: e.target.value,
                  }))
                }
              >
                <option value="bank-statement">BANK STATEMENT</option>
                <option value="cash-count">CASH COUNT</option>
                <option value="prior-ledger">PRIOR LEDGER</option>
              </select>
            </Field>
            <Field label="REFERENCE">
              <input
                value={accountInput.openingReference}
                onChange={(e) =>
                  setAccountInput((x) => ({
                    ...x,
                    openingReference: e.target.value,
                  }))
                }
              />
            </Field>
          </div>
          <Field label="MINIMUM / RESERVED CASH">
            <input
              inputMode="decimal"
              value={accountInput.minimumCash}
              onChange={(e) =>
                setAccountInput((x) => ({ ...x, minimumCash: e.target.value }))
              }
            />
          </Field>
          <div className="tr-callout">
            The opening balance is a one-time starting book position. It is
            posted to IXI Financial as a non-revenue, non-expense cash event.
            After creation, the balance is derived from transactions.
          </div>
          {error ? <div className="tr-error">{error}</div> : null}
          <button
            className="tr-primary"
            disabled={busy || !policy.canManageAccounts}
            onClick={createAccount}
          >
            {busy ? "POSTING..." : t.create}
          </button>
        </div>
        <IXITreasuryStyles />
      </div>
    );
  if (selected && mode === "account") {
    const latestRecon =
      resolvedReconciliations
        .filter((r) => r.accountId === selected.accountId)
        .slice(-1)[0] || null;
    return (
      <div className="ixi-treasury">
        <div className="tr-head">
          <div>
            <div className="tr-kicker">IXI TRAN$ACT</div>
            <strong>{t.activity}</strong>
            <small>
              {selected.name} · {selected.institution}{" "}
              {selected.last4 ? `••${selected.last4}` : ""}
            </small>
          </div>
          <button
            className="tr-back"
            onClick={() => {
              setMode("dashboard");
              setSelectedId("");
              setError("");
            }}
          >
            {t.back}
          </button>
        </div>
        <div className="tr-metrics">
          <div className="tr-metric good">
            <span>BOOK BALANCE</span>
            <strong>{money(selected.bookBalance, selected.currency)}</strong>
          </div>
          <div className="tr-metric">
            <span>AVAILABLE</span>
            <strong>{money(selected.availableCash, selected.currency)}</strong>
          </div>
          <div className="tr-metric">
            <span>STATEMENT</span>
            <strong>
              {selected.lastStatementBalance === null
                ? "—"
                : money(selected.lastStatementBalance, selected.currency)}
            </strong>
          </div>
          <div className="tr-metric">
            <span>LAST RECONCILED</span>
            <strong>{selected.lastReconciledAt || "—"}</strong>
          </div>
        </div>
        {latestRecon ? (
          <div className="tr-callout">
            LATEST RECON ·{" "}
            <b
              className={
                latestRecon.status === "reconciled" ? "tr-good" : "tr-bad"
              }
            >
              {latestRecon.status.toUpperCase()}
            </b>{" "}
            · DIFFERENCE{" "}
            {money(latestRecon.reconciling.difference, selected.currency)}
          </div>
        ) : null}
        <div className="tr-section">CASH MOVEMENT</div>
        <div className="tr-actions">
          <button
            className="tr-secondary"
            onClick={() => setAction((x) => ({ ...x, kind: "adjust" }))}
          >
            {t.adjust}
          </button>
          <button
            className="tr-secondary"
            onClick={() => setAction((x) => ({ ...x, kind: "transfer" }))}
          >
            {t.transfer}
          </button>
        </div>
        {action.kind === "adjust" ? (
          <>
            <div className="tr-grid2">
              <Field label="DIRECTION">
                <select
                  value={action.direction}
                  onChange={(e) =>
                    setAction((x) => ({ ...x, direction: e.target.value }))
                  }
                >
                  <option value="out">CASH OUT</option>
                  <option value="in">CASH IN</option>
                </select>
              </Field>
              <Field label="AMOUNT">
                <input
                  inputMode="decimal"
                  value={action.amount}
                  onChange={(e) =>
                    setAction((x) => ({ ...x, amount: e.target.value }))
                  }
                />
              </Field>
            </div>
            <div className="tr-grid2">
              <Field label="DATE">
                <input
                  type="date"
                  value={action.date}
                  onChange={(e) =>
                    setAction((x) => ({ ...x, date: e.target.value }))
                  }
                />
              </Field>
              <Field label="REFERENCE">
                <input
                  value={action.reference}
                  onChange={(e) =>
                    setAction((x) => ({ ...x, reference: e.target.value }))
                  }
                />
              </Field>
            </div>
            <Field label="REASON *">
              <input
                value={action.reason}
                onChange={(e) =>
                  setAction((x) => ({ ...x, reason: e.target.value }))
                }
                placeholder="Bank fee / interest / correction"
              />
            </Field>
            <button
              className="tr-primary"
              disabled={busy || !policy.canPostMovements}
              onClick={postAdjustment}
            >
              POST AUTHORIZED ADJUSTMENT
            </button>
          </>
        ) : (
          <>
            <Field label="TO ACCOUNT">
              <select
                value={action.toAccountId}
                onChange={(e) =>
                  setAction((x) => ({ ...x, toAccountId: e.target.value }))
                }
              >
                <option value="">SELECT ACCOUNT</option>
                {accounts
                  .filter((a) => a.identity?.accountId !== selected.accountId)
                  .map((a) => (
                    <option
                      key={a.identity.accountId}
                      value={a.identity.accountId}
                    >
                      {a.account.name}
                    </option>
                  ))}
              </select>
            </Field>
            <div className="tr-grid2">
              <Field label="AMOUNT">
                <input
                  inputMode="decimal"
                  value={action.amount}
                  onChange={(e) =>
                    setAction((x) => ({ ...x, amount: e.target.value }))
                  }
                />
              </Field>
              <Field label="DATE">
                <input
                  type="date"
                  value={action.date}
                  onChange={(e) =>
                    setAction((x) => ({ ...x, date: e.target.value }))
                  }
                />
              </Field>
            </div>
            <Field label="REFERENCE">
              <input
                value={action.reference}
                onChange={(e) =>
                  setAction((x) => ({ ...x, reference: e.target.value }))
                }
              />
            </Field>
            <button
              className="tr-primary"
              disabled={busy || !policy.canPostMovements}
              onClick={postTransfer}
            >
              POST INTERNAL TRANSFER
            </button>
          </>
        )}
        <div className="tr-section">{t.reconcile}</div>
        <div className="tr-grid2">
          <Field label="STATEMENT DATE">
            <input
              type="date"
              value={recon.statementDate}
              onChange={(e) =>
                setRecon((x) => ({ ...x, statementDate: e.target.value }))
              }
            />
          </Field>
          <Field label="STATEMENT BALANCE">
            <input
              inputMode="decimal"
              value={recon.statementBalance}
              onChange={(e) =>
                setRecon((x) => ({ ...x, statementBalance: e.target.value }))
              }
            />
          </Field>
        </div>
        <div className="tr-grid2">
          <Field label="DEPOSITS IN TRANSIT">
            <input
              inputMode="decimal"
              value={recon.depositsInTransit}
              onChange={(e) =>
                setRecon((x) => ({ ...x, depositsInTransit: e.target.value }))
              }
            />
          </Field>
          <Field label="OUTSTANDING PAYMENTS">
            <input
              inputMode="decimal"
              value={recon.outstandingPayments}
              onChange={(e) =>
                setRecon((x) => ({ ...x, outstandingPayments: e.target.value }))
              }
            />
          </Field>
        </div>
        <Field label="OTHER RECONCILING ITEMS">
          <input
            inputMode="decimal"
            value={recon.otherReconcilingItems}
            onChange={(e) =>
              setRecon((x) => ({ ...x, otherReconcilingItems: e.target.value }))
            }
          />
        </Field>
        {error ? <div className="tr-error">{error}</div> : null}
        <button
          className="tr-secondary"
          disabled={busy || !policy.canReconcile}
          onClick={saveReconciliation}
        >
          SAVE RECONCILIATION
        </button>
        <div className="tr-foot">
          Reconciliation compares bank/physical cash to IXI book cash. It never
          silently edits the ledger balance.
        </div>
        <IXITreasuryStyles />
      </div>
    );
  }
  return (
    <div className="ixi-treasury">
      <div className="tr-head">
        <div>
          <div className="tr-kicker">IXI TRAN$ACT</div>
          <strong>{t.title}</strong>
          <small>{t.sub} · AWS IXI FINANCIAL</small>
        </div>
        <button
          className="tr-lang"
          onClick={() => setLang(lang === "en" ? "es" : "en")}
        >
          {lang === "en" ? "ESP" : "ENG"}
        </button>
      </div>
      <div className="tr-metrics">
        <div className="tr-metric good">
          <span>{t.total}</span>
          <strong>{money(projection.totalCash)}</strong>
        </div>
        <div className="tr-metric">
          <span>{t.available}</span>
          <strong>{money(projection.availableCash)}</strong>
        </div>
        <div className="tr-metric good">
          <span>{t.expected}</span>
          <strong>{money(projection.expectedIn7)}</strong>
        </div>
        <div className="tr-metric warn">
          <span>{t.out}</span>
          <strong>{money(projection.scheduledOut7)}</strong>
        </div>
      </div>
      <div className="tr-section">FORECAST</div>
      <div className="tr-forecast">
        {projection.forecasts.map((f) => (
          <div key={f.days}>
            <span>{f.days} DAYS</span>
            <b className={f.endingCash < 0 ? "tr-bad" : ""}>
              {money(f.endingCash)}
            </b>
          </div>
        ))}
      </div>
      <div className="tr-section">{t.accounts}</div>
      {projection.accounts.map((item) => (
        <button
          className="tr-account"
          key={item.accountId}
          onClick={() => {
            setSelectedId(item.accountId);
            setMode("account");
          }}
        >
          <div className="tr-account-top">
            <strong>{item.name}</strong>
            <b>{money(item.bookBalance, item.currency)}</b>
          </div>
          <small>
            {item.type.toUpperCase()} · {item.institution || "CASH"}
            {item.last4 ? ` · ••${item.last4}` : ""} · AVAILABLE{" "}
            {money(item.availableCash, item.currency)}
          </small>
        </button>
      ))}
      {!projection.accounts.length ? (
        <div className="tr-callout">
          NO FINANCIAL ACCOUNTS CONFIGURED. Create the first Bank or Cash
          account and establish its opening balance.
        </div>
      ) : null}
      <button
        className="tr-primary"
        disabled={!policy.canManageAccounts}
        onClick={() => {
          setMode("new");
          setError("");
        }}
      >
        {t.add}
      </button>
      <button className="tr-secondary" onClick={() => onBack?.()}>
        ‹ TRAN$ACT
      </button>
      <div className="tr-foot">
        Opening balance + canonical cash in − canonical cash out ± authorized
        adjustments = IXI book cash. Transfers move cash between accounts
        without changing company-level cash.
      </div>
      <IXITreasuryStyles />
    </div>
  );
}
