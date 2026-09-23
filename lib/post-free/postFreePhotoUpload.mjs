// Cache belongs to one authenticated POST FREE page. Keep resolved and pending
// uploads so retrying a batch never resends an already accepted photo.
export async function uploadPostFreePhotos({
  sdk, files, cache, onProgress = () => {}, timeoutMs = 120000
}) {
  const results = new Array(files.length);
  const loaded = new Array(files.length).fill(0);
  let cursor = 0;
  let completed = 0;
  let failure;
  let active = true;
  const report = () => {
    if (active) onProgress({ completed, total: files.length,
      loaded: loaded.reduce((sum, bytes) => sum + bytes, 0),
      bytes: files.reduce((sum, file) => sum + file.size, 0) });
  };
  const worker = async () => {
    while (!failure && cursor < files.length) {
      const index = cursor++;
      const file = files[index];
      let entry = cache.get(file);
      if (!entry) {
        entry = { loaded: 0, listeners: new Set() };
        cache.set(file, entry);
        entry.promise = Promise.resolve().then(() => sdk.images.upload(
          { image: file }, { expand: true }, {
            onUploadProgress: event => {
              entry.loaded = Math.min(file.size, event.loaded || 0);
              for (const listener of entry.listeners) listener();
            }
          }
        )).then(response => {
          const id = response?.data?.data?.id;
          if (!id?.uuid) throw new Error("Photo upload returned no image ID.");
          entry.loaded = file.size;
          return id;
        }).catch(error => {
          cache.delete(file);
          throw error;
        });
      }
      const progress = () => { loaded[index] = entry.loaded; report(); };
      entry.listeners.add(progress);
      progress();
      let timer;
      try {
        // The SDK does not expose cancellation. Retain the pending promise on
        // timeout: a retry waits for it rather than starting a duplicate upload.
        results[index] = await Promise.race([
          entry.promise,
          new Promise((_, reject) => {
            timer = setTimeout(() => {
              const error = new Error("Photo upload is taking too long. Keep this page open and retry to reuse uploaded photos.");
              error.code = "POST_FREE_PHOTO_UPLOAD_TIMEOUT";
              reject(error);
            }, timeoutMs);
          })
        ]);
        loaded[index] = file.size;
        completed++;
        report();
      } catch (error) {
        failure ||= error;
      } finally {
        clearTimeout(timer);
        entry.listeners.delete(progress);
      }
    }
  };
  report();
  await Promise.all(Array.from({ length: Math.min(2, files.length) }, worker));
  active = false;
  if (failure) throw failure;
  return results;
}
