export async function fetchIxiMachineState(userId = "guest") {
  try {
    const res = await fetch(
      `/api/ixi-machine-state?userId=${encodeURIComponent(userId)}`
    );

    if (!res.ok) return {};

    const data = await res.json();

    return data.state || {};
  } catch {
    return {};
  }
}

export async function saveIxiMachinePatch({
  userId = "guest",
  listingId,
  patch = {}
}) {
  if (!listingId) return null;

  try {
    const res = await fetch("/api/ixi-machine-state", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId,
        listingId,
        patch
      })
    });

    if (!res.ok) return null;

    return await res.json();
  } catch {
    return null;
  }
}
