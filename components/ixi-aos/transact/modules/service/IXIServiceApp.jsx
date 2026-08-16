import {useMemo,useState} from "react";
import {createIXIServiceDraft,validateIXIService} from "./IXIServiceContract";
import {createIXIServiceRecord} from "./IXIServiceCommands";
import IXIServiceStyles from "./IXIServiceStyles";
const clean=v=>String(v??"").trim();
const COPY={
  en:{title:"ADD SERVICE",machine:"Machine",workOrder:"Work Order",location:"Location",employee:"Employee",details:"SERVICE DETAILS",vendor:"SERVICE PROVIDER / VENDOR",description:"SERVICE DESCRIPTION",descriptionHelp:"Be specific about the service performed.",date:"SERVICE DATE",reference:"INVOICE / REFERENCE #",amount:"AMOUNT",currency:"CURRENCY",category:"SERVICE CATEGORY",serviceLocation:"SERVICE LOCATION (IF DIFFERENT)",document:"ATTACH INVOICE / DOCUMENT (OPTIONAL)",addDocument:"ADD DOCUMENT",documentSub:"PDF, JPG, PNG",notes:"NOTES (OPTIONAL)",notesPh:"Add any additional notes about this service...",cancel:"CANCEL",cancelSub:"Discard changes",save:"SAVE SERVICE",saveSub:"Return to Work Order",footer:"This service will be added to the work order and update service actuals.",required:"Vendor, service description, service date and amount are required.",hydraulic:"Hydraulic System",dealer:"Dealer Service",welding:"Welding",tires:"Tires",machineShop:"Machine Shop",inspection:"Outside Inspection",technology:"Technology / Diagnostics",other:"Other",shop:"Shop"},
  es:{title:"AGREGAR SERVICIO",machine:"Máquina",workOrder:"Orden de Trabajo",location:"Ubicación",employee:"Empleado",details:"DETALLES DEL SERVICIO",vendor:"PROVEEDOR DE SERVICIO / VENDEDOR",description:"DESCRIPCIÓN DEL SERVICIO",descriptionHelp:"Describe específicamente el servicio realizado.",date:"FECHA DEL SERVICIO",reference:"FACTURA / REFERENCIA #",amount:"IMPORTE",currency:"MONEDA",category:"CATEGORÍA DEL SERVICIO",serviceLocation:"UBICACIÓN DEL SERVICIO (SI ES DIFERENTE)",document:"ADJUNTAR FACTURA / DOCUMENTO (OPCIONAL)",addDocument:"AGREGAR DOCUMENTO",documentSub:"PDF, JPG, PNG",notes:"NOTAS (OPCIONAL)",notesPh:"Agrega notas adicionales sobre este servicio...",cancel:"CANCELAR",cancelSub:"Descartar cambios",save:"GUARDAR SERVICIO",saveSub:"Regresar a la Orden de Trabajo",footer:"Este servicio se agregará a la orden y actualizará los costos reales de servicio.",required:"Proveedor, descripción, fecha e importe son obligatorios.",hydraulic:"Sistema Hidráulico",dealer:"Servicio de Distribuidor",welding:"Soldadura",tires:"Llantas",machineShop:"Taller de Maquinado",inspection:"Inspección Externa",technology:"Tecnología / Diagnóstico",other:"Otro",shop:"Taller"}
};

