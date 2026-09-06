// /lib/media/ixiMediaClient.js

import {
  isIXIAosStagedMedia,
  mapIXIMediaManifestToAosMedia,
  resolveIXIAosMediaIdentity,
  validateIXIAosMediaFile
} from "./ixiAosMediaContract.mjs";

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

export async function initializeIXIDirectMediaUpload({
  machineId,
  passportId = "",
  file,
  position = 0
} = {}) {
  const validated = validateIXIAosMediaFile(file);
  const response = await fetch("/api/media/uploads/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      machineId,
      passportId,
      fileName: validated.fileName,
      contentType: validated.contentType,
      sizeBytes: validated.sizeBytes,
      position
    })
  });
  const payload = await readJsonResponse(response);
  if (!payload?.upload?.uploadUrl) throw new Error("IXI Media did not return a secure upload URL.");
  return { ...payload.upload, file, contentType: validated.contentType };
}

export async function putIXIDirectMediaUpload(upload = {}) {
  const response = await fetch(upload.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": upload.contentType },
    body: upload.file
  });
  if (!response.ok) throw new Error(`Secure image upload failed (${response.status}).`);
  return upload;
}

export async function completeIXIDirectMediaUpload({
  machineId,
  passportId = "",
  uploads = [],
  manifestMode = "replace"
} = {}) {
  const response = await fetch("/api/media/uploads/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      machineId,
      passportId,
      sourceType: "aos-object-direct-upload",
      uploads: uploads.map(({ file, uploadUrl, ...upload }) => upload),
      manifestMode,
      selectionMode: "manual"
    })
  });
  const payload = await readJsonResponse(response);
  if (!payload?.job?.jobId) throw new Error("IXI Media did not create a processing job.");
  return payload.job;
}

async function waitForIXIMediaManifest(machineKey, expectedJobId, timeoutMs = 15000) {
  const startedAt = Date.now();
  let lastError = null;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const manifest = await getIXIMachineMedia(machineKey);
      if (!expectedJobId || manifest?.latestJobId === expectedJobId) return manifest;
    } catch (error) {
      lastError = error;
      await sleep(400);
    }
  }
  throw lastError || new Error("IXI Media manifest was not available after processing.");
}

export async function persistIXIAosMediaDraft({
  object,
  media = [],
  onProgress = null
} = {}) {
  const items = Array.isArray(media) ? media : [];
  const staged = items.filter(isIXIAosStagedMedia);
  if (!staged.length) return items;

  const { machineId, passportId } = resolveIXIAosMediaIdentity(object);
  onProgress?.("VALIDATING PHOTO");

  const initialized = await Promise.all(staged.map((item, position) =>
    initializeIXIDirectMediaUpload({ machineId, passportId, file: item.file, position })
  ));

  onProgress?.("UPLOADING PHOTO");
  const uploaded = await Promise.all(initialized.map(putIXIDirectMediaUpload));

  onProgress?.("PROCESSING PHOTO");
  const job = await completeIXIDirectMediaUpload({
    machineId,
    passportId,
    uploads: uploaded,
    manifestMode: "replace"
  });

  await waitForIXIMediaJob({ jobId: job.jobId, onProgress: current => {
    onProgress?.(current?.status === "processing" ? "OPTIMIZING PHOTO" : "PROCESSING PHOTO");
  }});

  const manifest = await waitForIXIMediaManifest(passportId || machineId, job.jobId);
  const canonicalMedia = mapIXIMediaManifestToAosMedia(manifest);
  if (!canonicalMedia.length) throw new Error("IXI Media completed without a usable image.");
  onProgress?.("PHOTO READY");
  return canonicalMedia;
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
  const processedPhotoCount =
    Number(job.processedPhotoCount || 0);

  if (processedPhotoCount > 0) {
    return job;
  }

  throw new Error(
    job.error ||
      "IXI Media processed no usable photos"
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
