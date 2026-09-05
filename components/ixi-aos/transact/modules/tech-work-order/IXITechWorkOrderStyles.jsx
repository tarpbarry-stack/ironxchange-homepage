export default function IXITechWorkOrderStyles() {
  return (
    <style jsx global>{`
      .techwo-v13 {
        color: #eef0ee;
      }

      .techwo-v13 .techwo-titlemark {
        display: block;
        margin-bottom: 2px;
        color: #ffc400;
        font-size: 6px;
        font-weight: 950;
        letter-spacing: .075em;
      }

      .techwo-v13 .techwo-domain-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 4px;
        margin-bottom: 7px;
      }

      .techwo-v13 .techwo-domain-grid button {
        min-height: 38px;
        padding: 5px 6px;
        border: 1px solid rgba(255,255,255,.09);
        border-radius: 5px;
        background: linear-gradient(#151817,#0d100e);
        color: rgba(255,255,255,.68);
        font-family: inherit;
        font-size: 5.8px;
        font-weight: 900;
        text-align: left;
        cursor: pointer;
      }

      .techwo-v13 .techwo-domain-grid button.sel {
        border-color: rgba(255,196,0,.48);
        background: rgba(255,196,0,.055);
        color: #ffc400;
      }

      .techwo-v13 .techwo-tech-fields {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px;
        margin-bottom: 7px;
      }

      .techwo-v13 .techwo-tech-fields input,
      .techwo-v13 .techwo-tech-fields select {
        width: 100%;
        height: 29px;
        min-width: 0;
        padding: 0 7px;
        border: 1px solid rgba(255,255,255,.09);
        border-radius: 4px;
        background: #090b0a;
        color: #f1f3f1;
        font-family: inherit;
        font-size: 6.3px;
        font-weight: 800;
        outline: none;
      }

      .techwo-v13 .techwo-tech-fields input:focus,
      .techwo-v13 .techwo-tech-fields select:focus {
        border-color: rgba(255,196,0,.48);
      }

      .techwo-v13 .techwo-date-input {
        width: 100%;
        height: 32px;
        min-width: 0;
        margin-bottom: 7px;
        padding: 0 8px;
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 4px;
        background: #090b0a;
        color: #f1f3f1;
        font: 800 7px Arial;
        color-scheme: dark;
      }

      /* LIVE TECHWO WORK SURFACE --------------------------------------- */

      .techwo-v13.wo-work {
        position: relative;
        min-height: 100%;
        padding: 0 2px 14px;
      }

      /* Keep identity visible even when CREATE was pressed from a scrolled
         creation form. The outer TRAN$ACT viewport owns scrolling. */
      .techwo-v13.wo-work .wo-work-identity {
        position: sticky;
        top: 0;
        z-index: 12;
        min-height: 61px;
        margin: 0;
        padding: 5px 2px 7px;
        background: linear-gradient(180deg,#0c0f0d 0%,#0a0c0b 90%,rgba(10,12,11,.96) 100%);
        border-bottom: 1px solid #2d302e;
        box-shadow: 0 5px 10px rgba(0,0,0,.18);
      }

      .techwo-v13 .wo-number-row {
        min-height: 19px;
      }

      .techwo-v13 .wo-number-row strong {
        max-width: 126px;
        overflow: hidden;
        color: #f4f5f4;
        font-size: 15px;
        line-height: 1;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .techwo-v13 .wo-number-row span {
        flex: none;
        padding: 3px 5px;
        border: 1px solid #5e4b00;
        border-radius: 3px;
        background: #1c1805;
        color: #ffc400;
        font-size: 5.5px;
        font-weight: 950;
      }

      .techwo-v13 .wo-work-copy h3 {
        margin: 4px 0 0;
        overflow: hidden;
        font-size: 9.5px;
        line-height: 1.05;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .techwo-v13 .wo-work-copy small {
        margin-top: 3px;
        overflow: hidden;
        color: #aeb4af;
        font-size: 6px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .techwo-v13 .wo-tabs {
        position: sticky;
        top: 61px;
        z-index: 11;
        height: 32px;
        background: #0a0c0b;
        border-bottom: 1px solid #313532;
      }

      .techwo-v13 .wo-scroll {
        min-height: 0;
        padding: 4px 0 2px;
      }

      .techwo-v13 .techwo-summary {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 4px;
        margin: 2px 0 8px;
      }

      .techwo-v13 .techwo-summary > div {
        min-width: 0;
        min-height: 39px;
        padding: 6px;
        border: 1px solid #303432;
        border-radius: 5px;
        background: linear-gradient(180deg,#121513,#0d100e);
      }

      .techwo-v13 .techwo-summary small {
        display: block;
        margin-bottom: 5px;
        overflow: hidden;
        color: #777d79;
        font-size: 4.8px;
        font-weight: 950;
        letter-spacing: .035em;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .techwo-v13 .techwo-summary strong {
        display: block;
        overflow: hidden;
        color: #e9ebe9;
        font-size: 6.4px;
        font-weight: 950;
        line-height: 1.15;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .techwo-v13 .wo-description {
        min-height: 48px;
        padding: 8px;
        border: 1px solid #303432;
        border-radius: 5px;
        background: #0d100e;
        color: #e7e9e7;
        font-size: 8px;
        font-weight: 700;
        line-height: 1.42;
      }

      .techwo-v13 .wo-status-row {
        min-height: 34px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 0 9px;
        border: 1px solid #303432;
        border-radius: 5px;
        background: linear-gradient(#121513,#0d100e);
      }

      .techwo-v13 .wo-status-row strong {
        color: #ffc400;
        font-size: 8px;
        font-weight: 950;
        letter-spacing: .025em;
      }

      .techwo-v13.wo-work.paused .wo-status-row strong {
        color: #e5c85d;
      }

      .techwo-v13 .wo-status-row span {
        overflow: hidden;
        color: #8f9590;
        font-size: 6px;
        font-weight: 800;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .techwo-v13 .wo-timer {
        min-height: 47px;
        margin-top: 8px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 8px 10px;
        border: 1px solid #343835;
        border-radius: 5px;
        background: linear-gradient(180deg,#111412,#0c0f0d);
      }

      .techwo-v13 .wo-timer > div {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .techwo-v13 .wo-timer > div > svg {
        flex: none;
        color: #ffc400;
      }

      .techwo-v13 .wo-timer > div span {
        min-width: 0;
      }

      .techwo-v13 .wo-timer small {
        display: block;
        color: #858b86;
        font-size: 5.2px;
        font-weight: 950;
      }

      .techwo-v13 .wo-timer strong {
        display: block;
        margin-top: 2px;
        color: #ffc400;
        font-size: 16px;
        font-weight: 950;
        line-height: 1;
        letter-spacing: .025em;
      }

      .techwo-v13 .wo-timer > b {
        flex: none;
        padding: 3px 6px;
        border: 1px solid #3a3f3b;
        border-radius: 3px;
        color: #aeb4af;
        font-size: 5.5px;
        font-weight: 950;
      }

      .techwo-v13.wo-work.paused .wo-timer strong,
      .techwo-v13.wo-work.paused .wo-timer > div > svg {
        color: #e1c45d;
      }

      .techwo-v13 .wo-action-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6px;
      }

      .techwo-v13 .wo-action-grid button {
        width: 100%;
        height: 42px;
        min-width: 0;
        padding: 0 7px;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 8px;
        border: 1px solid #343835;
        border-radius: 5px;
        background: linear-gradient(180deg,#151817,#0d100e);
        color: #e5e7e5;
        font-family: inherit;
        font-size: 7.2px;
        font-weight: 950;
        cursor: pointer;
        appearance: none;
      }

      .techwo-v13 .wo-action-grid button:hover {
        border-color: rgba(255,196,0,.28);
        background: linear-gradient(180deg,#181b19,#0f1210);
      }

      .techwo-v13 .wo-action-grid button svg {
        flex: none;
      }

      .techwo-v13 .wo-action-grid button span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .techwo-v13 .wo-action-grid button:nth-child(1) { color: #a9df25; }
      .techwo-v13 .wo-action-grid button:nth-child(2) { color: #54afff; }
      .techwo-v13 .wo-action-grid button:nth-child(3) { color: #cc83ff; }
      .techwo-v13 .wo-action-grid button:nth-child(4) { color: #ffc400; }
      .techwo-v13 .wo-action-grid button:nth-child(5) { color: #42d2ca; }
      .techwo-v13 .wo-action-grid button:nth-child(6) { color: #ffc400; }

      .techwo-v13 .wo-duo {
        margin-top: 7px;
      }

      .techwo-v13 .wo-duo button {
        appearance: none;
      }

      .techwo-v13 .wo-bottom-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
        margin-top: 8px;
      }

      .techwo-v13 .wo-bottom-actions button {
        width: 100%;
        min-width: 0;
        height: 39px;
        padding: 0 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        border: 1px solid #3b3f3c;
        border-radius: 5px;
        background: linear-gradient(#171a18,#0d0f0e);
        color: #e5e7e5;
        font-family: inherit;
        font-size: 7px;
        font-weight: 950;
        cursor: pointer;
        appearance: none;
      }

      .techwo-v13 .wo-bottom-actions button:last-child {
        border-color: #d5a600;
        background: linear-gradient(#ffd02b,#e7a900);
        color: #0b0c0b;
      }

      .techwo-v13.wo-work.paused .wo-bottom-actions button:first-child {
        border-color: #6b9f2c;
        background: #14200d;
        color: #a6df54;
      }

      .techwo-v13 .techwo-activity {
        margin-top: 3px;
        border: 1px solid #303432;
        border-radius: 5px;
        overflow: hidden;
        background: #0d100e;
      }

      .techwo-v13 .techwo-activity-row {
        min-height: 35px;
        padding: 6px 7px;
        display: grid;
        grid-template-columns: 8px minmax(0,1fr) auto;
        align-items: center;
        gap: 6px;
        border-bottom: 1px solid rgba(255,255,255,.05);
      }

      .techwo-v13 .techwo-activity-row:last-child {
        border-bottom: 0;
      }

      .techwo-v13 .techwo-activity-row > i {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #ffc400;
        box-shadow: 0 0 7px rgba(255,196,0,.22);
      }

      .techwo-v13 .techwo-activity-row strong {
        display: block;
        color: rgba(255,255,255,.82);
        font-size: 5.8px;
      }

      .techwo-v13 .techwo-activity-row small {
        display: block;
        margin-top: 2px;
        color: rgba(255,255,255,.40);
        font-size: 4.8px;
      }

      .techwo-v13 .techwo-activity-row time {
        max-width: 65px;
        color: rgba(255,255,255,.34);
        font-size: 4.7px;
        text-align: right;
      }

      .techwo-v13 .techwo-complete-panel {
        margin-top: 7px;
        padding: 7px;
        border: 1px solid rgba(80,190,65,.24);
        border-radius: 5px;
        background: rgba(80,190,65,.025);
      }

      .techwo-v13 .techwo-complete-panel textarea {
        width: 100%;
        min-height: 58px;
        margin-bottom: 6px;
        padding: 7px;
        resize: vertical;
        border: 1px solid rgba(255,255,255,.09);
        border-radius: 4px;
        background: #090b0a;
        color: #fff;
        font-family: inherit;
        font-size: 6.5px;
      }

      .techwo-v13 .techwo-complete-panel button,
      .techwo-v13 .techwo-reopen {
        width: 100%;
        height: 32px;
        border: 1px solid rgba(80,190,65,.42);
        border-radius: 4px;
        background: rgba(80,190,65,.035);
        color: #72d85a;
        font-family: inherit;
        font-size: 6px;
        font-weight: 950;
        cursor: pointer;
        appearance: none;
      }

      .techwo-v13 .techwo-reopen {
        margin-top: 8px;
      }
    `}</style>
  );
}
