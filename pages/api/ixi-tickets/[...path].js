const {
  buildTicketPath,
  proxyIXITicketRequest
} = require("../../../lib/ixi-tickets/ixiTicketProxy");

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb"
    }
  }
};

export default async function handler(req, res) {
  const path = buildTicketPath(req.query?.path || []);
  if (!path) {
    return res.status(404).json({
      ok: false,
      contract: "ixi-ticket",
      error: {
        code: "IXI_TICKET_ROUTE_NOT_FOUND",
        message: "Ticket route not found."
      }
    });
  }

  return proxyIXITicketRequest({
    req,
    res,
    ticketPath: path
  });
}
