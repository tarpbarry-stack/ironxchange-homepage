import test from 'node:test';
import assert from 'node:assert/strict';
import {calendarRange,calendarDays,dateInZone,moveAnchor,eventOnDate,moveRecord} from '../lib/sales-desk/calendar.mjs';
import {normalizeInquiryPage} from '../lib/sales-desk/inquirySource.mjs';
test('week, month, leap-year and year-boundary navigation preserve real calendar dates',()=>{
  assert.deepEqual(calendarRange('2026-09-17','week'),{from:'2026-09-14',to:'2026-09-20'});
  const month=calendarRange('2026-09-17','month');assert.equal(calendarDays(month.from,month.to).length,42);
  assert.equal(moveAnchor('2026-12-31','month',1),'2027-01-01');assert.equal(moveAnchor('2028-02-28','day',1),'2028-02-29');
  assert.equal(dateInZone(new Date('2026-09-18T02:00:00Z'),'America/Chicago'),'2026-09-17');
});
test('multi-day appointments render on both dates; drops preserve source identity and revision',()=>{
  const event={kind:'tasks',id:'original',allDay:false,startAt:'2026-09-19T04:30:00Z',endAt:'2026-09-19T06:30:00Z',time:'23:30',timeZone:'America/Chicago',record:{id:'original',revision:4,durationMinutes:120,dealId:'deal',allDay:false,completed:false}};
  assert.equal(eventOnDate(event,'2026-09-18','America/Chicago'),true);assert.equal(eventOnDate(event,'2026-09-19','America/Chicago'),true);assert.equal(eventOnDate(event,'2026-09-20','America/Chicago'),false);
  const moved=moveRecord(event,'2026-09-20','America/Chicago');assert.equal(moved.id,'original');assert.equal(moved.revision,4);assert.equal(moved.dealId,'deal');assert.equal(moved.startTime,'23:30');assert.equal(moved.dueDate,'2026-09-20');
});
const relation=id=>({data:{id:{uuid:id}}});
const source=()=>({data:{data:[{id:{uuid:'transaction'},attributes:{processName:'default-inquiry',createdAt:'2026-09-17T12:00:00Z',protectedData:{message:'Please call',buyerEmail:'provided@example.test',buyerPhone:'555-000-1111'}},relationships:{provider:relation('seller'),customer:relation('buyer'),listing:relation('machine')}}],included:[{type:'listing',id:{uuid:'machine'},attributes:{title:'Loader',publicData:{passportId:'IXI-MACHINE'}},relationships:{author:relation('seller')}},{type:'user',id:{uuid:'buyer'},attributes:{email:'private-account-email@example.test',profile:{displayName:'Buyer',privateData:{secret:'private'}}}}],meta:{page:1,totalPages:2,totalItems:26}}});
test('inquiry source verifies seller and retains only buyer-submitted contact information',()=>{
  const result=normalizeInquiryPage(source(),'seller');assert.equal(result.rows[0].message,'Please call');assert.equal(result.rows[0].buyer.email,'provided@example.test');assert.equal(result.rows[0].machine.key,'passport:IXI-MACHINE');assert.equal(result.totalPages,2);assert.equal(JSON.stringify(result).includes('private-account-email'),false);assert.equal(JSON.stringify(result).includes('secret'),false);
  assert.throws(()=>normalizeInquiryPage(source(),'other-seller'),e=>e.status===403);
  const missing=source();missing.data.included=[];assert.equal(normalizeInquiryPage(missing,'seller').rows.length,0);assert.equal(normalizeInquiryPage(missing,'seller').issues.length,1);
});
