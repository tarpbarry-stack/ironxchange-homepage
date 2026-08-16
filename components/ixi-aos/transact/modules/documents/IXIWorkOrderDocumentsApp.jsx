import {useMemo,useRef,useState} from "react";
import IXIWorkOrderDocumentsStyles from "./IXIWorkOrderDocumentsStyles";

const clean=value=>String(value??"").trim();
const asArray=value=>Array.isArray(value)?value:[];

export const IXI_DOCUMENT_TYPES=Object.freeze(["photo","receipt","invoice","quote","report","other"]);

const COPY={
 en:{title:"DOCUMENTS",sub:"All documents related to this Work Order",machine:"Machine",wo:"Work Order",location:"Location",employee:"Employee",all:"ALL",photos:"PHOTOS",receipts:"RECEIPTS",invoices:"INVOICES",quotes:"QUOTES",reports:"REPORTS",other:"OTHER",total:"TOTAL DOCUMENTS",related:"RELATED TO",date:"DATE",added:"ADDED BY",actions:"ACTIONS",empty:"No documents match this view.",general:"ADD GENERAL DOCUMENT",generalSub:"Upload a document that belongs directly to this Work Order — not a specific transaction record.",accepted:"PDF, JPG, PNG, DOC, XLS, TXT · 25MB MAX",select:"SELECT FILE",add:"ADD GENERAL DOCUMENT",back:"BACK TO WORK",backSub:"Return to Work Order",view:"VIEW",download:"DOWNLOAD",replace:"REPLACE / ADD VERSION",link:"LINK TO RECORD",move:"MOVE TO…",remove:"REMOVE FROM WO",delete:"DELETE",about:"DOCUMENTS ARE ATTACHED WHERE THEY ORIGINATE AND AGGREGATED HERE.",fileRequired:"Select a file before adding a general document."},
 es:{title:"DOCUMENTOS",sub:"Todos los documentos relacionados con esta Orden de Trabajo",machine:"Máquina",wo:"Orden de Trabajo",location:"Ubicación",employee:"Empleado",all:"TODOS",photos:"FOTOS",receipts:"RECIBOS",invoices:"FACTURAS",quotes:"COTIZACIONES",reports:"REPORTES",other:"OTROS",total:"TOTAL DOCUMENTOS",related:"RELACIONADO CON",date:"FECHA",added:"AGREGADO POR",actions:"ACCIONES",empty:"No hay documentos para esta vista.",general:"AGREGAR DOCUMENTO GENERAL",generalSub:"Carga un documento que pertenece directamente a esta Orden de Trabajo, no a una transacción específica.",accepted:"PDF, JPG, PNG, DOC, XLS, TXT · MÁX. 25MB",select:"SELECCIONAR ARCHIVO",add:"AGREGAR DOCUMENTO GENERAL",back:"VOLVER AL TRABAJO",backSub:"Regresar a la Orden de Trabajo",view:"VER",download:"DESCARGAR",replace:"REEMPLAZAR / NUEVA VERSIÓN",link:"VINCULAR A REGISTRO",move:"MOVER A…",remove:"QUITAR DE OT",delete:"ELIMINAR",about:"LOS DOCUMENTOS SE ADJUNTAN DONDE SE ORIGINAN Y SE AGRUPAN AQUÍ.",fileRequired:"Selecciona un archivo antes de agregar un documento general."}
};

function normalizeType(value=""){
 const v=clean(value).toLowerCase();
 if(v.includes("photo")||v.includes("image"))return"photo";
 if(v.includes("receipt"))return"receipt";
 if(v.includes("invoice")||v.includes("bill"))return"invoice";
 if(v.includes("quote")||v.includes("estimate"))return"quote";
 if(v.includes("report")||v.includes("inspection")||v.includes("diagnostic"))return"report";
 return IXI_DOCUMENT_TYPES.includes(v)?v:"other";
}

