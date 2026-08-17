import IXIEnterpriseDataTable from "../components/IXIEnterpriseDataTable";

const clean=value=>String(value??"").trim();
const money=(value,currency="USD")=>value===null||value===undefined?"—":new Intl.NumberFormat("en-US",{style:"currency",currency,maximumFractionDigits:2}).format(Number(value));
const date=value=>{const text=clean(value);if(!text)return "—";const parsed=new Date(text);return Number.isNaN(parsed.getTime())?text:parsed.toLocaleDateString("en-US");};

export default function IXIReconciliationDesktop({model={},onOpenRecord}){
 const rows=Array.isArray(model.accounts)?model.accounts:[];
 const columns=[
  {key:"name",label:"ACCOUNT",width:"minmax(190px,1.4fr)",sortable:true,value:row=>row.name||row.accountId},
  {key:"institution",label:"INSTITUTION",width:"minmax(140px,1fr)",sortable:true},
  {key:"bookBalance",label:"BOOK",width:"minmax(120px,.8fr)",sortable:true,render:row=><b>{money(row.bookBalance,model.currency)}</b>},
  {key:"statementBalance",label:"LAST STATEMENT",width:"minmax(120px,.8fr)",sortable:true,render:row=>money(row.statementBalance,model.currency)},
  {key:"difference",label:"DIFFERENCE",width:"minmax(120px,.8fr)",sortable:true,render:row=><b>{money(row.difference,model.currency)}</b>},
  {key:"status",label:"CONTROL STATUS",width:"minmax(150px,1fr)",sortable:true,render:row=><span>{clean(row.status).replace(/-/g," ").toUpperCase()}</span>},
  {key:"lastReconciledAt",label:"LAST RECONCILED",width:"minmax(140px,1fr)",sortable:true,render:row=>date(row.lastReconciledAt)}
 ];
 return <section className="td-workspace">
  <div className="td-workspace-title"><div><span>CASH · BANK CONTROL</span><h1>RECONCILIATION</h1><p>Book balance versus verified statement control. No direct balance editing and no false reconciled state without statement evidence.</p></div></div>
  <div className="td-kpi-strip">
   <div className="td-kpi"><span>ACCOUNTS</span><strong>{model.summary?.accounts??rows.length}</strong></div>
   <div className="td-kpi"><span>RECONCILED</span><strong>{model.summary?.reconciled??0}</strong></div>
   <div className="td-kpi"><span>OUT OF BALANCE</span><strong>{model.summary?.outOfBalance??0}</strong></div>
   <div className="td-kpi"><span>NEEDS STATEMENT</span><strong>{model.summary?.needsStatement??0}</strong></div>
   <div className="td-kpi"><span>OPEN DIFFERENCE</span><strong>{money(model.summary?.openDifference,model.currency)}</strong></div>
  </div>
  <div className="td-panel"><div className="td-panel-head"><span>RECONCILIATION CONTROL</span><strong>STATEMENT → ADJUSTED BANK → BOOK</strong></div><div className="td-control-note">Canonical reconciliation follows the TRAN$ACT treasury contract: statement balance + deposits in transit − outstanding payments + other reconciling items = adjusted bank balance; book balance − adjusted bank balance = difference.</div></div>
  <IXIEnterpriseDataTable ariaLabel="IXI treasury reconciliation accounts" columns={columns} rows={rows} rowKey={row=>row.accountId} onRowOpen={row=>onOpenRecord?.({...row,title:row.name||row.accountId,sourceRecordType:"treasury-account",sourceRecordId:row.accountId,recordType:"treasury-account",recordId:row.accountId,workspace:"reconciliation",detail:row.status==="needs-statement"?"No verified statement balance is available for this account.":`Reconciliation difference ${money(row.difference,model.currency)}`})} emptyLabel="NO TREASURY ACCOUNTS RETURNED FOR RECONCILIATION." />
 </section>;
}
