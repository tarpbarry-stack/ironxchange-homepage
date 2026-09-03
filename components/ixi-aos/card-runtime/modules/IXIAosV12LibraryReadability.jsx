export default function IXIAosV12LibraryReadability() {
  return (
    <style jsx global>{`
      .ixi-v12-library-readable {
        --ixi-v12-font-ui: "Inter Variable", Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-family: var(--ixi-v12-font-ui) !important;
        font-optical-sizing: auto;
        font-synthesis: none;
        font-variant-numeric: tabular-nums lining-nums;
        text-rendering: optimizeLegibility;
      }
      .ixi-v12-library-readable input,
      .ixi-v12-library-readable button,
      .ixi-v12-library-readable select,
      .ixi-v12-library-readable textarea {
        font-family: var(--ixi-v12-font-ui) !important;
      }

      /* Identity and section labels only; no icon or media selectors. */
      .ixi-v12-library-readable [class*="-identity"] > span,
      .ixi-v12-library-readable [class$="-title"],
      .ixi-v12-library-readable [class*="-section-title"] {
        font-size: 10px !important;
        line-height: 12px !important;
      }
      .ixi-v12-library-readable [class*="-identity"] h2,
      .ixi-v12-library-readable [class*="-identity-copy"] h2 {
        font-size: 15px !important;
        line-height: 17px !important;
        font-weight: 750 !important;
      }
      .ixi-v12-library-readable [class*="-identity"] small {
        font-size: 9px !important;
        line-height: 11px !important;
      }
      .ixi-v12-library-readable [class*="-identity-copy"] p {
        font-size: 11px !important;
        line-height: 14px !important;
      }

      /* Dense operational text roles. */
      .ixi-v12-library-readable [class*="-row"] > span,
      .ixi-v12-library-readable [class*="-detail"] > span,
      .ixi-v12-library-readable [class*="-fact"] small,
      .ixi-v12-library-readable [class*="-support"] > span,
      .ixi-v12-library-readable [class*="-kpi"] small,
      .ixi-v12-library-readable [class*="-metric-row"] > span,
      .ixi-v12-library-readable [class*="-relationship"] small,
      .ixi-v12-library-readable [class*="-relations"] small,
      .ixi-v12-library-readable [class*="-contact-panel"] small {
        font-size: 10px !important;
        line-height: 12px !important;
      }
      .ixi-v12-library-readable [class*="-row"] > strong,
      .ixi-v12-library-readable [class*="-detail"] > strong,
      .ixi-v12-library-readable [class*="-fact"] strong,
      .ixi-v12-library-readable [class*="-support"] > strong,
      .ixi-v12-library-readable [class*="-kpi"] strong,
      .ixi-v12-library-readable [class*="-metric-row"] > strong,
      .ixi-v12-library-readable [class*="-relationship"] strong,
      .ixi-v12-library-readable [class*="-relations"] strong,
      .ixi-v12-library-readable [class*="-contact-panel"] strong {
        font-size: 11px !important;
        line-height: 13px !important;
      }
      .ixi-v12-library-readable [class*="-relationship"] em,
      .ixi-v12-library-readable [class*="-relations"] em {
        font-size: 10px !important;
        line-height: 12px !important;
      }
      .ixi-v12-library-readable [class*="-tags"] span {
        font-size: 10px !important;
        line-height: 12px !important;
      }

      .ixi-v12-library-readable [class*="-commands"] button b,
      .ixi-v12-library-readable [class*="-actions"] button b {
        font-size: 10px !important;
        line-height: 12px !important;
      }

      /* Explicit dense-card hero text: icons and marks are deliberately excluded. */
      .ixi-v12-library-readable .c010-hero span,
      .ixi-v12-library-readable .c011-primary span,
      .ixi-v12-library-readable .c011-primary small,
      .ixi-v12-library-readable .gcv12-hero small,
      .ixi-v12-library-readable .gcv12-status-tile small {
        font-size: 10px !important;
        line-height: 12px !important;
      }
      .ixi-v12-library-readable .c010-hero strong,
      .ixi-v12-library-readable .gcv12-hero-values strong,
      .ixi-v12-library-readable .gcv12-status-tile strong {
        font-size: 11px !important;
        line-height: 13px !important;
      }

      /* Shared edit control typography. */
      .ixi-v12-library-readable .ixi-face1-edit-input {
        width: 100%;
        min-width: 0;
        height: 24px;
        padding: 0 6px;
        border: 1px solid #59615b;
        border-radius: 4px;
        background: #0a0d0b;
        color: #f3f5f3;
        font-size: 11px !important;
        font-weight: 700;
        line-height: 22px !important;
        outline: none;
      }
      .ixi-v12-library-readable .ixi-face1-edit-input:focus {
        border-color: #ffc40099;
        box-shadow: 0 0 0 1px #ffc40022;
      }
    `}</style>
  );
}
