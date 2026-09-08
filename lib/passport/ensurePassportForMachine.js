// /lib/passport/ensurePassportForMachine.js

export async function ensurePassportForMachine({
  sourceType,
  sourceId,
  visibility = "private",
  status = "active"
} = {}) {
  if (!sourceType || !sourceId) {
    throw new Error(
      "ensurePassportForMachine requires sourceType and sourceId"
    );
  }

  const response = await fetch("/api/passport/ensure", {
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
    throw new Error(
      payload.error || "Passport ensure failed"
    );
  }

  return payload;
}

export function getPassportPublicUrl(passportId = "") {
  if (!passportId) return "";

  return `/p/${passportId}`;
}
