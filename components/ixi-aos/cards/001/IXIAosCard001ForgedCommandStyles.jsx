/*
 * Card 001 — FORGED COMMAND
 * Body-first physical skin authored on the canonical 300 × 475 chassis.
 * The native card edge, actuators and IXI rail remain the structural authority.
 * Work and Focus are inherited from the sitewide scale engine.
 */
export default function IXIAosCard001ForgedCommandStyles() {
  return (
    <style jsx global>{`
      .skin-forged-command {
        --fc-black: #080807;
        --fc-steel: #181917;
        --fc-steel-high: #343530;
        --fc-leather: #24150f;
        --fc-leather-high: #4a2c1d;
        --fc-brass: #b38242;
        --fc-brass-hot: #e1bd78;
        --fc-ivory: #f0e5ce;
        --fc-muted: #b8ad98;
        --fc-faint: #7f786b;
        --fc-teal: #75b7ae;
        --fc-positive: #9bc69e;
        --fc-negative: #db7c70;
        --fc-line: #5a4c3b;
        --fc-soft: #37332c;
        --y: var(--fc-brass-hot) !important;
        --line: var(--fc-line) !important;
        --soft: var(--fc-soft) !important;
        --surface: var(--fc-steel) !important;
        --surface2: var(--fc-black) !important;
        --panel: var(--fc-steel) !important;
        --text: var(--fc-ivory) !important;
        --muted: var(--fc-muted) !important;
      }

      .ixi-generic-overview.skin-forged-command,
      .ixi-aos-location-f2.skin-forged-command,
      .ixi-location-f3-v12.skin-forged-command,
      .ixi-generic-face-v12.skin-forged-command {
        border-color: #78684f !important;
        background-color: var(--fc-black) !important;
        background-image:
          radial-gradient(circle at 15% -5%, rgba(255,239,207,.22), transparent 28%),
          radial-gradient(circle at 88% 18%, rgba(117,183,174,.055), transparent 25%),
          repeating-linear-gradient(92deg, rgba(255,255,255,.012) 0 1px, transparent 1px 7px),
          linear-gradient(111deg, transparent 0 34%, rgba(255,255,255,.045) 45%, transparent 56%),
          linear-gradient(180deg, rgba(30,31,29,.26), rgba(5,5,4,.76)),
          url("/ixi/skins/forged-command-steel.webp") !important;
        background-position: center !important;
        background-size: cover !important;
        background-blend-mode: screen, screen, soft-light, soft-light, multiply, normal !important;
        background-clip: padding-box !important;
        color: var(--fc-ivory) !important;
        box-shadow:
          inset 0 0 0 1px rgba(8,6,4,.96),
          inset 0 0 0 2px rgba(225,189,120,.36),
          inset 0 0 0 4px rgba(13,14,12,.92),
          inset 0 0 14px rgba(0,0,0,.84),
          inset 0 1px 0 rgba(255,238,204,.32),
          0 1px 0 rgba(225,189,120,.20),
          0 20px 44px rgba(0,0,0,.78) !important;
      }

      .skin-forged-command :is(.gov-head,.ops-header,.f3-head,.gfv12-head) {
        border-bottom-color: #8f6a42 !important;
        background-color: var(--fc-leather) !important;
        background-image:
          linear-gradient(105deg, rgba(255,229,185,.20), transparent 22%, rgba(0,0,0,.20) 63%),
          linear-gradient(180deg, rgba(73,42,27,.14), rgba(16,8,5,.56)),
          url("/ixi/skins/forged-command-leather.webp") !important;
        background-position: center !important;
        background-size: cover !important;
        background-blend-mode: screen, multiply, normal !important;
        box-shadow:
          inset 0 1px 0 rgba(255,229,185,.23),
          inset 0 -1px 0 rgba(0,0,0,.90),
          0 3px 9px rgba(0,0,0,.58) !important;
      }

      .skin-forged-command :is(.gov-body,.ops-scroll,.f3-scroll,.gfv12-scroll) {
        background-color: rgba(7,7,6,.38) !important;
        background-image:
          radial-gradient(circle at 76% 8%, rgba(225,189,120,.055), transparent 29%),
          linear-gradient(118deg, rgba(255,255,255,.018), transparent 31%, rgba(0,0,0,.10)),
          url("/ixi/skins/forged-command-steel.webp") !important;
        background-position: center !important;
        background-size: cover !important;
        background-blend-mode: screen, soft-light, multiply !important;
      }

      .skin-forged-command :is(.gov-identity,.ops-identity,.f3-identity,.gfv12-ident) > span,
      .skin-forged-command :is(.gov-relations,.ops-section,.f3-section,.gfv12-section) > h3,
      .skin-forged-command .gfv12-banner b {
        color: var(--fc-brass-hot) !important;
        text-shadow: 0 1px 0 #000, 0 0 7px rgba(179,130,66,.20);
      }

      .skin-forged-command :is(.gov-identity,.ops-identity,.f3-identity,.gfv12-ident) > strong,
      .skin-forged-command :is(.gov-descriptor,.gov-preview,.gov-metric,.gate-code,.ops-section,.f3-section,.f3-contact,.f3-value-card,.f3-lease-ytd,.f3-summary,.gfv12-banner,.gfv12-section) strong {
        color: var(--fc-ivory) !important;
        text-shadow: 0 1px 1px #000;
      }

      .skin-forged-command .f3-summary.tone-positive strong,
      .skin-forged-command:not(.mode-leased) .f3-status-main :is(b,strong) {
        color: var(--fc-positive) !important;
      }

      .skin-forged-command .f3-summary.tone-negative strong {
        color: var(--fc-negative) !important;
      }

      .skin-forged-command.mode-leased .f3-status-main :is(b,strong),
      .skin-forged-command.mode-leased :is(.f3-contact,.f3-lease-ytd) h4,
      .skin-forged-command.mode-leased .f3-summary.tone-lease strong {
        color: #c7ae87 !important;
      }

      .skin-forged-command :is(.gov-descriptor,.gov-preview,.gov-metric,.gov-relations,.gate-code,.ops-section,.f3-section,.f3-contact,.f3-value-card,.f3-lease-ytd,.f3-summary,.gfv12-banner,.gfv12-section) {
        border-color: #554c3f !important;
        background-color: #151614 !important;
        background-image:
          linear-gradient(145deg, rgba(255,238,207,.075), transparent 38%),
          linear-gradient(180deg, rgba(27,28,26,.26), rgba(7,7,6,.64)),
          url("/ixi/skins/forged-command-steel.webp") !important;
        background-position: center !important;
        background-size: cover !important;
        background-blend-mode: screen, multiply, normal !important;
        box-shadow:
          inset 0 1px 0 rgba(255,231,189,.095),
          inset 1px 0 0 rgba(255,255,255,.025),
          inset 0 -1px 0 rgba(0,0,0,.78),
          0 2px 3px rgba(0,0,0,.52) !important;
      }

      .skin-forged-command :is(.gov-relations,.ops-section,.f3-section,.gfv12-section) > h3 {
        border-bottom-color: #655034 !important;
        background:
          linear-gradient(90deg, rgba(179,130,66,.15), transparent 56%),
          linear-gradient(180deg, rgba(48,45,37,.96), rgba(18,18,15,.98)) !important;
        box-shadow: inset 0 1px 0 rgba(255,230,189,.075) !important;
      }

      .skin-forged-command :is(.gov-descriptor small,.gov-preview span,.gov-metric span,.gov-relation-scroll small,.gov-relation-scroll em,.ops-label,.rel-label,.f3-row-label,.f3-contact span,.f3-contact small,.f3-summary span,.gfv12-value small,.gfv12-value em,.gfv12-relations small,.gfv12-relations em) {
        color: var(--fc-muted) !important;
        text-shadow: 0 1px 0 #000;
      }

      .skin-forged-command :is(.gov-preview button,.gov-mark,.ops-icon,.gate-mark,.instruction-icon,.f3-row-icon,.f3-relationship i,.gfv12-relations button > b) {
        color: var(--fc-teal) !important;
        text-shadow: 0 0 6px rgba(117,183,174,.26);
      }

      .skin-forged-command :is(.gov-relation-scroll button,.ops-row,.ops-relationship,.f3-row,.f3-relationship,.gfv12-value,.gfv12-relations button) {
        border-color: rgba(121,105,82,.34) !important;
        background-color: rgba(5,5,4,.16) !important;
        box-shadow: inset 0 1px 0 rgba(255,237,201,.025) !important;
      }

      .skin-forged-command :is(.gov-relation-scroll button,.ops-relationship,.f3-relationship,.gfv12-relations button):hover {
        border-color: rgba(225,189,120,.50) !important;
        background-color: rgba(117,183,174,.055) !important;
      }

      .skin-forged-command :is(.gov-commands,.ops-commands,.f3-commands) {
        border-color: #8e6842 !important;
        background-color: var(--fc-leather) !important;
        background-image:
          linear-gradient(180deg, rgba(255,230,190,.14), transparent 36%),
          linear-gradient(180deg, rgba(72,42,27,.12), rgba(15,8,5,.54)),
          url("/ixi/skins/forged-command-leather.webp") !important;
        background-position: center !important;
        background-size: cover !important;
        background-blend-mode: screen, multiply, normal !important;
        box-shadow: inset 0 1px 0 rgba(255,231,192,.15), inset 0 -1px 0 rgba(0,0,0,.88) !important;
      }

      .skin-forged-command :is(.gov-commands,.ops-commands,.f3-commands) button {
        border-color: rgba(225,189,120,.25) !important;
        background: linear-gradient(180deg, rgba(255,239,210,.055), rgba(0,0,0,.22)) !important;
        color: var(--fc-muted) !important;
        text-shadow: 0 1px 0 #000;
        box-shadow: inset 0 1px 0 rgba(255,234,195,.05) !important;
      }

      .skin-forged-command :is(.gov-commands,.ops-commands,.f3-commands) button:hover {
        border-color: var(--fc-brass-hot) !important;
        color: var(--fc-ivory) !important;
        box-shadow: inset 0 0 11px rgba(225,189,120,.10), 0 0 6px rgba(179,130,66,.10) !important;
      }

      .skin-forged-command :is(input,select,textarea) {
        border-color: #675842 !important;
        background: linear-gradient(180deg, rgba(4,4,3,.98), rgba(23,20,15,.98)) !important;
        color: var(--fc-ivory) !important;
        box-shadow: inset 0 2px 6px rgba(0,0,0,.88), 0 1px 0 rgba(255,230,189,.055) !important;
      }

      .skin-forged-command :is(input,select,textarea):focus {
        border-color: var(--fc-brass-hot) !important;
        box-shadow: 0 0 0 1px rgba(225,189,120,.15), inset 0 2px 6px rgba(0,0,0,.88) !important;
      }

      .skin-forged-command :is(.gov-media,.gov-thumbs) {
        border-color: #746146 !important;
        background-color: #060605 !important;
        background-image:
          linear-gradient(145deg, rgba(225,189,120,.07), transparent 24%),
          url("/ixi/skins/forged-command-steel.webp") !important;
        background-position: center !important;
        background-size: cover !important;
        background-blend-mode: screen, multiply !important;
        box-shadow: inset 0 0 18px rgba(0,0,0,.82), inset 0 1px 0 rgba(255,232,196,.11), 0 1px 0 rgba(255,232,196,.07) !important;
      }

      .skin-forged-command .gov-media img {
        filter: saturate(.88) sepia(.045) contrast(1.08) brightness(.94);
      }

      .skin-forged-command .ixi-collection-thumb-rail {
        border-color: #68563f !important;
        background-color: #0c0d0b !important;
        background-image:
          linear-gradient(180deg, rgba(255,235,201,.075), transparent 36%),
          url("/ixi/skins/forged-command-steel.webp") !important;
        background-position: center !important;
        background-size: cover !important;
        background-blend-mode: screen, multiply !important;
        box-shadow: inset 0 1px 0 rgba(255,235,201,.09), inset 0 -1px 0 rgba(0,0,0,.82) !important;
      }

      .skin-forged-command .ixi-collection-thumb {
        border-color: rgba(120,101,73,.50) !important;
        background: linear-gradient(160deg, rgba(255,235,201,.055), rgba(0,0,0,.35)) !important;
        box-shadow: inset 0 1px 0 rgba(255,237,207,.055), 0 2px 4px rgba(0,0,0,.58) !important;
      }

      .skin-forged-command .ixi-collection-thumb.active {
        border-color: var(--fc-brass-hot) !important;
        box-shadow: inset 0 0 12px rgba(225,189,120,.075), 0 0 7px rgba(225,189,120,.16) !important;
      }

      .skin-forged-command .ixi-aos-card-header-controls {
        border-color: #806744 !important;
        background-color: #1a1a17 !important;
        background-image:
          linear-gradient(180deg, rgba(255,235,201,.15), transparent 45%),
          url("/ixi/skins/forged-command-steel.webp") !important;
        background-position: center !important;
        background-size: cover !important;
        background-blend-mode: screen, normal !important;
        box-shadow: inset 0 1px 0 rgba(255,236,203,.16), 0 3px 10px rgba(0,0,0,.64) !important;
      }

      .skin-forged-command .ixi-aos-card-header-controls .header-action {
        border-left-color: rgba(225,189,120,.14) !important;
        color: var(--fc-muted) !important;
        text-shadow: 0 1px 0 #000;
      }

      .skin-forged-command .ixi-aos-card-header-controls :is(.header-action.add,.header-action.transact),
      .skin-forged-command .ixi-aos-card-header-controls .header-action:hover {
        color: var(--fc-brass-hot) !important;
        background-color: rgba(225,189,120,.065) !important;
      }

      .skin-forged-command .ixi-aos-card-header-controls .header-menu {
        border-color: #786142 !important;
        background-color: #11110f !important;
        background-image:
          linear-gradient(145deg, rgba(255,236,201,.075), transparent 34%),
          url("/ixi/skins/forged-command-steel.webp") !important;
        background-position: center !important;
        background-size: cover !important;
        background-blend-mode: screen, normal !important;
        box-shadow: inset 0 1px 0 rgba(255,236,201,.10), 0 18px 38px rgba(0,0,0,.84) !important;
      }

      .skin-forged-command .ixi-aos-card-header-controls .header-menu button:hover,
      .skin-forged-command .ixi-aos-card-header-controls .header-menu button.active {
        border-color: rgba(225,189,120,.58) !important;
        background: rgba(179,130,66,.12) !important;
        color: var(--fc-brass-hot) !important;
      }

      .skin-forged-command .board-command-rail {
        border-top-color: #a47b4d !important;
        background-color: var(--fc-leather) !important;
        background-image:
          linear-gradient(180deg, rgba(255,232,194,.17), transparent 38%),
          linear-gradient(90deg, rgba(117,183,174,.07), transparent 24%, transparent 74%, rgba(225,189,120,.10)),
          url("/ixi/skins/forged-command-leather.webp") !important;
        background-position: center !important;
        background-size: cover !important;
        background-blend-mode: screen, soft-light, normal !important;
        box-shadow:
          inset 0 1px 0 rgba(255,235,202,.17),
          inset 0 -1px 0 rgba(0,0,0,.88),
          0 -3px 10px rgba(0,0,0,.66) !important;
      }

      .skin-forged-command .board-command-rail .rail-zone {
        border-right-color: rgba(225,189,120,.13) !important;
        background-image: linear-gradient(180deg, rgba(255,237,207,.035), rgba(0,0,0,.24)) !important;
      }

      .skin-forged-command .board-command-rail .rail-zone:hover {
        background-image: linear-gradient(180deg, rgba(225,189,120,.13), rgba(0,0,0,.18)) !important;
        box-shadow: inset 0 0 8px rgba(225,189,120,.08) !important;
      }

      .skin-forged-command .board-command-rail .rail-zone::after {
        background: #917c5c !important;
        box-shadow: inset 0 1px 0 rgba(255,240,213,.30), 0 0 6px rgba(117,183,174,.13) !important;
      }

      .skin-forged-command .board-command-rail .rail-send::after,
      .skin-forged-command .board-command-rail .destination-armed::after {
        background: var(--fc-brass-hot) !important;
        box-shadow: 0 0 9px rgba(225,189,120,.42) !important;
      }

      .aos-generic-console-slot:has(.skin-forged-command) > .ixi-object-card-actuator {
        border-color: rgba(225,189,120,.34) !important;
        background-color: #282722 !important;
        background-image:
          linear-gradient(90deg, rgba(255,238,207,.18), transparent 38%, rgba(0,0,0,.42)),
          url("/ixi/skins/forged-command-steel.webp") !important;
        background-position: center !important;
        background-size: cover !important;
        box-shadow:
          inset 1px 0 0 rgba(255,234,195,.18),
          inset -1px 0 0 rgba(0,0,0,.74),
          0 1px 4px rgba(0,0,0,.62) !important;
      }

      .aos-generic-console-slot:has(.skin-forged-command) > .ixi-object-card-actuator:hover {
        background-color: var(--fc-brass) !important;
        box-shadow: 0 0 8px rgba(225,189,120,.34) !important;
      }

      .aos-card001-v12-identity-shell.skin-forged-command .aos-card001-ixi-identity,
      .aos-card001-v12-identity-shell.skin-forged-command .ixi-v12-customer-identity-label {
        color: var(--fc-muted) !important;
      }

      .aos-card001-v12-identity-shell.skin-forged-command .aos-card001-ixi-identity {
        background: rgba(7,7,6,.82) !important;
        box-shadow: 0 0 5px 4px rgba(7,7,6,.82) !important;
        color: var(--fc-brass-hot) !important;
        text-shadow: 0 1px 0 #000 !important;
      }

      .aos-card001-v12-identity-shell.skin-forged-command .ixi-v12-customer-identity-value {
        color: var(--fc-ivory) !important;
        text-shadow: 0 1px 1px rgba(0,0,0,.94);
      }
    `}</style>
  );
}
