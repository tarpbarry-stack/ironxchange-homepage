import {useEffect,useRef,useState} from "react";
import IXITransactDashboardRecordDrawer,{createIXIRecordIdentifier} from "./IXITransactDashboardRecordDrawer";
import {resolveIXITransactRecord} from "./data/IXITransactRecordClient";

const clean=value=>String(value??"").trim();
const obj=value=>value&&typeof value==="object"&&!Array.isArray(value)?value:{};

export default function IXIAttentionRecordInspector({record=null,entityPassportId="",accountingPeriod="",locationPassportId="",onClose=null}){
  const[resolvedRecord,setResolvedRecord]=useState(record);
  const[status,setStatus]=useState(record?"resolving":"idle");
  const[error,setError]=useState("");
  const requestRef=useRef(null);
  const recordKey=clean(record?.sourceRecordId||record?.recordId||record?.financialDocumentId||record?.passportId||record?.alertId);

  useEffect(()=>{
    requestRef.current?.abort?.();
    if(!record){setResolvedRecord(null);setStatus("idle");setError("");return undefined;}
    setResolvedRecord(record);
    const identifier=createIXIRecordIdentifier(record);
    if(!identifier.recordId&&!identifier.financialDocumentId&&!identifier.passportId){setStatus("error");setError("Attention item does not contain a canonical source identifier.");return undefined;}
    const controller=new AbortController();
    requestRef.current=controller;
    setStatus("resolving");
    setError("");
    resolveIXITransactRecord({
      identifier,
      scope:{entityPassportIds:clean(entityPassportId)?[clean(entityPassportId)]:[],locationPassportIds:clean(locationPassportId)?[clean(locationPassportId)]:[]},
      period:{accountingPeriod:clean(accountingPeriod)},
      signal:controller.signal
    }).then(result=>{
      if(controller.signal.aborted)return;
      const canonical=obj(result.record);
      setResolvedRecord(current=>({...obj(current),...canonical,_ixiPermissions:result.permissions,_ixiLineage:result.lineage,_ixiActions:result.actions,_ixiUnknownActionIds:result.unknownActionIds}));
      setStatus("resolved");
    }).catch(cause=>{
      if(cause?.name==="AbortError")return;
      setStatus("error");
      setError(clean(cause?.message)||"Canonical Attention source resolution is unavailable.");
    });
    return()=>controller.abort();
  },[recordKey,entityPassportId,accountingPeriod,locationPassportId]);

  return <IXITransactDashboardRecordDrawer record={resolvedRecord} onClose={onClose} resolutionStatus={status} resolutionError={error}/>;
}
