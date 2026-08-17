const clean = value => String(value ?? "").trim();

function resolveBaseUrl() {
  return clean(
    process.env.NEXT_PUBLIC_IXI_CORE_BASE_URL ||
    process.env.NEXT_PUBLIC_IXI_CORE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    ""
  ).replace(/\/$/, "");
}

function buildUrl(path = "") {
  const base = resolveBaseUrl();
  const suffix = `/${String(path || "").replace(/^\/+/, "")}`;
  return base ? `${base}${suffix}` : suffix;
}

async function parseJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, errors: [{ code: "IXI_AUTHORITY_RESPONSE_INVALID", message: text }] };
  }
}

async function request(path, { method = "GET", accessToken = "", body = null, entityId = "", signal } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== null) headers["Content-Type"] = "application/json";
  if (clean(accessToken)) headers.Authorization = `Bearer ${clean(accessToken)}`;
  if (clean(entityId)) headers["X-IXI-Entity-Id"] = clean(entityId);

  const response = await fetch(buildUrl(path), {
    method,
    headers,
    body: body === null ? undefined : JSON.stringify(body),
    credentials: "include",
    signal
  });

  const payload = await parseJson(response);
  if (!response.ok) {
    const error = new Error(
      clean(payload?.errors?.[0]?.message || payload?.message) ||
      `IXI Authority request failed with HTTP ${response.status}.`
    );
    error.name = "IXIAuthorityClientError";
    error.status = response.status;
    error.code = clean(payload?.errors?.[0]?.code) || "IXI_AUTHORITY_REQUEST_FAILED";
    error.payload = payload;
    throw error;
  }
  return payload;
}

export async function getIXIAuthorityAccessContext(options = {}) {
  return request("/authority/access-context", options);
}

export async function getIXIAuthorityPolicy({ passportId = "", ...options } = {}) {
  const id = encodeURIComponent(clean(passportId));
  if (!id) throw new Error("passportId is required.");
  return request(`/authority/policies/${id}`, options);
}

export async function putIXIAuthorityPolicy({ passportId = "", policy, ...options } = {}) {
  const id = encodeURIComponent(clean(passportId));
  if (!id) throw new Error("passportId is required.");
  return request(`/authority/policies/${id}`, {
    ...options,
    method: "PUT",
    body: { policy }
  });
}

export async function evaluateIXIAuthorityRemote({ capability = "", passportId = "", ...options } = {}) {
  return request("/authority/evaluate", {
    ...options,
    method: "POST",
    body: { capability: clean(capability), targetPassportId: clean(passportId) }
  });
}

export async function inviteIXIPrincipal({ target, email, roleIds = [], directGrants = [], directDenies = [], scopes = [], ...options } = {}) {
  return request("/identity/principals/invite", {
    ...options,
    method: "POST",
    body: {
      target,
      email: clean(email),
      roleIds,
      directGrants,
      directDenies,
      scopes
    }
  });
}

export async function suspendIXIPrincipal({ principalId = "", ...options } = {}) {
  const id = encodeURIComponent(clean(principalId));
  if (!id) throw new Error("principalId is required.");
  return request(`/identity/principals/${id}/suspend`, { ...options, method: "POST" });
}

export default {
  getIXIAuthorityAccessContext,
  getIXIAuthorityPolicy,
  putIXIAuthorityPolicy,
  evaluateIXIAuthorityRemote,
  inviteIXIPrincipal,
  suspendIXIPrincipal
};
