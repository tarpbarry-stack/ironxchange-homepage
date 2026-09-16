import Head from "next/head";
import dynamic from "next/dynamic";
import { useEffect,useMemo,useRef,useState } from "react";
import SalesDeskRail from "./SalesDeskRail";
import SalesDeskEditor from "./SalesDeskEditor";
import { salesRequest,todayLocal,stageLabel,machineReference } from "./salesDeskClient";
import { dashboardKey,passportOf } from "../ixi-dashboard/dashboardContract.mjs";
import styles from "./salesDesk.module.css";

const Board=dynamic(()=>import("../ixi-dashboard/DashboardBoard"),{ssr:false,loading:()=> <div className="sales-empty" role="status">Preparing your machine board…</div>});
const Quote=dynamic(()=>import("./SalesDeskQuote"),{ssr:false,loading:()=> <div className="sales-empty" role="status">Preparing the quote…</div>});
const TABS=[["deals","DEALS"],["contacts","CONTACTS"],["tasks","FOLLOW-UPS"],["boards","BOARDS"]];
const emptyList={items:[],total:0};

export default function SalesDeskSurface({initial,dashboardClass,workspace:w}) {
  const [tab,setTab]=useState("deals"),[query,setQuery]=useState(""),[lists,setLists]=useState(initial.lists),[loading,setLoading]=useState(false),[listError,setListError]=useState("");
  const [editor,setEditor]=useState(null),[quote,setQuote]=useState(null),[comparison,setComparison]=useState(false),[hidden,setHidden]=useState({left:false,right:false}),[mobile,setMobile]=useState("");
  const [revision,setRevision]=useState(0),[summary,setSummary]=useState(initial.summary || {}),[recordLoading,setRecordLoading]=useState(false);
  const detailSequence=useRef(0),listSequence=useRef(0),firstList=useRef(true);
  const searchRef=useRef(null),compareRef=useRef(null);
  const collection=lists[tab] || emptyList;
  const canWrite=initial.context.canWrite === true;
  useEffect(()=>{
    if(firstList.current){firstList.current=false;return;}
    const seq=++listSequence.current,controller=new AbortController();setLoading(true);setListError("");
    const timer=setTimeout(()=>salesRequest(`records/${tab}?q=${encodeURIComponent(query)}&limit=100`,{signal:controller.signal}).then(result=>{if(seq===listSequence.current)setLists(current=>({...current,[tab]:result}));}).catch(e=>{if(e.name!=="AbortError")setListError(e.message);}).finally(()=>{if(seq===listSequence.current)setLoading(false);}),180);
    return()=>{clearTimeout(timer);controller.abort();};
  },[tab,query,revision]);
  useEffect(()=>{
    const key=e=>{if((e.metaKey || e.ctrlKey) && e.key.toLowerCase()==="k"){e.preventDefault();setHidden(v=>({...v,right:false}));setMobile("right");requestAnimationFrame(()=>searchRef.current?.focus());}};
    window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key);
  },[]);
  useEffect(()=>{if(comparison)compareRef.current?.showModal();},[comparison]);
  const refreshSummary=()=>salesRequest(`bootstrap?today=${todayLocal()}`).then(result=>setSummary(result.summary)).catch(()=>{});
  const changeTab=next=>{setQuery("");setTab(next);setHidden(v=>({...v,right:false}));if(window.innerWidth<1000)setMobile("right");};
  const toggleRail=side=>{if(window.innerWidth<1000)setMobile(previous=>previous===side ? "" : side);else setHidden(previous=>({...previous,[side]:!previous[side]}));};
  const openEditor=async(kind,record=null)=>{
    if(!canWrite && !record){w.setNotice("Your membership allows viewing Sales Desk. Changes are restricted.");return;}
    const seq=++detailSequence.current;
    if(record?.id){setRecordLoading(true);try{const result=await salesRequest(`records/${kind}/${record.id}`);if(seq===detailSequence.current)setEditor({kind,record:result.record,history:result.history});}catch(e){w.setNotice(e.message);}finally{if(seq===detailSequence.current)setRecordLoading(false);}return;}
    const defaults=kind==="deals" ? {title:"",contactId:"",stage:"inquiry",machines:w.openMachines.map(machineReference),dueDate:"",nextAction:""} : kind==="tasks" ? {title:"",dueDate:todayLocal(),completed:false} : kind==="boards" ? {title:"",keys:w.openKeys} : {name:"",email:"",phone:"",company:""};
    setEditor({kind,record:defaults});
  };
  const onSaved=(kind,record)=>{
    setLists(current=>{
      const list=current[kind] || emptyList,exists=list.items.some(item=>item.id===record.id);
      return {...current,[kind]:{...list,items:[record,...list.items.filter(item=>item.id!==record.id)],total:list.total+(exists ? 0 : 1)}};
    });setRevision(n=>n+1);refreshSummary();w.setNotice("Saved to IX-Core.");
  };
  const loadMore=async()=>{
    if(loading)return;const seq=++listSequence.current;setLoading(true);
    try{const result=await salesRequest(`records/${tab}?q=${encodeURIComponent(query)}&offset=${collection.items.length}&limit=100`);if(seq===listSequence.current)setLists(current=>({...current,[tab]:{...result,items:[...current[tab].items,...result.items]}}));}
    catch(e){setListError(e.message);}finally{if(seq===listSequence.current)setLoading(false);}
  };
  const openKeys=keys=>{
    const available=new Set(w.allMachines.map(dashboardKey)),matched=keys.filter(key=>available.has(key));
    w.setOpenKeys(previous=>[...new Set([...previous,...matched])]);setMobile("");
    if(matched.length<keys.length)w.setNotice(`${keys.length-matched.length} machine(s) are no longer in your available inventory or relationships. Their deal references are preserved.`);
    if(matched[0])w.setSelectedKey(matched[0]);
  };
  const returnAll=()=>{
    if(w.dirtyKeys.size){w.setNotice("Save or return the machines with unsaved changes individually before returning the whole board.");return;}
    for(const item of w.openMachines)w.returnToRail(dashboardKey(item));
  };
  const prepareQuote=deal=>{
    const owned=deal.machines.map(ref=>w.owned.find(item=>dashboardKey(item)===ref.key)).filter(Boolean);
    if(!owned.length){w.setNotice("A quote requires a currently owned machine. Open the deal's machine in TRAN$ACT to review its availability.");return;}
    setQuote({deal,machines:owned});setEditor(null);
  };
  const showItem=item=>{
    if(tab==="boards"){openKeys(item.keys);return;}
    openEditor(tab,item);
  };
  const compareRows=useMemo(()=>[
    ["YEAR",item=>item.year || item.publicData?.year], ["MAKE",item=>item.make || item.publicData?.make], ["MODEL",item=>item.model || item.publicData?.model],
    ["HOURS",item=>item.hours ?? item.publicData?.hours], ["PRICE",item=>item.price], ["SERIAL NUMBER",item=>item.serialNumber || item.publicData?.serialNumber], ["LOCATION",item=>typeof item.location==="string" ? item.location : item.location?.address], ["PASSPORT",passportOf]
  ],[]);
  return <div className={`${dashboardClass} ${styles.salesDesk}`} data-ixi-sales-desk="v1">
    <Head><title>IXI Sales Desk | {initial.context.company}</title><meta name="robots" content="noindex,nofollow" /></Head>
    <style jsx global>{`body{margin:0;background:#090d0b;}`}</style>
    <header className="sales-header"><a className="sales-brand" href="/account" aria-label="IXI Home">IXI</a><div className="sales-title"><span className="sales-eyebrow">{initial.context.company}</span><h1>SALES DESK</h1></div><span className="sales-access"><i/> OWNER ACCESS</span><nav aria-label="IXI environments"><a href="/account">HOME</a><a href="/aos/work">AOS / WORK ↗</a><a href="/transact">TRAN$ACT ↗</a></nav><button className="sales-new-contact" disabled={!canWrite} onClick={()=>openEditor("contacts")}>+ CONTACT</button><button className="sales-primary" disabled={!canWrite} onClick={()=>openEditor("deals")}>+ NEW DEAL</button></header>
    <div className="sales-scoreboard" aria-label="Sales overview">
      <button onClick={()=>toggleRail("left")}><span>OWNED MACHINES</span><strong>{w.ownedStatus.loading ? "—" : w.owned.length}</strong><small>Ready to work</small></button>
      <button onClick={()=>changeTab("deals")}><span>OPEN DEALS</span><strong>{summary.activeDeals ?? "—"}</strong><small>Active conversations</small></button>
      <button onClick={()=>changeTab("tasks")}><span>FOLLOW-UPS DUE</span><strong className={summary.dueTasks ? "sales-yellow" : ""}>{summary.dueTasks ?? "—"}</strong><small>Today & overdue</small></button>
      <button onClick={()=>changeTab("contacts")}><span>CONTACTS</span><strong>{summary.contacts ?? initial.lists.contacts.total}</strong><small>Your company address book</small></button>
      <div><span>ON YOUR BOARD</span><strong>{w.openMachines.length}</strong><small>Open · Work · Return</small></div>
    </div>
    <main className={`sales-workspace ${hidden.left ? "hide-machines" : ""} ${hidden.right ? "hide-sales" : ""} ${mobile ? `mobile-${mobile}` : ""}`}>
      <SalesDeskRail workspace={w} onClose={()=>{setHidden(v=>({...v,left:true}));setMobile("");}}/>
      <section className="dash-board sales-board" aria-label="Sales working board">
        <div className="sales-board-toolbar"><button onClick={()=>toggleRail("left")}>‹ MACHINES</button><span className="sales-board-label">WORKING BOARD <b>{w.openMachines.length}</b></span><div className="sales-board-tools"><label>SIZE <select aria-label="Machine card size" value={w.size} onChange={e=>w.setSize(e.target.value)}><option value="fit">FIT</option><option value="natural">100%</option><option value="work">120%</option><option value="focus">140%</option></select></label><button onClick={()=>setComparison(true)} disabled={w.openMachines.length<2}>COMPARE</button><button onClick={()=>openEditor("boards")} disabled={!canWrite || !w.openMachines.length}>SAVE BOARD</button><button onClick={returnAll} disabled={!w.openMachines.length}>RETURN ALL</button></div><button onClick={()=>toggleRail("right")}>SALES ›</button></div>
        {w.auth.error ? <div className="sales-empty" role="alert">{w.auth.error}<button onClick={w.retryAuth}>TRY AGAIN</button><a href="/login?next=%2Fsales-desk">SIGN IN</a></div> : <Board machines={w.openMachines} ownedKeys={w.ownedKeys} states={w.states} onPatch={w.updateState} size={w.size} onReorder={w.setOpenKeys} onReturn={w.returnToRail} selectedKey={w.selectedKey} onSelect={w.setSelectedKey} getSellerProps={w.getSellerListingCardProps} onDirty={w.markDirty} dirtyKeys={w.dirtyKeys} onSaved={w.clearDirty} toggleSave={w.toggleSave} savedIds={w.savedIds} scrollTop={w.scroll} onScroll={w.onScroll} />}
        <footer className="sales-board-footer"><span><i/>{w.dirtyKeys.size ? `${w.dirtyKeys.size} MACHINE(S) WITH UNSAVED CHANGES` : "BOARD RESTORES IN THIS BROWSER"}</span><button onClick={()=>{w.refresh();setRevision(n=>n+1);refreshSummary();}} disabled={!!w.dirtyKeys.size}>REFRESH ↻</button></footer>
      </section>
      <aside className="sales-work-rail" aria-label="Sales records"><div className="sales-rail-heading"><div><span className="sales-eyebrow">CUSTOMERS · CONVERSATIONS · NEXT ACTION</span><h2>YOUR SALES DESK</h2></div><button aria-label="Hide sales rail" onClick={()=>{setHidden(v=>({...v,right:true}));setMobile("");}}>›</button></div>
        <div className="sales-tabs" role="tablist" aria-label="Sales records">{TABS.map(([id,label])=><button key={id} role="tab" aria-selected={tab===id} onClick={()=>changeTab(id)}>{label}</button>)}</div>
        <div className="sales-rail-tools"><input ref={searchRef} aria-label={`Search ${tab}`} placeholder={tab==="contacts" ? "Name, phone, company, interest…" : `Search ${tab}…`} value={query} onChange={e=>setQuery(e.target.value)}/><div className="sales-list-summary"><span>{loading ? "UPDATING…" : `${collection.total} ${tab.toUpperCase()}`}</span><button onClick={()=>openEditor(tab)} disabled={!canWrite || (tab==="boards" && !w.openMachines.length)}>+ {tab==="contacts" ? "CONTACT" : tab==="tasks" ? "FOLLOW-UP" : tab==="boards" ? "SAVE BOARD" : "DEAL"}</button></div></div>
        <div className="sales-rail-scroll" role="tabpanel" aria-label={tab} aria-busy={loading || recordLoading}>
          {listError && <p className="sales-error" role="alert">{listError}<button onClick={()=>setRevision(n=>n+1)}>RETRY</button></p>}
          {!loading && !listError && !collection.items.length && <div className="sales-start"><span className="sales-start-icon">{tab==="deals" ? "↗" : tab==="contacts" ? "+" : tab==="tasks" ? "✓" : "▦"}</span><h3>{query ? "No matching records." : tab==="deals" ? "Your next deal starts here." : tab==="contacts" ? "Keep your customers close." : tab==="tasks" ? "Keep the next promise." : "Pick up where you left off."}</h3><p>{query ? "Try another search." : tab==="deals" ? "Open the machines, add your customer, and keep the conversation together." : tab==="contacts" ? "Save a name and number now. Build the relationship as you go." : tab==="tasks" ? "Give every call, inspection, and quote a next action." : "Save a group of machines and bring it back in one click."}</p>{!query && <button className="sales-primary" onClick={()=>openEditor(tab)} disabled={!canWrite || (tab==="boards" && !w.openMachines.length)}>+ {tab==="deals" ? "START A DEAL" : tab==="contacts" ? "ADD A CONTACT" : tab==="tasks" ? "ADD FOLLOW-UP" : "SAVE THIS BOARD"}</button>}</div>}
          {collection.items.map(item=><article className="sales-record" key={item.id}><button onClick={()=>showItem(item)} disabled={recordLoading}>
            <span className="sales-record-top">{tab==="deals" ? <span className={`sales-stage stage-${item.stage}`}>{stageLabel(item.stage)}</span> : tab==="tasks" ? <span className={`sales-stage ${!item.completed && item.dueDate<todayLocal() ? "overdue" : ""}`}>{item.completed ? "COMPLETED" : item.dueDate<todayLocal() ? "OVERDUE" : "OPEN"}</span> : <span className="sales-eyebrow">{tab==="contacts" ? item.company || "CONTACT" : `${item.keys?.length || 0} MACHINES`}</span>}<span>↗</span></span>
            <strong>{item.name || item.title}</strong>
            {tab==="deals" && <><p>{item.customerName} · {item.machines?.length || 0} machines</p><div className="sales-next"><span>NEXT</span>{item.nextAction || "Set the next action"}{item.dueDate && <time>{item.dueDate}</time>}</div></>}
            {tab==="contacts" && <><p>{item.phone || item.email || "Add contact details"}</p>{item.interest && <small>{item.interest}</small>}</>}
            {tab==="tasks" && <p>DUE {item.dueDate}</p>}
          </button>{tab==="boards" && <button className="sales-subtle" onClick={()=>openEditor("boards",item)}>RENAME BOARD</button>}</article>)}
          {collection.items.length<collection.total && <button className="sales-wide" disabled={loading} onClick={loadMore}>{loading ? "LOADING…" : "LOAD MORE"}</button>}
        </div><footer className="sales-rail-footer"><span>PRIVATE TO YOUR COMPANY</span><a href="/account/messages">INQUIRIES ↗</a></footer>
      </aside>
    </main>
    <footer className="sales-footer"><span><i/> IXI SALES DESK</span><span>{initial.context.company}</span><span>FINANCIAL RECORDS · TRAN$ACT ↗</span></footer>
    {editor && <SalesDeskEditor key={`${editor.kind}:${editor.record.id || "new"}`} editor={editor} people={initial.people || []} boardMachines={w.openMachines.map(machineReference)} readOnly={!canWrite} onClose={()=>setEditor(null)} onSaved={onSaved} onQuote={prepareQuote} onOpenMachines={deal=>{openKeys(deal.machines.map(m=>m.key));setEditor(null);}}/>}
    {quote && <Quote {...quote} actor={initial.context} onClose={()=>setQuote(null)} onSaved={()=>{refreshSummary();w.setNotice("Quote saved in TRAN$ACT and linked to this deal.");}}/>}
    {comparison && <dialog className="sales-dialog sales-comparison" ref={compareRef} onCancel={e=>{e.preventDefault();setComparison(false);}} aria-labelledby="sales-compare-title"><header><div><span className="sales-eyebrow">YOUR OPEN MACHINES</span><h2 id="sales-compare-title">SIDE BY SIDE</h2></div><button onClick={()=>setComparison(false)} aria-label="Close comparison">×</button></header><div className="sales-compare-scroll"><table><thead><tr><th>COMPARE</th>{w.openMachines.map(item=><th key={dashboardKey(item)}>{item.title}</th>)}</tr></thead><tbody>{compareRows.map(([label,get])=><tr key={label}><th>{label}</th>{w.openMachines.map(item=><td key={dashboardKey(item)}>{get(item) ?? "Not recorded"}</td>)}</tr>)}</tbody></table></div></dialog>}
    {w.notice && <div className="sales-notice" role="status">{w.notice}<button onClick={()=>w.setNotice("")} aria-label="Dismiss notification">×</button></div>}
  </div>;
}
