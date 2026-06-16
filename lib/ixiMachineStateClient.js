const IX_CORE_BASE =
  "https://staging.ironxchange.com/ix-core";

export async function fetchIxiMachineState(userId = "guest") {
  try {
    const res = await fetch(
      `${IX_CORE_BASE}/ixi-machine-state/${encodeURIComponent(userId)}`
    );

    if (!res.ok) return {};

    return await res.json();
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
    const res = await fetch(`${IX_CORE_BASE}/ixi-machine-state`, {
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
export async function saveIxiWorkspaceLayout({
  userId = "guest",
  workspaceLayout = {}
}) {
  try {
    const res = await fetch(`${IX_CORE_BASE}/ixi-machine-state`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId,
        workspaceLayout
      })
    });

    if (!res.ok) return null;

    return await res.json();
  } catch {
    return null;
  }
}
export async function saveIxiPreference({
  userId = "guest",
  key,
  value
}) {
  if (!key) return null;

  try {
    const res = await fetch(`${IX_CORE_BASE}/ixi-machine-state`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId,
        preference: {
          key,
          value
        }
      })
    });

    if (!res.ok) return null;

    return await res.json();
  } catch {
    return null;
  }
}
