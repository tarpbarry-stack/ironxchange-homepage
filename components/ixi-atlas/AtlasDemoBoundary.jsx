import { useCallback, useMemo, useState } from "react";
import { IXIMachineDemoProvider } from "../ixi-machine-card/IXIMachineDemoContext";
import styles from "./IXITechnicalAtlas.module.css";

export default function AtlasDemoBoundary({ children, onPracticeAction, onSaveMachineFacts }) {
  const [notice, setNotice] = useState("");
  const onAction = useCallback((action, detail = "") => {
    setNotice(`${action}: ${detail || "demonstration captured. Your records and messages are unchanged."}`);
    onPracticeAction?.(action, detail);
  }, [onPracticeAction]);
  const demo = useMemo(() => ({ onAction, saveMachineFacts: onSaveMachineFacts }), [onAction, onSaveMachineFacts]);
  return <IXIMachineDemoProvider value={demo}>
    <div data-ixi-atlas-demo onSubmitCapture={event => { event.preventDefault(); event.stopPropagation(); onAction("Save"); }}
      onClickCapture={event => {
        // Native photo buttons and editors live inside the card's links. Let
        // their own handlers run; intercept only navigation on the link itself.
        if (event.target.closest?.("a") && !event.target.closest?.("button,input,textarea,select")) { event.preventDefault(); event.stopPropagation(); onAction("Open machine"); }
      }}>
      <p className={styles.demoNotice} role="status" aria-live="polite">{notice || "PRACTICE MODE · Sample machine · Changes stay in this demonstration"}</p>
      {children}
    </div>
  </IXIMachineDemoProvider>;
}
