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

  if (!response.ok || payload?.ok !== true) {
    const error = new Error(
      firstErrorMessage(payload, "IXI Financial access context could not be loaded.")
    );
    error.code = clean(payload?.errors?.[0]?.code || payload?.error?.code || "IXI_FINANCIAL_ACCESS_FAILED");
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

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

  if (!response.ok || payload?.ok !== true) {
    const error = new Error(
      firstErrorMessage(payload, "IXI Financial dashboard projection could not be loaded.")
    );
    error.code = clean(payload?.errors?.[0]?.code || payload?.error?.code || "IXI_FINANCIAL_DASHBOARD_FAILED");
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}
