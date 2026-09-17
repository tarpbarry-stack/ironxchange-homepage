import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
if(!process.env.IXI_CORE_CONTRACT_ROOT)throw new Error('Calendar interaction verification requires the paired core.');
const coreRequire=createRequire(path.join(path.resolve(process.env.IXI_CORE_CONTRACT_ROOT),'package.json'));
const root=fs.mkdtempSync(path.join(os.tmpdir(),'calendar-ui-'));
process.env.IXI_MOS_STORAGE_PROVIDER='sqlite';process.env.IXI_MOS_DATA_ROOT=path.join(root,'mos');process.env.IXI_PASSPORT_DATA_FILE=path.join(root,'passports.json');
const service=coreRequire('./sales/IXISalesDeskService'),work=coreRequire('./sales/IXISalesDeskWork'),repo=coreRequire('./sales/IXISalesDeskRepository');
const {ensureAosAccount,bindOwnerMembershipIdentity}=coreRequire('./mos/accounts/aosAccountService'),{provisionAosObject}=coreRequire('./mos/provisioning/aosObjectProvisioningService');
const account=ensureAosAccount({ownerUserId:'ui-owner',displayName:'UI test company'}),entityId=account.entity.entityId,person=provisionAosObject({commandId:'calendar-ui-owner',entityId,objectType:'person',displayName:'Owner',actorId:'ui-owner'});
bindOwnerMembershipIdentity({accountId:account.account.accountId,ownerUserId:'ui-owner',personObjectId:person.identity.objectId,personPassportId:person.identity.passportId});
const actor=service.authorize({authenticated:true,entityId,principalId:'ui-owner'}),team=[{principalId:actor.actorId,name:'Owner'}];
const {JSDOM}=coreRequire('jsdom'),dom=new JSDOM('<div id="root"></div>',{url:'https://calendar-test.invalid'});
globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.IS_REACT_ACT_ENVIRONMENT=true;
dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};dom.window.confirm=()=>true;
const React=require('react'),{act}=React,{createRoot}=require('react-dom/client'),swc=require('next/dist/build/swc');await swc.loadBindings();
const cache=new Map(),sourceRoot=fileURLToPath(new URL('../',import.meta.url)),commands=[];let interruptNext=false;
const request=async(raw,{body}={})=>{
  const u=new URL(raw,'https://test.invalid/'),parts=u.pathname.slice(1).split('/'),q=Object.fromEntries(u.searchParams);
  if(parts[0]==='calendar')return parts[1]==='preview' ? work.preview(actor,body) : work.calendar(actor,q);
  if(parts[0]==='commands'){commands.push(body);const result=service.save(actor,body);if(interruptNext){interruptNext=false;throw new Error('Response lost after durable save');}return result;}
  if(parts[0]==='related')return service.related(actor,parts[1],parts[2]);
  if(parts[0]==='records')return parts[2] ? {record:service.getRecord(actor,parts[1],parts[2]),history:repo.history(entityId,parts[1],parts[2])} : service.listRecords(actor,parts[1],q);
  throw new Error(`Unexpected route ${raw}`);
};
function load(file){const full=path.resolve(sourceRoot,file);if(cache.has(full))return cache.get(full).exports;const module={exports:{}};cache.set(full,module);const {code}=swc.transformSync(fs.readFileSync(full,'utf8'),{filename:full,jsc:{parser:{syntax:'ecmascript',jsx:true},target:'es2022',transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});new Function('require','module','exports',code)(name=>{if(name.endsWith('/salesDeskClient'))return {...load('components/ixi-sales-desk/salesDeskClient.js'),salesRequest:request};if(name.startsWith('.')){const target=path.resolve(path.dirname(full),name);return load(['','.js','.jsx','.mjs'].map(ext=>target+ext).find(p=>fs.existsSync(p)));}return createRequire(full)(name);},module,module.exports);return module.exports;}
const Calendar=load('components/ixi-sales-desk/SalesDeskCalendar.jsx').default,Editor=load('components/ixi-sales-desk/SalesDeskEditor.jsx').default,{nextSchedule}=load('lib/sales-desk/calendar.mjs');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
let liveEditor;
function Harness(){const [editor,setEditor]=React.useState(null),[revision,setRevision]=React.useState(0);liveEditor=setEditor;return React.createElement(React.Fragment,null,React.createElement(Calendar,{actor,team,revision,onCreate:date=>setEditor({kind:'tasks',record:nextSchedule({title:'',dueDate:date,assignedTo:actor.actorId})}),onOpen:(kind,record)=>setEditor({kind,record}),onContext:()=>{},onSaved:()=>setRevision(n=>n+1)}),editor && React.createElement(Editor,{key:editor.record.id || 'new',editor,actor,team,people:[],onClose:()=>setEditor(null),onSaved:()=>setRevision(n=>n+1),onOpenMachines:()=>{},onFollowUp:()=>{},onOpenLinked:()=>{}}));}
const button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===text);
const field=label=>[...document.querySelectorAll('label')].find(el=>el.firstElementChild?.textContent===label)?.querySelector('input,select,textarea');
async function fill(label,value){const el=field(label);assert.ok(el,`field ${label} exists`);await act(async()=>{const proto=el.tagName==='SELECT' ? dom.window.HTMLSelectElement.prototype : el.tagName==='TEXTAREA' ? dom.window.HTMLTextAreaElement.prototype : dom.window.HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,value);el.dispatchEvent(new dom.window.Event(el.tagName==='SELECT' ? 'change' : 'input',{bubbles:true}));await tick();});}
test.after(()=>{dom.window.close();fs.rmSync(root,{recursive:true,force:true});});
test('the real calendar and editor create, recover, reopen, complete, and reveal the same durable appointment',async()=>{
  const reactRoot=createRoot(document.getElementById('root'));
  try{
    await act(async()=>{reactRoot.render(React.createElement(Harness));await tick();});
    await act(async()=>{button('+ APPOINTMENT').click();await tick();});
    await fill('FOLLOW-UP *','Inspect the loader');await fill('SCHEDULE','timed');await fill('START TIME','10:30');await fill('TIME ZONE','America/Chicago');
    interruptNext=true;
    await act(async()=>{document.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await tick();});
    assert.match(document.querySelector('[role="alert"]').textContent,/Response lost/);assert.equal(field('FOLLOW-UP *').value,'Inspect the loader');
    await act(async()=>{document.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await tick();});
    assert.equal(commands[0].commandId,commands[1].commandId);assert.equal(repo.list(entityId,'tasks').total,1);
    const saved=repo.list(entityId,'tasks').items[0];assert.equal(saved.timeZone,'America/Chicago');assert.equal(saved.startTime,'10:30');
    await act(async()=>{document.querySelector('[aria-label="Close record"]').click();await tick();});
    assert.match(document.querySelector('.sales-calendar-event').textContent,/Inspect the loader/);
    await act(async()=>{document.querySelector('.sales-calendar-event > button').click();await tick();});
    await fill('STATUS','done');await fill('CALL / FOLLOW-UP OUTCOME','Buyer approved the machine.');
    await act(async()=>{document.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await tick();});
    await act(async()=>{document.querySelector('[aria-label="Close record"]').click();await tick();});
    assert.equal(document.querySelector('.sales-calendar-event'),null);
    await act(async()=>{document.querySelector('.sales-calendar-controls input[type="checkbox"]').click();await tick();});
    assert.match(document.querySelector('.sales-calendar-event').textContent,/COMPLETED/);assert.equal(repo.get(entityId,'tasks',saved.id).outcome,'Buyer approved the machine.');
  }finally{await act(()=>reactRoot.unmount());}
});
test('the editor retains a rejected stale edit instead of overwriting another user’s appointment',async()=>{
  const reactRoot=createRoot(document.getElementById('root')),record=repo.list(entityId,'tasks').items[0];
  try{
    await act(async()=>{reactRoot.render(React.createElement(Harness));await tick();});
    await act(async()=>{liveEditor({kind:'tasks',record});await tick();});
    service.save(actor,{kind:'tasks',commandId:crypto.randomUUID(),revision:record.revision,record:{...record,title:'Changed by another session'}});
    await fill('FOLLOW-UP *','My unsaved title');
    await act(async()=>{document.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await tick();});
    assert.match(document.querySelector('[role="alert"]').textContent,/another session/);assert.equal(field('FOLLOW-UP *').value,'My unsaved title');assert.equal(repo.get(entityId,'tasks',record.id).title,'Changed by another session');
  }finally{await act(()=>reactRoot.unmount());}
});

