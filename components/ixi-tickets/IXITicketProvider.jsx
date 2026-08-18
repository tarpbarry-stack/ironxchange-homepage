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
import IXITicketWorksheet from "./IXITicketWorksheet";

const TicketContext = createContext(null);

export function IXITicketProvider({ children }) {
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [activeTicketId, setActiveTicketId] = useState("");
  const [mode, setMode] = useState("floating");
  const [open, setOpen] = useState(false);
  const [publishedContext, setPublishedContext] = useState({});

  useEffect(() => {
    setTickets(listLocalTickets());
    return subscribeLocalTickets(setTickets);
  }, []);

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

  const closeWorksheet = useCallback(() => setOpen(false), []);

  const popOutTicket = useCallback(ticketId => {
    if (typeof window === "undefined" || !ticketId) return;

    const url = `/tickets/popout?ticketId=${encodeURIComponent(ticketId)}`;
    window.open(
      url,
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
    closeWorksheet,
    popOutTicket
  }), [
    tickets,
    activeTicket,
    activeTicketId,
    open,
    mode,
    createTicket,
    openTicket,
    saveTicket,
    closeWorksheet,
    popOutTicket
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
