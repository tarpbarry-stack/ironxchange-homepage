import {useMemo,useState} from "react";
import {createIXIWorkOrderDraft,IXI_MACHINE_CONDITIONS,IXI_WORK_ORDER_TYPES} from "./IXIWorkOrderContract";
import {getIXIWorkOrderActuals,getIXIWorkOrderReferenceCounts} from "./IXIWorkOrderSelectors";

const clean=v=>String(v??"").trim();
const title=v=>String(v||"").replace(/-/g," ").toUpperCase();

export default function IXIWorkOrderApp({context={},initialWorkOrder=null,onBack=null,onCreate=null,onAction=null}){
  const [workOrder,setWorkOrder]=useState(initialWorkOrder||null);
  const [description,setDescription]=useState("");
  const [type,setType]=useState("repair");
  const [priority,setPriority]=useState("normal");
  const [machineCondition,setMachineCondition]=useState("operable");
  const [assignedTo,setAssignedTo]=useState("me");
  const actuals=useMemo(()=>getIXIWorkOrderActuals(workOrder||{}),[workOrder]);
  const counts=useMemo(()=>getIXIWorkOrderReferenceCounts(workOrder||{}),[workOrder]);

  function create(){
    if(!clean(description)) return;
    const draft=createIXIWorkOrderDraft({context,input:{title:clean(description).slice(0,80),description,type,priority,machineCondition,assignedTo:assignedTo==="me"?[context.actor||{}]:[]}});
    draft.identity.number="WO-DRAFT";
    setWorkOrder(draft);
    onCreate?.(draft,context);
  }

  function action(id){onAction?.(id,workOrder,context)}

  if(!workOrder){
    return <div className="wo-app">
      <button type="button" className="wo-back" onClick={()=>onBack?.()}>‹ TRAN$ACT</button>
      <div className="wo-kicker">NEW WORK ORDER</div>
      <div className="wo-object"><strong>{context.primary?.label||"AOS OBJECT"}</strong><small>{context.primary?.objectType||"OBJECT"}</small></div>
      <label>WHAT NEEDS WORK?</label>
      <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Describe the work or problem..." />
      <div className="wo-action-row"><button type="button" onClick={()=>action("photo")}>+ PHOTO</button><button type="button" onClick={()=>action("voice")}>🎙 DESCRIBE</button></div>
      <label>TYPE</label>
      <div className="wo-pills">{IXI_WORK_ORDER_TYPES.slice(0,4).map(item=><button key={item} type="button" className={type===item?"active":""} onClick={()=>setType(item)}>{title(item)}</button>)}</div>
      <label>PRIORITY</label>
      <div className="wo-pills three">{["normal","high","critical"].map(item=><button key={item} type="button" className={priority===item?"active":""} onClick={()=>setPriority(item)}>{title(item)}</button>)}</div>
      <label>MACHINE CONDITION</label>
      <div className="wo-pills three">{IXI_MACHINE_CONDITIONS.map(item=><button key={item} type="button" className={machineCondition===item?"active":""} onClick={()=>setMachineCondition(item)}>{title(item)}</button>)}</div>
      <label>ASSIGN</label>
      <select value={assignedTo} onChange={e=>setAssignedTo(e.target.value)}><option value="me">ME</option><option value="unassigned">UNASSIGNED</option></select>
      <button type="button" className="wo-create" onClick={create}>CREATE WORK ORDER</button>
      <Styles/>
    </div>;
  }

  return <div className="wo-app">
    <button type="button" className="wo-back" onClick={()=>onBack?.()}>‹ TRAN$ACT</button>
    <div className="wo-live-head"><span>{workOrder.identity?.number||"WORK ORDER"}</span><strong>{workOrder.context?.primaryLabel||context.primary?.label}</strong><small>{title(workOrder.work?.status||"open")} · {title(workOrder.work?.machineCondition||"operable")}</small></div>
    <section><div className="section-head"><b>WORK</b><em>{title(workOrder.work?.priority)}</em></div><p>{workOrder.work?.description}</p><div className="wo-action-row"><button onClick={()=>action("note")}>+ NOTE</button><button onClick={()=>action("photo")}>+ PHOTO</button></div></section>
    <section><div className="metric"><span>TIME</span><strong>{counts.time}</strong><button onClick={()=>action("time")}>+ TIME</button></div><div className="metric"><span>MATERIAL</span><strong>${actuals.materialActual.toLocaleString()}</strong><button onClick={()=>action("material")}>+ MATERIAL</button></div><div className="metric"><span>SERVICE</span><strong>${actuals.serviceActual.toLocaleString()}</strong><button onClick={()=>action("service")}>+ SERVICE</button></div><div className="metric"><span>EXPENSE</span><strong>${actuals.otherActual.toLocaleString()}</strong><button onClick={()=>action("expense")}>+ EXPENSE</button></div><div className="metric"><span>PURCHASING</span><strong>{counts.purchaseOrders}</strong><button onClick={()=>action("purchase-order")}>+ PO</button></div></section>
    <section className="cost"><div><span>ACTUAL</span><strong>${actuals.totalActual.toLocaleString()}</strong></div><div><span>COMMITTED</span><strong>${actuals.committed.toLocaleString()}</strong></div></section>
    <button type="button" className="wo-create" onClick={()=>action("complete")}>COMPLETE WORK</button>
    <Styles/>
  </div>;
}

