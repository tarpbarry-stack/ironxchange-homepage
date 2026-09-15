import { useState } from "react";

export default function IXIAosCreationRecovery({ commands = [], loadError, onRefresh, onFinish }) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  if (!commands.length && !loadError) return null;
  async function finish(command) {
    if (busy) return;
    setBusy(command.commandId);
    setError("");
    try { await onFinish(command.commandId); }
    catch (caught) { setError(caught.message || "The save is still incomplete. Your saved request is retained."); }
    finally { setBusy(""); await onRefresh(); }
  }
  return <aside className="creation-recovery" aria-label="Unfinished saves">
    <strong>UNFINISHED SAVES</strong>
    <p>Finish an interrupted save using its original Object and Passport.</p>
    {loadError ? <p role="alert">{loadError}</p> : null}
    {error ? <p role="alert">{error}</p> : null}
    {commands.map(command => <div className="saved-request" key={command.commandId}>
      <div><b>{command.displayName}</b><span>{command.objectId ? "Object saved — finish workspace confirmation" : "Save request retained"}</span>
        {command.error?.message ? <span>{command.error.message}</span> : null}</div>
      <button type="button" disabled={Boolean(busy)} onClick={() => finish(command)}>
        {busy === command.commandId ? "FINISHING…" : "FINISH SAVE"}</button>
    </div>)}
    <button type="button" disabled={Boolean(busy)} onClick={onRefresh}>REFRESH SAVES</button>
    <style jsx>{`.creation-recovery { margin: 12px auto; padding: 14px; max-width: 720px; border: 1px solid #b99527; background: #171a17; color: #eee; }
      .creation-recovery strong, .creation-recovery p, .creation-recovery b, .creation-recovery span { font-size: 12px; line-height: 1.5; }
      .saved-request { display: flex; gap: 12px; align-items: center; justify-content: space-between; margin: 10px 0; }
      .saved-request span { display: block; }
      .creation-recovery button { min-height: 44px; padding: 8px 12px; border: 1px solid #b99527; color: #ffd04b; background: #242824; font-size: 12px; }
      @media (max-width: 430px) { .saved-request { flex-wrap: wrap; } }`}</style>
  </aside>;
}
