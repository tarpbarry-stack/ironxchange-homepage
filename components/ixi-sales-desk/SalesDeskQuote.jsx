import { useEffect,useRef,useState } from "react";
import dynamic from "next/dynamic";
import { salesRequest } from "./salesDeskClient";
import { passportOf } from "../ixi-dashboard/dashboardContract.mjs";
import { createIXITransactContext } from "../ixi-aos/transact/IXITransactContext";
import { createIXIQuoteDraft } from "../ixi-aos/transact/modules/quote/IXIQuoteContract";
const QuoteApp=dynamic(()=>import("../ixi-aos/transact/modules/quote/IXIQuoteApp"),{ssr:false});

export default function SalesDeskQuote({deal,machines,actor,onClose,onSaved}) {
  const dialog=useRef(null),[index,setIndex]=useState(0),[prepared,setPrepared]=useState(null),[error,setError]=useState("");
  const edited=useRef(false),[savedRecord,setSavedRecord]=useState(null),[saving,setSaving]=useState(false);
  useEffect(()=>{dialog.current.showModal();return()=>dialog.current?.close();},[]);
  const close=()=>{if(saving)return;if(edited.current && !window.confirm("Close this quote? Make sure your latest changes are saved."))return;onClose();};
  useEffect(()=>{const guard=e=>{if(edited.current){e.preventDefault();e.returnValue="";}};window.addEventListener("beforeunload",guard);return()=>window.removeEventListener("beforeunload",guard);},[]);
  useEffect(()=>{
    let canceled=false;setPrepared(null);setSavedRecord(null);setError("");
    Promise.all([salesRequest(`records/contacts/${deal.contactId}`),fetch("/api/ixi/financial/access-context",{cache:"no-store"}).then(async response=>{const result=await response.json();if(!response.ok || !result.ok)throw new Error("TRAN$ACT access could not be verified. Please close and retry.");return result.data;})]).then(([customerResult,access])=>{
    if(canceled)return;
      const machine=machines[index],customer=customerResult.record;
      const object={...machine,passportId:passportOf(machine),objectId:machine.canonicalIdentity?.objectId || machine.objectId || machine.mosObjectId || "",objectType:"machine"};
      const context=createIXITransactContext({object,entity:{passportId:access.defaults?.entityPassportId || access.entities?.[0]?.passportId,displayName:actor.company},actor:{passportId:access.actor?.passportId,userId:actor.actorId},permissions:access.permissions || []});
      const record=createIXIQuoteDraft({object,context,input:{dealId:deal.id,customerPassportId:customer.passportId,customerId:customer.id,customerName:customer.name,customerPhone:customer.phone,customerEmail:customer.email,customerAddress:customer.address}});
      setPrepared({object,context,record});
    }).catch(e=>{if(!canceled)setError(e.message);});
    return()=>{canceled=true;};
  },[index,deal,actor,machines]);
  return <dialog ref={dialog} className="sales-dialog sales-quote-dialog" aria-labelledby="sales-quote-title" onCancel={e=>{e.preventDefault();close();}}><header><div><span className="sales-eyebrow">{deal.customerName} · {deal.title}</span><h2 id="sales-quote-title">TRAN$ACT QUOTE</h2></div><button onClick={close} disabled={saving} aria-label="Close quote">×</button></header><div className="sales-dialog-body" onChangeCapture={event=>{if(event.target.closest(".ixi-quote-card,.qt-workspace"))edited.current=true;}}>
    {machines.length>1 && <label className="sales-field"><span>QUOTE FOR MACHINE</span><select disabled={saving} value={index} onChange={e=>{if(edited.current && !window.confirm("Switch machines? Make sure your current quote is saved."))return;edited.current=false;setIndex(Number(e.target.value));}}>{machines.map((machine,i)=><option key={i} value={i}>{machine.title}</option>)}</select></label>}
    {error && <p className="sales-error" role="alert">{error}</p>}
    {!prepared && !error && <p role="status">Connecting the customer, machine, and financial authority…</p>}
    {prepared && <QuoteApp onBack={close} onBusyChange={setSaving} portalContainer={dialog.current} key={index} object={prepared.object} context={prepared.context} dealId={deal.id} initialRecord={prepared.record} onRecordChange={async record=>{
      edited.current=false;setSavedRecord(record);onSaved();
      try{await salesRequest("commands",{body:{kind:"notes",commandId:`quote-note-${record.identity.financialDocumentId.replace(/[^a-zA-Z0-9_-]/g,"").slice(0,75)}`,record:{parentKind:"deals",parentId:deal.id,title:`Quote ${record.identity.number} saved in TRAN$ACT for ${prepared.object.title}.`}}});}catch(e){setError(`The quote is saved in TRAN$ACT. Its activity note could not save: ${e.message}`);}
    }}/>}
    {savedRecord && <a className="sales-wide" href={`/transact?passport=${encodeURIComponent(prepared?.object.passportId || "")}&record=${encodeURIComponent(savedRecord.identity.financialDocumentId)}`}>OPEN SAVED QUOTE IN TRAN$ACT ↗</a>}
  </div></dialog>;
}
