import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";

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
        assignedTo: "ixi-openai-worker",
        agentId: "ixi-openai-worker",
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
  assert.equal(packet.execution.agentId, "ixi-openai-worker");
  assert.equal(packet.execution.runId, "run-1");
  assert.equal(packet.execution.leaseExpired, false);
});
