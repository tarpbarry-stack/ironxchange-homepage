import {buildMachineLedger,financialDocument} from '../../components/ixi-command-center/IXITransactMachineLedger.mjs';
const clean=v=>String(v??'').trim();
const allowed=new Set(['quote','service-quote','sales-order','invoice','service-invoice','payment','credit','settlement']);
export function projectDealFinancials(deal,records,inventory={}) {
  const rows=buildMachineLedger(records).rows;
  const linked=new Set(deal.financialDocumentIds || []);
  for(const raw of records){const doc=financialDocument(raw);if(clean(doc.metadata?.dealId || raw.metadata?.dealId || doc.quoteRecord?.identity?.dealId)===deal.id)linked.add(doc.financialDocumentId);}
  let changed=true;
  while(changed){changed=false;for(const row of rows)if(row.sourceId && linked.has(row.sourceId) && !linked.has(row.id)){linked.add(row.id);changed=true;}}
  const passports=new Set((deal.machines || []).map(m=>m.passportId));
  const match=row=>{const refs=row.document.references || [];return refs.some(ref=>passports.has(ref.passportId) && ['machine','asset'].includes(ref.role)) && refs.some(ref=>ref.passportId===deal.customerPassportId && ['customer','buyer','payer'].includes(ref.role));};
  const project=row=>({id:row.id,number:row.title,type:row.type,date:row.date,dueDate:row.dueDate,amountCents:row.amountCents,currency:row.currency,paymentStatus:row.paymentStatus || '',status:row.status,revision:row.revision,sourceId:row.sourceId,balanceCents:row.balanceCents ?? null,review:row.review,reason:row.reason});
  return {linked:rows.filter(r=>allowed.has(r.type) && linked.has(r.id)).map(project),matches:rows.filter(r=>allowed.has(r.type) && !linked.has(r.id) && match(r)).map(project),sales:(inventory.sales || []).filter(s=>linked.has(s.saleId)).map(s=>({saleId:s.saleId,assetPassportId:s.passportId,state:s.status,saleDate:s.saleDate,salePrice:s.salePrice,currency:s.currency,buyerLabel:s.buyerLabel,soldByLabel:s.soldByLabel,settlementStatus:s.settlementStatus,settlementId:s.settlementId})),generatedAt:new Date().toISOString()};
}
