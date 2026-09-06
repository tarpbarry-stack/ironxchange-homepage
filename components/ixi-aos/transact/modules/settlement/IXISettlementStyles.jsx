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
        font-family:
          Arial Narrow,
          Arial,
          sans-serif;
        font-size: 14px;
      }
      .stl-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 5px 2px 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      .stl-k {
        color: #ffc400;
        font-size: 11px;
        font-weight: 950;
        letter-spacing: 0.12em;
      }
      .stl-title {
        font-size: 26px;
        font-weight: 950;
      }
      .stl-id {
        color: #888;
        font-size: 11px;
        font-weight: 900;
      }
      .stl-lang button {
        border: 0;
        background: transparent;
        color: #777;
        font-size: 11px;
        font-weight: 950;
        padding: 10px;
      }
      .stl-lang button.on {
        color: #ffc400;
      }
      .stl-context {
        margin: 12px 0;
        padding: 12px;
        border-left: 3px solid #ffc400;
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
        font-size: 17px;
      }
      .stl-context small {
        margin-top: 5px;
        color: #aaa;
        font-size: 11px;
        font-weight: 850;
      }
      .stl-section {
        margin: 20px 0 8px;
        padding-bottom: 6px;
        border-bottom: 1px solid rgba(255, 196, 0, 0.3);
        color: #ffc400;
        font-size: 12px;
        font-weight: 950;
        letter-spacing: 0.12em;
      }
      .stl-money {
        display: flex;
        justify-content: space-between;
        padding: 9px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }
      .stl-money span {
        color: #aaa;
        font-size: 11px;
        font-weight: 900;
      }
      .stl-money b {
        font-size: 14px;
      }
      .stl-money.big b {
        color: #ffc400;
        font-size: 20px;
      }
      .stl-row {
        margin: 8px 0;
        padding: 11px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.018);
      }
      .stl-rowhead {
        display: flex;
        justify-content: space-between;
        gap: 8px;
      }
      .stl-row strong,
      .stl-row b {
        font-size: 14px;
      }
      .stl-row small {
        display: block;
        margin-top: 5px;
        color: #999;
        font-size: 11px;
        font-weight: 800;
      }
      .stl-row.muted {
        opacity: 0.55;
      }
      .stl-field {
        margin: 8px 0;
      }
      .stl-field label {
        display: block;
        margin-bottom: 4px;
        color: #aaa;
        font-size: 11px;
        font-weight: 950;
      }
      .stl-field input,
      .stl-field select,
      .stl-field textarea {
        width: 100%;
        min-height: 42px;
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 5px;
        background: #0d100f;
        color: #f3f4ef;
        padding: 9px;
        font:
          800 14px Arial Narrow,
          Arial,
          sans-serif;
        outline: none;
      }
      .stl-field textarea {
        min-height: 76px;
      }
      .stl-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 9px;
      }
      .stl-primary,
      .stl-secondary,
      .stl-danger {
        width: 100%;
        min-height: 46px;
        margin-top: 9px;
        border-radius: 5px;
        font-size: 13px;
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
        min-height: 36px;
      }
      .stl-check {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #ddd;
        font-size: 12px;
      }
      .stl-check input {
        width: 18px;
        height: 18px;
      }
      .stl-help {
        padding: 10px;
        color: #bbb;
        font-size: 12px;
        line-height: 1.5;
      }
      .stl-status {
        margin: 12px 0;
        padding: 13px;
        border: 1px solid rgba(255, 196, 0, 0.3);
        border-radius: 6px;
        background: #0b0d0c;
      }
      .stl-status strong {
        font-size: 16px;
        color: #ffc400;
      }
      .stl-status.ok strong {
        color: #24d26d;
      }
      .stl-blockers {
        margin: 10px 0;
        padding: 12px;
        border: 1px solid rgba(255, 76, 76, 0.4);
        border-radius: 5px;
        color: #ff8585;
        font-size: 12px;
        font-weight: 900;
        line-height: 1.5;
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
        margin: 12px 4px;
        color: #777;
        font-size: 10px;
        font-weight: 800;
        text-align: center;
        line-height: 1.4;
      }
      @media (max-width: 560px) {
        .stl-grid {
          grid-template-columns: 1fr;
        }
        .stl-title {
          font-size: 23px;
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
