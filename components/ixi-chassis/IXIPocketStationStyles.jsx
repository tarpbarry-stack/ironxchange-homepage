export default function IXIPocketStationStyles() {
  return (
    <style jsx global>{`
      /*
       * IXI POCKET STATION / COMMAND CHASSIS
       *
       * Shared workspace presentation.
       * This must not live in pages/aos/work.js.
       */

      .ixi-command-chassis {
        --station-w: 150px;
        --station-h: 102px;
        --control-half: 320px;
        --station-gap: clamp(24px, 2.1vw, 40px);

        width: 100%;
        margin: -14px auto 20px;

        position: relative;
        display: block;
      }

      .ixi-command-center {
        position: relative;
        z-index: 5;

        width: min(100%, 680px);
        min-width: 0;

        margin: 0 auto;

        display: flex;
        justify-content: center;
      }

      .ixi-command-left,
      .ixi-command-right {
        position: absolute;
        top: 56px;

        width: calc(
          (var(--station-w) * 2) +
          var(--station-gap)
        );

        height: var(--station-h);

        pointer-events: none;
        z-index: 3;
      }

      .ixi-command-left {
        right: calc(
          50% +
          var(--control-half) +
          var(--station-gap)
        );

        left: auto;
      }

      .ixi-command-right {
        left: calc(
          50% +
          var(--control-half) +
          var(--station-gap)
        );

        right: auto;
      }

      .ixi-pocket-row {
        width: 100%;
        height: var(--station-h);

        margin: 0;

        display: grid;
        grid-template-columns:
          var(--station-w)
          var(--station-w);

        gap: var(--station-gap);

        position: relative;
        z-index: 2;

        pointer-events: none;
      }

      .ixi-pocket-left,
      .ixi-pocket-right {
        width: var(--station-w);
        max-width: var(--station-w);
        height: var(--station-h);

        margin: 0;
        padding: 8px;

        position: relative;
        top: auto;

        cursor: default !important;

        border:
          1px solid
          rgba(255,255,255,.055);

        border-radius:
          16px 10px 16px 10px;

        background:
          linear-gradient(
            180deg,
            rgba(255,255,255,.024),
            rgba(255,255,255,0)
          ),
          radial-gradient(
            circle at top left,
            rgba(255,196,0,.035),
            transparent 60%
          ),
          rgba(7,7,7,.76);

        box-shadow:
          inset 0 1px 0
            rgba(255,255,255,.028),
          0 8px 18px
            rgba(0,0,0,.20);

        overflow: visible;

        pointer-events: auto;
        z-index: 8;
      }

      .ixi-pocket-left::before,
      .ixi-pocket-right::before {
        content: "";

        position: absolute;
        left: 9px;
        right: 9px;
        top: 8px;

        height: 1px;

        background:
          rgba(255,196,0,.16);

        pointer-events: none;
      }

      /*
       * Wide order:
       *
       * III | I | SEARCH | II | IV
       */

      .ixi-pocket-l2 {
        grid-column: 1;
        grid-row: 1;
      }

      .ixi-command-left
      .ixi-pocket-left:not(
        .ixi-pocket-l2
      ) {
        grid-column: 2;
        grid-row: 1;
      }

      .ixi-command-right
      .ixi-pocket-right:not(
        .ixi-pocket-r2
      ) {
        grid-column: 1;
        grid-row: 1;
      }

      .ixi-pocket-r2 {
        grid-column: 2;
        grid-row: 1;
      }

      /*
       * DESTINATION STATES
       */

      .ixi-pocket-left.occupied,
      .ixi-pocket-right.occupied {
        border-color:
          rgba(255,196,0,.24);

        box-shadow:
          inset 0 1px 0
            rgba(255,255,255,.028),
          0 8px 18px
            rgba(0,0,0,.20),
          0 0 12px
            rgba(255,196,0,.08);
      }

      .ixi-pocket-left.destination-armed,
      .ixi-pocket-right.destination-armed {
        border-color:
          rgba(0,194,255,.72);

        box-shadow:
          inset 0 1px 0
            rgba(255,255,255,.04),
          0 8px 18px
            rgba(0,0,0,.20),
          0 0 18px
            rgba(0,194,255,.22);
      }

      .ixi-pocket-left.destination-armed::before,
      .ixi-pocket-right.destination-armed::before {
        background:
          rgba(0,194,255,.82);
      }

      .ixi-pocket-left
      .ixi-pocket-topline span,
      .ixi-pocket-right
      .ixi-pocket-topline span {
        color:
          rgba(255,255,255,.18);

        text-shadow: none;
      }

      .ixi-pocket-left
      .ixi-pocket-loop-square,
      .ixi-pocket-right
      .ixi-pocket-loop-square {
        border-color:
          rgba(255,255,255,.18);

        background:
          rgba(255,255,255,.10);

        box-shadow: none;
      }

      .ixi-pocket-left.occupied
      .ixi-pocket-topline span,
      .ixi-pocket-right.occupied
      .ixi-pocket-topline span {
        color:
          rgba(255,196,0,.86);

        text-shadow:
          0 0 8px
            rgba(255,196,0,.18),
          0 0 14px
            rgba(255,196,0,.08);
      }

      .ixi-pocket-left.occupied
      .ixi-pocket-loop-square,
      .ixi-pocket-right.occupied
      .ixi-pocket-loop-square {
        border-color:
          rgba(255,196,0,.42);

        background:
          rgba(255,196,0,.34);

        box-shadow:
          0 0 8px
            rgba(255,196,0,.16);
      }

      .ixi-pocket-left.destination-armed
      .ixi-pocket-topline span,
      .ixi-pocket-right.destination-armed
      .ixi-pocket-topline span {
        color:
          rgba(0,194,255,.92);

        text-shadow:
          0 0 8px
            rgba(0,194,255,.26),
          0 0 16px
            rgba(0,194,255,.12);
      }

      .ixi-pocket-left.destination-armed
      .ixi-pocket-loop-square,
      .ixi-pocket-right.destination-armed
      .ixi-pocket-loop-square {
        border-color:
          rgba(0,194,255,.72);

        background:
          rgba(0,194,255,.76);

        box-shadow:
          0 0 8px
            rgba(0,194,255,.28),
          0 0 16px
            rgba(0,194,255,.12);
      }

      .ixi-pocket-left.destination-armed
      .ixi-pocket-rail-action,
      .ixi-pocket-right.destination-armed
      .ixi-pocket-rail-action {
        background:
          rgba(0,194,255,.38)
          !important;

        box-shadow:
          0 0 6px
            rgba(0,194,255,.18),
          0 0 12px
            rgba(0,194,255,.08);
      }

      .ixi-pocket-left.destination-armed
      .ixi-pocket-action-rail,
      .ixi-pocket-right.destination-armed
      .ixi-pocket-action-rail {
        filter:
          drop-shadow(
            0 0 6px
            rgba(0,194,255,.22)
          );
      }

      /*
       * TABLET STACKED MODE
       */

      @media
      (max-width: 1250px)
      and
      (min-width: 851px) {
        .ixi-command-chassis {
          --control-half: 210px;
          --station-gap: 20px;
        }

        .ixi-command-left,
        .ixi-command-right {
          top: -5px;

          width: var(--station-w);

          height: calc(
            (var(--station-h) * 2) +
            34px
          );
        }

        .ixi-command-left {
          right: calc(
            50% +
            var(--control-half) +
            20px
          );
        }

        .ixi-command-right {
          left: calc(
            50% +
            var(--control-half) +
            20px
          );
        }

        .ixi-pocket-row {
          grid-template-columns:
            var(--station-w);

          grid-template-rows:
            var(--station-h)
            var(--station-h);

          gap: 20px;
        }

        .ixi-command-left
        .ixi-pocket-left:not(
          .ixi-pocket-l2
        ) {
          grid-column: 1;
          grid-row: 1;
        }

        .ixi-command-right
        .ixi-pocket-right:not(
          .ixi-pocket-r2
        ) {
          grid-column: 1;
          grid-row: 1;
        }

        .ixi-pocket-l2 {
          grid-column: 1;
          grid-row: 2;
        }

        .ixi-pocket-r2 {
          grid-column: 1;
          grid-row: 2;
        }
      }

      /*
       * MOBILE
       */

      @media (max-width: 850px) {
        .ixi-command-left,
        .ixi-command-right,
        .ixi-pocket-row,
        .ixi-pocket-left,
        .ixi-pocket-right {
          display: none !important;
        }
      }

      /*
       * CATCH ZONES
       */

      .ixi-pocket-catch-pad {
        position: absolute;

        pointer-events: none;
        z-index: 1;
      }

      .ixi-pocket-catch-pad.catch-l1 {
        left: 0;
        right: auto;
        top: 92px;

        width: 360px;
        height: 140px;

        pointer-events: auto;

        background:
          rgba(255,0,0,.35)
          !important;

        outline:
          2px solid red
          !important;
      }

      .ixi-pocket-catch-pad.catch-r1 {
        right: 20px;
        left: auto;
        top: 92px;

        width: 340px;
        height: 140px;

        pointer-events: auto;

        background:
          rgba(0,255,0,.35)
          !important;

        outline:
          2px solid lime
          !important;
      }

      .ixi-pocket-l2
      .ixi-pocket-catch-pad.out-left {
        position: fixed;

        left: 0;
        right: auto;
        top: 405px;

        width: 150px;

        height:
          calc(100vh - 405px);

        pointer-events: auto;

        z-index: 999;

        background:
          rgba(0,100,255,.35)
          !important;

        outline:
          2px solid blue
          !important;
      }

      .ixi-pocket-r2
      .ixi-pocket-catch-pad.out-right {
        position: fixed;

        right: 0;
        left: auto;
        top: 420px;

        width: 150px;

        height:
          calc(100vh - 420px);

        pointer-events: auto;

        z-index: 999;

        background:
          rgba(255,0,255,.35)
          !important;

        outline:
          2px solid magenta
          !important;
      }

      /*
       * THUMB SIZES
       */

      .ixi-pocket-thumbs.thumb-size-small {
        --pocket-thumb-w: 72px;
        --pocket-thumb-h: 48px;
        --pocket-thumbs-top: 30px;
      }

      .ixi-pocket-thumbs.thumb-size-medium {
        --pocket-thumb-w: 90px;
        --pocket-thumb-h: 60px;
        --pocket-thumbs-top: 30px;
      }

      .ixi-pocket-thumbs.thumb-size-large {
        --pocket-thumb-w: 108px;
        --pocket-thumb-h: 72px;
        --pocket-thumbs-top: 23px;
      }

      .ixi-pocket-right
      .ixi-pocket-thumbs {
        left: 50%;
        right: auto;
      }

      .ixi-pocket-right
      .ixi-pocket-thumbs.r1-thumbs {
        left: 50%;
        right: auto;

        transform:
          translateX(-50%);
      }

      /*
       * POCKET THUMB
       */

      .ixi-pocket-thumb {
        width:
          var(
            --pocket-thumb-w,
            90px
          )
          !important;

        height:
          var(
            --pocket-thumb-h,
            60px
          )
          !important;

        position:
          absolute !important;

        left:
          50% !important;

        right:
          auto !important;

        top:
          auto !important;

        bottom:
          0 !important;

        transform:
          translateX(-50%)
          !important;

        overflow:
          hidden !important;

        border:
          1px solid
          rgba(255,255,255,.12);

        border-radius:
          7px 7px 0 0;

        background:
          linear-gradient(
            180deg,
            rgba(255,255,255,.055),
            rgba(255,255,255,0)
            34%
          ),
          linear-gradient(
            135deg,
            rgba(255,255,255,.018),
            transparent 45%
          ),
          rgba(18,18,18,.94);

        box-shadow:
          inset 0 1px 0
            rgba(255,255,255,.04),
          0 8px 16px
            rgba(0,0,0,.30);

        z-index: 34;
      }

      .ixi-pocket-thumbs {
        position: absolute;

        left: 50%;

        top:
          var(
            --pocket-thumbs-top,
            30px
          );

        width:
          calc(100% - 14px);

        height:
          var(
            --pocket-thumb-h,
            60px
          );

        transform:
          translateX(-50%);

        overflow: visible;

        border:
          1px dashed
          rgba(255,255,255,.08);

        border-radius:
          11px 7px 11px 7px;

        background:
          linear-gradient(
            180deg,
            rgba(255,255,255,.018),
            rgba(255,255,255,0)
            20%
          ),
          linear-gradient(
            0deg,
            rgba(255,255,255,.02),
            transparent 30%
          ),
          rgba(10,10,10,.44);

        pointer-events: auto;
        z-index: 30;
      }

      .ixi-pocket-thumb::before {
        content: "";

        position: absolute;

        left: 0;
        right: 0;
        top: 0;

        height: 1px;

        background:
          rgba(255,255,255,.12);

        z-index: 2;

        pointer-events: none;
      }

      .ixi-pocket-thumb img {
        width: 100%;
        height: 100%;

        object-fit: cover;
        display: block;
      }

      .ixi-pocket-thumb span {
        display: block;

        padding: 5px;

        color:
          rgba(255,255,255,.62);

        font-size: 7px;
        font-weight: 900;
        line-height: 1.1;
      }

      .ixi-pocket-left.pocket-mode-closed
      .ixi-pocket-thumbs,
      .ixi-pocket-right.pocket-mode-closed
      .ixi-pocket-thumbs {
        opacity: .28;
      }

      .ixi-pocket-left.pocket-mode-peek
      .ixi-pocket-thumbs,
      .ixi-pocket-right.pocket-mode-peek
      .ixi-pocket-thumbs,
      .ixi-pocket-left.pocket-mode-open
      .ixi-pocket-thumbs,
      .ixi-pocket-right.pocket-mode-open
      .ixi-pocket-thumbs {
        opacity: 1;
      }

      .ixi-pocket-left.occupied
      .ixi-pocket-thumb,
      .ixi-pocket-right.occupied
      .ixi-pocket-thumb {
        border-color:
          rgba(255,196,0,.22);

        box-shadow:
          inset 0 1px 0
            rgba(255,255,255,.045),
          0 8px 16px
            rgba(0,0,0,.30),
          0 0 12px
            rgba(255,196,0,.055);
      }

      /*
       * POCKET INNER SHELL
       */

      .ixi-pocket-left::after,
      .ixi-pocket-right::after {
        content: "3";

        position: absolute;

        left: 7px;
        right: 7px;
        top: 25px;
        bottom: 7px;

        border:
          1px dashed
          rgba(255,255,255,.08);

        border-radius:
          11px 7px 11px 7px;

        background:
          linear-gradient(
            180deg,
            rgba(255,255,255,.018),
            rgba(255,255,255,0)
            20%
          ),
          rgba(10,10,10,.38);

        color:
          rgba(255,255,255,.22);

        font-size: 5.8px;
        font-weight: 950;
        letter-spacing: .55px;

        display: flex;
        align-items: flex-end;
        justify-content: flex-start;

        padding:
          0 0 6px 8px;

        pointer-events: none;

        z-index: 12;
      }

      .ixi-pocket-topline {
        position: absolute;

        left: 9px;
        top: 10px;

        display: flex;
        align-items: center;
        gap: 5px;

        pointer-events: none;
      }

      .ixi-pocket-topline span {
        color:
          rgba(255,196,0,.86);

        font-size: 7.5px;
        font-weight: 950;

        letter-spacing: .72px;

        text-transform: uppercase;
      }

      .ixi-pocket-topline strong {
        color:
          rgba(255,255,255,.12);

        font-size: 5px;
        font-weight: 950;

        letter-spacing: .58px;

        text-transform: uppercase;
      }

      /*
       * POCKET ACTION RAIL
       */

      .ixi-pocket-action-rail {
        position: absolute;

        top: 13px;
        right: 9px;

        width: 82px;
        height: 4px;

        display: flex;
        align-items: center;
        justify-content:
          space-between;

        background: transparent;

        z-index: 80;
        pointer-events: auto;
      }

      .ixi-pocket-action-rail.left,
      .ixi-pocket-action-rail.right {
        right: 9px;
        left: auto;
      }

      .ixi-pocket-rail-action {
        position: relative;

        width: 15px;
        height: 4px;

        border: 0;
        border-radius: 2px;

        background:
          rgba(255,255,255,.12);

        padding: 0;

        cursor: pointer;
      }

      .ixi-pocket-action-rail.is-empty {
        background: transparent;
      }

      .ixi-pocket-action-rail.is-empty
      .ixi-pocket-rail-action {
        opacity: .28;

        pointer-events: auto;
      }

      .ixi-pocket-action-rail.has-machines
      .ixi-pocket-rail-action {
        opacity: .48;

        pointer-events: auto;

        background:
          rgba(255,196,0,.20);
      }

      .ixi-pocket-action-rail.has-machines
      .ixi-pocket-rail-action:hover,
      .ixi-pocket-rail-action:hover {
        background:
          rgba(255,196,0,.86)
          !important;

        box-shadow:
          0 0 8px
          rgba(255,196,0,.22);
      }

      .ixi-pocket-rail-action:hover::after {
        content:
          attr(data-label);

        position: absolute;

        bottom: 12px;
        left: 50%;

        transform:
          translateX(-50%);

        white-space: nowrap;

        color:
          rgba(255,255,255,.72);

        font-size: 6.5px;
        font-weight: 950;

        letter-spacing: .55px;

        text-transform: uppercase;

        pointer-events: none;
      }

      /*
       * DIRECT POCKET BUTTON
       */

      .ixi-pocket-direct-button {
        position: absolute;

        left: 50%;
        bottom: -1px;

        width: 34px;
        height: 5px;

        transform:
          translateX(-50%);

        border: 0;

        border-radius:
          3px 3px 1px 1px;

        background:
          rgba(255,255,255,.18);

        padding: 0;

        cursor: pointer;

        z-index: 120;

        pointer-events: auto;

        box-shadow:
          inset 0 1px 0
            rgba(255,255,255,.12),
          0 1px 3px
            rgba(0,0,0,.32);
      }

      .ixi-pocket-direct-button.left,
      .ixi-pocket-direct-button.right {
        left: 50%;
        right: auto;
        bottom: -1px;

        transform:
          translateX(-50%);
      }

      .ixi-pocket-direct-button:hover,
      .ixi-pocket-direct-button.is-live {
        background:
          rgba(255,196,0,.95);

        box-shadow:
          0 0 8px
          rgba(255,196,0,.38);
      }

      .ixi-pocket-direct-button.has-load {
        background:
          rgba(255,196,0,.34);
      }

      /*
       * LOOP ACTUATOR
       */

      .ixi-pocket-loop-square {
        position: absolute;

        width: 4px;
        height: 14px;

        border:
          1px solid
          rgba(255,255,255,.22);

        border-radius: 1px;

        background:
          rgba(255,255,255,.12);

        padding: 0;

        cursor: pointer;

        z-index: 99999;

        pointer-events: auto;

        opacity: 0;
      }

      .ixi-pocket-loop-square.is-visible {
        opacity: 1;
      }

      .ixi-pocket-loop-square.left {
        top: 68px;
        right: -2px;
      }

      .ixi-pocket-loop-square.right {
        top: 68px;
        left: -2px;
      }

      .ixi-pocket-loop-square:hover {
        border-color:
          rgba(255,196,0,.62);

        background:
          rgba(255,196,0,.72);
      }
    `}</style>
  );
}