export function normalizeIXIWorkOrderDocument(value={},index=0){
 const type=normalizeType(value.type||value.documentType||value.category);
 return{
  documentId:clean(value.documentId||value.id)||`DOC-${index+1}`,
  title:clean(value.title||value.fileName||value.name)||"Untitled document",
  fileName:clean(value.fileName||value.name||value.title)||"",
  issuer:clean(value.issuer||value.vendorLabel||value.vendor||value.sourceLabel),
  type,
  typeLabel:clean(value.typeLabel)||type.toUpperCase(),
  relatedType:clean(value.relatedType||value.relationship?.objectType||value.sourceType||"general"),
  relatedId:clean(value.relatedId||value.relationship?.recordId||value.sourceId),
  relatedLabel:clean(value.relatedLabel||value.relationship?.label),
  date:clean(value.date||value.documentDate||value.createdAt),
  addedBy:clean(value.addedBy||value.employeeLabel||value.createdBy),
  addedByInitials:clean(value.addedByInitials),
  url:clean(value.url||value.downloadUrl||value.fileUrl),
  mimeType:clean(value.mimeType),
  size:Number(value.size||0),
  version:Number(value.version||1),
  source:value
 };
}

export function getIXIWorkOrderDocumentCounts(documents=[]){
 const rows=asArray(documents).map(normalizeIXIWorkOrderDocument);
 return IXI_DOCUMENT_TYPES.reduce((out,type)=>({...out,[type]:rows.filter(row=>row.type===type).length}),{total:rows.length});
}

function initials(name=""){
 const words=clean(name).split(/\s+/).filter(Boolean);
 return words.slice(0,2).map(word=>word[0]?.toUpperCase()).join("")||"—";
}

function formatDate(value=""){
 if(!value)return"—";
 const d=new Date(value);
 if(Number.isNaN(d.getTime()))return value;
 return d.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"});
}

function typeIcon(type){
 if(type==="photo")return"▣";
 if(type==="receipt")return"▤";
 if(type==="invoice")return"$";
 if(type==="quote")return"≡";
 if(type==="report")return"✓";
 return"◇";
}

