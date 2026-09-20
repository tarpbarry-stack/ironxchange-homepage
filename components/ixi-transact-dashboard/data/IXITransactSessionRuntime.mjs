import { buildIXITransactFastEnvironment } from "./IXITransactFastBootstrap.mjs";

const abortError = () => Object.assign(new Error("TRAN$ACT request is no longer active."), { name: "AbortError" });
const stableKey = value => JSON.stringify(value, (_key, item) => item && typeof item === "object" && !Array.isArray(item)
  ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);

function consume(promise, signal) {
  if (!signal) return promise;
  if (signal.aborted) { promise.catch(() => {}); return Promise.reject(abortError()); }
  return new Promise((resolve, reject) => {
    const cancel = () => { signal.removeEventListener("abort", cancel); reject(abortError()); };
    signal.addEventListener("abort", cancel, { once: true });
    promise.then(value => { signal.removeEventListener("abort", cancel); resolve(value); }, error => {
      signal.removeEventListener("abort", cancel); reject(error);
    });
  });
}

// One instance belongs to one mounted TRAN$ACT layout. Nothing is stored in
// browser storage or shared across SSR requests, users, or application visits.
export function createIXITransactSessionRuntime({ readAccess, readDashboard, readOperatingEnvironment, readOperatingPresentations, onChange = () => {}, now = Date.now }) {
  const controller = new AbortController();
  const dashboards = new Map();
  let disposed = false;
  let access = null;
  let accessAt = 0;
  let accessPending = null;
  let scope = "";
  let generation = 0;
  let financialRevision = 0;
  let operatingRevision = 0;
  let operating = null;
  const notify = error => { if (!disposed) onChange({ access, generation, error: error || null }); };

  function invalidateFinancial() { financialRevision += 1; dashboards.clear(); }

  function invalidateOperatingEnvironment() { operatingRevision += 1; operating = null; }

  function rejectSession(error) {
    access = null; scope = ""; accessAt = 0; generation += 1;
    invalidateFinancial(); invalidateOperatingEnvironment(); notify(error);
  }

  function loadAccess({ signal, force = false } = {}) {
    if (disposed) return Promise.reject(abortError());
    if (!accessPending && !force && access && now() - accessAt < 60_000) return consume(Promise.resolve(access), signal);
    if (!accessPending) {
      const request = Promise.resolve().then(async () => {
        try {
          let payload;
          try { payload = await readAccess({ signal: controller.signal }); }
          catch (error) {
            if (error?.status !== 401 || controller.signal.aborted) throw error;
            payload = await readAccess({ signal: controller.signal });
          }
          if (disposed) throw abortError();
          if (!buildIXITransactFastEnvironment(payload)) {
            throw Object.assign(new Error("TRAN$ACT could not verify your operating company."), { status: 403 });
          }
          const data = payload.data;
          const nextScope = stableKey({ actor: data.actor, entities: data.entities, defaults: data.defaults,
            entity: data.operatingContext?.entity, permissions: data.permissions,
            denied: data.deniedPermissions, capabilities: data.capabilities });
          if (nextScope !== scope) {
            if (scope) invalidateOperatingEnvironment();
            generation += 1; invalidateFinancial();
          }
          scope = nextScope; access = payload; accessAt = now(); notify();
          return payload;
        } catch (error) {
          if (!disposed && error?.name !== "AbortError") {
            if (error?.status === 401 || error?.status === 403) rejectSession(error);
            else notify(error);
          }
          throw error;
        } finally { if (accessPending === request) accessPending = null; }
      });
      accessPending = request;
    }
    return consume(accessPending, signal);
  }

  function loadOperatingEnvironment({ signal, force = false } = {}) {
    if (disposed) return Promise.reject(abortError());
    if (force) invalidateOperatingEnvironment();
    if (!operating) {
      const revision = operatingRevision;
      const entry = {};
      operating = entry;
      // Both trusted reads start together. No directory data is published until
      // Financial access and the canonical company agree.
      entry.pending = Promise.all([
        loadAccess(),
        Promise.resolve().then(() => readOperatingEnvironment({ signal: controller.signal }))
      ]).then(([authorized, environment]) => {
        if (disposed || revision !== operatingRevision) throw abortError();
        const entity = authorized.data.operatingContext.entity;
        if (!environment?.isAuthenticated || environment.entity?.entityId !== entity.entityId ||
            (environment.entity?.passportId && environment.entity.passportId !== entity.passportId)) {
          throw Object.assign(new Error("The directory does not match the authorized company."), { status: 403 });
        }
        return environment;
      }).catch(error => {
        if (operating === entry) operating = null;
        if (!disposed && revision === operatingRevision && [401, 403].includes(error?.status)) rejectSession(error);
        throw error;
      });
    }
    const entry = operating;
    return consume(entry.pending, signal).then(environment => {
      if (disposed || entry !== operating) throw abortError();
      return environment;
    });
  }

  async function loadOperatingPresentations({ signal } = {}) {
    const revision = operatingRevision;
    const environment = await loadOperatingEnvironment({ signal });
    const entry = operating;
    if (!entry || revision !== operatingRevision) throw abortError();
    if (!entry.presentations) entry.presentations = Promise.resolve().then(() =>
      readOperatingPresentations({ userId: environment.userId, signal: controller.signal })
    ).catch(error => { entry.presentations = null; throw error; });
    const listings = await consume(entry.presentations, signal);
    if (disposed || revision !== operatingRevision || entry !== operating) throw abortError();
    return listings;
  }

  async function loadDashboard({ query, signal } = {}) {
    const initialGeneration = generation;
    await loadAccess({ signal });
    if (disposed || signal?.aborted || (initialGeneration && initialGeneration !== generation)) throw abortError();
    const data = access.data;
    const allowedEntities = new Set([data.defaults?.entityPassportId, data.operatingContext?.entity?.passportId,
      ...(data.entities || []).map(entity => entity.passportId)].filter(Boolean));
    if ((query?.scope?.entityPassportIds || []).some(id => !allowedEntities.has(id))) throw abortError();
    const requestGeneration = generation;
    const revision = financialRevision;
    const key = stableKey(query || {});
    let entry = dashboards.get(key);
    if (!entry || (!entry.pending && now() - entry.at >= 30_000)) {
      entry = { at: 0, pending: null, value: null };
      dashboards.set(key, entry);
      const current = entry;
      current.pending = Promise.resolve().then(() => readDashboard({ query, signal: controller.signal })).then(value => {
        if (disposed || requestGeneration !== generation || revision !== financialRevision) throw abortError();
        current.value = value; current.at = now(); current.pending = null;
        if (dashboards.size > 32) dashboards.delete(dashboards.keys().next().value);
        return value;
      }).catch(error => {
        if (dashboards.get(key) === current) dashboards.delete(key);
        if (!disposed && requestGeneration === generation && (error?.status === 401 || error?.status === 403)) rejectSession(error);
        throw error;
      });
    }
    const value = await consume(entry.pending || Promise.resolve(entry.value), signal);
    if (disposed || requestGeneration !== generation || revision !== financialRevision) throw abortError();
    return value;
  }

  return { loadAccess, loadDashboard, loadOperatingEnvironment, loadOperatingPresentations, invalidateOperatingEnvironment, invalidateFinancial, dispose() {
    disposed = true; access = null; scope = ""; generation += 1;
    invalidateFinancial(); invalidateOperatingEnvironment(); controller.abort();
  } };
}
