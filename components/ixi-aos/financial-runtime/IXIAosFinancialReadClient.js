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

export async function loadIXIAosFinancialDocument({ financialDocumentId, signal } = {}) {
  const id = clean(financialDocumentId);
  if (!id) throw new Error("Financial document ID is required.");
  const payload = await request(
    `/api/ixi/financial/documents/${encodeURIComponent(id)}`,
    { method: "GET", signal },
    "The linked financial record could not be loaded."
  );
  return payload?.data?.record || payload?.data || null;
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

function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

export async function uploadIXIAosFinancialAttachment({
  financialDocumentId,
  file,
  type = "attachment",
  signal,
} = {}) {
  const id = clean(financialDocumentId);
  if (!id) throw new Error("Financial document ID is required for evidence upload.");
  if (!file) throw new Error("An evidence file is required.");
  if (!globalThis.crypto?.subtle) throw new Error("Secure file hashing is unavailable in this browser.");
  const checksumSha256 = bytesToBase64(new Uint8Array(
    await globalThis.crypto.subtle.digest("SHA-256", await file.arrayBuffer()),
  ));
  const controlled = {
    type: clean(type) || "attachment",
    fileName: clean(file.name),
    contentType: clean(file.type),
    sizeBytes: Number(file.size || 0),
    checksumSha256,
  };
  const initialized = await request(
    `/api/ixi/financial/documents/${encodeURIComponent(id)}/attachments/init`,
    { method: "POST", body: JSON.stringify(controlled), signal },
    "The evidence upload could not be initialized.",
  );
  const upload = initialized?.data?.upload;
  if (!clean(upload?.uploadUrl) || !clean(upload?.storageKey) || !clean(upload?.attachmentId)) {
    throw new Error("The evidence upload contract was incomplete.");
  }
  const uploaded = await fetch(upload.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": controlled.contentType,
      "x-amz-checksum-sha256": checksumSha256,
    },
    body: file,
    signal,
  });
  if (!uploaded.ok) throw new Error(`Evidence storage rejected the upload (${uploaded.status}).`);
  const completed = await request(
    `/api/ixi/financial/documents/${encodeURIComponent(id)}/attachments/complete`,
    {
      method: "POST",
      body: JSON.stringify({
        ...controlled,
        attachmentId: upload.attachmentId,
        storageKey: upload.storageKey,
      }),
      signal,
    },
    "The uploaded evidence could not be verified.",
  );
  const attachment = completed?.data?.attachment;
  if (clean(attachment?.status).toLowerCase() !== "verified") throw new Error("Evidence verification did not complete.");
  return attachment;
}

export function getIXIFinancialDocument(record = {}) {
  return record?.financialDocument || record?.record?.financialDocument || null;
}
