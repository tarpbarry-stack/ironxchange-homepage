export default function IXIAssetSaleStyles() {
  return (
    <style jsx global>{`
      .ixi-sale, .ixi-sale * { box-sizing: border-box; }
      .ixi-sale { width: 100%; min-height: 100%; color: #f3f4ef; font-family: Arial, sans-serif; }
      .sale-top { display: grid; grid-template-columns: 30px minmax(0, 1fr) auto; align-items: center; gap: 7px; padding: 8px 10px; border-bottom: 1px solid #303030; }
      .sale-back { border: 0; background: transparent; color: #ffc400; font-size: 24px; line-height: 1; cursor: pointer; }
      .sale-k { color: #999; font-size: 9px; font-weight: 800; letter-spacing: 1.2px; }
      .sale-title { margin-top: 1px; font-size: 15px; font-weight: 950; line-height: 1; }
      .sale-head-actions { display: flex; align-items: flex-end; flex-direction: column; gap: 3px; }
      .sale-head-actions > i { padding: 5px 7px; background: #ffc400; color: #080808; font-size: 8px; font-style: normal; font-weight: 950; }
      .sale-lang { display: flex; gap: 2px; }
      .sale-lang button { border: 0; background: transparent; color: #666; font-size: 6px; font-weight: 950; padding: 0 2px; }
      .sale-lang button.on { color: #ffc400; }
      .sale-card-record { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 5px 10px; border-block: 1px solid #242424; background: #111; }
      .sale-card-record span { min-width: 0; overflow: hidden; color: #999; font-size: 9px; letter-spacing: 1.2px; text-overflow: ellipsis; white-space: nowrap; }
      .sale-card-record strong { flex: none; color: #ffc400; font-size: 15px; font-variant-numeric: tabular-nums; white-space: nowrap; }
      .sale-context { margin: 8px 10px; padding: 8px 9px; border-left: 2px solid #ffc400; background: linear-gradient(90deg, rgba(255, 196, 0, 0.07), transparent); }
      .sale-context strong, .sale-context small { display: block; }
      .sale-context strong { font-size: 11px; line-height: 1.2; overflow-wrap: anywhere; }
      .sale-context small { margin-top: 3px; color: #929692; font-size: 7px; font-weight: 800; }
      .sale-section { margin: 10px 9px 5px; padding-bottom: 3px; border-bottom: 1px solid rgba(255, 196, 0, 0.35); color: #ffc400; font-size: 7.5px; font-weight: 950; letter-spacing: 0.12em; }
      .sale-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 6px; padding: 0 9px; }
      .sale-field { min-width: 0; margin: 5px 0; }
      .sale-field label { display: block; min-height: 9px; margin-bottom: 3px; color: #9ca09c; font-size: 6.5px; font-weight: 950; line-height: 1.25; }
      .sale-field input, .sale-field select, .sale-field textarea { width: 100%; min-width: 0; min-height: 30px; border: 1px solid rgba(255, 255, 255, 0.13); border-radius: 4px; background: #0d100f; color: #f3f4ef; padding: 6px 7px; font: 800 9px Arial, sans-serif; outline: none; }
      .sale-field textarea { min-height: 48px; resize: vertical; }
      .sale-field input[readonly] { color: #e0e3e0; background: #080a09; border-color: rgba(255, 255, 255, 0.08); }
      .sale-money { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; margin: 0 9px; padding: 5px 6px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); }
      .sale-money span { color: #9ca09c; font-size: 6.5px; font-weight: 900; }
      .sale-money b { flex: none; font-size: 8px; font-variant-numeric: tabular-nums; white-space: nowrap; }
      .sale-total { display: flex; justify-content: space-between; align-items: end; margin: 7px 9px; padding: 8px; border: 1px solid rgba(255, 196, 0, 0.28); border-radius: 5px; background: rgba(255, 196, 0, 0.04); }
      .sale-total span { color: #999; font-size: 6.5px; font-weight: 950; }
      .sale-total strong { color: #ffc400; font-size: 15px; font-variant-numeric: tabular-nums; white-space: nowrap; }
      .sale-row { min-width: 0; margin: 5px 9px; padding: 7px; border: 1px solid rgba(255, 255, 255, 0.09); border-radius: 4px; background: rgba(255, 255, 255, 0.018); }
      .sale-rowhead { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 6px; }
      .sale-row strong, .sale-row b { font-size: 8px; }
      .sale-row b { font-variant-numeric: tabular-nums; white-space: nowrap; }
      .sale-row small { display: block; margin-top: 3px; color: #858985; font-size: 6.5px; font-weight: 800; line-height: 1.35; }
      .sale-primary, .sale-secondary { width: calc(100% - 18px); min-height: 36px; margin: 7px 9px 0; border-radius: 4px; font-size: 8.5px; font-weight: 950; }
      .sale-primary { border: 1px solid #ffc400; background: linear-gradient(180deg, #ffd02a, #e0a800); color: #090a09; }
      .sale-secondary { border: 1px solid rgba(255, 255, 255, 0.15); background: #0a0c0b; color: #eee; }
      .sale-primary:disabled { opacity: 0.38; cursor: not-allowed; }
      .sale-docs { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; padding: 0 9px; }
      .sale-docs button { min-height: 33px; border: 1px solid rgba(255, 255, 255, 0.13); border-radius: 4px; background: #0b0d0c; color: #eee; font-size: 7px; font-weight: 950; }
      .sale-readiness, .sale-warning, .sale-error { margin: 7px 9px; padding: 8px; border-radius: 4px; font-size: 7px; font-weight: 900; line-height: 1.4; }
      .sale-readiness.locked, .sale-error { border: 1px solid rgba(255, 76, 76, 0.38); background: rgba(255, 30, 30, 0.04); color: #ff8585; }
      .sale-readiness.ready { border: 1px solid rgba(36, 210, 109, 0.42); background: rgba(36, 210, 109, 0.05); color: #24d26d; }
      .sale-warning { border: 1px solid rgba(255, 196, 0, 0.35); color: #ffc400; }
      .sale-status { margin: 8px 9px; padding: 9px; border: 1px solid rgba(255, 196, 0, 0.3); border-radius: 5px; background: #0b0d0c; }
      .sale-status > strong { color: #24d26d; font-size: 11px; }
      .sale-status .sale-money { margin: 5px 0 0; }
      .sale-foot { margin: 8px 9px 3px; color: #747874; font-size: 6px; font-weight: 800; line-height: 1.35; text-align: center; }
    `}</style>
  );
}
