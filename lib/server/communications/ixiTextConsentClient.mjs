import crypto from "node:crypto";

function clean(value) { return String(value ?? "").trim(); }
function sha256(value) { return crypto.createHash("sha256").update(value).digest("hex"); }

export default async function requestIxCoreTextConsent({ principalId, idempotencyKey, body } = {}) {
  const secret = clean(process.env.IXI_MOS_INTERNAL_SECRET);
  if (!secret) {
    const error = new Error("IXI SMS consent persistence is not configured.");
    error.code = "IXI_TEXT_CONSENT_NOT_CONFIGURED";
    error.status = 503;
    throw error;
  }
  const method = "POST";
  const targetPath = "/communications/v1/text-consents";
  const bodyString = JSON.stringify(body || {});
  const timestamp = String(Date.now());
  const requestId = crypto.randomUUID();
  const canonical = [timestamp, requestId, method, targetPath, clean(principalId), "", sha256(bodyString)].join("\n");
  const signature = crypto.createHmac("sha256", secret).update(canonical).digest("hex");
  const base = clean(process.env.IX_CORE_BASE_URL || "https://staging.ironxchange.com/ix-core").replace(/\/+$/u, "");
  let response;
  try {
    response = await fetch(`${base}${targetPath}`, { method, headers: { Accept: "application/json", "Content-Type": "application/json", "Idempotency-Key": clean(idempotencyKey), "X-IXI-Internal-Signature-Version": "v1", "X-IXI-Internal-Timestamp": timestamp, "X-IXI-Internal-Request-Id": requestId, "X-IXI-Internal-Principal-Id": clean(principalId), "X-IXI-Internal-Signature": signature, "X-IXI-Source": "ironxchange-public-text-consent" }, body: bodyString, signal: AbortSignal.timeout(15000) });
  } catch (cause) {
    const error = new Error("SMS consent service is temporarily unavailable."); error.code = "IXI_TEXT_CONSENT_NETWORK_ERROR"; error.status = 502; error.cause = cause; throw error;
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok !== true) {
    const error = new Error(payload?.error?.message || "SMS consent could not be recorded."); error.code = payload?.error?.code || "IXI_TEXT_CONSENT_FAILED"; error.status = response.status || 502; throw error;
  }
  return payload;
}
