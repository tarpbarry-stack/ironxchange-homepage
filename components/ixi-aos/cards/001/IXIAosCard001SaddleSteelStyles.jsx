/*
 * Card 001 — SADDLE STEEL
 * Appearance only. No geometry, layout, scale, data, or behavior rules belong here.
 */
export default function IXIAosCard001SaddleSteelStyles() {
  return (
    <style jsx global>{`
      .skin-saddle-steel {
        --ss-forge: #0a0a09;
        --ss-steel: #171714;
        --ss-steel-raised: #25231e;
        --ss-leather: #321b12;
        --ss-leather-light: #583321;
        --ss-leather-dark: #180d09;
        --ss-brass: #a87838;
        --ss-brass-hot: #ddb56d;
        --ss-brass-worn: #6f512b;
        --ss-ivory: #eee2c8;
        --ss-muted: #b7aa91;
        --ss-faint: #817766;
        --ss-teal: #75b8af;
        --ss-positive: #98c39b;
        --ss-negative: #d67a6e;
        --ss-line: #58483a;
        --ss-soft: #352d26;
        --y: var(--ss-brass-hot) !important;
        --line: var(--ss-line) !important;
        --soft: var(--ss-soft) !important;
        --surface: var(--ss-steel) !important;
        --surface2: var(--ss-forge) !important;
        --panel: var(--ss-steel) !important;
        --text: var(--ss-ivory) !important;
        --muted: var(--ss-muted) !important;
      }

      .ixi-generic-overview.skin-saddle-steel,
      .ixi-aos-location-f2.skin-saddle-steel,
      .ixi-location-f3-v12.skin-saddle-steel,
      .ixi-generic-face-v12.skin-saddle-steel {
        border-color: #7a664b !important;
        background-color: var(--ss-forge) !important;
        background-image:
          radial-gradient(circle at 16% -5%, rgba(255,235,194,.16), transparent 28%),
          linear-gradient(115deg, transparent 0 36%, rgba(255,220,164,.035) 46%, transparent 57%),
          linear-gradient(180deg, rgba(50,46,38,.94), rgba(14,14,12,.98) 23%, rgba(7,7,6,.99)),
          url("/ixi/skins/saddle-steel-grain.svg") !important;
        color: var(--ss-ivory) !important;
        box-shadow:
          inset 0 1px 0 rgba(255,232,190,.28),
          inset 1px 0 0 rgba(255,214,145,.07),
          inset -1px 0 0 rgba(0,0,0,.78),
          inset 0 -1px 0 rgba(0,0,0,.94),
          0 18px 42px rgba(0,0,0,.76) !important;
      }

      .skin-saddle-steel :is(.gov-head,.ops-header,.f3-head,.gfv12-head) {
        border-bottom-color: #86623c !important;
        background:
          linear-gradient(105deg, rgba(255,224,171,.10), transparent 23%, rgba(0,0,0,.20) 62%),
          linear-gradient(180deg, rgba(91,52,33,.98), rgba(48,25,17,.99) 55%, rgba(25,13,9,.99)),
          url("/ixi/skins/saddle-steel-grain.svg") !important;
        box-shadow:
          inset 0 1px 0 rgba(255,224,171,.22),
          inset 0 -1px 0 rgba(0,0,0,.86),
          0 3px 8px rgba(0,0,0,.52) !important;
      }

      .skin-saddle-steel :is(.gov-identity,.ops-identity,.f3-identity,.gfv12-ident) > span,
      .skin-saddle-steel :is(.gov-relations,.ops-section,.f3-section,.gfv12-section) > h3,
      .skin-saddle-steel .gfv12-banner b {
        color: var(--ss-brass-hot) !important;
        text-shadow: 0 1px 0 rgba(0,0,0,.85), 0 0 7px rgba(168,120,56,.17);
      }

      .skin-saddle-steel :is(.gov-identity,.ops-identity,.f3-identity,.gfv12-ident) > strong,
      .skin-saddle-steel :is(.gov-descriptor,.gov-preview,.gov-metric,.gate-code,.ops-section,.f3-section,.f3-contact,.f3-value-card,.f3-lease-ytd,.f3-summary,.gfv12-banner,.gfv12-section) strong {
        color: var(--ss-ivory) !important;
        text-shadow: 0 1px 0 #000;
      }

      .skin-saddle-steel .f3-summary.tone-positive strong,
      .skin-saddle-steel:not(.mode-leased) .f3-status-main :is(b,strong) {
        color: var(--ss-positive) !important;
      }

      .skin-saddle-steel .f3-summary.tone-negative strong {
        color: var(--ss-negative) !important;
      }

      .skin-saddle-steel.mode-leased .f3-status-main :is(b,strong),
      .skin-saddle-steel.mode-leased :is(.f3-contact,.f3-lease-ytd) h4,
      .skin-saddle-steel.mode-leased .f3-summary.tone-lease strong {
        color: #c5ad87 !important;
      }

      .skin-saddle-steel :is(.gov-descriptor,.gov-preview,.gov-metric,.gov-relations,.gate-code,.ops-section,.f3-section,.f3-contact,.f3-value-card,.f3-lease-ytd,.f3-summary,.gfv12-banner,.gfv12-section) {
        border-color: #554637 !important;
        background:
          linear-gradient(145deg, rgba(255,232,190,.045), transparent 37%),
          linear-gradient(180deg, rgba(35,33,28,.99), rgba(13,13,11,.995)),
          url("/ixi/skins/saddle-steel-grain.svg") !important;
        box-shadow:
          inset 0 1px 0 rgba(255,225,174,.075),
          inset 0 -1px 0 rgba(0,0,0,.72),
          0 1px 2px rgba(0,0,0,.42) !important;
      }

      .skin-saddle-steel :is(.gov-relations,.ops-section,.f3-section,.gfv12-section) > h3 {
        border-bottom-color: #594630 !important;
        background:
          linear-gradient(90deg, rgba(168,120,56,.13), transparent 56%),
          linear-gradient(180deg, #30291f, #171511) !important;
        box-shadow: inset 0 1px 0 rgba(255,226,178,.055) !important;
      }

      .skin-saddle-steel :is(.gov-descriptor small,.gov-preview span,.gov-metric span,.gov-relation-scroll small,.gov-relation-scroll em,.ops-label,.rel-label,.f3-row-label,.f3-contact span,.f3-contact small,.f3-summary span,.gfv12-value small,.gfv12-value em,.gfv12-relations small,.gfv12-relations em) {
        color: var(--ss-muted) !important;
      }

      .skin-saddle-steel :is(.gov-preview button,.gov-mark,.ops-icon,.gate-mark,.instruction-icon,.f3-row-icon,.f3-relationship i,.gfv12-relations button > b) {
        color: var(--ss-teal) !important;
        text-shadow: 0 0 6px rgba(117,184,175,.20);
      }

      .skin-saddle-steel :is(.gov-relation-scroll button,.ops-row,.ops-relationship,.f3-row,.f3-relationship,.gfv12-value,.gfv12-relations button) {
        border-color: var(--ss-soft) !important;
        background-color: transparent !important;
      }

      .skin-saddle-steel :is(.gov-relation-scroll button,.ops-relationship,.f3-relationship,.gfv12-relations button):hover {
        border-color: var(--ss-brass-worn) !important;
        background-color: rgba(117,184,175,.045) !important;
      }

      .skin-saddle-steel :is(.gov-commands,.ops-commands,.f3-commands) {
        border-color: #735439 !important;
        background:
          linear-gradient(180deg, rgba(255,224,171,.075), transparent 34%),
          linear-gradient(180deg, rgba(77,44,29,.99), rgba(31,17,12,.99)),
          url("/ixi/skins/saddle-steel-grain.svg") !important;
        box-shadow: inset 0 1px 0 rgba(255,226,180,.12), inset 0 -1px 0 rgba(0,0,0,.80) !important;
      }

      .skin-saddle-steel :is(.gov-commands,.ops-commands,.f3-commands) button {
        border-color: rgba(168,120,56,.24) !important;
        background: linear-gradient(180deg, rgba(255,232,193,.035), rgba(0,0,0,.16)) !important;
        color: var(--ss-muted) !important;
        text-shadow: 0 1px 0 #000;
      }

      .skin-saddle-steel :is(.gov-commands,.ops-commands,.f3-commands) button:hover {
        border-color: var(--ss-brass-hot) !important;
        color: var(--ss-ivory) !important;
        box-shadow: inset 0 0 10px rgba(221,181,109,.08) !important;
      }

      .skin-saddle-steel :is(input,select,textarea) {
        border-color: #62503d !important;
        background: linear-gradient(180deg, #090806, #18140f) !important;
        color: var(--ss-ivory) !important;
        box-shadow: inset 0 2px 5px rgba(0,0,0,.82), 0 1px 0 rgba(255,226,180,.045) !important;
      }

      .skin-saddle-steel :is(input,select,textarea):focus {
        border-color: var(--ss-brass-hot) !important;
        box-shadow: 0 0 0 1px rgba(221,181,109,.12), inset 0 2px 5px rgba(0,0,0,.82) !important;
      }

      .skin-saddle-steel :is(.gov-media,.gov-thumbs) {
        border-color: #6b5741 !important;
        background-color: #080705 !important;
        box-shadow: inset 0 0 16px rgba(0,0,0,.76), 0 1px 0 rgba(255,226,180,.06) !important;
      }

      .skin-saddle-steel .gov-media img {
        filter: saturate(.86) sepia(.07) contrast(1.07) brightness(.94);
      }

      .skin-saddle-steel .ixi-aos-card-header-controls {
        border-color: #7a6042 !important;
        background:
          linear-gradient(180deg, rgba(255,226,180,.12), transparent 42%),
          linear-gradient(180deg, #3a3329, #17130f) !important;
        box-shadow: inset 0 1px 0 rgba(255,232,196,.15), 0 3px 9px rgba(0,0,0,.55) !important;
      }

      .skin-saddle-steel .ixi-aos-card-header-controls .header-action {
        border-left-color: rgba(221,181,109,.13) !important;
        color: var(--ss-muted) !important;
      }

      .skin-saddle-steel .ixi-aos-card-header-controls :is(.header-action.add,.header-action.transact),
      .skin-saddle-steel .ixi-aos-card-header-controls .header-action:hover {
        color: var(--ss-brass-hot) !important;
        background-color: rgba(221,181,109,.055) !important;
      }

      .skin-saddle-steel .ixi-aos-card-header-controls .header-menu {
        border-color: #725b40 !important;
        background:
          linear-gradient(145deg, rgba(255,231,191,.055), transparent 34%),
          linear-gradient(180deg, #211c15, #0d0b09) !important;
        box-shadow: inset 0 1px 0 rgba(255,231,191,.09), 0 16px 34px rgba(0,0,0,.78) !important;
      }

      .skin-saddle-steel .ixi-aos-card-header-controls .header-menu button:hover,
      .skin-saddle-steel .ixi-aos-card-header-controls .header-menu button.active {
        border-color: rgba(221,181,109,.55) !important;
        background: rgba(168,120,56,.10) !important;
        color: var(--ss-brass-hot) !important;
      }

      .skin-saddle-steel .board-command-rail {
        border-top-color: #9a7448 !important;
        background:
          linear-gradient(180deg, rgba(255,226,179,.11), transparent 40%),
          linear-gradient(90deg, rgba(117,184,175,.07), transparent 24%, transparent 74%, rgba(221,181,109,.08)),
          linear-gradient(180deg, #3e2418, #1b0f0a),
          url("/ixi/skins/saddle-steel-grain.svg") !important;
        box-shadow:
          inset 0 1px 0 rgba(255,229,186,.15),
          inset 0 -1px 0 rgba(0,0,0,.80),
          0 -2px 9px rgba(0,0,0,.58) !important;
      }

      .skin-saddle-steel .board-command-rail .rail-zone {
        border-right-color: rgba(221,181,109,.10) !important;
      }

      .skin-saddle-steel .board-command-rail .rail-zone::after {
        background: #85745b !important;
        box-shadow: inset 0 1px 0 rgba(255,235,203,.25), 0 0 5px rgba(117,184,175,.10) !important;
      }

      .skin-saddle-steel .board-command-rail .rail-send::after,
      .skin-saddle-steel .board-command-rail .destination-armed::after {
        background: var(--ss-brass-hot) !important;
        box-shadow: 0 0 8px rgba(221,181,109,.36) !important;
      }

      .aos-card001-v12-identity-shell.skin-saddle-steel .aos-card001-ixi-identity,
      .aos-card001-v12-identity-shell.skin-saddle-steel .ixi-v12-customer-identity-label {
        color: var(--ss-muted) !important;
      }

      .aos-card001-v12-identity-shell.skin-saddle-steel .ixi-v12-customer-identity-value {
        color: var(--ss-ivory) !important;
        text-shadow: 0 1px 0 rgba(0,0,0,.88);
      }
    `}</style>
  );
}
