export default function IXIAosLocationVisualCorrections() {
  return (
    <style jsx global>{`
      /* ============================================================
         LOCATION FAMILY — TRAN$ACT CONTRAST SYSTEM
         Preserve 298 x 471, data contracts and behavior.
         Visual doctrine: near-black chassis, lifted charcoal shells,
         crisp neutral borders, white primary text, gray secondary text,
         IXI yellow only for identity/action/status. No blue chrome.
         ============================================================ */

      .ixi-location-overview,
      .ixi-aos-location-f2,
      .f3-financial,
      .f4-obligations,
      .f5 {
        --loc-canvas:#080b09;
        --loc-chassis:#0b0f0c;
        --loc-shell:#111613;
        --loc-shell-2:#151b17;
        --loc-shell-3:#1a211c;
        --loc-line:#303832;
        --loc-line-soft:#242b26;
        --loc-line-hi:#3b443d;
        --loc-text:#f4f5f4;
        --loc-text-2:#b8bdb9;
        --loc-text-3:#7d847f;
        --loc-yellow:#ffc400;
        --loc-green:#8bd92f;
        --loc-red:#ff4b3e;
      }

      /* ---------- shared chassis ---------- */
      .ixi-location-overview,
      .ixi-aos-location-f2,
      .f3-financial,
      .f4-obligations,
      .f5 {
        background:
          linear-gradient(180deg,rgba(255,255,255,.018),transparent 24%),
          var(--loc-chassis) !important;
        border-color:var(--loc-line) !important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.025),
          0 14px 34px rgba(0,0,0,.42) !important;
      }

      /* ============================================================
         NEW F1 — 001 / 002 / 003
         ============================================================ */
      .ixi-location-overview .loc-head {
        background:#0d110e !important;
        border-bottom-color:var(--loc-line-soft) !important;
      }

      .ixi-location-overview .loc-media,
      .ixi-location-overview .split-media {
        background:#050705 !important;
        border-color:var(--loc-line-soft) !important;
      }

      .ixi-location-overview .loc-preview {
        background:#0b0f0c !important;
        border-bottom-color:var(--loc-line-soft) !important;
      }

      /* Address/contact shells match TRAN$ACT module cards. */
      .ixi-location-overview .loc-address-card,
      .ixi-location-overview .loc-contact-card {
        background:var(--loc-shell) !important;
        border-color:var(--loc-line) !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.018) !important;
      }
      .ixi-location-overview .loc-contact-card {
        border-left:1px solid var(--loc-line) !important;
      }
      .ixi-location-overview .loc-contact-person {
        border-top-color:var(--loc-line) !important;
      }
      .ixi-location-overview .loc-contact-person strong,
      .ixi-location-overview .loc-address-card .ixi-aos-inline-address strong,
      .ixi-location-overview .loc-contact-address .ixi-aos-inline-address strong {
        color:var(--loc-text) !important;
      }
      .ixi-location-overview .loc-contact-person span {
        color:var(--loc-text-3) !important;
      }

      /* Metric shells: distinct cells, same contrast ratio as TRAN$ACT tiles. */
      .ixi-location-overview .loc-metrics .ixi-aos-inline-metric {
        border-color:var(--loc-line) !important;
        background:var(--loc-shell) !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.018) !important;
      }
      .ixi-location-overview .loc-metrics .ixi-aos-inline-metric:hover {
        background:var(--loc-shell-2) !important;
        border-color:var(--loc-line-hi) !important;
      }
      .ixi-location-overview .loc-metrics .ixi-aos-inline-metric span {
        color:#d0a800 !important;
      }
      .ixi-location-overview .loc-metrics .ixi-aos-inline-metric strong {
        color:#fff !important;
      }

      /* Relationship body is the main container shell, not a floating dark void. */
      .ixi-location-overview .loc-relationships {
        border-color:var(--loc-line) !important;
        background:var(--loc-shell) !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.018) !important;
      }
      .ixi-location-overview .loc-relationships .ixi-face-section-title {
        background:#0e130f !important;
        border-bottom-color:var(--loc-line) !important;
        color:var(--loc-yellow) !important;
      }
      .ixi-location-overview .loc-relationships .relationship-row {
        background:#101511 !important;
        border-bottom-color:var(--loc-line-soft) !important;
      }
      .ixi-location-overview .loc-relationships .relationship-row:nth-child(even) {
        background:#141a16 !important;
      }
      .ixi-location-overview .loc-relationships .relationship-row:hover {
        background:#192019 !important;
      }
      .ixi-location-overview .loc-relationships .relationship-row strong {
        color:#f0f2f0 !important;
      }
      .ixi-location-overview .loc-relationships .relationship-row span {
        color:#8d948f !important;
      }
      .ixi-location-overview .loc-relationships .relationship-row b {
        color:#d0a800 !important;
      }

      .ixi-location-overview .loc-commands {
        border-top-color:var(--loc-line-soft) !important;
        border-bottom-color:var(--loc-line-soft) !important;
        background:#090c0a !important;
      }
      .ixi-location-overview .loc-commands button {
        border-right-color:var(--loc-line-soft) !important;
      }
      .ixi-location-overview .loc-thumbs {
        border-top-color:var(--loc-line-soft) !important;
        background:#070907 !important;
      }

      /* 002 should read as one executive information stack. */
      .ixi-location-002 .loc-address-card,
      .ixi-location-002 .loc-metrics .ixi-aos-inline-metric,
      .ixi-location-002 .loc-relationships {
        border-color:var(--loc-line) !important;
        background:var(--loc-shell) !important;
      }

      /* 003 split top: two defined adjoining shells, no blue divider. */
      .ixi-location-003 .loc-split-top {
        border-bottom-color:var(--loc-line) !important;
        background:#090c0a !important;
      }
      .ixi-location-003 .loc-contact-card {
        background:var(--loc-shell) !important;
      }

      /* ============================================================
         F2 — OPERATIONS
         ============================================================ */
      .ixi-aos-location-f2 {
        --ops-bg:var(--loc-chassis) !important;
        --ops-panel:var(--loc-shell) !important;
        --ops-line:var(--loc-line) !important;
        --ops-muted:var(--loc-text-3) !important;
        --ops-text:var(--loc-text) !important;
        --ops-accent:var(--loc-yellow) !important;
      }
      .ixi-aos-location-f2 .ops-header {
        background:#0d110e !important;
        border-bottom-color:var(--loc-line-soft) !important;
      }
      .ixi-aos-location-f2 .gate-code,
      .ixi-aos-location-f2 .ops-section {
        border-color:var(--loc-line) !important;
        background:var(--loc-shell) !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.018) !important;
      }
      .ixi-aos-location-f2 .gate-code {
        border-color:#655413 !important;
        background:#151407 !important;
      }
      .ixi-aos-location-f2 .ops-section-title {
        background:#0e130f !important;
        border-bottom-color:var(--loc-line) !important;
      }
      .ixi-aos-location-f2 .ops-row,
      .ixi-aos-location-f2 .ops-cell,
      .ixi-aos-location-f2 .ops-wide {
        border-color:var(--loc-line-soft) !important;
        background:#101511 !important;
      }
      .ixi-aos-location-f2 .ops-cell:nth-child(even),
      .ixi-aos-location-f2 .ops-row:nth-child(even) {
        background:#141a16 !important;
      }
      .ixi-aos-location-f2 .ops-icon,
      .ixi-aos-location-f2 .ops-relationship b {
        color:var(--loc-yellow) !important;
      }

      /* ============================================================
         F3 — keep the good architecture, adopt neutral contrast only.
         ============================================================ */
      .f3-financial .f3-header {
        background:#0d110e !important;
        border-bottom-color:var(--loc-line-soft) !important;
      }
      .f3-financial .ownership,
      .f3-financial .f3-section,
      .f3-financial .big-value,
      .f3-financial .summary-grid>b {
        border-color:var(--loc-line) !important;
        background:var(--loc-shell) !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.018) !important;
      }
      .f3-financial .f3-section>h3 {
        background:#0e130f !important;
        border-bottom-color:var(--loc-line) !important;
      }
      .f3-financial .f3-row {
        border-bottom-color:var(--loc-line-soft) !important;
      }
      .f3-financial .big-value b {
        color:#fff !important;
      }

      /* ============================================================
         F4 — same neutral shell contrast + contained totals.
         ============================================================ */
      .f4-obligations .f4-header {
        background:#0d110e !important;
        border-bottom-color:var(--loc-line-soft) !important;
      }
      .f4-obligations .f4-next,
      .f4-obligations .f4-metric,
      .f4-obligations .f4-section {
        border-color:var(--loc-line) !important;
        background:var(--loc-shell) !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.018) !important;
      }
      .f4-obligations .f4-section>h3,
      .f4-obligations .f4-table-head {
        background:#0e130f !important;
        border-bottom-color:var(--loc-line) !important;
      }
      .f4-obligations .f4-row {
        border-bottom-color:var(--loc-line-soft) !important;
        background:#101511 !important;
      }
      .f4-obligations .f4-row:nth-child(even) {
        background:#141a16 !important;
      }
      .f4-obligations .f4-control {
        display:grid !important;
        grid-template-columns:minmax(0,1.75fr) repeat(3,minmax(0,.72fr)) !important;
        gap:4px !important;
        width:100% !important;
      }
      .f4-obligations .f4-next,
      .f4-obligations .f4-metric {
        min-width:0 !important;
        width:auto !important;
        overflow:hidden !important;
      }
      .f4-obligations .f4-metric { padding-left:3px !important; padding-right:3px !important; }
      .f4-obligations .f4-metric b {
        display:block !important;
        max-width:100% !important;
        overflow:hidden !important;
        font-size:9.2px !important;
        line-height:1.05 !important;
        letter-spacing:-.035em !important;
        white-space:nowrap !important;
        text-align:center !important;
      }

      /* ============================================================
         F5 — preserve layout/status semantics; neutralize chrome blue.
         ============================================================ */
      .f5 {
        --bg:var(--loc-chassis) !important;
        --panel:var(--loc-shell) !important;
        --line:var(--loc-line) !important;
        --text:var(--loc-text) !important;
        --muted:var(--loc-text-3) !important;
        --accent:var(--loc-yellow) !important;
      }
      .f5 .f5-head {
        background:#0d110e !important;
        border-bottom-color:var(--loc-line-soft) !important;
      }
      .f5 .f5-banner,
      .f5 .f5-sec {
        border-color:var(--loc-line) !important;
        background:var(--loc-shell) !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.018) !important;
      }
      .f5 .f5-sec>h3 {
        background:#0e130f !important;
        border-bottom-color:var(--loc-line) !important;
        color:var(--loc-yellow) !important;
      }
      .f5 .attention>div,
      .f5 .systems>div,
      .f5 .table .tr,
      .f5 .table .th {
        border-color:var(--loc-line-soft) !important;
      }
      .f5 .attention>div,
      .f5 .systems>div {
        background:#101511 !important;
      }
      .f5 .systems>div:nth-child(even) {
        background:#141a16 !important;
      }
    `}</style>
  );
}
