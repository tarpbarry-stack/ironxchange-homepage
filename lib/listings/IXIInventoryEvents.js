const eventName = "ixi:inventory-changed";
const channelName = "ixi-inventory-lifecycle-v1";
export function announceInventoryChange(detail = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(eventName, { detail }));
  if (typeof BroadcastChannel !== "undefined") { const channel = new BroadcastChannel(channelName); channel.postMessage(detail); channel.close(); }
}
export function subscribeInventoryChanges(listener) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(eventName, listener);
  const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(channelName);
  if (channel) channel.onmessage = event => listener({ detail: event.data });
  return () => { window.removeEventListener(eventName, listener); channel?.close(); };
}
