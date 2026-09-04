import crypto from "crypto";

const DEFAULT_IX_CORE_BASE =
  "https://staging.ironxchange.com/ix-core";

function clean(value) {
  return String(value ?? "").trim();
}

function getIxCoreBase() {
  return (
    clean(process.env.IX_CORE_BASE_URL) ||
    DEFAULT_IX_CORE_BASE
  ).replace(/\/+$/, "");
}

function getInternalSecret() {
  const secret =
    clean(
      process.env.IXI_MOS_INTERNAL_SECRET
    );

  if (!secret) {
    const error = new Error(
      "IXI MOS internal signing secret is not configured."
    );

    error.code = "IXI_MOS_INTERNAL_SECRET_REQUIRED";
    error.status = 503;
    throw error;
  }

  return secret;
}

function bodyToString(body) {
  if (
    body === undefined ||
    body === null
  ) {
    return "";
  }

  return JSON.stringify(body);
}

function sha256(value) {
  return crypto
    .createHash("sha256")
    .update(value)
    .digest("hex");
}

function createSignature({
  secret,
  timestamp,
  requestId,
  method,
  targetPath,
  principalId,
  entityId,
  bodyString
}) {
  const canonical = [
    timestamp,
    requestId,
    method.toUpperCase(),
    targetPath,
    principalId,
    entityId,
    sha256(bodyString)
  ].join("\n");

  return crypto
    .createHmac("sha256", secret)
    .update(canonical)
    .digest("hex");
}

async function readPayload(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      raw: text
    };
  }
}

export async function requestIxCoreMos({
  path,
  method = "GET",
  body = null,
  principalId = "",
  entityId = "",
  extraHeaders = {}
} = {}) {
  const normalizedPath =
    clean(path).startsWith("/")
      ? clean(path)
      : `/${clean(path)}`;

  if (!normalizedPath) {
    const error = new Error(
      "IX-Core MOS path is required."
    );

    error.code = "IXI_MOS_INTERNAL_PATH_REQUIRED";
    error.status = 500;
    throw error;
  }

  const secret =
    getInternalSecret();

  const normalizedMethod =
    clean(method).toUpperCase() || "GET";

  const normalizedPrincipalId =
    clean(principalId);

  const normalizedEntityId =
    clean(entityId);

  const bodyString =
    bodyToString(body);

  const timestamp =
    String(Date.now());

  const requestId =
    crypto.randomUUID();

  const targetPath =
    `/mos/v1${normalizedPath}`;

  const signature =
    createSignature({
      secret,
      timestamp,
      requestId,
      method: normalizedMethod,
      targetPath,
      principalId:
        normalizedPrincipalId,
      entityId:
        normalizedEntityId,
      bodyString
    });

  const headers = {
    Accept: "application/json",
    "X-IXI-Internal-Signature-Version": "v1",
    "X-IXI-Internal-Timestamp": timestamp,
    "X-IXI-Internal-Request-Id": requestId,
    "X-IXI-Internal-Principal-Id":
      normalizedPrincipalId,
    "X-IXI-Internal-Entity-Id":
      normalizedEntityId,
    "X-IXI-Internal-Signature": signature,
    ...extraHeaders
  };

  if (bodyString) {
    headers["Content-Type"] =
      "application/json";
  }

  let response;

  try {
    response = await fetch(
      `${getIxCoreBase()}${targetPath}`,
      {
        method: normalizedMethod,
        headers,
        body:
          bodyString || undefined
      }
    );
  } catch (cause) {
    const error = new Error(
      "IXI server gateway could not reach IX-Core."
    );

    error.code = "IXI_MOS_INTERNAL_NETWORK_ERROR";
    error.status = 502;
    error.cause = cause;
    throw error;
  }

  const payload =
    await readPayload(response);

  if (
    !response.ok ||
    payload?.ok === false
  ) {
    const error = new Error(
      payload?.error?.message ||
      `IX-Core MOS request failed with status ${response.status}.`
    );

    error.code =
      payload?.error?.code ||
      "IXI_MOS_INTERNAL_REQUEST_FAILED";

    error.status =
      response.status;

    error.details =
      payload?.error?.details ||
      null;

    throw error;
  }

  return payload;
}

