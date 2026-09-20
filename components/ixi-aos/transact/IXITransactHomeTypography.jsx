export default function IXITransactHomeTypography() {
  return (
    <style jsx global>{`
      /*
       * TRAN$ACT HOME · READABLE WORK TYPOGRAPHY
       * ----------------------------------------
       * Intentionally limited to the launcher state. Opened applications,
       * forms, rails, outer card geometry and transaction behavior are excluded.
       */
      .ixi-transact-app.home-open {
        --ixi-tx-home-font: "Inter Variable", Inter, ui-sans-serif, -apple-system,
          BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-family: var(--ixi-tx-home-font);
        display: flex;
        flex-direction: column;
        padding-bottom: 19px;
      }

      .ixi-transact-app.home-open .tx-header {
        position: relative;
        inset: auto;
        height: auto;
        flex: none;
        gap: 8px;
      }

      .ixi-transact-app.home-open .tx-brand {
        display: block;
        min-width: 0;
        flex: 1;
      }

      .ixi-transact-app.home-open .tx-header-actions {
        flex-shrink: 0;
      }

      .ixi-transact-app.home-open .tx-body {
        position: relative;
        inset: auto;
        flex: 1;
        min-height: 0;
      }

      .ixi-transact-app.home-open .tx-brand span {
        font-size: 8.5px;
        line-height: 11px;
        letter-spacing: .055em;
      }

      .ixi-transact-app.home-open .tx-brand strong {
        margin-top: 2px;
        font-size: 15.5px;
        line-height: 18px;
        letter-spacing: -.02em;
        overflow-wrap: anywhere;
      }

      .ixi-transact-app.home-open .tx-brand small {
        margin-top: 2px;
        font-size: 7px;
        line-height: 9px;
        letter-spacing: .035em;
      }

      .ixi-transact-app.home-open .tx-brand .tx-serial {
        margin: 0 0 2px;
        color: #b9c1bb;
        font-size: 10px;
        line-height: 13px;
        overflow-wrap: anywhere;
      }

      .ixi-transact-app.home-open .tx-label {
        margin: 3px 3px 6px;
        font-size: 8px;
        line-height: 10px;
        letter-spacing: .045em;
      }

      .ixi-transact-app.home-open .tx-grid {
        gap: 6px;
      }

      .ixi-transact-app.home-open .tx-app-tile {
        height: 64px;
      }

      .ixi-transact-app.home-open .tx-app-content {
        padding: 8px;
      }

      .ixi-transact-app.home-open .tx-app-group {
        font-size: 8.5px;
        line-height: 10px;
        letter-spacing: .035em;
      }

      .ixi-transact-app.home-open .tx-app-open {
        margin-top: 4px;
        font-size: 11px;
        line-height: 13px;
        letter-spacing: -.015em;
      }

      .ixi-transact-app.home-open .tx-app-document {
        margin-top: 3px;
        font-size: 8px;
        line-height: 10px;
      }

      .ixi-transact-app.home-open .tx-open-work span {
        font-size: 8px;
        line-height: 10px;
        letter-spacing: .035em;
      }

      .ixi-transact-app.home-open .tx-open-work strong {
        margin-top: 3px;
        font-size: 11px;
        line-height: 14px;
      }

      .ixi-transact-app.home-open .tx-open-work small {
        margin-top: 3px;
        font-size: 8px;
        line-height: 10px;
      }

      .ixi-transact-app.home-open .tx-open-work b {
        font-size: 8.5px;
        line-height: 11px;
      }
    `}</style>
  );
}
