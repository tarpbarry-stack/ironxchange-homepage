// Header-only metadata. Keep lesson content and interactive components out of page bundles.
export const ATLAS_TOPICS = Object.freeze([
  "overview", "marketplace", "machine-card", "console", "gearbox", "passport",
  "aos-work", "pockets", "private", "auction", "post-free", "url-import",
  "bulk-import", "transact", "invoice", "quote", "sales-order", "payments",
  "acquisition", "freight", "work-order", "settlement", "ledger", "sold",
  "sales-desk", "calendar", "account", "saved", "theater", "tickets",
]);
const topics = new Set(ATLAS_TOPICS);
const modules = Object.freeze({
  invoice: "invoice", "service-invoice": "invoice", quote: "quote", "service-quote": "quote",
  "sales-order": "sales-order", settlement: "settlement", payments: "payments",
  "asset-acquisition": "acquisition", freight: "freight", "work-order": "work-order",
  "technology-work": "work-order", sold: "sold", collections: "payments", payables: "payments",
  treasury: "ledger", "general-ledger": "ledger", "financial-reporting": "ledger",
});
export function knownAtlasTopic(value) {
  return typeof value === "string" && topics.has(value) ? value : "";
}
export function atlasTopicForPage(pathname = "", moduleId = "") {
  const path = String(pathname).split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if ((path.startsWith("/transact") || path.startsWith("/aos")) && Object.hasOwn(modules, moduleId)) return modules[moduleId];
  if (path === "/sold") return "sold";
  if (path === "/transact/ledger") return "ledger";
  if (path.startsWith("/transact")) return "transact";
  if (path === "/sales-desk") return moduleId === "calendar" ? "calendar" : "sales-desk";
  if (path === "/aos" || path.startsWith("/aos/")) return "aos-work";
  if (path === "/post-free") return "post-free";
  if (path === "/url-import") return "url-import";
  if (["/bulk-import", "/account/bulk-upload"].includes(path)) return "bulk-import";
  if (path.startsWith("/account/my-listings") || path === "/yard" || path === "/yard-v2") return "private";
  if (path.startsWith("/auction")) return "auction";
  if (path.startsWith("/account")) return "account";
  if (path === "/saved") return "saved";
  if (path === "/theater") return "theater";
  if (path.startsWith("/tickets")) return "tickets";
  if (path.startsWith("/p/")) return "passport";
  if (path.startsWith("/listing/") || path === "/live") return "machine-card";
  if (["/browse", "/browse-v2"].includes(path)) return "marketplace";
  return "overview";
}
export function atlasHelpHref({ pathname = "", moduleId = "", topic = "" } = {}) {
  return `/atlas?topic=${knownAtlasTopic(topic) || atlasTopicForPage(pathname, moduleId)}`;
}
export function atlasLessonHref(topic) {
  return `/atlas?topic=${knownAtlasTopic(topic) || "overview"}`;
}
