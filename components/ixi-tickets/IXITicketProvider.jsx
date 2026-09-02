import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

import { createIXITicket, normalizeIXITicket } from "../../lib/ixi-tickets/IXITicketContract";
import {
  getLocalTicket,
  listLocalTickets,
  saveLocalTicket,
  subscribeLocalTickets
} from "../../lib/ixi-tickets/ixiTicketDraftStore";
import { captureBrowserTicketContext } from "../../lib/ixi-tickets/ixiTicketContext";
import {
  extractTicket,
  extractTickets,
  getTicketApiInfo,
  listRemoteTickets,
  reopenTicket,
  submitTicketCloseout,
  verifyTicket
} from "../../lib/ixi-tickets/ixiTicketClient";
import IXITicketWorksheet from "./IXITicketWorksheet";

const TicketContext = createContext(null);
const TICKET_REPOSITORIES = Object.freeze(["ironxchange-homepage", "ixi-core", "other"]);

function revisionOf(ticket) {
  const value = Number(ticket?.revision);
  return Number.isInteger(value) && value >= 0 ? value : -1;
}

function shouldAcceptRemote(local, remote) {
  if (!local) return true;
  if (remote?.status && remote.status !== "draft") return true;
  if (revisionOf(remote) > revisionOf(local)) return true;
  if (["aws-synced", "github-published"].includes(local.syncState)) return true;
  return false;
}

function persistCanonicalRemote(remote) {
  if (!remote?.ticketId) return null;
  const local = getLocalTicket(remote.ticketId);
  if (!shouldAcceptRemote(local, remote)) return local;
  return saveLocalTicket(normalizeIXITicket({
    ...(local || {}),
    ...remote,
    syncState: remote.github?.state === "published" ? "github-published" : "aws-synced"
  }));
}

