import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { loadIXIFinancialAccessContext, loadIXITransactDashboard } from "./data/IXITransactDashboardClient";
import { createIXITransactSessionRuntime } from "./data/IXITransactSessionRuntime.mjs";

const IXITransactCommandCenter = dynamic(() => import("../ixi-command-center/IXITransactCommandCenter"), { ssr: false });
const IXITransactDashboardApp = dynamic(() => import("./IXITransactDashboardApp"), { ssr: false });

export function IXITransactSessionLayout({ children }) {
  const router = useRouter();
  const ledger = router.pathname === "/transact/ledger";
  const [runtime, setRuntime] = useState(null);
  const [session, setSession] = useState({ access: null, generation: 0, error: null });
  const [warm, setWarm] = useState(false);
  const [visited, setVisited] = useState({ records: !ledger, ledger });
  useEffect(() => { setVisited(previous => ({ ...previous, [ledger ? "ledger" : "records"]: true })); }, [ledger]);

  useEffect(() => {
    const next = createIXITransactSessionRuntime({ readAccess: loadIXIFinancialAccessContext,
      readDashboard: loadIXITransactDashboard, onChange: setSession });
    setRuntime(next);
    const check = () => { if (document.visibilityState !== "hidden") next.loadAccess().catch(() => {}); };
    check();
    const timer = window.setInterval(check, 60_000);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearInterval(timer); window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check); next.dispose();
    };
  }, []);

  useEffect(() => {
    if (!runtime) return;
    runtime.loadAccess().catch(() => {});
  }, [runtime, router.pathname]);

  useEffect(() => {
    if (session.error?.status === 401) {
      router.replace(`/login?returnTo=${encodeURIComponent(router.asPath)}`);
    }
  }, [router, session.error]);

  useEffect(() => {
    if (!session.access || warm) return;
    router.prefetch(ledger ? "/transact" : "/transact/ledger");
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => setWarm(true), { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(() => setWarm(true), 200);
    return () => window.clearTimeout(id);
  }, [session.access, warm, ledger, router]);

  return <>
    {children}
    <style jsx global>{`html, body, #__next { min-height: 100%; background: #070808; } body { margin: 0; }`}</style>
    {session.error ? <div role="alert" style={{ padding: 18, background: "#321b20", color: "#fff" }}>
      {session.error.message} <button type="button" onClick={() => runtime?.loadAccess({ force: true }).catch(() => {})}>TRY AGAIN</button>
    </div> : null}
    {!session.access ? <div role="status" style={{ minHeight: "100vh", padding: 32, background: "#080a09", color: "#ffc400" }}>
      {session.error ? "TRAN$ACT session could not be verified." : "Opening your TRAN$ACT workspace…"}
    </div> : <div key={session.generation} data-ixi-transact-session>
      <div hidden={ledger} style={{ display: ledger ? "none" : "block" }} data-ixi-transact-view="records">
        {(!ledger || visited.records || warm) && <IXITransactCommandCenter runtime={runtime} active={!ledger} />}
      </div>
      <div hidden={!ledger} style={{ display: ledger ? "block" : "none" }} data-ixi-transact-view="ledger">
        {(ledger || visited.ledger || warm) && <IXITransactDashboardApp runtime={runtime} active={ledger} />}
      </div>
    </div>}
  </>;
}

export const getIXITransactLayout = page => <IXITransactSessionLayout>{page}</IXITransactSessionLayout>;
