// /lib/machine-access/saveMachinePlacement.js

export async function saveMachinePlacement({
  listingId,
  machineAccess,
  machineChannel
} = {}) {
  if (!listingId) {
    throw new Error("Missing listingId");
  }

  if (!machineAccess) {
    throw new Error("Missing machineAccess");
  }

  if (!machineChannel) {
    throw new Error("Missing machineChannel");
  }

  const response = await fetch(
    "/api/update-machine-placement",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        listingId,
        machineAccess,
        machineChannel
      })
    }
  );

  const payload = await response.json();

  if (!response.ok || !payload?.ok) {
    throw new Error(
      payload?.error ||
      "Machine placement update failed"
    );
  }

  return payload;
}

export default saveMachinePlacement;
