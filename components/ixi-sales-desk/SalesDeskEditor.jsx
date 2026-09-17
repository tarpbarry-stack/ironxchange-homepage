import { useEffect,useRef,useState } from "react";
import { salesRequest,STAGES,todayLocal } from "./salesDeskClient";

function Field({label,children,wide=false}) { return <label className={wide ? "sales-field wide" : "sales-field"}><span>{label}</span>{children}</label>; }
export default function SalesDeskEditor({editor,people,boardMachines=[],readOnly=false,actor={},team=[],onClose,onSaved,onQuote,onOpenMachines,onOpenLinked,onFollowUp,onPackage}) {
  const dialog=useRef(null),saveLock=useRef(false),command=useRef(null);
  const [value,setValue]=useState(editor.record),[dirty,setDirty]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const [contactQuery,setContactQuery]=useState(""),[contacts,setContacts]=useState([]),[notes,setNotes]=useState([]),[note,setNote]=useState("");
  const [history,setHistory]=useState(editor.history || []),[noteError,setNoteError]=useState("");
  const kind=editor.kind;
  const [related,setRelated]=useState(null),[dealQuery,setDealQuery]=useState(""),[deals,setDeals]=useState([]);
  const close=()=>{if(busy)return;if((dirty || note.trim()) && !window.confirm("Discard unsaved changes and close?"))return;onClose();};
  useEffect(()=>{dialog.current.showModal();return()=>dialog.current?.close();},[]);
  useEffect(()=>{const guard=e=>{if(dirty || note.trim()){e.preventDefault();e.returnValue="";}};window.addEventListener("beforeunload",guard);return()=>window.removeEventListener("beforeunload",guard);},[dirty,note]);
  useEffect(()=>{
    if(!["deals","tasks"].includes(kind))return;
    const controller=new AbortController();
    const timer=setTimeout(()=>salesRequest(`records/contacts?limit=100&q=${encodeURIComponent(contactQuery)}`,{signal:controller.signal}).then(result=>setContacts(result.items)).catch(e=>{if(e.name!=="AbortError")setError(e.message);}),180);
    return()=>{clearTimeout(timer);controller.abort();};
  },[kind,contactQuery]);
  useEffect(()=>{if(kind!=="tasks")return;const controller=new AbortController();const timer=setTimeout(()=>salesRequest(`records/deals?limit=100&q=${encodeURIComponent(dealQuery)}`,{signal:controller.signal}).then(r=>setDeals(r.items)).catch(e=>{if(e.name!=="AbortError")setError(e.message);}),180);return()=>{clearTimeout(timer);controller.abort();};},[kind,dealQuery]);
  useEffect(()=>{if(!value.id || !["contacts","deals"].includes(kind))return;const controller=new AbortController();salesRequest(`related/${kind}/${value.id}`,{signal:controller.signal}).then(setRelated).catch(e=>{if(e.name!=="AbortError")setError(e.message);});return()=>controller.abort();},[kind,value.id,value.revision]);
  const refreshNotes=()=>{
    if(!value.id || !["contacts","deals"].includes(kind))return;
    salesRequest(`records/notes?limit=100&parentId=${encodeURIComponent(value.id)}`).then(result=>setNotes(result.items)).catch(e=>setNoteError(e.message));
  };
  useEffect(refreshNotes,[kind,value.id]);
  const patch=(key,next)=>{setValue(v=>({...v,[key]:next}));setDirty(true);setError("");command.current=null;};
  const save=async e=>{
    e.preventDefault();if(saveLock.current || readOnly)return;saveLock.current=true;setBusy(true);setError("");
    const payload={kind,record:value,revision:value.revision};
    if(!command.current)command.current={...payload,commandId:crypto.randomUUID()};
    try {
      const result=await salesRequest("commands",{body:command.current});setValue(result.record);setDirty(false);command.current=null;onSaved(kind,result.record);
      const detail=await salesRequest(`records/${kind}/${result.record.id}`);setHistory(detail.history);
    }catch(e){setError(e.message);}finally{saveLock.current=false;setBusy(false);}
  };
  const noteCommand=useRef(null);
  const addNote=async()=>{
    if(saveLock.current || readOnly || !note.trim())return;saveLock.current=true;setBusy(true);setNoteError("");
    if(!noteCommand.current)noteCommand.current={kind:"notes",commandId:crypto.randomUUID(),record:{title:note,parentKind:kind,parentId:value.id}};
    try{await salesRequest("commands",{body:noteCommand.current});setNote("");noteCommand.current=null;refreshNotes();}catch(e){setNoteError(e.message);}finally{saveLock.current=false;setBusy(false);}
  };
  const input=(key,type="text",maxLength=250,required=false)=><input type={type} value={value[key] || ""} maxLength={maxLength} required={required} onChange={e=>patch(key,e.target.value)}/>;
  return <dialog ref={dialog} className="sales-dialog" onCancel={e=>{e.preventDefault();close();}} aria-labelledby="sales-editor-title">
    <header><div><span className="sales-eyebrow">IXI SALES DESK · {value.id ? "EXISTING RECORD" : "NEW RECORD"}</span><h2 id="sales-editor-title">{kind==="contacts" ? "CONTACT" : kind==="deals" ? "DEAL WORKSPACE" : kind==="tasks" ? "FOLLOW-UP" : "SAVE BOARD"}</h2></div><button onClick={close} aria-label="Close record" disabled={busy}>×</button></header>
    <div className="sales-dialog-body"><form onSubmit={save}>
      <fieldset disabled={busy || readOnly} className="sales-fields">
        {kind==="contacts" && <>
          {!value.id && <Field label="EXISTING IXI PERSON" wide><select value={value.objectId || ""} onChange={e=>{const person=people.find(p=>p.objectId===e.target.value);patch("objectId",e.target.value);if(person)patch("name",person.name);}}><option value="">Create a new contact</option>{people.map(p=><option key={p.objectId} value={p.objectId}>{p.name}</option>)}</select></Field>}
          <Field label="NAME *">{input("name","text",150,true)}</Field><Field label="COMPANY">{input("company","text",150)}</Field><Field label="PHONE">{input("phone","tel",60)}</Field><Field label="EMAIL">{input("email","email",254)}</Field><Field label="ADDRESS" wide>{input("address","text",500)}</Field><Field label="SOURCE">{input("source","text",100)}</Field><Field label="PREFERRED CONTACT"><select value={value.preference || ""} onChange={e=>patch("preference",e.target.value)}><option value="">Not specified</option><option>Phone</option><option>Email</option><option>Text</option></select></Field><Field label="CUSTOMER TYPE">{input("category","text",40)}</Field><Field label="BUDGET">{input("budget","text",100)}</Field><Field label="BUYING TIMEFRAME" wide>{input("timeframe","text",150)}</Field><Field label="MACHINES WANTED / INTERESTS" wide><textarea value={value.interest || ""} maxLength={1000} onChange={e=>patch("interest",e.target.value)}/></Field>
        </>}
        {kind==="deals" && <>
          <Field label="DEAL NAME *" wide>{input("title","text",150,true)}</Field>
          <Field label="FIND CUSTOMER"><input type="search" placeholder="Name, company, email…" value={contactQuery} onChange={e=>setContactQuery(e.target.value)}/></Field>
          <Field label="CUSTOMER *"><select required value={value.contactId || ""} onChange={e=>patch("contactId",e.target.value)}><option value="">Select a saved contact</option>{value.contactId && !contacts.some(c=>c.id===value.contactId) && <option value={value.contactId}>{value.customerName || "Current customer"}</option>}{contacts.map(c=><option value={c.id} key={c.id}>{c.name}{c.company ? ` · ${c.company}` : ""}</option>)}</select></Field>
          <Field label="STAGE"><select value={value.stage || "inquiry"} onChange={e=>patch("stage",e.target.value)}>{STAGES.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></Field><Field label="NEXT ACTION DATE">{input("dueDate","date")}</Field>
          <Field label="NEXT ACTION" wide>{input("nextAction","text",500)}</Field><Field label="TERMS / WORKING NOTES" wide><textarea rows={3} maxLength={3000} value={value.terms || ""} onChange={e=>patch("terms",e.target.value)}/></Field>
          {value.stage==="lost" && <Field label="LOST REASON *" wide>{input("lostReason","text",500,true)}</Field>}
          <div className="sales-deal-machines wide"><span className="sales-eyebrow">MACHINES IN THIS DEAL</span><button type="button" disabled={!boardMachines.length} onClick={()=>patch("machines",[...new Map([...(value.machines || []),...boardMachines].map(machine=>[machine.key,machine])).values()])}>ADD OPEN BOARD MACHINES</button>{value.machines?.length ? value.machines.map(machine=><div key={machine.key}><span><strong>{machine.title}</strong><small>{machine.passportId}</small></span><button type="button" onClick={()=>patch("machines",value.machines.filter(m=>m.key!==machine.key))} aria-label={`Remove ${machine.title} from this deal`}>×</button></div>) : <p>No machines attached. Open machines on the board before creating a deal.</p>}</div>
        </>}
        {kind==="tasks" && <><Field label="FIND DEAL"><input type="search" value={dealQuery} onChange={e=>setDealQuery(e.target.value)}/></Field><Field label="LINKED DEAL"><select value={value.dealId || ""} onChange={e=>{const deal=deals.find(d=>d.id===e.target.value);patch("dealId",e.target.value);patch("contactId",deal?.contactId || "");}}><option value="">Standalone follow-up</option>{value.dealId && !deals.some(d=>d.id===value.dealId) && <option value={value.dealId}>Linked deal</option>}{deals.map(d=><option key={d.id} value={d.id}>{d.title} · {d.customerName}</option>)}</select></Field><Field label="FIND CUSTOMER"><input type="search" value={contactQuery} onChange={e=>setContactQuery(e.target.value)}/></Field><Field label="CUSTOMER"><select disabled={!!value.dealId} value={value.contactId || ""} onChange={e=>patch("contactId",e.target.value)}><option value="">No linked customer</option>{value.contactId && !contacts.some(c=>c.id===value.contactId) && <option value={value.contactId}>{value.customerName || "Linked customer"}</option>}{contacts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><Field label="FOLLOW-UP *" wide>{input("title","text",250,true)}</Field><Field label="DUE DATE *">{input("dueDate","date",10,true)}</Field><Field label="STATUS"><select value={value.completed ? "done" : "open"} onChange={e=>patch("completed",e.target.value==="done")}><option value="open">OPEN</option><option value="done">COMPLETED</option></select></Field><Field label="CALL / FOLLOW-UP OUTCOME" wide><textarea maxLength={2000} value={value.outcome || ""} onChange={e=>patch("outcome",e.target.value)}/></Field></>}
        {kind==="boards" && <><Field label="BOARD NAME *" wide>{input("title","text",100,true)}</Field><p className="wide">{value.keys?.length || 0} machines will be saved in this order.</p></>}
        {["contacts","deals","tasks"].includes(kind) && <Field label="ASSIGNED TO" wide><select disabled={!actor.canAssign} value={value.assignedTo || actor.actorId || ""} onChange={e=>patch("assignedTo",e.target.value)}>{value.assignedTo && !team.some(m=>m.principalId===value.assignedTo) && <option value={value.assignedTo}>Previous assignee · choose an active member</option>}{team.map(member=><option key={member.principalId} value={member.principalId}>{member.name}</option>)}</select></Field>}
      </fieldset>
      {error && <p className="sales-error" role="alert">{error}</p>}
      <div className="sales-editor-actions"><span>{busy ? "SAVING…" : dirty ? "UNSAVED CHANGES" : value.id ? "SAVED TO IX-CORE" : "READY TO SAVE"}</span><button className="sales-primary" type="submit" disabled={readOnly || busy || (!!value.id && !dirty)}>{busy ? "SAVING…" : "SAVE"}</button></div>
    </form>
    {value.id && kind==="deals" && <div className="sales-actions"><button disabled={dirty || busy || !!note.trim()} onClick={()=>onOpenMachines(value)}>OPEN DEAL MACHINES ↗</button><button disabled={!actor.canFinancial || readOnly || dirty || busy || !!note.trim() || !value.machines?.length} onClick={()=>onQuote(value)}>PREPARE QUOTE ↗</button>{actor.canFinancial && <a href={`/transact${value.machines?.[0]?.passportId ? `?passport=${encodeURIComponent(value.machines[0].passportId)}` : ""}`}>TRAN$ACT ↗</a>}</div>}
    {value.id && ["contacts","deals","tasks"].includes(kind) && <div className="sales-actions"><button disabled={dirty || busy || !!note.trim() || readOnly} onClick={()=>onFollowUp(kind,value)}>{kind==="tasks" ? "SCHEDULE NEXT FOLLOW-UP" : "+ FOLLOW-UP"}</button></div>}
    {related && <section className="sales-related"><h3>CONNECTED WORK</h3>{kind==="deals" && <button disabled={dirty || busy || !!note.trim()} onClick={()=>onOpenLinked("contacts",related.customer)}>OPEN CUSTOMER · {related.customer.name}</button>}{kind==="contacts" && <><h4>DEALS · {related.deals.total}</h4>{related.deals.items.map(item=><button key={item.id} disabled={dirty || busy || !!note.trim()} onClick={()=>onOpenLinked("deals",item)}><strong>{item.title}</strong><span>{item.machines?.length || 0} machines · {item.stage.toUpperCase()}</span></button>)}</>}<h4>BUYER PACKAGES · {related.packages.total}</h4>{related.packages.items.map(item=><button key={item.id} disabled={dirty || busy || !!note.trim()} onClick={()=>onPackage(item)}><strong>{item.title}</strong><span>{item.createdAt.slice(0,10)} · {item.machines.length} machines</span></button>)}<h4>FOLLOW-UPS · {related.tasks.total}</h4>{related.tasks.items.map(item=><button key={item.id} disabled={dirty || busy || !!note.trim()} onClick={()=>onOpenLinked("tasks",item)}><strong>{item.title}</strong><span>{item.completed ? "COMPLETED" : item.dueDate}{item.outcome ? ` · ${item.outcome}` : ""}</span></button>)}{related.tasks.total>related.tasks.items.length && <p>Showing the latest 100. Use the follow-up search for older work.</p>}</section>}
    {value.id && ["contacts","deals"].includes(kind) && <section className="sales-notes"><h3>CONVERSATION & NOTES</h3><textarea aria-label="New conversation note" placeholder="What was discussed? What happens next?" maxLength={4000} value={note} disabled={busy || readOnly} onChange={e=>{setNote(e.target.value);noteCommand.current=null;}}/><button disabled={readOnly || busy || !note.trim()} onClick={addNote}>ADD NOTE</button>{noteError && <p role="alert" className="sales-error">{noteError}</p>}{notes.map(item=><article key={item.id}><p>{item.title}</p><small>{new Date(item.createdAt).toLocaleString()}</small></article>)}</section>}
    {history.length>0 && <details className="sales-history"><summary>CHANGE HISTORY · {history.length}</summary>{history.map((entry,i)=><p key={i}>{entry.action.toUpperCase()} · {new Date(entry.createdAt).toLocaleString()}<small>{entry.actorId}</small></p>)}</details>}
    </div>
  </dialog>;
}