function Styles(){return <style jsx>{`
.wo-app,.wo-app *{box-sizing:border-box}.wo-app{min-height:100%;color:#f2f2ef;font-family:Arial,sans-serif}.wo-back{height:21px;margin-bottom:6px;padding:0 7px;border:1px solid rgba(255,255,255,.07);border-radius:4px;background:#090a0a;color:#ffc400;font-size:5px;font-weight:950}.wo-kicker{color:#ffc400;font-size:6px;font-weight:950;letter-spacing:.08em}.wo-object,.wo-live-head{margin:5px 0 8px;padding:8px;border:1px solid rgba(255,196,0,.18);border-radius:6px;background:rgba(255,196,0,.025)}.wo-object strong,.wo-live-head strong{display:block;font-size:13px}.wo-object small,.wo-live-head small,.wo-live-head span{display:block;margin-top:3px;color:#777d79;font-size:5px;font-weight:950}.wo-live-head span{color:#ffc400}label{display:block;margin:8px 2px 4px;color:#777d79;font-size:5px;font-weight:950;letter-spacing:.06em}textarea,select{width:100%;border:1px solid rgba(255,255,255,.08);border-radius:5px;background:#111313;color:#eee;font:700 8px Arial}textarea{height:62px;padding:8px;resize:none}select{height:29px;padding:0 7px}.wo-pills{display:grid;grid-template-columns:repeat(4,1fr);gap:3px}.wo-pills.three{grid-template-columns:repeat(3,1fr)}.wo-pills button,.wo-action-row button{height:28px;border:1px solid rgba(255,255,255,.075);border-radius:5px;background:#111313;color:#8d9490;font-size:5px;font-weight:950}.wo-pills button.active{border-color:rgba(255,196,0,.35);background:rgba(255,196,0,.06);color:#ffc400}.wo-action-row{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:5px}.wo-create{width:100%;height:31px;margin-top:9px;border:1px solid rgba(255,196,0,.36);border-radius:5px;background:rgba(255,196,0,.08);color:#ffc400;font-size:6px;font-weight:950;letter-spacing:.05em}section{margin-top:6px;padding:7px;border:1px solid rgba(255,255,255,.065);border-radius:6px;background:#101212}.section-head{display:flex;justify-content:space-between}.section-head b{color:#ffc400;font-size:6px}.section-head em{color:#8d9490;font-size:5px;font-style:normal;font-weight:950}section p{margin:7px 0;color:#d8d8d4;font-size:7px;line-height:1.45}.metric{height:35px;display:grid;grid-template-columns:1fr 58px 55px;align-items:center;border-bottom:1px solid rgba(255,255,255,.045)}.metric:last-child{border-bottom:0}.metric span{color:#858b87;font-size:5px;font-weight:950}.metric strong{text-align:right;font-size:8px}.metric button{height:22px;margin-left:7px;border:1px solid rgba(255,255,255,.07);border-radius:4px;background:#090a0a;color:#ffc400;font-size:5px;font-weight:950}.cost{display:grid;grid-template-columns:1fr 1fr;gap:5px}.cost div{padding:4px}.cost span{display:block;color:#747a76;font-size:5px;font-weight:950}.cost strong{display:block;margin-top:4px;font-size:13px}
`}</style>}
