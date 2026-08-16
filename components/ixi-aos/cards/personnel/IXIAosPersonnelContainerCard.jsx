import { useMemo, useState } from "react";
import IXICollectionThumbRail from "../../../ixi-object-system/IXICollectionThumbRail";
import IXIAosCardHeaderControls from "../../card-runtime/modules/IXIAosCardHeaderControls";

const clean=v=>String(v??"").trim();
const arr=v=>Array.isArray(v)?v:[];
const lower=v=>clean(v).toLowerCase();
const idOf=o=>clean(o?.objectId||o?.id);
const fieldsOf=o=>(o?.fields&&typeof o.fields==="object")?o.fields:{};
const metaOf=o=>(o?.metadata&&typeof o.metadata==="object")?o.metadata:{};
const imageOf=o=>clean(o?.media?.[0]?.url||o?.media?.[0]?.src||o?.image||fieldsOf(o).photoUrl);
const nameOf=o=>clean(o?.displayName||o?.label||fieldsOf(o).displayName||fieldsOf(o).name)||"PERSON";

function statusOf(o){return lower(fieldsOf(o).employmentStatus||o?.status||metaOf(o).employmentStatus||"active");}
function deptOf(o){return clean(fieldsOf(o).department||metaOf(o).department||"UNASSIGNED").toUpperCase();}
function employeeNo(o){return clean(fieldsOf(o).employeeNumber||fieldsOf(o).employeeId||metaOf(o).employeeNumber||idOf(o));}
function capabilitiesOf(o){const f=fieldsOf(o),m=metaOf(o);return [...arr(o?.capabilities),...arr(f.capabilities),...arr(f.skills),...arr(f.certifications),...arr(m.capabilities)].map(x=>typeof x==="string"?x:clean(x?.label||x?.name||x?.type)).filter(Boolean);}
function countMap(values){return values.reduce((out,v)=>{const k=clean(v).toUpperCase();if(k)out[k]=(out[k]||0)+1;return out;},{});}
function topEntries(map,limit=5){return Object.entries(map).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,limit);}
function relValue(object,keys,fallback="—"){const rels=arr(object?.relationships);for(const key of keys){const hit=rels.find(r=>lower(r?.label||r?.type||r?.relationshipType).includes(key));if(hit)return clean(hit.value||hit.displayName||hit.label)||fallback;}const f=fieldsOf(object);for(const key of keys){if(clean(f[key]))return clean(f[key]);}return fallback;}

function Section({title,children,className=""}){return <section className={`pc-section ${className}`}><h3>{title}</h3>{children}</section>}
function CommandStrip({object,onRecall,onBoard,onReturn}){return <div className="pc-commands"><button onClick={e=>{e.stopPropagation();onRecall?.(object)}}>↻ <b>RECALL</b></button><button onClick={e=>{e.stopPropagation();onBoard?.(object)}}>▦ <b>BOARD</b></button><button onClick={e=>{e.stopPropagation();onReturn?.(object)}}>↩ <b>RETURN</b></button></div>}
function Bar({label,value,max}){const pct=max?Math.max(4,Math.round(value/max*100)):0;return <div className="pc-bar"><span>{label}</span><i><em style={{width:`${pct}%`}}/></i><b>{value}</b></div>}

