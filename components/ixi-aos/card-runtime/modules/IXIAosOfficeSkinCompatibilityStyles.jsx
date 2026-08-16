export default function IXIAosOfficeSkinCompatibilityStyles() {
  return (
    <style jsx global>{`
      /* ============================================================
         IXI AOS LOCATION — DARK OFFICE SYSTEM V3
         298 x 471 stays authoritative. This file only changes presentation.
         Design doctrine: layered graphite shells, hard spatial boundaries,
         strong readable type, restrained amber, no overlap tricks.
         ============================================================ */

      .card001,
      .ixi-aos-location-f2,
      .f3-financial,
      .f4-obligations,
      .f5 {
        --loc-bg-0:#07090b;
        --loc-bg-1:#0b0e11;
        --loc-bg-2:#101419;
        --loc-bg-3:#151a20;
        --loc-bg-4:#1a2027;
        --loc-line:rgba(255,255,255,.10);
        --loc-line-soft:rgba(255,255,255,.055);
        --loc-line-strong:rgba(255,255,255,.15);
        --loc-text:#f5f7f8;
        --loc-text-2:#c7cdd2;
        --loc-text-3:#858d95;
        --loc-yellow:#ffc400;
        --loc-yellow-dim:#b99400;
        --loc-green:#89d92f;
        --loc-red:#ff4e43;
        --loc-radius:8px;
        --loc-font:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;
      }

      .card001,
      .ixi-aos-location-f2,
      .f3-financial,
      .f4-obligations,
      .f5 {
        border:1px solid rgba(255,255,255,.11)!important;
        border-radius:15px!important;
        background:
          radial-gradient(120% 72% at 50% -12%,rgba(255,255,255,.055),transparent 42%),
          linear-gradient(180deg,#111419 0%,#0b0e11 50%,#080a0c 100%)!important;
        color:var(--loc-text)!important;
        font-family:var(--loc-font)!important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.055),
          inset 0 -1px 0 rgba(0,0,0,.85),
          0 16px 36px rgba(0,0,0,.48),
          0 3px 10px rgba(0,0,0,.38)!important;
      }

      .card001 .identity strong,
      .f3-financial .f3-ident b,
      .f4-obligations .f4-ident b,
      .f5 .f5-head>div>b,
      .ixi-aos-location-f2 .ops-identity strong {
        font-family:Georgia,"Times New Roman",serif!important;
        color:#f7f7f4!important;
        font-weight:800!important;
        letter-spacing:-.02em!important;
      }

      .card001 .identity span,
      .ixi-aos-location-f2 .ops-identity span,
      .f3-financial .f3-ident span,
      .f4-obligations .f4-ident span,
      .f5 .f5-head>div>span {
        color:var(--loc-yellow)!important;
        font-family:var(--loc-font)!important;
        font-weight:800!important;
        letter-spacing:.10em!important;
      }

      /* HEADER CONTROLS */
      .card001 .ixi-aos-card-header-controls,
      .ixi-aos-location-f2 .ixi-aos-card-header-controls,
      .f3-financial .ixi-aos-card-header-controls,
      .f4-obligations .ixi-aos-card-header-controls,
      .f5 .ixi-aos-card-header-controls {
        border:1px solid rgba(255,255,255,.09)!important;
        border-radius:8px!important;
        background:linear-gradient(180deg,rgba(255,255,255,.026),rgba(255,255,255,.008))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.025),0 3px 8px rgba(0,0,0,.18)!important;
      }
      .card001 .ixi-aos-card-header-controls .header-action,
      .ixi-aos-location-f2 .ixi-aos-card-header-controls .header-action,
      .f3-financial .ixi-aos-card-header-controls .header-action,
      .f4-obligations .ixi-aos-card-header-controls .header-action,
      .f5 .ixi-aos-card-header-controls .header-action {
        background:transparent!important;
        border-left-color:rgba(255,255,255,.065)!important;
      }

      /* ============================================================
         F1 CONTAINERS — HARD BOUNDARIES, NO OVERLAPS
         ============================================================ */
      .card001 .body { overflow:hidden!important; }
      .card001 .address,
      .card001 .metrics,
      .card001 .relationships { position:relative!important; z-index:2!important; }

      .card001 .address {
        width:276px!important;
        margin:5px auto 0!important;
        min-height:31px!important;
        border:1px solid var(--loc-line)!important;
        border-radius:7px!important;
        background:linear-gradient(180deg,var(--loc-bg-3),var(--loc-bg-2))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.03),0 3px 8px rgba(0,0,0,.16)!important;
        overflow:hidden!important;
      }
      .card001 .address .ixi-aos-inline-address {
        width:100%!important;
        min-height:29px!important;
        height:29px!important;
        padding:0 10px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        background:transparent!important;
        border:0!important;
      }
      .card001 .address .ixi-aos-inline-address strong {
        width:100%!important;
        color:#eef1f3!important;
        font-family:var(--loc-font)!important;
        font-size:9.2px!important;
        line-height:1.12!important;
        font-weight:760!important;
        text-align:center!important;
      }

      .card001 .metrics {
        width:276px!important;
        margin:6px auto 0!important;
      }
      .card001 .metrics .ixi-aos-inline-metrics {
        width:276px!important;
        min-height:42px!important;
        height:42px!important;
        display:grid!important;
        grid-template-columns:repeat(3,1fr)!important;
        gap:4px!important;
        padding:0!important;
        background:transparent!important;
        border:0!important;
      }
      .card001 .metrics .ixi-aos-inline-metric {
        min-width:0!important;
        height:42px!important;
        display:flex!important;
        flex-direction:column!important;
        justify-content:center!important;
        align-items:center!important;
        gap:4px!important;
        border:1px solid var(--loc-line)!important;
        border-radius:7px!important;
        background:linear-gradient(180deg,var(--loc-bg-3),var(--loc-bg-2))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.025)!important;
      }
      .card001 .metrics .ixi-aos-inline-metric span {
        color:var(--loc-yellow-dim)!important;
        font-size:6.6px!important;
        font-weight:850!important;
        letter-spacing:.11em!important;
      }
      .card001 .metrics .ixi-aos-inline-metric strong {
        color:#fff!important;
        font-size:12.6px!important;
        line-height:1!important;
        font-weight:800!important;
        letter-spacing:-.018em!important;
      }

      .card001 .relationships {
        margin:7px 10px 0!important;
        min-height:0!important;
        border:1px solid var(--loc-line)!important;
        border-radius:8px!important;
        background:linear-gradient(180deg,rgba(21,26,32,.96),rgba(10,13,16,.98))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.03),0 4px 12px rgba(0,0,0,.18)!important;
        overflow:hidden!important;
      }
      .card001 .relationships .ixi-aos-relationship-panel,
      .card001 .relationships .ixi-face-section {
        width:100%!important;
        height:100%!important;
        min-height:0!important;
        border:0!important;
        border-radius:0!important;
        background:transparent!important;
        box-shadow:none!important;
        overflow:hidden!important;
      }
      .card001 .relationships .ixi-face-section-title {
        position:relative!important;
        height:29px!important;
        min-height:29px!important;
        display:flex!important;
        align-items:center!important;
        padding:0 10px 0 14px!important;
        margin:0!important;
        border-bottom:1px solid var(--loc-line)!important;
        background:linear-gradient(180deg,rgba(255,255,255,.028),rgba(255,255,255,.010))!important;
        color:var(--loc-yellow)!important;
        font-family:var(--loc-font)!important;
        font-size:7px!important;
        font-weight:850!important;
        letter-spacing:.09em!important;
        white-space:nowrap!important;
      }
      .card001 .relationships .ixi-face-section-title::before {
        content:""!important;
        position:absolute!important;
        left:0!important;
        top:0!important;
        bottom:0!important;
        width:3px!important;
        background:var(--loc-yellow)!important;
        box-shadow:0 0 10px rgba(255,196,0,.22)!important;
      }
      .card001 .relationships .panel-scroll {
        height:calc(100% - 29px)!important;
        min-height:0!important;
        padding:3px 5px 6px!important;
        overflow-y:auto!important;
        overflow-x:hidden!important;
      }
      .card001 .relationships .relationship-row {
        height:25px!important;
        min-height:25px!important;
        padding:0 7px!important;
        border:0!important;
        border-bottom:1px solid rgba(255,255,255,.05)!important;
        border-radius:0!important;
        background:rgba(255,255,255,.010)!important;
        box-shadow:none!important;
      }
      .card001 .relationships .relationship-row:nth-child(even) {
        background:rgba(255,255,255,.025)!important;
      }
      .card001 .relationships .relationship-row:hover {
        background:linear-gradient(90deg,rgba(255,196,0,.045),rgba(255,255,255,.022))!important;
      }
      .card001 .relationships .relationship-row strong {
        color:#f1f3f4!important;
        font-family:var(--loc-font)!important;
        font-size:7.6px!important;
        font-weight:780!important;
        letter-spacing:.018em!important;
      }
      .card001 .relationships .relationship-row span {
        color:#8f979e!important;
        font-family:var(--loc-font)!important;
        font-size:6.8px!important;
        font-weight:720!important;
      }
      .card001 .relationships .relationship-row b {
        color:rgba(255,196,0,.78)!important;
        font-size:10px!important;
        font-weight:600!important;
      }

      /* Do not alter the good command rail or photo strip */
      .card001 .actions,
      .card001 .photo-rail { z-index:10!important; }

      /* 002: information-first, no photo rail */
      .card002-variant .card001 .body {
        padding:0 10px!important;
      }
      .card002-variant .card001 .photo,
      .card002-variant .card001 .preview-info-strip { display:none!important; }
      .card002-variant .card001 .address {
        width:100%!important;
        margin:8px 0 0!important;
        min-height:48px!important;
      }
      .card002-variant .card001 .address .ixi-aos-inline-address {
        height:46px!important;
        min-height:46px!important;
        padding:0 13px!important;
        justify-content:flex-start!important;
      }
      .card002-variant .card001 .address .ixi-aos-inline-address strong {
        font-size:8.7px!important;
        text-align:left!important;
      }
      .card002-variant .card001 .metrics {
        width:100%!important;
        margin:7px 0 0!important;
      }
      .card002-variant .card001 .metrics .ixi-aos-inline-metrics { width:100%!important; }
      .card002-variant .card001 .relationships {
        margin:8px 0 0!important;
        flex:1!important;
      }
      .card002-variant .card001 .actions { left:12px!important; right:12px!important; }

      /* 003: split media/info stays, but each half becomes a shell */
      .card003-variant .card001 .photo {
        border-right:1px solid var(--loc-line)!important;
        border-bottom:1px solid var(--loc-line)!important;
        background:#07090b!important;
      }
      .card003-variant .card001 .address {
        margin:0!important;
        width:149px!important;
        height:79px!important;
        min-height:79px!important;
        border:0!important;
        border-bottom:1px solid var(--loc-line)!important;
        border-radius:0!important;
        background:linear-gradient(180deg,var(--loc-bg-3),var(--loc-bg-2))!important;
        box-shadow:none!important;
      }
      .card003-variant .card001 .address .ixi-aos-inline-address {
        height:auto!important;
        min-height:0!important;
        padding:7px 9px 28px!important;
      }
      .card003-variant .card001 .address .ixi-aos-inline-address strong {
        font-size:7.7px!important;
        line-height:1.22!important;
      }
      .card003-variant .card003-contact-overlay {
        border-top:1px solid rgba(255,255,255,.09)!important;
      }
      .card003-variant .card003-contact-overlay strong { color:#f0f2f3!important; font-size:7.5px!important; }
      .card003-variant .card003-contact-overlay span { color:#889198!important; font-size:6.4px!important; }
      .card003-variant .card001 .metrics { margin-top:5px!important; }
      .card003-variant .card001 .relationships { margin-top:6px!important; }

      /* ============================================================
         F2 OPERATIONS — SHELLS OVER FLOATING TEXT
         ============================================================ */
      .ixi-aos-location-f2 {
        --ops-bg:var(--loc-bg-0)!important;
        --ops-panel:var(--loc-bg-2)!important;
        --ops-line:var(--loc-line)!important;
        --ops-muted:var(--loc-text-3)!important;
        --ops-text:var(--loc-text)!important;
        --ops-accent:var(--loc-yellow)!important;
      }
      .ixi-aos-location-f2 .ops-header {
        border-bottom:1px solid var(--loc-line)!important;
        background:linear-gradient(180deg,rgba(255,255,255,.025),transparent)!important;
      }
      .ixi-aos-location-f2 .gate-code,
      .ixi-aos-location-f2 .ops-section {
        border:1px solid var(--loc-line)!important;
        border-radius:8px!important;
        background:linear-gradient(180deg,var(--loc-bg-3),var(--loc-bg-2))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.025),0 4px 10px rgba(0,0,0,.16)!important;
      }
      .ixi-aos-location-f2 .gate-code { margin:7px!important; }
      .ixi-aos-location-f2 .ops-section { margin:0 7px 7px!important; overflow:hidden!important; }
      .ixi-aos-location-f2 .ops-section-title {
        min-height:22px!important;
        padding:0 9px!important;
        border-bottom:1px solid var(--loc-line)!important;
        background:rgba(255,255,255,.018)!important;
        color:var(--loc-yellow)!important;
        font-size:7px!important;
        font-weight:850!important;
      }
      .ixi-aos-location-f2 .ops-row,
      .ixi-aos-location-f2 .ops-cell,
      .ixi-aos-location-f2 .ops-wide {
        background:rgba(255,255,255,.008)!important;
        border-color:var(--loc-line-soft)!important;
      }
      .ixi-aos-location-f2 .ops-row:nth-child(even),
      .ixi-aos-location-f2 .ops-cell:nth-child(even) { background:rgba(255,255,255,.02)!important; }
      .ixi-aos-location-f2 .ops-label,
      .ixi-aos-location-f2 .ops-cell-label { color:#a6adb3!important; font-size:6.5px!important; font-weight:760!important; }
      .ixi-aos-location-f2 .ops-row strong,
      .ixi-aos-location-f2 .ops-cell strong { color:#f5f6f7!important; font-size:7.2px!important; font-weight:780!important; }

      /* ============================================================
         F3/F4/F5 — SAME DARK MATERIAL SYSTEM
         ============================================================ */
      .f3-financial:has(.ixi-aos-card-header-controls.skin-v12),
      .f3-financial:has(.ixi-aos-card-header-controls.skin-steel),
      .f3-financial:has(.ixi-aos-card-header-controls.skin-blueprint),
      .f3-financial:has(.ixi-aos-card-header-controls.skin-industrial) {
        --paper:var(--loc-bg-0)!important;
        --paper2:var(--loc-bg-1)!important;
        --ink:var(--loc-text)!important;
        --ink-soft:var(--loc-text-3)!important;
        --accent:var(--loc-yellow)!important;
        --line:var(--loc-line)!important;
        --line-soft:var(--loc-line-soft)!important;
        --panel:var(--loc-bg-2)!important;
        --money:var(--loc-green)!important;
        --negative:var(--loc-red)!important;
        font-family:var(--loc-font)!important;
        background:linear-gradient(180deg,#101419,#090b0d)!important;
      }
      .f3-financial:has(.ixi-aos-card-header-controls.skin-v12)::before,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-v12)::after,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-steel)::before,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-steel)::after,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-blueprint)::before,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-blueprint)::after,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-industrial)::before,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-industrial)::after { display:none!important; }
      .f3-financial:has(.ixi-aos-card-header-controls.skin-v12) .currency-ornament,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-steel) .currency-ornament,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-blueprint) .currency-ornament,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-industrial) .currency-ornament { display:none!important; }
      .f3-financial .ownership,
      .f3-financial .f3-section,
      .f4-obligations .f4-section,
      .f5 .f5-sec {
        border:1px solid var(--loc-line)!important;
        border-radius:8px!important;
        background:linear-gradient(180deg,var(--loc-bg-3),var(--loc-bg-2))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.025),0 4px 10px rgba(0,0,0,.14)!important;
        overflow:hidden!important;
      }
      .f3-financial .f3-section>h3,
      .f4-obligations .f4-section>h3,
      .f5 .f5-sec>h3 {
        border-bottom:1px solid var(--loc-line)!important;
        background:rgba(255,255,255,.018)!important;
        color:var(--loc-yellow)!important;
        font-family:var(--loc-font)!important;
        font-weight:850!important;
        letter-spacing:.06em!important;
      }
      .f3-financial .f3-row,
      .f4-obligations .f4-row,
      .f5 .tr,
      .f5 .systems>div {
        border-bottom-color:var(--loc-line-soft)!important;
      }
      .f3-financial .f3-row:nth-child(even),
      .f4-obligations .f4-row:nth-child(even),
      .f5 .systems>div:nth-child(even) { background:rgba(255,255,255,.016)!important; }
      .f3-financial .face-banner,
      .f4-obligations .f4-banner,
      .f5 .f5-banner {
        border:1px solid rgba(255,196,0,.22)!important;
        border-radius:7px!important;
        background:linear-gradient(180deg,rgba(255,196,0,.07),rgba(255,196,0,.025))!important;
        color:var(--loc-yellow)!important;
        clip-path:none!important;
      }

      /* F4 top metrics */
      .f4-obligations .f4-control { gap:5px!important; }
      .f4-obligations .f4-next,
      .f4-obligations .f4-metric {
        border:1px solid var(--loc-line)!important;
        border-radius:8px!important;
        background:linear-gradient(180deg,var(--loc-bg-3),var(--loc-bg-2))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.025)!important;
      }

      /* F5 keeps status colors but lives on same graphite shells */
      .f5 { --accent:var(--loc-yellow)!important; --panel:var(--loc-bg-2)!important; --line:var(--loc-line)!important; --text:var(--loc-text)!important; --muted:var(--loc-text-3)!important; }
      .f5 .f5-sec h3,
      .f5 .f5-banner { color:var(--loc-yellow)!important; }

      /* SCROLLBARS — compact and contained */
      .card001 .relationships .panel-scroll,
      .ixi-aos-location-f2 .ops-scroll,
      .f3-financial .f3-scroll,
      .f4-obligations .f4-scroll,
      .f5 .f5-scroll {
        scrollbar-width:thin!important;
        scrollbar-color:rgba(255,255,255,.24) transparent!important;
      }
      .card001 .relationships .panel-scroll::-webkit-scrollbar,
      .ixi-aos-location-f2 .ops-scroll::-webkit-scrollbar,
      .f3-financial .f3-scroll::-webkit-scrollbar,
      .f4-obligations .f4-scroll::-webkit-scrollbar,
      .f5 .f5-scroll::-webkit-scrollbar { width:4px!important; }
      .card001 .relationships .panel-scroll::-webkit-scrollbar-thumb,
      .ixi-aos-location-f2 .ops-scroll::-webkit-scrollbar-thumb,
      .f3-financial .f3-scroll::-webkit-scrollbar-thumb,
      .f4-obligations .f4-scroll::-webkit-scrollbar-thumb,
      .f5 .f5-scroll::-webkit-scrollbar-thumb {
        background:rgba(255,255,255,.23)!important;
        border-radius:999px!important;
      }
    `}</style>
  );
}
