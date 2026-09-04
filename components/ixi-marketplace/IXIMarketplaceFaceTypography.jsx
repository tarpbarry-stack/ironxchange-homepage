export default function IXIMarketplaceFaceTypography() {
  return (
    <style jsx global>{`
      /*
       * PRODUCTION LISTING FACE TYPOGRAPHY
       * ----------------------------------
       * Production promotion of the FaceLab-approved readable hierarchy.
       * Scope is limited to Marketplace and Private Machine Faces 2-4 plus
       * Auction Faces 2-4. Every Face 1, card geometry, media, rail, actions
       * and movement remain untouched.
       */
      :is(.marketplace-listing-card, .private-listing-card) {
        --ixi-listing-face-font: "Inter Variable", Inter, ui-sans-serif, -apple-system,
          BlinkMacSystemFont, "Segoe UI", sans-serif;
        --ixi-listing-face-label: 9px;
        --ixi-listing-face-label-leading: 12px;
        --ixi-listing-face-value: 10px;
        --ixi-listing-face-value-leading: 13px;
      }

      :is(.marketplace-listing-card, .private-listing-card) :is(.mof2, .mof3, .mof4),
      :is(.marketplace-listing-card, .private-listing-card) :is(.mof2, .mof3, .mof4) * {
        font-family: var(--ixi-listing-face-font) !important;
      }

      /* Face 2 · buyer and seller information */
      :is(.marketplace-listing-card, .private-listing-card) .mof2 :is(
        .mof2-passport-label,
        .mof2-tag-label
      ) {
        font-size: var(--ixi-listing-face-label) !important;
        line-height: var(--ixi-listing-face-label-leading) !important;
        letter-spacing: .04em !important;
      }
      :is(.marketplace-listing-card, .private-listing-card) .mof2 :is(
        .mof2-passport-id,
        .mof2-tag-value,
        .mof2-title-row
      ) {
        font-size: var(--ixi-listing-face-value) !important;
        line-height: var(--ixi-listing-face-value-leading) !important;
      }
      :is(.marketplace-listing-card, .private-listing-card) .mof2 h2 {
        font-size: 14px !important;
        line-height: 17px !important;
      }
      :is(.marketplace-listing-card, .private-listing-card) .mof2 .mof2-hours {
        font-size: 11px !important;
        line-height: 14px !important;
      }
      :is(.marketplace-listing-card, .private-listing-card) .mof2 .mof2-price {
        font-size: 18px !important;
        line-height: 21px !important;
      }
      :is(.marketplace-listing-card, .private-listing-card) .mof2 .mof2-bio {
        font-size: 11px !important;
        line-height: 1.42 !important;
      }
      :is(.marketplace-listing-card, .private-listing-card) .mof2 :is(
        .mof2-action-row button,
        .mof2-owner-toolbar button,
        .owner-actions button
      ) {
        font-size: 9px !important;
        line-height: 11px !important;
      }

      /* Face 3 · deal sheet */
      :is(.marketplace-listing-card, .private-listing-card) .mof3 {
        gap: 5px !important;
      }
      :is(.marketplace-listing-card, .private-listing-card) .mof3 .mof3-head,
      :is(.marketplace-listing-card, .private-listing-card) .mof3 .mof3-head strong {
        font-size: 9px !important;
        line-height: 12px !important;
      }
      :is(.marketplace-listing-card, .private-listing-card) .mof3 .mof3-machine-line {
        min-height: 20px !important;
        font-size: 9px !important;
        line-height: 12px !important;
      }
      :is(.marketplace-listing-card, .private-listing-card) .mof3 .mof3-grid {
        gap: 6px !important;
      }
      :is(.marketplace-listing-card, .private-listing-card) .mof3 .mof3-panel {
        padding: 6px !important;
      }
      :is(.marketplace-listing-card, .private-listing-card) .mof3 .mof3-row {
        min-height: 20px !important;
        grid-template-columns: 48px minmax(0, 1fr) !important;
        gap: 5px !important;
      }
      :is(.marketplace-listing-card, .private-listing-card) .mof3 .mof3-label {
        font-size: 9px !important;
        line-height: 12px !important;
        letter-spacing: .025em !important;
      }
      :is(.marketplace-listing-card, .private-listing-card) .mof3 .mof3-value,
      :is(.marketplace-listing-card, .private-listing-card) .mof3 .mof3-value.muted {
        font-size: 10px !important;
        line-height: 13px !important;
      }
      :is(.marketplace-listing-card, .private-listing-card) .mof3 .mof3-input {
        width: 60px !important;
        min-width: 60px !important;
        max-width: 60px !important;
        height: 18px !important;
        font-size: 10px !important;
        line-height: 16px !important;
      }
      :is(.marketplace-listing-card, .private-listing-card) .mof3 .mof3-total {
        height: 30px !important;
      }
      :is(.marketplace-listing-card, .private-listing-card) .mof3 .mof3-total span,
      :is(.marketplace-listing-card, .private-listing-card) .mof3 .mof3-rate span,
      :is(.marketplace-listing-card, .private-listing-card) .mof3 .mof3-payments span {
        font-size: 9px !important;
        line-height: 11px !important;
      }
      :is(.marketplace-listing-card, .private-listing-card) .mof3 .mof3-rate input {
        height: 18px !important;
        font-size: 10px !important;
        line-height: 16px !important;
      }
      :is(.marketplace-listing-card, .private-listing-card) .mof3 .mof3-payments {
        height: 30px !important;
      }
      :is(.marketplace-listing-card, .private-listing-card) .mof3 .mof3-payments strong {
        font-size: 11px !important;
        line-height: 13px !important;
        white-space: nowrap !important;
      }

      /* Face 4 · marketplace invitation */
      :is(.marketplace-listing-card, .private-listing-card) .mof4 .mof4-kicker,
      :is(.marketplace-listing-card, .private-listing-card) .mof4 .mof4-points span,
      :is(.marketplace-listing-card, .private-listing-card) .mof4 .mof4-cta {
        font-size: 10px !important;
        line-height: 13px !important;
      }
      :is(.marketplace-listing-card, .private-listing-card) .mof4 .mof4-copy {
        font-size: 11px !important;
        line-height: 1.42 !important;
      }

      /* Auction Faces 2-4 · live production promotion of FaceLab hierarchy */
      .auction-listing-card {
        --ixi-auction-face-font: "Inter Variable", Inter, ui-sans-serif, -apple-system,
          BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .auction-listing-card :is(.aof2, .aof3, .aof4),
      .auction-listing-card :is(.aof2, .aof3, .aof4) * {
        font-family: var(--ixi-auction-face-font) !important;
      }

      .auction-listing-card :is(
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
        .aof4-intro
      ) {
        font-size: 9px !important;
        line-height: 12px !important;
      }

      .auction-listing-card :is(
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
        .aof4-confirm-actions button
      ) {
        font-size: 10px !important;
        line-height: 13px !important;
      }
    `}</style>
  );
}