export function IXITicketProvider({ children }) {
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [activeTicketId, setActiveTicketId] = useState("");
  const [mode, setMode] = useState("floating");
  const [open, setOpen] = useState(false);
  const [publishedContext, setPublishedContext] = useState({});
  const [remoteState, setRemoteState] = useState({ status: "idle", lastSyncedAt: "", error: "" });

  const apiInfo = useMemo(() => getTicketApiInfo(), []);

  const refreshRemoteTickets = useCallback(async () => {
    if (!apiInfo.configured) {
      setRemoteState({ status: "disabled", lastSyncedAt: "", error: "" });
      return [];
    }

    setRemoteState(current => ({ ...current, status: "loading", error: "" }));

    try {
      const payloads = await Promise.all(
        TICKET_REPOSITORIES.map(repository => listRemoteTickets({ repository, limit: 250 }))
      );

      const byId = new Map();
      payloads
        .flatMap(extractTickets)
        .map(normalizeIXITicket)
        .forEach(ticket => {
          if (!ticket?.ticketId) return;
          const current = byId.get(ticket.ticketId);
          if (!current || revisionOf(ticket) >= revisionOf(current)) byId.set(ticket.ticketId, ticket);
        });

      const remoteTickets = Array.from(byId.values());
      remoteTickets.forEach(persistCanonicalRemote);
      setTickets(listLocalTickets());
      setRemoteState({ status: "ready", lastSyncedAt: new Date().toISOString(), error: "" });
      return remoteTickets;
    } catch (error) {
      setRemoteState({
        status: "error",
        lastSyncedAt: "",
        error: error.message || "Ticket Command synchronization failed."
      });
      return [];
    }
  }, [apiInfo.configured]);

  useEffect(() => {
    setTickets(listLocalTickets());
    const unsubscribe = subscribeLocalTickets(setTickets);
    refreshRemoteTickets();
    return unsubscribe;
  }, [refreshRemoteTickets]);

  useEffect(() => {
    function onContext(event) {
      setPublishedContext(event?.detail && typeof event.detail === "object" ? event.detail : {});
    }
    window.addEventListener("ixi-ticket-context", onContext);
    return () => window.removeEventListener("ixi-ticket-context", onContext);
  }, []);

  const activeTicket = useMemo(
    () => tickets.find(ticket => ticket.ticketId === activeTicketId) || null,
    [tickets, activeTicketId]
  );

  const createTicket = useCallback((seed = {}) => {
    const context = captureBrowserTicketContext(router, {
      ...publishedContext,
      ...(seed.context || {})
    });

    const ticket = createIXITicket({
      context,
      repositorySuggestion: seed.repositorySuggestion || "ironxchange-homepage",
      source: seed.source || "internal-chat"
    });

    if (seed.headline) ticket.headline = seed.headline;
    const saved = saveLocalTicket(ticket);
    setActiveTicketId(saved.ticketId);
    setMode(seed.mode || "floating");
    setOpen(true);
    return saved;
  }, [router, publishedContext]);

  const openTicket = useCallback((ticketId, nextMode = null) => {
    const ticket = getLocalTicket(ticketId);
    if (!ticket) return null;
    setActiveTicketId(ticketId);
    if (nextMode) setMode(nextMode);
    setOpen(true);
    return ticket;
  }, []);

  const saveTicket = useCallback(ticket => {
    const saved = saveLocalTicket(normalizeIXITicket(ticket));
    setActiveTicketId(saved.ticketId);
    return saved;
  }, []);

  const acceptRemoteTicket = useCallback(remotePayload => {
    const remote = extractTicket(remotePayload);
    if (!remote?.ticketId) return null;
    const saved = saveLocalTicket(normalizeIXITicket({
      ...remote,
      syncState: remote.github?.state === "published" ? "github-published" : "aws-synced"
    }));
    setActiveTicketId(saved.ticketId);
    return saved;
  }, []);

  const submitCloseoutRemote = useCallback(async (ticket, closeout = {}) => {
    if (!ticket?.ticketId) throw new Error("Ticket is required for closeout.");
    if (!Number.isInteger(ticket.revision)) throw new Error("Synchronize this Ticket to AWS before closeout.");
    return acceptRemoteTicket(await submitTicketCloseout(ticket.ticketId, ticket.revision, closeout));
  }, [acceptRemoteTicket]);

  const approveTicket = useCallback(async (ticket, note = "") => {
    if (!ticket?.ticketId) throw new Error("Ticket is required for approval.");
    if (!Number.isInteger(ticket.revision)) throw new Error("Synchronize this Ticket to AWS before approval.");
    return acceptRemoteTicket(await verifyTicket(ticket.ticketId, {
      expectedRevision: ticket.revision,
      decision: "approve",
      note
    }));
  }, [acceptRemoteTicket]);

  const reopenTicketRemote = useCallback(async (ticket, note = "") => {
    if (!ticket?.ticketId) throw new Error("Ticket is required to reopen.");
    if (!Number.isInteger(ticket.revision)) throw new Error("Synchronize this Ticket to AWS before reopening.");
    return acceptRemoteTicket(await reopenTicket(ticket.ticketId, {
      expectedRevision: ticket.revision,
      note
    }));
  }, [acceptRemoteTicket]);

  const closeWorksheet = useCallback(() => setOpen(false), []);

  const popOutTicket = useCallback(ticketId => {
    if (typeof window === "undefined" || !ticketId) return;
    window.open(
      `/tickets/popout?ticketId=${encodeURIComponent(ticketId)}`,
      `ixi-ticket-${ticketId}`,
      "popup=yes,width=760,height=900,resizable=yes,scrollbars=yes"
    );
  }, []);

  const value = useMemo(() => ({
    tickets,
    activeTicket,
    activeTicketId,
    open,
    mode,
    setMode,
    createTicket,
    openTicket,
    saveTicket,
    acceptRemoteTicket,
    submitCloseoutRemote,
    approveTicket,
    reopenTicketRemote,
    closeWorksheet,
    popOutTicket,
    refreshRemoteTickets,
    remoteState,
    apiInfo
  }), [
    tickets,
    activeTicket,
    activeTicketId,
    open,
    mode,
    createTicket,
    openTicket,
    saveTicket,
    acceptRemoteTicket,
    submitCloseoutRemote,
    approveTicket,
    reopenTicketRemote,
    closeWorksheet,
    popOutTicket,
    refreshRemoteTickets,
    remoteState,
    apiInfo
  ]);

  return (
    <TicketContext.Provider value={value}>
      {children}
      {open && activeTicket ? (
        <IXITicketWorksheet
          ticket={activeTicket}
          mode={mode}
          onModeChange={setMode}
          onSave={saveTicket}
          onClose={closeWorksheet}
          onPopOut={() => popOutTicket(activeTicket.ticketId)}
        />
      ) : null}
    </TicketContext.Provider>
  );
}

export function useIXITickets() {
  const value = useContext(TicketContext);
  if (!value) throw new Error("useIXITickets must be used inside IXITicketProvider.");
  return value;
}
