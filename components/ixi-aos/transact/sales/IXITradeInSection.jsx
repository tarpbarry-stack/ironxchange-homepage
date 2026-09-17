import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { orderTradeFromRow as asTrade, saveTradeInOrder } from "./IXITradeSaveWorkflow";
import IXIMachineCard from "../../../ixi-machine-card/IXIMachineCard";
import IXIAssetAcquisitionApp from "../modules/asset-acquisition/IXIAssetAcquisitionApp";
import IXIMoneyInput from "../IXIMoneyInput";
import { runIXIActionNoticeLifecycle } from "../../../ixi-object-system/IXIActionNoticeEngine";
import styles from "./IXITradeInSection.module.css";

const clean = (value) => String(value ?? "").trim();
const money = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
const fresh = () => ({
  tradeId: crypto.randomUUID(),
  year: "",
  make: "",
  model: "",
  hours: "",
  serialNumber: "",
  location: "",
  allowance: "",
  existingListingId: "",
  effectiveDate: new Date().toISOString().slice(0, 10),
  reason: "Trade omitted from issued invoice",
});
async function request(input, method = "POST") {
  const response = await fetch(
    `/api/ixi/onboarding/trades${method === "GET" ? `?${new URLSearchParams(input)}` : ""}`,
    {
      method,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      ...(method === "POST" ? { body: JSON.stringify(input) } : {}),
    },
  );
  const result = await response.json();
  if (!response.ok)
    throw new Error(
      typeof result.error === "string"
        ? result.error
        : result.error?.message || "Trade could not be saved.",
    );
  return result;
}
const IXITradeInSection = forwardRef(function IXITradeInSection({
  record,
  context,
  locked,
  ensureOrder,
  onTradesChange,
  correctionMode = false,
  correctionTrades = [],
  onCorrectTrade,
  maximumAllowance,
  form,
  onFormChange: setForm,
  closeoutMode = false,
  onReadyChange,
}, ref) {
  const [rows, setRows] = useState([]),
    [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const [error, setError] = useState(""),
    [acquiring, setAcquiring] = useState(null),
    [choices, setChoices] = useState(null);
  const [acquisitionRecord, setAcquisitionRecord] = useState(null);
  const [rowsLoaded, setRowsLoaded] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [page, setPage] = useState(1),
    [hasMore, setHasMore] = useState(false),
    [search, setSearch] = useState("");
  const dealId = record?.identity?.dealId;
  const outgoingPassportId = context?.primary?.passportId;
  const trades = [...(record?.trades || []), ...correctionTrades];
  const scope = { dealId, outgoingPassportId };
  const acquisitionsReady = rowsLoaded && !busy && trades.every(trade => rows.some(row =>
    row.tradeId === trade.tradeId && row.passportId === trade.passportId && row.status === "acquired" && row.acquisitionId && row.inventoryStatus === "complete"));
  useEffect(() => { onReadyChange?.(acquisitionsReady); }, [acquisitionsReady, onReadyChange]);
  useImperativeHandle(ref, () => ({ savePendingTrade: () => add(), hasPendingTrade: Boolean(form) }));
  useEffect(() => {
    if (!dealId || !outgoingPassportId) return;
    let active = true;
    setRowsLoaded(false);
    const refresh = () =>
      request({ dealId, outgoingPassportId }, "GET")
        .then((result) => {
          if (active) { setRows(result.rows || []); setRowsLoaded(true); setError(""); }
        })
        .catch((caught) => {
          if (active) { setError(caught.message); setRowsLoaded(false); }
        });
    refresh();
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
    };
  }, [dealId, outgoingPassportId, refreshVersion]);

  async function existing(nextPage = 1) {
    setBusy(true);
    setError("");
    try {
      const result = await request({ mode: "existing", page: nextPage }, "GET");
      setChoices((current) =>
        nextPage === 1
          ? result.listings
          : [...(current || []), ...result.listings],
      );
      setPage(nextPage);
      setHasMore(nextPage < result.meta.totalPages);
    } catch (caught) {
      setError(caught.message);
    } finally {
      setBusy(false);
    }
  }
  async function add(value = form) {
    if (!value || saving.current || locked) return null;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      if (correctionMode) {
        if (!value.effectiveDate || clean(value.reason).length < 3) throw new Error("Enter the credit date and correction reason before saving this trade.");
        if (!(Number(value.allowance) > 0) || Number(value.allowance) > Number(maximumAllowance)) throw new Error("Enter a positive allowance within the invoice's remaining balance.");
      }
      const result = await runIXIActionNoticeLifecycle({
        objectId: outgoingPassportId,
        commandId: value.tradeId,
        source: "ixi-transact-trade",
        savingMessage: "SAVING TRADE AND ORDER…",
        successMessage: "TRADE AND ALLOWANCE SAVED",
        errorMessage: "TRADE NEEDS RETRY",
        operation: () => saveTradeInOrder({
          form: value, outgoingPassportId, prepareOrder: ensureOrder,
          saveMachine: request, attachTrade: correctionMode
            ? async (updated, saved) => {
              const added = updated.find(item => item.tradeId === value.tradeId);
              await onCorrectTrade(added, value);
              return { ...saved, trades: updated };
            }
            : onTradesChange,
          onMachineSaved: row => setRows(current => [...current.filter(item => item.tradeId !== row.tradeId), row]),
        }),
      });
      setForm(null);
      setChoices(null);
      return result;
    } catch (caught) {
      setError(caught.message);
      return null;
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  async function attach(row) {
    setBusy(true);
    setError("");
    try {
      if (!row.passportId || correctionMode) {
        setForm({
          ...fresh(),
          ...row.machine,
          tradeId: row.tradeId,
          allowance: row.allowanceCents / 100,
          existingListingId: row.existingListingId,
        });
      } else if (!(await onTradesChange([...trades, asTrade(row)])))
        throw new Error("Could not attach the saved trade. Retry.");
    } catch (caught) {
      setError(caught.message);
    } finally {
      setBusy(false);
    }
  }
  async function openAcquisition(trade) {
    setError("");
    setAcquisitionRecord(null);
    try {
      const row = rows.find((item) => item.tradeId === trade.tradeId);
      if (row?.acquisitionId) {
        const response = await fetch(
          `/api/ixi/financial/documents/${encodeURIComponent(row.acquisitionId)}`,
          { credentials: "same-origin" },
        );
        const payload = await response.json();
        const envelope = payload?.data?.record || payload?.record;
        const document = envelope?.financialDocument;
        if (!response.ok || document?.financialDocumentId !== row.acquisitionId)
          throw new Error("Acquisition could not be loaded. Retry.");
        setAcquisitionRecord({
          ...document.assetAcquisition,
          financialBinding: {
            financialDocumentId: row.acquisitionId,
            revision: envelope.server.revision,
          },
        });
      }
      setAcquiring(trade);
    } catch (caught) {
      setError(caught.message);
    }
  }
  async function finishInventory(tradeId, acquisitionId) {
    setBusy(true);
    setError("");
    try {
      const result = await request({
        ...scope,
        tradeId,
        acquisitionId,
        action: "acquired",
      });
      setRows((current) => [
        ...current.filter((row) => row.tradeId !== result.row.tradeId),
        result.row,
      ]);
      setAcquiring(null);
    } catch (caught) {
      setError(caught.message);
      throw caught;
    } finally {
      setBusy(false);
    }
  }
  async function acquired(acquisition) {
    const acquisitionId =
      acquisition?.financialBinding?.financialDocumentId ||
      acquisition?.identity?.financialDocumentId;
    if (!acquisitionId) return;
    setRows((current) =>
      current.map((row) =>
        row.tradeId === acquiring.tradeId
          ? {
              ...row,
              acquisitionId,
              inventoryStatus: "pending",
              status: "acquired",
            }
          : row,
      ),
    );
    await finishInventory(acquiring.tradeId, acquisitionId);
  }
  return (
    <section className={styles.section} aria-label="Trade-in machines">
      <header>
        <h3>{closeoutMode ? "CONFIRM INCOMING TRADES" : "TRADE-IN MACHINES"}</h3>
        <strong>
          {money(
            trades.reduce((sum, trade) => sum + Number(trade.allowance), 0),
          )}
        </strong>
      </header>
      {closeoutMode ? <p>{!rowsLoaded ? "Checking trade acquisitions…" : acquisitionsReady ? "Trade acquisitions complete." : "Confirm each incoming machine below, then mark the sale SOLD."}</p> : null}
      {error ? (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
      {closeoutMode && error && !rowsLoaded ? <button type="button" onClick={() => setRefreshVersion(value => value + 1)}>RETRY TRADE CHECK</button> : null}
      {!trades.length && !form ? <p>No trade machines attached to this order.</p> : null}
      {correctionMode ? <p>ISSUED INVOICE · Save Trade records a linked customer credit. The original invoice and payments remain on file.</p> : null}
      {locked && !trades.length && !correctionMode ? <p>Trade entry is locked by the issued invoice or signed order. A saved trade is still available here for acquisition and photos.</p> : null}
      {!locked && !form ? (
        <div className={styles.actions}>
          <button
            type="button"
            disabled={busy}
            onClick={() => setForm(fresh())}
          >
            + ADD TRADE
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setForm(fresh());
              existing();
            }}
          >
            SELECT EXISTING
          </button>
        </div>
      ) : null}
      {choices && form ? (
        <div>
          <label>
            FIND MACHINE
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <select
            aria-label="Existing machine"
            value={form.existingListingId}
            onChange={(event) => {
              const item = choices.find(
                (item) => item.listingId === event.target.value,
              );
              if (!item) return;
              setForm((current) => ({
                ...current,
                ...item.fields,
                existingListingId: item.listingId,
              }));
            }}
          >
            <option value="">Choose machine</option>
            {choices
              .filter((item) =>
                `${item.displayName} ${item.fields.serialNumber}`
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              )
              .map((item) => (
                <option key={item.listingId} value={item.listingId}>
                  {item.displayName} · {item.fields.serialNumber}
                </option>
              ))}
          </select>
          {hasMore ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => existing(page + 1)}
            >
              LOAD MORE
            </button>
          ) : null}
        </div>
      ) : null}
      {form ? (
        <div className={styles.form}>
          <p role="status">{correctionMode ? "UNSAVED TRADE CREDIT · Review the machine, allowance and credit date, then Save Trade." : "UNSAVED TRADE · Save Trade or Save Order saves this machine and its allowance."}</p>
          {[
            ["year", "YEAR"],
            ["make", "MAKE"],
            ["model", "MODEL"],
            ["hours", "HOURS"],
            ["serialNumber", "SERIAL"],
            ["location", "LOCATION"],
          ].map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                value={form[key] ?? ""}
                disabled={
                  busy ||
                  (Boolean(form.existingListingId) &&
                    ["year", "make", "model", "serialNumber"].includes(key))
                }
                inputMode={["year", "hours"].includes(key) ? "numeric" : "text"}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    [key]: event.target.value,
                  }))
                }
              />
            </label>
          ))}
          <label>
            TRADE ALLOWANCE
            <IXIMoneyInput
              value={form.allowance}
              onValueChange={(allowance) =>
                setForm((current) => ({ ...current, allowance }))
              }
              disabled={busy}
            />
          </label>
          <p>Photos can be added later in Launch.</p>
          {correctionMode ? <>
            <label>CREDIT DATE<input type="date" value={form.effectiveDate || ""} disabled={busy} onChange={event => setForm(current => ({ ...current, effectiveDate: event.target.value }))} /></label>
            <label>CORRECTION REASON<input value={form.reason || ""} disabled={busy} onChange={event => setForm(current => ({ ...current, reason: event.target.value }))} /></label>
          </> : null}
          <div className={styles.actions}>
            <button
              type="button"
              disabled={busy || clean(form.allowance) === ""}
              onClick={() => add()}
            >
              {busy ? "SAVING…" : "SAVE TRADE"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setForm(null);
                setChoices(null);
              }}
            >
              CANCEL
            </button>
          </div>
        </div>
      ) : null}
      {!closeoutMode && rows
        .filter((row) => !trades.some((trade) => trade.tradeId === row.tradeId))
        .map((row) => (
          <div key={row.tradeId} className={styles.recovery}>
            <b>
              {row.machine.year} {row.machine.make} {row.machine.model}
            </b>
            <button
              type="button"
              disabled={locked || busy}
              onClick={() => attach(row)}
            >
              {row.passportId ? "ATTACH SAVED TRADE" : "RESUME TRADE SAVE"}
            </button>
          </div>
        ))}
      <div className={styles.cards}>
        {trades.map((trade) => {
          const row = rows.find((item) => item.tradeId === trade.tradeId);
          const listing = {
            ...row?.listing,
            id: trade.listingId,
            title: `${trade.year} ${trade.make} ${trade.model}`,
            ...trade,
            machineAccess: "private",
            machineChannel: "private",
            publicData: {
              ...row?.listing?.publicData,
              ...trade,
              machineAccess: "private",
              machineChannel: "private",
              ownershipStatus: row?.status === "acquired" ? "owned" : "pending",
            },
          };
          return (
            <div key={trade.tradeId} className={styles.trade}>
              <b>
                {row?.status === "acquired" ? "ACQUIRED" : "PENDING TRADE"} ·{" "}
                {money(trade.allowance)}
              </b>
              {closeoutMode ? <p><strong>{trade.year} {trade.make} {trade.model}</strong><br />SN {trade.serialNumber}</p> : <div className={styles.card}>
                <IXIMachineCard
                  listing={listing}
                  cardContext="workspace"
                  sellerMode={false}
                  suppressFamilyLog
                  showMachineRail={false}
                />
              </div>}
              <div className={styles.actions}>
                <a
                  href={`/live?id=${encodeURIComponent(trade.listingId)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LAUNCH · PHOTOS
                </a>
                <button type="button" disabled={busy || (closeoutMode && !rowsLoaded)} onClick={() => openAcquisition(trade)}>
                  {row?.status === "acquired"
                    ? "VIEW ACQUISITION"
                    : closeoutMode ? "CONFIRM ACQUISITION" : "ACQUISITION"}
                </button>
                {row?.acquisitionId && row.inventoryStatus !== "complete" ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      finishInventory(trade.tradeId, row.acquisitionId).catch(
                        () => {},
                      )
                    }
                  >
                    FINISH INVENTORY
                  </button>
                ) : null}
                {!locked && !correctionMode && row?.status !== "acquired" ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      onTradesChange(
                        trades.filter((item) => item.tradeId !== trade.tradeId),
                      )
                    }
                  >
                    REMOVE FROM ORDER
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      {acquiring ? (
        <div className={styles.acquisition}>
          <button type="button" onClick={() => setAcquiring(null)}>
            {closeoutMode ? "‹ BACK TO SOLD" : "‹ BACK TO ORDER"}
          </button>
          <IXIAssetAcquisitionApp
            compactTradeReview={closeoutMode}
            initialRecord={acquisitionRecord}
            key={acquiring.tradeId}
            context={{
              ...context,
              primary: {
                ...acquiring,
                label: `${acquiring.year} ${acquiring.make} ${acquiring.model}`,
                objectType: "machine",
              },
            }}
            object={acquiring}
            tradeContext={{
              tradeId: acquiring.tradeId,
              dealId,
              sourceFinancialDocumentId: acquiring.tradeCreditId || record.identity.salesOrderId,
              outgoingPassportId,
              allowance: acquiring.allowance,
            }}
            initialInput={{
              clientRequestId: `trade-acquisition:${acquiring.tradeId}`,
              acquisitionType: "trade-in",
              sellerLabel: record.customer?.name,
              purchasePrice: acquiring.allowance,
              hoursAtAcquisition: acquiring.hours,
              purchaseDate: record.commercial?.orderDate,
              sourceReference: record.identity.number,
            }}
            onRecordChange={acquired}
            onBack={() => setAcquiring(null)}
          />
        </div>
      ) : null}
    </section>
  );
});

export default IXITradeInSection;
