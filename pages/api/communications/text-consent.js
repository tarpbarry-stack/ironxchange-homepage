import { createHash, randomUUID } from "node:crypto";
import requestIxCoreTextConsent from "../../../lib/server/communications/ixiTextConsentClient.mjs";

const POLICY_VERSION = "sales-inc-ironxchange-sms-2026-09-27";
const CONSENT_TEXT = "I agree to receive SMS text messages from Sales Inc., operating IronXchange, concerning machine inquiries, requested Machine Passports, transaction updates, and service communications. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help. Consent is not a condition of purchase.";
function clean(value) { return String(value ?? "").trim(); }
function hash(value) { return createHash("sha256").update(String(value)).digest("hex"); }
function origin(req) { const proto = clean(req.headers["x-forwarded-proto"] || "https").split(",")[0]; const host = clean(req.headers["x-forwarded-host"] || req.headers.host).split(",")[0]; return host ? `${proto}://${host}` : ""; }

export default async function handler(req, res) {
  const requestId = randomUUID(); res.setHeader("Cache-Control", "no-store"); res.setHeader("X-Request-ID", requestId);
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ ok: false, error: "Method not allowed." }); }
  try {
    const requestOrigin = origin(req).replace(/\/+$/u, "");
    if (!requestOrigin || clean(req.headers.origin).replace(/\/+$/u, "") !== requestOrigin) return res.status(403).json({ ok: false, error: "Request origin could not be verified." });
    if (clean(req.body?.companyWebsite)) return res.status(202).json({ ok: true });
    const fullName = clean(req.body?.fullName).replace(/\s+/gu, " "); const mobileNumber = clean(req.body?.mobileNumber); const accepted = req.body?.accepted === true; const idempotencyKey = clean(req.headers["idempotency-key"] || req.body?.idempotencyKey);
    if (fullName.length < 2 || fullName.length > 120) return res.status(400).json({ ok: false, error: "Enter your full name." });
    if (!accepted) return res.status(400).json({ ok: false, error: "Select the SMS consent checkbox before submitting." });
    if (!/^[A-Za-z0-9_-]{16,120}$/u.test(idempotencyKey)) return res.status(400).json({ ok: false, error: "A valid consent token is required." });
    const address = clean(req.headers["x-forwarded-for"] || req.socket?.remoteAddress).split(",")[0]; const userAgent = clean(req.headers["user-agent"]);
    const payload = await requestIxCoreTextConsent({ principalId: `public-text-consent-${hash(address).slice(0, 24)}`, idempotencyKey, body: { fullName, mobileNumber, accepted, policyVersion: POLICY_VERSION, consentText: CONSENT_TEXT, sourceUrl: `${requestOrigin}/text-consent`, sourceIpHash: hash(address), userAgentHash: hash(userAgent), idempotencyKey } });
    return res.status(201).json({ ok: true, consentId: payload.consent?.consentId, recordedAt: payload.consent?.createdAtMs });
  } catch (error) {
    const status = Number(error?.status || 500); return res.status(status >= 400 && status <= 599 ? status : 500).json({ ok: false, code: error?.code, error: status >= 500 ? "SMS consent could not be recorded. Please try again." : error?.message });
  }
}

export { POLICY_VERSION, CONSENT_TEXT };
