// Memory belongs to one verified actor/entity/permission scope. No localStorage,
// attachments or mutations. A confirmed write invalidates the entire generation.
export function createIXITransactRecordCache({
  read,
  now = Date.now,
  limit = 16,
  concurrency = 2,
  ttl = 30000,
}) {
  const entries = new Map();
  const jobs = new Map();
  let queue = [],
    running = 0,
    generation = 0;
  const abort = () =>
    Object.assign(new Error("Record request cancelled"), {
      name: "AbortError",
    });
  function peek(id) {
    const entry = entries.get(id);
    if (!entry || now() - entry.at >= ttl) {
      entries.delete(id);
      return null;
    }
    entries.delete(id);
    entries.set(id, entry);
    return entry.record;
  }
  function pump() {
    while (running < concurrency && queue.length) {
      const job = queue.shift();
      if (job.controller.signal.aborted) continue;
      running++;
      job.started = true;
      Promise.resolve()
        .then(() =>
          read({ financialDocumentId: job.id, signal: job.controller.signal }),
        )
        .then((record) => {
          if (job.generation !== generation || job.controller.signal.aborted)
            throw abort();
          const stored = record?.record || record;
          if (
            stored?.financialDocument?.financialDocumentId !== job.id ||
            !Number.isInteger(stored?.server?.revision) ||
            stored.server.revision < 1
          )
            throw new Error(
              "The selected saved record could not be verified. Retry from history.",
            );
          entries.delete(job.id);
          entries.set(job.id, { record, at: now() });
          while (entries.size > limit)
            entries.delete(entries.keys().next().value);
          job.resolve(record);
        })
        .catch(job.reject)
        .finally(() => {
          running--;
          if (jobs.get(job.id) === job) jobs.delete(job.id);
          pump();
        });
    }
  }
  function load(id, { foreground = true } = {}) {
    if (!id)
      return Promise.reject(new Error("A saved record number is required."));
    const prepared = peek(id);
    if (prepared) return Promise.resolve(prepared);
    let job = jobs.get(id);
    if (job) {
      if (foreground) {
        job.foreground = true;
        queue = queue.filter((item) => item !== job);
        if (!job.started) queue.unshift(job);
      }
      return job.promise;
    }
    job = {
      id,
      foreground,
      generation,
      controller: new AbortController(),
      started: false,
    };
    job.promise = new Promise((resolve, reject) => {
      job.resolve = resolve;
      job.reject = reject;
    });
    jobs.set(id, job);
    if (foreground) queue.unshift(job);
    else queue.push(job);
    pump();
    return job.promise;
  }
  function cancelPrefetch() {
    for (const job of jobs.values())
      if (!job.foreground) {
        job.controller.abort();
        job.reject(abort());
        jobs.delete(job.id);
      }
    queue = queue.filter((job) => !job.controller.signal.aborted);
  }
  function invalidate() {
    generation++;
    entries.clear();
    for (const job of jobs.values()) {
      job.controller.abort();
      job.reject(abort());
    }
    jobs.clear();
    queue = [];
  }
  return {
    peek,
    load,
    cancelPrefetch,
    invalidate,
    reconcile(records) {
      for (const raw of records) {
        const record = raw?.record || raw;
        const id = record?.financialDocument?.financialDocumentId;
        const current = entries.get(id)?.record;
        if (
          current &&
          (current.record || current).server.revision !==
            record.server?.revision
        ) {
          invalidate();
          break;
        }
      }
    },
    prefetch(ids) {
      cancelPrefetch();
      [...new Set(ids)].slice(0, limit).forEach((id) => {
        load(id, { foreground: false }).catch(() => {});
      });
    },
    stats: () => ({
      prepared: entries.size,
      queued: queue.length,
      running,
      generation,
    }),
  };
}
