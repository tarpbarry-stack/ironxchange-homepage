/*
 * IXI TRAN$ACT DESKTOP CLIENT
 *
 * PURPOSE
 * -------
 * Browser-side client for Entity-scoped TRAN$ACT Desktop.
 *
 * Desktop reads the company Entity financial estate.
 * Desktop writes through the dedicated Entity-scoped command route.
 *
 * This client never sends actor/entity authority.
 */

function clean(value) {
  return String(value ?? "").trim();
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function safeArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}

export class IXITransactDesktopError extends Error {
  constructor(message, {
    status = 0,
    operation = "",
    result = null,
    errors = []
  } = {}) {
    super(message);
    this.name = "IXITransactDesktopError";
    this.status = Number(status || 0);
    this.operation = clean(operation);
    this.result = result;
    this.errors = safeArray(errors);
  }
}

async function readJsonResponse(response, operation) {
  let result = null;

  try {
    result = await response.json();
  } catch {
    throw new IXITransactDesktopError(
      `TRAN$ACT returned HTTP ${response.status} without valid JSON.`,
      {
        status: response.status,
        operation
      }
    );
  }

  if (!response.ok || result?.ok !== true) {
    const errors = safeArray(result?.errors);
    const first = errors[0];

    throw new IXITransactDesktopError(
      clean(first?.message || `TRAN$ACT request failed with HTTP ${response.status}.`),
      {
        status: response.status,
        operation,
        result,
        errors
      }
    );
  }

  return result;
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

  params.set("currency", clean(currency || "USD").toUpperCase());

  const response = await fetch(
    `/api/ixi/financial/gl?${params.toString()}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json"
      },
      signal
    }
  );

  return readJsonResponse(
    response,
    "financial.gl.read"
  );
}

export async function createIXITransactDesktopDocument({
  documentType = "",
  input = {},
  commandId = "",
  idempotencyKey = "",
  snapshot = {},
  metadata = {},
  signal
} = {}) {
  const resolvedDocumentType = clean(documentType).toLowerCase();

  if (!resolvedDocumentType) {
    throw new IXITransactDesktopError(
      "TRAN$ACT Desktop documentType is required.",
      {
        operation: "financial.desktop.create"
      }
    );
  }

  const response = await fetch(
    "/api/ixi/financial/commands/desktop/create",
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-IXI-Source": "ixi-transact-desktop"
      },
      body: JSON.stringify({
        documentType: resolvedDocumentType,
        input: safeObject(input),
        commandId: clean(commandId),
        idempotencyKey: clean(idempotencyKey),
        snapshot: safeObject(snapshot),
        metadata: {
          ...safeObject(metadata),
          transactSurface: "desktop"
        }
      }),
      signal
    }
  );

  return readJsonResponse(
    response,
    "financial.desktop.create"
  );
}

export async function createIXITransactJournalEntry(
  input = {},
  options = {}
) {
  return createIXITransactDesktopDocument({
    ...safeObject(options),
    documentType: "journal-entry",
    input
  });
}

export async function postIXITransactJournalEntry({
  financialDocumentId = "",
  expectedRevision = null,
  commandId = "",
  idempotencyKey = "",
  metadata = {},
  signal
} = {}) {
  const resolvedId = clean(financialDocumentId);
  const resolvedRevision = Number(expectedRevision);

  if (!resolvedId) {
    throw new IXITransactDesktopError(
      "TRAN$ACT journal financialDocumentId is required.",
      { operation: "financial.journal.post" }
    );
  }

  if (!Number.isInteger(resolvedRevision) || resolvedRevision < 1) {
    throw new IXITransactDesktopError(
      "TRAN$ACT journal expectedRevision is required.",
      { operation: "financial.journal.post" }
    );
  }

  const response = await fetch(
    `/api/ixi/financial/commands/desktop/journals/${encodeURIComponent(resolvedId)}/post`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-IXI-Source": "ixi-transact-desktop"
      },
      body: JSON.stringify({
        expectedRevision: resolvedRevision,
        commandId: clean(commandId),
        idempotencyKey: clean(idempotencyKey),
        metadata: {
          ...safeObject(metadata),
          transactSurface: "desktop"
        }
      }),
      signal
    }
  );

  return readJsonResponse(
    response,
    "financial.journal.post"
  );
}

export function getIXITransactGLProjection(result) {
  return result?.data?.projection || null;
}

export function getIXITransactGLScope(result) {
  return result?.data?.scope || null;
}

export default {
  loadIXITransactGL,
  createIXITransactDesktopDocument,
  createIXITransactJournalEntry,
  postIXITransactJournalEntry,
  getIXITransactGLProjection,
  getIXITransactGLScope
};
