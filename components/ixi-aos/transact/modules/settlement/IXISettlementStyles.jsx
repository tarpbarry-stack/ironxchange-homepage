export default function IXISettlementStyles() {
  return (
    <style jsx global>{`
      .ixi-stl,
      .ixi-stl * {
        box-sizing: border-box;
      }
      .ixi-stl {
        width: 100%;
        min-height: 100%;
        color: #f3f4ef;
        font-family: Arial, sans-serif;
      }
      .stl-top {
        display: grid;
        grid-template-columns: 30px minmax(0, 1fr) auto;
        align-items: center;
        gap: 7px;
        padding: 8px 10px;
        border-bottom: 1px solid #303030;
      }
      .stl-back {
        border: 0;
        background: transparent;
        color: #ffc400;
        font-size: 24px;
        line-height: 1;
        cursor: pointer;
      }
      .stl-k {
        color: #999;
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 1.2px;
      }
      .stl-title {
        margin-top: 2px;
        font-size: 15px;
        line-height: 1;
        font-weight: 950;
      }
      .stl-id {
        color: #888;
        margin-top: 2px;
        font-size: 6px;
        font-weight: 900;
      }
      .stl-head-actions {
        display: flex;
        align-items: flex-end;
        flex-direction: column;
        gap: 3px;
      }
      .stl-head-actions > i {
        padding: 5px 7px;
        background: #ffc400;
        color: #080808;
        font-size: 8px;
        font-style: normal;
        font-weight: 950;
      }
      .stl-lang {
        display: flex;
        gap: 2px;
      }
      .stl-lang button {
        border: 0;
        background: transparent;
        color: #777;
        font-size: 6px;
        font-weight: 950;
        padding: 2px 3px;
      }
      .stl-lang button.on {
        color: #ffc400;
      }
      .stl-card-record {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 5px 10px;
        border-block: 1px solid #242424;
        background: #111;
      }
      .stl-card-record span {
        min-width: 0;
        overflow: hidden;
        color: #999;
        font-size: 9px;
        letter-spacing: 1.2px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .stl-card-record strong {
        flex: none;
        color: #ffc400;
        font-size: 15px;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .stl-context {
        margin: 7px 0;
        padding: 7px 8px;
        border-left: 2px solid #ffc400;
        background: linear-gradient(
          90deg,
          rgba(255, 196, 0, 0.07),
          transparent
        );
      }
      .stl-context strong,
      .stl-context small {
        display: block;
      }
      .stl-context strong {
        font-size: 11px;
        line-height: 1.2;
        overflow-wrap: anywhere;
      }
      .stl-context small {
        margin-top: 2px;
        color: #aaa;
        font-size: 7px;
        font-weight: 850;
      }
      .stl-section {
        margin: 9px 0 4px;
        padding-bottom: 2px;
        border-bottom: 1px solid rgba(255, 196, 0, 0.22);
        color: #ffc400;
        font-size: 7.5px;
        font-weight: 950;
        letter-spacing: 0.12em;
      }
      .stl-money {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 8px;
        padding: 5px 6px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }
      .stl-money span {
        color: #aaa;
        min-width: 0;
        font-size: 6.5px;
        font-weight: 900;
      }
      .stl-money b {
        flex: none;
        font-size: 8px;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .stl-money.big b {
        color: #ffc400;
        font-size: 15px;
      }
      .stl-row {
        min-width: 0;
        margin: 5px 0;
        padding: 7px;
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.018);
      }
      .stl-rowhead {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: start;
        gap: 5px;
      }
      .stl-rowhead > strong {
        min-width: 0;
        line-height: 1.25;
        overflow-wrap: anywhere;
      }
      .stl-rowhead > b {
        text-align: right;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .stl-row strong,
      .stl-row b {
        font-size: 8px;
      }
      .stl-row small {
        display: block;
        margin-top: 2px;
        color: #999;
        font-size: 6.5px;
        font-weight: 800;
        line-height: 1.35;
        overflow-wrap: anywhere;
      }
      .stl-ledger-head {
        grid-template-columns: minmax(0, 1fr);
        gap: 3px;
      }
      .stl-ledger-head > b {
        justify-self: end;
        font-size: 9px;
      }
      .stl-ledger-meta {
        display: flex !important;
        flex-wrap: wrap;
        gap: 2px 4px;
      }
      .stl-ledger-meta span {
        white-space: nowrap;
      }
      .stl-row.muted {
        opacity: 0.55;
      }
      .stl-field {
        margin: 5px 0;
      }
      .stl-field label {
        display: block;
        margin-bottom: 2px;
        color: #aaa;
        min-height: 9px;
        font-size: 6.5px;
        line-height: 1.25;
        font-weight: 950;
      }
      .stl-field input,
      .stl-field select,
      .stl-field textarea {
        width: 100%;
        min-width: 0;
        min-height: 30px;
        border: 1px solid rgba(255, 255, 255, 0.11);
        border-radius: 4px;
        background: #0d100f;
        color: #f3f4ef;
        padding: 6px 7px;
        font:
          800 9px Arial,
          Arial,
          sans-serif;
        outline: none;
      }
      .stl-field textarea {
        min-height: 48px;
        resize: vertical;
      }
      .stl-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 5px;
      }
      .stl-primary,
      .stl-secondary,
      .stl-danger {
        width: 100%;
        min-height: 36px;
        margin-top: 7px;
        border-radius: 4px;
        font-size: 8.5px;
        font-weight: 950;
      }
      .stl-primary {
        border: 1px solid #ffc400;
        background: linear-gradient(180deg, #ffc400, #d7a500);
        color: #090a09;
      }
      .stl-primary:disabled {
        opacity: 0.45;
      }
      .stl-secondary {
        border: 1px solid rgba(255, 255, 255, 0.18);
        background: #0a0c0b;
        color: #eee;
      }
      .stl-danger {
        border: 1px solid rgba(255, 76, 76, 0.4);
        background: rgba(255, 30, 30, 0.04);
        color: #ff8585;
      }
      .stl-small {
        min-height: 31px;
      }
      .stl-check {
        display: flex;
        align-items: center;
        gap: 5px;
        color: #ddd;
        font-size: 7px;
      }
      .stl-check input {
        width: 13px;
        height: 13px;
      }
      .stl-help {
        padding: 7px;
        color: #bbb;
        font-size: 7px;
        line-height: 1.4;
      }
      .stl-status {
        margin: 7px 0;
        padding: 8px;
        border: 1px solid rgba(255, 196, 0, 0.25);
        border-radius: 5px;
        background: #0b0d0c;
      }
      .stl-status strong {
        font-size: 11px;
        color: #ffc400;
      }
      .stl-status.ok strong {
        color: #24d26d;
      }
      .stl-blockers {
        margin: 6px 0;
        padding: 7px;
        border: 1px solid rgba(255, 76, 76, 0.32);
        border-radius: 4px;
        color: #ff8585;
        font-size: 7px;
        font-weight: 900;
        line-height: 1.4;
      }
      .stl-money.warn,
      .stl-money.warn b {
        color: #ffc400;
      }
      .stl-money.bad,
      .stl-money.bad b {
        color: #ff7373;
      }
      .stl-foot {
        margin: 7px 2px;
        color: #777;
        font-size: 6px;
        font-weight: 800;
        text-align: center;
        line-height: 1.3;
      }
      @media (max-width: 560px) {
        .stl-grid {
          grid-template-columns: 1fr;
        }
        .stl-title {
          font-size: 15px;
        }
      }
      .stl-upload {
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }
      .stl-upload input {
        display: none;
      }
    `}</style>
  );
}
