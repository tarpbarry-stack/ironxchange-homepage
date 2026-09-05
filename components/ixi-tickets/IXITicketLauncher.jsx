import { useIXITickets } from "./IXITicketProvider";

export default function IXITicketLauncher({ compact = false }) {
  const { createTicket, tickets } = useIXITickets();

  const readyCount = tickets.filter(ticket => ticket.status === "ready-for-chat").length;
  const verifyCount = tickets.filter(ticket => ticket.status === "ready-to-verify").length;

  return (
    <div className="ixi-ticket-launcher">
      <button
        type="button"
        className="ixi-ticket-create"
        onClick={() => createTicket()}
        title="Create IXI Chat Ticket"
      >
        <span className="plus">+</span>
        <span>{compact ? "TICKET" : "CHAT TICKET"}</span>
      </button>

      <a className="ixi-ticket-command-link" href="/tickets" title="Open IXI Ticket Command">
        <span>TICKETS</span>
        {readyCount || verifyCount ? (
          <strong>{readyCount + verifyCount}</strong>
        ) : null}
      </a>

      <style jsx>{`
        .ixi-ticket-launcher {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .ixi-ticket-create,
        .ixi-ticket-command-link {
          height: 25px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          box-sizing: border-box;
          padding: 0 8px;
          border: 1px solid rgba(255, 196, 0, .28);
          border-radius: 4px;
          background: linear-gradient(180deg, rgba(255,196,0,.055), rgba(255,196,0,.012)), #090a0c;
          color: rgba(255,196,0,.78);
          text-decoration: none;
          font-family: inherit;
          font-size: 10px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: .65px;
          cursor: pointer;
          transition: border-color .14s ease, color .14s ease, background .14s ease, transform .14s ease;
        }

        .ixi-ticket-create:hover,
        .ixi-ticket-command-link:hover {
          color: #ffc400;
          border-color: rgba(255,196,0,.7);
          background: rgba(255,196,0,.08);
          transform: translateY(-1px);
        }

        .plus {
          font-size: 13px;
          line-height: 1;
          font-weight: 700;
        }

        .ixi-ticket-command-link {
          color: rgba(255,255,255,.42);
          border-color: rgba(255,255,255,.11);
        }

        .ixi-ticket-command-link strong {
          min-width: 14px;
          height: 14px;
          padding: 0 3px;
          display: inline-grid;
          place-items: center;
          border-radius: 7px;
          background: #ffc400;
          color: #050505;
          font-size: 9px;
        }

        @media (max-width: 850px) {
          .ixi-ticket-command-link { display: none; }
          .ixi-ticket-create { padding: 0 7px; }
        }
      `}</style>
    </div>
  );
}
