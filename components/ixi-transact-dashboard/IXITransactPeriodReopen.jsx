import { useRef, useState } from "react";
import { reopenIXITransactPeriod } from "../ixi-aos/financial-runtime/IXITransactDesktopClient";

// Mount with a key containing Entity, period, currency and close evidence.
// IX-Core independently resolves and authorizes the authenticated operator.
export default function IXITransactPeriodReopen({ entityPassportId, period, currency, closeDocumentId, allowed = false, disabled = false, onCommitted }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const inFlight = useRef(false);
  const commandId = useRef("");

  async function submit(event) {
    event.preventDefault();
    if (inFlight.current || saved || disabled || !allowed || !entityPassportId || !closeDocumentId || reason.trim().length < 10) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    commandId.current ||= `ixi-period-reopen-${crypto.randomUUID()}`;
    let result;
    try {
      result = await reopenIXITransactPeriod({
        period, currency, reopenReason: reason.trim(), commandId: commandId.current,
        idempotencyKey: `ixi-gl-period-reopen:${entityPassportId}:${period}:${closeDocumentId}`,
        metadata: { source: "ixi-transact-ledger", accountingScope: "entity" }
      });
      setSaved(true);
    } catch (cause) {
      setError(cause?.message || "The period could not be reopened. Your reason has been retained.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
    if (result) {
      try { await onCommitted?.(result); }
      catch { setError("Reopen saved. Refresh the ledger to confirm its current status."); }
    }
  }

  return <form className="period-reopen" onSubmit={submit} aria-label={`Reopen accounting period ${period}`}>
    <div><strong>REOPEN {period}</strong><p>Reopening allows entries dated in this period. The original close and posted transactions remain in the audit history.</p></div>
    {saved ? <p role="status">Reopen saved. Refreshing period status…</p> : <>
      <label><span>REOPEN REASON</span><textarea value={reason} onChange={event => setReason(event.target.value)} disabled={busy || disabled || !allowed} minLength={10} required rows={2} placeholder="Explain why this period should be reopened." /></label>
      {!allowed ? <p>Controller period-reopen authority is required.</p> : null}
      <button type="submit" disabled={busy || disabled || !allowed || !closeDocumentId || reason.trim().length < 10}>{busy ? "REOPENING…" : `REOPEN ${period}`}</button>
    </>}
    {error ? <p role="alert">{error}</p> : null}
    <style jsx>{`
      .period-reopen { display: grid; gap: 10px; padding: 14px; border: 1px solid rgba(255,196,0,.28); border-radius: 7px; background: rgba(255,196,0,.04); }
      strong, label span { font-size: 11px; font-weight: 800; }
      p { margin: 5px 0 0; color: #c8cec9; font-size: 12px; line-height: 1.5; }
      label { display: grid; gap: 6px; }
      textarea { box-sizing: border-box; width: 100%; resize: vertical; border: 1px solid #48524b; border-radius: 4px; padding: 9px; background: #101610; color: #fff; font: inherit; font-size: 13px; }
      button { justify-self: start; min-height: 36px; padding: 8px 16px; border: 1px solid #ffc400; border-radius: 5px; background: #ffc400; color: #141800; font-size: 11px; font-weight: 900; cursor: pointer; }
      button:disabled { opacity: .4; cursor: not-allowed; }
      textarea:focus-visible, button:focus-visible { outline: 2px solid #ffe477; outline-offset: 3px; }
      [role="alert"] { color: #ffb5b5; }
    `}</style>
  </form>;
}
