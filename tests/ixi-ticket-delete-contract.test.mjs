import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = path => readFileSync(new URL(path, root), "utf8");

test("Ticket Command exposes guarded deletion for unworked Tickets", () => {
  const command = read("components/ixi-tickets/IXITicketCommand.jsx");
  const contract = read("lib/ixi-tickets/IXITicketContract.js");

  assert.match(command, /DELETE TICKET/);
  assert.match(command, /CONFIRM DELETE/);
  assert.match(command, /role="alertdialog"/);
  assert.match(command, /isIXITicketDeletable\(selected\)/);
  assert.match(contract, /DRAFT, IXI_TICKET_STATUS\.READY_FOR_CHAT/);
  assert.match(contract, /execution\.claimedAt/);
});

test("Ticket deletion reaches IX-Core and purges the browser cache", () => {
  const client = read("lib/ixi-tickets/ixiTicketClient.js");
  const proxy = read("lib/ixi-tickets/ixiTicketProxy.js");
  const provider = read("components/ixi-tickets/IXITicketProvider.jsx");

  assert.match(client, /method: "DELETE"/);
  assert.match(client, /expectedRevision, reason/);
  assert.match(proxy, /method: "DELETE"/);
  assert.match(provider, /await deleteRemoteTicket/);
  assert.match(provider, /deleteLocalTicket\(ticket\.ticketId\)/);
  assert.match(provider, /ticket\.status === "deleted"/);
});
