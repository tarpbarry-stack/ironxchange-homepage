export default function IXIPurchaseOrderStyles() {
  return (
    <style jsx global>{`
      .ixi-po-card,
      .ixi-po-card * { box-sizing: border-box; }
      .ixi-po-card {
        position: relative;
        width: 298px;
        height: 471px;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,.15);
        border-radius: 12px;
        background:
          linear-gradient(180deg,rgba(255,255,255,.035),transparent 18%),
          radial-gradient(circle at 16% -4%,rgba(255,196,0,.04),transparent 35%),
          #0a0c0b;
        color: #f2f3f2;
        font-family: Arial,Helvetica,sans-serif;
        box-shadow: inset 0 1px rgba(255,255,255,.04),0 18px 42px rgba(0,0,0,.5);
      }
      .ixi-po-top {
        height: 47px;
        padding: 7px 8px 5px;
        display: grid;
        grid-template-columns: minmax(0,1fr) auto;
        gap: 6px;
        border-bottom: 1px solid rgba(255,255,255,.08);
      }
      .ixi-po-id strong { display:block; overflow:hidden; font-size:15px; line-height:17px; white-space:nowrap; text-overflow:ellipsis; }
      .ixi-po-id small { display:block; margin-top:2px; color:rgba(255,255,255,.36); font-size:5.2px; font-weight:900; letter-spacing:.07em; }
      .ixi-po-status {
        min-width: 76px;
        max-width: 104px;
        height: 29px;
        padding: 0 7px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(255,196,0,.36);
        border-radius: 5px;
        background: rgba(255,196,0,.055);
        color: #ffc400;
        font-size: 5.6px;
        font-weight: 950;
        line-height: 1.15;
        text-align: center;
        text-transform: uppercase;
      }
      .ixi-po-status.good { border-color:rgba(93,208,113,.34); background:rgba(93,208,113,.06); color:#79de8d; }
      .ixi-po-status.bad { border-color:rgba(255,80,66,.34); background:rgba(255,80,66,.055); color:#ff6658; }
      .ixi-po-tabs {
        height: 31px;
        display: grid;
        grid-template-columns: repeat(3,1fr);
        gap: 3px;
        padding: 3px;
        border-bottom: 1px solid rgba(255,255,255,.06);
        background: #090b0a;
      }
      .ixi-po-tabs button {
        min-width: 0;
        border: 1px solid transparent;
        border-radius: 4px;
        background: transparent;
        color: rgba(255,255,255,.42);
        font-size: 5px;
        font-weight: 950;
        letter-spacing: .025em;
        cursor: pointer;
      }
      .ixi-po-tabs button.on { border-color:rgba(255,196,0,.36); background:rgba(255,196,0,.055); color:#ffc400; }
      .ixi-po-body {
        position: absolute;
        top: 78px;
        left: 0;
        right: 0;
        bottom: 31px;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 7px 8px 10px;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,.16) transparent;
      }
      .ixi-po-foot {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 31px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 8px;
        border-top: 1px solid rgba(255,255,255,.07);
        background: #090b0a;
        color: rgba(255,255,255,.34);
        font-size: 5px;
        font-weight: 900;
      }
      .ixi-po-lang { display:flex; align-items:center; gap:2px; }
      .ixi-po-lang button { border:0; padding:2px 3px; background:transparent; color:rgba(255,255,255,.34); font-size:5px; font-weight:950; cursor:pointer; }
      .ixi-po-lang button.on { color:#ffc400; }
      .ixi-po-section { margin:8px 0 4px; color:#ffc400; font-size:6.3px; font-weight:950; letter-spacing:.045em; }
      .ixi-po-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:4px; }
      .ixi-po-box { min-width:0; padding:6px; border:1px solid rgba(255,255,255,.09); border-radius:5px; background:rgba(255,255,255,.018); }
      .ixi-po-box span,.ixi-po-kv span { display:block; color:rgba(255,255,255,.4); font-size:5px; font-weight:900; text-transform:uppercase; }
      .ixi-po-box strong { display:block; margin-top:3px; font-size:7px; line-height:1.25; overflow-wrap:anywhere; }
      .ixi-po-kv { min-height:24px; display:grid; grid-template-columns:92px 1fr; gap:7px; align-items:start; padding:5px 2px; border-bottom:1px solid rgba(255,255,255,.055); }
      .ixi-po-kv strong { font-size:6.5px; line-height:1.25; text-align:right; overflow-wrap:anywhere; }
      .ixi-po-copy { padding:6px; border:1px solid rgba(255,255,255,.08); border-radius:5px; background:rgba(255,255,255,.015); font-size:7px; line-height:1.35; }
      .ixi-po-table { width:100%; border-collapse:collapse; font-size:5.7px; }
      .ixi-po-table th { padding:4px 3px; border-bottom:1px solid rgba(255,255,255,.08); color:rgba(255,255,255,.36); font-size:4.7px; text-align:left; }
      .ixi-po-table td { padding:5px 3px; border-bottom:1px solid rgba(255,255,255,.055); vertical-align:top; }
      .ixi-po-table .num { text-align:right; white-space:nowrap; }
      .ixi-po-approval { padding:6px; border:1px solid rgba(255,196,0,.19); border-radius:5px; background:rgba(255,196,0,.02); }
      .ixi-po-approval-row { min-height:20px; display:grid; grid-template-columns:1fr auto; gap:6px; align-items:center; border-bottom:1px solid rgba(255,255,255,.045); }
      .ixi-po-approval-row:last-child { border-bottom:0; }
      .ixi-po-approval-row span { color:rgba(255,255,255,.4); font-size:5px; font-weight:900; }
      .ixi-po-approval-row strong { font-size:6.5px; }
      .ixi-po-actions { display:grid; grid-template-columns:1fr 1fr; gap:4px; margin-top:7px; }
      .ixi-po-actions.one { grid-template-columns:1fr; }
      .ixi-po-actions button,.ixi-po-wide {
        min-height:28px;
        padding:4px 6px;
        border:1px solid rgba(255,196,0,.34);
        border-radius:4px;
        background:rgba(255,196,0,.025);
        color:#ffc400;
        font-size:5.8px;
        font-weight:950;
        cursor:pointer;
      }
      .ixi-po-actions button.good { grid-column:1/-1; border-color:rgba(80,195,83,.4); color:#76dc68; background:rgba(80,195,83,.045); }
      .ixi-po-actions button.bad { border-color:rgba(255,75,59,.4); color:#ff6254; }
      .ixi-po-actions button:disabled,.ixi-po-wide:disabled { opacity:.35; cursor:not-allowed; }
      .ixi-po-receive-row { min-height:27px; display:grid; grid-template-columns:minmax(0,1fr) 34px 34px 38px; gap:3px; align-items:center; border-bottom:1px solid rgba(255,255,255,.055); }
      .ixi-po-receive-row span { overflow:hidden; font-size:5.8px; text-overflow:ellipsis; white-space:nowrap; }
      .ixi-po-receive-row b { font-size:6px; text-align:right; }
      .ixi-po-receive-row input { width:36px; height:20px; border:1px solid rgba(255,255,255,.12); border-radius:3px; background:#080a09; color:#fff; font-size:6px; text-align:center; outline:none; }
      .ixi-po-cost { display:grid; grid-template-columns:1fr auto; padding:5px 1px; border-bottom:1px solid rgba(255,255,255,.055); }
      .ixi-po-cost span { color:rgba(255,255,255,.5); font-size:5.8px; }
      .ixi-po-cost strong { font-size:7px; }
      .ixi-po-cost.warn strong { color:#ffc400; }
      .ixi-po-cost.bad strong { color:#ff6254; }
      .ixi-po-inline { margin-top:6px; padding:6px; border:1px solid rgba(255,196,0,.18); border-radius:5px; background:#090b0a; }
      .ixi-po-inline label { display:block; margin:4px 0 2px; color:rgba(255,255,255,.42); font-size:5px; font-weight:900; }
      .ixi-po-inline input,.ixi-po-inline textarea { width:100%; min-height:24px; padding:4px 5px; border:1px solid rgba(255,255,255,.12); border-radius:3px; background:#060807; color:#fff; font-size:6.5px; outline:none; }
      .ixi-po-inline textarea { min-height:44px; resize:vertical; }
      .ixi-po-timeline { position:relative; padding-left:18px; }
      .ixi-po-timeline::before { content:""; position:absolute; left:6px; top:4px; bottom:4px; width:1px; background:rgba(89,220,87,.3); }
      .ixi-po-event { position:relative; padding:0 0 11px 2px; }
      .ixi-po-event::before { content:""; position:absolute; left:-15px; top:1px; width:8px; height:8px; border:1px solid #70d85e; border-radius:50%; background:#0b0d0c; }
      .ixi-po-event time { display:block; color:rgba(255,255,255,.4); font-size:5px; }
      .ixi-po-event strong { display:block; margin-top:2px; font-size:6.5px; line-height:1.3; }
      .ixi-po-event small { display:block; margin-top:2px; color:rgba(255,255,255,.42); font-size:5.3px; line-height:1.25; }
      .ixi-po-related { min-height:25px; display:grid; grid-template-columns:1fr 72px 10px; gap:5px; align-items:center; border-bottom:1px solid rgba(255,255,255,.055); }
      .ixi-po-related strong { overflow:hidden; font-size:6.4px; text-overflow:ellipsis; white-space:nowrap; }
      .ixi-po-related span { color:rgba(255,255,255,.4); font-size:5px; text-align:right; }
      .ixi-po-error { margin-top:5px; padding:5px; border:1px solid rgba(255,74,62,.3); border-radius:4px; background:rgba(255,74,62,.045); color:#ff756a; font-size:5.6px; font-weight:900; }
      .ixi-po-empty { padding:14px 6px; color:rgba(255,255,255,.28); font-size:6px; text-align:center; }

      /* When the standalone PO product is open inside TRAN$ACT, it owns the full 298×471 surface. */
      .ixi-transact-app:has(.ixi-po-card) > .tx-header,
      .ixi-transact-app:has(.ixi-po-card) > .board-command-rail { display:none!important; }
      .ixi-transact-app:has(.ixi-po-card) > .tx-body { top:0!important; bottom:0!important; padding:0!important; overflow:hidden!important; }
    `}</style>
  );
}
