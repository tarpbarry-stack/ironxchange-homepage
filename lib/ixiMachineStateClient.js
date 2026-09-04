const IX_CORE_BASE =
  "https://staging.ironxchange.com/ix-core";

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object || {}, key);
}

function persistentPatchOf(patch = {}) {
  const persistentPatch = {
    ...(patch && typeof patch === "object" ? patch : {})
  };

  // Card action notices are UI lifecycle state, not machine state. A null
  // value is retained as a tombstone so older persisted notices can be
  // removed, but a live notice must never be written to IX Core.
  if (persistentPatch.actionNotice !== null) {
    delete persistentPatch.actionNotice;
  }

  return persistentPatch;
}

function sanitizeRemoteState(payload = {}) {
  const wrapped = Boolean(
    payload &&
    typeof payload === "object" &&
    payload.state &&
    typeof payload.state === "object" &&
    !Array.isArray(payload.state)
  );
  const state = wrapped ? payload.state : payload;
  const staleListingIds = [];
  const sanitizedState = {};

  Object.entries(
    state && typeof state === "object" && !Array.isArray(state)
      ? state
      : {}
  ).forEach(([listingId, record]) => {
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      sanitizedState[listingId] = record;
      return;
    }

    const sanitizedRecord = { ...record };

    if (hasOwn(sanitizedRecord, "actionNotice")) {
      if (sanitizedRecord.actionNotice !== null) {
        staleListingIds.push(listingId);
      }
      delete sanitizedRecord.actionNotice;
    }

    sanitizedState[listingId] = sanitizedRecord;
  });

  return {
    payload: wrapped
      ? { ...payload, state: sanitizedState }
      : sanitizedState,
    staleListingIds
  };
}

async function postIxiMachinePatch({
  userId = "guest",
  listingId,
  patch = {}
}) {
  return fetch(`${IX_CORE_BASE}/ixi-machine-state`, {
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
}

export async function fetchIxiMachineState(userId = "guest") {
  try {
    const res = await fetch(
      `${IX_CORE_BASE}/ixi-machine-state/${encodeURIComponent(userId)}`
    );

    if (!res.ok) return {};

    const remotePayload = await res.json();
    const sanitized = sanitizeRemoteState(remotePayload);

    // Repair records written by older clients. The sanitized payload is
    // returned immediately after the cleanup completes, so a stale notice
    // cannot be painted during hydration or return on the next session.
    if (sanitized.staleListingIds.length) {
      await Promise.allSettled(
        sanitized.staleListingIds.map(listingId =>
          postIxiMachinePatch({
            userId,
            listingId,
            patch: { actionNotice: null }
          })
        )
      );
    }

    return sanitized.payload;
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
    const res = await postIxiMachinePatch({
      userId,
      listingId,
      patch: persistentPatchOf(patch)
    });

    if (!res.ok) return null;

    return await res.json();
  } catch {
    return null;
  }
}
