export default function IXIFaceLabTypography() {
  return (
    <style jsx global>{`
      /*
       * FACE LAB · COMMERCIAL TYPOGRAPHY
       * --------------------------------
       * FaceLab is an inspection workspace, so its chrome and non-protected
       * preview faces use the approved readable type hierarchy. Production
       * faces and every Face 1 composition remain outside this contract.
       */
      .face-lab-page {
        --ixi-lab-font: "Inter Variable", Inter, ui-sans-serif, -apple-system,
          BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-family: var(--ixi-lab-font);
      }

      .face-lab-page .f3-preview-copy span,
      .face-lab-page .f3-preview-copy strong,
      .face-lab-page .f3-preview-actions a,
      .face-lab-page .aos-card-lab-header strong,
      .face-lab-page .studio-title,
      .face-lab-page .preview-title,
      .face-lab-page .inspector-title,
      .face-lab-page .studio-mode-controls button,
      .face-lab-page .preview-size-controls button,
      .face-lab-page .face-group-title,
      .face-lab-page .face-button,
      .face-lab-page .inspector-placeholder,
      .face-lab-page .aos-card-bench .panel-title,
      .face-lab-page .aos-card-bench .card-picker,
      .face-lab-page .aos-card-bench .stage-header,
      .face-lab-page .aos-card-bench .template-facts,
      .face-lab-page .aos-card-bench .panel-message,
      .face-lab-page .ixi-face-lab-size-label,
      .face-lab-page .ixi-card-scale-control {
        font-family: var(--ixi-lab-font) !important;
      }

      .face-lab-page .f3-preview-copy span {
        font-size: 11px !important;
        line-height: 14px !important;
      }
      .face-lab-page .f3-preview-copy strong {
        font-size: 13px !important;
        line-height: 16px !important;
      }
      .face-lab-page .f3-preview-actions a {
        min-height: 34px !important;
        font-size: 11px !important;
        line-height: 14px !important;
      }

      .face-lab-page .aos-card-lab-header strong,
      .face-lab-page .studio-title,
      .face-lab-page .preview-title,
      .face-lab-page .inspector-title,
      .face-lab-page .aos-card-bench .panel-title {
        font-size: 12px !important;
        line-height: 15px !important;
      }
      .face-lab-page .studio-mode-controls button,
      .face-lab-page .preview-size-controls button,
      .face-lab-page .aos-card-bench .stage-header button {
        min-height: 28px !important;
        padding: 0 10px !important;
        font-size: 10px !important;
        line-height: 12px !important;
      }
      .face-lab-page .face-group-title {
        font-size: 10px !important;
        line-height: 13px !important;
      }
      .face-lab-page .face-button {
        min-height: 36px !important;
        font-size: 12px !important;
        font-weight: 800 !important;
        line-height: 15px !important;
      }
      .face-lab-page .inspector-placeholder {
        font-size: 13px !important;
        line-height: 18px !important;
      }

      .face-lab-page .aos-card-bench .card-picker {
        min-height: 58px !important;
        gap: 4px 9px !important;
        padding: 9px !important;
      }
      .face-lab-page .aos-card-bench .card-number {
        font-size: 11px !important;
        line-height: 14px !important;
      }
      .face-lab-page .aos-card-bench .card-name {
        font-size: 12px !important;
        line-height: 15px !important;
      }
      .face-lab-page .aos-card-bench .card-section,
      .face-lab-page .aos-card-bench .stage-identity span,
      .face-lab-page .aos-card-bench .template-facts span {
        font-size: 9px !important;
        line-height: 12px !important;
      }
      .face-lab-page .aos-card-bench .stage-identity strong {
        font-size: 12px !important;
        line-height: 15px !important;
      }
      .face-lab-page .aos-card-bench .template-facts strong,
      .face-lab-page .aos-card-bench .panel-message {
        font-size: 11px !important;
        line-height: 15px !important;
      }
      .face-lab-page .aos-card-bench .template-facts > div {
        padding: 11px 0 !important;
      }
      .face-lab-page .ixi-face-lab-size-label {
        font-size: 11px !important;
        line-height: 14px !important;
        letter-spacing: .045em !important;
      }

      /*
       * Preview-face scope. AOF1 and EOF1 explicitly remain protected.
       * These rules affect only the FaceLab specimen, never the live faces.
       */
      .face-lab-page .face-lab[data-preview-typography="readable"] .face-preview-content,
      .face-lab-page .face-lab[data-preview-typography="readable"] .ixi-face-frame {
        --ixi-face-font-display: 18px !important;
        --ixi-face-font-title: 14px !important;
        --ixi-face-font-section: 10px !important;
        --ixi-face-font-label: 10px !important;
        --ixi-face-font-value: 11px !important;
        --ixi-face-font-micro: 9px !important;
      }
      .face-lab-page .face-lab[data-preview-typography="readable"] .face-preview-content * {
        font-family: var(--ixi-lab-font) !important;
      }
      .face-lab-page .face-lab[data-preview-typography="readable"] .ixi-face-row {
        min-height: 34px !important;
        grid-template-columns: minmax(88px, .9fr) minmax(0, 1.1fr) !important;
        padding: 5px 0 !important;
      }
      .face-lab-page .face-lab[data-preview-typography="readable"] .ixi-face-section-title,
      .face-lab-page .face-lab[data-preview-typography="readable"] .ixi-face-row-label,
      .face-lab-page .face-lab[data-preview-typography="readable"] .ixi-face-summary-label {
        white-space: normal !important;
        overflow: visible !important;
        text-overflow: clip !important;
      }
      .face-lab-page .face-lab[data-preview-typography="readable"] .ixi-face-action-footer .mof-actions button {
        font-size: 10px !important;
        line-height: 12px !important;
      }

      .face-lab-page .face-lab[data-preview-typography="readable"] :is(
        .aof2-passport-label,
        .aof2-event-id-row,
        .aof2-event-meta-row,
        .aof2-tag-label,
        .aof2-basic-terms-title,
        .aof2-basic-terms-lines,
        .aof2-source-listing,
        .aof3-machine-line,
        .aof3-sale-title,
        .aof3-mini-label,
        .aof3-row-label,
        .aof3-profit-label,
        .aof4-machine-line,
        .aof4-intro,
        .mof2-passport-label,
        .mof2-tag-label,
        .mof3-machine-line,
        .mof3-label,
        .mof4-kicker
      ) {
        font-size: 9px !important;
        line-height: 12px !important;
      }

      .face-lab-page .face-lab[data-preview-typography="readable"] :is(
        .aof2-passport-id,
        .aof2-company-name,
        .aof2-company-date,
        .aof2-company-location,
        .aof2-tag-value,
        .aof2-title-row,
        .aof2-term,
        .aof2-basic-terms,
        .aof2-source-link,
        .aof3-advertised-row,
        .aof3-bid-pack-title,
        .aof3-mini-value,
        .aof3-row-value,
        .aof4-actions button,
        .aof4-confirm-list,
        .aof4-confirm-actions button,
        .mof2-passport-id,
        .mof2-tag-value,
        .mof2-title-row,
        .mof3-row,
        .mof3-input,
        .mof4-copy,
        .mof4-cta
      ) {
        font-size: 10px !important;
        line-height: 13px !important;
      }

      @media (max-width: 1050px) {
        .face-lab-page .f3-preview-launcher {
          align-items: flex-start !important;
          flex-direction: column !important;
        }
        .face-lab-page .f3-preview-actions {
          width: 100% !important;
          flex-wrap: wrap !important;
        }
      }
    `}</style>
  );
}
