import {useMemo,useState} from "react";
import {createIXIExpenseDraft,validateIXIExpense} from "./IXIExpenseContract";
import {createIXIExpense} from "./IXIExpenseCommands";
import IXIExpenseStyles from "./IXIExpenseStyles";

const clean=v=>String(v??"").trim();
const COPY={
  en:{title:"ADD EXPENSE",object:"Object",workOrder:"Work Order",location:"Location",employee:"Employee",details:"EXPENSE DETAILS",vendor:"VENDOR",vendorPh:"Vendor",bought:"WHAT DID YOU BUY?",boughtPh:"Description",amount:"AMOUNT",currency:"CURRENCY",category:"CATEGORY",selectCategory:"Select category",date:"EXPENSE DATE",payment:"PAYMENT METHOD",optional:"Optional",reference:"REFERENCE / RECEIPT #",receipt:"RECEIPT / PHOTO",receiptAttached:"RECEIPT PHOTO ATTACHED",addReceipt:"ADD PHOTO / RECEIPT",changeReceipt:"CHANGE / REMOVE RECEIPT",evidence:"Supporting evidence attached",cameraUpload:"Camera / upload",notes:"NOTES",notesPh:"Optional notes",required:"Vendor, description, amount and expense date are required.",cancel:"CANCEL",save:"SAVE EXPENSE",returnWo:"Return to Work Order",saving:"SAVING EXPENSE…"},
  es:{title:"AGREGAR GASTO",object:"Objeto",workOrder:"Orden de Trabajo",location:"Ubicación",employee:"Empleado",details:"DETALLES DEL GASTO",vendor:"PROVEEDOR",vendorPh:"Proveedor",bought:"¿QUÉ COMPRASTE?",boughtPh:"Descripción",amount:"IMPORTE",currency:"MONEDA",category:"CATEGORÍA",selectCategory:"Seleccionar categoría",date:"FECHA DEL GASTO",payment:"MÉTODO DE PAGO",optional:"Opcional",reference:"REFERENCIA / # DE RECIBO",receipt:"RECIBO / FOTO",receiptAttached:"FOTO DEL RECIBO ADJUNTA",addReceipt:"AGREGAR FOTO / RECIBO",changeReceipt:"CAMBIAR / QUITAR RECIBO",evidence:"Comprobante adjunto",cameraUpload:"Cámara / cargar",notes:"NOTAS",notesPh:"Notas opcionales",required:"Se requieren proveedor, descripción, importe y fecha del gasto.",cancel:"CANCELAR",save:"GUARDAR GASTO",returnWo:"Regresar a la Orden de Trabajo",saving:"GUARDANDO GASTO…"}
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
const PAYMENT_METHODS=[
  ["company-card","Company Card","Tarjeta de la Empresa"],
  ["personal-card","Personal Card","Tarjeta Personal"],
  ["cash","Cash","Efectivo"],
  ["account-terms","Account / Terms","Cuenta / Crédito"],
  ["other","Other","Otro"]
];

export default function IXIExpenseApp({context={},workOrder={},onCancel=null,onSave=null,language="",onLanguageChange=null}){
  const today=new Date().toISOString().slice(0,10);
  const[localLang,setLocalLang]=useState(language||"en");
  const lang=language||localLang;
  const t=COPY[lang]||COPY.en;
  const setLang=value=>{if(onLanguageChange)onLanguageChange(value);else setLocalLang(value)};
  const[vendor,setVendor]=useState(""),[description,setDescription]=useState(""),[amount,setAmount]=useState(""),[currency,setCurrency]=useState("USD"),[category,setCategory]=useState(""),[expenseDate,setExpenseDate]=useState(today),[paymentMethod,setPaymentMethod]=useState(""),[referenceNumber,setReferenceNumber]=useState(""),[notes,setNotes]=useState(""),[hasReceipt,setHasReceipt]=useState(false),[saving,setSaving]=useState(false),[errors,setErrors]=useState({});
  const primary=context.primary||{},actor=context.actor||{},location=context.location||{};
  const woNumber=clean(workOrder.identity?.number||workOrder.workOrderNumber||workOrder.number)||"WORK ORDER",realWorkOrderId=clean(workOrder.identity?.workOrderId);
  const locationLabel=clean(location.label||context.locationLabel)||"—",actorLabel=clean(actor.displayName||actor.name||actor.label)||"—";
  const input=useMemo(()=>({vendor,description,amount:Number(amount||0),currency,category,expenseDate,paymentMethod,referenceNumber,notes,attachments:hasReceipt?[{type:"receipt-photo",status:"local-pending-upload"}]:[]}),[vendor,description,amount,currency,category,expenseDate,paymentMethod,referenceNumber,notes,hasReceipt]);
  async function save(){const draft=createIXIExpenseDraft({context,workOrder,input}),check=validateIXIExpense(draft);setErrors(check.errors);if(!check.valid)return;setSaving(true);try{let persisted=null;if(clean(primary.passportId)&&realWorkOrderId){persisted=await createIXIExpense({object:{passportId:primary.passportId,objectType:primary.objectType,label:primary.label},context,workOrder,input,metadata:{source:"ixi-transact-work-order-expense"}})}await onSave?.(persisted?.draft||draft,input,persisted?.response||null)}finally{setSaving(false)}}
  return <div className="tx-expense">
    <div className="ex-lang"><button className={lang==="en"?"on":""} onClick={()=>setLang("en")}>ENG</button><i>/</i><button className={lang==="es"?"on":""} onClick={()=>setLang("es")}>ESP</button></div>
    <div className="ex-head"><div className="ex-icon">$</div><div className="ex-title"><strong>{t.title}</strong><div className="ex-context"><div><b>{primary.label||"—"}</b><small>{primary.objectType||t.object}</small></div><div><b>{woNumber}</b><small>{t.workOrder}</small></div><div><b>{locationLabel}</b><small>{t.location}</small></div><div><b>{actorLabel}</b><small>{t.employee}</small></div></div></div></div>
    <div className="ex-section">{t.details}</div>
    <label>{t.vendor} <em>*</em></label><div className="ex-field"><span>▱</span><input value={vendor} onChange={e=>setVendor(e.target.value)} placeholder={t.vendorPh}/></div>
    <label>{t.bought} <em>*</em></label><div className="ex-field"><span>◇</span><input value={description} onChange={e=>setDescription(e.target.value)} placeholder={t.boughtPh}/></div>
    <label>{t.amount} <em>*</em></label><div className="ex-two"><div className="ex-field ex-money"><span>$</span><input inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00"/></div><div className="ex-field"><select aria-label={t.currency} value={currency} onChange={e=>setCurrency(e.target.value)}><option>USD</option><option>CAD</option><option>MXN</option></select></div></div>
    <label>{t.category}</label><div className="ex-field"><span>☷</span><select value={category} onChange={e=>setCategory(e.target.value)}><option value="">{t.selectCategory}</option>{CATEGORIES.map(([value,en,es])=><option key={value} value={value}>{lang==="es"?es:en}</option>)}</select></div>
    <div className="ex-two"><div><label>{t.date} <em>*</em></label><div className="ex-field"><input type="date" value={expenseDate} onChange={e=>setExpenseDate(e.target.value)}/></div></div><div><label>{t.payment}</label><div className="ex-field"><select value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)}><option value="">{t.optional}</option>{PAYMENT_METHODS.map(([value,en,es])=><option key={value} value={value}>{lang==="es"?es:en}</option>)}</select></div></div></div>
    <label>{t.reference}</label><div className="ex-field"><span>#</span><input value={referenceNumber} onChange={e=>setReferenceNumber(e.target.value)} placeholder={t.optional}/></div>
    <label>{t.receipt}</label><div className={`ex-receipt ${hasReceipt?"has-photo":""}`}>{hasReceipt?<div className="receipt-preview">{t.receiptAttached}</div>:null}<button onClick={()=>setHasReceipt(v=>!v)}>▣ {hasReceipt?t.changeReceipt:t.addReceipt}<small>{hasReceipt?t.evidence:t.cameraUpload}</small></button></div>
    <label>{t.notes}</label><textarea className="ex-notes" value={notes} onChange={e=>setNotes(e.target.value)} placeholder={t.notesPh}/>
    {Object.keys(errors).length?<div className="ex-errors">{t.required}</div>:null}
    <div className="ex-actions"><button onClick={()=>onCancel?.()} disabled={saving}>{t.cancel}</button><button className="save" onClick={save} disabled={saving}>{t.save}<small>{t.returnWo}</small></button></div>
    {saving?<div className="ex-saving">{t.saving}</div>:null}<IXIExpenseStyles/>
  </div>;
}
