import { useEffect, useRef, useState } from "react";
import IXITransactSortableLauncher from "../ixi-aos/transact/IXITransactSortableLauncher";
import { reconcileIXITransactModuleOrder } from "../ixi-aos/transact/IXITransactModuleOrder";
import { mergeVisibleAppOrder } from "./IXITransactAppDirectoryModel.mjs";
import styles from "./IXITransactAppDirectory.module.css";

export default function IXITransactAppDirectory({ modules, activeModuleId, onOpen, onHistory, historyActive, preferenceKey }) {
  const [category, setCategory] = useState("");
  const [savedOrder, setSavedOrder] = useState([]);
  const [notice, setNotice] = useState("");
  const scroll = useRef(null);
  useEffect(() => {
    try {
      const stored = preferenceKey ? JSON.parse(window.localStorage.getItem(preferenceKey) || "[]") : [];
      setSavedOrder(Array.isArray(stored) ? stored : []);
    } catch { setSavedOrder([]); }
  }, [preferenceKey]);
  const categories = [...new Set(modules.map(module => module.group))];
  const selectedCategory = categories.includes(category) ? category : "";
  const visible = modules.filter(module => !selectedCategory || module.group === selectedCategory);
  const order = reconcileIXITransactModuleOrder(savedOrder, modules.map(module => module.id));

  function saveOrder(nextVisibleOrder) {
    const next = mergeVisibleAppOrder(order, nextVisibleOrder);
    setSavedOrder(next);
    setNotice("");
    if (!preferenceKey) return;
    try { window.localStorage.setItem(preferenceKey, JSON.stringify(next)); }
    catch { setNotice("Tile order kept for this visit. Browser storage is unavailable."); }
  }

  return <section className={styles.directory} aria-label="TRAN$ACT applications">
    <button type="button" className={styles.history} data-active={historyActive} onClick={onHistory}>TRANSACTION HISTORY</button>
    <header className={styles.controls}>
      <strong aria-label={`${visible.length} apps`}>{visible.length}</strong>
      <select aria-label="App category" value={selectedCategory} onChange={event => {
        setCategory(event.target.value);
        if (scroll.current) scroll.current.scrollTop = 0;
      }}>
        <option value="">ALL</option>
        {categories.map(group => <option key={group} value={group}>{group.toUpperCase()}</option>)}
      </select>
    </header>
    <div className={styles.scroll} ref={scroll}>
      <IXITransactSortableLauncher modules={visible} moduleOrder={order} onOpen={module => onOpen(module.id)} onOrderChange={saveOrder} variant="sidebar" activeModuleId={activeModuleId} />
      {!visible.length ? <p>No apps available for this object.</p> : null}
    </div>
    {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
  </section>;
}
