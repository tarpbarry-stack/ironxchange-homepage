import { useCallback, useMemo, useState } from "react";
import { IXIMachineDemoProvider } from "../ixi-machine-card/IXIMachineDemoContext";
import styles from "./IXITechnicalAtlas.module.css";

export default function AtlasDemoBoundary({ children }) {
  const [notice, setNotice] = useState("");
  const onAction = useCallback(action => setNotice(`${action}: demonstration captured. Your records and messages are unchanged.`), []);
  const demo = useMemo(() => ({ onAction }), [onAction]);
  return <IXIMachineDemoProvider value={demo}>
    <div data-ixi-atlas-demo onSubmitCapture={event => { event.preventDefault(); event.stopPropagation(); onAction("Save"); }}
      onClickCapture={event => {
        if (event.target.closest?.("a")) { event.preventDefault(); event.stopPropagation(); onAction("Open machine"); }
      }}>
      <p className={styles.demoNotice} role="status" aria-live="polite">{notice || "PRACTICE MODE · Sample machine · Changes stay in this demonstration"}</p>
      {children}
    </div>
  </IXIMachineDemoProvider>;
}
