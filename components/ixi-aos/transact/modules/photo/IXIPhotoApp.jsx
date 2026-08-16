import {useEffect,useMemo,useRef,useState} from "react";
import {createIXIPhotoDraft,validateIXIPhoto} from "./IXIPhotoContract";
import IXIPhotoStyles from "./IXIPhotoStyles";

const clean=value=>String(value??"").trim();
const COPY={
 en:{title:"ADD PHOTO",machine:"Machine",wo:"Work Order",location:"Location",employee:"Employee",details:"PHOTO DETAILS",type:"PHOTO TYPE",work:"WORK PHOTO",damage:"DAMAGE",before:"BEFORE / AFTER",reference:"REFERENCE",titleLabel:"PHOTO TITLE (OPTIONAL)",description:"DESCRIPTION (OPTIONAL)",date:"PHOTO DATE",time:"TIME",link:"LINK TO",photo:"PHOTO",take:"TAKE PHOTO / CHOOSE FROM GALLERY",takeSub:"JPG, PNG · MAX 10MB EACH",tags:"ADDITIONAL TAGS (OPTIONAL)",visibility:"VISIBILITY",team:"Work Order Team",cancel:"CANCEL",cancelSub:"Discard changes",save:"SAVE PHOTO",saveSub:"Return to Work Order",required:"Add at least one photo before saving.",foot:"Photos are linked to this Work Order and inherited AOS context, then surfaced in Activity and Documents."},
 es:{title:"AGREGAR FOTO",machine:"Máquina",wo:"Orden de Trabajo",location:"Ubicación",employee:"Empleado",details:"DETALLES DE FOTO",type:"TIPO DE FOTO",work:"FOTO DE TRABAJO",damage:"DAÑO",before:"ANTES / DESPUÉS",reference:"REFERENCIA",titleLabel:"TÍTULO DE FOTO (OPCIONAL)",description:"DESCRIPCIÓN (OPCIONAL)",date:"FECHA",time:"HORA",link:"VINCULAR A",photo:"FOTO",take:"TOMAR FOTO / ELEGIR DE GALERÍA",takeSub:"JPG, PNG · MÁX. 10MB CADA UNA",tags:"ETIQUETAS ADICIONALES (OPCIONAL)",visibility:"VISIBILIDAD",team:"Equipo de Orden de Trabajo",cancel:"CANCELAR",cancelSub:"Descartar cambios",save:"GUARDAR FOTO",saveSub:"Regresar a la Orden",required:"Agrega por lo menos una foto antes de guardar.",foot:"Las fotos se vinculan a esta Orden y al contexto AOS heredado, y aparecen en Actividad y Documentos."}
};

