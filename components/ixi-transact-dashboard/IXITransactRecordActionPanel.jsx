import {useMemo,useState} from "react";
import {getIXITransactActionExecutionContext,getIXITransactActionInputContract,validateIXITransactActionExecution} from "./data/IXITransactActionExecutionContract";
import {executeIXITransactCanonicalRecordAction} from "./data/IXITransactCanonicalActionDispatcher";

const clean=value=>String(value??"").trim();
const today=()=>new Date().toISOString().slice(0,10);
const requestId=()=>typeof crypto!=="undefined"&&typeof crypto.randomUUID==="function"?`IXI-DESKTOP-${crypto.randomUUID()}`:`IXI-DESKTOP-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
const money=value=>{if(value===null||value===undefined||value==="")return "—";const amount=Number(value);return Number.isFinite(amount)?new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(amount):"—"};

function initialInput(actionId=""){
  const id=clean(actionId).toLowerCase();
  const base={clientRequestId:requestId()};
  if(id==="record-ar-payment")return{...base,amount:"",date:today(),method:"wire",reference:""};
  if(id==="record-ap-payment")return{...base,amount:"",date:today(),method:"ach",reference:""};
  if(id==="record-ar-credit")return{...base,amount:"",reason:"",description:"",writeOff:false};
  if(id==="record-vendor-credit")return{...base,amount:"",date:today(),reason:""};
  if(id==="match-bill")return{...base,invoiceNumber:"",invoiceDate:today(),amount:""};
  return base;
}

function Field({label,children,required=false}){return <label className="td-action-field"><span>{label}{required?" *":""}</span>{children}</label>}

export default function IXITransactRecordActionPanel({action,record,onCancel,onSuccess}){
  const actionId=clean(action?.id).toLowerCase();
  const contract=getIXITransactActionInputContract(actionId);
  const[input,setInput]=useState(()=>initialInput(actionId));
  const[status,setStatus]=useState("editing");
  const[errors,setErrors]=useState([]);
  const[result,setResult]=useState(null);
  const context=useMemo(()=>getIXITransactActionExecutionContext(record,actionId),[record,actionId]);
  const balance=context.receivable?.balance??context.receivable?.openBalance??context.receivable?.balanceDue??context.payable?.balance??context.payable?.openBalance??context.payable?.balanceDue;
  const set=(key,value)=>setInput(current=>({...current,[key]:value}));

  const submit=async()=>{
    if(status==="submitting")return;
    const validation=validateIXITransactActionExecution({action,record,input});
    if(!validation.ok){setErrors(validation.errors);setStatus("invalid");return;}
    setErrors([]);setStatus("submitting");
    try{
      const response=await executeIXITransactCanonicalRecordAction({action,record,input});
      setResult(response);setStatus("success");onSuccess?.(response,{action,record,input});
    }catch(cause){setErrors([{code:clean(cause?.code)||"canonical-command-failed",message:clean(cause?.message)||"Canonical TRAN$ACT command failed."}]);setStatus("error");}
  };

  if(!contract)return <div className="td-action-panel"><div className="td-action-panel-head"><span>ACTION NOT IMPLEMENTED</span><strong>{action?.label||actionId||"UNKNOWN ACTION"}</strong></div><div className="td-action-errors"><p>This resolver-approved action does not yet have a canonical desktop execution contract.</p></div><button type="button" className="td-action-cancel" onClick={onCancel}>CLOSE</button></div>;

  return <div className="td-action-panel" aria-label={`${action?.label||actionId} input`}>
    <div className="td-action-panel-head"><span>CANONICAL TRAN$ACT COMMAND</span><strong>{action?.label||actionId.toUpperCase()}</strong><small>{contract.contract}</small></div>
    <div className="td-action-context"><div><span>SERVER RESOLUTION</span><strong>REQUIRED + PRESENT</strong></div>{balance!==undefined&&balance!==null?<div><span>OPEN BALANCE</span><strong>{money(balance)}</strong></div>:null}<div><span>REQUEST ID</span><strong>{input.clientRequestId}</strong></div></div>

    {actionId==="record-ar-payment"||actionId==="record-ap-payment"?<>
      <Field label="AMOUNT" required><input type="number" min="0.01" step="0.01" inputMode="decimal" value={input.amount} onChange={event=>set("amount",event.target.value)} autoFocus/></Field>
      <Field label="DATE"><input type="date" value={input.date} onChange={event=>set("date",event.target.value)}/></Field>
      <Field label="METHOD"><select value={input.method} onChange={event=>set("method",event.target.value)}><option value="ach">ACH</option><option value="wire">WIRE</option><option value="check">CHECK</option><option value="cash">CASH</option><option value="card">CARD</option><option value="other">OTHER</option></select></Field>
      <Field label="REFERENCE"><input value={input.reference} onChange={event=>set("reference",event.target.value)} placeholder="Bank ref / check / confirmation"/></Field>
    </>:null}

    {actionId==="record-ar-credit"?<>
      <Field label="AMOUNT" required><input type="number" min="0.01" step="0.01" inputMode="decimal" value={input.amount} onChange={event=>set("amount",event.target.value)} autoFocus/></Field>
      <Field label="REASON" required><input value={input.reason} onChange={event=>set("reason",event.target.value)} placeholder="Required credit reason"/></Field>
      <Field label="DESCRIPTION"><textarea rows={3} value={input.description} onChange={event=>set("description",event.target.value)} placeholder="Optional supporting description"/></Field>
      <label className="td-action-check"><input type="checkbox" checked={Boolean(input.writeOff)} onChange={event=>set("writeOff",event.target.checked)}/><span>CLASSIFY AS WRITE-OFF</span></label>
    </>:null}

    {actionId==="record-vendor-credit"?<>
      <Field label="AMOUNT" required><input type="number" min="0.01" step="0.01" inputMode="decimal" value={input.amount} onChange={event=>set("amount",event.target.value)} autoFocus/></Field>
      <Field label="DATE"><input type="date" value={input.date} onChange={event=>set("date",event.target.value)}/></Field>
      <Field label="REASON" required><input value={input.reason} onChange={event=>set("reason",event.target.value)} placeholder="Required vendor credit reason"/></Field>
    </>:null}

    {actionId==="match-bill"?<>
      <Field label="VENDOR INVOICE #" required><input value={input.invoiceNumber} onChange={event=>set("invoiceNumber",event.target.value)} autoFocus/></Field>
      <Field label="INVOICE DATE" required><input type="date" value={input.invoiceDate} onChange={event=>set("invoiceDate",event.target.value)}/></Field>
      <Field label="BILL AMOUNT" required><input type="number" min="0.01" step="0.01" inputMode="decimal" value={input.amount} onChange={event=>set("amount",event.target.value)}/></Field>
    </>:null}

    {actionId==="issue-po"?<div className="td-action-confirm"><span>STATE TRANSITION</span><strong>ISSUE THIS CANONICAL PURCHASE ORDER</strong><p>This advances the resolver-approved Purchase Order through the existing TRAN$ACT command engine. It does not create a second desktop PO record.</p></div>:null}

    {errors.length?<div className="td-action-errors" role="alert">{errors.map((error,index)=><p key={`${error.code}-${index}`}><strong>{clean(error.code).replace(/-/g," ").toUpperCase()}</strong>{error.message}</p>)}</div>:null}
    {status==="success"?<div className="td-action-success"><span>DURABLE COMMAND ACCEPTED</span><strong>{result?.actionId?.toUpperCase()||"SUCCESS"}</strong><p>IXI Financial projection cache was invalidated. Refresh from the authoritative server before relying on updated balances.</p></div>:null}

    <div className="td-action-buttons"><button type="button" className="td-action-cancel" onClick={onCancel} disabled={status==="submitting"}>{status==="success"?"CLOSE":"CANCEL"}</button>{status!=="success"?<button type="button" className={action?.dangerous?"td-action-submit danger":"td-action-submit"} onClick={submit} disabled={status==="submitting"}>{status==="submitting"?"POSTING CANONICAL COMMAND...":actionId==="issue-po"?"CONFIRM + ISSUE PO":"VALIDATE + POST"}</button>:null}</div>

    <style jsx global>{`
      .td-action-panel{margin-top:12px;padding:12px;border:1px solid #343a36;background:#080b09;display:grid;gap:9px}.td-action-panel-head{display:grid;gap:3px;padding-bottom:8px;border-bottom:1px solid #2b302d}.td-action-panel-head span,.td-action-panel-head small,.td-action-context span,.td-action-field>span,.td-action-confirm span{font-size:6px;font-weight:950;letter-spacing:.14em;color:#727a73}.td-action-panel-head strong{font:950 11px "Arial Narrow",Arial,sans-serif;color:#ffc400}.td-action-context{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:#252a27}.td-action-context>div{min-width:0;padding:7px;background:#0d100e;display:grid;gap:3px}.td-action-context strong{overflow:hidden;text-overflow:ellipsis;font:900 7px "Arial Narrow",Arial,sans-serif;color:#dfe4df}.td-action-field{display:grid;gap:4px}.td-action-field input,.td-action-field select,.td-action-field textarea{width:100%;box-sizing:border-box;border:1px solid #343a36;border-radius:2px;background:#111512;color:#f2f3f2;padding:8px 9px;font:800 8px "Arial Narrow",Arial,sans-serif;outline:none}.td-action-field input:focus,.td-action-field select:focus,.td-action-field textarea:focus{border-color:#ffc400}.td-action-check{display:flex;align-items:center;gap:8px;padding:6px 0;color:#d9ddd9;font:900 7px "Arial Narrow",Arial,sans-serif}.td-action-confirm{padding:10px;border:1px solid rgba(255,196,0,.22);background:rgba(255,196,0,.035);display:grid;gap:4px}.td-action-confirm strong{font:950 9px "Arial Narrow",Arial,sans-serif}.td-action-confirm p,.td-action-success p{margin:0;color:#8d968f;font:700 7px/1.45 Arial,sans-serif}.td-action-errors{display:grid;gap:4px;padding:8px;border:1px solid rgba(255,92,92,.28);background:rgba(255,70,70,.055)}.td-action-errors p{margin:0;display:grid;gap:2px;color:#c6cbc7;font:700 7px/1.35 Arial,sans-serif}.td-action-errors strong{color:#ff7373;font-size:6px;letter-spacing:.1em}.td-action-success{padding:8px;border:1px solid rgba(76,210,126,.3);background:rgba(76,210,126,.05);display:grid;gap:4px}.td-action-success span{font-size:6px;color:#6fc68e;font-weight:950;letter-spacing:.12em}.td-action-success strong{font:950 9px "Arial Narrow",Arial,sans-serif;color:#8ce5ab}.td-action-buttons{display:flex;gap:7px;justify-content:flex-end;padding-top:4px}.td-action-buttons button{padding:9px 12px;border-radius:2px;font:950 7px "Arial Narrow",Arial,sans-serif;letter-spacing:.05em}.td-action-cancel{border:1px solid #343a36;background:#101311;color:#a9b0aa}.td-action-submit{border:1px solid rgba(255,196,0,.45);background:rgba(255,196,0,.09);color:#ffc400}.td-action-submit.danger{border-color:rgba(255,92,92,.45);background:rgba(255,70,70,.08);color:#ff7373}.td-action-buttons button:not(:disabled){cursor:pointer}.td-action-buttons button:disabled{opacity:.55}
    `}</style>
  </div>;
}
