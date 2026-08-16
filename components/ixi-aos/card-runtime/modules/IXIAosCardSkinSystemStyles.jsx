export default function IXIAosCardSkinSystemStyles() {
  return (
    <style jsx global>{`
      /* ============================================================
         IXI AOS CARD SKIN SYSTEM
         Presentation only. No geometry, data, runtime or AWS behavior.
         Every listed skin applies to Location 001/002/003 + F2/F3/F4/F5.
         Baseline V12 remains the TRAN$ACT-derived neutral contrast system.
         ============================================================ */

      /* ---------- common skin contract ---------- */
      .ixi-location-overview,
      .ixi-aos-location-f2,
      .f3-financial,
      .f4-obligations,
      .f5 {
        transition: background .16s ease,border-color .16s ease,box-shadow .16s ease;
      }

      /* ============================================================
         V12 — IXI GRAPHITE
         Keep the current TRAN$ACT-derived neutral system authoritative.
         ============================================================ */
      .ixi-location-overview:has(.ixi-aos-card-header-controls.skin-v12),
      .ixi-aos-location-f2:has(.ixi-aos-card-header-controls.skin-v12),
      .f3-financial:has(.ixi-aos-card-header-controls.skin-v12),
      .f4-obligations:has(.ixi-aos-card-header-controls.skin-v12),
      .f5:has(.ixi-aos-card-header-controls.skin-v12) {
        --skin-accent:#ffc400;
        --skin-accent-soft:rgba(255,196,0,.08);
        --skin-canvas:#090b0a;
        --skin-shell:#101310;
        --skin-shell-2:#141815;
        --skin-shell-3:#191e1a;
        --skin-line:#343a35;
        --skin-line-soft:#262c27;
        --skin-text:#f4f5f4;
        --skin-muted:#939a95;
      }

      /* ============================================================
         STEEL — PRECISION / FLEET OFFICE
         Cold neutral gunmetal, bright silver edges, yellow IXI action.
         ============================================================ */
      .ixi-location-overview:has(.ixi-aos-card-header-controls.skin-steel),
      .ixi-aos-location-f2:has(.ixi-aos-card-header-controls.skin-steel),
      .f3-financial:has(.ixi-aos-card-header-controls.skin-steel),
      .f4-obligations:has(.ixi-aos-card-header-controls.skin-steel),
      .f5:has(.ixi-aos-card-header-controls.skin-steel) {
        --skin-accent:#ffd000;
        --skin-accent-soft:rgba(255,208,0,.075);
        --skin-canvas:#080a0b;
        --skin-shell:#111518;
        --skin-shell-2:#171c20;
        --skin-shell-3:#1d2328;
        --skin-line:#3d454b;
        --skin-line-soft:#2b3237;
        --skin-text:#f3f6f7;
        --skin-muted:#9ba5ab;
        background:
          linear-gradient(135deg,rgba(255,255,255,.035),transparent 24%),
          linear-gradient(180deg,#12171a 0%,#0b0e10 48%,#080a0c 100%) !important;
        border-color:#465057 !important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.08),
          inset 0 -1px 0 rgba(0,0,0,.9),
          0 18px 38px rgba(0,0,0,.46) !important;
      }

      .ixi-location-overview:has(.skin-steel) .loc-head,
      .ixi-aos-location-f2:has(.skin-steel) .ops-header,
      .f3-financial:has(.skin-steel) .f3-header,
      .f4-obligations:has(.skin-steel) .f4-header,
      .f5:has(.skin-steel) .f5-head {
        background:linear-gradient(180deg,#171c20,#101417) !important;
        border-bottom-color:#394147 !important;
      }

      .ixi-location-overview:has(.skin-steel) .loc-address-card,
      .ixi-location-overview:has(.skin-steel) .loc-contact-card,
      .ixi-location-overview:has(.skin-steel) .loc-metrics .ixi-aos-inline-metric,
      .ixi-location-overview:has(.skin-steel) .loc-relationships,
      .ixi-aos-location-f2:has(.skin-steel) .gate-code,
      .ixi-aos-location-f2:has(.skin-steel) .ops-section,
      .f3-financial:has(.skin-steel) .ownership,
      .f3-financial:has(.skin-steel) .f3-section,
      .f3-financial:has(.skin-steel) .big-value,
      .f4-obligations:has(.skin-steel) .f4-next,
      .f4-obligations:has(.skin-steel) .f4-metric,
      .f4-obligations:has(.skin-steel) .f4-section,
      .f5:has(.skin-steel) .f5-banner,
      .f5:has(.skin-steel) .f5-sec {
        background:linear-gradient(180deg,#181e22,#111518) !important;
        border-color:#3c454b !important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.045),0 1px 0 rgba(0,0,0,.32) !important;
      }

      .ixi-location-overview:has(.skin-steel) .relationship-row:nth-child(even),
      .ixi-aos-location-f2:has(.skin-steel) .ops-row:nth-child(even),
      .ixi-aos-location-f2:has(.skin-steel) .ops-cell:nth-child(even),
      .f4-obligations:has(.skin-steel) .f4-row:nth-child(even),
      .f5:has(.skin-steel) .systems>div:nth-child(even) {
        background:#1b2125 !important;
      }

      /* ============================================================
         BLUE — TECHNICAL / BLUEPRINT
         Deep navy-black with controlled cyan structure. Yellow remains IXI.
         ============================================================ */
      .ixi-location-overview:has(.ixi-aos-card-header-controls.skin-blueprint),
      .ixi-aos-location-f2:has(.ixi-aos-card-header-controls.skin-blueprint),
      .f3-financial:has(.ixi-aos-card-header-controls.skin-blueprint),
      .f4-obligations:has(.ixi-aos-card-header-controls.skin-blueprint),
      .f5:has(.ixi-aos-card-header-controls.skin-blueprint) {
        --skin-accent:#ffc400;
        --skin-tech:#38bdf8;
        --skin-canvas:#05090d;
        --skin-shell:#0b1319;
        --skin-shell-2:#101b23;
        --skin-shell-3:#15232d;
        --skin-line:#27404e;
        --skin-line-soft:#1b303b;
        --skin-text:#f2f7fa;
        --skin-muted:#88a0ad;
        background:
          linear-gradient(rgba(56,189,248,.018) 1px,transparent 1px),
          linear-gradient(90deg,rgba(56,189,248,.018) 1px,transparent 1px),
          radial-gradient(110% 65% at 50% -8%,rgba(56,189,248,.075),transparent 48%),
          #071016 !important;
        background-size:18px 18px,18px 18px,auto,auto !important;
        border-color:#294653 !important;
        box-shadow:
          inset 0 1px 0 rgba(117,211,255,.08),
          0 18px 38px rgba(0,0,0,.46) !important;
      }

      .ixi-location-overview:has(.skin-blueprint) .loc-head,
      .ixi-aos-location-f2:has(.skin-blueprint) .ops-header,
      .f3-financial:has(.skin-blueprint) .f3-header,
      .f4-obligations:has(.skin-blueprint) .f4-header,
      .f5:has(.skin-blueprint) .f5-head {
        background:rgba(6,13,18,.94) !important;
        border-bottom-color:#24404e !important;
      }

      .ixi-location-overview:has(.skin-blueprint) .loc-address-card,
      .ixi-location-overview:has(.skin-blueprint) .loc-contact-card,
      .ixi-location-overview:has(.skin-blueprint) .loc-metrics .ixi-aos-inline-metric,
      .ixi-location-overview:has(.skin-blueprint) .loc-relationships,
      .ixi-aos-location-f2:has(.skin-blueprint) .gate-code,
      .ixi-aos-location-f2:has(.skin-blueprint) .ops-section,
      .f3-financial:has(.skin-blueprint) .ownership,
      .f3-financial:has(.skin-blueprint) .f3-section,
      .f3-financial:has(.skin-blueprint) .big-value,
      .f4-obligations:has(.skin-blueprint) .f4-next,
      .f4-obligations:has(.skin-blueprint) .f4-metric,
      .f4-obligations:has(.skin-blueprint) .f4-section,
      .f5:has(.skin-blueprint) .f5-banner,
      .f5:has(.skin-blueprint) .f5-sec {
        background:linear-gradient(180deg,rgba(16,29,38,.96),rgba(8,17,23,.97)) !important;
        border-color:#284554 !important;
        box-shadow:inset 0 1px 0 rgba(85,199,255,.05) !important;
      }

      .ixi-location-overview:has(.skin-blueprint) .loc-relationships .ixi-face-section-title,
      .ixi-aos-location-f2:has(.skin-blueprint) .ops-section-title,
      .f3-financial:has(.skin-blueprint) .f3-section>h3,
      .f4-obligations:has(.skin-blueprint) .f4-section>h3,
      .f5:has(.skin-blueprint) .f5-sec>h3 {
        background:#0b171f !important;
        border-bottom-color:#284554 !important;
      }

      .ixi-location-overview:has(.skin-blueprint) .relationship-row b,
      .ixi-aos-location-f2:has(.skin-blueprint) .ops-icon {
        color:#63cbf7 !important;
      }

      /* ============================================================
         INDUSTRIAL — SERVICE / SHOP FLOOR OFFICE
         Warm carbon, bronze hardware, yellow action. Rugged without V13 bubbles.
         ============================================================ */
      .ixi-location-overview:has(.ixi-aos-card-header-controls.skin-industrial),
      .ixi-aos-location-f2:has(.ixi-aos-card-header-controls.skin-industrial),
      .f3-financial:has(.ixi-aos-card-header-controls.skin-industrial),
      .f4-obligations:has(.ixi-aos-card-header-controls.skin-industrial),
      .f5:has(.ixi-aos-card-header-controls.skin-industrial) {
        --skin-accent:#ffc400;
        --skin-canvas:#0b0906;
        --skin-shell:#17130d;
        --skin-shell-2:#1d1810;
        --skin-shell-3:#251e13;
        --skin-line:#493d29;
        --skin-line-soft:#342c20;
        --skin-text:#f7f3e9;
        --skin-muted:#a49b88;
        background:
          linear-gradient(115deg,rgba(255,196,0,.025),transparent 28%),
          radial-gradient(100% 60% at 50% -8%,rgba(255,186,66,.055),transparent 48%),
          #0d0b08 !important;
        border-color:#4c402b !important;
        box-shadow:
          inset 0 1px 0 rgba(255,219,145,.055),
          0 18px 38px rgba(0,0,0,.48) !important;
      }

      .ixi-location-overview:has(.skin-industrial) .loc-head,
      .ixi-aos-location-f2:has(.skin-industrial) .ops-header,
      .f3-financial:has(.skin-industrial) .f3-header,
      .f4-obligations:has(.skin-industrial) .f4-header,
      .f5:has(.skin-industrial) .f5-head {
        background:linear-gradient(180deg,#18140e,#100d09) !important;
        border-bottom-color:#3e3425 !important;
      }

      .ixi-location-overview:has(.skin-industrial) .loc-address-card,
      .ixi-location-overview:has(.skin-industrial) .loc-contact-card,
      .ixi-location-overview:has(.skin-industrial) .loc-metrics .ixi-aos-inline-metric,
      .ixi-location-overview:has(.skin-industrial) .loc-relationships,
      .ixi-aos-location-f2:has(.skin-industrial) .gate-code,
      .ixi-aos-location-f2:has(.skin-industrial) .ops-section,
      .f3-financial:has(.skin-industrial) .ownership,
      .f3-financial:has(.skin-industrial) .f3-section,
      .f3-financial:has(.skin-industrial) .big-value,
      .f4-obligations:has(.skin-industrial) .f4-next,
      .f4-obligations:has(.skin-industrial) .f4-metric,
      .f4-obligations:has(.skin-industrial) .f4-section,
      .f5:has(.skin-industrial) .f5-banner,
      .f5:has(.skin-industrial) .f5-sec {
        background:linear-gradient(180deg,#1b1710,#12100b) !important;
        border-color:#493d29 !important;
        box-shadow:inset 0 1px 0 rgba(255,220,150,.035) !important;
      }

      .ixi-location-overview:has(.skin-industrial) .loc-relationships .ixi-face-section-title,
      .ixi-aos-location-f2:has(.skin-industrial) .ops-section-title,
      .f3-financial:has(.skin-industrial) .f3-section>h3,
      .f4-obligations:has(.skin-industrial) .f4-section>h3,
      .f5:has(.skin-industrial) .f5-sec>h3 {
        background:#17130d !important;
        border-bottom-color:#493d29 !important;
      }

      .ixi-location-overview:has(.skin-industrial) .relationship-row:nth-child(even),
      .ixi-aos-location-f2:has(.skin-industrial) .ops-row:nth-child(even),
      .f4-obligations:has(.skin-industrial) .f4-row:nth-child(even),
      .f5:has(.skin-industrial) .systems>div:nth-child(even) {
        background:#201a11 !important;
      }

      /* ---------- header control treatment follows selected skin ---------- */
      .ixi-aos-card-header-controls.skin-v12,
      .ixi-aos-card-header-controls.skin-steel,
      .ixi-aos-card-header-controls.skin-blueprint,
      .ixi-aos-card-header-controls.skin-industrial {
        border:1px solid rgba(255,255,255,.09) !important;
        border-radius:8px !important;
        overflow:visible !important;
      }
      .ixi-aos-card-header-controls.skin-v12 { background:#0c0f0d !important; }
      .ixi-aos-card-header-controls.skin-steel { background:#14191d !important;border-color:#384148 !important; }
      .ixi-aos-card-header-controls.skin-blueprint { background:#09141b !important;border-color:#274554 !important; }
      .ixi-aos-card-header-controls.skin-industrial { background:#17130d !important;border-color:#463a28 !important; }

      .ixi-aos-card-header-controls.skin-steel .header-menu { background:#0c1012 !important;border-color:#3a4349 !important; }
      .ixi-aos-card-header-controls.skin-blueprint .header-menu { background:#071118 !important;border-color:#284554 !important; }
      .ixi-aos-card-header-controls.skin-industrial .header-menu { background:#100d09 !important;border-color:#493d29 !important; }
    `}</style>
  );
}