test('dragging an appointment asks for confirmation and reschedules the original record',async()=>{
  let record=repo.list(entityId,'tasks').items[0];record=service.save(actor,{kind:'tasks',commandId:crypto.randomUUID(),revision:record.revision,record:{...record,completed:false}}).record;
  const reactRoot=createRoot(document.getElementById('root'));
  try{
    await act(async()=>{reactRoot.render(React.createElement(Harness));await tick();});
    const tile=document.querySelector('.sales-calendar-event'),target=[...document.querySelectorAll('.sales-calendar-day')].find(d=>!d.contains(tile));
    assert.ok(tile && target);
    const day=target.querySelector('header button[aria-label]').getAttribute('aria-label').replace('Add appointment ','');
    await act(async()=>{const drag=new dom.window.Event('dragstart',{bubbles:true});Object.defineProperty(drag,'dataTransfer',{value:{setData(){},effectAllowed:''}});tile.dispatchEvent(drag);target.dispatchEvent(new dom.window.Event('drop',{bubbles:true,cancelable:true}));await tick();});
    assert.ok(document.querySelector('[aria-label="Confirm reschedule"]'));assert.equal(repo.get(entityId,'tasks',record.id).dueDate,record.dueDate);
    await act(async()=>{button('CONFIRM RESCHEDULE').click();await tick();});
    assert.equal(repo.get(entityId,'tasks',record.id).dueDate,day);assert.equal(repo.list(entityId,'tasks').total,1);assert.match(document.body.textContent,/Rescheduled and saved everywhere/);
  }finally{await act(()=>reactRoot.unmount());}
});
