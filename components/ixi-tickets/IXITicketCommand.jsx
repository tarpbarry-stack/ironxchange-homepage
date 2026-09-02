import { useEffect, useMemo, useState } from "react";

import { IXI_TICKET_STATUS } from "../../lib/ixi-tickets/IXITicketContract";
import { useIXITickets } from "./IXITicketProvider";
import styles from "./IXITicketCommand.module.css";

function upper(value) {
  return String(value || "").replace(/-/g, " ").toUpperCase();
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  } catch {
    return value;
  }
}

function nonEmpty(items) {
  return Array.isArray(items) ? items.filter(Boolean) : [];
}

function lines(value) {
  return String(value || "")
    .split("\n")
    .map(item => item.trim())
    .filter(Boolean);
}

function closeoutForm(ticket) {
  return {
    summary: ticket?.closeout?.summary || "",
    before: ticket?.closeout?.before || "",
    after: ticket?.closeout?.after || "",
    risks: ticket?.closeout?.risks || "",
    notes: ticket?.closeout?.notes || "",
    filesChanged: nonEmpty(ticket?.closeout?.filesChanged).join("\n"),
    tests: nonEmpty(ticket?.closeout?.tests).map(item => typeof item === "string" ? item : item?.label || JSON.stringify(item)).join("\n")
  };
}

