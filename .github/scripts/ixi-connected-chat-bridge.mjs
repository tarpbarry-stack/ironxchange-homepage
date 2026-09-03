import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";

const require = createRequire(import.meta.url);
const {
  buildWorkPacket,
  claimTicket,
  heartbeatTicket,
  listReadyTickets,
  listRecoverableTickets,
  submitAgentCloseout
} = require("../../lib/ixi-agent/ixiAgentBridge.js");

const requestPath = process.env.IXI_CHAT_REQUEST_PATH || ".ixi/chat-bridge/request.json";
const responsePath = process.env.IXI_CHAT_RESPONSE_PATH || "/tmp/ixi-chat-bridge-response.json";

function clean(value) {
  return String(value ?? "").trim();
}

function assertRequestId(value) {
  const id = clean(value);
  if (!/^ixi-chat-request-[A-Za-z0-9._:-]{8,120}$/.test(id)) throw new Error("Invalid requestId.");
  return id;
}

function safeError(error) {
  return {
    code: error?.code || "IXI_CHAT_BRIDGE_FAILED",
    message: error?.message || "IXI connected Chat bridge failed.",
    status: Number(error?.status) || 500,
    details: error?.details || null
  };
}

async function run(request) {
  const requestId = assertRequestId(request.requestId);
  const action = clean(request.action);
  const repository = clean(request.repository) || undefined;

  if (action === "next") {
    const recoverable = await listRecoverableTickets({ repository, limit: 250 });
    const ready = await listReadyTickets({ repository, limit: 250 });
    const ticket = recoverable[0] || ready[0] || null;
    return {
      ok: true,
      contract: "ixi-connected-chat-artifact",
      contractVersion: "1.0.0",
      requestId,
      action,
      mode: recoverable[0] ? "recover" : ticket ? "claim" : "none",
      counts: { recoverable: recoverable.length, ready: ready.length },
      ticket,
      workPacket: ticket ? buildWorkPacket(ticket) : null
    };
  }

  if (action === "claim") {
    const result = await claimTicket({
      ticketId: clean(request.ticketId),
      expectedRevision: Number(request.expectedRevision),
      agentId: "chatgpt-connected-github",
      runId: clean(request.runId),
      leaseSeconds: 3600
    });
    return { ok: true, contract: "ixi-connected-chat-artifact", contractVersion: "1.0.0", requestId, action, ...result };
  }

  if (action === "heartbeat") {
    const result = await heartbeatTicket({
      ticketId: clean(request.ticketId),
      expectedRevision: Number(request.expectedRevision),
      agentId: "chatgpt-connected-github",
      runId: clean(request.runId),
      leaseSeconds: 3600
    });
    return { ok: true, contract: "ixi-connected-chat-artifact", contractVersion: "1.0.0", requestId, action, ...result };
  }

  if (action === "closeout") {
    const result = await submitAgentCloseout({
      ticketId: clean(request.ticketId),
      expectedRevision: Number(request.expectedRevision),
      agentId: "chatgpt-connected-github",
      runId: clean(request.runId),
      closeout: request.closeout || {}
    });
    return { ok: true, contract: "ixi-connected-chat-artifact", contractVersion: "1.0.0", requestId, action, ...result };
  }

  throw Object.assign(new Error(`Unsupported connected Chat action: ${action}`), { code: "IXI_CHAT_ACTION_INVALID", status: 400 });
}

let response;
try {
  const request = JSON.parse(await readFile(requestPath, "utf8"));
  response = await run(request);
} catch (error) {
  response = {
    ok: false,
    contract: "ixi-connected-chat-artifact",
    contractVersion: "1.0.0",
    error: safeError(error)
  };
  process.exitCode = 1;
}

await writeFile(responsePath, `${JSON.stringify(response, null, 2)}\n`, { mode: 0o600 });
console.log(`IXI connected Chat response artifact written: ${response.ok ? "ok" : "failed"}`);
