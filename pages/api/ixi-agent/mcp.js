const crypto = require("crypto");
const {
  claimTicket,
  getTicket,
  heartbeatTicket,
  listReadyTickets,
  listRecoverableTickets,
  submitAgentCloseout
} = require("../../../lib/ixi-agent/ixiAgentBridge");

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb"
    }
  }
};

function clean(value) {
  return String(value ?? "").trim();
}

function jsonRpc(id, result) {
  return { jsonrpc: "2.0", id, result };
}

function jsonRpcError(id, code, message, data) {
  return { jsonrpc: "2.0", id, error: { code, message, ...(data ? { data } : {}) } };
}

function safeEqual(a, b) {
  const left = Buffer.from(clean(a));
  const right = Buffer.from(clean(b));
  return left.length === right.length && left.length > 0 && crypto.timingSafeEqual(left, right);
}

function authorized(req) {
  const secret = clean(process.env.IXI_AGENT_BRIDGE_SECRET);
  if (!secret) return { ok: false, status: 503, code: "IXI_AGENT_BRIDGE_NOT_CONFIGURED", message: "IXI Agent Bridge secret is not configured." };
  const auth = clean(req.headers?.authorization);
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!safeEqual(token, secret)) return { ok: false, status: 401, code: "IXI_AGENT_UNAUTHORIZED", message: "Valid bearer token required." };
  return { ok: true };
}

function toolResult(data) {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
    isError: false
  };
}

function toolError(error) {
  return {
    content: [{ type: "text", text: JSON.stringify({
      ok: false,
      error: {
        code: error.code || "IXI_AGENT_TOOL_FAILED",
        message: error.message || "IXI Agent tool failed.",
        details: error.details || null
      }
    }, null, 2) }],
    structuredContent: {
      ok: false,
      error: {
        code: error.code || "IXI_AGENT_TOOL_FAILED",
        message: error.message || "IXI Agent tool failed.",
        details: error.details || null
      }
    },
    isError: true
  };
}

const listInput = {
  type: "object",
  properties: {
    repository: { type: "string", description: "Optional repository filter." },
    limit: { type: "integer", minimum: 1, maximum: 250, default: 250 }
  },
  additionalProperties: false
};

const TOOLS = [
  {
    name: "list_ready_tickets",
    description: "List IXI Tickets approved and waiting for a new agent claim. Returns authoritative current revisions.",
    inputSchema: listInput,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true }
  },
  {
    name: "list_recoverable_tickets",
    description: "List WORKING IXI Tickets whose execution lease has expired and may be safely reclaimed by a new agent run.",
    inputSchema: listInput,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true }
  },
  {
    name: "get_ticket",
    description: "Fetch one authoritative IXI Ticket and its complete frozen work packet.",
    inputSchema: {
      type: "object",
      properties: { ticketId: { type: "string" } },
      required: ["ticketId"],
      additionalProperties: false
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true }
  },
  {
    name: "claim_ticket",
    description: "Atomically claim a READY/REOPENED Ticket, or reclaim a WORKING Ticket only after its lease expired. A successful claim is the only path that establishes the active WORKING lease.",
    inputSchema: {
      type: "object",
      properties: {
        ticketId: { type: "string" },
        expectedRevision: { type: "integer", minimum: 1 },
        agentId: { type: "string" },
        runId: { type: "string" },
        leaseSeconds: { type: "integer", minimum: 60, maximum: 3600, default: 900 }
      },
      required: ["ticketId", "expectedRevision", "agentId", "runId"],
      additionalProperties: false
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false }
  },
  {
    name: "heartbeat_ticket",
    description: "Renew the active execution lease for a WORKING Ticket. The revision, agentId, runId and unexpired lease must match.",
    inputSchema: {
      type: "object",
      properties: {
        ticketId: { type: "string" },
        expectedRevision: { type: "integer", minimum: 1 },
        agentId: { type: "string" },
        runId: { type: "string" },
        leaseSeconds: { type: "integer", minimum: 60, maximum: 3600, default: 900 }
      },
      required: ["ticketId", "expectedRevision", "agentId", "runId"],
      additionalProperties: false
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false }
  },
  {
    name: "submit_ticket_closeout",
    description: "Submit the assigned agent's structured closeout for a WORKING Ticket under the active unexpired lease. Advances the same Ticket to READY TO VERIFY when accepted.",
    inputSchema: {
      type: "object",
      properties: {
        ticketId: { type: "string" },
        expectedRevision: { type: "integer", minimum: 1 },
        agentId: { type: "string" },
        runId: { type: "string" },
        closeout: {
          type: "object",
          properties: {
            summary: { type: "string" },
            filesChanged: { type: "array", items: { type: "string" } },
            tests: { type: "array", items: {} },
            before: { type: "string" },
            after: { type: "string" },
            risks: { type: "string" },
            notes: { type: "string" },
            prs: { type: "array", items: {} },
            editResults: { type: "array", items: {} },
            agentRating: {
              type: "object",
              properties: {
                score: { type: ["integer", "null"], minimum: 1, maximum: 5 },
                confidence: { type: ["integer", "null"], minimum: 1, maximum: 5 },
                note: { type: "string" }
              },
              additionalProperties: true
            }
          },
          required: ["summary"],
          additionalProperties: true
        }
      },
      required: ["ticketId", "expectedRevision", "agentId", "runId", "closeout"],
      additionalProperties: false
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false }
  }
];

