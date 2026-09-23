import { validateIXIAosMediaFile } from "../media/ixiAosMediaContract.mjs";
const DATABASE = "ixi-post-free-files-v1";
const pendingHeroes = new Map();
async function compatibilityHero(blob) {
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 2560 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Cannot prepare the compatibility hero.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const jpeg = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("Hero conversion failed.")), "image/jpeg", 0.9));
    return new File([jpeg], "machine-hero.jpg", { type: "image/jpeg" });
  } finally { URL.revokeObjectURL(url); }
}
async function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("files");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function localFiles(operationId, value) {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction("files", value === undefined ? "readonly" : "readwrite");
      const store = transaction.objectStore("files");
      const request = value === undefined ? store.get(operationId) : value === null ? store.delete(operationId) : store.put(value, operationId);
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error("Photo recovery storage was interrupted."));
    });
  } finally { db.close(); }
}
export async function postingRequest(action, body = {}) {
  const response = await fetch(`/api/post-free/${action}`, { method: "POST", credentials: "same-origin",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(65000) });
  const payload = await response.json();
  if (!response.ok || payload.ok === false) throw new Error(payload.error?.message || "Posting request failed. Resume the same posting.");
  return payload;
}
export async function describePostingFile(file) {
  if (!file || file.size <= 0 || file.size > 20 * 1024 * 1024) throw new Error("Each photo must be no larger than 20 MB. Your original file will not be silently reduced.");
  const validated = validateIXIAosMediaFile(file);
  const sha256 = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer())), byte => byte.toString(16).padStart(2, "0")).join("");
  return { sha256, fileName: file.name, contentType: validated.contentType, sizeBytes: file.size };
}
export function uploadDirectPhoto(upload, file, onProgress, { idleMs = 120000 } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let timer, loaded = 0;
    const reset = () => { clearTimeout(timer); timer = setTimeout(() => xhr.abort(), idleMs); };
    const done = error => { clearTimeout(timer); error ? reject(error) : resolve(); };
    xhr.open("PUT", upload.uploadUrl);
    xhr.setRequestHeader("Content-Type", upload.contentType);
    xhr.upload.onprogress = event => {
      if (event.loaded > loaded) reset();
      loaded = event.loaded;
      onProgress(Math.min(file.size, loaded));
    };
    xhr.onload = () => done(xhr.status >= 200 && xhr.status < 300 ? null : new Error(`Photo transfer failed (${xhr.status}). Resume to retry this photo.`));
    xhr.onerror = () => done(new Error("Photo transfer lost its connection. Resume to keep completed uploads."));
    xhr.onabort = () => done(new Error("Photo transfer stopped making progress. Resume to check and retry the same upload."));
    reset();
    xhr.send(file);
  });
}
export async function runPostFreePosting({ operationId, storageScope, payload, photos = [], resume = false, revise = false, sdk,
  onProgress = () => {}, request = postingRequest, filesStore = localFiles, put = uploadDirectPhoto,
  sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), now = Date.now }) {
  if (!storageScope) throw new Error("Verify your saved postings before starting another machine.");
  const storageKey = `${storageScope}:${operationId}`;
  const selected = {};
  const files = [];
  onProgress("PREPARING PHOTO RECOVERY");
  for (const photo of photos) {
    const original = photo.originalFile || photo.file;
    const descriptor = await describePostingFile(original);
    selected[`${descriptor.sha256}:original`] = original;
    if (photo.file && photo.file !== original) {
      descriptor.rendition = await describePostingFile(photo.file);
      selected[`${descriptor.sha256}:rendition`] = photo.file;
    }
    files.push(descriptor);
  }
  let cached = {};
  try { cached = await filesStore(storageKey) || {}; } catch { /* Server receipts remain authoritative; ask for missing source files if necessary. */ }
  Object.assign(cached, selected);
  // A storage/quota failure is explicit before new creation, never a false
  // promise that the browser can restore unuploaded source files after refresh.
  if (Object.keys(selected).length) await filesStore(storageKey, cached);
  onProgress(resume ? "RECOVERING SAVED MACHINE" : "SAVING MACHINE DRAFT");
  const started = await request(revise ? "revise" : resume ? "resume" : "start", revise ? { operationId, files } : resume ? { operationId } : { operationId, payload, files });
  const row = started.row;
  if (row.status === "complete") {
    pendingHeroes.delete(storageKey);
    await filesStore(storageKey, null).catch(() => {});
    return row;
  }
  let state = await request("state", { operationId });
  if (!state.ready && !["queued", "processing"].includes(state.job?.status)) {
    const tasks = row.files.flatMap(file => [{ photoId: file.sha256, descriptor: file, rendition: false },
      ...(file.rendition ? [{ photoId: file.sha256, descriptor: file.rendition, rendition: true }] : [])]);
    const loaded = tasks.map(() => 0);
    const total = tasks.reduce((sum, task) => sum + task.descriptor.sizeBytes, 0);
    let cursor = 0, completed = 0, failure;
    const report = () => onProgress(`UPLOADING: ${completed}/${tasks.length} FILES SAVED — ${(loaded.reduce((a,b) => a+b,0)/1048576).toFixed(1)} / ${(total/1048576).toFixed(1)} MB`);
    const worker = async () => {
      while (!failure && cursor < tasks.length) {
        const index = cursor++, task = tasks[index];
        try {
          const prepared = await request("prepare", { operationId, photoId: task.photoId, rendition: task.rendition });
          if (!prepared.uploaded) {
            const file = cached[`${task.photoId}:${task.rendition ? "rendition" : "original"}`];
            if (!file) throw new Error(`Reselect ${task.descriptor.fileName}, then Resume. Its original bytes are needed; completed photos are already saved.`);
            await put(prepared.upload, file, bytes => { loaded[index] = bytes; report(); });
            const receipt = await request("prepare", { operationId, photoId: task.photoId, rendition: task.rendition });
            if (!receipt.uploaded) throw new Error("Storage has not confirmed this photo. Resume to verify the same upload.");
          }
          loaded[index] = task.descriptor.sizeBytes;
          completed++;
          report();
        } catch (error) { failure ||= error; }
      }
    };
    await Promise.all(Array.from({ length: Math.min(2, tasks.length) }, worker));
    if (failure) throw failure;
    await request("process", { operationId });
  }
  if (!state.ready && state.job?.status === "queued") await request("process", { operationId });
  const began = now();
  do {
    state = await request("state", { operationId });
    if (state.ready) break;
    if (["failed", "partial"].includes(state.job?.status)) throw new Error(state.job.error || "Some photos need processing again. Resume this posting.");
    onProgress(`PROCESSING PHOTOS — ${state.job?.processedPhotoCount || 0}/${row.files.length} READY`);
    if (now() - began > 180000) throw new Error("Photos are still processing on the server. Resume this posting to check progress; do not create another machine.");
    await sleep(1500);
  } while (!state.ready);
  onProgress("PREPARING LISTING HERO");
  // This is a bounded display derivative, never the full original photo set.
  const hero = state.manifest.media.find(item => item.mediaId === state.manifest.heroMediaId)?.hero?.url;
  if (!hero) throw new Error("The saved media manifest has no hero image.");
  let heroImageId = state.row?.heroImageId || cached.heroImageId;
  if (!heroImageId) {
    const response = await fetch(hero, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error("The saved hero image could not be read.");
    const blob = await response.blob();
    if (!blob.size || blob.size > 8 * 1024 * 1024) throw new Error("The compatibility hero exceeds its delivery budget.");
    let pending = pendingHeroes.get(storageKey);
    if (!pending) {
      const file = await compatibilityHero(blob);
      pending = sdk.images.upload({ image: file }, { expand: true }).then(async result => {
        const id = result?.data?.data?.id?.uuid;
        if (!id) throw new Error("Sharetribe did not confirm the compatibility hero.");
        cached.heroImageId = id;
        await filesStore(storageKey, cached);
        return id;
      }).catch(error => { pendingHeroes.delete(storageKey); throw error; });
      pendingHeroes.set(storageKey, pending);
    }
    let timer;
    try {
      heroImageId = await Promise.race([pending, new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("Sharetribe's hero receipt is still pending. Resume this posting; your originals are already saved.")), 120000);
      })]);
    } finally { clearTimeout(timer); }
    if (!heroImageId) throw new Error("Sharetribe did not confirm the compatibility hero.");
    cached.heroImageId = heroImageId;
    await filesStore(storageKey, cached);
  }
  onProgress("VERIFYING SAVED MACHINE AND PHOTOS");
  const finished = await request("finalize", { operationId, heroImageId });
  pendingHeroes.delete(storageKey);
  await filesStore(storageKey, null).catch(() => {});
  return { ...finished.row, listingState: finished.listingState };
}
