import { useEffect, useState } from "react";

// Device layout only. No financial documents or Object relationships are stored.
export function useIXITransactAppOrder({ entityPassportId, actorPassportId, kind }) {
  const key = entityPassportId && actorPassportId && kind
    ? `ixi:transact:app-order:v1:${entityPassportId}:${actorPassportId}:${kind}` : "";
  const [saved, setSaved] = useState({ key: "", order: [] });
  const [error, setError] = useState("");
  useEffect(() => {
    setError("");
    if (!key) return;
    try {
      const order = JSON.parse(window.localStorage.getItem(key) || "[]");
      setSaved({ key, order: Array.isArray(order) ? order.filter(value => typeof value === "string") : [] });
    } catch { setSaved({ key, order: [] }); }
  }, [key]);
  function save(order) {
    setSaved({ key, order });
    try {
      if (!key) throw new Error("No user scope");
      window.localStorage.setItem(key, JSON.stringify(order));
      setError("");
    } catch { setError("This arrangement is available for this session but could not be saved on this device."); }
  }
  return { order: saved.key === key ? saved.order : [], save, error };
}
