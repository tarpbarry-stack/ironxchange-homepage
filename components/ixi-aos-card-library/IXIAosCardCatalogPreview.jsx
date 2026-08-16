import {
  useEffect,
  useMemo,
  useState
} from "react";

import IXIAosCommandAwareObjectConsole from "../ixi-aos/console-runtime/IXIAosCommandAwareObjectConsole";
import IXIAosLocationObjectConsole from "../ixi-aos/console-runtime/IXIAosLocationObjectConsole";
import IXITransactObjectConsole from "../ixi-aos/transact/IXITransactObjectConsole";
import IXIAosCard004Personnel from "../ixi-aos/cards/004/IXIAosCard004Personnel";
import IXIAosCard005Personnel from "../ixi-aos/cards/005/IXIAosCard005Personnel";
import IXIAosCard006Personnel from "../ixi-aos/cards/006/IXIAosCard006Personnel";
import IXIAosCard007Employee from "../ixi-aos/cards/007/IXIAosCard007Employee";
import { adaptAosCardTemplate } from "../ixi-aos/card-runtime/IXIAosCardTemplateAdapter";

const clean = value => String(value || "").trim();
const FACE_SWITCHES = Object.freeze([
  { face: 1, icon: "▦", label: "OVERVIEW" },
  { face: 2, icon: "⚙", label: "OPERATIONS" },
  { face: 3, icon: "◔", label: "FINANCIAL" },
  { face: 4, icon: "▤", label: "EXPENSES" },
  { face: 5, icon: "⌕", label: "MAINT." }
]);

function previewObject(template = {}, sample = {}) {
  const fields = sample?.fields && typeof sample.fields === "object" ? sample.fields : {};
  return {
    objectId: clean(sample.objectId) || "aos-card-catalog-preview",
    entityId: clean(sample.entityId) || "aos-card-catalog-entity",
    objectType: clean(sample.objectType) || clean(template.baseObjectType) || "generic",
    templateType: clean(template.baseObjectType) || "generic",
    templateSlug: clean(template.templateSlug),
    templateVersion: Number(template.version || 1),
    templateNumber: Number(template.templateNumber || 0),
    displayName: clean(sample.displayName) || clean(template.label) || "AOS OBJECT",
    singularLabel: clean(sample.singularLabel),
    pluralLabel: clean(sample.pluralLabel),
    status: clean(sample.status) || "active",
    value: sample.value ?? null,
    currency: clean(sample.currency) || "USD",
    fields,
    fieldDefinitions: Array.isArray(template.fieldSchema)
      ? template.fieldSchema.map(item => ({ fieldId: clean(item.field || item.fieldId), label: clean(item.label), fieldType: clean(item.type) })).filter(item => item.fieldId)
      : [],
    relationships: Array.isArray(sample.relationships) ? sample.relationships : [],
    infrastructure: Array.isArray(sample.infrastructure) ? sample.infrastructure : [],
    media: Array.isArray(sample.media) ? sample.media : [],
    capabilities: { ...(template.capabilities || {}) },
    metadata: { source: "aos-card-catalog-preview", ...(sample.metadata || {}) }
  };
}

function resolveCatalogCardNumber(template = {}) {
  const direct = Number(template?.templateNumber || template?.metadata?.cardNumber || 0);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const match = clean(template?.templateSlug).match(/(?:^|[-_])(\d{3})(?:$|[-_])/);
  return match ? Number(match[1]) : 0;
}

