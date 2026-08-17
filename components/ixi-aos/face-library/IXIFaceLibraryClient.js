/* =========================================================
   IXI AOS — COMPANY FACE LIBRARY CLIENT

   Browser-safe transport only.
   Durable truth must live behind the same-origin IXI proxy and IX-Core.
   No localStorage/sessionStorage persistence. No browser-authored roles.
   ========================================================= */

const clean = value => String(value ?? "").trim();
const safeObject = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};

export const IXI_FACE_LIBRARY_API_BASE = "/api/ixi-face-library";

export class IXIFaceLibraryError extends Error {
  constructor(message, { status = 0, code = "", details = null, requestId = "" } = {}) {
    super(message || "IXI Face Library request failed");
    this.name = "IXIFaceLibraryError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : { message: await response.text().catch(() => "") };

  if (!response.ok) {
    throw new IXIFaceLibraryError(
      body?.message || body?.error || `Face Library request failed (${response.status})`,
      {
        status: response.status,
        code: clean(body?.code),
        details: body?.details || body,
        requestId: clean(response.headers.get("x-request-id") || body?.requestId)
      }
    );
  }

  return body;
}

async function request(path, {
  method = "GET",
  query = null,
  body = null,
  etag = "",
  signal = null,
  idempotencyKey = ""
} = {}) {
  const url = new URL(`${IXI_FACE_LIBRARY_API_BASE}${path}`, window.location.origin);

  if (query && typeof query === "object") {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (Array.isArray(value)) {
        value.forEach(item => url.searchParams.append(key, String(item)));
      } else {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const headers = {
    Accept: "application/json"
  };

  if (body !== null) headers["Content-Type"] = "application/json";
  if (clean(etag)) headers["If-Match"] = clean(etag);
  if (clean(idempotencyKey)) headers["Idempotency-Key"] = clean(idempotencyKey);

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body === null ? undefined : JSON.stringify(body),
    credentials: "same-origin",
    cache: "no-store",
    signal
  });

  return parseResponse(response);
}

export async function listCompanyFaces({ companyId = "", status = "", cursor = "", limit = 100, signal = null } = {}) {
  return request("/faces", {
    query: { companyId, status, cursor, limit },
    signal
  });
}

export async function getCompanyFace({ companyId = "", faceAppId = "", signal = null } = {}) {
  return request(`/faces/${encodeURIComponent(clean(faceAppId))}`, {
    query: { companyId },
    signal
  });
}

export async function createCompanyFaceDraft({ companyId = "", draft = {}, idempotencyKey = "", signal = null } = {}) {
  return request("/drafts", {
    method: "POST",
    body: { companyId: clean(companyId), draft: safeObject(draft) },
    idempotencyKey,
    signal
  });
}

export async function updateCompanyFaceDraft({ companyId = "", faceAppId = "", version = null, patch = {}, etag = "", signal = null } = {}) {
  return request(`/drafts/${encodeURIComponent(clean(faceAppId))}`, {
    method: "PATCH",
    body: {
      companyId: clean(companyId),
      version: Number.isInteger(version) ? version : null,
      patch: safeObject(patch)
    },
    etag,
    signal
  });
}

export async function cloneCompanyFace({ companyId = "", sourceFaceAppId = "", sourceVersion = null, label = "", idempotencyKey = "", signal = null } = {}) {
  return request("/drafts/clone", {
    method: "POST",
    body: {
      companyId: clean(companyId),
      sourceFaceAppId: clean(sourceFaceAppId),
      sourceVersion: Number.isInteger(sourceVersion) ? sourceVersion : null,
      label: clean(label)
    },
    idempotencyKey,
    signal
  });
}

export async function validateCompanyFaceDraft({ companyId = "", faceAppId = "", version = null, targetDefinitionIds = [], signal = null } = {}) {
  return request(`/drafts/${encodeURIComponent(clean(faceAppId))}/validate`, {
    method: "POST",
    body: {
      companyId: clean(companyId),
      version: Number.isInteger(version) ? version : null,
      targetDefinitionIds: Array.isArray(targetDefinitionIds) ? targetDefinitionIds : []
    },
    signal
  });
}

export async function publishCompanyFaceDraft({ companyId = "", faceAppId = "", version = null, etag = "", validationToken = "", changeReason = "", idempotencyKey = "", signal = null } = {}) {
  return request(`/drafts/${encodeURIComponent(clean(faceAppId))}/publish`, {
    method: "POST",
    body: {
      companyId: clean(companyId),
      version: Number.isInteger(version) ? version : null,
      validationToken: clean(validationToken),
      changeReason: clean(changeReason)
    },
    etag,
    idempotencyKey,
    signal
  });
}

export async function retireCompanyFace({ companyId = "", faceAppId = "", reason = "", etag = "", idempotencyKey = "", signal = null } = {}) {
  return request(`/faces/${encodeURIComponent(clean(faceAppId))}/retire`, {
    method: "POST",
    body: { companyId: clean(companyId), reason: clean(reason) },
    etag,
    idempotencyKey,
    signal
  });
}

export async function listFaceAssignments({ companyId = "", faceAppId = "", cursor = "", limit = 100, signal = null } = {}) {
  return request("/assignments", {
    query: { companyId, faceAppId, cursor, limit },
    signal
  });
}

export async function createFaceAssignment({ companyId = "", assignment = {}, idempotencyKey = "", signal = null } = {}) {
  return request("/assignments", {
    method: "POST",
    body: { companyId: clean(companyId), assignment: safeObject(assignment) },
    idempotencyKey,
    signal
  });
}

export async function removeFaceAssignment({ companyId = "", assignmentId = "", etag = "", idempotencyKey = "", signal = null } = {}) {
  return request(`/assignments/${encodeURIComponent(clean(assignmentId))}`, {
    method: "DELETE",
    body: { companyId: clean(companyId) },
    etag,
    idempotencyKey,
    signal
  });
}

export async function updateFacePermissions({ companyId = "", faceAppId = "", permissions = {}, etag = "", idempotencyKey = "", signal = null } = {}) {
  return request(`/faces/${encodeURIComponent(clean(faceAppId))}/permissions`, {
    method: "PUT",
    body: { companyId: clean(companyId), permissions: safeObject(permissions) },
    etag,
    idempotencyKey,
    signal
  });
}

export async function resolveFacesForObject({ companyId = "", objectId = "", signal = null } = {}) {
  return request("/resolve", {
    query: { companyId, objectId },
    signal
  });
}

export default {
  listCompanyFaces,
  getCompanyFace,
  createCompanyFaceDraft,
  updateCompanyFaceDraft,
  cloneCompanyFace,
  validateCompanyFaceDraft,
  publishCompanyFaceDraft,
  retireCompanyFace,
  listFaceAssignments,
  createFaceAssignment,
  removeFaceAssignment,
  updateFacePermissions,
  resolveFacesForObject
};
