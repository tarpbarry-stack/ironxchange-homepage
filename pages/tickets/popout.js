import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import IXITicketWorksheet from "../../components/ixi-tickets/IXITicketWorksheet";
import {
  getLocalTicket,
  saveLocalTicket,
  subscribeLocalTickets
} from "../../lib/ixi-tickets/ixiTicketDraftStore";

export default function IXITicketPopoutPage() {
  const router = useRouter();
  const ticketId = String(router.query.ticketId || "");
  const [ticket, setTicket] = useState(null);

  useEffect(() => {
    if (!ticketId) return undefined;

    const refresh = () => setTicket(getLocalTicket(ticketId));
    refresh();
    return subscribeLocalTickets(refresh);
  }, [ticketId]);

  function closeWindow() {
    if (typeof window !== "undefined") window.close();
  }

  if (!router.isReady || !ticketId) {
    return <div style={{ minHeight: "100vh", background: "#060709" }} />;
  }

  return (
    <>
      <Head>
        <title>{ticket?.displayNumber || "IXI Chat Ticket"} | IronXchange</title>
      </Head>

      <div style={{ minHeight: "100vh", background: "#060709" }}>
        {ticket ? (
          <IXITicketWorksheet
            ticket={ticket}
            mode="standalone"
            standalone
            onSave={saved => {
              const next = saveLocalTicket(saved);
              setTicket(next);
            }}
            onClose={closeWindow}
          />
        ) : (
          <div style={{ padding: 32, color: "rgba(255,255,255,.65)", fontFamily: "system-ui" }}>
            Ticket not found in this browser profile.
          </div>
        )}
      </div>
    </>
  );
}
