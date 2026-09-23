export default function IXIAosTransactContrastPass() {
  return (
    <style jsx global>{`
      /* Final neutral contrast layer. TRAN$ACT is the visual reference:
         black chassis, charcoal shells, gray borders, white type, yellow accent. */
      .ixi-location-overview {
        --bg:#0b0b0b !important;
        --s1:#121212 !important;
        --s2:#161616 !important;
        --s3:#1a1a1a !important;
        --line:rgba(196,196,196,.22) !important;
        --line2:rgba(196,196,196,.11) !important;
        background:#0b0b0b !important;
        border-color:rgba(196,196,196,.22) !important;
      }
      .ixi-location-overview .loc-head { background:#0d0d0d !important; border-bottom-color:rgba(196,196,196,.18) !important; }
      .ixi-location-overview .loc-preview { background:#0d0d0d !important; border-color:rgba(196,196,196,.13) !important; }
      .ixi-location-overview .loc-address-card,
      .ixi-location-overview .loc-contact-card {
        background:#131313 !important;
        border-color:rgba(196,196,196,.23) !important;
      }
      .ixi-location-overview .loc-metrics .ixi-aos-inline-metric {
        background:#131313 !important;
        border-color:rgba(196,196,196,.23) !important;
      }
      .ixi-location-overview .loc-relationships {
        background:#0f0f0f !important;
        border-color:rgba(196,196,196,.23) !important;
      }
      .ixi-location-overview .loc-relationships .ixi-face-section-title {
        background:#141414 !important;
        border-bottom-color:rgba(196,196,196,.15) !important;
      }
      .ixi-location-overview .loc-relationships .relationship-row { background:#121212 !important; border-bottom-color:rgba(196,196,196,.10) !important; }
      .ixi-location-overview .loc-relationships .relationship-row:nth-child(even) { background:#161616 !important; }
      .ixi-location-overview .loc-relationships .relationship-row:hover { background:#1b1b1b !important; }
      .ixi-location-overview .loc-relationships .relationship-row b { color:#ffc400 !important; }
      .ixi-location-overview .loc-commands { background:#0b0b0b !important; border-color:rgba(196,196,196,.11) !important; }
      .ixi-location-overview .loc-thumbs { background:#090909 !important; border-top-color:rgba(196,196,196,.11) !important; }

      /* Neutralize the green cast on the other Location faces too. */
      .ixi-aos-location-f2,
      .f3-financial,
      .f4-obligations,
      .f5 {
        --loc-chassis:#0d0d0d !important;
        --loc-shell:#131313 !important;
        --loc-shell-2:#171717 !important;
        --loc-shell-3:#1b1b1b !important;
        --loc-line:rgba(196,196,196,.22) !important;
        --loc-line-soft:rgba(196,196,196,.11) !important;
        background:#0d0d0d !important;
      }
      .ixi-aos-location-f2 .ops-section,
      .f3-financial .ownership,
      .f3-financial .f3-section,
      .f4-obligations .f4-next,
      .f4-obligations .f4-metric,
      .f4-obligations .f4-section,
      .f5 .f5-sec { background:#131313 !important; border-color:rgba(196,196,196,.22) !important; }
      .ixi-aos-location-f2 .ops-section-title,
      .f3-financial .f3-section>h3,
      .f4-obligations .f4-section>h3,
      .f5 .f5-sec>h3 { background:#171717 !important; border-bottom-color:rgba(196,196,196,.13) !important; }
    `}</style>
  );
}
