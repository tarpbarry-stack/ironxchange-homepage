export async function sendIXITransactEmail({ documentIds, recipient, commandId }) {
  const response = await fetch("/api/ixi/financial/delivery/email", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ documentIds, recipient, commandId }) });
  const payload = await response.json();
  if (!response.ok || payload.ok !== true || payload.data?.status !== "accepted") throw new Error(payload.error || payload.errors?.[0]?.message || "Email acceptance could not be confirmed.");
  return payload.data;
}
