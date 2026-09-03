/*
 * Card 001 — BLACK TITANIUM
 * Body-first PVD instrument finish. The native chassis, rail and actuators remain authoritative.
 */
export default function IXIAosCard001BlackTitaniumStyles() {
  return (
    <style jsx global>{`
      .skin-black-titanium {
        --bt-shell: #080a0c;
        --bt-surface: #111519;
        --bt-surface-raised: #1a2025;
        --bt-surface-inset: #090c0f;
        --bt-edge: #69747c;
        --bt-line: #343c42;
        --bt-soft: #20272c;
        --bt-text: #f3f5f6;
        --bt-muted: #a4adb3;
        --bt-faint: #717b82;
        --bt-gold: #e3b654;
        --bt-gold-hot: #ffd77a;
        --bt-cyan: #72d5eb;
        --bt-positive: #86d5ad;
        --bt-negative: #ff7f73;
        --y: var(--bt-gold) !important;
        --line: var(--bt-line) !important;
        --soft: var(--bt-soft) !important;
        --surface: var(--bt-surface) !important;
        --surface2: var(--bt-surface-inset) !important;
        --panel: var(--bt-surface) !important;
        --text: var(--bt-text) !important;
        --muted: var(--bt-muted) !important;
      }

      .ixi-generic-overview.skin-black-titanium,
      .ixi-aos-location-f2.skin-black-titanium,
      .ixi-location-f3-v12.skin-black-titanium,
      .ixi-generic-face-v12.skin-black-titanium {
        border-color: var(--bt-edge) !important;
        background-color: var(--bt-shell) !important;
        background-image:
          radial-gradient(circle at 18% -4%, rgba(255,255,255,.16), transparent 30%),
          radial-gradient(circle at 92% 12%, rgba(114,213,235,.09), transparent 28%),
          linear-gradient(112deg, transparent 0 35%, rgba(255,255,255,.035) 46%, transparent 57%),
          linear-gradient(180deg, rgba(34,39,43,.68), rgba(8,10,12,.92) 24%, rgba(4,6,8,.97)),
          url("/ixi/skins/black-titanium-pvd.webp") !important;
        background-position: center !important;
        background-size: cover !important;
        background-blend-mode: screen, screen, soft-light, multiply, normal !important;
        background-clip: padding-box !important;
        color: var(--bt-text) !important;
        box-shadow:
          inset 0 0 0 1px rgba(1,3,5,.98),
          inset 0 0 0 2px rgba(160,176,186,.38),
          inset 0 0 0 4px rgba(7,10,12,.94),
          inset 0 0 14px rgba(0,0,0,.82),
          inset 0 1px 0 rgba(255,255,255,.34),
          0 1px 0 rgba(114,213,235,.13),
          0 18px 40px rgba(0,0,0,.70) !important;
      }

      .skin-black-titanium :is(.gov-head,.ops-header,.f3-head,.gfv12-head) {
        border-bottom-color: #56616a !important;
        background-color: #111519 !important;
        background-image:
          linear-gradient(90deg, rgba(227,182,84,.09), transparent 32%, rgba(114,213,235,.055)),
          linear-gradient(180deg, rgba(50,57,62,.50), rgba(12,16,19,.90)),
          url("/ixi/skins/black-titanium-pvd.webp") !important;
        background-position: center !important;
        background-size: cover !important;
        background-blend-mode: screen, multiply, normal !important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.20),
          inset 0 -1px 0 rgba(0,0,0,.82),
          0 2px 8px rgba(0,0,0,.44) !important;
      }

      .skin-black-titanium :is(.gov-identity,.ops-identity,.f3-identity,.gfv12-ident) > span,
      .skin-black-titanium :is(.gov-relations,.ops-section,.f3-section,.gfv12-section) > h3,
      .skin-black-titanium .gfv12-banner b {
        color: var(--bt-gold-hot) !important;
        text-shadow: 0 0 8px rgba(227,182,84,.22);
      }

      .skin-black-titanium :is(.gov-identity,.ops-identity,.f3-identity,.gfv12-ident) > strong,
      .skin-black-titanium :is(.gov-descriptor,.gov-preview,.gov-metric,.gate-code,.ops-section,.f3-section,.f3-contact,.f3-value-card,.f3-lease-ytd,.f3-summary,.gfv12-banner,.gfv12-section) strong {
        color: var(--bt-text) !important;
      }

      .skin-black-titanium .f3-summary.tone-positive strong,
      .skin-black-titanium:not(.mode-leased) .f3-status-main :is(b,strong) {
        color: var(--bt-positive) !important;
      }

      .skin-black-titanium .f3-summary.tone-negative strong {
        color: var(--bt-negative) !important;
      }

      .skin-black-titanium.mode-leased .f3-status-main :is(b,strong),
      .skin-black-titanium.mode-leased :is(.f3-contact,.f3-lease-ytd) h4,
      .skin-black-titanium.mode-leased .f3-summary.tone-lease strong {
        color: #b7a6ff !important;
      }

      .skin-black-titanium :is(.gov-descriptor,.gov-preview,.gov-metric,.gov-relations,.gate-code,.ops-section,.f3-section,.f3-contact,.f3-value-card,.f3-lease-ytd,.f3-summary,.gfv12-banner,.gfv12-section) {
        border-color: var(--bt-line) !important;
        background-color: #0c1013 !important;
        background-image:
          linear-gradient(145deg, rgba(255,255,255,.045), transparent 36%),
          linear-gradient(180deg, rgba(27,33,38,.58), rgba(7,10,12,.82)),
          url("/ixi/skins/black-titanium-pvd.webp") !important;
        background-position: center !important;
        background-size: cover !important;
        background-blend-mode: screen, multiply, normal !important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.09),
          inset 0 -1px 0 rgba(0,0,0,.70),
          0 2px 3px rgba(0,0,0,.42) !important;
      }

      .skin-black-titanium :is(.gov-relations,.ops-section,.f3-section,.gfv12-section) > h3 {
        border-bottom-color: var(--bt-soft) !important;
        background:
          linear-gradient(90deg, rgba(227,182,84,.075), transparent 48%),
          linear-gradient(180deg, #232a2f, #12171a) !important;
      }

      .skin-black-titanium :is(.gov-descriptor small,.gov-preview span,.gov-metric span,.gov-relation-scroll small,.gov-relation-scroll em,.ops-label,.rel-label,.f3-row-label,.f3-contact span,.f3-contact small,.f3-summary span,.gfv12-value small,.gfv12-value em,.gfv12-relations small,.gfv12-relations em) {
        color: var(--bt-muted) !important;
      }

      .skin-black-titanium :is(.gov-preview button,.gov-mark,.ops-icon,.gate-mark,.instruction-icon,.f3-row-icon,.f3-relationship i,.gfv12-relations button > b) {
        color: var(--bt-cyan) !important;
        text-shadow: 0 0 7px rgba(114,213,235,.24);
      }

      .skin-black-titanium :is(.gov-relation-scroll button,.ops-row,.ops-relationship,.f3-row,.f3-relationship,.gfv12-value,.gfv12-relations button) {
        border-color: var(--bt-soft) !important;
        background-color: transparent !important;
      }

      .skin-black-titanium :is(.gov-relation-scroll button,.ops-relationship,.f3-relationship,.gfv12-relations button):hover {
        background-color: rgba(114,213,235,.055) !important;
      }

      .skin-black-titanium :is(.gov-commands,.ops-commands,.f3-commands) {
        border-color: var(--bt-line) !important;
        background-color: #0b0f12 !important;
        background-image:
          linear-gradient(180deg, rgba(255,255,255,.08), rgba(0,0,0,.38)),
          url("/ixi/skins/black-titanium-pvd.webp") !important;
        background-position: center !important;
        background-size: cover !important;
        background-blend-mode: screen, normal !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.10), inset 0 -1px 0 rgba(0,0,0,.78) !important;
      }

      .skin-black-titanium :is(.gov-commands,.ops-commands,.f3-commands) button {
        border-color: var(--bt-soft) !important;
        background: linear-gradient(180deg, rgba(255,255,255,.035), rgba(0,0,0,.12)) !important;
        color: var(--bt-muted) !important;
      }

      .skin-black-titanium :is(.gov-commands,.ops-commands,.f3-commands) button:hover {
        border-color: var(--bt-gold) !important;
        color: var(--bt-gold-hot) !important;
        box-shadow: inset 0 0 10px rgba(227,182,84,.07) !important;
      }

      .skin-black-titanium :is(input,select,textarea) {
        border-color: #465058 !important;
        background: linear-gradient(180deg, #080b0e, #101419) !important;
        color: var(--bt-text) !important;
        box-shadow: inset 0 1px 4px rgba(0,0,0,.74) !important;
      }

      .skin-black-titanium :is(input,select,textarea):focus {
        border-color: var(--bt-gold) !important;
        box-shadow: 0 0 0 1px rgba(227,182,84,.12), inset 0 1px 4px rgba(0,0,0,.74) !important;
      }

      .skin-black-titanium :is(.gov-media,.gov-thumbs) {
        border-color: #4c565e !important;
        background-color: #07090b !important;
        background-image:
          linear-gradient(145deg, rgba(114,213,235,.035), transparent 28%),
          url("/ixi/skins/black-titanium-pvd.webp") !important;
        background-position: center !important;
        background-size: cover !important;
        background-blend-mode: screen, multiply !important;
        box-shadow: inset 0 0 16px rgba(0,0,0,.80), inset 0 1px 0 rgba(255,255,255,.07) !important;
      }

      .skin-black-titanium .gov-media img {
        filter: saturate(.88) contrast(1.08) brightness(.93);
      }

      .skin-black-titanium .ixi-aos-card-header-controls {
        border-color: #59646d !important;
        background-color: #11161a !important;
        background-image:
          linear-gradient(180deg, rgba(255,255,255,.15), rgba(0,0,0,.40)),
          url("/ixi/skins/black-titanium-pvd.webp") !important;
        background-position: center !important;
        background-size: cover !important;
        background-blend-mode: screen, normal !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.16), 0 3px 9px rgba(0,0,0,.48) !important;
      }

      .skin-black-titanium .ixi-aos-card-header-controls .header-action {
        border-left-color: rgba(255,255,255,.10) !important;
        color: var(--bt-muted) !important;
      }

      .skin-black-titanium .ixi-aos-card-header-controls :is(.header-action.add,.header-action.transact),
      .skin-black-titanium .ixi-aos-card-header-controls .header-action:hover {
        color: var(--bt-gold-hot) !important;
        background-color: rgba(227,182,84,.055) !important;
      }

      .skin-black-titanium .ixi-aos-card-header-controls .header-menu {
        border-color: #5b666e !important;
        background:
          linear-gradient(145deg, rgba(255,255,255,.05), transparent 35%),
          #0c1013 !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.10), 0 16px 34px rgba(0,0,0,.72) !important;
      }

      .skin-black-titanium .ixi-aos-card-header-controls .header-menu button:hover,
      .skin-black-titanium .ixi-aos-card-header-controls .header-menu button.active {
        border-color: rgba(227,182,84,.55) !important;
        background: rgba(227,182,84,.07) !important;
        color: var(--bt-gold-hot) !important;
      }

      .skin-black-titanium .board-command-rail {
        border-top-color: rgba(114,213,235,.42) !important;
        background-color: #080c0f !important;
        background-image:
          linear-gradient(180deg, rgba(255,255,255,.10), transparent 45%),
          linear-gradient(90deg, rgba(114,213,235,.10), transparent 23%, transparent 76%, rgba(227,182,84,.09)),
          url("/ixi/skins/black-titanium-pvd.webp") !important;
        background-position: center !important;
        background-size: cover !important;
        background-blend-mode: screen, screen, normal !important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.14),
          inset 0 -1px 0 rgba(0,0,0,.72),
          0 -2px 8px rgba(0,0,0,.50) !important;
      }

      .skin-black-titanium .board-command-rail .rail-zone {
        border-right-color: rgba(255,255,255,.075) !important;
      }

      .skin-black-titanium .board-command-rail .rail-zone::after {
        background: #8f9aa2 !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.25), 0 0 6px rgba(114,213,235,.12) !important;
      }

      .skin-black-titanium .board-command-rail .rail-send::after,
      .skin-black-titanium .board-command-rail .destination-armed::after {
        background: var(--bt-gold-hot) !important;
        box-shadow: 0 0 8px rgba(227,182,84,.40) !important;
      }

      .aos-generic-console-slot:has(.skin-black-titanium) > .ixi-object-card-actuator {
        background-color: #171c20 !important;
        background-image:
          linear-gradient(90deg, rgba(255,255,255,.18), transparent 42%, rgba(0,0,0,.42)),
          url("/ixi/skins/black-titanium-pvd.webp") !important;
        background-position: center !important;
        background-size: cover !important;
        box-shadow: inset 1px 0 0 rgba(255,255,255,.18), inset -1px 0 0 rgba(0,0,0,.72), 0 1px 4px rgba(0,0,0,.60) !important;
      }

      .aos-generic-console-slot:has(.skin-black-titanium) > .ixi-object-card-actuator:hover {
        background-color: var(--bt-gold) !important;
        box-shadow: 0 0 8px rgba(227,182,84,.36) !important;
      }

      .aos-card001-v12-identity-shell.skin-black-titanium .aos-card001-ixi-identity,
      .aos-card001-v12-identity-shell.skin-black-titanium .ixi-v12-customer-identity-label {
        color: var(--bt-muted) !important;
      }

      .aos-card001-v12-identity-shell.skin-black-titanium .ixi-v12-customer-identity-value {
        color: var(--bt-text) !important;
        text-shadow: 0 1px 0 rgba(0,0,0,.72);
      }
    `}</style>
  );
}
