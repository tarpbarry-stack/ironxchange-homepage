import { timeIXITransactRead } from "./IXITransactReadPerformance.mjs";

// One authenticated workspace owns this bounded, in-memory read cache.
// Invalidating keeps last-known rows for display, never for a new payment.
export function createIXITransactHistoryCache({ read, now = Date.now, ttl = 30000, limit = 12 }) {
  const entries = new Map();
  const listeners = new Map();
  const empty = Object.freeze({ records: null, loading: false, stale: true, error: "", at: 0 });
  const aborted = () => Object.assign(new Error("History request cancelled"), { name: "AbortError" });
  const notify = id => listeners.get(id)?.forEach(listener => listener());
  function entryFor(id) {
    let entry = entries.get(id);
    if (!entry) entry = { snapshot: empty, job: null };
    entries.delete(id);
    entries.set(id, entry);
    while (entries.size > limit) {
      const oldest = [...entries.keys()].find(key => key !== id && !listeners.get(key)?.size);
      if (!oldest) break;
      entries.get(oldest).job?.controller.abort();
      entries.delete(oldest);
    }
    return entry;
  }
  function load(id) {
    if (!id) return Promise.reject(new Error("A Passport is required."));
    const entry = entryFor(id);
    if (entry.job) return entry.job.promise;
    const current = entry.snapshot;
    if (current.records && !current.stale && now() - current.at < ttl) return Promise.resolve(current.records);
    const job = { controller: new AbortController() };
    entry.job = job;
    entry.snapshot = { ...current, loading: true, stale: true, error: "" };
    job.promise = Promise.resolve().then(() => timeIXITransactRead("history", () => read({ passportId: id, signal: job.controller.signal })))
      .then(records => {
        if (job.controller.signal.aborted || entry.job !== job) throw aborted();
        if (!Array.isArray(records)) throw new Error("Transaction history could not be verified.");
        entry.snapshot = { records, loading: false, stale: false, error: "", at: now() };
        return records;
      }).catch(error => {
        if (!job.controller.signal.aborted && entry.job === job) {
          entry.snapshot = { ...entry.snapshot, loading: false, stale: true, error: error?.message || "Transaction history could not be refreshed." };
        }
        throw error;
      }).finally(() => {
        if (entry.job === job) { entry.job = null; notify(id); }
      });
    notify(id);
    return job.promise;
  }
  return {
    peek: id => entries.get(id)?.snapshot || empty,
    load,
    subscribe(id, listener) {
      if (!listeners.has(id)) listeners.set(id, new Set());
      listeners.get(id).add(listener);
      return () => {
        listeners.get(id)?.delete(listener);
        if (!listeners.get(id)?.size) listeners.delete(id);
      };
    },
    invalidate(ids = [...entries.keys()]) {
      for (const id of new Set(ids)) {
        const entry = entries.get(id);
        if (!entry) continue;
        entry.job?.controller.abort();
        entry.job = null;
        entry.snapshot = { ...entry.snapshot, loading: false, stale: true, error: "" };
        notify(id);
      }
    },
    clear() {
      for (const entry of entries.values()) entry.job?.controller.abort();
      entries.clear();
    },
    stats: () => ({ retained: entries.size, pending: [...entries.values()].filter(entry => entry.job).length }),
  };
}
