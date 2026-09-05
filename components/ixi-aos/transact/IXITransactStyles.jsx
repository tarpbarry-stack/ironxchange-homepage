export default function IXITransactStyles() {
  return (
    <style jsx global>{`
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
        padding: 5px 7px 12px;
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
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 5px;
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
        will-change: transform;
      }

      .tx-app-tile:hover,
      .tx-app-tile.tx-app-tile-overlay {
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
        opacity: 0;
      }

      .tx-app-tile-overlay {
        box-shadow:
          0 16px 34px rgba(0,0,0,.62),
          0 0 0 1px rgba(255,196,0,.16);
        cursor: grabbing;
        transform: scale(1.025);
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
