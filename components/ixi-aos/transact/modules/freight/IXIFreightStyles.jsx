export default function IXIFreightStyles(){return <style jsx global>{`
.ixi-freight{width:298px;height:471px;box-sizing:border-box;background:#080b0a;color:#f4f6f5;border:1px solid #2c3430;display:flex;flex-direction:column;font:800 10px/1.3 Inter,Arial,sans-serif;overflow:hidden}
.ixi-freight *{box-sizing:border-box}
.ixi-freight .fr-head{height:50px;padding:8px 10px;border-bottom:1px solid #26302b;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px;background:linear-gradient(180deg,#121714,#090c0a)}
.ixi-freight .fr-head>div:first-child{min-width:0}
.ixi-freight .fr-head strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;letter-spacing:.02em}
.ixi-freight .fr-head small,.ixi-freight .fr-muted{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#8e9993;font-size:9px;letter-spacing:.06em;text-transform:uppercase}
.ixi-freight .fr-status{padding:5px 7px;border:1px solid #78600b;color:#ffd21a;border-radius:4px;font-size:9px;white-space:nowrap}
.ixi-freight .fr-status.good{border-color:#12723e;color:#57e697}
.ixi-freight .fr-status.bad{border-color:#8a2732;color:#ff7280}
.ixi-freight .fr-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));height:28px;border-bottom:1px solid #26302b}
.ixi-freight .fr-tabs button,.ixi-freight .fr-foot button{min-width:0;border:0;border-right:1px solid #222a26;background:#0e1310;color:#7f8a84;font:900 9px Inter,Arial;letter-spacing:.03em}
.ixi-freight .fr-tabs button.on{background:#182119;color:#ffd21a;box-shadow:inset 0 -2px #ffd21a}
.ixi-freight .fr-body{flex:1;width:100%;min-width:0;min-height:0;overflow-x:hidden;overflow-y:auto;padding:8px 9px}
.ixi-freight .fr-section{margin:8px 0 5px;color:#ffd21a;font-size:9px;letter-spacing:.1em;border-bottom:1px solid #28302c;padding-bottom:4px}
.ixi-freight .fr-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:5px}
.ixi-freight .fr-grid .wide{grid-column:1/-1}
.ixi-freight .fr-field{min-width:0;display:flex;flex-direction:column;gap:3px;color:#8f9994;font-size:9px;letter-spacing:.04em}
.ixi-freight .fr-field input,.ixi-freight .fr-field select,.ixi-freight .fr-field textarea{width:100%;min-width:0;max-width:100%;border:1px solid #333d38;background:#111713;color:#f5f7f6;padding:6px;font:750 10px Inter,Arial;border-radius:3px}
.ixi-freight .fr-field.actual-total input{border-color:#8f7610;background:#171609;font-size:10px;font-weight:900}
.ixi-freight .fr-field textarea{min-height:38px;resize:vertical}
.ixi-freight .fr-field input.invalid,.ixi-freight .fr-field select.invalid{border-color:#e64957}
.ixi-freight .fr-hint{min-width:0;color:#8f9994;font-size:9px;line-height:1.35;letter-spacing:.02em;overflow-wrap:anywhere}
.ixi-freight .fr-actions{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:5px;margin-top:7px}
.ixi-freight .fr-actions.one{grid-template-columns:minmax(0,1fr)}
.ixi-freight .fr-btn{min-width:0;min-height:32px;border:1px solid #4a554f;background:#151c18;color:#fff;font:900 9px Inter,Arial;letter-spacing:.05em;border-radius:3px}
.ixi-freight .fr-btn.primary{background:#ffd21a;border-color:#ffd21a;color:#090a09}
.ixi-freight .fr-btn.good{border-color:#188649;color:#5ff2a0}
.ixi-freight .fr-btn.bad{border-color:#8a2732;color:#ff7280}
.ixi-freight .fr-btn:disabled{opacity:.42}
.ixi-freight .fr-card{min-width:0;border:1px solid #2e3833;background:#101612;padding:6px;margin-bottom:5px;border-radius:4px}
.ixi-freight .fr-card button{width:100%;min-width:0;text-align:left;background:transparent;border:0;color:inherit;padding:0}
.ixi-freight .fr-card strong{display:block;font-size:10px;overflow-wrap:anywhere}
.ixi-freight .fr-card span{display:block;color:#9da7a2;font-size:9px;margin-top:2px;overflow-wrap:anywhere}
.ixi-freight .fr-kpis{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:5px}
.ixi-freight .fr-kpi{min-width:0;background:#101612;border:1px solid #2d3732;padding:6px}
.ixi-freight .fr-kpi span{display:block;color:#929c96;font-size:9px}
.ixi-freight .fr-kpi strong{display:block;min-width:0;overflow-wrap:anywhere;font-size:11px;margin-top:2px}
.ixi-freight .fr-kpi strong.unset{color:#9ca6a0;font-size:9px;line-height:14px}
.ixi-freight .fr-kpi.warn strong{color:#ffd21a}
.ixi-freight .fr-invoice{min-width:0;max-width:100%;border-left:2px solid #d3aa12;padding:5px 6px;margin:5px 0;background:#101612}
.ixi-freight .fr-invoice.credit{border-color:#36c77b}
.ixi-freight .fr-invoice div{min-width:0;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px}
.ixi-freight .fr-invoice b,.ixi-freight .fr-invoice strong,.ixi-freight .fr-invoice small{min-width:0;overflow-wrap:anywhere}
.ixi-freight .fr-invoice strong{text-align:right}
.ixi-freight .fr-invoice small{display:block;color:#89938d;margin-top:2px}
.ixi-freight .fr-error{max-width:100%;margin:6px 0;padding:6px;border:1px solid #8e3038;background:#260e12;color:#ff8992;font-size:9px;overflow-wrap:anywhere}
.ixi-freight .fr-note{max-width:100%;margin:6px 0;padding:5px;border:1px solid #685817;background:#1d1908;color:#f5d85b;font-size:9px;overflow-wrap:anywhere}
.ixi-freight .fr-event{min-width:0;max-width:100%;padding:5px 0;border-bottom:1px solid #232b27}
.ixi-freight .fr-event time,.ixi-freight .fr-event strong{min-width:0;overflow-wrap:anywhere}
.ixi-freight .fr-event time{display:block;color:#8c9791;font-size:9px}
.ixi-freight .fr-event strong{display:block;margin-top:2px}
.ixi-freight .fr-foot{height:27px;border-top:1px solid #26302b;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
.ixi-freight .fr-empty{max-width:100%;padding:20px 8px;text-align:center;color:#8f9993;overflow-wrap:anywhere}
.ixi-freight .fr-empty.compact{padding:8px}
.ixi-freight .fr-check{min-width:0;display:flex;gap:6px;align-items:flex-start;margin:6px 0;color:#c3cbc7}
.ixi-freight .fr-check input{margin:0}
.ixi-freight .fr-pill{display:inline-block;max-width:100%;padding:2px 4px;border:1px solid #3a4540;color:#9da7a2;border-radius:3px;font-size:9px;margin-right:3px;overflow-wrap:anywhere}
`}</style>}
