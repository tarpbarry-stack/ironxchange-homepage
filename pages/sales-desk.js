import Head from "next/head";
import { useEffect,useState } from "react";
import IXIDashboard from "../components/ixi-dashboard/IXIDashboard";
import { salesRequest,todayLocal } from "../components/ixi-sales-desk/salesDeskClient";
import styles from "../components/ixi-sales-desk/salesDesk.module.css";

export default function SalesDeskPage() {
  const [access,setAccess]=useState(null),[error,setError]=useState(null),[retry,setRetry]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();setError(null);
    salesRequest(`bootstrap?today=${todayLocal()}`,{signal:controller.signal}).then(setAccess).catch(error=>{if(error.name!=="AbortError")setError(error);});
    return ()=>controller.abort();
  },[retry]);
  if (access) return <IXIDashboard salesDeskContext={access} />;
  return <main className={styles.salesDesk}><Head><title>IXI Sales Desk</title><meta name="robots" content="noindex,nofollow" /></Head><div className="sales-gate"><span className="sales-brand">IXI</span><p className="sales-eyebrow">YOUR MACHINES. YOUR CUSTOMERS.</p><h1>SALES DESK</h1><p role={error ? "alert" : "status"}>{error?.message || "Verifying your company access…"}</p>{error && <div className="sales-actions">{error.status===401 && <a href="/login?next=%2Fsales-desk">SIGN IN</a>}<button onClick={()=>setRetry(value=>value+1)}>TRY AGAIN</button></div>}<a href="/account">← HOME</a></div></main>;
}
