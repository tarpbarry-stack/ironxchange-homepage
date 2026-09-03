/*
 * Card 001 — FOUNDRY GREEN
 * Treasury instrument skin: restrained engraved metal on operational faces,
 * original security-paper language on financial faces. Native 300 × 475 geometry,
 * IXI rail behavior and actuator placement remain under chassis control.
 */
export default function IXIAosCard001FoundryGreenStyles() {
  return (
    <style jsx global>{`
      .skin-foundry-green {
        --fg-deep: #07120d;
        --fg-iron: #0d2118;
        --fg-raised: #163326;
        --fg-ink: #173f2f;
        --fg-ink-dark: #0b271d;
        --fg-paper: #d7d6b7;
        --fg-paper-high: #efecd0;
        --fg-paper-low: #aeb694;
        --fg-bronze: #9c7938;
        --fg-bronze-hot: #d3b363;
        --fg-text: #f1edcf;
        --fg-muted: #aab7a4;
        --fg-positive: #89c798;
        --fg-negative: #d57b68;
        --fg-line: #365444;
        --fg-soft: #223d31;
        --y: var(--fg-bronze-hot) !important;
        --line: var(--fg-line) !important;
        --soft: var(--fg-soft) !important;
        --surface: var(--fg-iron) !important;
        --surface2: var(--fg-deep) !important;
        --panel: var(--fg-iron) !important;
        --text: var(--fg-text) !important;
        --muted: var(--fg-muted) !important;
      }

      .ixi-generic-overview.skin-foundry-green,
      .ixi-aos-location-f2.skin-foundry-green,
      .ixi-location-f3-v12.skin-foundry-green,
      .ixi-generic-face-v12.skin-foundry-green {
        border-color: #657a64 !important;
        background-color: var(--fg-deep) !important;
        background-image:
          radial-gradient(circle at 17% -4%, rgba(238,236,208,.16), transparent 27%),
          linear-gradient(112deg, transparent 0 34%, rgba(255,255,255,.045) 45%, transparent 57%),
          repeating-linear-gradient(91deg, rgba(255,255,255,.014) 0 1px, transparent 1px 8px),
          linear-gradient(180deg, #1c3a2c, #0b1c14 24%, #061009) !important;
        background-clip: padding-box !important;
        color: var(--fg-text) !important;
        box-shadow:
          inset 0 0 0 1px rgba(1,8,4,.98),
          inset 0 0 0 2px rgba(183,194,158,.34),
          inset 0 0 0 4px rgba(7,22,14,.96),
          inset 0 0 16px rgba(0,0,0,.84),
          inset 0 1px 0 rgba(239,236,208,.29),
          0 1px 0 rgba(211,179,99,.14),
          0 20px 44px rgba(0,0,0,.76) !important;
      }

      .skin-foundry-green :is(.gov-head,.ops-header,.f3-head,.gfv12-head) {
        border-bottom-color: #8c763c !important;
        background-color: #10271c !important;
        background-image:
          linear-gradient(90deg, rgba(211,179,99,.13), transparent 28%, rgba(215,214,183,.04)),
          repeating-linear-gradient(0deg, rgba(235,231,195,.018) 0 1px, transparent 1px 3px),
          linear-gradient(180deg, #244534, #0b1c13) !important;
        box-shadow: inset 0 1px 0 rgba(239,236,208,.18), inset 0 -1px 0 rgba(0,0,0,.88), 0 3px 8px rgba(0,0,0,.50) !important;
      }

      .skin-foundry-green :is(.gov-body,.ops-scroll,.gfv12-scroll) {
        background-color: rgba(5,15,9,.46) !important;
        background-image:
          radial-gradient(circle at 82% 8%, rgba(211,179,99,.07), transparent 25%),
          linear-gradient(180deg, rgba(5,18,11,.90), rgba(4,13,8,.96)),
          url("/ixi/skins/foundry-green-guilloche.svg"),
          url("/ixi/skins/foundry-green-paper.webp") !important;
        background-size: cover, cover, 240px 120px, 192px 192px !important;
        background-blend-mode: screen, normal, soft-light, multiply !important;
      }

      .ixi-generic-face-v12.skin-foundry-green .gfv12-scroll {
        background-image:
          linear-gradient(180deg, rgba(4,17,10,.92), rgba(3,12,7,.96)),
          url("/ixi/skins/foundry-green-medallion.webp"),
          url("/ixi/skins/foundry-green-guilloche.svg"),
          url("/ixi/skins/foundry-green-paper.webp") !important;
        background-position: center, center 96%, center, center !important;
        background-repeat: no-repeat, no-repeat, repeat, repeat !important;
        background-size: cover, 176px 176px, 240px 120px, 192px 192px !important;
        background-blend-mode: normal, soft-light, soft-light, multiply !important;
      }

      .skin-foundry-green :is(.gov-identity,.ops-identity,.f3-identity,.gfv12-ident) > span,
      .skin-foundry-green :is(.gov-relations,.ops-section,.f3-section,.gfv12-section) > h3,
      .skin-foundry-green .gfv12-banner b {
        color: var(--fg-bronze-hot) !important;
        text-shadow: 0 1px 0 #000, 0 0 7px rgba(211,179,99,.16);
      }

      .skin-foundry-green :is(.gov-identity,.ops-identity,.f3-identity,.gfv12-ident) > strong,
      .skin-foundry-green :is(.gov-descriptor,.gov-preview,.gov-metric,.gate-code,.ops-section,.gfv12-banner,.gfv12-section) strong {
        color: var(--fg-text) !important;
        text-shadow: 0 1px 1px rgba(0,0,0,.92);
      }

      .skin-foundry-green :is(.gov-descriptor,.gov-preview,.gov-metric,.gov-relations,.gate-code,.ops-section,.gfv12-banner,.gfv12-section) {
        border-color: #385847 !important;
        background-color: #0d2118 !important;
        background-image:
          linear-gradient(145deg, rgba(239,236,208,.065), transparent 37%),
          url("/ixi/skins/foundry-green-guilloche.svg"),
          linear-gradient(180deg, rgba(24,52,39,.94), rgba(6,17,11,.98)),
          url("/ixi/skins/foundry-green-paper.webp") !important;
        background-size: cover, 240px 120px, cover, 192px 192px !important;
        background-blend-mode: screen, soft-light, normal, multiply !important;
        box-shadow: inset 0 1px 0 rgba(239,236,208,.08), inset 0 -1px 0 rgba(0,0,0,.74), 0 2px 3px rgba(0,0,0,.46) !important;
      }

      .skin-foundry-green :is(.gov-relations,.ops-section,.gfv12-section) > h3 {
        border-bottom-color: #5e5a31 !important;
        background-image:
          linear-gradient(90deg, rgba(211,179,99,.13), transparent 55%),
          linear-gradient(180deg, #294434, #10241a) !important;
        box-shadow: inset 0 1px 0 rgba(239,236,208,.06) !important;
      }

      .skin-foundry-green :is(.gov-descriptor small,.gov-preview span,.gov-metric span,.gov-relation-scroll small,.gov-relation-scroll em,.ops-label,.rel-label,.gfv12-value small,.gfv12-value em,.gfv12-relations small,.gfv12-relations em) {
        color: var(--fg-muted) !important;
      }

      .skin-foundry-green :is(.gov-preview button,.gov-mark,.ops-icon,.gate-mark,.instruction-icon,.gfv12-relations button > b) {
        color: #88c7ae !important;
        text-shadow: 0 0 6px rgba(136,199,174,.22);
      }

      .skin-foundry-green :is(.gov-relation-scroll button,.ops-row,.ops-relationship,.gfv12-value,.gfv12-relations button) {
        border-color: rgba(83,112,91,.39) !important;
        background-color: rgba(4,13,8,.16) !important;
        box-shadow: inset 0 1px 0 rgba(239,236,208,.025) !important;
      }

      .skin-foundry-green :is(.gov-relation-scroll button,.ops-relationship,.gfv12-relations button):hover {
        border-color: rgba(211,179,99,.48) !important;
        background-color: rgba(136,199,174,.06) !important;
      }

      /* Financial face reads as one engraved reserve certificate, not paper tiles. */
      .ixi-location-f3-v12.skin-foundry-green {
        border-color: #877849 !important;
        background-color: #0b2015 !important;
        background-image:
          radial-gradient(ellipse at 50% 18%, rgba(239,236,208,.15), transparent 34%),
          url("/ixi/skins/foundry-green-guilloche.svg"),
          linear-gradient(180deg, #244a36, #09170f) !important;
        background-size: cover, 240px 120px, cover !important;
        background-blend-mode: screen, soft-light, normal !important;
        box-shadow:
          inset 0 0 0 1px rgba(5,18,10,.98),
          inset 0 0 0 2px rgba(210,191,125,.46),
          inset 0 0 0 4px rgba(11,35,22,.98),
          inset 0 0 16px rgba(0,0,0,.72),
          0 20px 44px rgba(0,0,0,.76) !important;
      }

      .skin-foundry-green .f3-scroll {
        background-color: #c3c4a2 !important;
        background-image:
          linear-gradient(rgba(202,203,169,.87), rgba(174,181,145,.90)),
          url("/ixi/skins/foundry-green-guilloche.svg"),
          url("/ixi/skins/foundry-green-paper.webp") !important;
        background-size: cover, 240px 120px, 192px 192px !important;
        background-blend-mode: multiply, soft-light, normal !important;
        box-shadow: inset 0 0 0 1px rgba(239,235,196,.42), inset 0 0 24px rgba(24,53,38,.36) !important;
        scrollbar-color: #28513c #a9ad8b !important;
      }

      .skin-foundry-green :is(.f3-section,.f3-contact,.f3-value-card,.f3-lease-ytd,.f3-summary) {
        border-color: rgba(25,67,47,.66) !important;
        background-color: rgba(205,205,169,.45) !important;
        background-image:
          linear-gradient(145deg, rgba(255,254,224,.32), transparent 38%),
          linear-gradient(180deg, rgba(215,213,176,.30), rgba(165,176,140,.20)),
          url("/ixi/skins/foundry-green-paper.webp") !important;
        background-size: cover, cover, 192px 192px !important;
        background-blend-mode: screen, multiply, normal !important;
        box-shadow: inset 0 0 0 1px rgba(244,240,201,.30), inset 0 0 8px rgba(31,72,50,.12), 0 2px 4px rgba(7,25,16,.18) !important;
      }

      .skin-foundry-green .f3-section-body { background: transparent !important; }

      .skin-foundry-green .f3-section > h3 {
        border-bottom-color: rgba(25,67,47,.58) !important;
        background-image:
          linear-gradient(90deg, rgba(19,62,43,.30), transparent 62%),
          url("/ixi/skins/foundry-green-guilloche.svg"),
          linear-gradient(180deg, rgba(210,210,174,.86), rgba(167,178,141,.88)) !important;
        background-size: cover, 240px 120px, cover !important;
        color: #123b2a !important;
        text-shadow: 0 1px rgba(247,243,205,.68) !important;
        box-shadow: inset 0 1px rgba(247,243,205,.36), inset 0 -1px rgba(22,62,43,.16) !important;
      }

      .skin-foundry-green :is(.f3-section,.f3-contact,.f3-value-card,.f3-lease-ytd,.f3-summary) strong,
      .skin-foundry-green .f3-status-main :is(b,strong) {
        color: #0d3021 !important;
        text-shadow: 0 1px rgba(255,255,236,.55) !important;
      }

      .skin-foundry-green :is(.f3-row-label,.f3-contact span,.f3-contact small,.f3-summary span,.f3-status-date span,.f3-value-card span) {
        color: #405f4d !important;
        text-shadow: 0 1px rgba(255,255,236,.42) !important;
      }

      .skin-foundry-green :is(.f3-row,.f3-relationship) {
        border-color: rgba(25,67,47,.31) !important;
        background-color: rgba(236,232,194,.10) !important;
      }

      .skin-foundry-green .f3-status-banner {
        background-image:
          radial-gradient(circle at 12% 50%, rgba(226,212,151,.15), transparent 28%),
          url("/ixi/skins/foundry-green-guilloche.svg"),
          linear-gradient(90deg, rgba(18,56,39,.92), rgba(9,34,22,.96)) !important;
        background-size: cover, 240px 120px, cover !important;
        background-blend-mode: screen, soft-light, normal !important;
        box-shadow: inset 0 0 0 1px rgba(218,201,137,.18) !important;
      }

      .skin-foundry-green .f3-status-banner :is(strong,small,span) {
        color: var(--fg-text) !important;
        text-shadow: 0 1px 0 #000 !important;
      }

      .skin-foundry-green .f3-value-card {
        background-image:
          linear-gradient(90deg, rgba(204,204,167,.92), rgba(196,198,160,.68)),
          url("/ixi/skins/foundry-green-medallion.webp"),
          url("/ixi/skins/foundry-green-paper.webp") !important;
        background-position: center, 108% 62%, center !important;
        background-repeat: no-repeat, no-repeat, repeat !important;
        background-size: cover, 128px 128px, 192px 192px !important;
        background-blend-mode: normal, multiply, normal !important;
      }

      .skin-foundry-green :is(.f3-row-icon,.f3-relationship i) {
        color: var(--fg-ink) !important;
      }

      .skin-foundry-green .f3-summary.tone-positive strong,
      .skin-foundry-green:not(.mode-leased) .f3-status-main :is(b,strong) {
        color: #0b6a3b !important;
      }

      .skin-foundry-green .f3-summary.tone-negative strong { color: #8c3429 !important; }
      .skin-foundry-green.mode-leased .f3-status-main :is(b,strong),
      .skin-foundry-green.mode-leased :is(.f3-contact,.f3-lease-ytd) h4,
      .skin-foundry-green.mode-leased .f3-summary.tone-lease strong { color: #654a1f !important; }

      .skin-foundry-green :is(.gov-commands,.ops-commands,.f3-commands) {
        border-color: #756331 !important;
        background-color: #10271c !important;
        background-image:
          linear-gradient(180deg, rgba(239,236,208,.12), transparent 38%),
          url("/ixi/skins/foundry-green-guilloche.svg"),
          linear-gradient(180deg, #234432, #091a11) !important;
        background-blend-mode: screen, soft-light, normal !important;
        box-shadow: inset 0 1px 0 rgba(239,236,208,.13), inset 0 -1px 0 rgba(0,0,0,.82) !important;
      }

      .skin-foundry-green :is(.gov-commands,.ops-commands,.f3-commands) button {
        border-color: rgba(211,179,99,.19) !important;
        background: linear-gradient(180deg, rgba(239,236,208,.045), rgba(0,0,0,.18)) !important;
        color: var(--fg-muted) !important;
        text-shadow: 0 1px 0 #000 !important;
      }

      .skin-foundry-green :is(.gov-commands,.ops-commands,.f3-commands) button:hover {
        border-color: var(--fg-bronze-hot) !important;
        color: var(--fg-text) !important;
        box-shadow: inset 0 0 10px rgba(211,179,99,.10) !important;
      }

      .skin-foundry-green :is(input,select,textarea) {
        border-color: #536c58 !important;
        background: linear-gradient(180deg, #07140c, #13271c) !important;
        color: var(--fg-text) !important;
        box-shadow: inset 0 2px 5px rgba(0,0,0,.78) !important;
      }

      .skin-foundry-green :is(input,select,textarea):focus { border-color: var(--fg-bronze-hot) !important; }

      .skin-foundry-green :is(.gov-media,.gov-thumbs) {
        border-color: #55705b !important;
        background-color: #061009 !important;
        background-image:
          linear-gradient(180deg, rgba(3,13,7,.64), rgba(2,8,5,.86)),
          url("/ixi/skins/foundry-green-medallion.webp"),
          url("/ixi/skins/foundry-green-guilloche.svg") !important;
        background-position: center, center, center !important;
        background-repeat: no-repeat, no-repeat, repeat !important;
        background-size: cover, 150px 150px, 240px 120px !important;
        background-blend-mode: normal, soft-light, soft-light !important;
        box-shadow: inset 0 0 17px rgba(0,0,0,.82), inset 0 1px 0 rgba(239,236,208,.08) !important;
      }

      .skin-foundry-green .gov-media img { filter: saturate(.80) sepia(.08) hue-rotate(82deg) contrast(1.07) brightness(.93); }

      .skin-foundry-green .ixi-aos-card-header-controls {
        border-color: #766536 !important;
        background-image:
          linear-gradient(180deg, rgba(239,236,208,.13), transparent 42%),
          linear-gradient(180deg, #2c4938, #0c2016) !important;
        box-shadow: inset 0 1px 0 rgba(239,236,208,.16), 0 3px 9px rgba(0,0,0,.55) !important;
      }

      .skin-foundry-green .ixi-aos-card-header-controls .header-action {
        border-left-color: rgba(211,179,99,.15) !important;
        color: var(--fg-muted) !important;
      }

      .skin-foundry-green .ixi-aos-card-header-controls :is(.header-action.add,.header-action.transact),
      .skin-foundry-green .ixi-aos-card-header-controls .header-action:hover {
        color: var(--fg-bronze-hot) !important;
        background-color: rgba(211,179,99,.07) !important;
      }

      .skin-foundry-green .ixi-aos-card-header-controls .header-menu {
        border-color: #766536 !important;
        background-image:
          url("/ixi/skins/foundry-green-guilloche.svg"),
          linear-gradient(180deg, #183426, #07130c) !important;
        box-shadow: inset 0 1px 0 rgba(239,236,208,.10), 0 18px 38px rgba(0,0,0,.82) !important;
      }

      .skin-foundry-green .ixi-aos-card-header-controls .header-menu button:hover,
      .skin-foundry-green .ixi-aos-card-header-controls .header-menu button.active {
        border-color: rgba(211,179,99,.58) !important;
        background: rgba(211,179,99,.10) !important;
        color: var(--fg-bronze-hot) !important;
      }

      .skin-foundry-green .board-command-rail {
        border-top-color: #8d773a !important;
        background-color: #091a11 !important;
        background-image:
          linear-gradient(180deg, rgba(239,236,208,.13), transparent 42%),
          url("/ixi/skins/foundry-green-guilloche.svg"),
          linear-gradient(90deg, #102a1d, #07150d 48%, #173124) !important;
        background-blend-mode: screen, soft-light, normal !important;
        box-shadow: inset 0 1px 0 rgba(239,236,208,.14), inset 0 -1px 0 rgba(0,0,0,.84), 0 -2px 9px rgba(0,0,0,.58) !important;
      }

      .skin-foundry-green .board-command-rail .rail-zone {
        border-right-color: rgba(211,179,99,.11) !important;
        background-image: linear-gradient(180deg, rgba(239,236,208,.035), rgba(0,0,0,.23)) !important;
      }

      .skin-foundry-green .board-command-rail .rail-zone:hover {
        background-image: linear-gradient(180deg, rgba(211,179,99,.14), rgba(0,0,0,.16)) !important;
        box-shadow: inset 0 0 8px rgba(211,179,99,.09) !important;
      }

      .skin-foundry-green .board-command-rail .rail-zone::after {
        background: #87917a !important;
        box-shadow: inset 0 1px 0 rgba(248,245,219,.30), 0 0 6px rgba(136,199,174,.14) !important;
      }

      .skin-foundry-green .board-command-rail .rail-send::after,
      .skin-foundry-green .board-command-rail .destination-armed::after {
        background: var(--fg-bronze-hot) !important;
        box-shadow: 0 0 9px rgba(211,179,99,.40) !important;
      }

      .aos-generic-console-slot:has(.skin-foundry-green) > .ixi-object-card-actuator {
        border-color: rgba(211,179,99,.34) !important;
        background-color: #1c392a !important;
        background-image: linear-gradient(90deg, rgba(239,236,208,.17), transparent 38%, rgba(0,0,0,.44)) !important;
        box-shadow: inset 1px 0 0 rgba(239,236,208,.17), inset -1px 0 0 rgba(0,0,0,.74), 0 1px 4px rgba(0,0,0,.62) !important;
      }

      .aos-generic-console-slot:has(.skin-foundry-green) > .ixi-object-card-actuator:hover {
        background-color: var(--fg-bronze) !important;
        box-shadow: 0 0 8px rgba(211,179,99,.34) !important;
      }

      .aos-card001-v12-identity-shell.skin-foundry-green .ixi-v12-customer-identity-label { color: var(--fg-muted) !important; }
      .aos-card001-v12-identity-shell.skin-foundry-green .aos-card001-ixi-identity {
        background: rgba(6,16,9,.84) !important;
        box-shadow: 0 0 5px 4px rgba(6,16,9,.84) !important;
        color: var(--fg-bronze-hot) !important;
        text-shadow: 0 1px 0 #000 !important;
      }
      .aos-card001-v12-identity-shell.skin-foundry-green .ixi-v12-customer-identity-value {
        color: var(--fg-text) !important;
        text-shadow: 0 1px 1px rgba(0,0,0,.94);
      }
    `}</style>
  );
}
