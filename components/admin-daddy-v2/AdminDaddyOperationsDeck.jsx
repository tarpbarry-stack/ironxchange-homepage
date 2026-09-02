import { useEffect, useState } from "react";

async function getJson(url) {
  const response = await fetch(url, { credentials: "same-origin" });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok === false) throw new Error(payload?.error?.message || `Request failed: ${response.status}`);
  return payload;
}

function Metric({ label, value, note }) {
  return <div className="metric"><small>{label}</small><strong>{value ?? "—"}</strong><span>{note || ""}</span></div>;
}

export default function AdminDaddyOperationsDeck() {
  const [data, setData] = useState({ jobs:null, integrity:null, acquisition:null, media:null });
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState({ loading:false, results:[] });

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      getJson("/api/admin-daddy/jobs"),
      getJson("/api/admin-daddy/object-integrity"),
      getJson("/api/admin-daddy/acquisition"),
      getJson("/api/admin-daddy/media")
    ]).then(results => {
      if (cancelled) return;
      const next = { jobs:null, integrity:null, acquisition:null, media:null };
      ["jobs","integrity","acquisition","media"].forEach((key,index) => {
        if (results[index].status === "fulfilled") next[key] = results[index].value;
      });
      setData(next);
      const failed = results.filter(result => result.status === "rejected");
      setError(failed.length ? `${failed.length} operational projection${failed.length === 1 ? "" : "s"} unavailable.` : "");
    });
    return () => { cancelled = true; };
  }, []);

  async function runSearch(event) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    setSearch({ loading:true, results:[] });
    try {
      const payload = await getJson(`/api/admin-daddy/search?q=${encodeURIComponent(value)}`);
      setSearch({ loading:false, results:Array.isArray(payload?.results) ? payload.results : [] });
    } catch {
      setSearch({ loading:false, results:[] });
    }
  }

  const jobSummary = data.jobs?.summary || {};
  const integritySummary = data.integrity?.summary || data.integrity || {};
  const mediaSummary = data.media?.summary || {};
  const sources = Array.isArray(data.acquisition?.sources) ? data.acquisition.sources : [];
  const regressions = Array.isArray(data.acquisition?.regressions) ? data.acquisition.regressions : [];

  return <section className="deck">
    <div className="deckHead"><b>ADMIN DADDY // LIVE OPERATIONS DECK</b><span>{error || "READ-ONLY CONTROL PROJECTIONS"}</span></div>
    <div className="grid">
      <article><h3>JOBS / QUEUES</h3><div className="metrics"><Metric label="TOTAL" value={jobSummary.total}/><Metric label="RUNNING" value={jobSummary.running}/><Metric label="RETRYING" value={jobSummary.retrying}/><Metric label="FAILED" value={(jobSummary.failed || 0) + (jobSummary.dead || 0)}/></div></article>
      <article><h3>OBJECT / PASSPORT INTEGRITY</h3><div className="metrics"><Metric label="OBJECTS" value={integritySummary.totalObjects ?? integritySummary.objects}/><Metric label="ISSUES" value={integritySummary.issueCount ?? integritySummary.issues}/><Metric label="ORPHANS" value={integritySummary.orphanCount ?? integritySummary.orphans}/><Metric label="DEFINITIONS" value={integritySummary.totalDefinitions ?? integritySummary.definitions}/></div></article>
      <article><h3>ACQUISITION / PARSERS</h3><div className="metrics"><Metric label="SOURCES" value={sources.length}/><Metric label="EVENTS" value={data.acquisition?.eventCount}/><Metric label="REGRESSIONS" value={regressions.length}/><Metric label="CRITICAL" value={regressions.filter(item => item.severity === "critical").length}/></div></article>
      <article><h3>MEDIA</h3><div className="metrics"><Metric label="JOBS" value={mediaSummary.total}/><Metric label="PROCESSING" value={mediaSummary.processing}/><Metric label="PARTIAL" value={mediaSummary.partial}/><Metric label="FAILED" value={mediaSummary.failed}/></div><small className="state">{data.media?.live ? "LIVE IX-CORE PROJECTION" : data.media?.notice || "PROJECTION PENDING"}</small></article>
    </div>
    <form className="search" onSubmit={runSearch}><label>UNIVERSAL OPERATIONS SEARCH</label><div><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Object ID, Passport, serial, job, machine..."/><button type="submit">{search.loading ? "SEARCHING" : "SEARCH"}</button></div></form>
    {search.results.length > 0 && <div className="results">{search.results.slice(0,12).map((item,index) => <div key={`${item.resultType || item.type}-${item.id || index}`}><b>{item.label || item.displayName || item.id}</b><span>{item.resultType || item.type || "RESULT"}</span><small>{item.subtitle || item.status || item.id}</small></div>)}</div>}
    <style jsx>{`
      .deck{margin:0;background:#07090a;color:#edf0f2;font-family:Arial,sans-serif;border-top:2px solid #242a2e;padding:10px}.deckHead{height:36px;display:flex;align-items:center;justify-content:space-between;padding:0 12px;border:1px solid #3a4044;background:linear-gradient(#1a1f23,#0e1214);font-size:10px}.deckHead b{color:#f0b600}.deckHead span{color:#77838b;font-size:8px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:8px}.grid article{border:1px solid #343a3f;background:linear-gradient(145deg,#151a1e,#0b0e11);min-height:126px}.grid h3{margin:0;padding:9px 10px;border-bottom:1px solid #30363a;color:#d9dde0;font-size:9px}.metrics{display:grid;grid-template-columns:repeat(2,1fr)}.metric{padding:10px;border-right:1px solid #242a2e;border-bottom:1px solid #242a2e}.metric small,.metric span{display:block;color:#78838a;font-size:7px}.metric strong{display:block;font-size:17px;margin:5px 0;color:#fff}.state{display:block;padding:6px 10px;color:#7d8990;font-size:7px}.search{margin-top:8px;padding:10px;border:1px solid #343a3f;background:#0c1012}.search label{display:block;color:#f0b600;font-size:8px;margin-bottom:7px}.search>div{display:grid;grid-template-columns:1fr 110px;gap:6px}.search input{background:#07090a;color:#fff;border:1px solid #343a3f;padding:10px;font-size:10px}.search button{background:linear-gradient(#302b14,#171710);color:#f0b600;border:1px solid #806b17;font-size:9px;font-weight:800}.results{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-top:6px}.results>div{border:1px solid #30363a;background:#0d1113;padding:8px}.results b,.results span,.results small{display:block}.results b{font-size:9px}.results span{font-size:7px;color:#f0b600;margin-top:4px}.results small{font-size:7px;color:#7f8a91;margin-top:3px}@media(max-width:1050px){.grid,.results{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){.grid,.results{grid-template-columns:1fr}.search>div{grid-template-columns:1fr}}
    `}</style>
  </section>;
}
