let posthogClient = null;
let initialized = false;

export async function initPostHog() {
  if (typeof window === "undefined") return null;
  if (initialized && posthogClient) return posthogClient;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

  if (!key) {
    console.warn("PostHog key missing");
    return null;
  }

  const posthogModule = await import("posthog-js");
  const posthog = posthogModule.default;

  posthog.init(key, {
    api_host: host,
    defaults: "2026-01-30",
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true
  });

  posthogClient = posthog;
  window.posthog = posthog;
  initialized = true;

  return posthog;
}

export async function captureIXEvent(eventName, properties = {}) {
  if (typeof window === "undefined") return;

  try {
    const posthog = await initPostHog();
    if (!posthog) return;

    posthog.capture(eventName, {
      app: "ironxchange",
      environment:
        window.location.hostname.includes("preview") ||
        window.location.hostname.includes("staging")
          ? "preview"
          : "production",
      ...properties
    });
  } catch (err) {
    console.error("PostHog capture failed:", err);
  }
}
