const clean = value => String(value ?? "").trim();

async function request(path, options = {}, fallback = "IXI Financial request failed.") {
  const response = await fetch(path, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {})
    },
    ...options
  });
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    const error = new Error("IXI Financial returned a non-JSON response.");
    error.code = "IXI_FINANCIAL_BAD_RESPONSE";
    throw error;
  }
  if (!response.ok || payload?.ok !== true) {
    const problem = payload?.errors?.[0] || payload?.error || {};
    const error = new Error(clean(problem.message) || fallback);
    error.code = clean(problem.code || problem.name) || "IXI_FINANCIAL_REQUEST_FAILED";
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

export async function loadIXIAosFinancialAccessContext({ signal } = {}) {
  const payload = await request(
    "/api/ixi/financial/access-context",
    { method: "GET", signal },
    "IXI Financial access context could not be loaded."
  );
  return payload?.data || {};
}

export async function loadIXIAosPassportFinancialDocuments({ passportId, signal } = {}) {
  const id = clean(passportId);
  if (!id) throw new Error("A Passport ID is required to open TRAN$ACT.");
  const payload = await request(
    `/api/ixi/financial/passports/${encodeURIComponent(id)}/documents`,
    { method: "GET", signal },
    "This object's TRAN$ACT records could not be loaded."
  );
  return Array.isArray(payload?.data?.documents) ? payload.data.documents : [];
}

export async function patchIXIAosFinancialDocument({
  financialDocumentId,
  patch,
  expectedRevision,
  commandId,
  idempotencyKey,
  metadata = {},
  signal
} = {}) {
  const id = clean(financialDocumentId);
  if (!id) throw new Error("Financial document ID is required for an update.");
  return request(
    `/api/ixi/financial/documents/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        patch: patch && typeof patch === "object" ? patch : {},
        ...(Number.isInteger(Number(expectedRevision))
          ? { expectedRevision: Number(expectedRevision) }
          : {}),
        commandId: clean(commandId),
        idempotencyKey: clean(idempotencyKey),
        metadata: metadata && typeof metadata === "object" ? metadata : {}
      }),
      signal
    },
    "The financial record could not be updated."
  );
}

export function getIXIFinancialDocument(record = {}) {
  return record?.financialDocument || record?.record?.financialDocument || null;
}
