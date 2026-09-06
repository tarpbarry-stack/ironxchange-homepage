import { useEffect, useRef, useState } from "react";

function clean(value) {
  return String(value ?? "").trim();
}

export default function IXIRelationshipDropDialog({
  pending = null,
  busy = false,
  error = "",
  onCancel,
  onConfirm
}) {
  const [relationshipName, setRelationshipName] = useState("");
  const inputRef = useRef(null);
  const open = Boolean(pending);

  useEffect(() => {
    if (!open) return;
    setRelationshipName("");
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open, pending?.sourceObjectId, pending?.targetObjectId]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = event => {
      if (event.key === "Escape" && !busy) onCancel?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, busy, onCancel]);

  if (!open) return null;

  function submit(event) {
    event.preventDefault();
    const value = clean(relationshipName);
    if (!value || busy) return;
    onConfirm?.(value);
  }

  return (
    <div className="relationship-dialog-backdrop" role="presentation">
      <form
        className="relationship-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="relationship-dialog-title"
        onSubmit={submit}
      >
        <div className="eyebrow">IXI AOS · CANONICAL RELATIONSHIP</div>
        <h2 id="relationship-dialog-title">NAME THIS CONNECTION</h2>

        <div className="relationship-endpoints">
          <div>
            <span>OBJECT</span>
            <strong>{pending.sourceLabel || pending.sourceObjectId}</strong>
          </div>
          <b aria-hidden="true">→</b>
          <div>
            <span>CONNECTED OBJECT</span>
            <strong>{pending.targetLabel || pending.targetObjectId}</strong>
          </div>
        </div>

        <label htmlFor="ixi-relationship-name">RELATIONSHIP NAME</label>
        <input
          ref={inputRef}
          id="ixi-relationship-name"
          value={relationshipName}
          maxLength={160}
          autoComplete="off"
          placeholder="Enter your relationship name"
          disabled={busy}
          onChange={event => setRelationshipName(event.target.value)}
        />

        <p className="explanation">
          Your wording becomes the relationship. IX Core will not rename it or infer a different meaning.
        </p>

        {error ? <div className="dialog-error" role="alert">{error}</div> : null}

        <div className="dialog-actions">
          <button type="button" className="cancel" disabled={busy} onClick={onCancel}>
            CANCEL
          </button>
          <button type="submit" className="confirm" disabled={busy || !clean(relationshipName)}>
            {busy ? "CREATING…" : "CREATE RELATIONSHIP"}
          </button>
        </div>
      </form>

      <style jsx>{`
        .relationship-dialog-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000000;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(0, 0, 0, .78);
          backdrop-filter: blur(5px);
        }
        .relationship-dialog {
          width: min(520px, 100%);
          padding: 24px;
          border: 1px solid rgba(255, 196, 0, .56);
          border-radius: 4px;
          background: #0b0d0c;
          box-shadow: 0 28px 90px rgba(0, 0, 0, .65);
          color: #f1f3f2;
          font-family: 'Inter Variable', Inter, ui-sans-serif, sans-serif;
        }
        .eyebrow, label {
          color: #ffc400;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .12em;
        }
        h2 {
          margin: 7px 0 20px;
          font-size: 24px;
          line-height: 1;
        }
        .relationship-endpoints {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 24px minmax(0, 1fr);
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
          padding: 14px;
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.025);
        }
        .relationship-endpoints div { min-width: 0; }
        .relationship-endpoints span {
          display: block;
          margin-bottom: 5px;
          color: #858b87;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .1em;
        }
        .relationship-endpoints strong {
          display: block;
          overflow: hidden;
          color: #f3f5f4;
          font-size: 13px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .relationship-endpoints b { color: #ffc400; text-align: center; }
        label { display: block; margin-bottom: 7px; }
        input {
          width: 100%;
          min-height: 48px;
          padding: 0 13px;
          border: 1px solid rgba(255,196,0,.7);
          border-radius: 2px;
          outline: none;
          background: #050606;
          color: #fff;
          font: inherit;
          font-size: 15px;
        }
        input:focus { box-shadow: 0 0 0 2px rgba(255,196,0,.16); }
        .explanation {
          margin: 9px 0 0;
          color: #9ba19d;
          font-size: 11px;
          line-height: 1.45;
        }
        .dialog-error {
          margin-top: 14px;
          padding: 10px 12px;
          border-left: 3px solid #ff4e4e;
          background: rgba(130, 20, 20, .24);
          color: #ffd7d7;
          font-size: 12px;
          font-weight: 700;
        }
        .dialog-actions {
          display: grid;
          grid-template-columns: 1fr 1.45fr;
          gap: 10px;
          margin-top: 20px;
        }
        button {
          min-height: 48px;
          border: 1px solid rgba(255,255,255,.18);
          border-radius: 2px;
          font: inherit;
          font-size: 12px;
          font-weight: 950;
          cursor: pointer;
        }
        .cancel { background: #171918; color: #e5e7e6; }
        .confirm { border-color: #ffc400; background: #ffc400; color: #050505; }
        button:disabled { cursor: not-allowed; opacity: .45; }
        @media (max-width: 540px) {
          .relationship-dialog { padding: 18px; }
          .relationship-endpoints { grid-template-columns: 1fr; }
          .relationship-endpoints b { transform: rotate(90deg); }
          .dialog-actions { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
