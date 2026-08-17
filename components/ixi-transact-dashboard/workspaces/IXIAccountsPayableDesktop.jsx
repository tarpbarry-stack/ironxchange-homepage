import {useMemo,useState} from "react";
import IXIEnterpriseDataTable from "../components/IXIEnterpriseDataTable";
const money=(v,c="USD")=>v===null||v===undefined?"—":new Intl.NumberFormat("en-US",{style:"currency",currency:c,maximumFractionDigits:0}).format(Number(v));
const clean=v=>String(v??"").trim();
export default function IXIAccountsPayableDesktop({model={},onOpenRecord,filters={},onFiltersChange}){
 const[localFilter,setLocalFilter]=useState(clean(filters.status||"all")||"all"),[localSearch,setLocalSearch]=useState(clean(filters.q));
 const filter=clean(filters.status||localFilter||"all"),search=filters.q!==undefined?clean(filters.q):localSearch;
 const setFilter=value=>{setLocalFilter(value);onFiltersChange?.({...filters,status:value,q:search})};
 const setSearch=value=>{setLocalSearch(value);onFiltersChange?.({...filters,status:filter,q:value})};
 const rows=useMemo(()=>model.payables?.filter(r=>{const q=search.toLowerCase(),s=clean(r.status);const match=filter==="all"||s===filter||(filter==="exceptions"&&["match-exception","hold","disputed"].includes(s));return match&&(!q||[r.vendorLabel,r.billNumber,r.billId].some(v=>clean(v).toLowerCase().includes(q)))})||[],[model.payables,filter,search]);
 const columns=useMemo(()=>[
  {key:"vendor",label:"VENDOR",width:"1.35fr",sortable:true,value:r=>r.vendorLabel,render:r=><strong>{r.vendorLabel||"VENDOR"}</strong>},
  {key:"bill",label:"BILL",width:".9fr",sortable:true,value:r=>r.billNumber||r.billId},
  {key:"original",label:"ORIGINAL",width:".8fr",value:r=>r.originalAmount,render:r=>money(r.originalAmount,model.currency)},
  {key:"paid",label:"PAID",width:".8fr",value:r=>r.paid,render:r=>money(r.paid,model.currency)},
  {key:"balance",label:"OPEN",width:".8fr",sortable:true,value:r=>r.balance,render:r=><b>{money(r.balance,model.currency)}</b>},
  {key:"due",label:"DUE",width:".9fr",sortable:true,value:r=>r.dueDate},
  {key:"approval",label:"APPROVAL",width:".85fr",value:r=>r.approvalStatus,render:r=>clean(r.approvalStatus).toUpperCase()||"—"},
  {key:"match",label:"MATCH",width:".8fr",value:r=>r.matchStatus,render:r=>clean(r.matchStatus).toUpperCase()||"—"},
  {key:"status",label:"STATUS",width:".8fr",sortable:true,value:r=>r.status,render:r=><span className={["overdue","hold","disputed","match-exception"].includes(clean(r.status).toLowerCase())?"td-red":"td-green"}>{clean(r.status).toUpperCase()||"OPEN"}</span>}
 ],[model.currency]);
 const t=model.totals||{};
 const openRecord=r=>onOpenRecord?.({...r,title:r.vendorLabel,sourceRecordId:r.billId||r.billNumber,sourceRecordType:"bill",workspace:"ap",detail:`${r.billNumber||"BILL"} · ${r.status||"open"}`});
 return <section className="td-workspace"><div className="td-workspace-title"><div><span>MONEY OUT · PAYABLE CONTROL</span><h1>ACCOUNTS PAYABLE</h1><p>Vendor obligations, approvals, match control and scheduled cash out.</p></div><input className="td-workspace-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="VENDOR / BILL"/></div><div className="td-kpi-strip">{[["TOTAL A/P",t.totalAP],["CURRENT",t.current],["OVERDUE",t.overdue],["NEEDS APPROVAL",t.needsApproval],["MATCH EXCEPTION",t.matchException],["SCHEDULED",t.scheduled]].map(([l,v])=><div className="td-kpi" key={l}><span>{l}</span><strong>{money(v,model.currency)}</strong></div>)}</div><div className="td-toolbar">{[["all","ALL"],["overdue","OVERDUE"],["needs-approval","APPROVAL"],["exceptions","EXCEPTIONS"]].map(([id,l])=><button type="button" className={filter===id?"on":""} onClick={()=>setFilter(id)} key={id}>{l}</button>)}</div><IXIEnterpriseDataTable columns={columns} rows={rows} rowKey={r=>r.billId||r.billNumber} onRowOpen={openRecord} sortKey={clean(filters.sort)} sortDirection={clean(filters.direction||"asc")} onSort={(sort,direction)=>onFiltersChange?.({...filters,status:filter,q:search,sort,direction})} cursor={filters.cursor||null} hasNext={Boolean(model.pagination?.hasNext)} hasPrevious={Boolean(model.pagination?.hasPrevious)} onNext={()=>onFiltersChange?.({...filters,cursor:model.pagination?.nextCursor||""})} onPrevious={()=>onFiltersChange?.({...filters,cursor:model.pagination?.previousCursor||""})} emptyLabel="NO PAYABLE ROWS RETURNED FOR THIS SCOPE." ariaLabel="IXI accounts payable"/></section>;
}
