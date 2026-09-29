import Head from "next/head";
import { useEffect, useState } from "react";

async function acceptInvitation(invitation) {
  const response = await fetch("/api/ixi/workforce-access/invitations/accept", {
    method: "POST",
    credentials: "same-origin",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(invitation)
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok === false) {
    const error = new Error(payload?.error?.message || "System Access invitation could not be accepted.");
    error.status = response.status;
    throw error;
  }
  return payload;
}

export default function SystemAccessInvitationPage() {
  const [invitation, setInvitation] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setInvitation({
      entityId: query.get("entity") || "",
      id: query.get("invitation") || "",
      token: window.location.hash.slice(1)
    });
  }, []);

  async function accept() {
    setBusy(true); setError(null);
    try {
      await acceptInvitation(invitation);
      setComplete(true);
      window.setTimeout(() => window.location.assign("/aos/work"), 700);
    } catch (nextError) { setError(nextError); }
    finally { setBusy(false); }
  }

  const valid = invitation?.entityId && invitation?.id && invitation?.token;
  const next = typeof window !== "undefined" ? window.location.pathname + window.location.search + window.location.hash : "/system-access";

  return <main className="system-access-gate">
    <Head><title>System Access | IronXchange</title></Head>
    <section>
      <span className="ixi">IXI</span>
      <small>GOVERNED WORKFORCE ACCESS</small>
      <h1>{complete ? "ACCESS CONNECTED" : "JOIN YOUR COMPANY"}</h1>
      <p>This invitation connects your verified login to the existing Person Object and permanent Passport selected by the company owner.</p>
      {!valid && invitation ? <p className="error">This invitation link is incomplete.</p> : null}
      {error ? <p className="error">{error.message}</p> : null}
      {!complete ? <button disabled={!valid || busy} onClick={accept}>{busy ? "VERIFYING…" : "ACCEPT SYSTEM ACCESS"}</button> : <strong>OPENING AOS…</strong>}
      {error?.status === 401 ? <a href={`/login?next=${encodeURIComponent(next)}`}>SIGN IN WITH THE INVITED EMAIL</a> : null}
      <footer>THE INVITATION CANNOT CREATE OR REPLACE AN AOS PERSON. IT CAN ONLY BIND THE VERIFIED LOGIN TO THE IDENTITY CHOSEN BY THE OWNER.</footer>
    </section>
    <style jsx>{`
      .system-access-gate{min-height:100vh;display:grid;place-items:center;padding:20px;background:#050706;color:#f3f5f2;font-family:Arial Narrow,Arial,sans-serif}.system-access-gate section{width:min(520px,100%);padding:28px;border:1px solid #323632;border-top:3px solid #ffc400;background:linear-gradient(180deg,#101310,#090b0a);box-shadow:0 24px 80px #000}.ixi{display:block;color:#ffc400;font-size:34px;font-weight:950;letter-spacing:-.08em}.system-access-gate small{color:#737a74;font-size:10px;font-weight:950;letter-spacing:.16em}.system-access-gate h1{margin:22px 0 8px;font-size:30px;line-height:1}.system-access-gate p{color:#a4aaa5;font-size:14px;line-height:1.55}.system-access-gate button,.system-access-gate a{display:block;width:100%;margin-top:18px;padding:14px;border:1px solid #ffc400;background:#ffc400;color:#080908;text-align:center;text-decoration:none;font-weight:950}.system-access-gate button:disabled{opacity:.4}.system-access-gate a{background:transparent;color:#ffc400}.system-access-gate .error{padding:10px;border:1px solid rgba(255,70,70,.4);color:#ff8181;background:rgba(255,30,30,.05)}.system-access-gate strong{display:block;margin-top:20px;color:#ffc400}.system-access-gate footer{margin-top:22px;padding-top:12px;border-top:1px solid #242824;color:#5f665f;font-size:9px;font-weight:850;line-height:1.5}
    `}</style>
  </main>;
}
