export default function IXIAosCommercialCardTypography() {
  return (
    <style jsx global>{`
      /*
       * AOS COMMERCIAL CARD TYPOGRAPHY
       * --------------------------------
       * Cards 004-017 opt in through IXIAosCardHeaderIdentity. Their native
       * 298 x 471 chassis is immutable; density is handled by the cards'
       * existing scroll regions instead of unreadable type or clipped data.
       */
      .ixi-aos-header-identity-shell {
        --aos-commercial-micro: 7px;
        --aos-commercial-label: 7.5px;
        --aos-commercial-value: 9px;
        --aos-commercial-control: 8px;
        font-family: "Inter Variable", Inter, ui-sans-serif, -apple-system,
          BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-optical-sizing: auto;
        font-synthesis: none;
        font-variant-numeric: tabular-nums lining-nums;
        text-rendering: optimizeLegibility;
      }

      .ixi-aos-header-identity-shell :is(
        .ixi-generic-container-v12,
        .go007-card,
        .u007-card,
        .c009-card,
        .c010-card,
        .c011-card,
        .c012-card,
        .c013-card,
        .c014-card,
        .c015-card,
        .c016-card,
        .c017-card
      ) {
        font-family: inherit !important;
      }

      .ixi-aos-header-identity-shell :is(
        .ixi-generic-container-v12,
        .ixi-generic-object-007,
        .ixi-universal-card-007,
        .ixi-universal-card-007b,
        .ixi-universal-card-007c,
        .ixi-card-009,
        .ixi-card-010,
        .ixi-card-011,
        .ixi-card-012,
        .ixi-card-013,
        .ixi-card-014,
        .ixi-card-015,
        .ixi-card-016,
        .ixi-card-017
      ) small {
        font-size: var(--aos-commercial-micro) !important;
        line-height: 1.2 !important;
      }

      .ixi-aos-header-identity-shell :is(
        .gcv12-editor,
        .go007-editor,
        .u007-editor,
        .c009-editor,
        .c010-editor,
        .c011-editor,
        .c012-editor,
        .c013-editor,
        .c014-editor,
        .c015-editor,
        .c016-editor,
        .c017-editor
      ) label > span {
        font-size: var(--aos-commercial-label) !important;
        line-height: 1.25 !important;
      }

      .ixi-aos-header-identity-shell :is(
        .gcv12-editor,
        .go007-editor,
        .u007-editor,
        .c009-editor,
        .c010-editor,
        .c011-editor,
        .c012-editor,
        .c013-editor,
        .c014-editor,
        .c015-editor,
        .c016-editor,
        .c017-editor
      ) :is(input, textarea, select) {
        min-height: 28px;
        font-family: inherit !important;
        font-size: var(--aos-commercial-value) !important;
        line-height: 1.25 !important;
      }

      .ixi-aos-header-identity-shell :is(
        .gcv12-editor,
        .go007-editor,
        .u007-editor,
        .c009-editor,
        .c010-editor,
        .c011-editor,
        .c012-editor,
        .c013-editor,
        .c014-editor,
        .c015-editor,
        .c016-editor,
        .c017-editor
      ) button {
        min-height: 24px;
        font-family: inherit !important;
        font-size: var(--aos-commercial-control) !important;
      }

      /* Long object identities get two honest lines. The technical sample-use
         string is removed from the compact identity band, not from the data. */
      .ixi-aos-header-identity-shell :is(
        .go007-identity,
        .u007-identity,
        .c009-identity,
        .c010-identity,
        .c011-identity,
        .c012-identity,
        .c013-identity,
        .c014-identity,
        .c015-identity,
        .c016-identity,
        .c017-identity
      ) h2 {
        display: -webkit-box !important;
        overflow: hidden !important;
        white-space: normal !important;
        text-overflow: clip !important;
        line-height: 1.08 !important;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
      }
      .ixi-aos-header-identity-shell :is(
        .c009-identity,
        .c010-identity,
        .c011-identity,
        .c012-identity,
        .c013-identity,
        .c014-identity,
        .c015-identity,
        .c016-identity,
        .c017-identity
      ) > small {
        display: none !important;
      }

      /* Operational labels and section chrome share one readable floor. */
      .ixi-aos-header-identity-shell :is(
        .gcv12-section-title,
        .go007-section-title,
        .u007-section-title,
        .c009-title,
        .c010-title,
        .c011-title,
        .c012-title,
        .c013-title,
        .c014-title,
        .c015-title,
        .c016-title,
        .c017-title
      ) {
        min-height: 21px;
        font-size: var(--aos-commercial-label) !important;
        line-height: 1.15 !important;
      }

      .ixi-aos-header-identity-shell :is(
        .gcv12-commands,
        .go007-commands,
        .u007-commands,
        .c009-commands,
        .c010-commands,
        .c011-commands,
        .c012-commands,
        .c013-commands,
        .c014-commands,
        .c015-commands,
        .c016-commands,
        .c017-commands
      ) button,
      .ixi-aos-header-identity-shell :is(
        .gcv12-commands,
        .go007-commands,
        .u007-commands,
        .c009-commands,
        .c010-commands,
        .c011-commands,
        .c012-commands,
        .c013-commands,
        .c014-commands,
        .c015-commands,
        .c016-commands,
        .c017-commands
      ) b {
        font-family: inherit !important;
        font-size: var(--aos-commercial-label) !important;
      }

      /* The chassis stays fixed while longer records remain reachable. */
      .ixi-aos-header-identity-shell :is(
        .gcv12-body,
        .go007-scroll,
        .u007-body,
        .c009-body,
        .c010-body,
        .c011-body,
        .c012-body,
        .c013-body,
        .c014-body,
        .c015-body,
        .c016-body,
        .c017-body
      ) {
        overflow-x: hidden !important;
        overflow-y: auto !important;
        scrollbar-color: #4d5550 #090b0a;
        scrollbar-width: thin;
      }
    `}</style>
  );
}
