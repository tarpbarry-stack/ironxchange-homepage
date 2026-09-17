import Head from "next/head";
import { useEffect,useRef,useState } from "react";
import IXIDashboard from "../components/ixi-dashboard/IXIDashboard";
import { salesRequest,todayLocal } from "../components/ixi-sales-desk/salesDeskClient";
import styles from "../components/ixi-sales-desk/salesDesk.module.css";

export default function SalesDeskPage() {
  const [access,setAccess]=useState(null),[error,setError]=useState(null),[retry,setRetry]=useState(0),[companies,setCompanies]=useState([]),[invitation,setInvitation]=useState(null),[accepting,setAccepting]=useState(false);
  const requestSequence=useRef(0);
  useEffect(()=>{
    const controller=new AbortController();setError(null);
    const params=new URLSearchParams(window.location.search),token=window.location.hash.slice(1);
    if(params.get("invitation") && token){setInvitation({id:params.get("invitation"),entityId:params.get("company"),token});return()=>controller.abort();}
    const load=async()=>{
      const seq=++requestSequence.current;
      try {
        const companyList=await salesRequest("companies",{signal:controller.signal});if(seq!==requestSequence.current)return;setCompanies(companyList.companies || []);
        if(!params.get("company") && companyList.companies?.length===1){window.history.replaceState(null,"",`/sales-desk?company=${encodeURIComponent(companyList.companies[0].entityId)}`);}
        if(!params.get("company") && companyList.companies?.length>1)return;
        if(!companyList.companies?.length)throw Object.assign(new Error("You do not have an active Sales Desk seat. Ask your company owner for an invitation."),{status:403});
        const result=await salesRequest(`bootstrap?today=${todayLocal()}`,{signal:controller.signal});if(seq===requestSequence.current)setAccess(result);
      }catch(e){if(e.name!=="AbortError" && seq===requestSequence.current){setAccess(null);setError(e);}}
    };
    load();const refresh=()=>load();window.addEventListener("focus",refresh);
    return()=>{requestSequence.current++;controller.abort();window.removeEventListener("focus",refresh);};
  },[retry]);
  const accept=async()=>{setAccepting(true);setError(null);try{const result=await salesRequest("invitations/accept",{body:invitation});window.location.assign(`/sales-desk?company=${encodeURIComponent(result.entityId)}`);}catch(e){setError(e);}finally{setAccepting(false);}};
  if(invitation)return <main className={styles.salesDesk}><div className="sales-gate"><span className="sales-brand">IXI</span><h1>JOIN SALES DESK</h1><p>Accept using the verified email address your company owner invited.</p>{error && <p role="alert">{error.message}</p>}<button onClick={accept} disabled={accepting}>{accepting ? "VERIFYING…" : "ACCEPT INVITATION"}</button>{error?.status===401 && <a href={`/login?next=${encodeURIComponent(typeof window!=="undefined" ? window.location.pathname+window.location.search+window.location.hash : "/sales-desk")}`}>SIGN IN</a>}</div></main>;
  if(!access && !error && companies.length>1)return <main className={styles.salesDesk}><div className="sales-gate"><h1>CHOOSE YOUR COMPANY</h1>{companies.map(c=><a key={c.entityId} className="sales-wide" href={`/sales-desk?company=${encodeURIComponent(c.entityId)}`}>{c.company} · {c.role}</a>)}</div></main>;
  if (access) return <IXIDashboard key={`${access.context.entityId}:${access.context.role}:${access.context.canReadAll}:${access.context.canWrite}`} salesDeskContext={access} />;
  return <main className={styles.salesDesk}><Head><title>IXI Sales Desk</title><meta name="robots" content="noindex,nofollow" /></Head><div className="sales-gate"><span className="sales-brand">IXI</span><p className="sales-eyebrow">YOUR MACHINES. YOUR CUSTOMERS.</p><h1>SALES DESK</h1><p role={error ? "alert" : "status"}>{error?.message || "Verifying your company access…"}</p>{error && <div className="sales-actions">{error.status===401 && <a href="/login?next=%2Fsales-desk">SIGN IN</a>}<button onClick={()=>setRetry(value=>value+1)}>TRY AGAIN</button></div>}<a href="/account">← HOME</a></div></main>;
}