export default function IXITicketCommand() {
  const {
    tickets,
    createTicket,
    openTicket,
    popOutTicket,
    submitCloseoutRemote,
    approveTicket,
    reopenTicketRemote,
    refreshRemoteTickets,
    remoteState
  } = useIXITickets();
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState("all");
  const [repository, setRepository] = useState("all");
  const [type, setType] = useState("all");
  const [priority, setPriority] = useState("all");
  const [search, setSearch] = useState("");
  const [verifyNote, setVerifyNote] = useState("");
  const [closeoutDraft, setCloseoutDraft] = useState(closeoutForm(null));
  const [actionNotice, setActionNotice] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return tickets.filter(ticket => {
      if (status !== "all" && ticket.status !== status) return false;
      if (repository !== "all" && ticket.repository !== repository) return false;
      if (type !== "all" && ticket.type !== type) return false;
      if (priority !== "all" && ticket.priority !== priority) return false;

      if (q) {
        const haystack = [
          ticket.displayNumber,
          ticket.headline,
          ticket.originalRequest,
          ticket.repository,
          ticket.context?.route,
          ticket.context?.passportId,
          ticket.context?.objectId,
          ...(ticket.editSections || []).map(edit => edit.description)
        ].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [tickets, status, repository, type, priority, search]);

  const selected = tickets.find(ticket => ticket.ticketId === selectedId)
    || filtered[0]
    || tickets[0]
    || null;

  useEffect(() => {
    setCloseoutDraft(closeoutForm(selected));
    setVerifyNote("");
    setActionNotice("");
  }, [selected?.ticketId, selected?.revision]);

  const counts = useMemo(() => ({
    ready: tickets.filter(ticket => ticket.status === IXI_TICKET_STATUS.READY_FOR_CHAT || ticket.status === IXI_TICKET_STATUS.REOPENED).length,
    working: tickets.filter(ticket => ticket.status === IXI_TICKET_STATUS.WORKING || ticket.status === IXI_TICKET_STATUS.PR_OPEN).length,
    verify: tickets.filter(ticket => ticket.status === IXI_TICKET_STATUS.READY_TO_VERIFY).length,
    high: tickets.filter(ticket => ticket.priority === "high" || ticket.priority === "critical").length
  }), [tickets]);

  function patchCloseout(field, value) {
    setCloseoutDraft(current => ({ ...current, [field]: value }));
  }

  async function submitCloseout() {
    if (!selected || actionBusy) return;
    if (!closeoutDraft.summary.trim()) {
      setActionNotice("Closeout summary is required before submission.");
      return;
    }

    setActionBusy(true);
    setActionNotice("");
    try {
      await submitCloseoutRemote(selected, {
        summary: closeoutDraft.summary.trim(),
        before: closeoutDraft.before.trim(),
        after: closeoutDraft.after.trim(),
        risks: closeoutDraft.risks.trim(),
        notes: closeoutDraft.notes.trim(),
        filesChanged: lines(closeoutDraft.filesChanged),
        tests: lines(closeoutDraft.tests),
        editResults: nonEmpty(selected.editSections).map(edit => ({
          editId: edit.editId,
          description: edit.description,
          result: edit.result || "completed",
          status: edit.status === "open" ? "completed" : edit.status
        })),
        prs: nonEmpty(selected.closeout?.prs)
      });
      setActionNotice("Engineering closeout stored in AWS and advanced for verification.");
      await refreshRemoteTickets();
    } catch (error) {
      setActionNotice(error.message || "Ticket closeout failed.");
    } finally {
      setActionBusy(false);
    }
  }

  async function approveAndClose() {
    if (!selected || actionBusy) return;
    setActionBusy(true);
    setActionNotice("");
    try {
      await approveTicket(selected, verifyNote.trim());
      setVerifyNote("");
      setActionNotice("Ticket approved and closed in IXI Ticket Command.");
      await refreshRemoteTickets();
    } catch (error) {
      setActionNotice(error.message || "Ticket approval failed.");
    } finally {
      setActionBusy(false);
    }
  }

  async function reopen() {
    if (!selected || actionBusy) return;
    setActionBusy(true);
    setActionNotice("");
    try {
      await reopenTicketRemote(
        selected,
        verifyNote.trim() || "Reopened from IXI Ticket Command."
      );
      setVerifyNote("");
      setActionNotice("Ticket reopened in IXI Ticket Command.");
      await refreshRemoteTickets();
    } catch (error) {
      setActionNotice(error.message || "Ticket reopen failed.");
    } finally {
      setActionBusy(false);
    }
  }

  return (
    <main className={styles.command}>
      <header className={styles.commandHeader}>
        <div>
          <div className={styles.eyebrow}>IXI ADMIN / ENGINEERING</div>
          <h1>IXI TICKET COMMAND</h1>
          <p>Capture · queue · work · closeout · audit · verify</p>
          <p>
            AWS: {upper(remoteState.status)}
            {remoteState.lastSyncedAt ? ` · ${formatDate(remoteState.lastSyncedAt)}` : ""}
          </p>
        </div>
        <div className={styles.headerButtons}>
          <button onClick={() => refreshRemoteTickets()} disabled={remoteState.status === "loading"}>
            {remoteState.status === "loading" ? "SYNCING..." : "REFRESH AWS"}
          </button>
          <button onClick={() => createTicket({ mode: "floating" })}>+ CHAT TICKET</button>
          <a href="/account">DASHBOARD</a>
        </div>
      </header>

      {remoteState.error ? <div className={styles.empty}>{remoteState.error}</div> : null}
      {actionNotice ? <div className={styles.empty}>{actionNotice}</div> : null}

      <section className={styles.scoreboard}>
        <button onClick={() => setStatus("ready-for-chat")}><span>READY FOR CHAT</span><strong>{counts.ready}</strong></button>
        <button onClick={() => setStatus("working")}><span>WORKING / PR</span><strong>{counts.working}</strong></button>
        <button onClick={() => setStatus("ready-to-verify")}><span>READY TO VERIFY</span><strong>{counts.verify}</strong></button>
        <button onClick={() => { setStatus("all"); setPriority("high"); }}><span>HIGH PRIORITY</span><strong>{counts.high}</strong></button>
      </section>

      <section className={styles.filters}>
        <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search ticket, request, object, page..." />
        <select value={status} onChange={event => setStatus(event.target.value)}>
          <option value="all">ALL STATUS</option>
          {Object.values(IXI_TICKET_STATUS).map(value => <option key={value} value={value}>{upper(value)}</option>)}
        </select>
        <select value={repository} onChange={event => setRepository(event.target.value)}>
          <option value="all">ALL REPOS</option>
          <option value="ironxchange-homepage">ironxchange-homepage</option>
          <option value="ixi-core">ixi-core</option>
          <option value="other">other</option>
        </select>
        <select value={type} onChange={event => setType(event.target.value)}>
          <option value="all">ALL TYPES</option>
          {Array.from(new Set(tickets.map(ticket => ticket.type))).filter(Boolean).map(value => <option key={value} value={value}>{upper(value)}</option>)}
        </select>
        <select value={priority} onChange={event => setPriority(event.target.value)}>
          <option value="all">ALL PRIORITY</option>
          <option value="critical">CRITICAL</option>
          <option value="high">HIGH</option>
          <option value="normal">NORMAL</option>
          <option value="low">LOW</option>
        </select>
      </section>

      <section className={styles.workspace}>
        <aside className={styles.queue}>
          <div className={styles.queueHeader}><span>{filtered.length} TICKETS</span><button onClick={() => { setStatus("all"); setRepository("all"); setType("all"); setPriority("all"); setSearch(""); }}>CLEAR FILTERS</button></div>
          <div className={styles.queueRows}>
            {filtered.map(ticket => (
              <button
                key={ticket.ticketId}
                className={`${styles.ticketRow} ${selected?.ticketId === ticket.ticketId ? styles.selected : ""}`}
                onClick={() => setSelectedId(ticket.ticketId)}
              >
                <div className={styles.rowTop}>
                  <strong>{ticket.displayNumber}</strong>
                  <span className={styles[ticket.status] || ""}>{upper(ticket.status)}</span>
                </div>
                <h3>{ticket.headline || ticket.originalRequest || ticket.editSections?.[0]?.description || "Untitled ticket"}</h3>
                <div className={styles.rowMeta}>
                  <span>{upper(ticket.type)}</span>
                  <span>{upper(ticket.priority)}</span>
                  <span>{ticket.repository}</span>
                </div>
                <small>{formatDate(ticket.audit?.updatedAt)}</small>
              </button>
            ))}
            {!filtered.length ? <div className={styles.empty}>No tickets match the current filters.</div> : null}
          </div>
        </aside>

        <article className={styles.detail}>
          {selected ? (
            <>
              <div className={styles.detailHeader}>
                <div>
                  <div className={styles.ticketIdLine}>{selected.displayNumber} · {upper(selected.status)}</div>
                  <h2>{selected.headline || "UNTITLED CHAT TICKET"}</h2>
                  <p>{selected.repository} · {upper(selected.type)} · {upper(selected.priority)} · {upper(selected.executionClass)}</p>
                  <p>REV {Number.isInteger(selected.revision) ? selected.revision : "LOCAL"} · {upper(selected.syncState)}</p>
                </div>
                <div className={styles.detailActions}>
                  <button onClick={() => openTicket(selected.ticketId, "floating")}>OPEN WORKSHEET</button>
                  <button onClick={() => popOutTicket(selected.ticketId)}>POP OUT ↗</button>
                </div>
              </div>

              <section className={styles.auditBlock}>
                <h4>ORIGINAL REQUEST</h4>
                <div className={styles.originalRequest}>{selected.originalRequest || "No primary request entered."}</div>
                <div className={styles.editResults}>
                  {(selected.editSections || []).map((edit, index) => (
                    <div key={edit.editId}><span>EDIT {String(index + 1).padStart(2, "0")}</span><p>{edit.description || "—"}</p></div>
                  ))}
                </div>
              </section>

              <section className={styles.auditBlock}>
                <h4>CAPTURED CONTEXT</h4>
                <div className={styles.contextGrid}>
                  <div><span>ROUTE</span><strong>{selected.context?.route || "—"}</strong></div>
                  <div><span>ENVIRONMENT</span><strong>{upper(selected.context?.environment || "unknown")}</strong></div>
                  <div><span>OBJECT</span><strong>{selected.context?.objectId || "—"}</strong></div>
                  <div><span>PASSPORT</span><strong>{selected.context?.passportId || "—"}</strong></div>
                  <div><span>TRAN$ACT</span><strong>{selected.context?.transactModule || "—"}</strong></div>
                  <div><span>FACE / SCALE</span><strong>{[selected.context?.face, selected.context?.scaleMode].filter(Boolean).join(" / ") || "—"}</strong></div>
                </div>
              </section>

              <section className={styles.auditBlock}>
                <div className={styles.blockHeading}>
                  <h4>ENGINEERING DELIVERY</h4>
                  <span>{upper(selected.github?.state || "github-disabled")}</span>
                </div>
                <div className={styles.githubLine}>
                  <strong>{selected.github?.issueNumber ? `ISSUE #${selected.github.issueNumber}` : "AWS IS SYSTEM OF RECORD"}</strong>
                  {selected.github?.issueUrl ? <a href={selected.github.issueUrl} target="_blank" rel="noreferrer">OPEN ISSUE ↗</a> : null}
                  {nonEmpty(selected.closeout?.prs).map((pr, index) => (
                    pr.url ? <a key={pr.url} href={pr.url} target="_blank" rel="noreferrer">PR {pr.number || index + 1} ↗</a> : null
                  ))}
                </div>
              </section>

              <section className={`${styles.auditBlock} ${styles.closeout}`}>
                <div className={styles.blockHeading}>
                  <h4>ENGINEERING CLOSEOUT</h4>
                  <span>{selected.status === IXI_TICKET_STATUS.READY_TO_VERIFY ? "SUBMITTED / AUDIT REQUIRED" : "REVISION-CONTROLLED AWS RECORD"}</span>
                </div>
                <div className={styles.closeoutEditor}>
                  <label><span>SUMMARY *</span><textarea value={closeoutDraft.summary} onChange={event => patchCloseout("summary", event.target.value)} placeholder="What was completed and why it is correct..." /></label>
                  <div className={styles.closeoutEditorGrid}>
                    <label><span>BEFORE</span><textarea value={closeoutDraft.before} onChange={event => patchCloseout("before", event.target.value)} placeholder="Original behavior / defect" /></label>
                    <label><span>AFTER</span><textarea value={closeoutDraft.after} onChange={event => patchCloseout("after", event.target.value)} placeholder="Verified resulting behavior" /></label>
                    <label><span>RISKS</span><textarea value={closeoutDraft.risks} onChange={event => patchCloseout("risks", event.target.value)} placeholder="Known risks or remaining constraints" /></label>
                    <label><span>NOTES</span><textarea value={closeoutDraft.notes} onChange={event => patchCloseout("notes", event.target.value)} placeholder="Deployment / operational notes" /></label>
                  </div>
                  <div className={styles.closeoutEditorGrid}>
                    <label><span>FILES CHANGED — ONE PER LINE</span><textarea value={closeoutDraft.filesChanged} onChange={event => patchCloseout("filesChanged", event.target.value)} /></label>
                    <label><span>TESTS — ONE PER LINE</span><textarea value={closeoutDraft.tests} onChange={event => patchCloseout("tests", event.target.value)} /></label>
                  </div>
                  <div className={styles.closeoutActions}>
                    <button disabled={actionBusy || !Number.isInteger(selected.revision) || selected.status === IXI_TICKET_STATUS.CLOSED} onClick={submitCloseout}>
                      {actionBusy ? "SUBMITTING..." : "SUBMIT CLOSEOUT TO AWS"}
                    </button>
                  </div>
                </div>

                <div className={styles.closeoutGrid}>
                  <div><span>STORED SUMMARY</span><p>{selected.closeout?.summary || "No closeout submitted yet."}</p></div>
                  <div><span>STORED BEFORE</span><p>{selected.closeout?.before || "—"}</p></div>
                  <div><span>STORED AFTER</span><p>{selected.closeout?.after || "—"}</p></div>
                  <div><span>STORED RISKS / NOTES</span><p>{[selected.closeout?.risks, selected.closeout?.notes].filter(Boolean).join("\n") || "—"}</p></div>
                </div>

                <div className={styles.deliveryLists}>
                  <div><h5>FILES CHANGED</h5>{nonEmpty(selected.closeout?.filesChanged).length ? nonEmpty(selected.closeout.filesChanged).map(item => <code key={item}>{item}</code>) : <span>—</span>}</div>
                  <div><h5>TESTS</h5>{nonEmpty(selected.closeout?.tests).length ? nonEmpty(selected.closeout.tests).map((item, index) => <span key={`${typeof item === "string" ? item : item.label}-${index}`}>✓ {typeof item === "string" ? item : item.label || JSON.stringify(item)}</span>) : <span>—</span>}</div>
                </div>
              </section>

              <section className={styles.verification}>
                <label>
                  <span>VERIFICATION NOTE</span>
                  <textarea value={verifyNote} onChange={event => setVerifyNote(event.target.value)} placeholder="What still needs work, or what you verified..." />
                </label>
                <div>
                  <button className={styles.reopenButton} disabled={actionBusy || !Number.isInteger(selected.revision)} onClick={reopen}>REOPEN TICKET</button>
                  <button className={styles.approveButton} disabled={actionBusy || !Number.isInteger(selected.revision) || selected.status !== IXI_TICKET_STATUS.READY_TO_VERIFY} onClick={approveAndClose}>APPROVE & CLOSE</button>
                </div>
              </section>

              {selected.verification?.notes?.length ? (
                <section className={styles.auditBlock}>
                  <h4>VERIFICATION HISTORY</h4>
                  {selected.verification.notes.map((note, index) => (
                    <div className={styles.historyLine} key={`${note.at}-${index}`}><strong>{upper(note.type)}</strong><span>{formatDate(note.at)}</span><p>{note.note}</p></div>
                  ))}
                </section>
              ) : null}
            </>
          ) : (
            <div className={styles.noSelection}>
              <h2>NO TICKETS YET</h2>
              <p>Create the first Chat Ticket from the header or here.</p>
              <button onClick={() => createTicket({ mode: "floating" })}>+ CHAT TICKET</button>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
