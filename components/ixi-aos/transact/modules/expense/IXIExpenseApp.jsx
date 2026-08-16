import {useEffect,useMemo,useRef,useState} from "react";
import {createIXIExpenseDraft,validateIXIExpense} from "./IXIExpenseContract";
import {createIXIExpense} from "./IXIExpenseCommands";
import IXIExpenseStyles from "./IXIExpenseStyles";

const clean=value=>String(value??"").trim();
const COPY={
 en:{title:"ADD EXPENSE",sub:"Record a business expense",location:"Location",employee:"Employee",today:"Today",currency:"Currency",vendor:"VENDOR / MERCHANT",bought:"WHAT DID YOU BUY?",amount:"AMOUNT",paid:"PAID WITH",companyCard:"COMPANY CARD",companyCash:"COMPANY CASH",myMoney:"MY MONEY",other:"OTHER",category:"EXPENSE CATEGORY",date:"EXPENSE DATE",reference:"REFERENCE / RECEIPT NUMBER",workOrder:"WORK ORDER",machine:"ORIGINATING OBJECT",notes:"NOTES",receipt:"RECEIPT / PHOTO",addReceipt:"Tap to add photo or receipt",receiptPolicy:"Receipts Optional",save:"SAVE EXPENSE",saveSub:"Record this expense",clear:"CLEAR",recorded:"EXPENSE RECORDED",returning:"Returning to",reimbursement:"REIMBURSEMENT OWED",required:"Complete the required fields before saving.",saveError:"Expense could not be recorded. Nothing was added. Try again.",remove:"Remove receipt"},
 es:{title:"AGREGAR GASTO",sub:"Registrar un gasto comercial",location:"Ubicación",employee:"Empleado",today:"Hoy",currency:"Moneda",vendor:"PROVEEDOR / COMERCIO",bought:"¿QUÉ COMPRASTE?",amount:"IMPORTE",paid:"PAGADO CON",companyCard:"TARJETA EMPRESA",companyCash:"EFECTIVO EMPRESA",myMoney:"MI DINERO",other:"OTRO",category:"CATEGORÍA",date:"FECHA DEL GASTO",reference:"REFERENCIA / NÚMERO DE RECIBO",workOrder:"ORDEN DE TRABAJO",machine:"OBJETO DE ORIGEN",notes:"NOTAS",receipt:"RECIBO / FOTO",addReceipt:"Toca para agregar foto o recibo",receiptPolicy:"Recibos Opcionales",save:"GUARDAR GASTO",saveSub:"Registrar este gasto",clear:"LIMPIAR",recorded:"GASTO REGISTRADO",returning:"Regresando a",reimbursement:"REEMBOLSO PENDIENTE",required:"Completa los campos requeridos antes de guardar.",saveError:"No se pudo registrar el gasto. No se agregó nada. Intenta de nuevo.",remove:"Quitar recibo"}
};
const CATEGORIES=[
 ["parts-fittings","Parts / Fittings","Partes / Conexiones"],
 ["supplies","Supplies","Suministros"],
 ["fuel","Fuel","Combustible"],
 ["outside-service","Outside Service","Servicio Externo"],
 ["rental","Rental","Renta"],
 ["travel","Travel","Viaje"],
 ["other","Other","Otro"]
];
const MAX_RECEIPT_BYTES=10*1024*1024;

