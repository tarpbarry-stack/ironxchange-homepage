import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const {
  buildWorkPacket,
  leaseExpired
} = require("../lib/ixi-agent/ixiAgentBridge.js");

test("WORKING Ticket with no lease is recoverable", () => {
  assert.equal(leaseExpired({ status: "working", metadata: { execution: {} } }), true);
});

test("WORKING Ticket with future lease is not recoverable", () => {
  assert.equal(leaseExpired({
    status: "working",
    metadata: {
      execution: {
        leaseExpiresAt: new Date(Date.now() + 60_000).toISOString()
      }
    }
  }), false);
});

test("WORKING Ticket with expired lease is recoverable", () => {
  assert.equal(leaseExpired({
    status: "working",
    metadata: {
      execution: {
        leaseExpiresAt: new Date(Date.now() - 1_000).toISOString()
      }
    }
  }), true);
});

test("non-WORKING Ticket is never treated as expired execution", () => {
  assert.equal(leaseExpired({ status: "ready-for-chat", metadata: { execution: {} } }), false);
  assert.equal(leaseExpired({ status: "closed", metadata: { execution: {} } }), false);
});

test("work packet freezes authoritative Ticket scope and execution identity", () => {
  const ticket = {
    ticketId: "ticket-contract-1",
    displayNumber: "CT-260903-TEST",
    revision: 7,
    status: "working",
    repository: "ironxchange-homepage",
    type: "bug",
    priority: "high",
    executionClass: "code-change",
    headline: "Fix real defect",
    originalRequest: "Repair the exact defect described here.",
    editSections: [{ editId: "edit-1", description: "Do not broaden scope." }],
    attachments: [{ attachmentId: "a-1", name: "evidence.png" }],
    context: { route: "/tickets", objectId: "object-1" },
    authority: { requestedBy: "owner" },
    metadata: {
      dispatch: { state: "claimed", runId: "run-1" },
      execution: {
        assignedTo: "chatgpt-connected-github",
        agentId: "chatgpt-connected-github",
        runId: "run-1",
        claimedAt: "2026-09-03T00:00:00.000Z",
        startedAt: "2026-09-03T00:00:00.000Z",
        lastHeartbeatAt: "2026-09-03T00:01:00.000Z",
        leaseExpiresAt: "2099-09-03T00:16:00.000Z"
      }
    },
    audit: { createdAt: "2026-09-03T00:00:00.000Z" }
  };

  const packet = buildWorkPacket(ticket);
  assert.equal(packet.contract, "ixi-agent-work-packet");
  assert.equal(packet.contractVersion, "1.1.0");
  assert.equal(packet.ticketId, ticket.ticketId);
  assert.equal(packet.revision, 7);
  assert.equal(packet.originalRequest, ticket.originalRequest);
  assert.deepEqual(packet.editSections, ticket.editSections);
  assert.deepEqual(packet.attachments, ticket.attachments);
  assert.deepEqual(packet.context, ticket.context);
  assert.equal(packet.execution.agentId, "chatgpt-connected-github");
  assert.equal(packet.execution.runId, "run-1");
  assert.equal(packet.execution.leaseExpired, false);
});

test("connected Chat is the live Ticket dispatch path and needs no new GitHub credential", () => {
  const launch = readFileSync(new URL("../pages/api/ixi-agent/worker/launch.js", import.meta.url), "utf8");
  assert.match(launch, /mode: "connected-chat"/);
  assert.match(launch, /requiresNewGithubCredentials: false/);
  assert.match(launch, /requestDispatch/);
  assert.doesNotMatch(launch, /launchTicketWorker/);
});

test("connected Chat bridge exposes intake, claim, heartbeat and closeout import", () => {
  const next = readFileSync(new URL("../pages/api/ixi-agent/chat/next.js", import.meta.url), "utf8");
  const claim = readFileSync(new URL("../pages/api/ixi-agent/chat/claim.js", import.meta.url), "utf8");
  const heartbeat = readFileSync(new URL("../pages/api/ixi-agent/chat/heartbeat.js", import.meta.url), "utf8");
  const closeout = readFileSync(new URL("../pages/api/ixi-agent/chat/import-closeout.js", import.meta.url), "utf8");

  assert.match(next, /listRecoverableTickets/);
  assert.match(next, /listReadyTickets/);
  assert.match(claim, /chatgpt-connected-github/);
  assert.match(claim, /leaseSeconds: 3600/);
  assert.match(heartbeat, /heartbeatTicket/);
  assert.match(closeout, /sourceArtifact/);
  assert.match(closeout, /raw\.githubusercontent\.com/);
  assert.match(closeout, /submitAgentCloseout/);
});

test("legacy browser-only READY Tickets are promoted into the AWS queue", () => {
  const provider = readFileSync(new URL("../components/ixi-tickets/IXITicketProvider.jsx", import.meta.url), "utf8");

  assert.match(provider, /LEGACY_READY_STATUSES/);
  assert.match(provider, /!Number\.isInteger\(ticket\.revision\)/);
  assert.match(provider, /setRemoteTicketReady\(ticket\)/);
  assert.match(provider, /Promise\.allSettled/);
  assert.match(provider, /remain safely stored in this browser/);
});

test("authenticated Ticket launcher is mounted in the global app shell", () => {
  const app = readFileSync(new URL("../pages/_app.js", import.meta.url), "utf8");
  const navbar = readFileSync(new URL("../components/Navbar.js", import.meta.url), "utf8");

  assert.match(app, /<IXIGlobalTicketLauncher \/>/);
  assert.doesNotMatch(navbar, /<IXITicketLauncher/);
});
