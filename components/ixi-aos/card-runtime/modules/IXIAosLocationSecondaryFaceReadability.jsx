export default function IXIAosLocationSecondaryFaceReadability() {
  return (
    <style jsx global>{`
      /*
       * CARDS 001-003 · FACES 2-5 READABILITY
       * --------------------------------------
       * Scope firewall: this module mounts only around the secondary Location
       * faces. Face 1, native card headers, shell geometry, rails, media and
       * runtime behavior remain outside this contract.
       */
      .ixi-location-secondary-readable {
        --ixi-secondary-font-ui: "Inter Variable", Inter, ui-sans-serif, -apple-system,
          BlinkMacSystemFont, "Segoe UI", sans-serif;
        --ixi-secondary-label: 10px;
        --ixi-secondary-label-leading: 12px;
        --ixi-secondary-value: 11px;
        --ixi-secondary-value-leading: 13px;
        display: contents;
      }

      /* Face 2 · Operations */
      .ixi-location-secondary-readable .ixi-aos-location-f2 .ops-section h3,
      .ixi-location-secondary-readable .ixi-aos-location-f2 .gate-copy span,
      .ixi-location-secondary-readable .ixi-aos-location-f2 .ops-label,
      .ixi-location-secondary-readable .ixi-aos-location-f2 .rel-label {
        font-family: var(--ixi-secondary-font-ui) !important;
        font-size: var(--ixi-secondary-label) !important;
        font-weight: 700 !important;
        line-height: var(--ixi-secondary-label-leading) !important;
        letter-spacing: .015em !important;
      }
      .ixi-location-secondary-readable .ixi-aos-location-f2 .gate-copy strong,
      .ixi-location-secondary-readable .ixi-aos-location-f2 .ops-row strong,
      .ixi-location-secondary-readable .ixi-aos-location-f2 .ops-relationship strong,
      .ixi-location-secondary-readable .ixi-aos-location-f2 .site-instructions strong {
        min-width: 0;
        overflow: hidden;
        color: #f2f4f2 !important;
        font-family: var(--ixi-secondary-font-ui) !important;
        font-size: var(--ixi-secondary-value) !important;
        font-weight: 700 !important;
        line-height: var(--ixi-secondary-value-leading) !important;
        text-overflow: ellipsis;
      }
      .ixi-location-secondary-readable .ixi-aos-location-f2 .ops-row {
        min-height: 34px !important;
        grid-template-columns: 15px minmax(88px,.95fr) minmax(0,1fr) 40px !important;
        padding: 4px !important;
      }
      .ixi-location-secondary-readable .ixi-aos-location-f2 .ops-relationship {
        min-height: 38px !important;
        grid-template-columns: 15px 88px minmax(0,1fr) 10px !important;
        padding: 5px !important;
      }
      .ixi-location-secondary-readable .ixi-aos-location-f2 .ops-row-edit,
      .ixi-location-secondary-readable .ixi-aos-location-f2 .ops-edit-actions button,
      .ixi-location-secondary-readable .ixi-aos-location-f2 .ops-commands button {
        font-family: var(--ixi-secondary-font-ui) !important;
        font-size: 10px !important;
        font-weight: 700 !important;
        line-height: 12px !important;
      }
      .ixi-location-secondary-readable .ixi-aos-location-f2 .ops-row-edit {
        width: 40px;
        height: 24px !important;
        padding: 0 4px !important;
      }
      .ixi-location-secondary-readable .ixi-aos-location-f2 .gate-code {
        grid-template-columns: 25px minmax(0,1fr) 40px !important;
      }
      .ixi-location-secondary-readable .ixi-aos-location-f2 .ops-row input,
      .ixi-location-secondary-readable .ixi-aos-location-f2 .ops-row select,
      .ixi-location-secondary-readable .ixi-aos-location-f2 .gate-copy input,
      .ixi-location-secondary-readable .ixi-aos-location-f2 .site-instructions textarea {
        font-family: var(--ixi-secondary-font-ui) !important;
        font-size: 11px !important;
        font-weight: 700 !important;
        line-height: 22px !important;
      }
      .ixi-location-secondary-readable .ixi-aos-location-f2 .ops-row input,
      .ixi-location-secondary-readable .ixi-aos-location-f2 .ops-row select,
      .ixi-location-secondary-readable .ixi-aos-location-f2 .gate-copy input {
        height: 24px !important;
      }
      .ixi-location-secondary-readable .ixi-aos-location-f2 .ops-inline-triple {
        grid-template-columns: minmax(0,1fr) 36px 48px !important;
      }
      .ixi-location-secondary-readable .ixi-aos-location-f2 .ops-inline-triple input {
        font-size: 10px !important;
      }

      /*
       * Face 2 · Commercial information architecture
       * The card header is the sole editing authority. Rows use the same
       * heading-first, value-second rhythm as the approved Face 3 layout.
       */
      .ixi-location-secondary-readable .ixi-aos-location-f2 .gate-code {
        min-height: 52px !important;
        flex-basis: 52px !important;
        grid-template-columns: 25px minmax(0, 1fr) !important;
        padding: 6px 8px !important;
      }
      .ixi-location-secondary-readable .ixi-aos-location-f2 .gate-copy {
        padding-left: 8px !important;
      }
      .ixi-location-secondary-readable .ixi-aos-location-f2 .gate-copy strong {
        margin-top: 4px !important;
        white-space: nowrap !important;
      }
      .ixi-location-secondary-readable .ixi-aos-location-f2 .ops-section h3 {
        width: 100% !important;
        height: auto !important;
        min-height: 28px !important;
        padding: 6px 8px !important;
        white-space: normal !important;
      }
      .ixi-location-secondary-readable .ixi-aos-location-f2 .ops-row {
        min-height: 52px !important;
        grid-template-columns: 16px minmax(0, 1fr) !important;
        grid-template-rows: auto auto !important;
        column-gap: 7px !important;
        row-gap: 4px !important;
        align-content: center !important;
        padding: 7px 8px !important;
      }
      .ixi-location-secondary-readable .ixi-aos-location-f2 .ops-icon {
        grid-column: 1 !important;
        grid-row: 1 / span 2 !important;
        align-self: center !important;
      }
      .ixi-location-secondary-readable .ixi-aos-location-f2 .ops-label {
        grid-column: 2 !important;
        grid-row: 1 !important;
        white-space: normal !important;
        overflow: visible !important;
        text-overflow: clip !important;
      }
      .ixi-location-secondary-readable .ixi-aos-location-f2 .ops-row > strong,
      .ixi-location-secondary-readable .ixi-aos-location-f2 .ops-row > input,
      .ixi-location-secondary-readable .ixi-aos-location-f2 .ops-row > select,
      .ixi-location-secondary-readable .ixi-aos-location-f2 .ops-inline-triple {
        width: 100% !important;
        min-width: 0 !important;
        grid-column: 2 !important;
        grid-row: 2 !important;
      }
      .ixi-location-secondary-readable .ixi-aos-location-f2 .ops-row > strong {
        white-space: normal !important;
        overflow: visible !important;
        text-overflow: clip !important;
      }
      .ixi-location-secondary-readable .ixi-aos-location-f2 .ops-inline-triple {
        grid-template-columns: minmax(0, 1fr) 44px 64px !important;
        gap: 4px !important;
      }
      .ixi-location-secondary-readable .ixi-aos-location-f2 .site-instructions {
        min-height: 72px !important;
        grid-template-columns: 18px minmax(0, 1fr) !important;
        gap: 8px !important;
        padding: 9px 8px !important;
      }
      .ixi-location-secondary-readable .ixi-aos-location-f2 .site-instructions strong,
      .ixi-location-secondary-readable .ixi-aos-location-f2 .site-instructions textarea {
        width: 100% !important;
        min-width: 0 !important;
        white-space: normal !important;
        overflow: visible !important;
        text-overflow: clip !important;
      }
      .ixi-location-secondary-readable .ixi-aos-location-f2 .ops-relationship {
        min-height: 52px !important;
        grid-template-columns: 16px minmax(0, 1fr) 12px !important;
        grid-template-rows: auto auto !important;
        column-gap: 7px !important;
        row-gap: 4px !important;
        align-content: center !important;
        padding: 7px 8px !important;
      }
      .ixi-location-secondary-readable .ixi-aos-location-f2 .rel-icon {
        grid-column: 1 !important;
        grid-row: 1 / span 2 !important;
        align-self: center !important;
      }
      .ixi-location-secondary-readable .ixi-aos-location-f2 .rel-label {
        grid-column: 2 !important;
        grid-row: 1 !important;
        white-space: normal !important;
        overflow: visible !important;
        text-overflow: clip !important;
      }
      .ixi-location-secondary-readable .ixi-aos-location-f2 .ops-relationship strong {
        grid-column: 2 !important;
        grid-row: 2 !important;
        white-space: normal !important;
        overflow: visible !important;
        text-overflow: clip !important;
      }
      .ixi-location-secondary-readable .ixi-aos-location-f2 .ops-relationship b {
        grid-column: 3 !important;
        grid-row: 1 / span 2 !important;
        align-self: center !important;
        justify-self: end !important;
      }

      /* Face 3 · Financial */
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-section > h3,
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-contact h4,
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-value-card h4,
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-lease-ytd h4,
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-status-main small,
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-status-date span,
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-row-label,
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-value-card span,
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-summary span,
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-summary small,
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-contact > span,
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-contact > small,
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-contact > b,
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-total span,
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-relationship > b {
        font-family: var(--ixi-secondary-font-ui) !important;
        font-size: var(--ixi-secondary-label) !important;
        font-weight: 700 !important;
        line-height: var(--ixi-secondary-label-leading) !important;
      }
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-row strong,
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-value-card strong,
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-contact > strong,
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-status-date strong,
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-notes strong,
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-relationship > strong {
        min-width: 0;
        color: #f2f4f2;
        font-family: var(--ixi-secondary-font-ui) !important;
        font-size: var(--ixi-secondary-value) !important;
        font-weight: 700 !important;
        line-height: var(--ixi-secondary-value-leading) !important;
      }
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-row {
        min-height: 34px !important;
        padding: 4px !important;
      }
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-row-label,
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-row strong {
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-value-card p {
        min-height: 36px !important;
      }
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-summary {
        min-height: 68px !important;
      }
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-summary strong,
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-total strong {
        font-family: var(--ixi-secondary-font-ui) !important;
        font-size: 12px !important;
        line-height: 14px !important;
      }
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-relationship {
        min-height: 38px !important;
        padding: 5px !important;
      }
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-row em {
        font-family: var(--ixi-secondary-font-ui) !important;
        font-size: 10px !important;
      }
      .ixi-location-secondary-readable .ixi-location-f3-v12 input,
      .ixi-location-secondary-readable .ixi-location-f3-v12 textarea {
        font-family: var(--ixi-secondary-font-ui) !important;
        font-size: 11px !important;
        font-weight: 700 !important;
        line-height: 22px !important;
      }
      .ixi-location-secondary-readable .ixi-location-f3-v12 input {
        height: 24px !important;
      }
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-save-actions button,
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-commands button {
        font-family: var(--ixi-secondary-font-ui) !important;
        font-size: 10px !important;
        font-weight: 700 !important;
        line-height: 12px !important;
      }

      /*
       * Face 3 · Commercial information architecture
       * Headings own line one; values own line two. The existing card scroll
       * absorbs the added height, so financial data never competes for width.
       */
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-split,
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-cost-grid,
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-three-sections {
        grid-template-columns: minmax(0, 1fr) !important;
        gap: 6px !important;
      }
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-cost-grid {
        padding: 4px !important;
      }
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-cost-grid .f3-row:nth-child(odd) {
        border-right: 0 !important;
      }
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-row {
        min-height: 52px !important;
        grid-template-columns: 16px minmax(0, 1fr) auto !important;
        grid-template-rows: auto auto !important;
        column-gap: 7px !important;
        row-gap: 4px !important;
        align-content: center !important;
        padding: 7px 8px !important;
      }
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-row-icon {
        grid-column: 1 !important;
        grid-row: 1 / span 2 !important;
        align-self: center !important;
      }
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-row-label {
        grid-column: 2 / 4 !important;
        grid-row: 1 !important;
        white-space: normal !important;
        overflow: visible !important;
        text-overflow: clip !important;
      }
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-row > strong {
        grid-column: 2 !important;
        grid-row: 2 !important;
        justify-self: start !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-row > em {
        grid-column: 3 !important;
        grid-row: 2 !important;
        align-self: center !important;
        justify-self: end !important;
        white-space: nowrap !important;
      }
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-row > input {
        width: 100% !important;
        min-width: 0 !important;
        grid-column: 2 !important;
        grid-row: 2 !important;
      }
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-three-sections .f3-row {
        grid-template-columns: minmax(0, 1fr) auto !important;
      }
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-three-sections .f3-row-icon {
        display: none !important;
      }
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-three-sections .f3-row-label {
        grid-column: 1 / 3 !important;
      }
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-three-sections .f3-row > strong,
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-three-sections .f3-row > input {
        grid-column: 1 !important;
      }
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-three-sections .f3-row > em {
        grid-column: 2 !important;
      }
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-value-card p {
        min-height: 52px !important;
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) !important;
        gap: 4px !important;
        align-content: center !important;
        justify-content: initial !important;
        padding: 7px 0 !important;
      }
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-value-card p > span {
        grid-row: 1 !important;
        white-space: normal !important;
      }
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-value-card p > strong,
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-value-card p > input {
        width: 100% !important;
        min-width: 0 !important;
        grid-row: 2 !important;
        justify-self: stretch !important;
        text-align: left !important;
        white-space: nowrap !important;
      }
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-summary strong,
      .ixi-location-secondary-readable .ixi-location-f3-v12 .f3-total strong {
        white-space: nowrap !important;
      }

      /* Faces 4-5 · Configured operational faces */
      .ixi-location-secondary-readable .ixi-generic-face-v12 .gfv12-banner b,
      .ixi-location-secondary-readable .ixi-generic-face-v12 .gfv12-banner span,
      .ixi-location-secondary-readable .ixi-generic-face-v12 .gfv12-section h3,
      .ixi-location-secondary-readable .ixi-generic-face-v12 .gfv12-value small,
      .ixi-location-secondary-readable .ixi-generic-face-v12 .gfv12-value em,
      .ixi-location-secondary-readable .ixi-generic-face-v12 .gfv12-relations small,
      .ixi-location-secondary-readable .ixi-generic-face-v12 .gfv12-relations em,
      .ixi-location-secondary-readable .ixi-generic-face-v12 .gfv12-empty,
      .ixi-location-secondary-readable .ixi-generic-face-v12 .gfv12-unconfigured span,
      .ixi-location-secondary-readable .ixi-generic-face-v12 .gfv12-editor-head small,
      .ixi-location-secondary-readable .ixi-generic-face-v12 .gfv12-editor-scroll label span {
        font-family: var(--ixi-secondary-font-ui) !important;
        font-size: var(--ixi-secondary-label) !important;
        font-weight: 700 !important;
        line-height: var(--ixi-secondary-label-leading) !important;
      }
      .ixi-location-secondary-readable .ixi-generic-face-v12 .gfv12-value strong,
      .ixi-location-secondary-readable .ixi-generic-face-v12 .gfv12-relations strong,
      .ixi-location-secondary-readable .ixi-generic-face-v12 .gfv12-unconfigured strong {
        color: #f2f4f2;
        font-family: var(--ixi-secondary-font-ui) !important;
        font-size: var(--ixi-secondary-value) !important;
        font-weight: 700 !important;
        line-height: var(--ixi-secondary-value-leading) !important;
      }
      .ixi-location-secondary-readable .ixi-generic-face-v12 .gfv12-value {
        min-height: 44px !important;
      }
      .ixi-location-secondary-readable .ixi-generic-face-v12 .gfv12-relations button {
        min-height: 38px !important;
      }
      .ixi-location-secondary-readable .ixi-generic-face-v12 .gfv12-editor-head strong {
        font-family: var(--ixi-secondary-font-ui) !important;
        font-size: 13px !important;
        line-height: 15px !important;
      }
      .ixi-location-secondary-readable .ixi-generic-face-v12 .gfv12-editor-head button {
        font-family: var(--ixi-secondary-font-ui) !important;
        font-size: 10px !important;
        font-weight: 700 !important;
      }
      .ixi-location-secondary-readable .ixi-generic-face-v12 .gfv12-editor-scroll input {
        height: 28px;
        font-family: var(--ixi-secondary-font-ui) !important;
        font-size: 11px !important;
        font-weight: 700 !important;
        line-height: 26px !important;
      }
    `}</style>
  );
}
