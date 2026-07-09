// /lib/passport/ensurePassportForMachine.js

const IX_CORE_BASE_URL =
  process.env.IX_CORE_BASE_URL || "http://3.131.46.49:4100";

export async function ensurePassportForMachine({
  sourceType,
  sourceId,
  visibility = "private",
  status = "active"
} = {}) {
  if (!sourceType || !sourceId) {
    throw new Error("ensurePassportForMachine requires sourceType and sourceId");
  }

  const response = await fetch(`${IX_CORE_BASE_URL}/passport/ensure`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      sourceType,
      sourceId,
      visibility,
      status
    })
  });

  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || "Passport ensure failed");
  }

  return payload.passport;
}

export function getPassportPublicUrl(passportId = "") {
  if (!passportId) return "";

  return `/p/${passportId}`;
}