export default function IXIWorkOrderDocumentsApp({
 context={},
 workOrder={},
 documents=[],
 language="en",
 onLanguageChange=null,
 onBack=null,
 onDocumentAction=null,
 onAddGeneralDocument=null
}){
 const[lang,setLangLocal]=useState(language==="es"?"es":"en");
 const[filter,setFilter]=useState("all");
 const[openMenuId,setOpenMenuId]=useState("");
 const[selectedFile,setSelectedFile]=useState(null);
 const[notice,setNotice]=useState("");
 const fileInputRef=useRef(null);
 const t=COPY[lang];
 const primary=context.primary||{};
 const location=context.location||{};
 const actor=context.actor||{};
 const woNumber=clean(workOrder.identity?.number||workOrder.workOrderNumber||workOrder.number)||"WORK ORDER";
 const rows=useMemo(()=>asArray(documents).map(normalizeIXIWorkOrderDocument),[documents]);
 const counts=useMemo(()=>getIXIWorkOrderDocumentCounts(rows),[rows]);
 const visible=useMemo(()=>filter==="all"?rows:rows.filter(row=>row.type===filter),[rows,filter]);

 function setLanguage(next){setLangLocal(next);onLanguageChange?.(next)}
 function action(id,row){setOpenMenuId("");onDocumentAction?.(id,row,{workOrder,context});}
 async function addGeneral(){
  if(!selectedFile){setNotice(t.fileRequired);fileInputRef.current?.click();return;}
  const input={
   documentType:"other",
   title:selectedFile.name,
   fileName:selectedFile.name,
   mimeType:selectedFile.type,
   size:selectedFile.size,
   date:new Date().toISOString(),
   relationship:{objectType:"work-order",recordId:clean(workOrder.identity?.workOrderId)||woNumber,label:woNumber},
   relatedType:"general",
   relatedId:clean(workOrder.identity?.workOrderId)||woNumber,
   relatedLabel:woNumber,
   addedBy:clean(actor.displayName||actor.name||actor.label),
   file:selectedFile
  };
  await onAddGeneralDocument?.(input,{workOrder,context});
  setSelectedFile(null);setNotice("");
 }

 const filters=[
  ["all",t.all,counts.total],["photo",t.photos,counts.photo],["receipt",t.receipts,counts.receipt],
  ["invoice",t.invoices,counts.invoice],["quote",t.quotes,counts.quote],["report",t.reports,counts.report],["other",t.other,counts.other]
 ];

 return <div className="tx-docs">
  <div className="doc-lang"><button className={lang==="en"?"on":""} onClick={()=>setLanguage("en")}>ENG</button><i>/</i><button className={lang==="es"?"on":""} onClick={()=>setLanguage("es")}>ESP</button></div>
  <header className="doc-head"><div className="doc-head-icon">▤</div><div><strong>{t.title}</strong><small>{t.sub}</small></div></header>
  <div className="doc-context"><div><b>{primary.label||"—"}</b><small>{t.machine}</small></div><div><b>{woNumber}</b><small>{t.wo}</small></div><div><b>{location.label||"—"}</b><small>{t.location}</small></div><div><b>{actor.displayName||actor.name||actor.label||"—"}</b><small>{t.employee}</small></div></div>
  <div className="doc-doctrine">ⓘ {t.about}</div>
  <nav className="doc-tabs">{filters.map(([id,label,count])=><button key={id} className={filter===id?"on":""} onClick={()=>setFilter(id)}><span>{label}</span><b>{count}</b></button>)}</nav>
  <section className="doc-counts"><div className="total"><span>▤</span><small>{t.total}</small><strong>{counts.total}</strong></div><div><small>{t.photos}</small><b>{counts.photo}</b></div><div><small>{t.receipts}</small><b>{counts.receipt}</b></div><div><small>{t.invoices}</small><b>{counts.invoice}</b></div><div><small>{t.quotes}</small><b>{counts.quote}</b></div><div><small>{t.reports}</small><b>{counts.report}</b></div></section>
  <div className="doc-list-head"><span>{t.title}</span><span>{t.related}</span><span>{t.date}</span><span>⋮</span></div>
  <section className="doc-list">
   {visible.length?visible.map(row=><article className="doc-row" key={row.documentId}>
    <div className={`doc-type-icon ${row.type}`}>{typeIcon(row.type)}</div>
    <div className="doc-main"><strong>{row.fileName||row.title}</strong><small>{row.issuer||row.typeLabel}</small><em>{row.typeLabel}</em></div>
    <div className="doc-related"><b>{row.relatedType.toUpperCase()||"GENERAL"}</b><small>{row.relatedLabel||row.relatedId||`(${woNumber})`}</small></div>
    <div className="doc-date"><b>{formatDate(row.date)}</b><small>{row.addedBy||"—"}</small></div>
    <button className="doc-more" onClick={()=>setOpenMenuId(current=>current===row.documentId?"":row.documentId)}>⋮</button>
    {openMenuId===row.documentId?<div className="doc-menu">
     <button onClick={()=>action("view",row)}>◉ {t.view}</button><button onClick={()=>action("download",row)}>⇩ {t.download}</button><button onClick={()=>action("replace-version",row)}>⟳ {t.replace}</button><button onClick={()=>action("link-record",row)}>↗ {t.link}</button><button onClick={()=>action("move",row)}>⇢ {t.move}</button><button onClick={()=>action("remove-work-order",row)}>⊖ {t.remove}</button><button className="danger" onClick={()=>action("delete",row)}>⌫ {t.delete}</button>
    </div>:null}
   </article>):<div className="doc-empty">{t.empty}</div>}
  </section>
  <section className="doc-general"><div className="doc-upload-icon">⇧</div><div className="doc-general-copy"><strong>{t.general}</strong><p>{t.generalSub}</p><small>{selectedFile?selectedFile.name:t.accepted}</small></div><button onClick={()=>fileInputRef.current?.click()}>{t.select}</button><input ref={fileInputRef} type="file" accept="application/pdf,image/jpeg,image/png,.doc,.docx,.xls,.xlsx,.txt" onChange={e=>{setSelectedFile(e.target.files?.[0]||null);setNotice("")}}/></section>
  {notice?<div className="doc-notice">{notice}</div>:null}
  <footer className="doc-actions"><button className="back" onClick={()=>onBack?.()}><b>← {t.back}</b><small>{t.backSub}</small></button><button className="add" onClick={addGeneral}><b>＋ {t.add}</b></button></footer>
  <IXIWorkOrderDocumentsStyles/>
 </div>;
}
