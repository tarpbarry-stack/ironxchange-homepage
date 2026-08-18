function clean(value) {
  return String(value ?? "").trim();
}

let publishedContext = {};

export function publishIXITicketContext(detail = {}) {
  publishedContext = {
    ...publishedContext,
    ...(detail && typeof detail === "object" ? detail : {})
  };

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("ixi-ticket-context", {
        detail: publishedContext
      })
    );
  }

  return publishedContext;
}

export function clearIXITicketContext(keys = null) {
  if (!keys) {
    publishedContext = {};
    return;
  }

  const next = { ...publishedContext };
  (Array.isArray(keys) ? keys : [keys]).forEach(key => delete next[key]);
  publishedContext = next;
}

export function getPublishedIXITicketContext() {
  return { ...publishedContext };
}

export function captureBrowserTicketContext(router = null, extra = {}) {
  const browser = typeof window !== "undefined";
  const route = router?.asPath || (browser ? window.location.pathname + window.location.search : "");
  const pathname = router?.pathname || (browser ? window.location.pathname : "");
  const hostname = browser ? window.location.hostname : "";

  let environment = "unknown";
  if (hostname.includes("preview")) environment = "preview";
  else if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") environment = "production";
  else if (hostname) environment = "local";

  return {
    route: clean(route),
    pathname: clean(pathname),
    environment,
    viewport: browser
      ? {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio || 1
        }
      : {},
    userAgent: browser ? navigator.userAgent : "",
    buildVersion: clean(process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA),
    ...publishedContext,
    ...(extra && typeof extra === "object" ? extra : {})
  };
}