function createClientRequestId(){
 if(typeof globalThis!=="undefined"&&globalThis.crypto?.randomUUID)return `PHOTO-${globalThis.crypto.randomUUID()}`;
 return `PHOTO-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
}
function localDateTime(){const d=new Date();const offset=d.getTimezoneOffset()*60000;return new Date(d-offset).toISOString().slice(0,16)}

export default function IXIPhotoApp({context={},workOrder={},language="en",onLanguageChange=null,onCancel=null,onSave=null}){
 const[lang,setLang]=useState(language==="es"?"es":"en"),[photoType,setPhotoType]=useState("work-photo"),[title,setTitle]=useState(""),[description,setDescription]=useState(""),[occurredAtLocal,setOccurredAtLocal]=useState(localDateTime()),[tags,setTags]=useState(""),[files,setFiles]=useState([]),[errors,setErrors]=useState({}),[saving,setSaving]=useState(false);
 const inputRef=useRef(null),requestIdRef=useRef(createClientRequestId());
 const t=COPY[lang],primary=context.primary||{},location=context.location||{},actor=context.actor||{};
 const wo=clean(workOrder.identity?.number||workOrder.workOrderNumber||workOrder.number)||"WORK ORDER";
 const occurredAt=occurredAtLocal?new Date(occurredAtLocal).toISOString():new Date().toISOString();
 const media=useMemo(()=>files.map((entry,index)=>({mediaId:`${requestIdRef.current}-MEDIA-${index+1}`,fileName:entry.file.name,mimeType:entry.file.type,size:entry.file.size,previewUrl:entry.previewUrl,status:"local-pending-upload"})),[files]);
 const input=useMemo(()=>({clientRequestId:requestIdRef.current,photoType,title,description,occurredAt,tags,visibility:"work-order-team",media}),[photoType,title,description,occurredAt,tags,media]);
 const draft=useMemo(()=>createIXIPhotoDraft({context,workOrder,input}),[context,workOrder,input]);

 useEffect(()=>()=>{files.forEach(entry=>{try{URL.revokeObjectURL(entry.previewUrl)}catch{}})},[files]);
 function choose(nextFiles){
  const accepted=Array.from(nextFiles||[]).filter(file=>file.type.startsWith("image/")&&file.size<=10*1024*1024);
  setFiles(current=>[...current,...accepted.map(file=>({file,previewUrl:URL.createObjectURL(file)}))]);setErrors({});
 }
 function remove(index){setFiles(current=>{const target=current[index];if(target?.previewUrl)URL.revokeObjectURL(target.previewUrl);return current.filter((_,i)=>i!==index)});}
 async function save(){
  if(saving)return;const next=createIXIPhotoDraft({context,workOrder,input}),check=validateIXIPhoto(next);setErrors(check.errors);if(!check.valid)return;
  setSaving(true);try{await onSave?.(next,{...input,files:files.map(entry=>entry.file)},null)}finally{setSaving(false)}
 }
 const dateValue=occurredAtLocal.slice(0,10),timeValue=occurredAtLocal.slice(11,16);
 return <div className="tx-photo">
  <div className="ph-lang"><button className={lang==="en"?"on":""} onClick={()=>{setLang("en");onLanguageChange?.("en")}}>ENG</button><i>/</i><button className={lang==="es"?"on":""} onClick={()=>{setLang("es");onLanguageChange?.("es")}}>ESP</button></div>
  <div className="ph-head"><div className="ph-icon">▣</div><div className="ph-title"><strong>{t.title}</strong><div className="ph-context"><div><b>{primary.label||"—"}</b><small>{t.machine}</small></div><div><b>{wo}</b><small>{t.wo}</small></div><div><b>{location.label||"—"}</b><small>{t.location}</small></div><div><b>{actor.displayName||actor.name||actor.label||"—"}</b><small>{t.employee}</small></div></div></div></div>
  <div className="ph-section">{t.details}</div>
  <label>{t.type} <em>*</em></label><div className="ph-types"><button className={photoType==="work-photo"?"on":""} onClick={()=>setPhotoType("work-photo")}>{t.work}</button><button className={photoType==="damage"?"on":""} onClick={()=>setPhotoType("damage")}>{t.damage}</button><button className={photoType==="before-after"?"on":""} onClick={()=>setPhotoType("before-after")}>{t.before}</button><button className={photoType==="reference"?"on":""} onClick={()=>setPhotoType("reference")}>{t.reference}</button></div>
  <label>{t.titleLabel}</label><div className="ph-field"><span>▤</span><input value={title} onChange={e=>setTitle(e.target.value)} maxLength={120}/></div>
  <label>{t.description}</label><textarea className="ph-notes" value={description} onChange={e=>setDescription(e.target.value)} maxLength={500}/>
  <div className="ph-two"><div><label>{t.date}</label><div className="ph-field locked"><input type="date" value={dateValue} onChange={e=>setOccurredAtLocal(`${e.target.value}T${timeValue||"00:00"}`)}/></div></div><div><label>{t.time}</label><div className="ph-field locked"><input type="time" value={timeValue} onChange={e=>setOccurredAtLocal(`${dateValue}T${e.target.value}`)}/></div></div></div>
  <label>{t.link}</label><div className="ph-field locked"><span>▤</span><input readOnly value={wo}/></div>
  <label>{t.photo} <em>*</em></label><div className="ph-upload">{files.length?<div className="ph-previews">{files.map((entry,index)=><div className="ph-preview" key={`${entry.file.name}-${index}`}><img src={entry.previewUrl} alt=""/><button type="button" onClick={()=>remove(index)}>×</button></div>)}</div>:null}<button className="ph-pick" type="button" onClick={()=>inputRef.current?.click()}>▣ {t.take}<small>{t.takeSub}</small></button><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" multiple onChange={e=>{choose(e.target.files);e.target.value=""}}/></div>
  <label>{t.tags}</label><div className="ph-field"><span>◇</span><input value={tags} onChange={e=>setTags(e.target.value)} placeholder="hydraulic, leak, inspection"/></div>
  <label>{t.visibility}</label><div className="ph-policy"><span>◉</span><b>{t.team}</b></div>
  {errors.media?<div className="ph-errors">{t.required}</div>:null}
  <div className="ph-actions"><button type="button" onClick={()=>onCancel?.()} disabled={saving}>{t.cancel}<small>{t.cancelSub}</small></button><button type="button" className="save" onClick={save} disabled={saving}>{t.save}<small>{t.saveSub}</small></button></div>
  <div className="ph-foot">ⓘ {t.foot}</div><IXIPhotoStyles/>
 </div>;
}