function requestId(){
 if(typeof globalThis!=="undefined"&&globalThis.crypto?.randomUUID)return `EXP-${globalThis.crypto.randomUUID()}`;
 return `EXP-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
}
function today(){return new Date().toISOString().slice(0,10)}
function receiptRequiredByPolicy(policy={},amount=0){
 const mode=clean(policy?.mode||policy?.receiptPolicy||"optional").toLowerCase();
 if(mode==="required")return true;
 if(mode==="required-above"||mode==="threshold")return Number(amount||0)>=Number(policy?.threshold||policy?.receiptThreshold||0);
 return false;
}

export default function IXIExpenseApp({context={},workOrder=null,onCancel=null,onSave=null,language="",onLanguageChange=null,expensePolicy=null}){
 const[localLang,setLocalLang]=useState(language||"en"),[vendor,setVendor]=useState(""),[description,setDescription]=useState(""),[amount,setAmount]=useState(""),[category,setCategory]=useState(""),[expenseDate,setExpenseDate]=useState(today()),[paymentMethod,setPaymentMethod]=useState("company-card"),[referenceNumber,setReferenceNumber]=useState(""),[notes,setNotes]=useState(""),[receipt,setReceipt]=useState(null),[errors,setErrors]=useState({}),[saving,setSaving]=useState(false),[saved,setSaved]=useState(null),[saveError,setSaveError]=useState("");
 const fileRef=useRef(null),requestRef=useRef(requestId()),returnTimerRef=useRef(null);
 const lang=language||localLang,t=COPY[lang]||COPY.en;
 const setLang=value=>{if(onLanguageChange)onLanguageChange(value);else setLocalLang(value)};
 const primary=context.primary||{},actor=context.actor||{},location=context.location||{};
 const originLabel=clean(primary.label)||"AOS OBJECT",locationLabel=clean(location.label||context.locationLabel)||originLabel,actorLabel=clean(actor.displayName||actor.name||actor.label)||"—";
 const woNumber=clean(workOrder?.identity?.number||workOrder?.workOrderNumber||workOrder?.number);
 const policy=expensePolicy||context?.expensePolicy||context?.policies?.expense||{};
 const receiptRequired=receiptRequiredByPolicy(policy,Number(amount||0));
 const attachment=receipt?{type:"receipt-photo",fileName:receipt.file.name,mimeType:receipt.file.type,size:receipt.file.size,status:"local-pending-upload"}:null;
 const input=useMemo(()=>({clientRequestId:requestRef.current,vendor,description,amount:Number(amount||0),currency:"USD",category,expenseDate,paymentMethod,referenceNumber,notes,receiptRequired,attachments:attachment?[attachment]:[]}),[vendor,description,amount,category,expenseDate,paymentMethod,referenceNumber,notes,receiptRequired,attachment?.fileName,attachment?.mimeType,attachment?.size]);

 useEffect(()=>()=>{if(returnTimerRef.current)clearTimeout(returnTimerRef.current);if(receipt?.previewUrl)URL.revokeObjectURL(receipt.previewUrl)},[receipt]);

 function clearForm(){
  if(saving)return;
  if(receipt?.previewUrl)URL.revokeObjectURL(receipt.previewUrl);
  setVendor("");setDescription("");setAmount("");setCategory("");setExpenseDate(today());setPaymentMethod("company-card");setReferenceNumber("");setNotes("");setReceipt(null);setErrors({});setSaveError("");setSaved(null);requestRef.current=requestId();
 }
 function chooseReceipt(files){
  const file=Array.from(files||[])[0];if(!file)return;
  if(!["image/jpeg","image/png","image/webp","application/pdf"].includes(file.type)||file.size>MAX_RECEIPT_BYTES){setErrors(current=>({...current,receipt:"Receipt must be PDF/JPG/PNG/WEBP and 10MB or less"}));return;}
  if(receipt?.previewUrl)URL.revokeObjectURL(receipt.previewUrl);
  setReceipt({file,previewUrl:file.type.startsWith("image/")?URL.createObjectURL(file):""});setErrors(current=>{const next={...current};delete next.receipt;return next});
 }
 function removeReceipt(){if(receipt?.previewUrl)URL.revokeObjectURL(receipt.previewUrl);setReceipt(null)}
 async function save(){
  if(saving||saved)return;
  const draft=createIXIExpenseDraft({context,workOrder:workOrder||{},input}),check=validateIXIExpense(draft);setErrors(check.errors);setSaveError("");if(!check.valid)return;
  setSaving(true);
  try{
   const persisted=await createIXIExpense({object:{passportId:primary.passportId,objectId:primary.objectId||primary.id,objectType:primary.objectType,label:primary.label},context,workOrder:workOrder||{},input,commandId:requestRef.current,idempotencyKey:requestRef.current,metadata:{source:woNumber?"ixi-transact-work-order-expense":"ixi-transact-object-expense",launchSource:"aos-object-toolbar-dollar"}});
   const result=persisted?.draft||draft;
   const response=persisted?.response||null;
   const returnedId=clean(response?.document?.identity?.documentId||response?.expenseId||response?.id||result?.identity?.expenseId);
   const displayId=returnedId||`EXP-${String(Date.now()).slice(-4)}`;
   const committed={...result,identity:{...(result.identity||{}),expenseId:returnedId||result.identity?.expenseId,number:displayId}};
   setSaved({id:displayId,draft:committed,response});
   await new Promise(resolve=>{returnTimerRef.current=setTimeout(resolve,1050)});
   await onSave?.(committed,{...input,files:receipt?[receipt.file]:[]},response);
  }catch(error){setSaveError(clean(error?.message)||t.saveError)}finally{setSaving(false)}
 }

 const policyLabel=receiptRequired?"Receipt Required":clean(policy?.label)||t.receiptPolicy;
 return <div className="tx-expense">
  <div className="ex-lang"><button className={lang==="en"?"on":""} onClick={()=>setLang("en")}>ENG</button><i>/</i><button className={lang==="es"?"on":""} onClick={()=>setLang("es")}>ESP</button></div>
  <div className="ex-head"><div className="ex-icon">$</div><div className="ex-title"><strong>{t.title}</strong><small>{t.sub}</small></div></div>
  <div className="ex-context-row"><div><b>⌖ {locationLabel}</b><small>{t.location}</small></div><div><b>● {actorLabel}</b><small>{t.employee}</small></div><div><b>▣ {t.today}</b><small>{expenseDate}</small></div><div><b>$ USD</b><small>{t.currency}</small></div></div>

  <label>{t.vendor} <em>*</em></label><div className={`ex-field ${errors.vendor?"bad":""}`}><input value={vendor} onChange={e=>setVendor(e.target.value)} placeholder="Hydraulic Supply Co."/><button type="button" className="field-x" onClick={()=>setVendor("")}>×</button></div>
  <label>{t.bought} <em>*</em></label><div className={`ex-field ${errors.description?"bad":""}`}><input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Hydraulic fittings – 1/2 in NPT"/><button type="button" className="field-x" onClick={()=>setDescription("")}>×</button></div>

  <div className="ex-amount-pay"><div><label>{t.amount} <em>*</em></label><div className={`ex-field ex-money ${errors.amount?"bad":""}`}><span>$</span><input inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00"/></div></div><div><label>{t.paid} <em>*</em></label><div className={`ex-paid ${errors.paymentMethod?"bad":""}`}><button className={paymentMethod==="company-card"?"on":""} onClick={()=>setPaymentMethod("company-card")}>{t.companyCard}</button><button className={paymentMethod==="company-cash"?"on":""} onClick={()=>setPaymentMethod("company-cash")}>{t.companyCash}</button><button className={paymentMethod==="my-money"?"on":""} onClick={()=>setPaymentMethod("my-money")}>{t.myMoney}</button><button className={paymentMethod==="other"?"on":""} onClick={()=>setPaymentMethod("other")}>{t.other}</button></div></div></div>
  {paymentMethod==="my-money"?<div className="ex-reimbursement">↻ {t.reimbursement} · {actorLabel} · ${Number(amount||0).toFixed(2)}</div>:null}

  <div className="ex-two"><div><label>{t.category} <em>*</em></label><div className={`ex-field ${errors.category?"bad":""}`}><select value={category} onChange={e=>setCategory(e.target.value)}><option value="">Select category</option>{CATEGORIES.map(([value,en,es])=><option key={value} value={value}>{lang==="es"?es:en}</option>)}</select></div></div><div><label>{t.date} <em>*</em></label><div className={`ex-field ${errors.expenseDate?"bad":""}`}><input type="date" value={expenseDate} onChange={e=>setExpenseDate(e.target.value)}/></div></div></div>
  <label>{t.reference}</label><div className="ex-field"><input value={referenceNumber} onChange={e=>setReferenceNumber(e.target.value)} placeholder="Optional"/><button type="button" className="field-x" onClick={()=>setReferenceNumber("")}>×</button></div>
  <div className="ex-two"><div><label>{t.workOrder}</label><div className="ex-locked">{woNumber||"—"}</div></div><div><label>{t.machine}</label><div className="ex-locked">{originLabel}</div></div></div>
  <label>{t.notes}</label><textarea className="ex-notes" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Optional notes"/>

  <label>{t.receipt}{receiptRequired?" *":""}</label><div className={`ex-upload ${errors.receipt?"bad":""}`}>{receipt?<div className="receipt-card">{receipt.previewUrl?<img src={receipt.previewUrl} alt="Receipt preview"/>:<div className="pdf-receipt">PDF</div>}<span>{receipt.file.name}</span><button type="button" onClick={removeReceipt} aria-label={t.remove}>×</button></div>:null}<button type="button" className="upload-pick" onClick={()=>fileRef.current?.click()}>⇧ <span>{t.addReceipt}<small>PDF, JPG, PNG, WEBP · MAX 10MB</small></span></button><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" capture="environment" onChange={e=>{chooseReceipt(e.target.files);e.target.value=""}}/></div>

  {(Object.keys(errors).length&&!saved)?<div className="ex-errors">{t.required}</div>:null}{saveError?<div className="ex-errors server">{saveError}</div>:null}
  <div className="ex-actions"><button className="save" onClick={save} disabled={saving||Boolean(saved)}>▣ <span>{saving?"SAVING…":t.save}<small>{t.saveSub}</small></span></button><button onClick={clearForm} disabled={saving}>↻ {t.clear}</button></div>
  {saved?<div className="ex-success"><b>✓</b><div><strong>{t.recorded}</strong><span>${Number(saved.draft?.expense?.amount||0).toFixed(2)} · {clean(saved.draft?.expense?.vendor).toUpperCase()}</span><small>{saved.id}</small><em>{t.returning} {woNumber||originLabel}…</em></div></div>:null}
  <div className="ex-policy">* Required fields <i/> Company Policy: {policyLabel} <i/> Expense Approval: {clean(policy?.approval)||"OFF"}</div>
  <IXIExpenseStyles/>
 </div>;
}
