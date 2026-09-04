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
