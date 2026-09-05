export default function IXITransactStyles() {
  return (
    <style jsx global>{`
      .ixi-transact-dialog {
        position: relative;
        display: block;
        width: 298px;
        max-width: none;
        height: 471px;
        max-height: none;
        margin: 0;
        padding: 0;
        overflow: visible;
        border: 0;
        background: transparent;
        color: inherit;
      }

      .ixi-transact-dialog::backdrop {
        background: rgba(2, 4, 3, .86);
        backdrop-filter: blur(8px);
      }

      .ixi-transact-dialog.worksheet-open {
        position: fixed;
        inset: 16px;
        width: min(1180px, calc(100vw - 32px));
        height: min(820px, calc(100dvh - 32px));
        margin: auto;
        overflow: hidden;
        border: 1px solid #3b433f;
        border-radius: 2px;
        background: #090c0a;
        box-shadow: 0 32px 100px rgba(0,0,0,.72);
        z-index: 2147483000;
      }

      .ixi-transact-app,
      .ixi-transact-app * {
        box-sizing: border-box;
      }

      .ixi-transact-app {
        position: relative;
        width: 298px;
        height: 471px;
        overflow: hidden;
        border: 1px solid #303432;
        border-radius: 14px;
        background:
          radial-gradient(circle at 40% -8%, rgba(255,255,255,.045), transparent 30%),
          linear-gradient(#0c0e0d, #090b0a 55%, #0d100e);
        color: #f4f5f4;
        font-family: "Arial Narrow", Arial, sans-serif;
        box-shadow:
          0 20px 48px rgba(0,0,0,.58),
          inset 0 1px rgba(255,255,255,.035);
      }

      .worksheet-open .ixi-transact-app {
        width: 100%;
        height: 100%;
        border: 0;
        border-radius: 0;
        background: #090c0a;
        box-shadow: none;
      }

      .tx-header {
        position: absolute;
        inset: 0 0 auto;
        height: 48px;
        padding: 7px 9px;
        border-bottom: 1px solid #292d2a;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        z-index: 4;
        background: linear-gradient(#0f1110, #090b0a);
      }

      .module-open .tx-header {
        height: 31px;
        align-items: center;
        padding: 0 8px;
      }

      .tx-brand span {
        display: block;
        color: #ffc400;
        font-size: 7px;
        font-weight: 950;
        letter-spacing: .065em;
      }

      .home-open .tx-brand strong {
        display: block;
        margin-top: 3px;
        font-size: 15px;
        line-height: 1;
      }

      .tx-brand small {
        display: block;
        margin-top: 3px;
        color: #737975;
        font-size: 5.5px;
        font-weight: 900;
        text-transform: uppercase;
      }

      .tx-worksheet-title {
        display: block;
        margin-top: 3px;
        color: #f4f5f4;
        font-size: 12px;
        line-height: 1;
        letter-spacing: .04em;
      }

      .tx-close {
        width: 25px;
        height: 25px;
        padding: 0;
        border: 1px solid #353936;
        border-radius: 5px;
        background: linear-gradient(#111312, #080a09);
        color: #ffc400;
        font-size: 16px;
        font-weight: 950;
        line-height: 1;
        cursor: pointer;
      }

      .module-open .tx-close {
        width: 23px;
        height: 23px;
      }

      .tx-header-actions {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .tx-expand {
        height: 23px;
        padding: 0 7px;
        border: 1px solid #353936;
        border-radius: 5px;
        background: linear-gradient(#111312, #080a09);
        color: #ffc400;
        font-size: 7px;
        font-weight: 950;
        letter-spacing: .04em;
        cursor: pointer;
      }

      .tx-expand {
        width: 23px;
        padding: 0;
        font-size: 13px;
      }

      .tx-expand:hover,
      .tx-expand:focus-visible,
      .tx-close:hover,
      .tx-close:focus-visible {
        border-color: #ffc400;
        outline: none;
      }

      .tx-body {
        position: absolute;
        top: 48px;
        bottom: 19px;
        left: 0;
        right: 0;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 6px 6px 12px;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,.16) transparent;
      }

      .module-open .tx-body {
        top: 31px;
        left: -1px;
        right: -1px;
        min-width: 0;
        padding: 0 0 12px;
        overflow-x: hidden;
        overflow-y: auto;
      }

      .worksheet-open .module-open .tx-header {
        height: 44px;
        padding: 0 16px;
        background: linear-gradient(180deg, #151916, #0b0e0c);
      }

      .worksheet-open .module-open .tx-body {
        top: 44px;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 0;
        background: #090c0a;
      }

      .module-open .tx-body > * {
        width: 100% !important;
        min-width: 0 !important;
        max-width: 100% !important;
        box-sizing: border-box;
        contain: inline-size;
      }

      .worksheet-open .module-open .tx-body > * {
        width: 100% !important;
        height: 100% !important;
        min-height: 100% !important;
        max-height: none !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: #090c0a !important;
        box-shadow: none !important;
      }

      @media (max-width: 640px) {
        .ixi-transact-dialog.worksheet-open {
          inset: 0;
          width: 100vw;
          height: 100dvh;
          border: 0;
        }
      }

      .module-open .tx-body > * * {
        min-width: 0 !important;
        max-width: 100% !important;
        box-sizing: border-box;
      }

      .module-open .tx-body :where(div, section, article, header, footer, main, form, fieldset, label) {
        min-width: 0;
        max-width: 100%;
        box-sizing: border-box;
      }

      .module-open .tx-body :where(input, select, textarea, button, table) {
        min-width: 0;
        max-width: 100%;
        box-sizing: border-box;
      }

      .module-open .tx-body :where(p, span, strong, b, small, time, dd, dt, td, th) {
        min-width: 0;
        overflow-wrap: anywhere;
      }

      .tx-body::-webkit-scrollbar {
        width: 3px;
      }

      .tx-body::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,.16);
        border-radius: 5px;
      }

      .tx-label {
        margin: 2px 2px 5px;
        color: #8a908c;
        font-size: 6px;
        font-weight: 950;
      }

      .tx-grid {
        position: relative;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 5px;
        overflow: hidden;
        isolation: isolate;
      }

      .tx-app-tile {
        position: relative;
        height: 57px;
        overflow: hidden;
        border: 1px solid #303432;
        border-radius: 6px;
        background: linear-gradient(#151817, #0d100e);
        color: #eee;
        text-align: left;
        user-select: none;
        isolation: isolate;
        contain: layout paint;
        will-change: transform;
      }

      .tx-app-tile:hover {
        border-color: rgba(255,196,0,.42);
        background: linear-gradient(#171a18, #0e110f);
      }

      .tx-app-drag-surface {
        position: absolute;
        inset: 0;
        z-index: 1;
        width: 100%;
        height: 100%;
        padding: 0;
        border: 0;
        border-radius: inherit;
        background: transparent;
        color: inherit;
        cursor: grab;
        touch-action: manipulation;
      }

      .tx-app-drag-surface:active {
        cursor: grabbing;
      }

      .tx-app-drag-surface:focus-visible {
        outline: 2px solid #ffc400;
        outline-offset: -3px;
      }

      .tx-app-content {
        position: relative;
        z-index: 2;
        height: 100%;
        padding: 7px;
        pointer-events: none;
      }

      .tx-app-group {
        display: block;
        color: #747a76;
        font-size: 5px;
        font-weight: 950;
      }

      .tx-app-open {
        display: block;
        max-width: 100%;
        margin-top: 5px;
        padding: 0;
        overflow: hidden;
        border: 0;
        background: transparent;
        color: #eee;
        font: inherit;
        font-size: 8.5px;
        font-weight: 950;
        line-height: 1.1;
        text-align: left;
        text-overflow: ellipsis;
        white-space: nowrap;
        cursor: pointer;
        pointer-events: auto;
      }

      .tx-app-open:hover,
      .tx-app-open:focus-visible {
        color: #ffc400;
      }

      .tx-app-open:focus-visible {
        outline: 1px solid #ffc400;
        outline-offset: 2px;
      }

      .tx-app-document {
        display: block;
        margin-top: 3px;
        color: #ffc400;
        font-size: 5px;
      }

      .tx-app-tile-dragging {
        z-index: 20;
        opacity: 1;
        border-color: rgba(255,196,0,.72);
        box-shadow:
          0 14px 30px rgba(0,0,0,.68),
          0 0 0 1px rgba(255,196,0,.2);
        cursor: grabbing;
      }

      .tx-app-tile-dragging .tx-app-drag-surface {
        cursor: grabbing;
      }

      .tx-open-work {
        position: relative;
        width: 100%;
        min-height: 66px;
        margin-bottom: 7px;
        padding: 8px 72px 8px 8px;
        border: 1px solid rgba(255,196,0,.28);
        border-radius: 6px;
        background: rgba(255,196,0,.04);
        color: #fff;
        text-align: left;
        cursor: pointer;
      }

      .tx-open-work span {
        display: block;
        color: #ffc400;
        font-size: 5.5px;
      }

      .tx-open-work strong {
        display: block;
        margin-top: 4px;
        font-size: 10.5px;
      }

      .tx-open-work small {
        display: block;
        margin-top: 3px;
        overflow: hidden;
        color: #999;
        font-size: 5.5px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .tx-open-work b {
        position: absolute;
        right: 9px;
        top: 50%;
        transform: translateY(-50%);
        color: #ffc400;
        font-size: 7px;
      }

      .tx-back {
        height: 24px;
        padding: 0 7px;
        border: 1px solid #333;
        border-radius: 4px;
        background: #0a0b0b;
        color: #ffc400;
        font-size: 6px;
        font-weight: 950;
        cursor: pointer;
      }

      .tx-module-title,
      .tx-module-placeholder {
        margin-top: 6px;
        padding: 8px;
        border: 1px solid #303432;
        border-radius: 6px;
        background: #101211;
      }

      .tx-module-title span {
        display: block;
        color: #777;
        font-size: 5px;
        font-weight: 950;
      }

      .tx-module-title strong,
      .tx-module-placeholder > b {
        display: block;
        margin-top: 3px;
        color: #ffc400;
        font-size: 13px;
      }

      .tx-module-placeholder {
        min-height: 130px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
      }

      .tx-module-placeholder span {
        display: block;
        margin-top: 8px;
        color: #8a908c;
        font-size: 6px;
        font-weight: 950;
      }

      .tx-module-placeholder small {
        display: block;
        margin-top: 5px;
        color: #646a66;
        font-size: 5.5px;
      }
    `}</style>
  );
}
