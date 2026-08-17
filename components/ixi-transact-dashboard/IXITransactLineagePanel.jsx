const clean=value=>String(value??"").trim();
const obj=value=>value&&typeof value==="object"&&!Array.isArray(value)?value:{};
const arr=value=>Array.isArray(value)?value:[];
const labelFor=key=>clean(key).replace(/([a-z0-9])([A-Z])/g,"$1 $2").replace(/[_.-]+/g," ").toUpperCase();
const scalar=value=>typeof value==="string"||typeof value==="number"||typeof value==="boolean";

function collectScalars(source={},prefix="",depth=0,out=[]){
 if(depth>2||out.length>=24)return out;
 for(const[key,value]of Object.entries(obj(source))){
  if(out.length>=24)break;
  if(value===null||value===undefined||value==="")continue;
  const path=prefix?`${prefix}.${key}`:key;
  if(scalar(value)){out.push({key:path,label:labelFor(path),value:String(value)});continue;}
  if(!Array.isArray(value)&&typeof value==="object")collectScalars(value,path,depth+1,out);
 }
 return out;
}

function normalizeLinks(lineage={}){
 const source=obj(lineage),candidates=[...arr(source.references),...arr(source.links),...arr(source.ancestors),...arr(source.sources),...arr(source.related)];
 const seen=new Set();
 return candidates.map((value,index)=>{const item=typeof value==="string"?{id:value}:obj(value);const id=clean(item.recordId||item.financialDocumentId||item.passportId||item.documentId||item.journalEntryId||item.id||item.externalId);const role=clean(item.role||item.type||item.relationship||item.kind)||"RELATED";const label=clean(item.label||item.name||item.title||id)||`RELATION ${index+1}`;return{id,role,label};}).filter(item=>{const key=`${item.role}|${item.id}|${item.label}`;if((!item.id&&!item.label)||seen.has(key))return false;seen.add(key);return true;}).slice(0,20);
}

export default function IXITransactLineagePanel({lineage={}}){
 const source=obj(lineage),fields=collectScalars(source).filter(field=>!/^references(\.|$)|^links(\.|$)|^ancestors(\.|$)|^sources(\.|$)|^related(\.|$)/i.test(field.key)),links=normalizeLinks(source);
 if(!fields.length&&!links.length)return null;
 return <section className="td-lineage-panel"><div className="td-lineage-head"><span>CANONICAL LINEAGE</span><strong>SOURCE → FINANCIAL TRUTH</strong></div>{fields.length?<div className="td-lineage-fields">{fields.map(field=><div key={field.key}><span>{field.label}</span><strong title={field.value}>{field.value}</strong></div>)}</div>:null}{links.length?<div className="td-lineage-links"><span>RELATED SOURCE CHAIN</span>{links.map((link,index)=><div key={`${link.role}-${link.id}-${index}`}><b>{link.role.toUpperCase()}</b><strong>{link.label}</strong>{link.id&&link.id!==link.label?<small>{link.id}</small>:null}</div>)}</div>:null}<style jsx global>{`.td-lineage-panel{margin-top:12px;border:1px solid #2c322e;background:#090c0a}.td-lineage-head{padding:8px 9px;border-bottom:1px solid #262b28;display:flex;align-items:center;justify-content:space-between;gap:10px}.td-lineage-head span,.td-lineage-links>span{font-size:6px;font-weight:950;letter-spacing:.14em;color:#69716b}.td-lineage-head strong{font:950 7px "Arial Narrow",Arial,sans-serif;color:#aeb5af}.td-lineage-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;background:#222724}.td-lineage-fields>div{min-width:0;padding:7px 8px;background:#0d100e;display:grid;gap:3px}.td-lineage-fields span{font-size:5.5px;font-weight:950;color:#666f68;letter-spacing:.06em}.td-lineage-fields strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:900 7px "Arial Narrow",Arial,sans-serif;color:#d9ddd9}.td-lineage-links{padding:8px;display:grid;gap:4px;border-top:1px solid #262b28}.td-lineage-links>span{margin-bottom:2px}.td-lineage-links>div{display:grid;grid-template-columns:70px minmax(0,1fr);gap:3px 8px;align-items:center;padding:6px 7px;border:1px solid #222724;background:#0b0e0c}.td-lineage-links b{grid-row:1/3;color:#ffc400;font-size:5.5px;letter-spacing:.08em}.td-lineage-links strong{font:900 7px "Arial Narrow",Arial,sans-serif;color:#d9ddd9;overflow:hidden;text-overflow:ellipsis}.td-lineage-links small{font-size:5.5px;color:#68706a;overflow:hidden;text-overflow:ellipsis}`}</style></section>;
}
