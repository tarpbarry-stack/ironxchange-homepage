import Head from "next/head";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { initPostHog, captureIXEvent } from "../lib/posthog";
import { IXITicketProvider } from "../components/ixi-tickets/IXITicketProvider";
import IXIGlobalTicketLauncher from "../components/ixi-tickets/IXIGlobalTicketLauncher";
import IXIMarketplaceFaceTypography from "../components/ixi-marketplace/IXIMarketplaceFaceTypography";

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