async function callTool(name, args) {
  switch (name) {
    case "list_ready_tickets": {
      const tickets = await listReadyTickets(args || {});
      return { ok: true, count: tickets.length, tickets };
    }
    case "list_recoverable_tickets": {
      const tickets = await listRecoverableTickets(args || {});
      return { ok: true, count: tickets.length, tickets };
    }
    case "get_ticket": {
      const ticket = await getTicket(args?.ticketId);
      return { ok: true, ticket };
    }
    case "claim_ticket":
      return { ok: true, ...(await claimTicket(args || {})) };
    case "heartbeat_ticket":
      return { ok: true, ...(await heartbeatTicket(args || {})) };
    case "submit_ticket_closeout":
      return { ok: true, ...(await submitAgentCloseout(args || {})) };
    default: {
      const error = new Error(`Unknown IXI Agent tool: ${name}`);
      error.code = "IXI_AGENT_TOOL_NOT_FOUND";
      throw error;
    }
  }
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("MCP-Protocol-Version", "2025-03-26");

  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      service: "ixi-agent-gateway",
      contractVersion: "1.1.0",
      configured: Boolean(clean(process.env.IXI_AGENT_BRIDGE_SECRET)),
      protocol: "mcp-streamable-http-jsonrpc",
      tools: TOOLS.map(tool => tool.name)
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: { code: "IXI_AGENT_METHOD_NOT_ALLOWED", message: "GET or POST required." } });
  }

  const auth = authorized(req);
  if (!auth.ok) return res.status(auth.status).json({ ok: false, error: { code: auth.code, message: auth.message } });

  const message = req.body || {};
  const id = Object.prototype.hasOwnProperty.call(message, "id") ? message.id : null;

  try {
    if (message.method === "initialize") {
      return res.status(200).json(jsonRpc(id, {
        protocolVersion: "2025-03-26",
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "ixi-agent-gateway", version: "1.1.0" },
        instructions: "IXI Ticket is the authoritative work-order system. Never perform Ticket work before an atomic claim. Never continue after lease expiry without a successful reclaim."
      }));
    }

    if (message.method === "notifications/initialized") return res.status(202).end();

    if (message.method === "tools/list") return res.status(200).json(jsonRpc(id, { tools: TOOLS }));

    if (message.method === "tools/call") {
      const name = clean(message.params?.name);
      const args = message.params?.arguments || {};
      try {
        const result = await callTool(name, args);
        return res.status(200).json(jsonRpc(id, toolResult(result)));
      } catch (error) {
        return res.status(200).json(jsonRpc(id, toolError(error)));
      }
    }

    return res.status(200).json(jsonRpcError(id, -32601, `Method not found: ${clean(message.method)}`));
  } catch (error) {
    return res.status(200).json(jsonRpcError(id, -32603, error.message || "IXI Agent Gateway internal error."));
  }
}
