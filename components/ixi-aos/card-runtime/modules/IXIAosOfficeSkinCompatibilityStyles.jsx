export default function IXIAosOfficeSkinCompatibilityStyles() {
  return (
    <style jsx global>{`
      /* ============================================================
         IXI AOS LOCATION — PREMIUM OFFICE SYSTEM
         Native geometry remains 298 x 471.
         Dense field V13 controls stay reserved for field applications.
         This skin is the Location management / executive language.
         ============================================================ */

      .card001,
      .ixi-aos-location-f2,
      .f3-financial,
      .f4-obligations,
      .f5 {
        --ixi-loc-bg: #0a0c0e;
        --ixi-loc-surface: #0f1215;
        --ixi-loc-surface-2: #13171b;
        --ixi-loc-surface-3: #171c20;
        --ixi-loc-line: rgba(255,255,255,.075);
        --ixi-loc-line-soft: rgba(255,255,255,.045);
        --ixi-loc-text: #f4f6f7;
        --ixi-loc-text-2: rgba(244,246,247,.72);
        --ixi-loc-text-3: rgba(244,246,247,.46);
        --ixi-loc-yellow: #ffc400;
        --ixi-loc-yellow-soft: rgba(255,196,0,.10);
        --ixi-loc-green: #8bd92f;
        --ixi-loc-red: #ff4b3e;
        --ixi-loc-blue: #58a8ff;
      }

      /* ---------- shared chassis ---------- */
      .card001,
      .ixi-aos-location-f2,
      .f3-financial,
      .f4-obligations,
      .f5 {
        border: 1px solid rgba(255,255,255,.085) !important;
        border-radius: 15px !important;
        background:
          radial-gradient(120% 70% at 50% -10%, rgba(255,255,255,.045), transparent 45%),
          linear-gradient(180deg,#0f1214 0%,#0b0d0f 52%,#090b0d 100%) !important;
        color: var(--ixi-loc-text) !important;
        font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif !important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.04),
          inset 0 -1px 0 rgba(0,0,0,.72),
          0 18px 42px rgba(0,0,0,.40) !important;
      }

      .card001 .identity strong,
      .f3-financial .f3-ident b,
      .f4-obligations .f4-ident b,
      .f5 .f5-head > div > b {
        font-family: Georgia, "Times New Roman", serif !important;
        color: #f7f7f4 !important;
        font-weight: 800 !important;
        letter-spacing: -.02em !important;
      }

      .card001 .identity span,
      .ixi-aos-location-f2 .ops-identity span,
      .f3-financial .f3-ident span,
      .f4-obligations .f4-ident span,
      .f5 .f5-head > div > span {
        color: var(--ixi-loc-yellow) !important;
        font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif !important;
        font-weight: 800 !important;
        letter-spacing: .08em !important;
      }

      /* ---------- compact shared header controls ---------- */
      .card001 .ixi-aos-card-header-controls,
      .ixi-aos-location-f2 .ixi-aos-card-header-controls,
      .f3-financial .ixi-aos-card-header-controls,
      .f4-obligations .ixi-aos-card-header-controls,
      .f5 .ixi-aos-card-header-controls {
        border: 1px solid rgba(255,255,255,.075) !important;
        border-radius: 8px !important;
        background: linear-gradient(180deg,rgba(255,255,255,.025),rgba(255,255,255,.008)) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.025) !important;
        overflow: visible !important;
      }

      .card001 .ixi-aos-card-header-controls .header-action,
      .ixi-aos-location-f2 .ixi-aos-card-header-controls .header-action,
      .f3-financial .ixi-aos-card-header-controls .header-action,
      .f4-obligations .ixi-aos-card-header-controls .header-action,
      .f5 .ixi-aos-card-header-controls .header-action {
        border-left-color: rgba(255,255,255,.055) !important;
        background: transparent !important;
      }

      .card001 .ixi-aos-card-header-controls .header-action:hover,
      .ixi-aos-location-f2 .ixi-aos-card-header-controls .header-action:hover,
      .f3-financial .ixi-aos-card-header-controls .header-action:hover,
      .f4-obligations .ixi-aos-card-header-controls .header-action:hover,
      .f5 .ixi-aos-card-header-controls .header-action:hover {
        background: rgba(255,255,255,.025) !important;
        color: var(--ixi-loc-yellow) !important;
      }

      /* ============================================================
         F1 / LOCATION 001, 002, 003
         ============================================================ */
      .card001 .address {
        width: 274px !important;
        margin-top: 0 !important;
        border-bottom: 1px solid var(--ixi-loc-line-soft) !important;
        background: linear-gradient(180deg,rgba(255,255,255,.018),rgba(255,255,255,.004)) !important;
      }

      .card001 .address .ixi-aos-inline-address {
        min-height: 28px !important;
        padding: 0 8px !important;
      }

      .card001 .address .ixi-aos-inline-address strong {
        color: rgba(255,255,255,.92) !important;
        font-size: 9px !important;
        font-weight: 760 !important;
        line-height: 1.12 !important;
      }

      .card001 .metrics {
        width: 274px !important;
        margin-top: 0 !important;
      }

      .card001 .metrics .ixi-aos-inline-metrics {
        width: 274px !important;
        min-height: 36px !important;
        padding: 4px 0 !important;
        border-top: 0 !important;
        border-bottom: 1px solid var(--ixi-loc-line) !important;
        background: linear-gradient(180deg,rgba(255,255,255,.016),rgba(255,255,255,.002)) !important;
      }

      .card001 .metrics .ixi-aos-inline-metric {
        min-width: 91px !important;
        justify-content: center !important;
        gap: 6px !important;
        border-right: 1px solid var(--ixi-loc-line-soft) !important;
      }
      .card001 .metrics .ixi-aos-inline-metric:last-child { border-right: 0 !important; }
      .card001 .metrics .ixi-aos-inline-metric span {
        color: rgba(255,196,0,.78) !important;
        font-size: 7px !important;
        font-weight: 800 !important;
        letter-spacing: .07em !important;
      }
      .card001 .metrics .ixi-aos-inline-metric strong {
        color: #fff !important;
        font-size: 12.5px !important;
        font-weight: 780 !important;
        letter-spacing: -.02em !important;
      }

      .card001 .relationships {
        margin-left: 10px !important;
        margin-right: 10px !important;
      }
      .card001 .relationships .ixi-face-section {
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
      }
      .card001 .relationships .ixi-face-section-title {
        position: relative !important;
        height: 23px !important;
        display: flex !important;
        align-items: center !important;
        padding: 0 8px 0 10px !important;
        border-bottom: 1px solid var(--ixi-loc-line) !important;
        color: var(--ixi-loc-yellow) !important;
        font-size: 7.2px !important;
        font-weight: 820 !important;
        letter-spacing: .07em !important;
      }
      .card001 .relationships .ixi-face-section-title::before {
        content: "";
        position: absolute;
        left: 0;
        top: 6px;
        bottom: 6px;
        width: 2px;
        border-radius: 2px;
        background: var(--ixi-loc-yellow);
        opacity: .85;
      }

      .card001 .relationships .panel-scroll {
        padding-top: 2px !important;
      }
      .card001 .relationships .relationship-row {
        height: 24px !important;
        padding: 0 7px !important;
        border: 0 !important;
        border-bottom: 1px solid rgba(255,255,255,.045) !important;
        border-radius: 0 !important;
        background: rgba(255,255,255,.008) !important;
        transition: background .14s ease, border-color .14s ease !important;
      }
      .card001 .relationships .relationship-row:nth-child(even) {
        background: rgba(255,255,255,.018) !important;
      }
      .card001 .relationships .relationship-row:hover {
        background: rgba(255,196,0,.045) !important;
        border-bottom-color: rgba(255,196,0,.16) !important;
      }
      .card001 .relationships .relationship-row strong {
        color: rgba(255,255,255,.92) !important;
        font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif !important;
        font-size: 7.8px !important;
        font-weight: 760 !important;
        letter-spacing: .01em !important;
      }
      .card001 .relationships .relationship-row span {
        color: rgba(210,218,224,.58) !important;
        font-size: 7px !important;
        font-weight: 700 !important;
      }
      .card001 .relationships .relationship-row b {
        color: rgba(255,196,0,.72) !important;
        font-size: 11px !important;
        font-weight: 500 !important;
      }

      .card001 .preview-info-strip {
        background: linear-gradient(180deg,#0d1012,#0a0c0e) !important;
      }
      .card001 .preview-info-strip strong {
        font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif !important;
        color: rgba(255,255,255,.86) !important;
        font-size: 7.6px !important;
        font-weight: 760 !important;
      }

      .card003-variant .card003-contact-overlay {
        border-top-color: rgba(255,255,255,.08) !important;
      }
      .card003-variant .card003-contact-overlay strong {
        color: rgba(255,255,255,.9) !important;
        font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif !important;
        font-size: 7.8px !important;
        font-weight: 760 !important;
      }
      .card003-variant .card003-contact-overlay span {
        color: rgba(210,218,224,.58) !important;
        font-size: 7px !important;
      }
      .card003-variant .card001 .address {
        border-bottom: 0 !important;
        background: linear-gradient(180deg,rgba(255,255,255,.018),rgba(255,255,255,.004)) !important;
      }

      /* ============================================================
         F2 — OPERATIONS
         ============================================================ */
      .ixi-aos-location-f2 {
        --ops-bg: var(--ixi-loc-bg) !important;
        --ops-panel: var(--ixi-loc-surface) !important;
        --ops-line: var(--ixi-loc-line) !important;
        --ops-muted: var(--ixi-loc-text-3) !important;
        --ops-text: var(--ixi-loc-text) !important;
        --ops-accent: var(--ixi-loc-yellow) !important;
      }
      .ixi-aos-location-f2 .ops-header {
        border-bottom: 1px solid var(--ixi-loc-line) !important;
        background: linear-gradient(180deg,rgba(255,255,255,.02),rgba(255,255,255,0)) !important;
      }
      .ixi-aos-location-f2 .ops-identity strong {
        color: #f7f7f4 !important;
        font-family: Georgia, "Times New Roman", serif !important;
        font-size: 16px !important;
        font-weight: 800 !important;
      }
      .ixi-aos-location-f2 .ops-scroll {
        background: transparent !important;
      }
      .ixi-aos-location-f2 .gate-code {
        min-height: 34px !important;
        margin: 7px 7px 6px !important;
        padding: 0 11px !important;
        border: 1px solid rgba(255,196,0,.28) !important;
        border-radius: 7px !important;
        background: linear-gradient(180deg,rgba(255,196,0,.07),rgba(255,196,0,.025)) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.025) !important;
      }
      .ixi-aos-location-f2 .gate-code span {
        color: var(--ixi-loc-yellow) !important;
        font-size: 7px !important;
        font-weight: 820 !important;
      }
      .ixi-aos-location-f2 .gate-code strong {
        color: #fff !important;
        font-size: 16px !important;
        font-weight: 760 !important;
        letter-spacing: .06em !important;
      }
      .ixi-aos-location-f2 .ops-section {
        margin: 0 7px 6px !important;
        border: 1px solid var(--ixi-loc-line) !important;
        border-radius: 7px !important;
        background: linear-gradient(180deg,var(--ixi-loc-surface),rgba(15,18,21,.72)) !important;
        overflow: hidden !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.018) !important;
      }
      .ixi-aos-location-f2 .ops-section-title {
        height: 22px !important;
        display: flex !important;
        align-items: center !important;
        padding: 0 9px !important;
        border-bottom: 1px solid var(--ixi-loc-line) !important;
        background: rgba(255,255,255,.012) !important;
        color: var(--ixi-loc-yellow) !important;
        font-size: 7px !important;
        font-weight: 820 !important;
        letter-spacing: .055em !important;
      }
      .ixi-aos-location-f2 .ops-row {
        min-height: 24px !important;
        padding: 0 8px !important;
        border-bottom: 1px solid var(--ixi-loc-line-soft) !important;
        background: transparent !important;
      }
      .ixi-aos-location-f2 .ops-row:nth-child(even) { background: rgba(255,255,255,.012) !important; }
      .ixi-aos-location-f2 .ops-icon { color: rgba(255,196,0,.7) !important; }
      .ixi-aos-location-f2 .ops-label {
        color: rgba(210,218,224,.62) !important;
        font-size: 6.8px !important;
        font-weight: 760 !important;
      }
      .ixi-aos-location-f2 .ops-row strong {
        color: #f5f6f7 !important;
        font-size: 7.2px !important;
        font-weight: 730 !important;
      }
      .ixi-aos-location-f2 .ops-grid.two {
        gap: 4px !important;
        padding: 5px !important;
      }
      .ixi-aos-location-f2 .ops-cell {
        min-height: 37px !important;
        border: 1px solid var(--ixi-loc-line) !important;
        border-radius: 6px !important;
        background: linear-gradient(180deg,rgba(255,255,255,.025),rgba(255,255,255,.008)) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.018) !important;
      }
      .ixi-aos-location-f2 .ops-cell-label {
        color: rgba(210,218,224,.58) !important;
        font-size: 6.3px !important;
        font-weight: 760 !important;
      }
      .ixi-aos-location-f2 .ops-cell strong {
        color: #f4f6f7 !important;
        font-size: 7.2px !important;
        font-weight: 760 !important;
      }
      .ixi-aos-location-f2 .ops-cell.emphasis strong { color: var(--ixi-loc-green) !important; }
      .ixi-aos-location-f2 .ops-wide {
        margin: 0 5px 5px !important;
        border-top: 1px solid var(--ixi-loc-line-soft) !important;
        color: var(--ixi-loc-text-2) !important;
      }
      .ixi-aos-location-f2 .ops-relationship {
        border: 0 !important;
        border-bottom: 1px solid var(--ixi-loc-line-soft) !important;
        border-radius: 0 !important;
        background: transparent !important;
        color: var(--ixi-loc-text) !important;
      }
      .ixi-aos-location-f2 .ops-relationship b { color: var(--ixi-loc-yellow) !important; }

      /* ============================================================
         F3 — FINANCIAL
         ============================================================ */
      .f3-financial {
        --paper: var(--ixi-loc-bg) !important;
        --paper2: var(--ixi-loc-surface) !important;
        --ink: var(--ixi-loc-text) !important;
        --ink-soft: var(--ixi-loc-text-3) !important;
        --accent: var(--ixi-loc-yellow) !important;
        --line: var(--ixi-loc-line) !important;
        --line-soft: var(--ixi-loc-line-soft) !important;
        --panel: var(--ixi-loc-surface) !important;
        --money: var(--ixi-loc-green) !important;
        --negative: var(--ixi-loc-red) !important;
      }
      .f3-financial::before,
      .f3-financial::after,
      .f3-financial .currency-ornament { display:none !important; }
      .f3-financial .f3-header {
        border-bottom: 1px solid var(--ixi-loc-line) !important;
        background: linear-gradient(180deg,rgba(255,255,255,.02),transparent) !important;
      }
      .f3-financial .f3-scroll { padding: 6px 7px 10px !important; }
      .f3-financial .face-banner {
        height: 20px !important;
        margin-bottom: 6px !important;
        border: 1px solid rgba(255,196,0,.24) !important;
        border-radius: 6px !important;
        clip-path: none !important;
        background: linear-gradient(180deg,rgba(255,196,0,.075),rgba(255,196,0,.025)) !important;
        color: var(--ixi-loc-yellow) !important;
        font-size: 6.5px !important;
        letter-spacing: .055em !important;
      }
      .f3-financial .ownership,
      .f3-financial .f3-section {
        border: 1px solid var(--ixi-loc-line) !important;
        border-radius: 7px !important;
        background: linear-gradient(180deg,var(--ixi-loc-surface),rgba(15,18,21,.72)) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.018) !important;
      }
      .f3-financial .ownership-seal {
        border-color: rgba(255,196,0,.38) !important;
        color: var(--ixi-loc-yellow) !important;
      }
      .f3-financial .ownership-copy b { color: #fff !important; font-size: 13px !important; }
      .f3-financial .ownership-copy small { color: var(--ixi-loc-green) !important; }
      .f3-financial .ownership-date { border-left-color: var(--ixi-loc-line) !important; }
      .f3-financial .ownership-date b { color:#fff !important; font-size:7px !important; }
      .f3-financial .f3-section > h3 {
        height: 20px !important;
        padding: 6px 7px !important;
        border-bottom: 1px solid var(--ixi-loc-line) !important;
        background: rgba(255,255,255,.012) !important;
        color: var(--ixi-loc-yellow) !important;
        font-size: 6.5px !important;
        letter-spacing: .055em !important;
      }
      .f3-financial .f3-row {
        min-height: 23px !important;
        border-bottom: 1px solid var(--ixi-loc-line-soft) !important;
      }
      .f3-financial .f3-row span { color: rgba(210,218,224,.55) !important; font-size:5.4px !important; }
      .f3-financial .f3-row b { color: rgba(255,255,255,.92) !important; font-size:6.4px !important; }
      .f3-financial .big-value {
        border: 1px solid var(--ixi-loc-line) !important;
        border-radius: 6px !important;
        background: linear-gradient(180deg,rgba(255,255,255,.025),rgba(255,255,255,.006)) !important;
      }
      .f3-financial .big-value::before { display:none !important; }
      .f3-financial .big-value b { color: var(--ixi-loc-green) !important; }
      .f3-financial .summary-grid > b {
        border-color: var(--ixi-loc-line) !important;
        border-radius: 5px !important;
        background: rgba(255,255,255,.018) !important;
      }
      .f3-financial .relationship-grid button {
        border: 0 !important;
        border-bottom: 1px solid var(--ixi-loc-line-soft) !important;
        border-radius:0 !important;
        background:transparent !important;
        color:var(--ixi-loc-text-2) !important;
      }
      .f3-financial .relationship-grid button b { color:var(--ixi-loc-yellow) !important; }

      /* ============================================================
         F4 — EXPENSES / OBLIGATIONS
         ============================================================ */
      .f4-obligations .f4-paper-ornament { display:none !important; }
      .f4-obligations .f4-header {
        border-bottom:1px solid var(--ixi-loc-line) !important;
        background:linear-gradient(180deg,rgba(255,255,255,.02),transparent) !important;
      }
      .f4-obligations .f4-scroll { background:transparent !important; }
      .f4-obligations .f4-banner {
        border:1px solid rgba(255,196,0,.24) !important;
        border-radius:6px !important;
        background:linear-gradient(180deg,rgba(255,196,0,.075),rgba(255,196,0,.025)) !important;
        color:var(--ixi-loc-yellow) !important;
      }
      .f4-obligations .f4-control {
        gap:4px !important;
      }
      .f4-obligations .f4-next,
      .f4-obligations .f4-metric,
      .f4-obligations .f4-section {
        border-color:var(--ixi-loc-line) !important;
        border-radius:7px !important;
        background:linear-gradient(180deg,var(--ixi-loc-surface),rgba(15,18,21,.72)) !important;
        color:var(--ixi-loc-text) !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.018) !important;
      }
      .f4-obligations .f4-next > span,
      .f4-obligations .f4-metric span { color:rgba(210,218,224,.55) !important; }
      .f4-obligations .f4-next > b { color:var(--ixi-loc-green) !important; }
      .f4-obligations .f4-section > h3 {
        border-bottom:1px solid var(--ixi-loc-line) !important;
        background:rgba(255,255,255,.012) !important;
        color:var(--ixi-loc-yellow) !important;
      }
      .f4-obligations .f4-table-head {
        color:rgba(210,218,224,.48) !important;
        background:rgba(255,255,255,.012) !important;
      }
      .f4-obligations .f4-row {
        border-bottom-color:var(--ixi-loc-line-soft) !important;
        background:transparent !important;
      }
      .f4-obligations .f4-row:nth-child(even) { background:rgba(255,255,255,.012) !important; }
      .f4-obligations .f4-row strong,
      .f4-obligations .f4-row b { color:rgba(255,255,255,.9) !important; }
      .f4-obligations .f4-row span { color:rgba(210,218,224,.62) !important; }
      .f4-obligations .f4-list > div { border-bottom-color:var(--ixi-loc-line-soft) !important; }
      .f4-obligations .f4-wide-action,
      .f4-obligations .f4-relations button {
        border-color:var(--ixi-loc-line) !important;
        background:rgba(255,255,255,.012) !important;
        color:var(--ixi-loc-text-2) !important;
      }
      .f4-obligations .f4-wide-action span,
      .f4-obligations .f4-relations button b { color:var(--ixi-loc-yellow) !important; }

      /* ============================================================
         F5 — MAINTENANCE
         ============================================================ */
      .f5 {
        --bg:var(--ixi-loc-bg) !important;
        --panel:var(--ixi-loc-surface) !important;
        --line:var(--ixi-loc-line) !important;
        --text:var(--ixi-loc-text) !important;
        --muted:var(--ixi-loc-text-3) !important;
        --accent:var(--ixi-loc-yellow) !important;
        --good:var(--ixi-loc-green) !important;
        --warn:#ffb11f !important;
        --bad:var(--ixi-loc-red) !important;
      }
      .f5 .f5-head {
        border-bottom:1px solid var(--ixi-loc-line) !important;
        background:linear-gradient(180deg,rgba(255,255,255,.02),transparent) !important;
      }
      .f5 .f5-banner {
        border:1px solid rgba(255,196,0,.24) !important;
        border-radius:6px !important;
        background:linear-gradient(180deg,rgba(255,196,0,.075),rgba(255,196,0,.025)) !important;
        color:var(--ixi-loc-yellow) !important;
      }
      .f5 .f5-sec {
        border-color:var(--ixi-loc-line) !important;
        border-radius:7px !important;
        background:linear-gradient(180deg,var(--ixi-loc-surface),rgba(15,18,21,.72)) !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.018) !important;
      }
      .f5 .f5-sec > h3 {
        border-bottom:1px solid var(--ixi-loc-line) !important;
        background:rgba(255,255,255,.012) !important;
        color:var(--ixi-loc-yellow) !important;
      }
      .f5 .health-ring {
        border-color:rgba(139,217,47,.40) !important;
        background:radial-gradient(circle,rgba(139,217,47,.10),transparent 68%) !important;
      }
      .f5 .health-ring b { color:#fff !important; }
      .f5 .health-ring span { color:var(--ixi-loc-green) !important; }
      .f5 .health-metrics > div { border-left-color:var(--ixi-loc-line) !important; }
      .f5 .attention > div,
      .f5 .systems > div,
      .f5 .table .tr,
      .f5 .table .th {
        border-color:var(--ixi-loc-line-soft) !important;
      }
      .f5 .attention > div,
      .f5 .systems > div { background:rgba(255,255,255,.012) !important; }
      .f5 .systems > div:nth-child(even) { background:rgba(255,255,255,.022) !important; }
      .f5 .wide,
      .f5 .relations button {
        border-color:var(--ixi-loc-line) !important;
        background:rgba(255,255,255,.012) !important;
        color:var(--ixi-loc-text-2) !important;
      }
      .f5 .relations button b { color:var(--ixi-loc-yellow) !important; }

      /* ---------- keep legacy selectable skins available outside v12 ---------- */
      .card001:has(.ixi-aos-card-header-controls.skin-steel) { border-color:rgba(210,220,224,.24) !important; }
      .card001:has(.ixi-aos-card-header-controls.skin-blueprint) { border-color:rgba(61,184,255,.28) !important; }
      .card001:has(.ixi-aos-card-header-controls.skin-industrial) { border-color:rgba(255,190,65,.28) !important; }
    `}</style>
  );
}
