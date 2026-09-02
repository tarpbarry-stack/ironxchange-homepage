const EVENT_NAMES = new Set([
  "marketplace_inventory_requested",
  "marketplace_inventory_ready",
  "marketplace_inventory_failed",
  "listing_card_impression",
  "listing_card_clicked",
  "listing_card_photo_changed",
  "listing_card_face_changed",
  "listing_rail_control_selected",
  "listing_console_opened",
  "listing_console_closed",
  "listing_console_face_changed",
  "listing_card_moved",
  "armed_destination_changed",
  "listing_save_requested",
  "listing_save_succeeded",
  "listing_save_failed",
  "listing_share_composer_opened",
  "listing_share_channel_selected",
  "listing_share_email_requested",
  "listing_share_completed",
  "listing_share_failed",
  "listing_share_handoff_opened",
  "listing_share_content_copied"
]);

const PROPERTY_NAMES = new Set([
  "listing_id",
  "surface",
  "result",
  "control",
  "channel",
  "card_face",
  "photo_index",
  "source_container",
  "destination_container",
  "source_position",
  "destination_position",
  "console_side",
  "console_depth",
  "saved",
  "replayed",
  "rendered_count",
  "total_count",
  "error_code"
]);

function safeScalar(value) {
  if (
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  ) {
    return value;
  }

  if (typeof value !== "string") return undefined;
  const normalized = value.trim().slice(0, 120);

  if (
    !normalized ||
    /@/u.test(normalized) ||
    /(?:bearer\s+|glpat-|https?:\/\/)/iu.test(normalized)
  ) {
    return undefined;
  }

  return normalized;
}

export function normalizeMarketplaceIntelligenceProperties(
  properties = {}
) {
  return Object.entries(properties).reduce((result, [key, value]) => {
    if (!PROPERTY_NAMES.has(key)) return result;
    const safeValue = safeScalar(value);
    if (safeValue !== undefined) result[key] = safeValue;
    return result;
  }, { surface: "browse_v2" });
}

export function captureMarketplaceIntelligence(
  eventName,
  properties = {}
) {
  if (!EVENT_NAMES.has(eventName)) return Promise.resolve(false);

  if (typeof window === "undefined") return Promise.resolve(false);

  return (async () => {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      if (typeof window.posthog?.capture === "function") {
        window.posthog.capture(eventName, {
          app: "ironxchange",
          environment:
            window.location.hostname.includes("preview") ||
            window.location.hostname.includes("vercel.app")
              ? "preview"
              : "production",
          ...normalizeMarketplaceIntelligenceProperties(properties)
        });
        return true;
      }

      await new Promise(resolve => window.setTimeout(resolve, 100));
    }

    return false;
  })().catch(() => false);
}

export function getMarketplaceIntelligenceContract() {
  return {
    events: Array.from(EVENT_NAMES),
    properties: Array.from(PROPERTY_NAMES)
  };
}
