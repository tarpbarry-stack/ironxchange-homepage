// Browser Performance entries expose actual read latency for profiling.
// Keep only the latest measurement per operation; no record or actor IDs.
export async function timeIXITransactRead(kind, operation) {
  const clock = globalThis.performance;
  const started = clock?.now();
  try {
    return await operation();
  } finally {
    if (started !== undefined) {
      try {
        const name = `transact.${kind}.read`;
        clock.clearMeasures(name);
        clock.measure(name, { start: started, end: clock.now() });
      } catch {
        // Profiling support must never affect a financial read.
      }
    }
  }
}
