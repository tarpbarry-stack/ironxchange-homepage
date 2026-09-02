import { useEffect, useMemo, useRef, useState } from "react";

import {
  IXI_TICKET_EXECUTION_CLASSES,
  IXI_TICKET_PRIORITIES,
  IXI_TICKET_STATUS,
  IXI_TICKET_TYPES,
  createEditSection,
  isOriginalRequestLocked
} from "../../lib/ixi-tickets/IXITicketContract";
import {
  ensureRemoteDraft,
  getTicketApiInfo,
  setRemoteTicketReady
} from "../../lib/ixi-tickets/ixiTicketClient";
import styles from "./IXITicketWorksheet.module.css";

function upper(value) {
  return String(value || "").replace(/-/g, " ").toUpperCase();
}

function fieldLabel(label, children) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function canonicalTicket(local, remote, syncState) {
  return {
    ...local,
    ...(remote || {}),
    syncState
  };
}

export default function IXITicketWorksheet({
  ticket,
  mode = "floating",
  onModeChange,
  onSave,
  onClose,
  onPopOut,
  standalone = false
}) {
  const [draft, setDraft] = useState(ticket);
  const [notice, setNotice] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [position, setPosition] = useState({ x: 42, y: 82 });
  const dragRef = useRef(null);
  const lastAutosaveFingerprint = useRef("");

  useEffect(() => setDraft(ticket), [ticket]);

  useEffect(() => {
    if (!draft?.ticketId) return;

    const fingerprint = JSON.stringify({
      ...draft,
      audit: {
        ...(draft.audit || {}),
        updatedAt: ""
      }
    });

    if (fingerprint === lastAutosaveFingerprint.current) return;
    lastAutosaveFingerprint.current = fingerprint;

    const timer = window.setTimeout(() => onSave?.(draft), 350);
    return () => window.clearTimeout(timer);
  }, [draft, onSave]);

  useEffect(() => {
    if (mode !== "floating" || standalone) return undefined;

    function move(event) {
      if (!dragRef.current) return;
      const { startX, startY, originX, originY } = dragRef.current;
      setPosition({
        x: Math.max(8, originX + event.clientX - startX),
        y: Math.max(8, originY + event.clientY - startY)
      });
    }

    function up() {
      dragRef.current = null;
      document.body.style.userSelect = "";
    }

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [mode, standalone]);

  const locked = isOriginalRequestLocked(draft);
  const apiInfo = useMemo(() => getTicketApiInfo(), []);

  function patch(patchValue) {
    setDraft(current => ({
      ...current,
      ...patchValue,
      audit: {
        ...(current.audit || {}),
        updatedAt: new Date().toISOString()
      }
    }));
  }

  function patchEdit(editId, description) {
    patch({
      editSections: draft.editSections.map(edit =>
        edit.editId === editId ? { ...edit, description } : edit
      )
    });
  }

  function addEdit() {
    patch({ editSections: [...draft.editSections, createEditSection()] });
  }

  function removeEdit(editId) {
    if (draft.editSections.length <= 1) return;
    patch({ editSections: draft.editSections.filter(edit => edit.editId !== editId) });
  }

  function attachFiles(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const metadata = files.map(file => ({
      attachmentId: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: file.name,
      contentType: file.type,
      type: file.type,
      size: file.size,
      state: "local-metadata-only"
    }));

    patch({ attachments: [...(draft.attachments || []), ...metadata] });
    setNotice("Attachment metadata captured. Binary upload remains disabled until the Ticket attachment endpoint is available.");
    event.target.value = "";
  }

  function validateReady() {
    const request = String(draft.originalRequest || "").trim();
    const edits = (draft.editSections || []).filter(edit => String(edit.description || "").trim());

    if (!request && !edits.length) {
      setNotice("Describe what is wrong before making this ticket READY FOR CHAT.");
      return null;
    }

    return {
      ...draft,
      originalRequest: request || edits[0]?.description || ""
    };
  }

  async function syncDraft() {
    if (!draft?.ticketId || syncing) return;
    if (!apiInfo.configured) {
      setNotice("IXI Ticket API is disabled. Draft remains preserved locally.");
      return;
    }

    setSyncing(true);
    setNotice("");

    try {
      onSave?.(draft);
      const remote = await ensureRemoteDraft({ ...draft, status: IXI_TICKET_STATUS.DRAFT });
      if (!remote?.ticketId) throw new Error("IXI Ticket API did not return a canonical Ticket.");
      const saved = canonicalTicket(draft, remote, "aws-synced");
      onSave?.(saved);
      setDraft(saved);
      setNotice("Draft synchronized to IXI Ticket Command.");
    } catch (error) {
      setNotice(`${error.message} Local draft was preserved.`);
    } finally {
      setSyncing(false);
    }
  }

  async function markReady() {
    const readyDraft = validateReady();
    if (!readyDraft || syncing) return;

    if (!apiInfo.configured) {
      const localReady = canonicalTicket(readyDraft, {
        status: IXI_TICKET_STATUS.READY_FOR_CHAT
      }, "awaiting-backend");
      onSave?.(localReady);
      setDraft(localReady);
      setNotice("Ticket marked READY FOR CHAT locally; IXI Ticket API is disabled.");
      return;
    }

    setSyncing(true);
    setNotice("");

    try {
      onSave?.(readyDraft);
      const remote = await setRemoteTicketReady(readyDraft);
      if (!remote?.ticketId) throw new Error("IXI Ticket API did not return a canonical READY ticket.");
      const saved = canonicalTicket(readyDraft, remote, "aws-synced");
      onSave?.(saved);
      setDraft(saved);
      setNotice("READY FOR CHAT — stored in AWS and visible to Ticket Command.");
    } catch (error) {
      setNotice(`${error.message} Ticket remains safely preserved as a local draft.`);
    } finally {
      setSyncing(false);
    }
  }

  function beginDrag(event) {
    if (mode !== "floating" || standalone || event.button !== 0) return;
    if (event.target.closest("button, input, textarea, select, a")) return;

    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y
    };
    document.body.style.userSelect = "none";
  }

  const shellClass = standalone
    ? `${styles.shell} ${styles.standalone}`
    : mode === "docked"
      ? `${styles.shell} ${styles.docked}`
      : `${styles.shell} ${styles.floating}`;

  const shellStyle = !standalone && mode === "floating"
    ? { left: position.x, top: position.y }
    : undefined;

  return (
    <section className={shellClass} style={shellStyle} aria-label="IXI Chat Ticket worksheet">
      <header className={styles.header} onMouseDown={beginDrag}>
        <div>
          <div className={styles.eyebrow}>IXI CHAT TICKET</div>
          <div className={styles.ticketNumber}>{draft.displayNumber}</div>
        </div>

        <div className={styles.headerActions}>
          {!standalone ? (
            <>
              <button type="button" onClick={() => onModeChange?.(mode === "docked" ? "floating" : "docked")}>
                {mode === "docked" ? "FLOAT" : "DOCK"}
              </button>
              <button type="button" onClick={onPopOut}>POP OUT ↗</button>
            </>
          ) : null}
          <button type="button" onClick={onClose} aria-label="Close ticket">×</button>
        </div>
      </header>

      <div className={styles.statusBar}>
        <span className={`${styles.statusDot} ${styles[draft.status] || ""}`} />
        <strong>{upper(draft.status)}</strong>
        <span>{upper(draft.syncState)}</span>
      </div>

      <div className={styles.body}>
        <div className={styles.contextStrip}>
          <div><span>PAGE</span><strong>{draft.context?.route || "—"}</strong></div>
          <div><span>ENV</span><strong>{upper(draft.context?.environment || "unknown")}</strong></div>
          <div><span>OBJECT</span><strong>{draft.context?.passportId || draft.context?.objectId || "PAGE CONTEXT"}</strong></div>
        </div>

        <div className={styles.grid3}>
          {fieldLabel("REPOSITORY", (
            <select value={draft.repository} onChange={event => patch({ repository: event.target.value })} disabled={locked}>
              <option value="ironxchange-homepage">ironxchange-homepage</option>
              <option value="ixi-core">ixi-core</option>
              <option value="other">other / route later</option>
            </select>
          ))}
          {fieldLabel("TYPE", (
            <select value={draft.type} onChange={event => patch({ type: event.target.value })} disabled={locked}>
              {IXI_TICKET_TYPES.map(value => <option key={value} value={value}>{upper(value)}</option>)}
            </select>
          ))}
          {fieldLabel("PRIORITY", (
            <select value={draft.priority} onChange={event => patch({ priority: event.target.value })} disabled={locked}>
              {IXI_TICKET_PRIORITIES.map(value => <option key={value} value={value}>{upper(value)}</option>)}
            </select>
          ))}
        </div>

        {fieldLabel("EXECUTION", (
          <select value={draft.executionClass} onChange={event => patch({ executionClass: event.target.value })} disabled={locked}>
            {IXI_TICKET_EXECUTION_CLASSES.map(value => <option key={value} value={value}>{upper(value)}</option>)}
          </select>
        ))}

        {fieldLabel("TITLE", (
          <input
            value={draft.headline}
            onChange={event => patch({ headline: event.target.value })}
            placeholder="Short name for this work"
            disabled={locked}
          />
        ))}

        <label className={`${styles.field} ${styles.requestField}`}>
          <span>WHAT'S WRONG?</span>
          <textarea
            value={draft.originalRequest}
            onChange={event => patch({ originalRequest: event.target.value })}
            placeholder="Tell Chat exactly what is wrong. This freezes when the ticket becomes READY FOR CHAT."
            disabled={locked}
          />
        </label>

        <div className={styles.editStack}>
          {(draft.editSections || []).map((edit, index) => (
            <div className={styles.editSection} key={edit.editId}>
              <div className={styles.editHeader}>
                <span>EDIT {String(index + 1).padStart(2, "0")}</span>
                {!locked && draft.editSections.length > 1 ? (
                  <button type="button" onClick={() => removeEdit(edit.editId)}>REMOVE</button>
                ) : null}
              </div>
              <textarea
                value={edit.description}
                onChange={event => patchEdit(edit.editId, event.target.value)}
                placeholder="Another change on this same page / object / workflow..."
                disabled={locked}
              />
            </div>
          ))}
        </div>

        {!locked ? (
          <button className={styles.addEdit} type="button" onClick={addEdit}>+ ADD ANOTHER EDIT</button>
        ) : null}

        <div className={styles.attachmentRow}>
          <label className={styles.attachButton}>
            + SCREENSHOT / ATTACH
            <input type="file" multiple accept="image/*,.txt,.md,.pdf" onChange={attachFiles} />
          </label>
          <span>{draft.attachments?.length || 0} attachment reference(s)</span>
        </div>

        {draft.attachments?.length ? (
          <div className={styles.attachmentList}>
            {draft.attachments.map(item => <span key={item.attachmentId}>{item.name}</span>)}
          </div>
        ) : null}

        <details className={styles.contextDetails}>
          <summary>CAPTURED CONTEXT</summary>
          <pre>{JSON.stringify(draft.context, null, 2)}</pre>
        </details>

        {notice ? <div className={styles.notice}>{notice}</div> : null}
      </div>

      <footer className={styles.footer}>
        <button type="button" className={styles.secondary} onClick={() => onSave?.(draft)}>SAVE LOCAL</button>
        {!locked ? <button type="button" className={styles.secondary} disabled={syncing} onClick={syncDraft}>{syncing ? "SYNCING..." : "SYNC AWS"}</button> : null}
        {!locked ? <button type="button" className={styles.readyButton} disabled={syncing} onClick={markReady}>READY FOR CHAT</button> : null}
      </footer>
    </section>
  );
}
