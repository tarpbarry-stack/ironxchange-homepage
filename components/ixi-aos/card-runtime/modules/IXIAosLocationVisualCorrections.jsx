export default function IXIAosLocationVisualCorrections() {
  return (
    <style jsx global>{`
      /* LOCATION FAMILY — surgical correction pass.
         Preserve 298x471, behavior, command rail and child photo rail. */

      /* ---------- F1 001 / 002 / 003 ---------- */
      .card001 .address {
        border-color: rgba(255,255,255,.085) !important;
        background: linear-gradient(180deg,#151a1f,#101419) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.025) !important;
      }
      .card001 .metrics .ixi-aos-inline-metrics {
        grid-template-columns: 1fr 1.25fr 1fr !important;
        gap: 4px !important;
      }
      .card001 .metrics .ixi-aos-inline-metric {
        border-color: rgba(255,255,255,.085) !important;
        background: linear-gradient(180deg,#151a1f,#101419) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.025) !important;
      }
      .card001 .metrics .ixi-aos-inline-metric span { color:#d3a900 !important; }

      .card001 .relationships {
        border-color: rgba(255,255,255,.075) !important;
        background: #0d1114 !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.018) !important;
      }
      .card001 .relationships .ixi-face-section-title {
        height: 25px !important;
        min-height: 25px !important;
        padding: 0 9px 0 12px !important;
        background: linear-gradient(180deg,#151a1f,#111519) !important;
        border-bottom-color: rgba(255,255,255,.08) !important;
      }
      .card001 .relationships .ixi-face-section-title::before {
        width: 3px !important;
        box-shadow: 0 0 8px rgba(255,196,0,.14) !important;
      }
      .card001 .relationships .panel-scroll {
        height: calc(100% - 25px) !important;
        padding: 0 !important;
      }
      .card001 .relationships .relationship-row {
        height: 24px !important;
        min-height: 24px !important;
        padding: 0 8px !important;
        background: #0f1316 !important;
      }
      .card001 .relationships .relationship-row:nth-child(even) { background:#12171b !important; }
      .card001 .relationships .relationship-row strong { font-size:7.5px !important; }
      .card001 .relationships .relationship-row span { font-size:6.7px !important; }
      .card001 .relationships .relationship-row b { color:#c8ced3 !important; }
      .card001 .relationships .relationship-row:hover b { color:#ffc400 !important; }

      /* 001: compact information shelf, large relationship capacity. */
      .card001:not(.card002-variant *) .address { margin-top:4px !important; }
      .card001:not(.card002-variant *) .metrics { margin-top:4px !important; }
      .card001:not(.card002-variant *) .relationships { margin-top:5px !important; }

      /* 002: executive / relationship-first. Keep the body spacious, but stop
         making the modules look like giant dashboard blocks. */
      .card002-variant .card001 .body { padding: 7px 11px 0 !important; }
      .card002-variant .card001 .address {
        min-height: 44px !important;
        height: 44px !important;
        margin: 0 !important;
        border-radius: 6px !important;
      }
      .card002-variant .card001 .address .ixi-aos-inline-address {
        height:42px !important;
        min-height:42px !important;
      }
      .card002-variant .card001 .metrics { margin:5px 0 0 !important; }
      .card002-variant .card001 .metrics .ixi-aos-inline-metrics { height:40px !important; min-height:40px !important; }
      .card002-variant .card001 .metrics .ixi-aos-inline-metric { height:40px !important; }
      .card002-variant .card001 .relationships {
        margin:6px 0 0 !important;
        border-radius:7px !important;
      }

      /* 003: preserve the good split identity. Metrics and relationships must
         begin below the split, never visually collide with it. */
      .card003-variant .card001 .address {
        background: linear-gradient(180deg,#14191e,#0e1215) !important;
      }
      .card003-variant .card001 .metrics { margin-top:4px !important; }
      .card003-variant .card001 .relationships { margin-top:5px !important; }

      /* ---------- F2: restore the cleaner pre-V3 treatment ---------- */
      .ixi-aos-location-f2 .gate-code {
        min-height:34px !important;
        margin:7px 7px 6px !important;
        padding:0 11px !important;
        border:1px solid rgba(255,196,0,.28) !important;
        border-radius:7px !important;
        background:linear-gradient(180deg,rgba(255,196,0,.07),rgba(255,196,0,.025)) !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.025) !important;
      }
      .ixi-aos-location-f2 .ops-section {
        margin:0 7px 6px !important;
        border:1px solid rgba(255,255,255,.075) !important;
        border-radius:7px !important;
        background:linear-gradient(180deg,#0f1215,rgba(15,18,21,.72)) !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.018) !important;
      }
      .ixi-aos-location-f2 .ops-section-title {
        height:22px !important;
        min-height:22px !important;
        padding:0 9px !important;
        background:rgba(255,255,255,.012) !important;
      }
      .ixi-aos-location-f2 .ops-grid.two { gap:4px !important; padding:5px !important; }
      .ixi-aos-location-f2 .ops-cell {
        min-height:37px !important;
        border:1px solid rgba(255,255,255,.075) !important;
        border-radius:6px !important;
        background:linear-gradient(180deg,rgba(255,255,255,.025),rgba(255,255,255,.008)) !important;
      }

      /* ---------- F3: return to the strong pre-rewrite financial face ---------- */
      .f3-financial .f3-header {
        background:linear-gradient(180deg,rgba(255,255,255,.02),transparent) !important;
        border-bottom:1px solid rgba(255,255,255,.075) !important;
      }
      .f3-financial .face-banner {
        height:20px !important;
        margin-bottom:6px !important;
        border:1px solid rgba(255,196,0,.24) !important;
        border-radius:6px !important;
        background:linear-gradient(180deg,rgba(255,196,0,.075),rgba(255,196,0,.025)) !important;
        clip-path:none !important;
      }
      .f3-financial .ownership,
      .f3-financial .f3-section {
        border:1px solid rgba(255,255,255,.075) !important;
        border-radius:7px !important;
        background:linear-gradient(180deg,#0f1215,rgba(15,18,21,.72)) !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.018) !important;
      }
      .f3-financial .f3-section>h3 {
        height:20px !important;
        padding:6px 7px !important;
        background:rgba(255,255,255,.012) !important;
      }
      .f3-financial .big-value {
        min-width:0 !important;
        overflow:hidden !important;
        border:1px solid rgba(255,255,255,.09) !important;
        border-radius:5px !important;
        background:linear-gradient(180deg,rgba(255,255,255,.025),rgba(255,255,255,.006)) !important;
        padding:7px 5px !important;
      }
      .f3-financial .big-value::before { display:none !important; }
      .f3-financial .big-value b {
        max-width:100% !important;
        color:#f7f8f8 !important;
        font-size:15px !important;
        line-height:1 !important;
        white-space:nowrap !important;
        letter-spacing:-.035em !important;
      }
      .f3-financial .big-value span { color:rgba(210,218,224,.55) !important; }

      /* ---------- F4: hard geometry fix for top totals ---------- */
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
      .f4-obligations .f4-metric {
        padding-left:3px !important;
        padding-right:3px !important;
      }
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
      .f4-obligations .f4-metric span {
        display:block !important;
        max-width:100% !important;
        font-size:5px !important;
        line-height:1.05 !important;
        text-align:center !important;
      }
      .f4-obligations .f4-next { padding-right:5px !important; }

      /* F5 intentionally untouched. */
    `}</style>
  );
}
