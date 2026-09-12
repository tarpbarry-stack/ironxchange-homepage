import crypto from "node:crypto";

function clean(value) {
  return String(value ?? "").trim();
}

function getIxCoreBase() {
  return (
    clean(process.env.IX_CORE_BASE_URL) ||
    "https://staging.ironxchange.com/ix-core"
  ).replace(/\/+$/u, "");
}

function getInternalSecret() {
  const secret = clean(process.env.IXI_MOS_INTERNAL_SECRET);
  if (!secret) {
    const error = new Error(
      "IXI internal email signing is not configured."
    );
    error.code = "IXI_PASSPORT_EMAIL_SIGNING_NOT_CONFIGURED";
    error.status = 503;
    throw error;
  }
  return secret;
}

function sha256(value) {
  return crypto
    .createHash("sha256")
    .update(value)
    .digest("hex");
}

function createSignature({
  secret,
  timestamp,
  requestId,
  method,
  targetPath,
  principalId,
  bodyString
}) {
  const canonical = [
    timestamp,
    requestId,
    method,
    targetPath,
    principalId,
    "",
    sha256(bodyString)
  ].join("\n");

  return crypto
    .createHmac("sha256", secret)
    .update(canonical)
    .digest("hex");
}

async function readPayload(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function requestIxCorePassportEmail({
  passportId,
  principalId,
  idempotencyKey,
  body
} = {}) {
  const normalizedPassportId = clean(passportId).toUpperCase();
  const normalizedPrincipalId = clean(principalId);

  if (!normalizedPassportId || !normalizedPrincipalId) {
    const error = new Error(
      "Passport and authenticated sender identity are required."
    );
    error.code = "IXI_PASSPORT_EMAIL_CONTEXT_REQUIRED";
    error.status = 401;
    throw error;
  }

  const method = "POST";
  const targetPath =
    `/communications/v1/passports/${encodeURIComponent(
      normalizedPassportId
    )}/email`;
  const bodyString = JSON.stringify(body || {});
  const timestamp = String(Date.now());
  const requestId = crypto.randomUUID();
  const signature = createSignature({
    secret: getInternalSecret(),
    timestamp,
    requestId,
    method,
    targetPath,
    principalId: normalizedPrincipalId,
    bodyString
  });

  let response;
  try {
    response = await fetch(`${getIxCoreBase()}${targetPath}`, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "Idempotency-Key": clean(idempotencyKey),
        "X-IXI-Internal-Signature-Version": "v1",
        "X-IXI-Internal-Timestamp": timestamp,
        "X-IXI-Internal-Request-Id": requestId,
        "X-IXI-Internal-Principal-Id": normalizedPrincipalId,
        "X-IXI-Internal-Signature": signature,
        "X-IXI-Source": "ironxchange-marketplace-passport"
      },
      body: bodyString,
      signal: AbortSignal.timeout(20000)
    });
  } catch (cause) {
    const timedOut =
      cause?.name === "TimeoutError" ||
      cause?.name === "AbortError";
    const error = new Error(
      timedOut
        ? "IX-Core Passport email delivery timed out."
        : "IX-Core Passport email delivery is unavailable."
    );
    error.code = timedOut
      ? "IXI_PASSPORT_EMAIL_TIMEOUT"
      : "IXI_PASSPORT_EMAIL_NETWORK_ERROR";
    error.status = timedOut ? 504 : 502;
    error.retryable = true;
    error.cause = cause;
    throw error;
  }

  const payload = await readPayload(response);
  if (!response.ok || payload?.ok !== true) {
    const error = new Error(
      payload?.error?.message ||
      "IXI Machine Passport email could not be delivered."
    );
    error.code =
      payload?.error?.code ||
      "IXI_PASSPORT_EMAIL_DELIVERY_FAILED";
    error.status = response.status || 502;
    error.retryable = Boolean(payload?.error?.retryable);
    throw error;
  }

  return payload;
}

export default requestIxCorePassportEmail;
