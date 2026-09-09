export default function IXIChassis({ children }) {
  return (
    <section className="ixi-command-chassis">
      {children}

      <style jsx global>{`
        /* The chassis owns station placement; pages only consume it. */
        .ixi-command-chassis {
          --station-w: 150px;
          --station-h: 102px;
          --control-half: 320px;
          --station-gap: clamp(24px, 2.1vw, 40px);

          width: 100%;

          /* The former invalid unitless value computed to zero. Keep that position. */
          margin: 0 auto;

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
          width: calc((var(--station-w) * 2) + var(--station-gap));
          height: var(--station-h);
          pointer-events: none;
          z-index: 3;
        }

        .ixi-command-left {
          right: calc(50% + var(--control-half) + var(--station-gap));
          left: auto;
        }

        .ixi-command-right {
          left: calc(50% + var(--control-half) + var(--station-gap));
          right: auto;
        }

        .ixi-pocket-row {
          width: 100%;
          height: var(--station-h);
          margin: 0;
          display: grid;
          grid-template-columns: var(--station-w) var(--station-w);
          gap: var(--station-gap);
          position: relative;
          z-index: 2;
          pointer-events: none;
        }

        .ixi-pocket-l2 {
          grid-column: 1;
          grid-row: 1;
        }

        .ixi-command-left .ixi-pocket-left:not(.ixi-pocket-l2) {
          grid-column: 2;
          grid-row: 1;
        }

        .ixi-command-right .ixi-pocket-right:not(.ixi-pocket-r2) {
          grid-column: 1;
          grid-row: 1;
        }

        .ixi-pocket-r2 {
          grid-column: 2;
          grid-row: 1;
        }

        /* Preserve wide mode at launch widths without page-level overflow. */
        @media (min-width: 1255px) and (max-width: 1371px) {
          .ixi-command-chassis {
            --station-gap: calc((100vw - 1255px) / 4);
          }
        }

        @media (max-width: 1254px) and (min-width: 851px) {
          .ixi-command-chassis {
            --control-half: 210px;
            --station-gap: 20px;
          }

          .ixi-command-left,
          .ixi-command-right {
            top: -5px;
            width: var(--station-w);
            height: calc((var(--station-h) * 2) + 34px);
          }

          .ixi-command-left {
            right: calc(50% + var(--control-half) + 20px);
          }

          .ixi-command-right {
            left: calc(50% + var(--control-half) + 20px);
          }

          .ixi-pocket-row {
            grid-template-columns: var(--station-w);
            grid-template-rows: var(--station-h) var(--station-h);
            gap: 20px;
          }

          .ixi-command-left .ixi-pocket-left:not(.ixi-pocket-l2),
          .ixi-command-right .ixi-pocket-right:not(.ixi-pocket-r2) {
            grid-column: 1;
            grid-row: 1;
          }

          .ixi-pocket-l2,
          .ixi-pocket-r2 {
            grid-column: 1;
            grid-row: 2;
          }
        }

        /* Keep the four-pixel marks, with 24px pointer/focus targets. */
        .ixi-command-chassis .ixi-pocket-action-rail.left,
        .ixi-command-chassis .ixi-pocket-action-rail.right {
          right: 2px;
          left: auto;
          width: 96px;
          height: 4px;
          display: grid;
          grid-template-columns: repeat(4, 24px);
          gap: 0;
          overflow: visible;
        }

        .ixi-command-chassis .ixi-pocket-action-rail .ixi-pocket-rail-action {
          position: relative;
          top: -10px;
          width: 24px;
          height: 24px;
          border: 0;
          padding: 0;
          background: transparent !important;
          box-shadow: none !important;
          opacity: 1 !important;
          cursor: pointer;
        }

        .ixi-pocket-action-rail .ixi-pocket-rail-action::before {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          width: 15px;
          height: 4px;
          transform:
            translate(-50%, -50%)
            translateX(var(--ixi-pocket-mark-shift, 0));
          border-radius: 2px;
          background: rgba(255,255,255,.12);
        }

        .ixi-pocket-action-rail .ixi-pocket-rail-action:nth-child(1) {
          --ixi-pocket-mark-shift: 2.5px;
        }

        .ixi-pocket-action-rail .ixi-pocket-rail-action:nth-child(2) {
          --ixi-pocket-mark-shift: .83px;
        }

        .ixi-pocket-action-rail .ixi-pocket-rail-action:nth-child(3) {
          --ixi-pocket-mark-shift: -.83px;
        }

        .ixi-pocket-action-rail .ixi-pocket-rail-action:nth-child(4) {
          --ixi-pocket-mark-shift: -2.5px;
        }

        .ixi-pocket-action-rail.is-empty .ixi-pocket-rail-action::before {
          opacity: .28;
        }

        .ixi-pocket-action-rail.has-machines .ixi-pocket-rail-action::before {
          opacity: .48;
          background: rgba(255,196,0,.20);
        }

        .ixi-pocket-action-rail.has-machines.pocket-mode-peek
        .ixi-pocket-rail-action::before,
        .ixi-pocket-action-rail.has-machines.pocket-mode-open
        .ixi-pocket-rail-action::before {
          opacity: 1;
          background: rgba(255,255,255,.14);
        }

        .ixi-pocket-left.destination-armed .ixi-pocket-rail-action::before,
        .ixi-pocket-right.destination-armed .ixi-pocket-rail-action::before {
          background: rgba(0,194,255,.38);
          box-shadow:
            0 0 6px rgba(0,194,255,.18),
            0 0 12px rgba(0,194,255,.08);
        }

        .ixi-pocket-action-rail .ixi-pocket-rail-action:hover::before {
          background: rgba(255,196,0,.86);
          box-shadow: 0 0 8px rgba(255,196,0,.22);
        }

        .ixi-pocket-action-rail .ixi-pocket-rail-action::after {
          bottom: 22px;
        }

        .ixi-pocket-action-rail .ixi-pocket-rail-action:focus-visible {
          outline: 1px solid rgba(0,194,255,.92);
          outline-offset: -1px;
        }

        /* Keep both 24px targets distinct while retaining the compact stack. */
        .active-stack-zone {
          gap: 16px;
          margin-bottom: 22px;
        }

        .active-stack-dash {
          position: relative;
          width: 34px;
          height: 24px;
          margin: -8px 0;
          border: 0;
          background: transparent;
          box-shadow: none;
        }

        .active-stack-dash::before {
          content: "";
          position: absolute;
          left: 0;
          top: 13px;
          width: 34px;
          height: 3px;
          background: rgba(255,255,255,.14);
        }

        .active-stack-dash:hover::before {
          background: rgba(255,196,0,.48);
          box-shadow: 0 3px 8px rgba(255,196,0,.12);
        }

        .active-stack.open .active-stack-dash::before {
          background: rgba(255,196,0,.58);
          box-shadow: 0 3px 10px rgba(255,196,0,.14);
        }

        .active-stack.has-machines .active-stack-dash::before {
          background: rgba(255,196,0,.78);
          box-shadow: 0 3px 12px rgba(255,196,0,.24);
        }

        .active-stack.has-machines .active-stack-dash::after {
          top: 16px;
        }

        .active-stack:nth-child(2) .active-stack-dash::before {
          top: 11px;
        }

        .active-stack:nth-child(2).has-machines .active-stack-dash::after {
          top: 14px;
        }

        .active-stack-dash:focus-visible {
          outline: 1px solid rgba(0,194,255,.92);
          outline-offset: -1px;
        }

        @media (max-width: 850px) {
          .ixi-command-chassis {
            display: block;
            max-width: 100%;
            margin: 0 auto 18px;
          }

          .ixi-command-center {
            width: 100%;
            max-width: 100%;
          }

          .ixi-command-left,
          .ixi-command-right,
          .ixi-pocket-row,
          .ixi-pocket-left,
          .ixi-pocket-right,
          .active-stack-zone {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}
