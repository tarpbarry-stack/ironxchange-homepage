import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function IXIAuthPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [status, setStatus] = useState("checking");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/ixi/auth/session", { credentials: "include", cache: "no-store" })
      .then(async response => ({ ok: response.ok, payload: await response.json().catch(() => null) }))
      .then(({ ok, payload }) => {
        if (!active) return;
        setStatus(ok && payload?.authenticated ? "authenticated" : "required");
      })
      .catch(() => active && setStatus("required"));
    return () => { active = false; };
  }, []);

  async function submit(event) {
    event.preventDefault();
    setStatus("authenticating");
    setError("");

    try {
      const response = await fetch("/api/ixi/auth/session", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(credentials)
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error?.message || "IXI authentication failed.");
      }
      setCredentials(current => ({ ...current, password: "" }));
      setStatus("authenticated");
      await router.push("/tickets");
    } catch (authError) {
      setStatus("required");
      setError(authError?.message || "IXI authentication failed.");
    }
  }

  return (
    <>
      <Head><title>IXI Secure Session | IronXchange</title></Head>
      <main className="shell">
        <section className="panel">
          <div className="eyebrow">IRONXCHANGE INTERNAL</div>
          <h1>IXI SECURE SESSION</h1>
          <p className="copy">Authenticate the IXI Cognito session used by Ticket Command, Authority and protected IX-Core services. Your access token is stored server-side in an HttpOnly cookie and is not exposed to browser JavaScript.</p>

          {status === "authenticated" ? (
            <div className="ready">
              <strong>SESSION ACTIVE</strong>
              <button type="button" onClick={() => router.push("/tickets")}>OPEN TICKET COMMAND</button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <label><span>IXI EMAIL</span><input type="email" autoComplete="username" required value={credentials.username} onChange={event => setCredentials(current => ({ ...current, username: event.target.value }))} /></label>
              <label><span>IXI PASSWORD</span><input type="password" autoComplete="current-password" required value={credentials.password} onChange={event => setCredentials(current => ({ ...current, password: event.target.value }))} /></label>
              {error ? <div className="error">{error}</div> : null}
              <button type="submit" disabled={status === "authenticating"}>{status === "authenticating" ? "AUTHENTICATING…" : "AUTHENTICATE IXI"}</button>
            </form>
          )}
        </section>
      </main>
      <style jsx>{`
        .shell{min-height:100vh;display:grid;place-items:center;padding:24px;background:#060709;color:#eef0f2;font-family:Inter,system-ui,sans-serif}.panel{width:min(520px,100%);padding:24px;border:1px solid rgba(255,255,255,.1);border-radius:8px;background:#0b0d10;box-shadow:0 24px 80px rgba(0,0,0,.35)}.eyebrow{font-size:9px;font-weight:900;letter-spacing:1.4px;color:rgba(255,255,255,.38)}h1{margin:7px 0;color:#ffc400;font-size:24px}.copy{color:rgba(255,255,255,.55);font-size:12px;line-height:1.55}form{display:grid;gap:12px;margin-top:18px}label span{display:block;margin-bottom:5px;color:rgba(255,196,0,.7);font-size:8px;font-weight:900;letter-spacing:.8px}input{width:100%;height:42px;box-sizing:border-box;padding:0 11px;border:1px solid rgba(255,255,255,.12);border-radius:5px;outline:none;background:#07090b;color:#fff}input:focus{border-color:rgba(0,194,255,.65)}button{height:40px;border:1px solid rgba(255,196,0,.55);border-radius:5px;background:rgba(255,196,0,.08);color:#ffc400;font-weight:950;letter-spacing:.6px;cursor:pointer}button:disabled{opacity:.5;cursor:wait}.error{padding:10px;border:1px solid rgba(255,90,90,.25);border-radius:5px;background:rgba(255,90,90,.05);color:#ff8a84;font-size:11px}.ready{display:grid;gap:12px;margin-top:18px;padding:14px;border:1px solid rgba(75,224,129,.28);border-radius:6px;background:rgba(75,224,129,.05)}.ready strong{color:#5ee98f;font-size:12px}
      `}</style>
    </>
  );
}
