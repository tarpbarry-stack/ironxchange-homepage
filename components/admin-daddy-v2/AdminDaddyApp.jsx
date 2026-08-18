import { useEffect, useMemo, useState } from "react";

const NAV = [
  "COMMAND CENTER",
  "ATTENTION CENTER",
  "SYSTEM HEALTH",
  "OBJECT CONTROL",
  "MARKETPLACE OPS",
  "AUCTION OPERATIONS",
  "ACQUISITION / PARSERS",
  "MEDIA CONTROL",
  "PASSPORT / IDENTITY",
  "TRAN$ACT OVERSIGHT",
  "ACCOUNTS / PEOPLE",
  "MESSAGES / COMMS",
  "MODERATION / SAFETY",
  "DATA QUALITY / TAXONOMY",
  "JOBS / QUEUES",
  "DEPLOYMENTS / RELEASES",
  "AUDIT / BLACK BOX"
];

function statusClass(state) {
  if (state === "healthy") return "healthy";
  if (state === "failed") return "failed";
  if (state === "degraded") return "warning";
  return "pending";
}

export default function AdminDaddyApp() {
  const [state, setState] = useState({ loading: true, error: "", authority: null, projection: null });
  const [query, setQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState("COMMAND CENTER");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin-daddy/context", { credentials: "same-origin" })
      .then(async response => {
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error(payload?.error?.message || "Admin Daddy context failed.");
        return payload;
      })
      .then(payload => {
        if (cancelled) return;
        setState({ loading: false, error: "", authority: payload.authority, projection: payload.projection });
      })
      .catch(error => {
        if (cancelled) return;
        setState({ loading: false, error: error.message, authority: null, projection: null });
      });

    return () => { cancelled = true; };
  }, []);

  const projection = state.projection;
  const attention = projection?.attention || [];
  const systems = projection?.systems || [];
  const metrics = projection?.metrics || [];
  const modules = projection?.modules || [];

  const criticalCount = useMemo(
    () => attention.filter(item => item.severity === "critical").length,
    [attention]
  );

  if (state.loading) {
    return <div className="adminDaddyBoot">ADMIN DADDY II // ESTABLISHING CONTROL PLANE...</div>;
  }

  if (state.error) {
    return (
      <div className="adminDaddyDenied">
        <div className="deniedPanel">
          <span>ADMIN DADDY II</span>
          <h1>CONTROL PLANE UNAVAILABLE</h1>
          <p>{state.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="adminDaddyRoot">
      <header className="topBar">
        <div className="brandBlock">
          <strong>IRON<span>X</span>CHANGE</strong>
          <small>ADMIN DADDY // IXI CONTROL PLANE</small>
        </div>
        <div className="commandTitle">
          <h1>COMMAND CENTER <b>V12</b></h1>
          <small>EXCEPTION MANAGEMENT • ECOSYSTEM COMMAND • AUDITED CONTROL</small>
        </div>
        <div className="topStatus">
          <div><small>ENVIRONMENT</small><strong>{String(projection?.environment || "").toUpperCase()}</strong></div>
          <div><small>CRITICAL</small><strong>{criticalCount}</strong></div>
          <div><small>VERSION</small><strong>V2</strong></div>
        </div>
      </header>

      <div className="layout">
        <aside className="leftRail">
          <div className="railHeader">CONTROL MODULES</div>
          {NAV.map(item => (
            <button
              key={item}
              className={selectedModule === item ? "railButton active" : "railButton"}
              onClick={() => setSelectedModule(item)}
              type="button"
            >
              <span className="railLamp" />
              {item}
            </button>
          ))}
          <div className="railSearch">
            <small>QUICK SEARCH</small>
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Object, Passport, seller..." />
          </div>
        </aside>

        <main className="mainStage">
          <section className="metricStrip">
            {metrics.map(metric => (
              <article className="metricCard" key={metric.key}>
                <small>{metric.label}</small>
                <strong>{metric.value}</strong>
                <span>{metric.detail}</span>
              </article>
            ))}
          </section>

          <section className="upperGrid">
            <article className="panel attentionPanel">
              <div className="panelHeader"><strong>NEEDS YOUR ATTENTION</strong><span>{attention.length} OPEN</span></div>
              <div className="attentionList">
                {attention.map(item => (
                  <div className="attentionRow" key={item.eventId}>
                    <span className={`severity ${item.severity}`}>{String(item.severity).toUpperCase()}</span>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.detail}</small>
                    </div>
                    <button type="button">INSPECT</button>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel healthPanel">
              <div className="panelHeader"><strong>ECOSYSTEM HEALTH</strong><span>FOUNDATION</span></div>
              <div className="systemList">
                {systems.map(system => (
                  <div className="systemRow" key={system.id}>
                    <span className={`statusLamp ${statusClass(system.state)}`} />
                    <strong>{system.label}</strong>
                    <span className={statusClass(system.state)}>{String(system.state).toUpperCase()}</span>
                    <small>{system.detail}</small>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="panel globalSearchPanel">
            <div className="panelHeader"><strong>UNIVERSAL SEARCH</strong><span>OBJECT • PASSPORT • PERSON • LISTING • JOB • TRANSACTION</span></div>
            <div className="globalSearchBox">
              <span>⌕</span>
              <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search the IronXchange ecosystem..." />
              <kbd>⌘ K</kbd>
            </div>
          </section>

          <section className="panel launcherPanel">
            <div className="panelHeader"><strong>QUICK COMMAND LAUNCHER</strong><span>CANONICAL DOMAIN ADAPTERS</span></div>
            <div className="launcherGrid">
              {modules.map(([label, key]) => (
                <button key={key} type="button" onClick={() => setSelectedModule(label)}>
                  <span className="launcherIcon">IX</span>
                  <span><strong>{label}</strong><small>{key.toUpperCase()} CONTROL</small></span>
                </button>
              ))}
            </div>
          </section>

          <section className="bottomGrid">
            <article className="panel miniPanel">
              <div className="panelHeader"><strong>MARKETPLACE OVERVIEW</strong><span>ADAPTER NEXT</span></div>
              <div className="placeholderGrid"><b>LIVE</b><b>PRIVATE</b><b>AUCTION</b><b>CONFLICTS</b></div>
            </article>
            <article className="panel miniPanel">
              <div className="panelHeader"><strong>TRAN$ACT OVERVIEW</strong><span>PROJECTION NEXT</span></div>
              <div className="placeholderGrid"><b>CASH</b><b>AR</b><b>AP</b><b>CLOSE</b></div>
            </article>
            <article className="panel miniPanel">
              <div className="panelHeader"><strong>OPERATIONS</strong><span>TELEMETRY NEXT</span></div>
              <div className="placeholderGrid"><b>JOBS</b><b>FAILED</b><b>RETRYING</b><b>DLQ</b></div>
            </article>
          </section>
        </main>
      </div>

      <style jsx>{`
        :global(html), :global(body) { background:#080a0c; }
        .adminDaddyRoot { min-height:100vh; color:#eceff2; background:radial-gradient(circle at 50% -10%,#20252a 0,#0a0d10 45%,#050708 100%); font-family:Arial,Helvetica,sans-serif; letter-spacing:.02em; }
        .topBar { height:82px; display:grid; grid-template-columns:280px 1fr 360px; border-bottom:1px solid #34383b; background:linear-gradient(#15191c,#0a0d0f); box-shadow:inset 0 -2px 0 #000,0 5px 18px #0008; }
        .brandBlock,.commandTitle,.topStatus { padding:14px 18px; border-right:1px solid #303438; }
        .brandBlock strong { font-size:24px; letter-spacing:.04em; } .brandBlock strong span { color:#d23227; font-size:30px; } .brandBlock small,.commandTitle small,.topStatus small { display:block; color:#8e969d; font-size:10px; margin-top:5px; }
        .commandTitle h1 { margin:0; font-size:26px; font-weight:900; } .commandTitle b { color:#080808; background:#f0b600; padding:3px 8px; border-radius:3px; font-size:13px; vertical-align:4px; box-shadow:inset 0 0 0 1px #ffe06a; }
        .topStatus { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; } .topStatus div { border:1px solid #31363a; background:#0c1013; padding:8px; } .topStatus strong { display:block; font-size:13px; margin-top:5px; }
        .layout { display:grid; grid-template-columns:230px 1fr; min-height:calc(100vh - 82px); }
        .leftRail { border-right:1px solid #34383b; background:linear-gradient(90deg,#111518,#0a0d0f); padding:8px; box-shadow:inset -3px 0 10px #0008; }
        .railHeader { color:#f0b600; font-size:11px; padding:10px; border:1px solid #34383b; background:#080a0c; margin-bottom:6px; }
        .railButton { width:100%; text-align:left; height:38px; color:#d7dadd; background:linear-gradient(#1c2125,#111518); border:1px solid #34393d; margin-bottom:3px; font-size:11px; font-weight:700; cursor:pointer; box-shadow:inset 0 1px #ffffff0c; }
        .railButton.active { border-color:#d5a400; background:linear-gradient(#302b14,#171710); color:#fff; box-shadow:inset 3px 0 #f0b600,0 0 10px #b8870033; }
        .railLamp { display:inline-block; width:7px; height:7px; border-radius:50%; background:#60676d; margin:0 9px; box-shadow:0 0 0 1px #000; } .active .railLamp { background:#f0b600; box-shadow:0 0 8px #f0b600; }
        .railSearch { margin-top:12px; padding:10px; border:1px solid #34383b; background:#0a0d0f; } .railSearch small { color:#f0b600; } input { color:#e9edf0; background:#080b0d; border:1px solid #33383c; outline:none; }
        .railSearch input { width:100%; box-sizing:border-box; margin-top:8px; padding:9px; }
        .mainStage { padding:10px; min-width:0; }
        .metricStrip { display:grid; grid-template-columns:repeat(6,minmax(120px,1fr)); gap:7px; margin-bottom:8px; }
        .metricCard,.panel { border:1px solid #343a3f; background:linear-gradient(145deg,#151a1e,#0b0e11 60%); box-shadow:inset 0 1px #ffffff0b,inset 0 0 18px #0008,0 3px 8px #0007; }
        .metricCard { min-height:90px; padding:12px; border-radius:3px; } .metricCard small { color:#98a1a8; font-size:10px; } .metricCard strong { display:block; font-size:22px; margin:12px 0 6px; color:#fff; } .metricCard span { color:#7e8a91; font-size:10px; }
        .upperGrid { display:grid; grid-template-columns:1.55fr 1fr; gap:8px; }
        .panelHeader { height:36px; box-sizing:border-box; padding:10px 12px; border-bottom:1px solid #353b3f; background:linear-gradient(#1a1f23,#101417); font-size:11px; display:flex; justify-content:space-between; align-items:center; } .panelHeader span { color:#74808a; font-size:9px; }
        .attentionRow { display:grid; grid-template-columns:88px 1fr 82px; gap:12px; align-items:center; min-height:58px; padding:6px 12px; border-bottom:1px solid #272c30; } .attentionRow div strong,.attentionRow div small { display:block; } .attentionRow div strong { font-size:12px; } .attentionRow div small { color:#8b949b; font-size:10px; margin-top:4px; line-height:1.4; }
        .severity { font-size:9px; font-weight:900; text-align:center; padding:7px 5px; border:1px solid; } .severity.info { color:#63b8ff; border-color:#245a86; background:#0d2740; } .severity.watch { color:#ffd45e; border-color:#806713; background:#2e2608; } .severity.action { color:#ff9b45; border-color:#8c4916; background:#311a08; } .severity.critical { color:#ff7068; border-color:#8e2722; background:#340b09; }
        .attentionRow button { color:#6bb9ff; background:#111a21; border:1px solid #2c4d66; padding:8px; font-size:10px; }
        .systemRow { display:grid; grid-template-columns:14px 1.1fr 90px 1.5fr; gap:8px; align-items:center; min-height:36px; padding:4px 10px; border-bottom:1px solid #272c30; font-size:10px; } .systemRow small { color:#7f8991; } .statusLamp { width:8px; height:8px; border-radius:50%; display:block; } .healthy { color:#50e56a; } .statusLamp.healthy { background:#50e56a; box-shadow:0 0 8px #50e56a; } .warning { color:#ffc33d; } .statusLamp.warning { background:#ffc33d; } .failed { color:#ff4d45; } .statusLamp.failed { background:#ff4d45; } .pending { color:#8b969e; } .statusLamp.pending { background:#6b747b; }
        .globalSearchPanel,.launcherPanel { margin-top:8px; }
        .globalSearchBox { display:grid; grid-template-columns:34px 1fr 40px; align-items:center; margin:10px; border:1px solid #353b40; background:#080b0d; } .globalSearchBox span { text-align:center; color:#f0b600; font-size:20px; } .globalSearchBox input { border:0; padding:12px; font-size:12px; } .globalSearchBox kbd { color:#737e86; font-size:9px; }
        .launcherGrid { display:grid; grid-template-columns:repeat(5,1fr); gap:7px; padding:10px; } .launcherGrid button { display:flex; align-items:center; gap:10px; min-height:68px; text-align:left; color:#e8ecef; background:linear-gradient(#1c2227,#111519); border:1px solid #384047; cursor:pointer; } .launcherGrid button:hover { border-color:#b68d18; } .launcherIcon { width:34px; height:34px; display:grid; place-items:center; margin-left:8px; border:1px solid #65717a; background:#0a0e11; color:#f0b600; font-size:10px; font-weight:900; } .launcherGrid strong,.launcherGrid small { display:block; } .launcherGrid strong { font-size:11px; } .launcherGrid small { color:#7e8991; font-size:8px; margin-top:4px; }
        .bottomGrid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-top:8px; } .placeholderGrid { display:grid; grid-template-columns:repeat(2,1fr); gap:1px; background:#30363a; } .placeholderGrid b { min-height:54px; display:grid; place-items:center; background:#0c1013; color:#7f8990; font-size:11px; }
        .adminDaddyBoot,.adminDaddyDenied { min-height:100vh; display:grid; place-items:center; background:#080a0c; color:#e9edf0; font-family:Arial,sans-serif; letter-spacing:.08em; } .adminDaddyBoot { color:#f0b600; } .deniedPanel { max-width:620px; padding:30px; border:1px solid #5d211d; background:#160b0a; } .deniedPanel span { color:#f0b600; } .deniedPanel p { color:#aaafb3; }
        @media (max-width:1200px) { .metricStrip { grid-template-columns:repeat(3,1fr); } .launcherGrid { grid-template-columns:repeat(2,1fr); } .upperGrid,.bottomGrid { grid-template-columns:1fr; } }
      `}</style>
    </div>
  );
}
