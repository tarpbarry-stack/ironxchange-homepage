import {useMemo,useState} from "react";
const clean=v=>String(v??"").trim();
const arr=v=>Array.isArray(v)?v:[];
export default function IXIEnterpriseDataTable({columns=[],rows=[],rowKey="id",onRowOpen=null,sortKey="",sortDirection="asc",onSort=null,selectable=false,selectedIds=[],onSelectionChange=null,emptyLabel="NO RECORDS",cursor=null,onNext=null,onPrevious=null,hasNext=false,hasPrevious=false,ariaLabel="IXI financial data table"}){
 const[focusIndex,setFocusIndex]=useState(0),selected=new Set(arr(selectedIds).map(clean));
 const visibleColumns=useMemo(()=>arr(columns).filter(c=>c?.visible!==false),[columns]);
 const template=visibleColumns.map(c=>c.width||"minmax(100px,1fr)").join(" ");
 const idFor=row=>clean(typeof rowKey==="function"?rowKey(row):row?.[rowKey]);
 const toggle=id=>{if(!selectable||!id)return;const next=new Set(selected);next.has(id)?next.delete(id):next.add(id);onSelectionChange?.([...next])};
 const open=(row,index)=>{setFocusIndex(index);onRowOpen?.(row)};
 return <div className="td-enterprise-table" role="grid" aria-label={ariaLabel} style={{"--td-grid-template":`${selectable?"34px ":""}${template}`}}>
  <div className="td-enterprise-head" role="row">{selectable?<span aria-hidden="true"/>:null}{visibleColumns.map(col=><button type="button" role="columnheader" key={col.key} className={col.sortable?"sortable":""} onClick={()=>col.sortable&&onSort?.(col.key,sortKey===col.key&&sortDirection==="asc"?"desc":"asc")}><span>{col.label}</span>{sortKey===col.key?<b>{sortDirection==="asc"?"▲":"▼"}</b>:null}</button>)}</div>
  <div className="td-enterprise-body">{rows.length?rows.map((row,index)=>{const id=idFor(row)||String(index);return <div role="row" tabIndex={focusIndex===index?0:-1} className="td-enterprise-row" key={id} onDoubleClick={()=>open(row,index)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();open(row,index)}if(e.key==="ArrowDown"){e.preventDefault();setFocusIndex(Math.min(rows.length-1,index+1))}if(e.key==="ArrowUp"){e.preventDefault();setFocusIndex(Math.max(0,index-1))}}}>{selectable?<label className="td-enterprise-select"><input type="checkbox" checked={selected.has(id)} onChange={()=>toggle(id)} aria-label={`Select ${id}`}/></label>:null}{visibleColumns.map(col=><button type="button" role="gridcell" key={col.key} onClick={()=>open(row,index)} title={clean(typeof col.value==="function"?col.value(row):row?.[col.key])}>{col.render?col.render(row):clean(typeof col.value==="function"?col.value(row):row?.[col.key])||"—"}</button>)}</div>}):<div className="td-table-empty">{emptyLabel}</div>}</div>
  {(hasPrevious||hasNext||cursor)?<div className="td-enterprise-pager"><button type="button" disabled={!hasPrevious} onClick={onPrevious}>‹ PREVIOUS</button><span>{cursor?`CURSOR ${String(cursor).slice(0,18)}`:"PAGE"}</span><button type="button" disabled={!hasNext} onClick={onNext}>NEXT ›</button></div>:null}
 </div>;
}
