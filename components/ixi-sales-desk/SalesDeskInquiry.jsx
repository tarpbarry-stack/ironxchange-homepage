import {useEffect,useRef,useState} from 'react';
import {salesRequest} from './salesDeskClient';
import SalesScheduleFields from './SalesScheduleFields';
import {nextSchedule,localZone} from '../../lib/sales-desk/calendar.mjs';

const localNow=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);};
const SOURCES=['Phone call','Text message','Email','Walk-in','Referral','Outside website','Other'];

export default function SalesDeskInquiry({actor,team,contacts=[],machines=[],onClose,onSaved,onCalendar,onDeal}) {
  const [value,setValue]=useState(()=>({source:'Phone call',sourceDetail:'',title:'',message:'',receivedAt:localNow(),assignedTo:actor.actorId,contact:{name:'',company:'',phone:'',email:''},machines:[],schedule:nextSchedule({activityType:'call',nextAction:'Follow up on inquiry'})}));
  const [mode,setMode]=useState(contacts.length ? 'existing' : 'new'),[customer,setCustomer]=useState(null),[query,setQuery]=useState(''),[results,setResults]=useState({items:contacts,total:contacts.length}),[loading,setLoading]=useState(false),[searchError,setSearchError]=useState('');
  const [scheduled,setScheduled]=useState(false),[machineQuery,setMachineQuery]=useState(''),[dirty,setDirty]=useState(false),[busy,setBusy]=useState(false),[uncertain,setUncertain]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(null);
  const dialog=useRef(null),lock=useRef(false),command=useRef(null),sequence=useRef(0);
  const patch=(key,next)=>{if(lock.current || uncertain)return;setValue(v=>({...v,[key]:next}));setDirty(true);command.current=null;setError('');};
  const changeMode=next=>{if(lock.current || uncertain)return;setMode(next);setCustomer(null);setDirty(true);command.current=null;};
  const close=()=>{if(lock.current)return;if(!saved && (dirty || uncertain) && !window.confirm(uncertain ? 'The save result is unconfirmed. Retry to confirm it before leaving. Close anyway?' : 'Discard this unsaved inquiry?'))return;onClose();};
  useEffect(()=>{dialog.current?.showModal();},[]);
  useEffect(()=>{if(saved || !dirty)return;const leave=e=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',leave);return()=>window.removeEventListener('beforeunload',leave);},[dirty,saved]);
  useEffect(()=>{
    if(mode!=='existing' || saved)return;
    const seq=++sequence.current,c=new AbortController();setLoading(true);setSearchError('');
    const timer=setTimeout(()=>salesRequest(`records/contacts?q=${encodeURIComponent(query)}&limit=30`,{signal:c.signal}).then(r=>{if(seq===sequence.current)setResults(r);}).catch(e=>{if(e.name!=='AbortError' && seq===sequence.current)setSearchError(e.message);}).finally(()=>{if(seq===sequence.current)setLoading(false);}),180);
    return()=>{clearTimeout(timer);c.abort();};
  },[mode,query,saved]);
  const submit=async e=>{
    e.preventDefault();if(lock.current || saved || !actor.canWrite)return;
    if(mode==='existing' && !customer){setError('Choose a customer or add a new one.');return;}
    lock.current=true;setBusy(true);setError('');let sent=false;
    try {
      if(!command.current)command.current={commandId:crypto.randomUUID(),source:value.source,sourceDetail:value.sourceDetail,title:value.title,message:value.message,receivedAt:new Date(value.receivedAt).toISOString(),assignedTo:value.assignedTo,contactId:mode==='existing' ? customer.id : '',contact:mode==='new' ? value.contact : null,machines:value.machines,schedule:scheduled ? value.schedule : null};
      if(scheduled && !uncertain){const preview=await salesRequest('calendar/preview',{body:{kind:'deals',record:{...value.schedule,assignedTo:value.assignedTo}}});if(preview.conflicts.length && !window.confirm(`This time overlaps ${preview.conflicts.length} commitment(s):\n${preview.conflicts.map(c=>c.title).join('\n')}\nSave this follow-up anyway?`))return;}
      sent=true;const result=await salesRequest('inquiries/manual',{body:command.current});setSaved(result);setDirty(false);setUncertain(false);onSaved(result);
    } catch(e) {
      const unknown=sent && (!e.status || e.status>=500);
      setUncertain(unknown);setError(unknown ? `${e.message} Your inquiry is retained. Retry the same save to confirm the result.` : e.message);
      if(!unknown)command.current=null;
    } finally {lock.current=false;setBusy(false);}
  };
  const choices=machines.filter(m=>m.title.toLowerCase().includes(machineQuery.toLowerCase())).slice(0,50);
  return <dialog ref={dialog} className="sales-dialog sales-inquiry-dialog" aria-labelledby="sales-inquiry-title" onCancel={e=>{e.preventDefault();close();}}>
    <header><div><span className="sales-eyebrow">PHONE CALLS · OUTSIDE LEADS · ONE CONNECTED RECORD</span><h2 id="sales-inquiry-title">{saved ? 'INQUIRY SAVED' : 'ADD AN INQUIRY'}</h2></div><button type="button" aria-label="Close inquiry" disabled={busy} onClick={close}>×</button></header>
    {saved ? <div className="sales-dialog-body sales-inquiry-success" role="status"><span className="sales-eyebrow">{saved.record.source}</span><h3>{saved.record.title}</h3><p>Connected to <strong>{saved.contact.name}</strong> and a new deal in Inquiry.</p>{saved.deal.dueDate && <p><strong>{saved.deal.nextAction}</strong><br/>{saved.deal.dueDate}{saved.deal.allDay===false ? ` at ${saved.deal.startTime}` : ' · All day'} · {saved.deal.timeZone}</p>}{saved.conflicts?.length>0 && <p className="sales-error">Saved with {saved.conflicts.length} overlapping commitment(s). Review your calendar.</p>}<div className="sales-inquiry-actions">{saved.deal.dueDate && <button className="sales-primary" onClick={()=>onCalendar(saved.deal)}>VIEW ON CALENDAR ↗</button>}<button onClick={()=>onDeal(saved.deal)}>OPEN DEAL ↗</button><button onClick={onClose}>DONE</button></div></div> : <form onSubmit={submit}>
      <div className="sales-dialog-body"><p className="sales-inquiry-intro">Capture the conversation now. Keep the customer, machines, and next step together.</p>
        <fieldset className="sales-fields" disabled={busy || uncertain || !actor.canWrite}>
          <h3 className="wide sales-inquiry-section">01 / CUSTOMER</h3>
          <label className="sales-field wide"><span>CUSTOMER</span><select value={mode} onChange={e=>changeMode(e.target.value)}><option value="existing">Choose a saved customer</option><option value="new">+ Add a new customer</option></select></label>
          {mode==='existing' ? <div className="wide sales-inquiry-customer"><label className="sales-field"><span>FIND CUSTOMER</span><input type="search" placeholder="Name, company, phone, or email" value={query} onChange={e=>setQuery(e.target.value)}/></label>{customer && <p className="sales-customer-selected">Selected: <strong>{customer.name}</strong>{customer.company && ` · ${customer.company}`}</p>}{searchError && <p role="alert" className="sales-error">{searchError}</p>}<div className="sales-customer-results" aria-label="Matching customers" aria-busy={loading}>{loading ? <p role="status">Finding customers…</p> : results.items.length ? results.items.map(c=><button type="button" key={c.id} aria-pressed={customer?.id===c.id} onClick={()=>{setCustomer(c);setDirty(true);command.current=null;setError('');}}><strong>{c.name}</strong><span>{[c.company,c.phone || c.email].filter(Boolean).join(' · ')}</span></button>) : <p>No matching customers. Choose “Add a new customer” above.</p>}</div>{results.total>30 && <small>Showing 30 of {results.total}. Search to narrow the list.</small>}</div> : <>{[['name','NAME *',150,'text'],['company','COMPANY',150,'text'],['phone','PHONE',60,'tel'],['email','EMAIL',254,'email']].map(([key,label,max,type])=><label className="sales-field" key={key}><span>{label}</span><input type={type} autoComplete={key==='name' ? 'name' : key==='company' ? 'organization' : key==='phone' ? 'tel' : 'email'} required={key==='name'} maxLength={max} value={value.contact[key]} onChange={e=>patch('contact',{...value.contact,[key]:e.target.value})}/></label>)}<p className="wide sales-schedule-note">A matching email or phone connects this inquiry to the saved customer.</p></>}
          <h3 className="wide sales-inquiry-section">02 / THE INQUIRY</h3>
          <label className="sales-field"><span>SOURCE</span><select value={value.source} onChange={e=>patch('source',e.target.value)}>{SOURCES.map(s=><option key={s}>{s}</option>)}</select></label>
          <label className="sales-field"><span>RECEIVED · {localZone()}</span><input type="datetime-local" required value={value.receivedAt} onChange={e=>patch('receivedAt',e.target.value)}/></label>
          {['Referral','Outside website','Other'].includes(value.source) && <label className="sales-field wide"><span>REFERRER / WEBSITE / SOURCE DETAILS</span><input maxLength={150} value={value.sourceDetail} onChange={e=>patch('sourceDetail',e.target.value)}/></label>}
          <label className="sales-field wide"><span>WHAT ARE THEY LOOKING FOR? *</span><input required maxLength={150} placeholder="e.g. Loader for a new excavation crew" value={value.title} onChange={e=>patch('title',e.target.value)}/></label>
          <label className="sales-field wide"><span>CONVERSATION / ORIGINAL MESSAGE</span><textarea maxLength={10000} placeholder="What did they ask for? Budget, timing, trade-in, and anything to remember." value={value.message} onChange={e=>patch('message',e.target.value)}/></label>
          <details className="wide sales-inquiry-machines"><summary>Attach machines · {value.machines.length} selected</summary>{value.machines.length>0 && <div className="sales-inquiry-tags">{value.machines.map(m=><button type="button" key={m.key} onClick={()=>patch('machines',value.machines.filter(v=>v.key!==m.key))} aria-label={`Remove ${m.title}`}>{m.title} ×</button>)}</div>}{machines.length ? <><input type="search" aria-label="Find a machine to attach" placeholder="Find a machine…" value={machineQuery} onChange={e=>setMachineQuery(e.target.value)}/><div className="sales-inquiry-machine-list">{choices.map(m=><label className="sales-check" key={m.key}><input type="checkbox" checked={value.machines.some(v=>v.key===m.key)} onChange={e=>patch('machines',e.target.checked ? [...value.machines,m] : value.machines.filter(v=>v.key!==m.key))}/>{m.title}</label>)}</div>{machines.length>50 && <small>Search to find more machines.</small>}</> : <p>No machines available yet. You can attach one to the deal later.</p>}</details>
          {actor.canAssign && <label className="sales-field wide"><span>ASSIGNED TO</span><select value={value.assignedTo} onChange={e=>patch('assignedTo',e.target.value)}>{team.map(m=><option key={m.principalId} value={m.principalId}>{m.name}{m.principalId===actor.actorId ? ' (me)' : ''}</option>)}</select></label>}
          <h3 className="wide sales-inquiry-section">03 / NEXT STEP</h3>
          <label className="sales-check wide sales-inquiry-schedule"><input type="checkbox" checked={scheduled} onChange={e=>{setScheduled(e.target.checked);setDirty(true);command.current=null;}}/> Add a follow-up to the calendar</label>
          {scheduled && <><label className="sales-field wide"><span>NEXT ACTION *</span><input required maxLength={500} value={value.schedule.nextAction} onChange={e=>patch('schedule',{...value.schedule,nextAction:e.target.value})}/></label><label className="sales-field wide"><span>FOLLOW-UP DATE *</span><input type="date" required value={value.schedule.dueDate} onChange={e=>patch('schedule',{...value.schedule,dueDate:e.target.value})}/></label><SalesScheduleFields creation value={value.schedule} patch={(key,next)=>patch('schedule',{...value.schedule,[key]:next})}/></>}
        </fieldset>
        {error && <p role="alert" className="sales-error">{error}</p>}
        <div className="sales-inquiry-actions"><button type="button" onClick={close} disabled={busy}>CANCEL</button><button type="submit" className="sales-primary" disabled={busy || !actor.canWrite}>{busy ? 'SAVING…' : uncertain ? 'RETRY SAME SAVE' : scheduled ? 'SAVE INQUIRY + FOLLOW-UP' : 'SAVE INQUIRY'}</button></div>
      </div>
    </form>}
  </dialog>;
}
