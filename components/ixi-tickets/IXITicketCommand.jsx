import { useEffect, useMemo, useState } from "react";

import { isIXITicketDeletable, IXI_TICKET_STATUS } from "../../lib/ixi-tickets/IXITicketContract";
import { startRemoteTicket } from "../../lib/ixi-tickets/ixiTicketClient";
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

function ticketLeaseExpired(ticket) {
  if (ticket?.status !== IXI_TICKET_STATUS.WORKING) return false;
  const expiresAt = Date.parse(ticket?.metadata?.execution?.leaseExpiresAt || "");
  return !Number.isFinite(expiresAt) || expiresAt <= Date.now();
}

function executionLabel(ticket) {
  const execution = ticket?.metadata?.execution || {};
  const parts = [];
  if (execution.agentId || execution.assignedTo) parts.push(upper(execution.agentId || execution.assignedTo));
  if (execution.runId) parts.push(execution.runId);
  if (execution.startedAt) parts.push(`STARTED ${formatDate(execution.startedAt)}`);
  if (execution.leaseExpiresAt) parts.push(`LEASE ${formatDate(execution.leaseExpiresAt)}`);
  return parts.join(" · ");
}

export default function IXITicketCommand() {
  const {
    tickets,
    createTicket,
    openTicket,
    popOutTicket,
    approveTicket,
    reopenTicketRemote,
    deleteTicket,
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
  const [userScore, setUserScore] = useState("");
  const [actionNotice, setActionNotice] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter(ticket => {
      if (status !== "all" && ticket.status !== status) return false;
      if (repository !== "all" && ticket.repository !== repository) return false;
      if (type !== "all" && ticket.type !== type) return false;
      if (priority !== "all" && ticket.priority !== priority) return false;
      if (!q) return true;

      const haystack = [
        ticket.displayNumber,
        ticket.headline,
        ticket.originalRequest,
        ticket.repository,
        ticket.context?.route,
        ticket.context?.passportId,
        ticket.context?.objectId,
        ticket.metadata?.execution?.agentId,
        ticket.metadata?.execution?.runId,
        ...(ticket.editSections || []).map(edit => edit.description)
      ].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [tickets, status, repository, type, priority, search]);

  const selected = tickets.find(ticket => ticket.ticketId === selectedId)
    || filtered[0]
    || tickets[0]
    || null;

  useEffect(() => {
    setVerifyNote(selected?.metadata?.userReview?.note || "");
    setUserScore(selected?.metadata?.userReview?.score ? String(selected.metadata.userReview.score) : "");
    setActionNotice("");
    setDeleteConfirmId("");
  }, [selected?.ticketId, selected?.revision]);

  const counts = useMemo(() => ({
    ready: tickets.filter(ticket => [IXI_TICKET_STATUS.READY_FOR_CHAT, IXI_TICKET_STATUS.REOPENED].includes(ticket.status)).length,
    working: tickets.filter(ticket => [IXI_TICKET_STATUS.WORKING, IXI_TICKET_STATUS.PR_OPEN].includes(ticket.status)).length,
    recoverable: tickets.filter(ticketLeaseExpired).length,
    verify: tickets.filter(ticket => ticket.status === IXI_TICKET_STATUS.READY_TO_VERIFY).length,
    high: tickets.filter(ticket => ticket.priority === "high" || ticket.priority === "critical").length
  }), [tickets]);

  async function startWork(ticket = selected, source = "single-ticket") {
    if (!ticket || actionBusy) return;
    const recovery = ticketLeaseExpired(ticket);
    setActionBusy(true);
    setActionNotice("");
    try {
      await startRemoteTicket(ticket, {
        source: recovery ? "expired-lease-recovery" : source
      });
      setActionNotice(recovery
        ? `RECOVERY WORKER REQUESTED FOR ${ticket.displayNumber} — the abandoned lease will be replaced only after a successful agent reclaim.`
        : `WORKER LAUNCH REQUESTED FOR ${ticket.displayNumber} — it becomes WORKING only after the agent claims the full work packet.`);
      await refreshRemoteTickets();
    } catch (error) {
      setActionNotice(error.message || "Ticket worker could not be launched.");
    } finally {
      setActionBusy(false);
    }
  }

  async function startAllReady() {
    if (actionBusy) return;
    const ready = tickets.filter(ticket => [IXI_TICKET_STATUS.READY_FOR_CHAT, IXI_TICKET_STATUS.REOPENED].includes(ticket.status));
    if (!ready.length) {
      setActionNotice("No Tickets are waiting in the Ready queue.");
      return;
    }

    setActionBusy(true);
    setActionNotice("");
    const failures = [];
    let launched = 0;
    try {
      for (const ticket of ready) {
        try {
          await startRemoteTicket(ticket, { source: "ready-queue" });
          launched += 1;
        } catch (error) {
          failures.push(`${ticket.displayNumber}: ${error.message}`);
        }
      }
      await refreshRemoteTickets();
      setActionNotice(failures.length
        ? `Worker launch requested for ${launched} Ticket(s). ${failures.length} failed: ${failures.join(" | ")}`
        : `Worker launch requested for all ${launched} Ready Ticket(s). Each Ticket becomes WORKING only after an atomic agent claim.`);
    } finally {
      setActionBusy(false);
    }
  }

  async function approveAndClose() {
    if (!selected || actionBusy) return;
    if (!userScore) {
      setActionNotice("Rate the completed Ticket from 1 to 5 before closing it.");
      return;
    }

    setActionBusy(true);
    setActionNotice("");
    try {
      await approveTicket(selected, { score: Number(userScore), note: verifyNote.trim() });
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
      await reopenTicketRemote(selected, verifyNote.trim() || "Reopened from IXI Ticket Command.");
      setVerifyNote("");
      setActionNotice("Ticket reopened and returned to the work lifecycle.");
      await refreshRemoteTickets();
    } catch (error) {
      setActionNotice(error.message || "Ticket reopen failed.");
    } finally {
      setActionBusy(false);
    }
  }

  async function confirmDelete() {
    if (!selected || actionBusy || deleteConfirmId !== selected.ticketId) return;
    const displayNumber = selected.displayNumber;
    setActionBusy(true);
    setActionNotice("");
    try {
      await deleteTicket(selected, "obsolete");
      setSelectedId("");
      setDeleteConfirmId("");
      setActionNotice(`${displayNumber} was deleted. Its deletion audit remains protected in IX-Core.`);
    } catch (error) {
      setActionNotice(error.message || "Ticket deletion failed.");
    } finally {
      setActionBusy(false);
    }
  }

  function clearFilters() {
    setStatus("all");
    setRepository("all");
    setType("all");
    setPriority("all");
    setSearch("");
  }

  return (
    <main className={styles.command}>
      <header className={styles.commandHeader}>
        <div>
          <div className={styles.eyebrow}>IXI ADMIN / ENGINEERING</div>
          <h1>IXI TICKET COMMAND</h1>
          <p>Capture · queue · claim · execute · closeout · verify</p>
          <p>AWS: {upper(remoteState.status)}{remoteState.lastSyncedAt ? ` · ${formatDate(remoteState.lastSyncedAt)}` : ""}</p>
        </div>
        <div className={styles.headerButtons}>
          <button onClick={() => refreshRemoteTickets()} disabled={remoteState.status === "loading"}>
            {remoteState.status === "loading" ? "REFRESHING..." : "REFRESH FROM AWS"}
          </button>
          <button onClick={() => createTicket({ mode: "floating" })}>+ CREATE TICKET</button>
          <button onClick={startAllReady} disabled={actionBusy || counts.ready === 0}>
            {actionBusy ? "LAUNCHING..." : `WORK READY QUEUE (${counts.ready})`}
          </button>
          <a href="/account">DASHBOARD</a>
        </div>
      </header>

      {remoteState.error ? <div className={styles.empty}>{remoteState.error}</div> : null}
      {actionNotice ? <div className={styles.empty}>{actionNotice}</div> : null}

      <section className={styles.scoreboard}>
        <button onClick={() => setStatus("ready-for-chat")}><span>SHOW READY QUEUE</span><strong>{counts.ready}</strong></button>
        <button onClick={() => setStatus("working")}><span>SHOW WORKING QUEUE</span><strong>{counts.working}</strong></button>
        <button onClick={() => setStatus("ready-to-verify")}><span>SHOW VERIFY QUEUE</span><strong>{counts.verify}</strong></button>
        <button onClick={() => { setStatus("all"); setPriority("high"); }}><span>SHOW HIGH PRIORITY</span><strong>{counts.high}</strong></button>
      </section>

      {counts.recoverable ? (
        <div className={styles.empty}>{counts.recoverable} WORKING TICKET(S) HAVE NO ACTIVE LEASE AND ARE ELIGIBLE FOR CONTROLLED RECOVERY.</div>
      ) : null}

      <section className={styles.filters}>
        <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search ticket, request, object, page, run..." />
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
          <div className={styles.queueHeader}><span>{filtered.length} TICKETS</span><button onClick={clearFilters}>CLEAR FILTERS</button></div>
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
                  <span>{upper(ticket.type)}</span><span>{upper(ticket.priority)}</span><span>{ticket.repository}</span>
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
                  <p>STATUS: {upper(selected.status)}</p>
                  {executionLabel(selected) ? <p>{executionLabel(selected)}</p> : null}
                </div>
                <div className={styles.detailActions}>
                  {[IXI_TICKET_STATUS.READY_FOR_CHAT, IXI_TICKET_STATUS.REOPENED].includes(selected.status) ? (
                    <button disabled={actionBusy || !Number.isInteger(selected.revision)} onClick={() => startWork(selected)}>DISPATCH THIS TICKET TO AGENT</button>
                  ) : null}
                  {ticketLeaseExpired(selected) ? (
                    <button disabled={actionBusy || !Number.isInteger(selected.revision)} onClick={() => startWork(selected, "expired-lease-recovery")}>RECOVER ABANDONED TICKET</button>
                  ) : null}
                  {isIXITicketDeletable(selected) ? (
                    <button className={styles.deleteButton} disabled={actionBusy} onClick={() => setDeleteConfirmId(selected.ticketId)}>DELETE TICKET</button>
                  ) : null}
                  <button onClick={() => openTicket(selected.ticketId, "floating")}>OPEN WORKSHEET</button>
                  <button onClick={() => popOutTicket(selected.ticketId)}>POP OUT ↗</button>
                </div>
              </div>

              {deleteConfirmId === selected.ticketId ? (
                <section className={styles.deleteConfirm} role="alertdialog" aria-labelledby="delete-ticket-title" aria-describedby="delete-ticket-description">
                  <div>
                    <h3 id="delete-ticket-title">DELETE {selected.displayNumber}?</h3>
                    <p id="delete-ticket-description">This unworked Ticket will be removed from Ticket Command. This cannot be undone.</p>
                  </div>
                  <div>
                    <button disabled={actionBusy} onClick={() => setDeleteConfirmId("")}>CANCEL</button>
                    <button className={styles.confirmDeleteButton} disabled={actionBusy} onClick={confirmDelete}>{actionBusy ? "DELETING..." : "CONFIRM DELETE"}</button>
                  </div>
                </section>
              ) : null}

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
                <div className={styles.blockHeading}><h4>EXECUTION CONTROL</h4><span>LEASE-BOUND</span></div>
                <div className={styles.contextGrid}>
                  <div><span>DISPATCH</span><strong>{upper(selected.metadata?.dispatch?.state || "not-dispatched")}</strong></div>
                  <div><span>AGENT</span><strong>{selected.metadata?.execution?.agentId || "—"}</strong></div>
                  <div><span>RUN</span><strong>{selected.metadata?.execution?.runId || selected.metadata?.dispatch?.runId || "—"}</strong></div>
                  <div><span>CLAIMED</span><strong>{formatDate(selected.metadata?.execution?.claimedAt)}</strong></div>
                  <div><span>HEARTBEAT</span><strong>{formatDate(selected.metadata?.execution?.lastHeartbeatAt)}</strong></div>
                  <div><span>LEASE EXPIRES</span><strong>{formatDate(selected.metadata?.execution?.leaseExpiresAt)}</strong></div>
                </div>
              </section>

              <section className={`${styles.auditBlock} ${styles.closeout}`}>
                <div className={styles.blockHeading}>
                  <h4>ENGINEERING CLOSEOUT</h4>
                  <span>{selected.status === IXI_TICKET_STATUS.READY_TO_VERIFY ? "SUBMITTED / OWNER REVIEW REQUIRED" : "AGENT-OWNED RECORD"}</span>
                </div>
                <div className={styles.empty}>
                  AGENT CLOSEOUT IS LEASE-BOUND. The claimed worker writes engineering closeout through the IXI Agent Bridge; this operator surface cannot impersonate the worker.
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
                <div className={styles.contextGrid}>
                  <div><span>AGENT RESULT</span><strong>{selected.closeout?.agentRating?.score ? `${selected.closeout.agentRating.score} / 5` : "—"}</strong></div>
                  <div><span>AGENT CONFIDENCE</span><strong>{selected.closeout?.agentRating?.confidence ? `${selected.closeout.agentRating.confidence} / 5` : "—"}</strong></div>
                  <div><span>AGENT NOTE</span><strong>{selected.closeout?.agentRating?.note || "—"}</strong></div>
                </div>
              </section>

              <section className={styles.verification}>
                <label>
                  <span>YOUR RESULT RATING — 1 TO 5</span>
                  <select value={userScore} onChange={event => setUserScore(event.target.value)} disabled={selected.status !== IXI_TICKET_STATUS.READY_TO_VERIFY}>
                    <option value="">RATE RESULT</option>
                    {[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value} / 5</option>)}
                  </select>
                </label>
                <label>
                  <span>YOUR VERIFICATION / REOPEN NOTE</span>
                  <textarea value={verifyNote} onChange={event => setVerifyNote(event.target.value)} placeholder="What you verified, or what still needs work..." />
                </label>
                <div>
                  <button className={styles.reopenButton} disabled={actionBusy || !Number.isInteger(selected.revision) || selected.status !== IXI_TICKET_STATUS.CLOSED} onClick={reopen}>REOPEN CLOSED TICKET</button>
                  <button className={styles.approveButton} disabled={actionBusy || !Number.isInteger(selected.revision) || selected.status !== IXI_TICKET_STATUS.READY_TO_VERIFY} onClick={approveAndClose}>VERIFY & CLOSE TICKET</button>
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
              <button onClick={() => createTicket({ mode: "floating" })}>+ CREATE TICKET</button>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