export default function IXIAosPersonnelContainerCard({variant=1,object={},children=[],onAddObject,onEdit,onHideObject,onDeleteObject,onOpenConsole,onRecall,onBoard,onReturn,onExposeObject}){
 const people=useMemo(()=>arr(children).filter(Boolean),[children]);
 const [activeIndex,setActiveIndex]=useState(0);
 const total=people.length;
 const statuses=countMap(people.map(statusOf));
 const active=(statuses.ACTIVE||statuses.WORKING||0);
 const offDuty=(statuses["OFF DUTY"]||statuses.OFF_DUTY||statuses.INACTIVE||0);
 const onLeave=(statuses["ON LEAVE"]||statuses.LEAVE||0);
 const terminated=statuses.TERMINATED||0;
 const departments=countMap(people.map(deptOf));
 const deptRows=topEntries(departments,6);
 const capabilityMap=countMap(people.flatMap(capabilitiesOf));
 const capRows=topEntries(capabilityMap,6);
 const maxCap=Math.max(1,...capRows.map(x=>x[1]));
 const openJobs=Number(fieldsOf(object).openJobs??metaOf(object).openJobs??0)||0;
 const teams=Number(fieldsOf(object).teams??fieldsOf(object).crews??metaOf(object).teams??0)||0;
 const title=nameOf(object);
 const eyebrow=clean(fieldsOf(object).containerLabel||object?.pluralLabel||metaOf(object).pluralLabel)||"EMPLOYEES";
 const location=relValue(object,["location","yard"],clean(fieldsOf(object).location)||"—");
 const company=relValue(object,["company","employer"],clean(fieldsOf(object).company)||"—");
 return <div className={`ixi-personnel-container pc-v${variant}`}>
  <header className="pc-head"><div><span>⚙ {eyebrow}</span><strong>{title}</strong></div><IXIAosCardHeaderControls canAdd canEdit onAdd={()=>onAddObject?.(object)} onToggleEdit={()=>onEdit?.(object)} onHide={onHideObject} onDelete={onDeleteObject} onOpenConsole={onOpenConsole}/></header>
  <main>
   {variant===1?<>
    <div className="pc-hero"><div className="people-mark">●●●</div><div><small>TOTAL PEOPLE</small><strong>{total}</strong></div><div className="hero-status"><span>ACTIVE <b>{active}</b></span><span>OFF DUTY <b>{offDuty}</b></span></div></div>
    <Section title="WORKFORCE SUMMARY"><div className="summary-grid">{deptRows.slice(0,5).map(([k,v])=><div key={k}><span>{k}</span><b>{v}</b></div>)}</div></Section>
    <Section title="CAPABILITY OVERVIEW">{capRows.slice(0,5).map(([k,v])=><Bar key={k} label={k} value={v} max={maxCap}/>)}</Section>
   </>:null}
   {variant===2?<>
    <div className="pc-kpis"><div><small>♟ TOTAL PEOPLE</small><b>{total}</b></div><div><small>● ACTIVE</small><b>{active}</b></div><div><small>● OFF DUTY</small><b>{offDuty}</b></div><div><small>▣ OPEN JOBS</small><b>{openJobs}</b></div></div>
    <Section title="DEPARTMENT BREAKDOWN">{deptRows.slice(0,5).map(([k,v])=><Bar key={k} label={k} value={v} max={Math.max(1,total)}/>)}</Section>
    <Section title="CAPABILITIES AT A GLANCE"><div className="cap-tiles">{capRows.slice(0,5).map(([k,v])=><div key={k}><span>◆</span><small>{k}</small><b>{v}</b></div>)}</div></Section>
   </>:null}
   {variant===3?<>
    <Section title="WORKFORCE STATUS"><div className="status-tiles"><div><span>♟</span><small>ACTIVE</small><b>{active}</b></div><div><span>♟</span><small>OFF DUTY</small><b>{offDuty}</b></div><div><span>▦</span><small>ON LEAVE</small><b>{onLeave}</b></div><div><span>♟</span><small>TERMINATED</small><b>{terminated}</b></div></div></Section>
    <Section title="QUICK ACCESS"><div className="quick-tiles">{deptRows.slice(0,6).map(([k,v])=><button key={k}><span>◆</span><small>{k}</small><b>{v}</b></button>)}</div></Section>
    <Section title="KEY CAPABILITIES"><div className="cap-two">{capRows.slice(0,6).map(([k,v])=><Bar key={k} label={k} value={v} max={maxCap}/>)}</div></Section>
   </>:null}
   <Section title="RELATIONSHIPS & INFRASTRUCTURE" className="relationships"><div className="rel-row"><span>◆ LOCATION</span><b>{location}</b><i>›</i></div><div className="rel-row"><span>▦ COMPANY</span><b>{company}</b><i>›</i></div><div className="rel-row"><span>▣ OPEN JOBS</span><b>{openJobs}</b><i>›</i></div><div className="rel-row"><span>♟ TEAMS / CREWS</span><b>{teams}</b><i>›</i></div></Section>
  </main>
  <CommandStrip object={object} onRecall={onRecall} onBoard={onBoard} onReturn={onReturn}/>
  <div className="pc-rail"><IXICollectionThumbRail items={people} activeItemIndex={Math.min(activeIndex,Math.max(0,total-1))} getItemId={idOf} getItemImage={imageOf} getItemLabel={p=>`${nameOf(p)} · ${employeeNo(p)}`} onSelectItem={(item,index)=>{setActiveIndex(index);onExposeObject?.(item)}}/></div>
  <div className="pc-machine-rail">IXI MACHINE RAIL</div>
  <style jsx>{`
   .ixi-personnel-container,.ixi-personnel-container *{box-sizing:border-box}.ixi-personnel-container{position:relative;width:298px;height:471px;overflow:hidden;border:1px solid #4b4f4d;border-radius:13px;background:linear-gradient(180deg,#111312,#080a09);color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 18px 40px rgba(0,0,0,.48)}
   .pc-head{height:43px;padding:7px 10px;border-bottom:1px solid #303432;background:linear-gradient(180deg,#171918,#0e100f)}.pc-head>div>span{display:block;color:#ffc400;font-size:6px;font-weight:950;letter-spacing:.25px}.pc-head>div>strong{display:block;margin-top:3px;max-width:190px;overflow:hidden;font-size:14px;line-height:1;white-space:nowrap;text-overflow:ellipsis}
   main{position:absolute;top:43px;left:7px;right:7px;bottom:111px;display:flex;flex-direction:column;gap:4px;padding-top:5px;overflow:hidden}.pc-section{overflow:hidden;border:1px solid #343836;border-radius:5px;background:linear-gradient(180deg,#171a18,#101311);box-shadow:inset 0 1px 0 rgba(255,255,255,.035)}.pc-section h3{height:18px;margin:0;padding:5px 6px;border-bottom:1px solid #2d312f;color:#ffc400;font-size:6px;line-height:1;font-weight:950}.pc-hero{height:58px;display:grid;grid-template-columns:1.1fr 1fr 1fr;border:1px solid #343836;border-radius:5px;background:#131614}.pc-hero>div{display:flex;flex-direction:column;justify-content:center;padding:6px;border-right:1px solid #2c302e}.pc-hero>div:last-child{border:0}.people-mark{align-items:center;color:#ffc400;font-size:16px;letter-spacing:-5px}.pc-hero small,.pc-kpis small{color:#9ca19e;font-size:5px;font-weight:900}.pc-hero strong{font-size:18px}.hero-status span{display:flex;justify-content:space-between;color:#aaa;font-size:5px}.hero-status b{color:#f4f4f4;font-size:9px}.hero-status span:first-child b{color:#77dc31}
   .summary-grid{display:grid;grid-template-columns:1fr 1fr;padding:3px 6px}.summary-grid div{height:16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #292d2b;color:#c6c9c7;font-size:6px}.summary-grid b{color:#fff;font-size:8px}.pc-bar{height:15px;display:grid;grid-template-columns:105px 1fr 18px;align-items:center;gap:4px;padding:0 6px;border-bottom:1px solid #292d2b;font-size:5.5px}.pc-bar span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pc-bar i{height:4px;overflow:hidden;border-radius:4px;background:#2b2e2c}.pc-bar em{display:block;height:100%;background:#ffc400}.pc-bar b{text-align:right;font-size:7px}
   .pc-kpis{height:43px;display:grid;grid-template-columns:repeat(4,1fr);border:1px solid #343836;border-radius:5px;background:#131614}.pc-kpis div{display:flex;flex-direction:column;align-items:center;justify-content:center;border-right:1px solid #2b2f2d}.pc-kpis div:last-child{border:0}.pc-kpis b{font-size:12px}.cap-tiles{display:grid;grid-template-columns:repeat(5,1fr);gap:3px;padding:4px}.cap-tiles div,.status-tiles div,.quick-tiles button{display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid #353937;border-radius:4px;background:linear-gradient(180deg,#1b1e1c,#121513)}.cap-tiles div{height:49px}.cap-tiles span,.quick-tiles span{color:#cfd2d0;font-size:13px}.cap-tiles small,.status-tiles small,.quick-tiles small{margin-top:3px;color:#b6bab7;font-size:4.7px;font-weight:900;text-align:center}.cap-tiles b,.status-tiles b,.quick-tiles b{font-size:9px}
   .status-tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:4px}.status-tiles div{height:45px}.status-tiles span{font-size:14px;color:#8e9490}.status-tiles div:first-child span{color:#77dc31}.status-tiles div:nth-child(2) span{color:#ff6b38}.quick-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:3px;padding:4px}.quick-tiles button{height:43px;color:#fff}.cap-two{display:grid;grid-template-columns:1fr 1fr}.cap-two .pc-bar{grid-template-columns:72px 1fr 15px}
   .relationships{flex:1;min-height:74px}.rel-row{height:17px;display:grid;grid-template-columns:1fr 1.25fr 10px;align-items:center;padding:0 6px;border-bottom:1px solid #292d2b;font-size:5.5px}.rel-row span{color:#b9bdba}.rel-row b{overflow:hidden;text-align:right;text-overflow:ellipsis;white-space:nowrap;font-size:5.7px}.rel-row i{color:#16c7ff;text-align:right;font-style:normal;font-size:10px}
   .pc-commands{position:absolute;left:7px;right:7px;bottom:82px;height:24px;display:grid;grid-template-columns:repeat(3,1fr);border:1px solid #303432;border-radius:4px;background:#0d0f0e}.pc-commands button{border:0;border-right:1px solid #2b2f2d;background:transparent;color:#16c7ff;font-size:6px}.pc-commands button:last-child{border:0}.pc-commands b{margin-left:4px;color:#e7e8e7;font-size:6px}.pc-rail{position:absolute;left:0;right:0;bottom:18px;height:64px;overflow:hidden;border-top:1px solid #303432}.pc-machine-rail{position:absolute;left:0;right:0;bottom:0;height:18px;display:grid;place-items:center;border-top:1px solid #2d312f;background:#0b0d0c;color:#505451;font-size:5px;letter-spacing:.6px}
   .pc-v2 main{bottom:111px}.pc-v2 .relationships{min-height:66px}.pc-v3 main{