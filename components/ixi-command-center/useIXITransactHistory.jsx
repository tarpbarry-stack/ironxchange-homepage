import { useCallback, useEffect, useSyncExternalStore } from "react";

// Subscription follows the selected Passport; an old response can only update
// its own cached history. Recently visited rows render on the first frame.
export default function useIXITransactHistory({ cache, passportId, active, refreshKey }) {
  const subscribe = useCallback(listener => cache.subscribe(passportId, listener), [cache, passportId]);
  const snapshot = useCallback(() => cache.peek(passportId), [cache, passportId]);
  const state = useSyncExternalStore(subscribe, snapshot, snapshot);
  useEffect(() => {
    if (!active || !passportId) return undefined;
    const load = () => { cache.load(passportId).catch(() => {}); };
    load();
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, [cache, passportId, active, refreshKey]);
  return state;
}
