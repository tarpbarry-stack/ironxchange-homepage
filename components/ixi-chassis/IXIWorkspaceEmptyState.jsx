import Link from "next/link";

export default function IXIWorkspaceEmptyState({
  surface = "IXI WORKSPACE",
  context = "CURRENT VIEW",
  title,
  message,
  actionLabel = "",
  actionHref = "",
  onAction
}) {
  const action = actionLabel
    ? actionHref
      ? <Link href={actionHref}>{actionLabel}</Link>
      : typeof onAction === "function"
        ? <button type="button" onClick={onAction}>{actionLabel}</button>
        : null
    : null;

  return (
    <section
      className="ixi-workspace-empty-zone"
      data-ixi-workspace-empty-state="true"
      role="status"
      aria-live="polite"
    >
      <div className="ixi-workspace-empty-state">
        <div className="ixi-workspace-empty-rail" aria-hidden="true">
          <span />
          <i />
          <span />
        </div>

        <p className="ixi-workspace-empty-kicker">
          {surface} <b aria-hidden="true">/</b> {context}
        </p>

        <div className="ixi-workspace-empty-count" aria-hidden="true">
          <strong>0</strong>
          <span>MACHINES</span>
        </div>

        <h2>{title}</h2>
        <p className="ixi-workspace-empty-copy">{message}</p>
        {action}

        <div className="ixi-workspace-empty-rule" aria-hidden="true" />
      </div>

      <style jsx>{`
        .ixi-workspace-empty-zone {
          width: 100%;
          min-height: clamp(360px, 48vh, 680px);
          display: grid;
          place-items: center;
          padding: 48px 20px 72px;
        }

        .ixi-workspace-empty-state {
          width: min(100%, 560px);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 28px;
          text-align: center;
        }

        .ixi-workspace-empty-rail {
          width: min(100%, 360px);
          display: grid;
          grid-template-columns: 1fr 8px 1fr;
          align-items: center;
          gap: 13px;
          margin-bottom: 20px;
        }

        .ixi-workspace-empty-rail span {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 196, 0, .62));
        }

        .ixi-workspace-empty-rail span:last-child {
          transform: rotate(180deg);
        }

        .ixi-workspace-empty-rail i {
          width: 8px;
          height: 8px;
          border: 1px solid #ffc400;
          transform: rotate(45deg);
          box-shadow: 0 0 14px rgba(255, 196, 0, .28);
        }

        .ixi-workspace-empty-kicker {
          margin: 0 0 16px;
          color: #ffc400;
          font-size: 11px;
          font-weight: 900;
          line-height: 1.4;
          letter-spacing: .18em;
        }

        .ixi-workspace-empty-kicker b {
          margin: 0 6px;
          color: rgba(255, 255, 255, .28);
          font-weight: 700;
        }

        .ixi-workspace-empty-count {
          display: flex;
          align-items: baseline;
          gap: 10px;
          margin-bottom: 10px;
          color: rgba(255, 255, 255, .20);
        }

        .ixi-workspace-empty-count strong {
          color: rgba(255, 255, 255, .94);
          font-size: clamp(44px, 4vw, 62px);
          font-weight: 800;
          line-height: .9;
          letter-spacing: -.05em;
        }

        .ixi-workspace-empty-count span {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .2em;
        }

        .ixi-workspace-empty-state h2 {
          margin: 0;
          color: #f4f4f2;
          font-size: clamp(20px, 2vw, 28px);
          font-weight: 850;
          line-height: 1.15;
          letter-spacing: -.025em;
        }

        .ixi-workspace-empty-copy {
          max-width: 460px;
          margin: 13px 0 0;
          color: rgba(255, 255, 255, .52);
          font-size: 14px;
          line-height: 1.6;
        }

        .ixi-workspace-empty-state :global(a),
        .ixi-workspace-empty-state button {
          min-width: 164px;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-top: 24px;
          padding: 0 22px;
          border: 1px solid rgba(255, 196, 0, .78);
          border-radius: 4px;
          background: rgba(255, 196, 0, .05);
          color: #ffc400;
          font-family: inherit;
          font-size: 12px;
          font-weight: 900;
          line-height: 1;
          letter-spacing: .13em;
          text-decoration: none;
          cursor: pointer;
          transition: background .16s ease, color .16s ease, box-shadow .16s ease;
        }

        .ixi-workspace-empty-state :global(a:hover),
        .ixi-workspace-empty-state :global(a:focus-visible),
        .ixi-workspace-empty-state button:hover,
        .ixi-workspace-empty-state button:focus-visible {
          background: #ffc400;
          color: #111;
          outline: none;
          box-shadow: 0 0 0 4px rgba(255, 196, 0, .12);
        }

        .ixi-workspace-empty-rule {
          width: 56px;
          height: 2px;
          margin-top: 28px;
          background: rgba(255, 255, 255, .18);
        }

        @media (max-width: 850px) {
          .ixi-workspace-empty-zone {
            min-height: 420px;
            padding: 38px 0 54px;
          }

          .ixi-workspace-empty-state {
            padding: 0 12px;
          }

          .ixi-workspace-empty-copy {
            font-size: 13px;
          }
        }
      `}</style>
    </section>
  );
}
