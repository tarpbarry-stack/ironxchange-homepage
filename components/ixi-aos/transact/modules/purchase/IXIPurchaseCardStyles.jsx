export default function IXIPurchaseCardStyles() {
  return (
    <style jsx global>{`
      /*
       * PURCHASE RECORD = THE CARD.
       * When the canonical three-face record is open it owns the full native
       * 298 × 471 surface instead of being nested below the generic TRAN$ACT
       * header and rail. Other TRAN$ACT modules are unaffected.
       */
      .ixi-transact-app:has(.ixi-purchase-card) {
        border: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
      }

      .ixi-transact-app:has(.ixi-purchase-card) > .tx-header,
      .ixi-transact-app:has(.ixi-purchase-card) > .board-command-rail {
        display: none !important;
      }

      .ixi-transact-app:has(.ixi-purchase-card) > .tx-body {
        inset: 0 !important;
        top: 0 !important;
        bottom: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
      }

      .ixi-purchase-card,
      .ixi-purchase-card * { box-sizing: border-box; }
      .ixi-purchase-card {
        position: relative;
        width: 298px;
        min-width: 298px;
        max-width: 298px;
        height: 471px;
        min-height: 471px;
        max-height: 471px;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,.16);
        border-radius: 12px;
        background:
          linear-gradient(180deg, rgba(255,255,255,.035), transparent 18%),
          radial-gradient(circle at 15% 0%, rgba(255,196,0,.035), transparent 35%),
          #0a0c0b;
        color: #f1f3f1;
        font-family: Arial, Helvetica, sans-serif;
        box-shadow: inset 0 1px rgba(255,255,255,.045), 0 18px 42px rgba(0,0,0,.5);
      }
      .po-card-top {
        height: 46px;
        padding: 7px 8px 5px;
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 6px;
        border-bottom: 1px solid rgba(255,255,255,.09);
      }
      .po-card-number { min-width: 0; }
      .po-card-number strong { display:block; font-size:15px; line-height:17px; letter-spacing:.015em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .po-card-number small { display:block; margin-top:2px; color:rgba(255,255,255,.38); font-size:5.3px; font-weight:900; letter-spacing:.08em; }
      .po-status {
        height: 29px;
        min-width: 74px;
        max-width: 100px;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:0 7px;
        border:1px solid rgba(255,196,0,.38);
        border-radius:5px;
        background:rgba(255,196,0,.055);
        color:#ffc400;
        font-size:5.8px;
        font-weight:950;
        line-height:1.15;
        text-align:center;
        text-transform:uppercase;
      }
      .po-status.green { border-color:rgba(82,210,133,.28); background:rgba(82,210,133,.08); color:#76df93; }
      .po-status.red { border-color:rgba(255,82,72,.34); background:rgba(255,82,72,.06); color:#ff6258; }
      .po-face-tabs {
        height: 31px;
        display:grid;
        grid-template-columns:repeat(3,1fr);
        padding:3px;
        gap:3px;
        border-bottom:1px solid rgba(255,255,255,.06);
        background:#090b0a;
      }
      .po-face-tabs button {
        min-width:0;
        border:1px solid transparent;
        border-radius:4px;
        background:transparent;
        color:rgba(255,255,255,.42);
        font-size:5px;
        font-weight:950;
        letter-spacing:.03em;
        cursor:pointer;
      }
      .po-face-tabs button.active { border-color:rgba(255,196,0,.38); background:rgba(255,196,0,.055); color:#ffc400; }
      .po-card-body {
        position:absolute;
        top:77px;
        left:0;
        right:0;
        bottom:31px;
        overflow-y:auto;
        overflow-x:hidden;
        padding:7px 8px 10px;
        scrollbar-width:thin;
        scrollbar-color:rgba(255,255,255,.16) transparent;
      }
      .po-card-foot {
        position:absolute;
        left:0;
        right:0;
        bottom:0;
        height:31px;
        display:flex;
        align-items:center;
        justify-content:space-between;
        padding:0 8px;
        border-top:1px solid rgba(255,255,255,.07);
        background:#090b0a;
        color:rgba(255,255,255,.34);
        font-size:5px;
        font-weight:900;
      }
      .po-lang-mini { display:flex; align-items:center; gap:2px; }
      .po-lang-mini button { border:0; background:transparent; color:rgba(255,255,255,.34); padding:2px 3px; font-size:5px; font-weight:950; cursor:pointer; }
      .po-lang-mini button.active { color:#ffc400; }
      .po-section-title { margin:8px 0 4px; color:#ffc400; font-size:6.4px; font-weight:950; letter-spacing:.045em; }
      .po-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:4px; }
      .po-box { min-width:0; padding:6px; border:1px solid rgba(255,255,255,.09); border-radius:5px; background:rgba(255,255,255,.018); }
      .po-box span, .po-kv span { display:block; color:rgba(255,255,255,.38); font-size:5px; font-weight:900; text-transform:uppercase; }
      .po-box strong { display:block; margin-top:3px; font-size:7px; line-height:1.2; overflow-wrap:anywhere; }
      .po-kv { display:grid; grid-template-columns:90px 1fr; gap:7px; align-items:start; min-height:25px; padding:5px 2px; border-bottom:1px solid rgba(255,255,255,.055); }
      .po-kv strong { font-size:6.6px; line-height:1.25; text-align:right; overflow-wrap:anywhere; }
      .po-copy-block { padding:6px; border:1px solid rgba(255,255,255,.08); border-radius:5px; background:rgba(255,255,255,.015); font-size:7px; line-height:1.35; }
      .po-lines-table { width:100%; border-collapse:collapse; font-size:5.7px; }
      .po-lines-table th { padding:4px 3px; color:rgba(255,255,255,.35); font-size:4.7px; text-align:left; border-bottom:1px solid rgba(255,255,255,.08); }
      .po-lines-table td { padding:5px 3px; border-bottom:1px solid rgba(255,255,255,.055); vertical-align:top; }
      .po-lines-table td.num { text-align:right; white-space:nowrap; }
      .po-money-good { color:#87df35!important; }
      .po-money-warn { color:#ffc400!important; }
      .po-money-bad { color:#ff584b!important; }
      .po-approval-box { border:1px solid rgba(255,196,0,.18); border-radius:5px; padding:6px; background:rgba(255,196,0,.018); }
      .po-approval-row { display:grid; grid-template-columns:1fr auto; gap:6px; min-height:20px; align-items:center; border-bottom:1px solid rgba(255,255,255,.045); }
      .po-approval-row:last-child { border-bottom:0; }
      .po-approval-row span { color:rgba(255,255,255,.4); font-size:5px; font-weight:900; }
      .po-approval-row strong { font-size:6.5px; }
      .po-actions { display:grid; grid-template-columns:1fr 1fr; gap:4px; margin-top:7px; }
      .po-actions.one { grid-template-columns:1fr; }
      .po-actions button, .po-wide-action {
        min-height:27px;
        padding:4px 6px;
        border:1px solid rgba(255,196,0,.34);
        border-radius:4px;
        background:rgba(255,196,0,.025);
        color:#ffc400;
        font-size:5.8px;
        font-weight:950;
        cursor:pointer;
      }
      .po-actions button.approve { grid-column:1 / -1; border-color:rgba(76,190,64,.42); color:#72dc63; background:rgba(76,190,64,.045); }
      .po-actions button.deny { border-color:rgba(255,76,56,.4); color:#ff5e50; }
      .po-actions button:disabled, .po-wide-action:disabled { opacity:.35; cursor:not-allowed; }
      .po-receive-row { display:grid; grid-template-columns:minmax(0,1fr) 34px 34px 38px; gap:3px; align-items:center; min-height:27px; border-bottom:1px solid rgba(255,255,255,.055); }
      .po-receive-row span { font-size:5.8px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .po-receive-row b { font-size:6px; text-align:right; }
      .po-receive-row input { width:36px; height:20px; border:1px solid rgba(255,255,255,.12); border-radius:3px; background:#080a09; color:#fff; font-size:6px; text-align:center; outline:none; }
      .po-cost-row { display:grid; grid-template-columns:1fr auto; padding:5px 1px; border-bottom:1px solid rgba(255,255,255,.055); }
      .po-cost-row span { color:rgba(255,255,255,.5); font-size:5.8px; }
      .po-cost-row strong { font-size:7px; }
      .po-inline-form { margin-top:6px; padding:6px; border:1px solid rgba(255,196,0,.18); border-radius:5px; background:#090b0a; }
      .po-inline-form label { display:block; margin:4px 0 2px; color:rgba(255,255,255,.42); font-size:5px; font-weight:900; }
      .po-inline-form input, .po-inline-form textarea { width:100%; min-height:24px; padding:4px 5px; border:1px solid rgba(255,255,255,.12); border-radius:3px; background:#060807; color:#fff; font-size:6.5px; outline:none; }
      .po-inline-form textarea { min-height:45px; resize:vertical; }
      .po-timeline { position:relative; padding-left:18px; }
      .po-timeline::before { content:""; position:absolute; left:6px; top:4px; bottom:4px; width:1px; background:rgba(89,220,87,.3); }
      .po-event { position:relative; padding:0 0 11px 2px; }
      .po-event::before { content:""; position:absolute; left:-15px; top:1px; width:8px; height:8px; border:1px solid #70d85e; border-radius:50%; background:#0b0d0c; }
      .po-event time { display:block; color:rgba(255,255,255,.4); font-size:5px; }
      .po-event strong { display:block; margin-top:2px; font-size:6.5px; line-height:1.3; }
      .po-event small { display:block; margin-top:2px; color:rgba(255,255,255,.42); font-size:5.3px; line-height:1.25; }
      .po-related-row { min-height:25px; display:grid; grid-template-columns:1fr 72px 10px; gap:5px; align-items:center; border-bottom:1px solid rgba(255,255,255,.055); }
      .po-related-row strong { font-size:6.4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .po-related-row span { color:rgba(255,255,255,.4); font-size:5px; text-align:right; }
      .po-related-row b { color:#fff; }
      .po-empty { padding:14px 6px; color:rgba(255,255,255,.28); font-size:6px; text-align:center; }
      .po-card-error { margin-top:5px; padding:5px; border:1px solid rgba(255,74,62,.3); border-radius:4px; background:rgba(255,74,62,.045); color:#ff756a; font-size:5.6px; font-weight:900; }
    `}</style>
  );
}
