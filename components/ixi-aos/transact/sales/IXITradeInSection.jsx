import { useEffect, useState } from "react";
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
const asTrade = (row) => ({
  tradeId: row.tradeId,
  passportId: row.passportId,
  objectId: row.objectId,
  listingId: row.listingId,
  ...row.machine,
  allowance: row.allowanceCents / 100,
});

export default function IXITradeInSection({
  record,
  context,
  locked,
  ensureOrder,
  onTradesChange,
}) {
  const [form, setForm] = useState(null),
    [rows, setRows] = useState([]),
    [busy, setBusy] = useState(false);
  const [error, setError] = useState(""),
    [acquiring, setAcquiring] = useState(null),
    [choices, setChoices] = useState(null);
  const [acquisitionRecord, setAcquisitionRecord] = useState(null);
  const [page, setPage] = useState(1),
    [hasMore, setHasMore] = useState(false),
    [search, setSearch] = useState("");
  const dealId = record?.identity?.dealId;
  const outgoingPassportId = context?.primary?.passportId;
  const trades = record?.trades || [];
  const scope = { dealId, outgoingPassportId };
  useEffect(() => {
    if (!dealId || !outgoingPassportId) return;
    let active = true;
    const refresh = () =>
      request({ dealId, outgoingPassportId }, "GET")
        .then((result) => {
          if (active) setRows(result.rows || []);
        })
        .catch((caught) => {
          if (active) setError(caught.message);
        });
    refresh();
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
    };
  }, [dealId, outgoingPassportId]);

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
    if (!value || busy) return;
    setBusy(true);
    setError("");
    try {
      const saved = await ensureOrder();
      if (!saved) throw new Error("Save the order before adding this trade.");
      const machine = {
        year: clean(value.year),
        make: clean(value.make),
        model: clean(value.model),
        hours: clean(value.hours),
        serialNumber: clean(value.serialNumber),
        location: clean(value.location),
      };
      const result = await runIXIActionNoticeLifecycle({
        objectId: outgoingPassportId,
        commandId: value.tradeId,
        source: "ixi-transact-trade",
        savingMessage: "SAVING TRADE MACHINE…",
        successMessage: "TRADE MACHINE SAVED",
        errorMessage: "TRADE NEEDS RETRY",
        operation: () =>
          request({
            dealId: saved.identity.dealId,
            outgoingPassportId,
            tradeId: value.tradeId,
            machine,
            allowanceCents: Math.round(Number(value.allowance) * 100),
            existingListingId: value.existingListingId || "",
          }),
      });
      setRows((current) => [
        ...current.filter((row) => row.tradeId !== result.row.tradeId),
        result.row,
      ]);
      const trade = asTrade(result.row);
      const next = [
        ...(saved.trades || []).filter(
          (item) => item.tradeId !== trade.tradeId,
        ),
        trade,
      ];
      if (!(await onTradesChange(next, saved)))
        throw new Error(
          "Machine saved. Retry attaching it to this order below.",
        );
      setForm(null);
      setChoices(null);
    } catch (caught) {
      setError(caught.message);
    } finally {
      setBusy(false);
    }
  }
  async function attach(row) {
    setBusy(true);
    setError("");
    try {
      if (!row.passportId) {
        setForm({
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
        <h3>TRADE-IN MACHINES</h3>
        <strong>
          {money(
            trades.reduce((sum, trade) => sum + Number(trade.allowance), 0),
          )}
        </strong>
      </header>
      {error ? (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
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
      {rows
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
              <div className={styles.card}>
                <IXIMachineCard
                  listing={listing}
                  cardContext="workspace"
                  sellerMode={false}
                  suppressFamilyLog
                  showMachineRail={false}
                />
              </div>
              <div className={styles.actions}>
                <a
                  href={`/live?id=${encodeURIComponent(trade.listingId)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LAUNCH · PHOTOS
                </a>
                <button type="button" onClick={() => openAcquisition(trade)}>
                  {row?.status === "acquired"
                    ? "VIEW ACQUISITION"
                    : "ACQUISITION"}
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
                {!locked && row?.status !== "acquired" ? (
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
            ‹ BACK TO ORDER
          </button>
          <IXIAssetAcquisitionApp
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
              sourceFinancialDocumentId: record.identity.salesOrderId,
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
}
