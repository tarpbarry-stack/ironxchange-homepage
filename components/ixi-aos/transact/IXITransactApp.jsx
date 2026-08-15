import {useMemo,useState} from "react";
import IXIMachineRail from "../../IXIMachineRail";
import {createIXITransactContext} from "./IXITransactContext";
import {getIXITransactModules} from "./IXITransactModuleRegistry";
import {createIXITechnologyWorkDraft} from "./modules/IXITransactTechnologyWork";
import IXIWorkOrderApp from "./modules/work-order/IXIWorkOrderApp";

const clean=v=>String(v??"").trim();

export default function IXITransactApp({object={},actor={},entity={},activeWorkOrder=null,permissions=[],onClose=null,onOpenConsole=null,onOpenModule=null,onSendFront=null,onSendBack=null,onCycleColor=null,onCycleOutline=null,armedDestination="",onSendToArmedDestination=null}){
  const context=useMemo(()=>createIXITransactContext({object,actor,entity,activeWorkOrder,permissions}),[object,actor,entity,activeWorkOrder,permissions]);
  const modules=useMemo(()=>getIXITransactModules({objectType:context.primary.objectType,permissions:context.permissions}),[context]);
  const [moduleId,setModuleId]=useState("");
  const active=modules.find(x=>x.id===moduleId)||null;

  function open(item){
    setModuleId(item.id);
    const launchPayload=item.id==="technology-work"?{technologyWork:createIXITechnologyWorkDraft(context)}:{};
    onOpenModule?.(item,context,launchPayload);
  }

  function workOrderAction(actionId,workOrder,workContext){
    onOpenModule?.({id:actionId,label:String(actionId||"").toUpperCase(),group:"work-order-action",documentType:actionId},workContext,{workOrder});
  }

  return <div className="ixi-transact-app board-color-none board-outline-1">
    <header className="tx-header">
      <div><span>IXI TRAN$ACT</span><strong>{context.primary.label}</strong><small>{context.primary.objectType||"AOS OBJECT"}</small></div>
      <div className="tx-tools"><button type="button" onClick={()=>onOpenConsole?.(context)}>CONSOLE</button><button type="button" onClick={()=>onClose?.()}>×</button></div>
    </header>
    <main className="tx-body">
      {active?.id==="work-order"?(
        <IXIWorkOrderApp context={context} initialWorkOrder={context.activeWorkOrder||null} onBack={()=>setModuleId("")} onCreate={(draft,workContext)=>onOpenModule?.({id:"work-order-create",label:"CREATE WORK ORDER",group:"work",documentType:"work-order"},workContext,{workOrder:draft})} onAction={workOrderAction}/>
      ):active?<div className="tx-module"><button type="button" className="tx-back" onClick={()=>setModuleId("")}>‹ TRAN$ACT</button><div className="tx-module-title"><span>{active.group.toUpperCase()}</span><strong>{active.label}</strong></div><div className="tx-module-placeholder"><b>{active.label}</b><span>MODULE CHASSIS READY</span><small>{active.documentType} · {context.primary.label}</small>{active.id==="technology-work"?<p>Specialized external Work Order contract is registered: service type, diagnosis, remote/hookup work, technician notes, normalized final result, upgrades, quote, vendor invoice, actual cost and machine technology history.</p>:<p>This surface is reserved for the real {active.label.toLowerCase()} application. It receives the current AOS Passport/context and emits canonical IXI Record / IXI Financial commands.</p>}</div></div>:<>
        {context.activeWorkOrder?<button type="button" className="tx-open-work" onClick={()=>open({id:"work-order",label:"CONTINUE WORK",group:"work",documentType:"work-order"})}><span>OPEN WORK</span><strong>{clean(context.activeWorkOrder.workOrderNumber||context.activeWorkOrder.number||context.activeWorkOrder.id)||"WORK ORDER"}</strong><small>{clean(context.activeWorkOrder.title||context.activeWorkOrder.description)||"IN PROGRESS"}</small><b>CONTINUE ›</b></button>:null}
        <div className="tx-label">CREATE / OPEN</div>
        <div className="tx-grid">{modules.map(item=><button type="button" key={item.id} onClick={()=>open(item)}><span>{item.group.toUpperCase()}</span><strong>{item.label}</strong><small>{item.documentType}</small></button>)}</div>
      </>}
    </main>
    <IXIMachineRail listing={object} saved={false} boardColor="none" boardOutline={1} machineFace={0} onSendFront={onSendFront} onSendBack={onSendBack} onCycleColor={onCycleColor} onCycleOutline={onCycleOutline} armedDestination={armedDestination} onSendToArmedDestination={onSendToArmedDestination}/>
    <style jsx>{`
      .ixi-transact-app,.ixi-transact-app *{box-sizing:border-box}.ixi-transact-app{position:relative;width:298px;height:471px;overflow:hidden;border:1px solid rgba(255,255,255,.10);border-radius:14px;background:linear-gradient(180deg,rgba(255,196,0,.025),transparent 35%),#0d0e0e;color:#f4f4f4;font-family:Arial,sans-serif;box-shadow:0 18px 34px rgba(0,0,0,.42)}
      .tx-header{position:absolute;top:0;left:0;right:0;height:48px;padding:7px 9px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;justify-content:space-between;z-index:4}.tx-header span{display:block;color:#ffc400;font-size:6.5px;font-weight:950;letter-spacing:.08em}.tx-header strong{display:block;margin-top:3px;max-width:185px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:15px}.tx-header small{display:block;margin-top:2px;color:#676d69;font-size:5px;font-weight:900;text-transform:uppercase}.tx-tools{display:flex;gap:3px}.tx-tools button{height:22px;padding:0 6px;border:1px solid rgba(255,255,255,.08);border-radius:4px;background:#090a0a;color:#8b918e;font-size:5px;font-weight:950}.tx-tools button:last-child{width:22px;padding:0;font-size:14px;color:#ffc400}
      .tx-body{position:absolute;top:48px;bottom:19px;left:0;right:0;overflow-y:auto;overflow-x:hidden;padding:6px 6px 12px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.13) transparent}.tx-body::-webkit-scrollbar{width:3px}.tx-body::-webkit-scrollbar-track{background:transparent}.tx-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.13);border-radius:3px}.tx-label{margin:2px 2px 5px;color:#7c827f;font-size:5.5px;font-weight:950;letter-spacing:.08em}.tx-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px}.tx-grid button{height:57px;padding:7px;border:1px solid rgba(255,255,255,.075);border-radius:6px;background:linear-gradient(180deg,#151818,#0d0f0f);color:#eee;text-align:left}.tx-grid button span{display:block;color:#676d69;font-size:4.5px;font-weight:950}.tx-grid button strong{display:block;margin-top:5px;color:#f4f4f4;font-size:8px;font-weight:950}.tx-grid button small{display:block;margin-top:3px;color:#ffc400;font-size:4.5px;font-weight:900}.tx-open-work{position:relative;width:100%;min-height:66px;margin-bottom:7px;padding:8px;border:1px solid rgba(255,196,0,.24);border-radius:6px;background:rgba(255,196,0,.035);color:#fff;text-align:left}.tx-open-work span{display:block;color:#ffc400;font-size:5px;font-weight:950}.tx-open-work strong{display:block;margin-top:4px;font-size:10px}.tx-open-work small{display:block;margin-top:3px;color:#8d9490;font-size:5px}.tx-open-work b{position:absolute;right:8px;top:25px;color:#ffc400;font-size:6px}.tx-back{height:22px;margin-bottom:6px;border:1px solid rgba(255,255,255,.07);border-radius:4px;background:#0a0b0b;color:#ffc400;font-size:5px;font-weight:950}.tx-module-title{padding:8px;border:1px solid rgba(255,196,0,.18);border-radius:6px;background:rgba(255,196,0,.025)}.tx-module-title span{display:block;color:#777;font-size:5px;font-weight:950}.tx-module-title strong{display:block;margin-top:3px;font-size:13px}.tx-module-placeholder{margin-top:6px;min-height:255px;padding:12px;border:1px solid rgba(255,255,255,.07);border-radius:6px;background:#111313}.tx-module-placeholder>b{display:block;color:#ffc400;font-size:12px}.tx-module-placeholder>span{display:block;margin-top:5px;color:#aaa;font-size:6px;font-weight:950}.tx-module-placeholder>small{display:block;margin-top:4px;color:#666;font-size:5px}.tx-module-placeholder p{margin:18px 0 0;color:#8d9490;font-size:7px;line-height:1.55}
    `}</style>
  </div>
}
