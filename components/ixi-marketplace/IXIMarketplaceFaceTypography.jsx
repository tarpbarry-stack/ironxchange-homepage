export default function IXIMarketplaceFaceTypography() {
  return (
    <style jsx global>{`
      /*
       * BROWSE V2 · MARKETPLACE FACE TYPOGRAPHY
       * ---------------------------------------
       * Production promotion of the FaceLab-approved readable hierarchy.
       * Scope is limited to rendered Machine Faces 2-4. Marketplace Face 1,
       * card geometry, media, rail, actions and movement remain untouched.
       */
      .marketplace-listing-card {
        --ixi-market-face-font: "Inter Variable", Inter, ui-sans-serif, -apple-system,
          BlinkMacSystemFont, "Segoe UI", sans-serif;
        --ixi-market-face-label: 9px;
        --ixi-market-face-label-leading: 12px;
        --ixi-market-face-value: 10px;
        --ixi-market-face-value-leading: 13px;
      }

      .marketplace-listing-card :is(.mof2, .mof3, .mof4),
      .marketplace-listing-card :is(.mof2, .mof3, .mof4) * {
        font-family: var(--ixi-market-face-font) !important;
      }

      /* Face 2 · buyer and seller information */
      .marketplace-listing-card .mof2 :is(
        .mof2-passport-label,
        .mof2-tag-label
      ) {
        font-size: var(--ixi-market-face-label) !important;
        line-height: var(--ixi-market-face-label-leading) !important;
        letter-spacing: .04em !important;
      }
      .marketplace-listing-card .mof2 :is(
        .mof2-passport-id,
        .mof2-tag-value,
        .mof2-title-row
      ) {
        font-size: var(--ixi-market-face-value) !important;
        line-height: var(--ixi-market-face-value-leading) !important;
      }
      .marketplace-listing-card .mof2 h2 {
        font-size: 14px !important;
        line-height: 17px !important;
      }
      .marketplace-listing-card .mof2 .mof2-hours {
        font-size: 11px !important;
        line-height: 14px !important;
      }
      .marketplace-listing-card .mof2 .mof2-price {
        font-size: 18px !important;
        line-height: 21px !important;
      }
      .marketplace-listing-card .mof2 .mof2-bio {
        font-size: 11px !important;
        line-height: 1.42 !important;
      }
      .marketplace-listing-card .mof2 :is(
        .mof2-action-row button,
        .mof2-owner-toolbar button,
        .owner-actions button
      ) {
        font-size: 9px !important;
        line-height: 11px !important;
      }

      /* Face 3 · deal sheet */
      .marketplace-listing-card .mof3 {
        gap: 5px !important;
      }
      .marketplace-listing-card .mof3 .mof3-head,
      .marketplace-listing-card .mof3 .mof3-head strong {
        font-size: 9px !important;
        line-height: 12px !important;
      }
      .marketplace-listing-card .mof3 .mof3-machine-line {
        min-height: 20px !important;
        font-size: 9px !important;
        line-height: 12px !important;
      }
      .marketplace-listing-card .mof3 .mof3-grid {
        gap: 6px !important;
      }
      .marketplace-listing-card .mof3 .mof3-panel {
        padding: 6px !important;
      }
      .marketplace-listing-card .mof3 .mof3-row {
        min-height: 20px !important;
        grid-template-columns: 48px minmax(0, 1fr) !important;
        gap: 5px !important;
      }
      .marketplace-listing-card .mof3 .mof3-label {
        font-size: 9px !important;
        line-height: 12px !important;
        letter-spacing: .025em !important;
      }
      .marketplace-listing-card .mof3 .mof3-value,
      .marketplace-listing-card .mof3 .mof3-value.muted {
        font-size: 10px !important;
        line-height: 13px !important;
      }
      .marketplace-listing-card .mof3 .mof3-input {
        width: 60px !important;
        min-width: 60px !important;
        max-width: 60px !important;
        height: 18px !important;
        font-size: 10px !important;
        line-height: 16px !important;
      }
      .marketplace-listing-card .mof3 .mof3-total {
        height: 30px !important;
      }
      .marketplace-listing-card .mof3 .mof3-total span,
      .marketplace-listing-card .mof3 .mof3-rate span,
      .marketplace-listing-card .mof3 .mof3-payments span {
        font-size: 9px !important;
        line-height: 11px !important;
      }
      .marketplace-listing-card .mof3 .mof3-rate input {
        height: 18px !important;
        font-size: 10px !important;
        line-height: 16px !important;
      }
      .marketplace-listing-card .mof3 .mof3-payments {
        height: 30px !important;
      }
      .marketplace-listing-card .mof3 .mof3-payments strong {
        font-size: 11px !important;
        line-height: 13px !important;
        white-space: nowrap !important;
      }

      /* Face 4 · marketplace invitation */
      .marketplace-listing-card .mof4 .mof4-kicker,
      .marketplace-listing-card .mof4 .mof4-points span,
      .marketplace-listing-card .mof4 .mof4-cta {
        font-size: 10px !important;
        line-height: 13px !important;
      }
      .marketplace-listing-card .mof4 .mof4-copy {
        font-size: 11px !important;
        line-height: 1.42 !important;
      }
    `}</style>
  );
}