export default function IXIServiceApp({context={},workOrder={},language="en",onLanguageChange=null,onCancel=null,onSave=null}){
  const[lang,setLangLocal]=useState(language==="es"?"es":"en"),t=COPY[lang];
  const today=new Date().toISOString().slice(0,10);
  const[vendorLabel,setVendorLabel]=useState("");
  const[description,setDescription]=useState("");
  const[serviceDate,setServiceDate]=useState(today);
  const[referenceNumber,setReferenceNumber]=useState("");
  const[amount,setAmount]=useState("");
  const[currency,setCurrency]=useState("USD");
  const[category,setCategory]=useState("hydraulic");
  const[serviceLocation,setServiceLocation]=useState("");
  const[hasDocument,setHasDocument]=useState(false);
  const[notes,setNotes]=useState("");
  const[errors,setErrors]=useState({});
  const[saving,setSaving]=useState(false);
  const primary=context.primary||{},actor=context.actor||{},location=context.location||{};
  const woNumber=clean(workOrder.identity?.number||workOrder.workOrderNumber||workOrder.number)||"WORK ORDER";
  const realWorkOrderId=clean(workOrder.identity?.workOrderId);
  const actorLabel=clean(actor.displayName||actor.name||actor.label)||"—";
  const input=useMemo(()=>({vendorLabel,description,serviceDate,referenceNumber,amount:Number(amount||0),currency,category,serviceLocation,notes,attachments:hasDocument?[{type:"service-invoice",status:"local-pending-upload"}]:[]}),[vendorLabel,description,serviceDate,referenceNumber,amount,currency,category,serviceLocation,notes,hasDocument]);
  function setLang(next){setLangLocal(next);onLanguageChange?.(next)}
  async function save(){const draft=createIXIServiceDraft({context,workOrder,input}),check=validateIXIService(draft);setErrors(check.errors);if(!check.valid)return;setSaving(true);try{let persisted=null;if(clean(primary.passportId)&&realWorkOrderId){persisted=await createIXIServiceRecord({object:{passportId:primary.passportId,objectType:primary.objectType,label:primary.label},context,workOrder,input,metadata:{source:"ixi-transact-work-order-service"}})}await onSave?.(persisted?.draft||draft,input,persisted?.response||null)}finally{setSaving(false)}}
  return <div className="tx-service">
    <div className="svc-lang"><button className={lang==="en"?"on":""} onClick={()=>setLang("en")}>ENG</button><span>/</span><button className={lang==="es"?"on":""} onClick={()=>setLang("es")}>ESP</button></div>
    <div className="svc-head"><div className="svc-icon">⌕</div><div className="svc-title"><strong>{t.title}</strong><div className="svc-context"><div><b>{primary.label||"—"}</b><small>{t.machine}</small></div><div><b>{woNumber}</b><small>{t.workOrder}</small></div><div><b>{location.label||"—"}</b><small>{t.location}</small></div><div><b>{actorLabel}</b><small>{t.employee}</small></div></div></div></div>
    <div className="svc-section">{t.details}</div>
    <label>{t.vendor} <em>*</em></label><div className="svc-field"><span>▣</span><input value={vendorLabel} onChange={e=>setVendorLabel(e.target.value)} placeholder={lang==="es"?"Soluciones Hidráulicas, LLC":"Hydraulic Solutions, LLC"}/></div>
    <label>{t.description} <em>*</em></label><div className="svc-field"><span>⌕</span><input value={description} onChange={e=>setDescription(e.target.value)} placeholder={lang==="es"?"Reconstrucción de bomba hidráulica":"Hydraulic Pump Rebuild"}/></div><div style={{margin:"3px 0 0 32px",color:"#858a86",fontSize:"6px"}}>{t.descriptionHelp}</div>
    <div className="svc-two"><div><label>{t.date} <em>*</em></label><div className="svc-field"><input type="date" value={serviceDate} onChange={e=>setServiceDate(e.target.value)}/></div></div><div><label>{t.reference}</label><div className="svc-field"><span>▤</span><input value={referenceNumber} onChange={e=>setReferenceNumber(e.target.value)} placeholder="INV-78451"/></div></div></div>
    <div className="svc-two"><div><label>{t.amount} <em>*</em></label><div className="svc-field svc-amount"><span>$</span><input inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00"/></div></div><div><label>{t.currency}</label><div className="svc-field"><select value={currency} onChange={e=>setCurrency(e.target.value)}><option>USD</option><option>CAD</option><option>MXN</option></select></div></div></div>
    <label>{t.category}</label><div className="svc-field"><span>☷</span><select value={category} onChange={e=>setCategory(e.target.value)}><option value="hydraulic">{t.hydraulic}</option><option value="dealer">{t.dealer}</option><option value="welding">{t.welding}</option><option value="tires">{t.tires}</option><option value="machine-shop">{t.machineShop}</option><option value="inspection">{t.inspection}</option><option value="technology">{t.technology}</option><option value="other">{t.other}</option></select></div>
    <label>{t.serviceLocation}</label><div className="svc-field"><span>⌖</span><input value={serviceLocation} onChange={e=>setServiceLocation(e.target.value)} placeholder={t.shop}/></div>
    <label>{t.document}</label><div className="svc-document"><button onClick={()=>setHasDocument(v=>!v)}>▤ {t.addDocument}<small>{hasDocument?(lang==="es"?"Documento adjunto":"Document attached"):t.documentSub}</small></button></div>
    <label>{t.notes}</label><textarea className="svc-notes" value={notes} onChange={e=>setNotes(e.target.value)} placeholder={t.notesPh}/>
    {Object.keys(errors).length?<div className="svc-errors">{t.required}</div>:null}
    <div className="svc-actions"><button onClick={()=>onCancel?.()} disabled={saving}>{t.cancel}<small>{t.cancelSub}</small></button><button className="save" onClick={save} disabled={saving}>{saving?"…":t.save}<small>{t.saveSub}</small></button></div>
    <div className="svc-foot">ⓘ {t.footer}</div><IXIServiceStyles/>
  </div>;
}
