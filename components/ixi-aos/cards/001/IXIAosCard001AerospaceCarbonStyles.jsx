/*
 * Card 001 — AEROSPACE CARBON
 * Forged composite, bead-blasted titanium and restrained amber instrumentation.
 * Appearance only: the native chassis, faces, controls, actuators and IXI rail stay authoritative.
 */
export default function IXIAosCard001AerospaceCarbonStyles() {
  return (
    <style jsx global>{`
      .skin-aerospace-carbon {
        --ac-black: #05070a;
        --ac-carbon: #0b0e12;
        --ac-titanium: #aeb9bf;
        --ac-titanium-hot: #e2e8ea;
        --ac-line: #465159;
        --ac-soft: #252d33;
        --ac-amber: #e8892f;
        --ac-amber-hot: #ffc16a;
        --ac-blue: #70c6df;
        --ac-text: #eef2f3;
        --ac-muted: #a5afb4;
        --ac-positive: #8ec8a2;
        --ac-negative: #e27d70;
        --y: var(--ac-amber-hot) !important;
        --line: var(--ac-line) !important;
        --soft: var(--ac-soft) !important;
        --surface: var(--ac-carbon) !important;
        --surface2: var(--ac-black) !important;
        --panel: var(--ac-carbon) !important;
        --text: var(--ac-text) !important;
        --muted: var(--ac-muted) !important;
      }

      .ixi-generic-overview.skin-aerospace-carbon,
      .ixi-aos-location-f2.skin-aerospace-carbon,
      .ixi-location-f3-v12.skin-aerospace-carbon,
      .ixi-generic-face-v12.skin-aerospace-carbon {
        border-color: #718087 !important;
        background-color: var(--ac-black) !important;
        background-image:
          radial-gradient(circle at 13% -7%, rgba(255,193,106,.17), transparent 27%),
          radial-gradient(circle at 91% 16%, rgba(112,198,223,.08), transparent 25%),
          linear-gradient(116deg, transparent 0 38%, rgba(255,255,255,.045) 48%, transparent 57%),
          linear-gradient(180deg, rgba(22,27,31,.38), rgba(3,5,7,.84)),
          url("/ixi/skins/aerospace-carbon.webp") !important;
        background-position: center !important;
        background-size: cover !important;
        background-blend-mode: screen, screen, soft-light, multiply, normal !important;
        background-clip: padding-box !important;
        color: var(--ac-text) !important;
        box-shadow:
          inset 0 0 0 1px rgba(1,2,3,.98),
          inset 0 0 0 2px rgba(196,208,213,.48),
          inset 0 0 0 4px rgba(8,11,14,.95),
          inset 0 0 15px rgba(0,0,0,.86),
          inset 0 1px 0 rgba(255,255,255,.42),
          0 1px 0 rgba(112,198,223,.16),
          0 20px 44px rgba(0,0,0,.76) !important;
      }

      .skin-aerospace-carbon :is(.gov-head,.ops-header,.f3-head,.gfv12-head) {
        border-bottom-color: #9d6938 !important;
        background-color: #101419 !important;
        background-image:
          linear-gradient(90deg, rgba(232,137,47,.15), transparent 30%, rgba(112,198,223,.055)),
          linear-gradient(180deg, rgba(221,230,233,.13), rgba(0,0,0,.48)),
          url("/ixi/skins/aerospace-carbon.webp") !important;
        background-position: center !important;
        background-size: cover !important;
        background-blend-mode: screen, soft-light, multiply !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.20), inset 0 -1px 0 rgba(0,0,0,.88), 0 3px 9px rgba(0,0,0,.58) !important;
      }

      .skin-aerospace-carbon :is(.gov-body,.ops-scroll,.f3-scroll,.gfv12-scroll) {
        background-color: rgba(4,6,8,.42) !important;
        background-image:
          linear-gradient(124deg, rgba(255,255,255,.018), transparent 35%, rgba(0,0,0,.16)),
          url("/ixi/skins/aerospace-carbon.webp") !important;
        background-position: center !important;
        background-size: cover !important;
        background-blend-mode: soft-light, multiply !important;
      }

      .skin-aerospace-carbon :is(.gov-identity,.ops-identity,.f3-identity,.gfv12-ident) > span,
      .skin-aerospace-carbon :is(.gov-relations,.ops-section,.f3-section,.gfv12-section) > h3,
      .skin-aerospace-carbon .gfv12-banner b {
        color: var(--ac-amber-hot) !important;
        text-shadow: 0 1px 0 #000, 0 0 8px rgba(232,137,47,.24);
      }

      .skin-aerospace-carbon :is(.gov-identity,.ops-identity,.f3-identity,.gfv12-ident) > strong,
      .skin-aerospace-carbon :is(.gov-descriptor,.gov-preview,.gov-metric,.gate-code,.ops-section,.f3-section,.f3-contact,.f3-value-card,.f3-lease-ytd,.f3-summary,.gfv12-banner,.gfv12-section) strong {
        color: var(--ac-text) !important;
        text-shadow: 0 1px 1px rgba(0,0,0,.92);
      }

      .skin-aerospace-carbon .f3-summary.tone-positive strong,
      .skin-aerospace-carbon:not(.mode-leased) .f3-status-main :is(b,strong) {
        color: var(--ac-positive) !important;
      }

      .skin-aerospace-carbon .f3-summary.tone-negative strong {
        color: var(--ac-negative) !important;
      }

      .skin-aerospace-carbon.mode-leased .f3-status-main :is(b,strong),
      .skin-aerospace-carbon.mode-leased :is(.f3-contact,.f3-lease-ytd) h4,
      .skin-aerospace-carbon.mode-leased .f3-summary.tone-lease strong {
        color: #a9c9d3 !important;
      }

      .skin-aerospace-carbon :is(.gov-descriptor,.gov-preview,.gov-metric,.gov-relations,.gate-code,.ops-section,.f3-section,.f3-contact,.f3-value-card,.f3-lease-ytd,.f3-summary,.gfv12-banner,.gfv12-section) {
        border-color: #414c53 !important;
        background-color: #0d1115 !important;
        background-image:
          linear-gradient(145deg, rgba(226,232,234,.09), transparent 35%),
          linear-gradient(180deg, rgba(34,41,46,.48), rgba(4,6,8,.78)),
          url("/ixi/skins/aerospace-carbon.webp") !important;
        background-position: center !important;
        background-size: cover !important;
        background-blend-mode: screen, multiply, normal !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.10), inset 0 -1px 0 rgba(0,0,0,.76), 0 2px 4px rgba(0,0,0,.48) !important;
      }

      .skin-aerospace-carbon :is(.gov-relations,.ops-section,.f3-section,.gfv12-section) > h3 {
        border-bottom-color: #76502f !important;
        background: linear-gradient(90deg, rgba(232,137,47,.18), transparent 54%), linear-gradient(180deg, #293137, #111519) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.08) !important;
      }

      .skin-aerospace-carbon :is(.gov-descriptor small,.gov-preview span,.gov-metric span,.gov-relation-scroll small,.gov-relation-scroll em,.ops-label,.rel-label,.f3-row-label,.f3-contact span,.f3-contact small,.f3-summary span,.gfv12-value small,.gfv12-value em,.gfv12-relations small,.gfv12-relations em) {
        color: var(--ac-muted) !important;
        text-shadow: 0 1px 0 #000;
      }

      .skin-aerospace-carbon :is(.gov-preview button,.gov-mark,.ops-icon,.gate-mark,.instruction-icon,.f3-row-icon,.f3-relationship i,.gfv12-relations button > b) {
        color: var(--ac-blue) !important;
        text-shadow: 0 0 7px rgba(112,198,223,.25);
      }

      .skin-aerospace-carbon :is(.gov-relation-scroll button,.ops-row,.ops-relationship,.f3-row,.f3-relationship,.gfv12-value,.gfv12-relations button) {
        border-color: rgba(113,128,135,.28) !important;
        background-color: rgba(2,4,6,.16) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.025) !important;
      }

      .skin-aerospace-carbon :is(.gov-relation-scroll button,.ops-relationship,.f3-relationship,.gfv12-relations button):hover {
        border-color: rgba(255,193,106,.48) !important;
        background-color: rgba(232,137,47,.055) !important;
      }

      .skin-aerospace-carbon :is(.gov-commands,.ops-commands,.f3-commands) {
        border-color: #59666d !important;
        background-color: #0b0f13 !important;
        background-image: linear-gradient(180deg, rgba(226,232,234,.10), rgba(0,0,0,.38)), url("/ixi/skins/aerospace-carbon.webp") !important;
        background-position: center !important;
        background-size: cover !important;
        background-blend-mode: screen, normal !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.12), inset 0 -1px 0 rgba(0,0,0,.84) !important;
      }

      .skin-aerospace-carbon :is(.gov-commands,.ops-commands,.f3-commands) button {
        border-color: rgba(174,185,191,.18) !important;
        background: linear-gradient(180deg, rgba(255,255,255,.045), rgba(0,0,0,.20)) !important;
        color: var(--ac-muted) !important;
        text-shadow: 0 1px 0 #000;
      }

      .skin-aerospace-carbon :is(.gov-commands,.ops-commands,.f3-commands) button:hover {
        border-color: var(--ac-amber-hot) !important;
        color: var(--ac-text) !important;
        box-shadow: inset 0 0 11px rgba(232,137,47,.10), 0 0 6px rgba(232,137,47,.12) !important;
      }

      .skin-aerospace-carbon :is(input,select,textarea) {
        border-color: #56636a !important;
        background: linear-gradient(180deg, #030507, #11161a) !important;
        color: var(--ac-text) !important;
        box-shadow: inset 0 2px 6px rgba(0,0,0,.88), 0 1px 0 rgba(255,255,255,.06) !important;
      }

      .skin-aerospace-carbon :is(input,select,textarea):focus {
        border-color: var(--ac-amber-hot) !important;
        box-shadow: 0 0 0 1px rgba(232,137,47,.15), inset 0 2px 6px rgba(0,0,0,.88) !important;
      }

      .skin-aerospace-carbon :is(.gov-media,.gov-thumbs) {
        border-color: #5d6b72 !important;
        background-color: #030507 !important;
        background-image: linear-gradient(145deg, rgba(112,198,223,.055), transparent 28%), url("/ixi/skins/aerospace-carbon.webp") !important;
        background-position: center !important;
        background-size: cover !important;
        background-blend-mode: screen, multiply !important;
        box-shadow: inset 0 0 18px rgba(0,0,0,.84), inset 0 1px 0 rgba(255,255,255,.09) !important;
      }

      .skin-aerospace-carbon .gov-media img {
        filter: saturate(.84) contrast(1.09) brightness(.93);
      }

      .skin-aerospace-carbon .ixi-collection-thumb-rail {
        border-color: #505c63 !important;
        background-color: #090d10 !important;
        background-image: linear-gradient(180deg, rgba(255,255,255,.08), transparent 38%), url("/ixi/skins/aerospace-carbon.webp") !important;
        background-position: center !important;
        background-size: cover !important;
        background-blend-mode: screen, multiply !important;
      }

      .skin-aerospace-carbon .ixi-collection-thumb {
        border-color: rgba(126,143,151,.48) !important;
        background: linear-gradient(160deg, rgba(255,255,255,.05), rgba(0,0,0,.36)) !important;
      }

      .skin-aerospace-carbon .ixi-collection-thumb.active {
        border-color: var(--ac-amber-hot) !important;
        box-shadow: inset 0 0 11px rgba(232,137,47,.08), 0 0 7px rgba(232,137,47,.18) !important;
      }

      .skin-aerospace-carbon .ixi-aos-card-header-controls {
        border-color: #718087 !important;
        background-color: #11161a !important;
        background-image: linear-gradient(180deg, rgba(255,255,255,.15), rgba(0,0,0,.42)), url("/ixi/skins/aerospace-carbon.webp") !important;
        background-position: center !important;
        background-size: cover !important;
        background-blend-mode: screen, normal !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.18), 0 3px 10px rgba(0,0,0,.64) !important;
      }

      .skin-aerospace-carbon .ixi-aos-card-header-controls .header-action {
        border-left-color: rgba(174,185,191,.16) !important;
        color: var(--ac-muted) !important;
        text-shadow: 0 1px 0 #000;
      }

      .skin-aerospace-carbon .ixi-aos-card-header-controls :is(.header-action.add,.header-action.transact),
      .skin-aerospace-carbon .ixi-aos-card-header-controls .header-action:hover {
        color: var(--ac-amber-hot) !important;
        background-color: rgba(232,137,47,.075) !important;
      }

      .skin-aerospace-carbon .ixi-aos-card-header-controls .header-menu {
        border-color: #68777e !important;
        background-color: #090d10 !important;
        background-image: linear-gradient(145deg, rgba(255,255,255,.08), transparent 35%), url("/ixi/skins/aerospace-carbon.webp") !important;
        background-position: center !important;
        background-size: cover !important;
        background-blend-mode: screen, normal !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.11), 0 18px 38px rgba(0,0,0,.84) !important;
      }

      .skin-aerospace-carbon .ixi-aos-card-header-controls .header-menu button:hover,
      .skin-aerospace-carbon .ixi-aos-card-header-controls .header-menu button.active {
        border-color: rgba(255,193,106,.58) !important;
        background: rgba(232,137,47,.12) !important;
        color: var(--ac-amber-hot) !important;
      }

      .skin-aerospace-carbon .board-command-rail {
        border-top-color: #a36c37 !important;
        background-color: #080c0f !important;
        background-image:
          linear-gradient(180deg, rgba(226,232,234,.12), transparent 40%),
          linear-gradient(90deg, rgba(112,198,223,.07), transparent 24%, transparent 72%, rgba(232,137,47,.13)),
          url("/ixi/skins/aerospace-carbon.webp") !important;
        background-position: center !important;
        background-size: cover !important;
        background-blend-mode: screen, screen, normal !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.16), inset 0 -1px 0 rgba(0,0,0,.88), 0 -3px 10px rgba(0,0,0,.64) !important;
      }

      .skin-aerospace-carbon .board-command-rail .rail-zone {
        border-right-color: rgba(174,185,191,.13) !important;
        background-image: linear-gradient(180deg, rgba(255,255,255,.035), rgba(0,0,0,.26)) !important;
      }

      .skin-aerospace-carbon .board-command-rail .rail-zone:hover {
        background-image: linear-gradient(180deg, rgba(232,137,47,.14), rgba(0,0,0,.20)) !important;
      }

      .skin-aerospace-carbon .board-command-rail .rail-zone::after {
        background: #9ca8ad !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.34), 0 0 6px rgba(112,198,223,.14) !important;
      }

      .skin-aerospace-carbon .board-command-rail .rail-send::after,
      .skin-aerospace-carbon .board-command-rail .destination-armed::after {
        background: var(--ac-amber-hot) !important;
        box-shadow: 0 0 10px rgba(232,137,47,.48) !important;
      }

      .aos-generic-console-slot:has(.skin-aerospace-carbon) > .ixi-object-card-actuator {
        background-color: #171d21 !important;
        background-image: linear-gradient(90deg, rgba(226,232,234,.20), transparent 42%, rgba(0,0,0,.46)), url("/ixi/skins/aerospace-carbon.webp") !important;
        background-position: center !important;
        background-size: cover !important;
        box-shadow: inset 1px 0 0 rgba(255,255,255,.20), inset -1px 0 0 rgba(0,0,0,.76), 0 1px 4px rgba(0,0,0,.64) !important;
      }

      .aos-generic-console-slot:has(.skin-aerospace-carbon) > .ixi-object-card-actuator:hover {
        background-color: var(--ac-amber) !important;
        box-shadow: 0 0 9px rgba(232,137,47,.40) !important;
      }

      .aos-card001-v12-identity-shell.skin-aerospace-carbon .aos-card001-ixi-identity {
        background: rgba(3,5,7,.80) !important;
        box-shadow: 0 0 5px 4px rgba(3,5,7,.80) !important;
        color: var(--ac-amber-hot) !important;
        text-shadow: 0 1px 0 #000 !important;
      }

      .aos-card001-v12-identity-shell.skin-aerospace-carbon .ixi-v12-customer-identity-label {
        color: var(--ac-muted) !important;
      }

      .aos-card001-v12-identity-shell.skin-aerospace-carbon .ixi-v12-customer-identity-value {
        color: var(--ac-text) !important;
        text-shadow: 0 1px 1px rgba(0,0,0,.94);
      }
    `}</style>
  );
}
