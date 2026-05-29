import { useEffect } from "react";
import { useRouter } from "next/router";
import { initPostHog, captureIXEvent } from "../lib/posthog";

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    if (!router.isReady) return;

    function capturePage(path) {
      captureIXEvent("ix_page_viewed", {
        path,
        route: router.pathname,
        title:
          typeof document !== "undefined"
            ? document.title
            : "IronXchange",
        referrer:
          typeof document !== "undefined"
            ? document.referrer
            : "",
      });
    }

    capturePage(router.asPath);

    router.events.on("routeChangeComplete", capturePage);

    return () => {
      router.events.off("routeChangeComplete", capturePage);
    };
  }, [router.isReady, router.pathname, router.asPath, router.events]);

  return <Component {...pageProps} />;
}