export async function requestIxCoreFinancial({
  path,
  method = "GET",
  body = null,
  principalId = "",
  entityId = "",
  extraHeaders = {}
} = {}) {
  const financialPath = clean(path);

  if (!financialPath.startsWith("/financial/")) {
    const error = new Error(
      "IX-Core Financial path must begin with /financial/."
    );
    error.code = "IXI_FINANCIAL_INTERNAL_PATH_INVALID";
    error.status = 500;
    throw error;
  }

  const secret = getInternalSecret();
  const normalizedMethod = clean(method).toUpperCase() || "GET";
  const normalizedPrincipalId = clean(principalId);
  const normalizedEntityId = clean(entityId);
  const bodyString = bodyToString(body);
  const timestamp = String(Date.now());
  const requestId = crypto.randomUUID();

  if (!normalizedPrincipalId || !normalizedEntityId) {
    const error = new Error(
      "Authenticated principal and Entity are required for Financial requests."
    );
    error.code = "IXI_FINANCIAL_INTERNAL_CONTEXT_REQUIRED";
    error.status = 401;
    throw error;
  }

  const signature = createSignature({
    secret,
    timestamp,
    requestId,
    method: normalizedMethod,
    targetPath: financialPath,
    principalId: normalizedPrincipalId,
    entityId: normalizedEntityId,
    bodyString
  });

  let response;

  try {
    response = await fetch(`${getIxCoreBase()}${financialPath}`, {
      method: normalizedMethod,
      headers: {
        Accept: "application/json",
        "X-IXI-Internal-Signature-Version": "v1",
        "X-IXI-Internal-Timestamp": timestamp,
        "X-IXI-Internal-Request-Id": requestId,
        "X-IXI-Internal-Principal-Id": normalizedPrincipalId,
        "X-IXI-Internal-Entity-Id": normalizedEntityId,
        "X-IXI-Internal-Signature": signature,
        "X-IXI-Source": "ironxchange-transact",
        ...extraHeaders,
        ...(bodyString ? { "Content-Type": "application/json" } : {})
      },
      body: bodyString || undefined
    });
  } catch (cause) {
    const error = new Error(
      "IXI server gateway could not reach IX-Core Financial."
    );
    error.code = "IXI_FINANCIAL_INTERNAL_NETWORK_ERROR";
    error.status = 502;
    error.cause = cause;
    throw error;
  }

  const payload = await readPayload(response);

  if (!response.ok || payload?.ok === false) {
    const problem = payload?.errors?.[0] || payload?.error || {};
    const error = new Error(
      problem.message || `IX-Core Financial request failed with status ${response.status}.`
    );
    error.code = problem.code || "IXI_FINANCIAL_INTERNAL_REQUEST_FAILED";
    error.status = response.status;
    error.details = problem.details || null;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export async function requestIxCoreFreight({
  path,
  method = "GET",
  body = null,
  principalId = "",
  entityId = "",
  extraHeaders = {}
} = {}) {
  const suffix = clean(path).replace(/^\/+/, "");
  const targetPath = `/freight/v1${suffix ? `/${suffix}` : ""}`;
  const secret = getInternalSecret();
  const normalizedMethod = clean(method).toUpperCase() || "GET";
  const normalizedPrincipalId = clean(principalId);
  const normalizedEntityId = clean(entityId);
  const bodyString = bodyToString(body);
  const timestamp = String(Date.now());
  const requestId = crypto.randomUUID();

  if (!normalizedPrincipalId || !normalizedEntityId) {
    const error = new Error("Authenticated principal and Entity are required for Freight requests.");
    error.code = "IXI_FREIGHT_INTERNAL_CONTEXT_REQUIRED";
    error.status = 401;
    throw error;
  }

  const signature = createSignature({
    secret,
    timestamp,
    requestId,
    method: normalizedMethod,
    targetPath,
    principalId: normalizedPrincipalId,
    entityId: normalizedEntityId,
    bodyString
  });

  let response;
  try {
    response = await fetch(`${getIxCoreBase()}${targetPath}`, {
      method: normalizedMethod,
      headers: {
        Accept: "application/json",
        "X-IXI-Internal-Signature-Version": "v1",
        "X-IXI-Internal-Timestamp": timestamp,
        "X-IXI-Internal-Request-Id": requestId,
        "X-IXI-Internal-Principal-Id": normalizedPrincipalId,
        "X-IXI-Internal-Entity-Id": normalizedEntityId,
        "X-IXI-Internal-Signature": signature,
        "X-IXI-Source": "ironxchange-transact-freight",
        ...extraHeaders,
        ...(bodyString ? { "Content-Type": "application/json" } : {})
      },
      body: bodyString || undefined
    });
  } catch (cause) {
    const error = new Error("IXI server gateway could not reach IX-Core Freight.");
    error.code = "IXI_FREIGHT_INTERNAL_NETWORK_ERROR";
    error.status = 502;
    error.cause = cause;
    throw error;
  }

  const payload = await readPayload(response);
  if (!response.ok || payload?.ok === false) {
    const problem = payload?.errors?.[0] || payload?.error || {};
    const error = new Error(problem.message || `IX-Core Freight request failed with status ${response.status}.`);
    error.code = problem.code || "IXI_FREIGHT_INTERNAL_REQUEST_FAILED";
    error.status = response.status;
    error.details = problem.details || null;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export async function resolveIxCoreAosContext({
  session
}) {
  const userId =
    clean(session?.userId);

  if (!userId) {
    const error = new Error(
      "Authenticated AOS user identity is required."
    );

    error.code = "AOS_BROWSER_USER_ID_REQUIRED";
    error.status = 401;
    throw error;
  }

  const response =
    await requestIxCoreMos({
      path: "/aos/environment",
      method: "POST",
      principalId: userId,
      body: {
        ownerUserId: userId,
        displayName:
          clean(session?.displayName) ||
          "IXI Entity",
        metadata: {
          source:
            "authenticated-browser-gateway",
          authenticatedThrough:
            "sharetribe"
        }
      }
    });

  const environment =
    response?.environment || null;

  const entityId =
    clean(
      environment?.entity?.entityId
    );

  if (!entityId) {
    const error = new Error(
      "IX-Core did not resolve an AOS Entity for the authenticated user."
    );

    error.code = "AOS_BROWSER_ENTITY_RESOLUTION_FAILED";
    error.status = 502;
    throw error;
  }

  return {
    userId,
    entityId,
    account:
      environment?.account || null,
    principal:
      environment?.principal || null,
    entity:
      environment?.entity || null,
    environment,
    response
  };
}

export default {
  requestIxCoreMos,
  requestIxCoreFinancial,
  requestIxCoreFreight,
  resolveIxCoreAosContext
};
