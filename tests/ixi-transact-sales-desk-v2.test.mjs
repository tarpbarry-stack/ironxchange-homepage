import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {projectDealFinancials} from '../lib/sales-desk/dealFinancials.mjs';
import {buyerMachine,createBuyerPdf} from '../lib/sales-desk/buyerPackage.mjs';
const deal={id:'deal-a',customerPassportId:'BUYER-A',machines:[{passportId:'M1'}]};
const doc=(id,type,extra={})=>({financialDocument:{financialDocumentId:id,documentNumber:id.toUpperCase(),documentType:type,financialState:'posted',occurredAt:'2026-02-04',currency:'USD',totals:{total:82000},references:[{role:'machine',passportId:'M1'},{role:'customer',passportId:'BUYER-A'}],...extra},server:{revision:1}});
test('deal financials follow explicit quote lineage and preserve historical sale facts',()=>{
  const rows=[doc('quote-a','quote',{metadata:{dealId:'deal-a'}}),doc('order-a','sales-order',{sourceFinancialDocumentId:'quote-a'}),doc('invoice-a','invoice',{sourceFinancialDocumentId:'order-a'}),doc('payment-a','payment',{sourceFinancialDocumentId:'invoice-a'}),doc('settlement-a','settlement',{sourceFinancialDocumentId:'invoice-a'})];
  const result=projectDealFinancials(deal,rows,{sales:[{saleId:'invoice-a',passportId:'M1',status:'sold',saleDate:'2026-02-04',salePrice:82000,buyerLabel:'Buyer',soldByLabel:'Sam',settlementStatus:'open'},{saleId:'unrelated',saleDate:'2026-09-06'}]});
  assert.equal(result.linked.length,5);assert.equal(result.matches.length,0);assert.equal(result.sales.length,1);assert.equal(result.sales[0].saleDate,'2026-02-04');assert.equal(result.sales[0].salePrice,82000);assert.equal(result.sales[0].assetPassportId,'M1');assert.equal(result.sales[0].state,'sold');
});
test('matching requires both machine and customer, and never auto-links a candidate',()=>{
  const refs=(machine,customer)=>[{role:'machine',passportId:machine},{role:'customer',passportId:customer}];
  const result=projectDealFinancials(deal,[doc('match','invoice'),doc('other-buyer','invoice',{references:refs('M1','BUYER-B')}),doc('other-machine','invoice',{references:refs('M2','BUYER-A')}),doc('cost','expense')]);
  assert.equal(result.linked.length,0);assert.deepEqual(result.matches.map(r=>r.id),['match']);
});
test('latest revisions and missing amounts remain distinguishable from recorded zero',()=>{
  const old=doc('missing','invoice',{totals:{},amount:undefined}),zero=doc('zero','invoice',{totals:{total:0}}),current={...old,server:{revision:3}};
  const result=projectDealFinancials({...deal,financialDocumentIds:['missing','zero']},[old,zero,current]);assert.equal(result.linked.find(r=>r.id==='missing').amountCents,null);assert.equal(result.linked.find(r=>r.id==='missing').revision,3);assert.equal(result.linked.find(r=>r.id==='zero').amountCents,0);
});
test('buyer snapshot includes only selected customer-facing information',()=>{
  const input={id:'listing1',title:'2017 Loader',passportId:'M1',price:'$82,000',hours:4500,serialNumber:'SN1',publicData:{acquisitionCost:40000,notes:'internal'},internalNotes:'secret',image:'https://example.test/photo.jpg'};
  const visible=buyerMachine(input,{includePrice:false,includeSerial:false});assert.equal(visible.price,'');assert.equal(visible.serialNumber,'');assert.equal(visible.hours,'4500');assert.equal(JSON.stringify(visible).includes('secret'),false);assert.equal(JSON.stringify(visible).includes('40000'),false);
});
test('buyer PDF handles long text and missing images without hiding the export warning',async()=>{
  const record={title:'Equipment selection',company:'IXI Test',customerName:'Test buyer',createdAt:'2026-09-17T00:00:00Z',revision:1,message:'Inspection details '.repeat(80),machines:[{key:'passport:M1',title:'2017 DEERE 544K II',hours:'4500',price:'$82,000',image:'https://example.test/missing.jpg'}]};
  const result=await createBuyerPdf(record,{fontBytes:fs.readFileSync(new URL('../public/fonts/IXI-Document-Sans.ttf',import.meta.url)),loadPhoto:async()=>({ok:false})});
  assert.deepEqual(result.missingPhotos,['2017 DEERE 544K II']);const {PDFDocument}=await import('pdf-lib');const pdf=await PDFDocument.load(await result.blob.arrayBuffer());assert.ok(pdf.getPageCount()>=2);assert.equal(pdf.getTitle(),record.title);
});
