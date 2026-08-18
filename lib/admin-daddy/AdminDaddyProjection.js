const { ADMIN_SEVERITY, normalizeAdminEvent } = require("./AdminDaddyContracts");

function buildFoundationProjection() {
  const generatedAt = new Date().toISOString();

  return {
    version: "admin-daddy-v2-foundation-1",
    generatedAt,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
    metrics: [
      { key: "ecosystem", label: "ECOSYSTEM HEALTH", value: "FOUNDATION", detail: "Control plane online" },
      { key: "attention", label: "NEEDS YOU", value: "—", detail: "Attention adapters pending" },
      { key: "objects", label: "OBJECTS", value: "—", detail: "AOS projection pending" },
      { key: "marketplace", label: "MARKETPLACE", value: "—", detail: "Marketplace adapter pending" },
      { key: "money", label: "TRAN$ACT", value: "—", detail: "Financial projection pending" },
      { key: "systems", label: "SYSTEMS", value: "V2", detail: "Admin Daddy II" }
    ],
    attention: [
      normalizeAdminEvent({
        sourceSystem: "infrastructure",
        sourceComponent: "admin-daddy-v2",
        eventType: "foundation-online",
        severity: ADMIN_SEVERITY.INFO,
        title: "Admin Daddy II control-plane foundation is online",
        detail: "Authority, telemetry, audit and subsystem adapters are the next wiring layers.",
        occurredAt: generatedAt,
        actionable: false
      })
    ],
    systems: [
      { id: "admin-daddy", label: "ADMIN DADDY V2", state: "healthy", detail: "Foundation route active" },
      { id: "authority", label: "IXI AUTHORITY", state: "pending", detail: "Context is evaluated by the gateway" },
      { id: "aos", label: "AOS", state: "pending", detail: "Adapter not wired yet" },
      { id: "marketplace", label: "MARKETPLACE", state: "pending", detail: "Adapter not wired yet" },
      { id: "acquisition", label: "ACQUISITION", state: "pending", detail: "Adapter not wired yet" },
      { id: "media", label: "MEDIA", state: "pending", detail: "Adapter not wired yet" },
      { id: "transact", label: "TRAN$ACT", state: "pending", detail: "Adapter not wired yet" }
    ],
    modules: [
      ["OBJECT CONTROL", "objects"],
      ["SELLER CONTROL", "accounts"],
      ["AUCTION OPS", "auction"],
      ["PARSER OPS", "acquisition"],
      ["MEDIA JOBS", "media"],
      ["PASSPORT / IDENTITY", "passport"],
      ["TRAN$ACT OVERSIGHT", "transact"],
      ["MODERATION", "moderation"],
      ["MESSAGES", "communications"],
      ["DEPLOYMENTS", "deployment"]
    ]
  };
}

module.exports = { buildFoundationProjection };
