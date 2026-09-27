import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const DISCLOSURE = "I agree to receive SMS text messages from Sales Inc., operating IronXchange, concerning machine inquiries, requested Machine Passports, transaction updates, and service communications.";
function token() { return globalThis.crypto?.randomUUID?.().replace(/-/gu, "_") || `text_consent_${Date.now()}_${Math.random().toString(36).slice(2)}`; }

export default function TextConsentPage() {
  const [form, setForm] = useState({ fullName: "", mobileNumber: "", accepted: false, companyWebsite: "" });
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(token);
  async function submit(event) {
    event.preventDefault();
    if (status === "saving") return;
    setStatus("saving"); setMessage("");
    try {
      const response = await fetch("/api/communications/text-consent", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey }, body: JSON.stringify({ ...form, idempotencyKey }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.ok !== true) throw new Error(payload.error || "Consent could not be recorded.");
      setStatus("saved"); setMessage("Your SMS consent has been recorded. No text message was sent by this form.");
    } catch (error) {
      setStatus("error"); setMessage(error.message || "Consent could not be recorded."); setIdempotencyKey(token());
    }
  }
  return <>
    <Head><title>SMS Consent | IronXchange by Sales Inc.</title><meta name="description" content="Choose whether to receive requested IronXchange text messages from Sales Inc." /><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
    <main><Navbar /><section className="wrap"><article><header><span>SALES INC. · IRONXCHANGE</span><h1>SMS CONSENT</h1><p>Choose whether Sales Inc., operating IronXchange, may send requested equipment and service text messages to your mobile number.</p></header>
      <form onSubmit={submit}>
        <label>FULL NAME<input name="fullName" autoComplete="name" value={form.fullName} onChange={event => setForm({ ...form, fullName: event.target.value.slice(0, 120) })} required /></label>
        <label>MOBILE NUMBER<input name="mobileNumber" type="tel" inputMode="tel" autoComplete="tel" placeholder="(940) 555-0123" value={form.mobileNumber} onChange={event => setForm({ ...form, mobileNumber: event.target.value.slice(0, 24) })} required /></label>
        <label className="trap" aria-hidden="true">Company website<input tabIndex="-1" autoComplete="off" value={form.companyWebsite} onChange={event => setForm({ ...form, companyWebsite: event.target.value })} /></label>
        <label className="consent"><input type="checkbox" checked={form.accepted} onChange={event => setForm({ ...form, accepted: event.target.checked })} required /><span>{DISCLOSURE}</span></label>
        <div className="disclosure"><p>Message frequency varies. Message and data rates may apply. Reply <b>STOP</b> to opt out or <b>HELP</b> for help. Consent is not a condition of purchase.</p><p>Sales Inc. and IronXchange do not sell or share mobile information with third parties for their marketing or promotional purposes.</p><p>Review our <Link href="/terms" target="_blank">Terms</Link> and <Link href="/privacy" target="_blank">Privacy Policy</Link>.</p></div>
        {message ? <p className={`result ${status}`} role="status">{message}</p> : null}
        <button type="submit" disabled={!form.accepted || status === "saving" || status === "saved"}>{status === "saving" ? "RECORDING…" : status === "saved" ? "CONSENT RECORDED" : "RECORD MY CONSENT"}</button>
        <small>This form records consent only. It does not send a text message.</small>
      </form>
    </article></section></main><Footer />
    <style jsx>{`:global(html),:global(body){margin:0;background:#080808;color:#f4f4f4;font-family:'Inter Variable',Inter,Arial,sans-serif}main{min-height:100vh;background:radial-gradient(circle at 50% 0,rgba(255,196,0,.06),transparent 32%),#080808}.wrap{display:grid;place-items:start center;padding:42px 18px 70px}article{width:min(690px,100%);border:1px solid #333;background:#111;box-shadow:0 28px 80px #0008}header{padding:28px 30px 24px;border-bottom:1px solid #2b2b2b}header span{color:#ffc400;font-size:11px;font-weight:950;letter-spacing:.14em}h1{margin:8px 0 10px;font-size:36px;letter-spacing:-.03em}header p,.disclosure p{color:#aaa;line-height:1.55}form{display:grid;gap:17px;padding:28px 30px}label{display:grid;gap:7px;color:#c8c8c8;font-size:11px;font-weight:900;letter-spacing:.08em}label:not(.consent) input{height:46px;padding:0 13px;border:1px solid #444;background:#080808;color:#fff;font-size:16px}.consent{grid-template-columns:24px 1fr;align-items:start;padding:17px;border:1px solid #5a4b16;background:#171409;color:#f1f1f1;font-size:14px;line-height:1.55;letter-spacing:0}.consent input{width:20px;height:20px;margin:1px 0 0;accent-color:#ffc400}.disclosure{padding:0 4px}.disclosure p{margin:0 0 9px;font-size:13px}.disclosure :global(a){color:#ffc400;font-weight:850}.result{padding:12px;border:1px solid #6a2525;background:#260d0d;color:#ffd1d1}.result.saved{border-color:#326647;background:#102619;color:#bff2cf}button{height:50px;border:1px solid #ffe068;background:#ffc400;color:#101010;font-size:14px;font-weight:950;cursor:pointer}button:disabled{cursor:not-allowed;opacity:.45}small{color:#777;text-align:center}.trap{position:absolute!important;left:-10000px!important;width:1px;height:1px;overflow:hidden}@media(max-width:650px){.wrap{padding:20px 10px 45px}header,form{padding:22px 18px}h1{font-size:29px}}`}</style>
  </>;
}
