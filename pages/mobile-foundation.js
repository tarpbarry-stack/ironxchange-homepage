import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

import IXIMachineCard from "../components/ixi-machine-card/IXIMachineCard";
import loadIXIListingsEnvironment from "../lib/listings/IXIListingsEngine";
import {
  resolveIXIMobileSingleCardMetrics,
  resolveIXIViewportMode
} from "../lib/ixi-mobile/IXIMobileRuntime.mjs";

const TARGET_PHONE_WIDTHS = [320, 360, 375, 390, 412, 430];
const FIRST_MACHINE_FACE = 1;
const LAST_MACHINE_FACE = 4;

export default function MobileFoundationPage() {
  const [viewportWidth, setViewportWidth] = useState(390);
  const [listing, setListing] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [machineFace, setMachineFace] = useState(FIRST_MACHINE_FACE);

  useEffect(() => {
    function syncViewport() {
      setViewportWidth(window.innerWidth || 390);
    }

    syncViewport();
    window.addEventListener("resize", syncViewport, { passive: true });

    return () => {
      window.removeEventListener("resize", syncViewport);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProductionCard() {
      try {
        const environment = await loadIXIListingsEnvironment({
          includePrivateState: false,
          marketplaceBrowsePerformance: true
        });

        if (cancelled) return;

        if (environment?.errors?.publicListings) {
          throw environment.errors.publicListings;
        }

        const firstActiveListing = (environment?.listings || []).find(item => {
          const publicData = item?.publicData || item?.attributes?.publicData || {};
          const listingStatus = item?.listingStatus || publicData?.listingStatus || "";
          return listingStatus !== "archived";
        });

        if (!firstActiveListing) {
          throw new Error("No active production Marketplace listing is available for mobile certification.");
        }

        setListing(firstActiveListing);
        setStatus("ready");
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError?.message || "Production listing could not be loaded.");
        setStatus("error");
      }
    }

    loadProductionCard();

    return () => {
      cancelled = true;
    };
  }, []);

  const viewportMode = useMemo(
    () => resolveIXIViewportMode(viewportWidth),
    [viewportWidth]
  );

  const metrics = useMemo(
    () => resolveIXIMobileSingleCardMetrics({ viewportWidth }),
    [viewportWidth]
  );

  function cycleProductionMachineFace() {
    setMachineFace(current =>
      current >= LAST_MACHINE_FACE
        ? FIRST_MACHINE_FACE
        : current + 1
    );
  }

  return (
    <>
      <Head>
        <title>IXI Mobile Card Face Certification</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </Head>

      <main className="mobile-foundation-shell">
        <header className="certification-header">
          <div>
            <strong>IXI MOBILE · CARD FACES</strong>
            <span>TRANCHE 2 · PRODUCTION FACE CYCLE ONLY</span>
          </div>
          <div className="runtime-readout" aria-label="Mobile runtime status">
            <span>{viewportMode.toUpperCase()}</span>
            <span>{Math.round(viewportWidth)}px</span>
            <span>{metrics.scale.toFixed(3)}× · F{machineFace}</span>
          </div>
        </header>

        <section className="target-strip" aria-label="Certification phone widths">
          {TARGET_PHONE_WIDTHS.map(width => (
            <span key={width}>{width}</span>
          ))}
        </section>

        <section className="foundation-workspace" aria-busy={status === "loading"}>
          {status === "loading" ? (
            <div className="foundation-message">Loading production machine…</div>
          ) : null}

          {status === "error" ? (
            <div className="foundation-message error" role="alert">
              {error}
            </div>
          ) : null}

          {status === "ready" && listing ? (
            <div
              className="scaled-card-frame"
              style={{
                width: `${metrics.renderedWidth}px`,
                height: `${metrics.renderedHeight}px`
              }}
            >
              <div
                className="native-card-plane"
                style={{
                  width: `${metrics.nativeWidth}px`,
                  height: `${metrics.nativeHeight}px`,
                  transform: `scale(${metrics.scale})`
                }}
              >
                <IXIMachineCard
                  listing={listing}
                  cardContext="marketplace"
                  from="browse"
                  showSave={false}
                  suppressFamilyLog
                  machineFace={machineFace}
                  onCycleMachineFace={cycleProductionMachineFace}
                />
              </div>
            </div>
          ) : null}
        </section>
      </main>

      <style jsx>{`
        :global(html),
        :global(body) {
          margin: 0;
          min-width: 0;
          overflow-x: hidden;
          background: #070707;
        }

        .mobile-foundation-shell {
          box-sizing: border-box;
          min-height: 100dvh;
          width: 100%;
          max-width: 100vw;
          overflow-x: hidden;
          padding:
            max(8px, env(safe-area-inset-top))
            0
            max(18px, env(safe-area-inset-bottom));
          background:
            radial-gradient(circle at 50% -10%, rgba(255,196,0,.08), transparent 28%),
            #070707;
          color: #f5f5f5;
          font-family: Inter, Arial, sans-serif;
        }

        .certification-header {
          box-sizing: border-box;
          width: calc(100% - 16px);
          margin: 0 8px 8px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 10px;
          background: rgba(15,15,15,.94);
        }

        .certification-header > div:first-child {
          min-width: 0;
          display: grid;
          gap: 3px;
        }

        .certification-header strong {
          color: #ffc400;
          font-size: 11px;
          line-height: 1.1;
          letter-spacing: .8px;
        }

        .certification-header span {
          font-size: 9px;
          line-height: 1.2;
          letter-spacing: .45px;
          color: rgba(255,255,255,.68);
        }

        .runtime-readout {
          flex: 0 0 auto;
          display: grid;
          justify-items: end;
          gap: 2px;
        }

        .runtime-readout span:first-child {
          color: #7fe1ff;
          font-weight: 800;
        }

        .target-strip {
          box-sizing: border-box;
          width: calc(100% - 16px);
          margin: 0 8px 10px;
          padding: 6px 8px;
          display: flex;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
          border-bottom: 1px solid rgba(255,255,255,.06);
        }

        .target-strip::-webkit-scrollbar {
          display: none;
        }

        .target-strip span {
          flex: 0 0 auto;
          font-size: 9px;
          color: rgba(255,255,255,.48);
        }

        .foundation-workspace {
          box-sizing: border-box;
          width: 100%;
          min-height: 430px;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          overflow: visible;
        }

        .scaled-card-frame {
          flex: 0 0 auto;
          position: relative;
        }

        .native-card-plane {
          position: absolute;
          top: 0;
          left: 0;
          transform-origin: top left;
        }

        .foundation-message {
          margin: 70px 16px 0;
          padding: 18px;
          text-align: center;
          font-size: 12px;
          color: rgba(255,255,255,.7);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 10px;
          background: #111;
        }

        .foundation-message.error {
          color: #ff9b9b;
          border-color: rgba(255,80,80,.22);
        }
      `}</style>
    </>
  );
}
