// /lib/media/ixiMediaClient.js

const DEFAULT_POLL_INTERVAL_MS = 1000;
const DEFAULT_TIMEOUT_MS = 180000;

function sleep(milliseconds) {
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
}

async function readJsonResponse(response) {
  const text = await response.text();

  let payload;

  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(
      `IXI Media returned invalid JSON (${response.status})`
    );
  }

  if (!response.ok || payload?.ok === false) {
    throw new Error(
      payload?.error ||
        `IXI Media request failed (${response.status})`
    );
  }

  return payload;
}

export async function createIXIMediaJob({
  machineId,
  passportId = "",
  sourceType = "url-import",
  sourceUrl = "",
  imageUrls = [],
  manifestMode = "replace",
  selectionMode = "all"
} = {}) {
  if (!machineId) {
    throw new Error(
      "createIXIMediaJob requires machineId"
    );
  }

  const cleanImageUrls = Array.from(
    new Set(
      (Array.isArray(imageUrls) ? imageUrls : [])
        .map(url => String(url || "").trim())
        .filter(Boolean)
    )
  );

  if (cleanImageUrls.length === 0) {
    throw new Error(
      "URL Import returned no media URLs"
    );
  }

  const response = await fetch(
    "/api/media/jobs",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        machineId,
        passportId,
        sourceType,
        sourceUrl,
        imageUrls: cleanImageUrls,
        manifestMode,
        selectionMode
      })
    }
  );

  const payload =
    await readJsonResponse(response);

  const job = payload?.job;

  if (!job?.jobId) {
    throw new Error(
      "IXI Media did not return a job ID"
    );
  }

  return job;
}

export async function getIXIMediaJob(
  jobId
) {
  if (!jobId) {
    throw new Error(
      "getIXIMediaJob requires jobId"
    );
  }

  const response = await fetch(
    `/api/media/jobs/${encodeURIComponent(jobId)}`
  );

  const payload =
    await readJsonResponse(response);

  if (!payload?.job) {
    throw new Error(
      "IXI Media job response is missing job"
    );
  }

  return payload.job;
}

export async function waitForIXIMediaJob({
  jobId,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
  onProgress
} = {}) {
  if (!jobId) {
    throw new Error(
      "waitForIXIMediaJob requires jobId"
    );
  }

  const startedAt = Date.now();

  while (
    Date.now() - startedAt <
    timeoutMs
  ) {
    const job =
      await getIXIMediaJob(jobId);

    if (
      typeof onProgress === "function"
    ) {
      onProgress(job);
    }

    if (job.status === "complete") {
      return job;
    }

    if (job.status === "partial") {
      throw new Error(
        `IXI Media completed partially: ${
          job.failedPhotoCount || 0
        } photo(s) failed`
      );
    }

    if (job.status === "failed") {
      throw new Error(
        job.error ||
          "IXI Media job failed"
      );
    }

    await sleep(pollIntervalMs);
  }

  throw new Error(
    "IXI Media processing timed out"
  );
}

export async function getIXIMachineMedia(
  machineKey
) {
  if (!machineKey) {
    throw new Error(
      "getIXIMachineMedia requires machineKey"
    );
  }

  const response = await fetch(
    `/api/media/machines/${encodeURIComponent(machineKey)}`
  );

  const payload =
    await readJsonResponse(response);

  if (!payload?.manifest) {
    throw new Error(
      "IXI Media response is missing manifest"
    );
  }

  return payload.manifest;
}

export async function processURLImportMedia({
  machineId,
  passportId = "",
  sourceType = "url-import",
  sourceUrl = "",
  imageUrls = [],
  onProgress
} = {}) {
  const job =
    await createIXIMediaJob({
      machineId,
      passportId,
      sourceType,
      sourceUrl,
      imageUrls,
      manifestMode: "replace",
      selectionMode: "all"
    });

  const completedJob =
    await waitForIXIMediaJob({
      jobId: job.jobId,
      onProgress
    });

  const machineKey =
    passportId || machineId;

  const manifest =
    await getIXIMachineMedia(
      machineKey
    );

  return {
    job: completedJob,
    manifest
  };
}
