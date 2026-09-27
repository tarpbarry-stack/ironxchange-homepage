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
const root=fs.mkdtempSync(path.join(os.tmpdir(),'inquiry-ui-'));
process.env.IXI_MOS_STORAGE_PROVIDER='sqlite';process.env.IXI_MOS_DATA_ROOT=path.join(root,'mos');process.env.IXI_PASSPORT_DATA_FILE=path.join(root,'passports.json');
const manual=coreRequire('./sales/IXISalesDeskManualInquiry');
const service=coreRequire('./sales/IXISalesDeskService'),work=coreRequire('./sales/IXISalesDeskWork'),repo=coreRequire('./sales/IXISalesDeskRepository');
const {ensureAosAccount,bindOwnerMembershipIdentity}=coreRequire('./mos/accounts/aosAccountService'),{provisionAosObject}=coreRequire('./mos/provisioning/aosObjectProvisioningService');
const account=ensureAosAccount({ownerUserId:'ui-owner',displayName:'UI test company'}),entityId=account.entity.entityId,person=provisionAosObject({commandId:'inquiry-ui-owner',entityId,objectType:'person',displayName:'Owner',actorId:'ui-owner'});
bindOwnerMembershipIdentity({accountId:account.account.accountId,ownerUserId:'ui-owner',personObjectId:person.identity.objectId,personPassportId:person.identity.passportId});
const actor=service.authorize({authenticated:true,entityId,principalId:'ui-owner'}),team=[{principalId:actor.actorId,name:'Owner'}];
const {JSDOM}=coreRequire('jsdom'),dom=new JSDOM('<div id="root"></div>',{url:'https://calendar-test.invalid'});
globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.IS_REACT_ACT_ENVIRONMENT=true;
dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};dom.window.confirm=()=>true;
const React=require('react'),{act}=React,{createRoot}=require('react-dom/client'),swc=require('next/dist/build/swc');await swc.loadBindings();
const cache=new Map(),sourceRoot=fileURLToPath(new URL('../',import.meta.url)),commands=[];let interruptNext=false;
const request=async(raw,{body}={})=>{
  const u=new URL(raw,'https://test.invalid/'),parts=u.pathname.slice(1).split('/'),q=Object.fromEntries(u.searchParams);
  if(parts[0]==='inquiries'){commands.push(body);const result=manual.capture(actor,body);if(interruptNext){interruptNext=false;throw new Error('Response lost after durable save');}return result;}
  if(parts[0]==='calendar')return parts[1]==='preview' ? work.preview(actor,body) : work.calendar(actor,q);
  if(parts[0]==='commands'){commands.push(body);const result=service.save(actor,body);if(interruptNext){interruptNext=false;throw new Error('Response lost after durable save');}return result;}
  if(parts[0]==='related')return service.related(actor,parts[1],parts[2]);
  if(parts[0]==='records')return parts[2] ? {record:service.getRecord(actor,parts[1],parts[2]),history:repo.history(entityId,parts[1],parts[2])} : service.listRecords(actor,parts[1],q);
  throw new Error(`Unexpected route ${raw}`);
};
function load(file){const full=path.resolve(sourceRoot,file);if(cache.has(full))return cache.get(full).exports;const module={exports:{}};cache.set(full,module);const {code}=swc.transformSync(fs.readFileSync(full,'utf8'),{filename:full,jsc:{parser:{syntax:'ecmascript',jsx:true},target:'es2022',transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});new Function('require','module','exports',code)(name=>{if(name.endsWith('/salesDeskClient'))return {...load('components/ixi-sales-desk/salesDeskClient.js'),salesRequest:request};if(name.startsWith('.')){const target=path.resolve(path.dirname(full),name);return load(['','.js','.jsx','.mjs'].map(ext=>target+ext).find(p=>fs.existsSync(p)));}return createRequire(full)(name);},module,module.exports);return module.exports;}
const Inquiry=load('components/ixi-sales-desk/SalesDeskInquiry.jsx').default,Calendar=load('components/ixi-sales-desk/SalesDeskCalendar.jsx').default;
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===text);
const field=label=>[...document.querySelectorAll('label')].find(el=>el.firstElementChild?.textContent===label)?.querySelector('input,select,textarea');
async function fill(label,value){const el=field(label);assert.ok(el,`field ${label} exists`);await act(async()=>{const proto=el.tagName==='SELECT' ? dom.window.HTMLSelectElement.prototype : el.tagName==='TEXTAREA' ? dom.window.HTMLTextAreaElement.prototype : dom.window.HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,value);el.dispatchEvent(new dom.window.Event(el.tagName==='SELECT' ? 'change' : 'input',{bubbles:true}));await tick();});}
let savedResult;
function Harness(){const [open,setOpen]=React.useState(true),[focus,setFocus]=React.useState(null),[revision,setRevision]=React.useState(0);return React.createElement(React.Fragment,null,open && React.createElement(Inquiry,{actor,team,contacts:[],machines:[{key:'listing:loader',listingId:'loader',title:'Loader'}],onClose:()=>setOpen(false),onSaved:r=>{savedResult=r;setRevision(n=>n+1);},onCalendar:d=>{setFocus({date:d.dueDate,zone:d.timeZone,assignedTo:d.assignedTo});setOpen(false);},onDeal:()=>setOpen(false)}),React.createElement(Calendar,{actor,team,focus,revision,onOpen:()=>{},onContext:()=>{},onCreate:()=>{},onSaved:()=>{}}));}
test.after(()=>{dom.window.close();fs.rmSync(root,{recursive:true,force:true});});
test('the inquiry form recovers a lost response and opens its single connected follow-up on the correct future calendar day',async()=>{
  const reactRoot=createRoot(document.getElementById('root'));
  try{
    await act(async()=>{reactRoot.render(React.createElement(Harness));await tick();});
    await fill('NAME *','Caller Customer');await fill('PHONE','555-123-4567');await fill('WHAT ARE THEY LOOKING FOR? *','Loader for a new crew');await fill('CONVERSATION / ORIGINAL MESSAGE','Called about loader availability.');
    await act(async()=>{document.querySelector('.sales-inquiry-machine-list input').click();document.querySelector('.sales-inquiry-schedule input').click();await tick();});
    await fill('FOLLOW-UP DATE *','2027-02-15');await fill('SCHEDULE','timed');await fill('START TIME','11:30');await fill('TIME ZONE','America/Chicago');await fill('NEXT ACTION *','Call back about loader');
    interruptNext=true;
    await act(async()=>{document.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await tick();});
    assert.match(document.querySelector('[role="alert"]').textContent,/Retry the same save/);assert.equal(field('NAME *').closest('fieldset').disabled,true);assert.equal(repo.list(entityId,'inquiries').total,1);
    await act(async()=>{button('RETRY SAME SAVE').click();await tick();});
    assert.equal(commands.length,2);assert.deepEqual(commands[0],commands[1]);assert.equal(repo.list(entityId,'contacts').total,1);assert.equal(repo.list(entityId,'deals').total,1);assert.equal(repo.list(entityId,'tasks').total,0);assert.equal(repo.list(entityId,'inquiries').total,1);
    assert.equal(savedResult.record.message,'Called about loader availability.');assert.equal(savedResult.deal.machines[0].key,'listing:loader');
    await act(async()=>{button('VIEW ON CALENDAR ↗').click();await tick();});
    assert.equal(document.querySelector('[aria-label="Calendar date"]').value,'2027-02-15');assert.equal(document.querySelector('[aria-label="Calendar time zone"]').value,'America/Chicago');assert.equal(document.querySelectorAll('.sales-calendar-event').length,1);assert.match(document.querySelector('.sales-calendar-event').textContent,/Call back about loader/);assert.match(document.querySelector('.sales-calendar-event').textContent,/11:30/);
  }finally{await act(()=>reactRoot.unmount());}
});
