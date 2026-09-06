import Head from "next/head";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { captureIXEvent } from "../lib/posthog";
import { IXITicketProvider } from "../components/ixi-tickets/IXITicketProvider";
import IXIGlobalTicketLauncher from "../components/ixi-tickets/IXIGlobalTicketLauncher";
import IXIMarketplaceFaceTypography from "../components/ixi-marketplace/IXIMarketplaceFaceTypography";

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    const scheduled = new Set();

    function schedule(callback) {
      if (typeof window.requestIdleCallback === "function") {
        const id = window.requestIdleCallback(callback, {
          timeout: 2000
        });
        scheduled.add(["idle", id]);
        return;
      }

      const id = window.setTimeout(callback, 500);
      scheduled.add(["timer", id]);
    }

    function capturePage(path) {
      schedule(() => {
        captureIXEvent("ix_page_viewed", {
          path,
          route: String(path || "").split("?")[0],
          title: document.title || "IronXchange",
          referrer: document.referrer || "",
        });
      });
    }

    capturePage(router.asPath);

    router.events.on("routeChangeComplete", capturePage);

    return () => {
      router.events.off("routeChangeComplete", capturePage);

      scheduled.forEach(([type, id]) => {
        if (type === "idle") {
          window.cancelIdleCallback?.(id);
        } else {
          window.clearTimeout(id);
        }
      });
    };
  }, [router.isReady, router.events]);

  return (
    <IXITicketProvider>
      <Head>
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </Head>

      <IXIMarketplaceFaceTypography />
      <Component {...pageProps} />
      <IXIGlobalTicketLauncher />
    </IXITicketProvider>
  );
}
