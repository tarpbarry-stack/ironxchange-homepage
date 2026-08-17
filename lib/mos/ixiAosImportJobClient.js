const IX_CORE_BASE =
  "https://staging.ironxchange.com/ix-core";

const IXI_MOS_BASE =
  `${IX_CORE_BASE}/mos/v1`;

function clean(value) {
  return String(value ?? "").trim();
}

async function requestJson(
  url,
  options = {}
) {
  const response =
    await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body
          ? { "Content-Type": "application/json" }
          : {}),
        ...(options.headers || {})
      }
    });

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (
    !response.ok ||
    payload?.ok === false
  ) {
    const error = new Error(
      payload?.error?.message ||
      `AOS import request failed with status ${response.status}.`
    );

    error.code =
      payload?.error?.code ||
      "AOS_IMPORT_REQUEST_FAILED";

    error.status =
      response.status;

    error.details =
      payload?.error?.details ||
      null;

    throw error;
  }

  return payload;
}

export async function listAosImportJobs({
  entityId,
  status = ""
} = {}) {
  const id = clean(entityId);

  if (!id) {
    throw new Error(
      "entityId is required to list import jobs."
    );
  }

  const query =
    new URLSearchParams({
      entityId: id
    });

  if (clean(status)) {
    query.set("status", clean(status));
  }

  return requestJson(
    `${IXI_MOS_BASE}/imports/jobs?${query.toString()}`
  );
}

export async function findAosImportJobByFingerprint({
  entityId,
  fingerprint
} = {}) {
  const normalizedFingerprint =
    clean(fingerprint);

  if (!normalizedFingerprint) {
    return null;
  }

  const response =
    await listAosImportJobs({
      entityId
    });

  return (
    Array.isArray(response?.jobs)
      ? response.jobs
      : []
  ).find(job =>
    clean(job?.sourceFile?.fingerprint) ===
      normalizedFingerprint &&
    job?.status !== "cancelled"
  ) || null;
}

export async function createAosImportJob({
  entityId,
  actorId = null,
  sourceFile,
  definitionId = null,
  definitionKey = null,
  mapping = {},
  rows = [],
  metadata = {}
} = {}) {
  return requestJson(
    `${IXI_MOS_BASE}/imports/jobs`,
    {
      method: "POST",
      body: JSON.stringify({
        entityId,
        actorId,
        sourceFile,
        definitionId,
        definitionKey,
        mapping,
        rows,
        metadata
      })
    }
  );
}

export async function getAosImportJob({
  entityId,
  jobId
} = {}) {
  const query =
    new URLSearchParams({
      entityId: clean(entityId)
    });

  return requestJson(
    `${IXI_MOS_BASE}/imports/jobs/${encodeURIComponent(clean(jobId))}?${query.toString()}`
  );
}

export async function executeAosImportJob({
  entityId,
  jobId,
  actorId = null,
  limit = 25
} = {}) {
  return requestJson(
    `${IXI_MOS_BASE}/imports/jobs/${encodeURIComponent(clean(jobId))}/execute`,
    {
      method: "POST",
      body: JSON.stringify({
        entityId,
        actorId,
        limit
      })
    }
  );
}

export function summarizeAosImportJob(job) {
  const source =
    job?.summary || {};

  return {
    total: Number(source.total || 0),
    ready: Number(source.ready || 0),
    processing: Number(source.processing || 0),
    created: Number(source.created || 0),
    invalid: Number(source.invalid || 0),
    failed:
      Number(source.failed || 0) +
      Number(source.failedRetryable || 0),
    failedRetryable:
      Number(source.failedRetryable || 0)
  };
}

export default {
  listAosImportJobs,
  findAosImportJobByFingerprint,
  createAosImportJob,
  getAosImportJob,
  executeAosImportJob,
  summarizeAosImportJob
};
