export default function IXIAosOfficeSkinCompatibilityStyles() {
  return (
    <style jsx global>{`
      /* ============================================================
         IXI AOS LOCATION — EXECUTIVE / INDUSTRIAL SYSTEM
         Approved direction: dense, readable, structured, premium.
         Native card geometry remains 298 × 471.
         ============================================================ */

      .card001,
      .ixi-aos-location-f2,
      .f3-financial,
      .f4-obligations,
      .f5 {
        --ix-bg:#090b0d;
        --ix-bg2:#0c0f12;
        --ix-s1:#101419;
        --ix-s2:#14191e;
        --ix-s3:#191f25;
        --ix-line:rgba(255,255,255,.095);
        --ix-line-soft:rgba(255,255,255,.055);
        --ix-white:#f6f7f8;
        --ix-silver:#aeb6bd;
        --ix-muted:#737d86;
        --ix-yellow:#ffc400;
        --ix-yellow2:#e5b100;
        --ix-green:#8bd92f;
        --ix-red:#ff4b3e;
        --ix-blue:#5aa8ff;
        color-scheme:dark;
        font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif !important;
        -webkit-font-smoothing:antialiased;
        text-rendering:optimizeLegibility;
      }

      .card001,
      .ixi-aos-location-f2,
      .f3-financial,
      .f4-obligations,
      .f5 {
        border:1px solid rgba(255,255,255,.10) !important;
        border-radius:14px !important;
        background:
          radial-gradient(130% 64% at 50% -12%,rgba(255,255,255,.055),transparent 45%),
          linear-gradient(180deg,#101316 0%,#0b0e10 48%,#090b0d 100%) !important;
        color:var(--ix-white) !important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.045),
          inset 0 -1px 0 rgba(0,0,0,.72),
          0 18px 46px rgba(0,0,0,.44) !important;
      }

      /* ------------------------------------------------------------
         IDENTITY + SHARED HEADER
         ------------------------------------------------------------ */
      .card001 .identity span,
      .ixi-aos-location-f2 .ops-identity span,
      .f3-financial .f3-ident span,
      .f4-obligations .f4-ident span,
      .f5 .f5-head > div > span {
        color:var(--ix-yellow) !important;
        font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif !important;
        font-size:6.8px !important;
        font-weight:800 !important;
        letter-spacing:.095em !important;
      }

      .card001 .identity strong,
      .ixi-aos-location-f2 .ops-identity strong,
      .f3-financial .f3-ident b,
      .f4-obligations .f4-ident b,
      .f5 .f5-head > div > b {
        color:#fafafa !important;
        font-family:Georgia,"Times New Roman",serif !important;
        font-weight:800 !important;
        letter-spacing:-.025em !important;
        text-shadow:0 1px 0 rgba(0,0,0,.6) !important;
      }

      .card001 .ixi-aos-card-header-controls,
      .ixi-aos-location-f2 .ixi-aos-card-header-controls,
      .f3-financial .ixi-aos-card-header-controls,
      .f4-obligations .ixi-aos-card-header-controls,
      .f5 .ixi-aos-card-header-controls {
        border:1px solid rgba(255,255,255,.075) !important;
        border-radius:8px !important;
        background:linear-gradient(180deg,rgba(255,255,255,.024),rgba(255,255,255,.006)) !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.025) !important;
      }

      .card001 .ixi-aos-card-header-controls .header-action,
      .ixi-aos-location-f2 .ixi-aos-card-header-controls .header-action,
      .f3-financial .ixi-aos-card-header-controls .header-action,
      .f4-obligations .ixi-aos-card-header-controls .header-action,
      .f5 .ixi-aos-card-header-controls .header-action {
        border-left-color:rgba(255,255,255,.055) !important;
        background:transparent !important;
      }

      /* ============================================================
         F1 — LOCATION 001 / 002 / 003
         ============================================================ */
      .card001 .header {
        border-bottom:1px solid var(--ix-line-soft) !important;
        background:linear-gradient(180deg,rgba(255,255,255,.018),transparent) !important;
      }
      .card001 .identity strong { font-size:17.5px !important; }

      .card001 .photo {
        background:#07090a !important;
        box-shadow:inset 0 -1px 0 rgba(255,255,255,.045) !important;
      }
      .card001 .ixi-aos-primary-media-panel {
        background:
          radial-gradient(circle at 50% 50%,rgba(255,255,255,.018),transparent 48%),
          #07090a !important;
        border:0 !important;
        border-radius:0 !important;
      }

      .card001 .preview-info-strip {
        border-top:1px solid var(--ix-line-soft) !important;
        border-bottom:1px solid var(--ix-line-soft) !important;
        background:linear-gradient(180deg,#0f1215,#0a0c0e) !important;
      }
      .card001 .preview-info-strip strong {
        color:#e8ebed !important;
        font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif !important;
        font-size:7.7px !important;
        font-weight:750 !important;
      }
      .card001 .preview-position { color:#707a82 !important; font-size:6.8px !important; }
      .card001 .preview-out { color:var(--ix-yellow) !important; font-size:7.4px !important; font-weight:800 !important; }

      /* Address is a deliberate information plate, not floating text. */
      .card001 .address {
        width:274px !important;
        margin:5px auto 0 !important;
        border:1px solid rgba(255,255,255,.085) !important;
        border-radius:6px !important;
        background:
          linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.012)),
          #101419 !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.025) !important;
      }
      .card001 .address .ixi-aos-inline-address {
        min-height:28px !important;
        padding:0 9px !important;
        background:transparent !important;
        border:0 !important;
      }
      .card001 .address .ixi-aos-inline-address strong {
        width:100% !important;
        color:#f0f2f3 !important;
        font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif !important;
        font-size:8.2px !important;
        font-weight:720 !important;
        line-height:1.15 !important;
        text-align:center !important;
      }

      /* Three real instruments instead of text on a blank line. */
      .card001 .metrics {
        width:274px !important;
        margin:5px auto 0 !important;
      }
      .card001 .metrics .ixi-aos-inline-metrics {
        width:274px !important;
        min-height:43px !important;
        display:grid !important;
        grid-template-columns:1fr 1.25fr 1fr !important;
        gap:4px !important;
        padding:0 !important;
        border:0 !important;
        background:transparent !important;
      }
      .card001 .metrics .ixi-aos-inline-metric {
        min-width:0 !important;
        min-height:43px !important;
        display:flex !important;
        flex-direction:column !important;
        align-items:center !important;
        justify-content:center !important;
        gap:3px !important;
        border:1px solid rgba(255,255,255,.08) !important;
        border-radius:6px !important;
        background:linear-gradient(180deg,#151a1f,#101419) !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.02) !important;
      }
      .card001 .metrics .ixi-aos-inline-metric span {
        color:var(--ix-yellow) !important;
        font-size:6.5px !important;
        font-weight:800 !important;
        letter-spacing:.075em !important;
      }
      .card001 .metrics .ixi-aos-inline-metric strong {
        color:#fff !important;
        font-size:12px !important;
        font-weight:780 !important;
        letter-spacing:-.02em !important;
        line-height:1 !important;
      }

      /* Relationship ledger — this is the high-capacity body. */
      .card001 .relationships {
        margin:6px 10px 0 !important;
        border:1px solid rgba(255,255,255,.075) !important;
        border-radius:7px !important;
        overflow:hidden !important;
        background:linear-gradient(180deg,rgba(255,255,255,.018),rgba(255,255,255,.004)) !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.018) !important;
      }
      .card001 .relationships .ixi-face-section {
        border:0 !important;
        border-radius:0 !important;
        background:transparent !important;
        box-shadow:none !important;
      }
      .card001 .relationships .ixi-face-section-title {
        position:relative !important;
        height:25px !important;
        display:flex !important;
        align-items:center !important;
        padding:0 9px 0 12px !important;
        border-bottom:1px solid rgba(255,255,255,.08) !important;
        background:linear-gradient(180deg,#151a1f,#111519) !important;
        color:var(--ix-yellow) !important;
        font-size:7px !important;
        font-weight:820 !important;
        letter-spacing:.065em !important;
      }
      .card001 .relationships .ixi-face-section-title::before {
        content:"";
        position:absolute;
        left:0;
        top:0;
        bottom:0;
        width:3px;
        background:linear-gradient(180deg,#ffd735,#d9a600) !important;
        box-shadow:0 0 10px rgba(255,196,0,.16) !important;
      }
      .card001 .relationships .panel-scroll { padding:0 !important; }
      .card001 .relationships .relationship-row {
        height:25px !important;
        padding:0 8px !important;
        border:0 !important;
        border-bottom:1px solid rgba(255,255,255,.05) !important;
        border-radius:0 !important;
        background:#0f1316 !important;
        transition:background .14s ease !important;
      }
      .card001 .relationships .relationship-row:nth-child(even) { background:#12171b !important; }
      .card001 .relationships .relationship-row:hover { background:#171d22 !important; }
      .card001 .relationships .relationship-row strong {
        color:#edf0f2 !important;
        font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif !important;
        font-size:7.4px !important;
        font-weight:750 !important;
        letter-spacing:.01em !important;
      }
      .card001 .relationships .relationship-row span {
        color:#919aa2 !important;
        font-size:6.7px !important;
        font-weight:680 !important;
      }
      .card001 .relationships .relationship-row b {
        color:#c8ced3 !important;
        font-size:10px !important;
        font-weight:500 !important;
      }
      .card001 .relationships .relationship-row:hover b { color:var(--ix-yellow) !important; }

      /* 002 is intentionally information-first, matching approved mockup. */
      .card002-variant .card001 .photo,
      .card002-variant .card001 .preview-info-strip { display:none !important; }
      .card002-variant .card001 .body {
        bottom:47px !important;
        padding:7px 0 0 !important;
      }
      .card002-variant .card001 .address {
        width:274px !important;
        min-height:49px !important;
        margin:0 auto !important;
        display:flex !important;
        align-items:center !important;
        background:linear-gradient(180deg,#171c21,#111519) !important;
      }
      .card002-variant .card001 .address .ixi-aos-inline-address {
        min-height:47px !important;
        padding:0 13px !important;
      }
      .card002-variant .card001 .address .ixi-aos-inline-address strong {
        text-align:left !important;
        font-size:8.4px !important;
        line-height:1.3 !important;
      }
      .card002-variant .card001 .metrics { margin-top:5px !important; }
      .card002-variant .card001 .relationships {
        flex:1 !important;
        min-height:0 !important;
        margin-top:6px !important;
      }

      /* 003 split layout: media left, real physical identity right. */
      .card003-variant .card001 .address {
        border:0 !important;
        border-radius:0 !important;
        margin:0 !important;
        background:linear-gradient(180deg,#14191e,#0e1215) !important;
        box-shadow:none !important;
      }
      .card003-variant .card001 .address .ixi-aos-inline-address strong {
        color:#f1f3f4 !important;
        font-size:8.1px !important;
        font-weight:730 !important;
        line-height:1.25 !important;
      }
      .card003-variant .card003-contact-overlay {
        border-top:1px solid rgba(255,255,255,.09) !important;
        background:rgba(255,255,255,.008) !important;
      }
      .card003-variant .card003-contact-overlay strong {
        color:#f0f2f3 !important;
        font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif !important;
        font-size:7.5px !important;
        font-weight:730 !important;
      }
      .card003-variant .card003-contact-overlay span {
        color:#98a1a8 !important;
        font-size:6.7px !important;
        font-weight:650 !important;
      }

      /* ============================================================
         F2 — OPERATIONS
         ============================================================ */
      .ixi-aos-location-f2 {
        --ops-bg:var(--ix-bg) !important;
        --ops-panel:var(--ix-s1) !important;
        --ops-line:var(--ix-line) !important;
        --ops-muted:var(--ix-muted) !important;
        --ops-text:var(--ix-white) !important;
        --ops-accent:var(--ix-yellow) !important;
      }
      .ixi-aos-location-f2 .ops-header {
        border-bottom:1px solid var(--ix-line-soft) !important;
        background:linear-gradient(180deg,rgba(255,255,255,.02),transparent) !important;
      }
      .ixi-aos-location-f2 .ops-identity strong { font-size:16px !important; }
      .ixi-aos-location-f2 .ops-scroll { background:transparent !important; }
      .ixi-aos-location-f2 .gate-code {
        margin:7px 7px 6px !important;
        min-height:38px !important;
        border:1px solid rgba(255,196,0,.30) !important;
        border-radius:7px !important;
        background:linear-gradient(180deg,rgba(255,196,0,.075),rgba(255,196,0,.025)),#111519 !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.025) !important;
      }
      .ixi-aos-location-f2 .gate-code span { color:var(--ix-yellow) !important; font-size:7px !important; font-weight:820 !important; }
      .ixi-aos-location-f2 .gate-code strong { color:#fff !important; font-size:16px !important; font-weight:760 !important; }
      .ixi-aos-location-f2 .ops-section {
        margin:0 7px 6px !important;
        border:1px solid rgba(255,255,255,.08) !important;
        border-radius:7px !important;
        overflow:hidden !important;
        background:linear-gradient(180deg,#11161a,#0e1215) !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.018) !important;
      }
      .ixi-aos-location-f2 .ops-section-title {
        height:22px !important;
        display:flex !important;
        align-items:center !important;
        padding:0 9px !important;
        border-bottom:1px solid rgba(255,255,255,.075) !important;
        background:#151a1f !important;
        color:var(--ix-yellow) !important;
        font-size:7px !important;
        font-weight:820 !important;
        letter-spacing:.055em !important;
      }
      .ixi-aos-location-f2 .ops-row {
        min-height:24px !important;
        padding:0 8px !important;
        border-bottom:1px solid rgba(255,255,255,.05) !important;
        background:#0f1316 !important;
      }
      .ixi-aos-location-f2 .ops-row:nth-child(even) { background:#12171b !important; }
      .ixi-aos-location-f2 .ops-label,
      .ixi-aos-location-f2 .ops-cell-label { color:#929ba3 !important; font-size:6.5px !important; font-weight:700 !important; }
      .ixi-aos-location-f2 .ops-row strong,
      .ixi-aos-location-f2 .ops-cell strong { color:#f0f2f3 !important; font-size:7.1px !important; font-weight:730 !important; }
      .ixi-aos-location-f2 .ops-icon,
      .ixi-aos-location-f2 .ops-cell-icon { color:#c9d0d5 !important; }
      .ixi-aos-location-f2 .ops-grid.two { gap:4px !important; padding:4px !important; }
      .ixi-aos-location-f2 .ops-cell {
        min-height:39px !important;
        border:1px solid rgba(255,255,255,.07) !important;
        border-radius:5px !important;
        background:linear-gradient(180deg,#171c21,#12171b) !important;
      }
      .ixi-aos-location-f2 .ops-cell.emphasis strong { color:var(--ix-green) !important; }

      /* ============================================================
         F3 — FINANCIAL
         Kill paper/certificate look in V12 office mode.
         ============================================================ */
      .f3-financial {
        --paper:var(--ix-bg) !important;
        --paper2:var(--ix-s1) !important;
        --ink:var(--ix-white) !important;
        --ink-soft:#89939b !important;
        --accent:var(--ix-yellow) !important;
        --line:rgba(255,255,255,.09) !important;
        --line-soft:rgba(255,255,255,.05) !important;
        --panel:var(--ix-s1) !important;
        --money:#f5f7f8 !important;
        --negative:var(--ix-red) !important;
        font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif !important;
      }
      .f3-financial::before,.f3-financial::after,.f3-financial .currency-ornament { display:none !important; }
      .f3-financial .f3-header {
        border-bottom:1px solid var(--ix-line-soft) !important;
        background:linear-gradient(180deg,rgba(255,255,255,.02),transparent) !important;
      }
      .f3-financial .f3-ident b { font-size:15.5px !important; }
      .f3-financial .face-banner {
        height:20px !important;
        clip-path:none !important;
        border:1px solid rgba(255,196,0,.24) !important;
        border-radius:6px !important;
        background:linear-gradient(180deg,rgba(255,196,0,.075),rgba(255,196,0,.02)) !important;
        color:var(--ix-yellow) !important;
        font:800 6.5px -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif !important;
      }
      .f3-financial .ownership,
      .f3-financial .f3-section {
        border:1px solid rgba(255,255,255,.08) !important;
        border-radius:6px !important;
        background:linear-gradient(180deg,#13181d,#0f1316) !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.018) !important;
      }
      .f3-financial .f3-section > h3 {
        height:20px !important;
        display:flex !important;
        align-items:center !important;
        padding:0 7px !important;
        border-bottom:1px solid rgba(255,255,255,.07) !important;
        background:#171c21 !important;
        color:var(--ix-yellow) !important;
        font:800 6.4px -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif !important;
        letter-spacing:.045em !important;
      }
      .f3-financial .ownership-seal {
        border-color:rgba(255,196,0,.42) !important;
        color:var(--ix-yellow) !important;
      }
      .f3-financial .ownership-copy b { color:#fff !important; }
      .f3-financial .f3-row { border-bottom-color:rgba(255,255,255,.05) !important; }
      .f3-financial .f3-row span { color:#89939b !important; font:700 5.5px -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif !important; }
      .f3-financial .f3-row b { color:#eef1f3 !important; font:730 6.2px -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif !important; }
      .f3-financial .big-value { border-color:rgba(255,255,255,.08) !important; background:linear-gradient(180deg,#171d22,#111519) !important; }
      .f3-financial .big-value::before { display:none !important; }
      .f3-financial .big-value b { color:#fff !important; }
      .f3-financial .summary-grid > b { border-color:rgba(255,255,255,.07) !important; background:#151a1f !important; color:#fff !important; }

      /* ============================================================
         F4 — EXPENSES / OBLIGATIONS
         ============================================================ */
      .f4-obligations {
        --bg:var(--ix-bg) !important;
        --panel:var(--ix-s1) !important;
        --line:var(--ix-line) !important;
        --text:var(--ix-white) !important;
        --muted:var(--ix-muted) !important;
        --accent:var(--ix-yellow) !important;
      }
      .f4-obligations .f4-paper-ornament { display:none !important; }
      .f4-obligations .f4-header { background:linear-gradient(180deg,rgba(255,255,255,.02),transparent) !important; border-bottom-color:var(--ix-line-soft) !important; }
      .f4-obligations .f4-ident b { font-size:15.5px !important; }
      .f4-obligations .f4-banner {
        border-color:rgba(255,196,0,.26) !important;
        border-radius:6px !important;
        background:linear-gradient(180deg,rgba(255,196,0,.075),rgba(255,196,0,.02)) !important;
        color:var(--ix-yellow) !important;
      }
      .f4-obligations .f4-control > *,
      .f4-obligations .f4-section {
        border-color:rgba(255,255,255,.08) !important;
        background:linear-gradient(180deg,#13181d,#0f1316) !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.018) !important;
      }
      .f4-obligations .f4-section h3 {
        background:#171c21 !important;
        color:var(--ix-yellow) !important;
        border-bottom-color:rgba(255,255,255,.07) !important;
      }
      .f4-obligations .f4-row:nth-child(even) { background:rgba(255,255,255,.014) !important; }
      .f4-obligations .f4-row strong,
      .f4-obligations .f4-row b { color:#eef1f3 !important; }
      .f4-obligations .f4-row span { color:#929ba3 !important; }
      .f4-obligations .f4-status.s-paid,
      .f4-obligations .f4-status.s-active,
      .f4-obligations .f4-status.s-auto { color:var(--ix-green) !important; border-color:rgba(139,217,47,.38) !important; }
      .f4-obligations .f4-status.s-open,
      .f4-obligations .f4-status.s-scheduled { color:var(--ix-yellow) !important; border-color:rgba(255,196,0,.35) !important; }

      /* ============================================================
         F5 — MAINTENANCE / FACILITY
         Same family, with status color reserved for actual status.
         ============================================================ */
      .f5 {
        --bg:var(--ix-bg) !important;
        --panel:var(--ix-s1) !important;
        --line:var(--ix-line) !important;
        --text:var(--ix-white) !important;
        --muted:var(--ix-muted) !important;
        --accent:var(--ix-yellow) !important;
        --good:var(--ix-green) !important;
        --warn:var(--ix-yellow) !important;
        --bad:var(--ix-red) !important;
      }
      .f5 .f5-head { border-bottom-color:var(--ix-line-soft) !important; background:linear-gradient(180deg,rgba(255,255,255,.02),transparent) !important; }
      .f5 .f5-head > div > b { font-size:15.5px !important; }
      .f5 .f5-banner {
        border:1px solid rgba(255,196,0,.22) !important;
        border-radius:6px !important;
        background:linear-gradient(180deg,rgba(255,196,0,.07),rgba(255,196,0,.02)) !important;
        color:var(--ix-yellow) !important;
      }
      .f5 .f5-sec {
        border-color:rgba(255,255,255,.08) !important;
        background:linear-gradient(180deg,#13181d,#0f1316) !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.018) !important;
      }
      .f5 .f5-sec > h3 {
        background:#171c21 !important;
        color:var(--ix-yellow) !important;
        border-bottom-color:rgba(255,255,255,.07) !important;
      }
      .f5 .health,
      .f5 .nextdue,
      .f5 .attention > div,
      .f5 .systems > div {
        background:#101419 !important;
      }
      .f5 .attention > div:nth-child(even),
      .f5 .systems > div:nth-child(even) { background:#13181d !important; }
      .f5 .table .tr { border-bottom-color:rgba(255,255,255,.05) !important; }
      .f5 .table .tr:nth-child(even) { background:rgba(255,255,255,.014) !important; }

      /* ------------------------------------------------------------
         Final polish: selection, scrollbars, compact interaction.
         ------------------------------------------------------------ */
      .card001 ::selection,
      .ixi-aos-location-f2 ::selection,
      .f3-financial ::selection,
      .f4-obligations ::selection,
      .f5 ::selection { background:rgba(255,196,0,.28); color:#fff; }

      .card001 *::-webkit-scrollbar,
      .ixi-aos-location-f2 *::-webkit-scrollbar,
      .f3-financial *::-webkit-scrollbar,
      .f4-obligations *::-webkit-scrollbar,
      .f5 *::-webkit-scrollbar { width:4px; height:4px; }
      .card001 *::-webkit-scrollbar-thumb,
      .ixi-aos-location-f2 *::-webkit-scrollbar-thumb,
      .f3-financial *::-webkit-scrollbar-thumb,
      .f4-obligations *::-webkit-scrollbar-thumb,
      .f5 *::-webkit-scrollbar-thumb { background:#4b5258; border-radius:99px; }
      .card001 *::-webkit-scrollbar-track,
      .ixi-aos-location-f2 *::-webkit-scrollbar-track,
      .f3-financial *::-webkit-scrollbar-track,
      .f4-obligations *::-webkit-scrollbar-track,
      .f5 *::-webkit-scrollbar-track { background:transparent; }
    `}</style>
  );
}
