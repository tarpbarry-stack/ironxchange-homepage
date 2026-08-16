export default function IXIAosOfficeSkinCompatibilityStyles() {
  return (
    <style jsx global>{`
      .card001:has(.ixi-aos-card-header-controls.skin-steel) {
        border-color: rgba(210,220,224,.24) !important;
        background: linear-gradient(135deg,#1a1d1f,#0d0f10) !important;
      }

      .card001:has(.ixi-aos-card-header-controls.skin-steel) .identity span,
      .card001:has(.ixi-aos-card-header-controls.skin-steel) .relationships .ixi-face-section-title {
        color: #d9dde0 !important;
      }

      .card001:has(.ixi-aos-card-header-controls.skin-blueprint) {
        border-color: rgba(61,184,255,.28) !important;
        background: linear-gradient(180deg,#0a1720,#050b10) !important;
      }

      .card001:has(.ixi-aos-card-header-controls.skin-blueprint) .identity span,
      .card001:has(.ixi-aos-card-header-controls.skin-blueprint) .relationships .ixi-face-section-title,
      .card001:has(.ixi-aos-card-header-controls.skin-blueprint) .preview-out {
        color: #54c7ff !important;
      }

      .card001:has(.ixi-aos-card-header-controls.skin-industrial) {
        border-color: rgba(255,190,65,.28) !important;
        background: linear-gradient(135deg,#1e170c,#0e0b07) !important;
      }

      .card001:has(.ixi-aos-card-header-controls.skin-industrial) .identity span,
      .card001:has(.ixi-aos-card-header-controls.skin-industrial) .relationships .ixi-face-section-title,
      .card001:has(.ixi-aos-card-header-controls.skin-industrial) .preview-out {
        color: #ffc400 !important;
      }

      .f3-financial:has(.ixi-aos-card-header-controls.skin-v12) {
        --paper:#0d0f0f !important;
        --paper2:#111414 !important;
        --ink:#eeeeee !important;
        --ink-soft:rgba(255,255,255,.52) !important;
        --accent:#ffc400 !important;
        --line:rgba(255,255,255,.10) !important;
        --line-soft:rgba(255,255,255,.055) !important;
        --panel:#111414 !important;
        --money:#83d31b !important;
        --negative:#ff4b35 !important;
        border-radius:14px !important;
        border-color:rgba(255,255,255,.10) !important;
        background:linear-gradient(180deg,rgba(255,255,255,.025),transparent 30%),#101010 !important;
        color:#eee !important;
        font-family:Arial,Helvetica,sans-serif !important;
      }

      .f3-financial:has(.ixi-aos-card-header-controls.skin-steel) {
        --paper:#111416 !important;
        --paper2:#191c1e !important;
        --ink:#edf0f1 !important;
        --ink-soft:#9aa3a7 !important;
        --accent:#d9dde0 !important;
        --line:#3b4245 !important;
        --line-soft:rgba(217,221,224,.10) !important;
        --panel:#191c1e !important;
        --money:#d9dde0 !important;
        border-radius:14px !important;
        background:linear-gradient(135deg,#1a1d1f,#0d0f10) !important;
        color:#edf0f1 !important;
        font-family:Arial,Helvetica,sans-serif !important;
      }

      .f3-financial:has(.ixi-aos-card-header-controls.skin-blueprint) {
        --paper:#071119 !important;
        --paper2:#0b1a24 !important;
        --ink:#e8f5fb !important;
        --ink-soft:#79a7bc !important;
        --accent:#54c7ff !important;
        --line:#17435b !important;
        --line-soft:rgba(84,199,255,.10) !important;
        --panel:#0b1a24 !important;
        --money:#54c7ff !important;
        border-radius:14px !important;
        background:linear-gradient(180deg,#0a1720,#050b10) !important;
        color:#e8f5fb !important;
        font-family:Arial,Helvetica,sans-serif !important;
      }

      .f3-financial:has(.ixi-aos-card-header-controls.skin-industrial) {
        --paper:#171108 !important;
        --paper2:#21190d !important;
        --ink:#f4ead4 !important;
        --ink-soft:#a99572 !important;
        --accent:#ffc400 !important;
        --line:#594321 !important;
        --line-soft:rgba(255,196,0,.10) !important;
        --panel:#21190d !important;
        --money:#ffc400 !important;
        border-radius:14px !important;
        background:linear-gradient(135deg,#1e170c,#0e0b07) !important;
        color:#f4ead4 !important;
        font-family:Arial,Helvetica,sans-serif !important;
      }

      .f3-financial:has(.ixi-aos-card-header-controls.skin-v12)::before,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-v12)::after,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-steel)::before,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-steel)::after,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-blueprint)::before,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-blueprint)::after,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-industrial)::before,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-industrial)::after {
        border-color: transparent !important;
      }

      .f3-financial:has(.ixi-aos-card-header-controls.skin-v12) .currency-ornament,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-steel) .currency-ornament,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-blueprint) .currency-ornament,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-industrial) .currency-ornament {
        display: none !important;
      }

      .f3-financial:has(.ixi-aos-card-header-controls.skin-v12) .f3-header,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-steel) .f3-header,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-blueprint) .f3-header,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-industrial) .f3-header {
        background: linear-gradient(180deg,rgba(255,255,255,.025),transparent) !important;
      }

      .f3-financial:has(.ixi-aos-card-header-controls.skin-v12) .ownership,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-v12) .f3-section,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-steel) .ownership,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-steel) .f3-section,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-blueprint) .ownership,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-blueprint) .f3-section,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-industrial) .ownership,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-industrial) .f3-section {
        background: var(--panel) !important;
      }

      .f3-financial:has(.ixi-aos-card-header-controls.skin-v12) .f3-section > h3,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-steel) .f3-section > h3,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-blueprint) .f3-section > h3,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-industrial) .f3-section > h3 {
        background: rgba(255,255,255,.018) !important;
      }

      .f3-financial:has(.ixi-aos-card-header-controls.skin-v12) .face-banner,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-steel) .face-banner,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-blueprint) .face-banner,
      .f3-financial:has(.ixi-aos-card-header-controls.skin-industrial) .face-banner {
        clip-path: none !important;
        border-radius: 4px !important;
        background: rgba(255,255,255,.02) !important;
        color: var(--accent) !important;
      }
    `}</style>
  );
}
