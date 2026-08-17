import IXIEnterpriseDataTable from "../components/IXIEnterpriseDataTable";

const clean=value=>String(value??"").trim();
const typeOf=row=>clean(row.recordType||row.sourceRecordType||row.type||row.objectType||row.documentType).toUpperCase()||"RECORD";
const labelOf=row=>clean(row.title||row.label||row.displayName||row.name||row.number||row.documentNumber||row.recordId||row.id)||"IXI RECORD";
const identityOf=row=>clean(row.recordId||row.sourceRecordId||row.financialDocumentId||row.documentId||row.passportId||row.id);

export default function IXISearchResultsDesktop({query="",results=[],status="idle",error="",onOpenRecord,onClear}){
 const rows=Array.isArray(results)?results:[];
 const columns=[
  {key:"type",label:"TYPE",width:"110px",value:typeOf},
  {key:"label",label:"RECORD / OBJECT",width:"minmax(220px,1.5fr)",value:labelOf},
  {key:"identity",label:"CANONICAL ID",width:"minmax(220px,1.4fr)",value:identityOf},
  {key:"status",label:"STATUS",width:"130px",value:row=>clean(row.status||row.state||row.financialState).toUpperCase()},
  {key:"context",label:"CONTEXT",width:"minmax(220px,1.5fr)",value:row=>clean(row.contextLabel||row.assetLabel||row.customerLabel||row.vendorLabel||row.locationLabel||row.detail)}
 ];
 return <section className="td-workspace">
  <div className="td-workspace-title"><div><span>GLOBAL · CANONICAL IXI SEARCH</span><h1>SEARCH RESULTS</h1><p>Authorized record, Financial Document and Passport matches for <strong>{clean(query)||"—"}</strong>.</p></div><button type="button" onClick={onClear}>RETURN TO WORKSPACE</button></div>
  {status==="searching"?<div className="td-empty-state"><span>IXI SEARCH</span><strong>RESOLVING CANONICAL RECORDS</strong><p>Searching within the current authorized financial scope.</p></div>:null}
  {status==="error"?<div className="td-empty-state"><span>SEARCH UNAVAILABLE</span><strong>NO RESULTS CLAIMED</strong><p>{error||"Canonical search service unavailable."}</p></div>:null}
  {status!=="searching"&&status!=="error"?<IXIEnterpriseDataTable ariaLabel="IXI canonical search results" columns={columns} rows={rows} rowKey={row=>identityOf(row)||labelOf(row)} onRowOpen={onOpenRecord} emptyLabel="NO CANONICAL MATCHES IN THIS AUTHORIZED SCOPE." />:null}
 </section>;
}
