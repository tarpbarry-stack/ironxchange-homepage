import { timeIXITransactRead } from "./IXITransactReadPerformance.mjs";

// Memory belongs to one verified actor/entity/permission scope. No localStorage,
// attachments or mutations. Writes invalidate affected IDs; scope changes clear all.
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
          timeIXITransactRead("record", () => read({ financialDocumentId: job.id, signal: job.controller.signal })),
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
          if (stored.server.revision < (job.minimumRevision || 0))
            throw new Error("This transaction changed while it was loading. Retry to open its current revision.");
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
  function prioritize(job) {
    job.foreground = true;
    if (job.started) return;
    queue = queue.filter(item => item !== job);
    queue.unshift(job);
    if (running >= concurrency) {
      const background = [...jobs.values()].find(item => item.started && !item.foreground && !item.controller.signal.aborted);
      if (background) {
        background.controller.abort();
        background.reject(abort());
        jobs.delete(background.id);
      }
    }
    pump();
  }
  function load(id, { foreground = true } = {}) {
    if (!id)
      return Promise.reject(new Error("A saved record number is required."));
    const prepared = peek(id);
    if (prepared) return Promise.resolve(prepared);
    let job = jobs.get(id);
    if (job) {
      if (foreground) prioritize(job);
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
    if (foreground) prioritize(job);
    else queue.push(job);
    pump();
    return job.promise;
  }
  function cancelPrefetch(keep = new Set()) {
    for (const job of jobs.values())
      if (!job.foreground && !keep.has(job.id)) {
        job.controller.abort();
        job.reject(abort());
        jobs.delete(job.id);
      }
    queue = queue.filter((job) => !job.controller.signal.aborted);
  }
  function invalidate(ids) {
    if (ids === undefined) generation++;
    const affected = ids === undefined ? new Set([...entries.keys(), ...jobs.keys()]) : new Set(ids);
    for (const id of affected) {
      entries.delete(id);
      const job = jobs.get(id);
      if (!job) continue;
      job.controller.abort();
      job.reject(abort());
      jobs.delete(id);
    }
    queue = queue.filter(job => !job.controller.signal.aborted);
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
        const pending = jobs.get(id);
        if (pending && Number.isInteger(record.server?.revision))
          pending.minimumRevision = Math.max(pending.minimumRevision || 0, record.server.revision);
        if (
          current &&
          (current.record || current).server.revision !==
            record.server?.revision
        ) {
          invalidate([id]);
        }
      }
    },
    prefetch(ids) {
      const wanted = [...new Set(ids)].slice(0, limit);
      cancelPrefetch(new Set(wanted));
      wanted.forEach((id) => {
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
