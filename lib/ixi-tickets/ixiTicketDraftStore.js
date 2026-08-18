import { normalizeIXITicket, touchTicket } from "./IXITicketContract";

const STORAGE_KEY = "ixi:chat-tickets:v1";
const CHANNEL_NAME = "ixi-chat-tickets";

function canUseBrowser() {
  return typeof window !== "undefined";
}

function readRaw() {
  if (!canUseBrowser()) return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRaw(tickets) {
  if (!canUseBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  window.dispatchEvent(new CustomEvent("ixi-ticket-store-changed"));

  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: "tickets-changed", at: Date.now() });
    channel.close();
  }
}

export function listLocalTickets() {
  return readRaw()
    .map(normalizeIXITicket)
    .sort((a, b) => String(b.audit?.updatedAt || "").localeCompare(String(a.audit?.updatedAt || "")));
}

export function getLocalTicket(ticketId) {
  return listLocalTickets().find(ticket => ticket.ticketId === ticketId) || null;
}

export function saveLocalTicket(ticket) {
  const next = touchTicket(normalizeIXITicket(ticket));
  const tickets = readRaw();
  const index = tickets.findIndex(item => item.ticketId === next.ticketId);

  if (index >= 0) tickets[index] = next;
  else tickets.unshift(next);

  writeRaw(tickets);
  return next;
}

export function deleteLocalTicket(ticketId) {
  const tickets = readRaw().filter(ticket => ticket.ticketId !== ticketId);
  writeRaw(tickets);
}

export function subscribeLocalTickets(listener) {
  if (!canUseBrowser()) return () => {};

  const emit = () => listener(listLocalTickets());
  const onStorage = event => {
    if (!event || event.key === STORAGE_KEY) emit();
  };
  const onCustom = () => emit();

  window.addEventListener("storage", onStorage);
  window.addEventListener("ixi-ticket-store-changed", onCustom);

  let channel = null;
  if (typeof BroadcastChannel !== "undefined") {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = emit;
  }

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("ixi-ticket-store-changed", onCustom);
    if (channel) channel.close();
  };
}

export { STORAGE_KEY, CHANNEL_NAME };
