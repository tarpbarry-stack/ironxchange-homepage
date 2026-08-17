const clean = value => String(value ?? "").trim();

async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.ok === false) {
    const error = new Error(
      payload?.error?.message ||
      payload?.errors?.[0]?.message ||
      `IXI Authority request failed (${response.status}).`
    );
    error.code = payload?.error?.code || payload?.errors?.[0]?.code || "IXI_AUTHORITY_REQUEST_FAILED";
    error.details = payload?.error?.details || payload?.errors?.[0]?.details || {};
    error.status = response.status;
    throw error;
  }

  return payload;
}

export function getAuthorityAccessContext() {
  return request("/api/ixi/authority/access-context");
}

export function getAuthorityPolicy(passportId) {
  return request(`/api/ixi/authority/policies/${encodeURIComponent(clean(passportId))}`);
}

export function putAuthorityPolicy(passportId, policy) {
  return request(`/api/ixi/authority/policies/${encodeURIComponent(clean(passportId))}`, {
    method: "PUT",
    body: JSON.stringify(policy)
  });
}

export function evaluateAuthority(input) {
  return request("/api/ixi/authority/evaluate", {
    method: "POST",
    body: JSON.stringify(input || {})
  });
}

export default {
  getAuthorityAccessContext,
  getAuthorityPolicy,
  putAuthorityPolicy,
  evaluateAuthority
};
