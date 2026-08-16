export default function IXIAosTransactContrastPass() {
  return (
    <style jsx global>{`
      /* Final neutral contrast layer. TRAN$ACT is the visual reference:
         black chassis, charcoal shells, gray borders, white type, yellow accent. */
      .ixi-location-overview {
        --bg:#090b0a !important;
        --s1:#101312 !important;
        --s2:#141716 !important;
        --s3:#181b1a !important;
        --line:rgba(190,198,194,.22) !important;
        --line2:rgba(190,198,194,.11) !important;
        background:#090b0a !important;
        border-color:rgba(190,198,194,.22) !important;
      }
      .ixi-location-overview .loc-head { background:#0b0d0c !important; border-bottom-color:rgba(190,198,194,.18) !important; }
      .ixi-location-overview .loc-preview { background:#0b0d0c !important; border-color:rgba(190,198,194,.13) !important; }
      .ixi-location-overview .loc-address-card,
      .ixi-location-overview .loc-contact-card {
        background:#111412 !important;
        border-color:rgba(190,198,194,.23) !important;
      }
      .ixi-location-overview .loc-metrics .ixi-aos-inline-metric {
        background:#111412 !important;
        border-color:rgba(190,198,194,.23) !important;
      }
      .ixi-location-overview .loc-relationships {
        background:#0d100f !important;
        border-color:rgba(190,198,194,.23) !important;
      }
      .ixi-location-overview .loc-relationships .ixi-face-section-title {
        background:#121513 !important;
        border-bottom-color:rgba(190,198,194,.15) !important;
      }
      .ixi-location-overview .loc-relationships .relationship-row { background:#101311 !important; border-bottom-color:rgba(190,198,194,.10) !important; }
      .ixi-location-overview .loc-relationships .relationship-row:nth-child(even) { background:#141715 !important; }
      .ixi-location-overview .loc-relationships .relationship-row:hover { background:#191c1a !important; }
      .ixi-location-overview .loc-relationships .relationship-row b { color:#ffc400 !important; }
      .ixi-location-overview .loc-commands { background:#090b0a !important; border-color:rgba(190,198,194,.11) !important; }
      .ixi-location-overview .loc-thumbs { background:#070908 !important; border-top-color:rgba(190,198,194,.11) !important; }

      /* Neutralize the green cast on the other Location faces too. */
      .ixi-aos-location-f2,
      .f3-financial,
      .f4-obligations,
      .f5 {
        --loc-chassis:#0b0d0c !important;
        --loc-shell:#111412 !important;
        --loc-shell-2:#151816 !important;
        --loc-shell-3:#191c1a !important;
        --loc-line:rgba(190,198,194,.22) !important;
        --loc-line-soft:rgba(190,198,194,.11) !important;
        background:#0b0d0c !important;
      }
      .ixi-aos-location-f2 .ops-section,
      .f3-financial .ownership,
      .f3-financial .f3-section,
      .f4-obligations .f4-next,
      .f4-obligations .f4-metric,
      .f4-obligations .f4-section,
      .f5 .f5-sec { background:#111412 !important; border-color:rgba(190,198,194,.22) !important; }
      .ixi-aos-location-f2 .ops-section-title,
      .f3-financial .f3-section>h3,
      .f4-obligations .f4-section>h3,
      .f5 .f5-sec>h3 { background:#151816 !important; border-bottom-color:rgba(190,198,194,.13) !important; }
    `}</style>
  );
}
