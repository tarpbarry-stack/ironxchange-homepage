import { useEffect, useRef } from "react";
import styles from "./IXITransactLegacyWorkspace.module.css";

export default function IXITransactWorkingTabs({
  tabs,
  activeId,
  onSelect,
  onHistory,
  onClose,
}) {
  const list = useRef(null);
  useEffect(() => {
    list.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeId]);
  function navigate(event) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const buttons = [...list.current.querySelectorAll('[role="tab"]')];
    const index = buttons.indexOf(event.target);
    if (index < 0) return;
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? buttons.length - 1
          : (index + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) %
            buttons.length;
    event.preventDefault();
    buttons[next].focus();
    buttons[next].click();
  }
  return (
    <div
      className={styles.tabs}
      role="tablist"
      aria-label="Open TRAN$ACT worksheets"
      ref={list}
      onKeyDown={navigate}
    >
      <button
        type="button"
        role="tab"
        id="transact-tab-history"
        aria-selected={!activeId}
        aria-controls="transact-history-panel"
        tabIndex={!activeId ? 0 : -1}
        onClick={onHistory}
      >
        TRANSACTION HISTORY
      </button>
      {tabs.map((tab) => (
        <div className={styles.tabPair} key={tab.id}>
          <button
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeId === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={activeId === tab.id ? 0 : -1}
            onClick={() => onSelect(tab)}
            title={`${tab.context.title} · ${tab.label}${tab.dirty ? " · Unfinished edits" : ""}`}
          >
            <strong>
              {tab.label}
              {tab.dirty ? " •" : ""}
            </strong>
            <small>{tab.context.title}</small>
          </button>
          <button
            type="button"
            className={styles.closeTab}
            aria-label={`Close ${tab.label}`}
            onClick={() => onClose(tab)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export function UnfinishedWorksheetDialog({
  tab,
  onCancel,
  onDiscard,
  onReturn,
}) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="unfinished-title"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <h2 id="unfinished-title">Keep your unfinished edits?</h2>
      <p>
        {tab.label} has unfinished changes. Return to its worksheet to save
        through the transaction’s normal controls.
      </p>
      <div className={styles.actions}>
        <button type="button" onClick={onReturn}>
          RETURN TO SAVE
        </button>
        <button type="button" onClick={onDiscard}>
          DISCARD & CLOSE
        </button>
        <button type="button" autoFocus onClick={onCancel}>
          CANCEL
        </button>
      </div>
    </dialog>
  );
}

export function WorksheetPanel({ tab, active, onDirty, children }) {
  const panel = useRef(null);
  const scroll = useRef(0);
  useEffect(() => {
    if (active && panel.current) panel.current.scrollTop = scroll.current;
  }, [active]);
  return (
    <section
      id={`panel-${tab.id}`}
      role="tabpanel"
      aria-labelledby={`tab-${tab.id}`}
      hidden={!active}
      className={styles.tabPanel}
      ref={panel}
      onScroll={(event) => {
        if (event.target === panel.current)
          scroll.current = event.currentTarget.scrollTop;
      }}
      onInputCapture={(event) => {
        if (
          event.target.matches(
            'input:not([type="search"]), textarea, select',
          ) &&
          !event.target.closest("[data-transact-read-only-controls]")
        )
          onDirty(tab.id);
      }}
    >
      {children}
    </section>
  );
}