export default function IXIAosCardCatalogPreview({ template=null, sampleData={}, projection=null, directItems=[], parentLabel="", skinId="ixi:skin:default", onSaveObject=null }) {
  const [state,setState]=useState({});
  const [face,setFace]=useState(1);
  const [f2skin,setF2skin]=useState("v12");
  const [financialMode,setFinancialMode]=useState("owned");
  const [transactOpen,setTransactOpen]=useState(false);
  const [previewObjectOverride,setPreviewObjectOverride]=useState(null);

  const baseObject=useMemo(()=>previewObject(template||{},sampleData),[template,sampleData]);
  useEffect(()=>{setPreviewObjectOverride(null);setTransactOpen(false);},[template?.templateSlug,sampleData]);
  const object=previewObjectOverride||baseObject;
  const definition=useMemo(()=>template?adaptAosCardTemplate({template,object}):null,[template,object]);

  if(!template)return <div className="preview-error">NO CARD SELECTED</div>;

  function update(id,patch={}){const key=clean(id)||object.objectId;setState(current=>({...current,[key]:{...(current[key]||{}),...patch}}));}
  async function savePreview(payload={}){const next=payload?.object&&typeof payload.object==="object"?payload.object:{...object,displayName:payload?.displayName??object.displayName,fields:payload?.fields??object.fields,media:payload?.media??object.media};setPreviewObjectOverride(next);await onSaveObject?.(payload);return next;}

  const current=state[object.objectId]||{};
  const slug=clean(template.templateSlug);
  const cardNumber=resolveCatalogCardNumber(template);
  const PersonnelCard=cardNumber===4||slug==="personnel-container-004"?IXIAosCard004Personnel:cardNumber===5||slug==="personnel-container-005"?IXIAosCard005Personnel:cardNumber===6||slug==="personnel-container-006"?IXIAosCard006Personnel:null;

  if(PersonnelCard){
    if(transactOpen)return <div className="native-card-preview"><IXITransactObjectConsole object={object} ixiState={current} onIxiStateChange={update} onClose={()=>setTransactOpen(false)}/><style jsx>{`.native-card-preview{position:relative;width:298px;height:471px}`}</style></div>;
    return <div className="native-card-preview"><PersonnelCard object={object} children={Array.isArray(directItems)?directItems:[]} onAddObject={()=>{}} onSaveObject={savePreview} onHideObject={()=>{}} onDeleteObject={()=>{}} onOpenConsole={()=>{}} onOpenTransact={()=>setTransactOpen(true)} onRecall={()=>{}} onBoard={()=>{}} onReturn={()=>{}} onExposeObject={()=>{}}/><style jsx>{`.native-card-preview{position:relative;width:298px;height:471px}`}</style></div>;
  }

  const isEmployee007=cardNumber===7||slug==="employee-basic-007"||clean(template?.metadata?.cardNumber)==="007";
  if(isEmployee007)return <div className="native-card-preview"><IXIAosCard007Employee object={object} onSaveObject={savePreview} onHideObject={()=>{}} onDeleteObject={()=>{}} onOpenConsole={()=>{}} onOpenTransact={()=>setTransactOpen(true)} onMessage={()=>{}} onCall={()=>{}} onEmail={()=>{}} onRecords={()=>{}} skinId="v12"/><style jsx>{`.native-card-preview{position:relative;width:298px;height:471px}`}</style></div>;

  const isLocation=["location-standard","location-standard-002","location-standard-003"].includes(slug);
  if(isLocation){
    const financialObject={...object,fields:{...(object.fields||{}),ownershipStatus:financialMode}};
    const consoleDepth=Math.max(1,Number(current?.consoleDepth||1));
    return <div className={`location-preview ${transactOpen?"transact-mode":"aos-mode"}`} style={{width:transactOpen?"298px":`${consoleDepth*298}px`}}>{!transactOpen?<><div className="face-switch">{FACE_SWITCHES.map(item=><button key={item.face} className={face===item.face?"active":""} onClick={()=>setFace(item.face)}><span>{item.icon}</span><b>F{item.face}</b><small>{item.label}</small></button>)}</div>{face===3||face===4?<div className="variant-switch"><button className={financialMode==="owned"?"active":""} onClick={()=>setFinancialMode("owned")}>{face===4?"F4-A · OWNED":"F3-A · OWNED"}</button><button className={financialMode==="leased"?"active":""} onClick={()=>setFinancialMode("leased")}>{face===4?"F4-B · LEASED":"F3-B · LEASED"}</button></div>:null}</>:null}<div className="console-stage">{transactOpen?<IXITransactObjectConsole object={financialObject} ixiState={current} onIxiStateChange={update} onClose={()=>setTransactOpen(false)}/>:<IXIAosLocationObjectConsole templateSlug={slug} object={financialObject} projection={projection} objects={Array.isArray(directItems)?directItems:[]} ixiState={current} onIxiStateChange={update} onSaveObject={savePreview} onAddObject={()=>{}} onHideObject={()=>{}} onDeleteObject={()=>{}} onRecall={()=>{}} onBoard={()=>{}} onReturn={()=>{}} onExposeObject={()=>{}} financialMode={financialMode} f2skin={f2skin} onF2SkinChange={setF2skin} primaryFace={face} onPrimaryFaceChange={setFace} onOpenTransact={()=>setTransactOpen(true)}/>}</div><style jsx>{`.location-preview{display:flex;flex-direction:column;gap:7px;overflow:visible}.face-switch{width:298px;height:35px;display:grid;grid-template-columns:repeat(5,1fr);gap:3px;padding:3px;border:1px solid #292d2b;border-radius:8px;background:#0d0f0e}.face-switch button{height:27px;display:grid;grid-template-columns:14px auto;grid-template-rows:12px 9px;align-items:center;justify-content:center;padding:2px 3px;border:1px solid transparent;border-radius:5px;background:transparent;color:#777}.face-switch button span{grid-row:1/3}.face-switch b{font-size:6px}.face-switch small{font-size:3.7px}.face-switch .active{border-color:rgba(255,196,0,.52);background:rgba(255,196,0,.07);color:#ffc400}.variant-switch{width:298px;display:grid;grid-template-columns:1fr 1fr;gap:3px}.variant-switch button{height:23px;border:1px solid #292d2b;border-radius:5px;background:#131514;color:#777;font-size:5px;font-weight:950}.variant-switch .active{border-color:rgba(255,196,0,.35);color:#ffc400}.console-stage{position:relative;display:flex;width:298px;height:471px;overflow:visible}`}</style></div>;
  }

  if(!definition)return <div className="preview-error">CARD DEFINITION FAILED</div>;
  return <div className="generic"><IXIAosCommandAwareObjectConsole object={object} objectId={object.objectId} projection={projection} objects={directItems} cardDefinition={definition} skinId={skinId} parentLabel={clean(parentLabel)||clean(template.librarySection)||"AOS"} ixiCardState={{}} updateIxiCardState={null} previewCardState={current} updatePreviewCardState={update} renderModule={null} studioEditing={false} selectedModuleId="" onSelectModule={null} onSelectFace={null} onCreateFace={null} enableCardScaling={false} cardScaleMode="xl"/></div>;
}
