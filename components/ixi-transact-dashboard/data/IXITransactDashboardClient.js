function clean(value) {
  return String(value ?? "").trim();
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    const error = new Error("IXI Financial returned a non-JSON response.");
    error.code = "IXI_FINANCIAL_BAD_RESPONSE";
    error.status = response.status;
    throw error;
  }
}

function firstErrorMessage(payload, fallback) {
  return clean(
    payload?.errors?.[0]?.message ||
    payload?.error?.message ||
    fallback
  );
}

function throwForBadResponse(response, payload, fallback, fallbackCode) {
  if (response.ok && payload?.ok === true) {
    return;
  }

  const error = new Error(
    firstErrorMessage(payload, fallback)
  );

  error.code = clean(
    payload?.errors?.[0]?.code ||
    payload?.errors?.[0]?.name ||
    payload?.error?.code ||
    fallbackCode
  );

  error.status = response.status;
  error.payload = payload;
  throw error;
}

export async function loadIXIFinancialAccessContext({ signal } = {}) {
  const response = await fetch(
    "/api/ixi/financial/access-context",
    {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
      signal
    }
  );

  const payload = await readJson(response);

  throwForBadResponse(
    response,
    payload,
    "IXI Financial access context could not be loaded.",
    "IXI_FINANCIAL_ACCESS_FAILED"
  );

  return payload;
}

export async function loadIXITransactDashboard({ query, signal } = {}) {
  const response = await fetch(
    "/api/ixi/financial/dashboard",
    {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(query || {}),
      signal
    }
  );

  const payload = await readJson(response);

  throwForBadResponse(
    response,
    payload,
    "IXI Financial dashboard projection could not be loaded.",
    "IXI_FINANCIAL_DASHBOARD_FAILED"
  );

  return payload;
}

export async function loadIXITransactGL({
  period = "",
  currency = "USD",
  signal
} = {}) {
  const params = new URLSearchParams();

  if (clean(period)) {
    params.set("period", clean(period));
  }

  params.set(
    "currency",
    clean(currency || "USD").toUpperCase()
  );

  const response = await fetch(
    `/api/ixi/financial/gl?${params.toString()}`,
    {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
      signal
    }
  );

  const payload = await readJson(response);

  throwForBadResponse(
    response,
    payload,
    "IXI General Ledger could not be loaded.",
    "IXI_FINANCIAL_GL_FAILED"
  );

  return payload;
}

export async function loadIXITransactChartOfAccounts({ signal } = {}) {
  const response = await fetch(
    "/api/ixi/financial/accounts",
    {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
      signal
    }
  );

  const payload = await readJson(response);

  throwForBadResponse(
    response,
    payload,
    "TRAN$ACT Chart of Accounts could not be loaded.",
    "IXI_FINANCIAL_COA_FAILED"
  );

  return payload;
}

export async function createIXITransactDesktopDocument({
  documentType = "",
  input = {},
  commandId = "",
  idempotencyKey = "",
  metadata = {},
  snapshot = {},
  signal
} = {}) {
  const resolvedDocumentType = clean(documentType).toLowerCase();

  if (!resolvedDocumentType) {
    const error = new Error("TRAN$ACT Desktop documentType is required.");
    error.code = "IXI_FINANCIAL_DOCUMENT_TYPE_REQUIRED";
    throw error;
  }

  const response = await fetch(
    "/api/ixi/financial/commands/desktop/create",
    {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-IXI-Source": "ixi-transact-desktop"
      },
      body: JSON.stringify({
        documentType: resolvedDocumentType,
        input: input && typeof input === "object" && !Array.isArray(input) ? input : {},
        commandId: clean(commandId),
        idempotencyKey: clean(idempotencyKey),
        metadata: metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata : {},
        snapshot: snapshot && typeof snapshot === "object" && !Array.isArray(snapshot) ? snapshot : {}
      }),
      signal
    }
  );

  const payload = await readJson(response);

  throwForBadResponse(
    response,
    payload,
    "TRAN$ACT Desktop document could not be created.",
    "IXI_FINANCIAL_DESKTOP_CREATE_FAILED"
  );

  return payload;
}

export async function createIXITransactJournalEntry(input, options = {}) {
  return createIXITransactDesktopDocument({
    ...(options && typeof options === "object" && !Array.isArray(options) ? options : {}),
    documentType: "journal-entry",
    input: input && typeof input === "object" && !Array.isArray(input) ? input : {}
  });
}

export async function closeIXITransactAccountingPeriod({
  period = "",
  currency = "USD",
  commandId = "",
  idempotencyKey = "",
  metadata = {},
  signal
} = {}) {
  const resolvedPeriod = clean(period);

  if (!/^\d{4}-\d{2}$/.test(resolvedPeriod)) {
    const error = new Error("TRAN$ACT period close requires YYYY-MM accounting period.");
    error.code = "IXI_FINANCIAL_PERIOD_REQUIRED";
    throw error;
  }

  const response = await fetch(
    "/api/ixi/financial/commands/desktop/close-period",
    {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-IXI-Source": "ixi-transact-desktop"
      },
      body: JSON.stringify({
        period: resolvedPeriod,
        currency: clean(currency || "USD").toUpperCase(),
        commandId: clean(commandId),
        idempotencyKey: clean(idempotencyKey),
        metadata: metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata : {}
      }),
      signal
    }
  );

  const payload = await readJson(response);

  throwForBadResponse(
    response,
    payload,
    "TRAN$ACT accounting period could not be closed.",
    "IXI_FINANCIAL_PERIOD_CLOSE_FAILED"
  );

  return payload;
}
