import posthog from "posthog-js";

export function initPostHog() {
  if (typeof window === "undefined") return;

  if (posthog.__IX_INITIALIZED) return;

  posthog.init(
    process.env.NEXT_PUBLIC_POSTHOG_KEY,
    {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      person_profiles: "identified_only",
      capture_pageview: true,
      capture_pageleave: true
    }
  );

  posthog.__IX_INITIALIZED = true;
}

export default posthog;
