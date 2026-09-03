export const IXI_V12_TYPE = Object.freeze({
  micro: "10px",
  label: "11px",
  control: "12px",
  body: "13px",
  title: "15px",
  result: "20px"
});

export default function IXIV12ReadabilityFoundation() {
  return (
    <style jsx global>{`
      /*
       * IXI V12 READABILITY FOUNDATION
       * --------------------------------
       * Opt-in only. This selector is the Face 1 firewall: nothing in this
       * foundation targets body/button/span/* or any legacy Face 1 root.
       * A card must explicitly opt in with .ixi-v12-readable-card.
       */
      .ixi-v12-readable-card {
        --ixi-v12-font-ui: "Inter Variable", Inter, ui-sans-serif, -apple-system,
          BlinkMacSystemFont, "Segoe UI", sans-serif;
        --ixi-v12-type-micro: 10px;
        --ixi-v12-leading-micro: 13px;
        --ixi-v12-type-label: 11px;
        --ixi-v12-leading-label: 14px;
        --ixi-v12-type-control: 12px;
        --ixi-v12-leading-control: 16px;
        --ixi-v12-type-body: 13px;
        --ixi-v12-leading-body: 17px;
        --ixi-v12-type-title: 15px;
        --ixi-v12-leading-title: 18px;
        --ixi-v12-type-result: 20px;
        --ixi-v12-leading-result: 22px;
        --ixi-v12-weight-micro: 650;
        --ixi-v12-weight-label: 650;
        --ixi-v12-weight-control: 700;
        --ixi-v12-weight-body: 600;
        --ixi-v12-weight-title: 700;
        --ixi-v12-weight-result: 750;
        --ixi-v12-space-1: 4px;
        --ixi-v12-space-2: 8px;
        --ixi-v12-space-3: 12px;
        --ixi-v12-space-4: 16px;
        --ixi-v12-space-5: 24px;
        --ixi-v12-space-6: 32px;
        --ixi-v12-space-7: 48px;
        font-family: var(--ixi-v12-font-ui);
        font-optical-sizing: auto;
        font-synthesis: none;
        font-variant-numeric: tabular-nums lining-nums;
        text-rendering: optimizeLegibility;
      }

      .ixi-v12-readable-card .ixi-v12-type-micro {
        font-family: var(--ixi-v12-font-ui) !important;
        font-size: var(--ixi-v12-type-micro) !important;
        font-weight: var(--ixi-v12-weight-micro) !important;
        line-height: var(--ixi-v12-leading-micro) !important;
      }

      .ixi-v12-readable-card .ixi-v12-type-label {
        font-family: var(--ixi-v12-font-ui) !important;
        font-size: var(--ixi-v12-type-label) !important;
        font-weight: var(--ixi-v12-weight-label) !important;
        line-height: var(--ixi-v12-leading-label) !important;
      }

      .ixi-v12-readable-card .ixi-v12-type-control {
        font-family: var(--ixi-v12-font-ui) !important;
        font-size: var(--ixi-v12-type-control) !important;
        font-weight: var(--ixi-v12-weight-control) !important;
        line-height: var(--ixi-v12-leading-control) !important;
      }

      .ixi-v12-readable-card .ixi-v12-type-body {
        font-family: var(--ixi-v12-font-ui) !important;
        font-size: var(--ixi-v12-type-body) !important;
        font-weight: var(--ixi-v12-weight-body) !important;
        line-height: var(--ixi-v12-leading-body) !important;
      }

      .ixi-v12-readable-card .ixi-v12-type-title {
        font-family: var(--ixi-v12-font-ui) !important;
        font-size: var(--ixi-v12-type-title) !important;
        font-weight: var(--ixi-v12-weight-title) !important;
        line-height: var(--ixi-v12-leading-title) !important;
      }

      .ixi-v12-readable-card .ixi-v12-type-result {
        font-family: var(--ixi-v12-font-ui) !important;
        font-size: var(--ixi-v12-type-result) !important;
        font-weight: var(--ixi-v12-weight-result) !important;
        line-height: var(--ixi-v12-leading-result) !important;
      }

      /* Shared identity/address roles for 001+ containers. Card-specific files
         retain only placement geometry; typography lives here from now on. */
      .ixi-v12-readable-card .ixi-v12-customer-identity-label {
        display: block;
        width: 100%;
        min-width: 0;
        max-width: 96%;
        margin-bottom: 2px;
        overflow: hidden;
        color: #aeb5b0;
        font-family: var(--ixi-v12-font-ui) !important;
        font-size: var(--ixi-v12-type-micro) !important;
        font-weight: var(--ixi-v12-weight-micro) !important;
        line-height: var(--ixi-v12-leading-micro) !important;
        letter-spacing: .025em;
        text-overflow: ellipsis;
        text-transform: uppercase;
        white-space: nowrap;
      }

      .ixi-v12-readable-card .ixi-v12-customer-identity-value {
        display: block;
        width: 100%;
        min-width: 0;
        max-width: 96%;
        overflow: hidden;
        color: #f2f4f2;
        font-family: var(--ixi-v12-font-ui) !important;
        font-size: var(--ixi-v12-type-label) !important;
        font-weight: 700 !important;
        line-height: 13px !important;
        letter-spacing: .005em;
        text-overflow: ellipsis;
        text-transform: uppercase;
        white-space: nowrap;
      }

      /* Card 003 keeps the exact native right-side address shell. Its half-width
         composition gets a narrow-shell text-fit rule rather than changing geometry. */
      .ixi-v12-readable-card.aos-card003-customer-id-shell .aos-card003-customer-identity {
        min-width: 0;
        overflow: hidden;
        padding: 0 2px;
      }
      .ixi-v12-readable-card.aos-card003-customer-id-shell .ixi-v12-customer-identity-label,
      .ixi-v12-readable-card.aos-card003-customer-id-shell .ixi-v12-customer-identity-value {
        width: 100%;
        max-width: 100%;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ixi-v12-readable-card.aos-card003-customer-id-shell .ixi-v12-customer-identity-label {
        letter-spacing: 0;
        line-height: 11px !important;
      }
      .ixi-v12-readable-card.aos-card003-customer-id-shell .ixi-v12-customer-identity-value {
        font-size: var(--ixi-v12-type-micro) !important;
        line-height: 11px !important;
        letter-spacing: 0;
      }

      .ixi-v12-readable-card .ixi-v12-object-id {
        font-family: var(--ixi-v12-font-ui) !important;
        font-size: var(--ixi-v12-type-micro) !important;
        font-weight: var(--ixi-v12-weight-micro) !important;
        line-height: var(--ixi-v12-leading-micro) !important;
        letter-spacing: .025em !important;
      }

      /* Shared relationship infrastructure: meaningful operational text must not
         remain at the legacy 5-7px sizes. The outer relationship shell is frozen;
         rows grow internally and the existing scroll region handles density. */
      .ixi-v12-readable-card .gov-relations h3 {
        height: 22px !important;
        padding: 0 8px !important;
        font-family: var(--ixi-v12-font-ui) !important;
        font-size: var(--ixi-v12-type-micro) !important;
        font-weight: var(--ixi-v12-weight-control) !important;
        line-height: 12px !important;
        letter-spacing: .02em;
      }
      .ixi-v12-readable-card .gov-relation-scroll {
        height: calc(100% - 22px) !important;
      }
      .ixi-v12-readable-card .gov-relation-scroll button {
        min-height: 38px !important;
        padding: 5px 6px 5px 8px !important;
      }
      .ixi-v12-readable-card .gov-relation-scroll button > span {
        min-width: 0;
        overflow: hidden;
      }
      .ixi-v12-readable-card .gov-relation-scroll small {
        overflow: hidden;
        color: #aeb5b0 !important;
        font-family: var(--ixi-v12-font-ui) !important;
        font-size: var(--ixi-v12-type-micro) !important;
        font-weight: var(--ixi-v12-weight-micro) !important;
        line-height: 11px !important;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ixi-v12-readable-card .gov-relation-scroll strong {
        overflow: hidden;
        margin-top: 2px !important;
        color: #f2f4f2;
        font-family: var(--ixi-v12-font-ui) !important;
        font-size: var(--ixi-v12-type-label) !important;
        font-weight: 700 !important;
        line-height: 13px !important;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ixi-v12-readable-card .gov-relation-scroll em {
        overflow: hidden;
        margin-top: 1px;
        color: #8f9892 !important;
        font-family: var(--ixi-v12-font-ui) !important;
        font-size: var(--ixi-v12-type-micro) !important;
        font-weight: var(--ixi-v12-weight-micro) !important;
        line-height: 11px !important;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ixi-v12-readable-card .gov-empty {
        padding: 14px 8px !important;
        font-family: var(--ixi-v12-font-ui) !important;
        font-size: var(--ixi-v12-type-micro) !important;
        font-weight: var(--ixi-v12-weight-micro) !important;
        line-height: var(--ixi-v12-leading-micro) !important;
      }

      /*
       * V12 EDIT-SHELL CONTRACT
       * -----------------------
       * The legacy generic editor intentionally covered the full face with an
       * opaque sheet. V12 cards keep their native chassis visible during edit.
       * The editor is contained inside the real working-body shell so header,
       * command deck, thumbnails and Object Rail remain physically present.
       */
      .ixi-v12-readable-card .ixi-generic-overview .gov-editor {
        inset: 43px 7px 51px !important;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 5px;
        background: #090c0a;
        box-shadow: inset 0 1px rgba(255,255,255,.035);
      }

      .ixi-v12-readable-card .ixi-generic-overview.gov-001 .gov-editor,
      .ixi-v12-readable-card .ixi-generic-overview.gov-003 .gov-editor {
        inset: 43px 7px 108px !important;
      }

      .ixi-v12-readable-card .gov-editor-head {
        border-bottom: 1px solid var(--line);
        background: #151916;
      }

      .ixi-v12-readable-card .gov-editor-scroll {
        padding: 8px;
        scrollbar-width: thin;
        scrollbar-color: #3d4540 #090b0a;
      }

      .ixi-v12-readable-card .gov-editor-scroll > label {
        padding: 7px;
        border: 1px solid var(--line);
        border-radius: 5px;
        background: #111411;
      }

      .ixi-v12-readable-card .gov-editor-scroll > label span {
        font-family: var(--ixi-v12-font-ui) !important;
        font-size: var(--ixi-v12-type-micro) !important;
        font-weight: var(--ixi-v12-weight-micro) !important;
        line-height: var(--ixi-v12-leading-micro) !important;
      }

      .ixi-v12-readable-card .gov-editor-scroll > label input {
        font-family: var(--ixi-v12-font-ui) !important;
        font-size: var(--ixi-v12-type-label) !important;
        font-weight: var(--ixi-v12-weight-label) !important;
      }
    `}</style>
  );
}
