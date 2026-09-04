const {
  buildWorkPacket,
  listReadyTickets,
  listRecoverableTickets
} = require("../../../../lib/ixi-agent/ixiAgentBridge");

function clean(value) {
  return String(value ?? "").trim();
}

function jsonError(res, status, code, message, details = null) {
  return res.status(status).json({ ok: false, contract: "ixi-chat-bridge", error: { code, message, details } });
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return jsonError(res, 405, "IXI_CHAT_METHOD_NOT_ALLOWED", "GET required.");
  }

  try {
    const repository = clean(req.query?.repository);
    const ticketId = clean(req.query?.ticketId);

    const recoverable = await listRecoverableTickets({ repository: repository || undefined, limit: 250 });
    const ready = await listReadyTickets({ repository: repository || undefined, limit: 250 });

    let ticket = null;
    let mode = "none";
    if (ticketId) {
      ticket = [...recoverable, ...ready].find(item => item.ticketId === ticketId) || null;
      mode = ticket ? (recoverable.some(item => item.ticketId === ticket.ticketId) ? "recover" : "claim") : "none";
    } else if (recoverable[0]) {
      ticket = recoverable[0];
      mode = "recover";
    } else if (ready[0]) {
      ticket = ready[0];
      mode = "claim";
    }

    if (!ticket) {
      return res.status(200).json({
        ok: true,
        contract: "ixi-chat-bridge",
        contractVersion: "1.0.0",
        ticket: null,
        mode: "none",
        counts: { recoverable: recoverable.length, ready: ready.length }
      });
    }

    return res.status(200).json({
      ok: true,
      contract: "ixi-chat-bridge",
      contractVersion: "1.0.0",
      mode,
      ticket,
      workPacket: buildWorkPacket(ticket),
      counts: { recoverable: recoverable.length, ready: ready.length },
      nextAction: {
        route: "/api/ixi-agent/chat/claim",
        ticketId: ticket.ticketId,
        expectedRevision: ticket.revision,
        recovery: mode === "recover"
      }
    });
  } catch (error) {
    return jsonError(
      res,
      Number(error.status) || 500,
      error.code || "IXI_CHAT_NEXT_FAILED",
      error.message || "Unable to load the next IXI Ticket.",
      error.details || null
    );
  }
}
