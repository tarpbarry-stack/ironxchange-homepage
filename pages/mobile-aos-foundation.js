import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

import IXIMachineCard from "../components/ixi-machine-card/IXIMachineCard";
import { hydrateIXIListingMedia } from "../lib/listings/hydrateIXIListingMedia";
import {
  resolveIXIMobileSingleCardMetrics,
  resolveIXIViewportMode
} from "../lib/ixi-mobile/IXIMobileRuntime.mjs";

const TARGET_PHONE_WIDTHS = [320, 360, 375, 390, 412, 430];
const FIRST_MACHINE_FACE = 1;
const LAST_MACHINE_FACE = 4;
const MAX_AUTHOR_PROBES = 12;
const CARD_FAMILY = "private";

function publicDataOf(listing = {}) {
  return listing?.publicData || listing?.attributes?.publicData || {};
}

function metadataOf(listing = {}) {
  return listing?.metadata || listing?.attributes?.metadata || {};
}

function getAuthorId(listing = {}) {
  return String(
    listing?.authorId ||
    listing?.author?.id?.uuid ||
    listing?.author?.id ||
    listing?.relationships?.author?.data?.id?.uuid ||
    listing?.relationships?.author?.data?.id ||
    ""
  ).trim();
}

function getPassportId(listing = {}) {
  const publicData = publicDataOf(listing);
  return String(
    listing?.passportId ||
    publicData?.passportId ||
    listing?.ixiMedia?.passportId ||
    publicData?.ixiMedia?.passportId ||
    ""
  ).trim();
}

function isOwnedPrivateAosMachine(listing = {}) {
  const publicData = publicDataOf(listing);
  const metadata = metadataOf(listing);
  const access = String(
    listing?.machineAccess ||
    publicData?.machineAccess ||
    metadata?.machineAccess ||
    ""
  ).trim().toLowerCase();
  const channel = String(
    listing?.machineChannel ||
    publicData?.machineChannel ||
    metadata?.machineChannel ||
    ""
  ).trim().toLowerCase();
  const ownershipRole = String(
    listing?.ownershipRole ||
    publicData?.ownershipRole ||
    metadata?.ownershipRole ||
    ""
  ).trim().toLowerCase();
  const status = String(
    listing?.listingStatus ||
    publicData?.listingStatus ||
    metadata?.listingStatus ||
    ""
  ).trim().toLowerCase();

  return (
    access === "private" &&
    ownershipRole !== "non-owner" &&
    channel !== "auction" &&
    channel !== "auction-archive" &&
    status !== "archived" &&
    status !== "deleted" &&
    Boolean(getPassportId(listing))
  );
}

async function readJson(response, fallback) {
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error || fallback);
  return payload;
}

async function loadRealOwnedPrivateAosMachine() {
  const publicResponse = await fetch("/api/listings");
  const publicListings = await readJson(
    publicResponse,
    "Marketplace listings could not be loaded for AOS certification."
  );

  if (!Array.isArray(publicListings) || publicListings.length === 0) {
    throw new Error("No production listings are available to resolve an AOS owner inventory.");
  }

  const authorIds = Array.from(
    new Set(publicListings.map(getAuthorId).filter(Boolean))
  ).slice(0, MAX_AUTHOR_PROBES);

  if (authorIds.length === 0) {
    throw new Error("Production listings do not expose an owner identity for AOS certification.");
  }

  for (const authorId of authorIds) {
    try {
      const accountResponse = await fetch(
        `/api/account-listings?authorId=${encodeURIComponent(authorId)}`
      );
      const accountListings = await readJson(
        accountResponse,
        "Account inventory could not be loaded."
      );

      if (!Array.isArray(accountListings)) continue;
      const candidate = accountListings.find(isOwnedPrivateAosMachine);
      if (!candidate) continue;

      return hydrateIXIListingMedia(candidate, { dedupeRequests: true });
    } catch {
      // Probe next real owner inventory. Synthetic fallback is forbidden.
    }
  }

  throw new Error(
    "No real owned/private Passport-backed AOS machine was found in the production owner inventories inspected."
  );
}

export default function MobileAosFoundationPage() {
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
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadMachine() {
      try {
        const realMachine = await loadRealOwnedPrivateAosMachine();
        if (cancelled) return;
        setListing(realMachine);
        setStatus("ready");
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError?.message || "AOS machine could not be loaded.");
        setStatus("error");
      }
    }

    loadMachine();
    return () => { cancelled = true; };
  }, []);

  const viewportMode = useMemo(
    () => resolveIXIViewportMode(viewportWidth),
    [viewportWidth]
  );

  const metrics = useMemo(
    () => resolveIXIMobileSingleCardMetrics({
      viewportWidth,
      cardFamily: CARD_FAMILY
    }),
    [viewportWidth]
  );

  function cycleProductionMachineFace() {
    setMachineFace(current =>
      current >= LAST_MACHINE_FACE ? FIRST_MACHINE_FACE : current + 1
    );
  }

  return (
    <>
      <Head>
        <title>IXI Mobile AOS 300x475 Dollar Certification</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <main className="mobile-aos-shell">
        <header className="certification-header">
          <div>
            <strong>IXI MOBILE · AOS</strong>
            <span>PRIVATE 300×475 · + EDIT $ : · $ ONLY</span>
          </div>
          <div className="runtime-readout" aria-label="Mobile runtime status">
            <span>{viewportMode.toUpperCase()}</span>
            <span>{Math.round(viewportWidth)}px</span>
            <span>{metrics.nativeWidth}×{metrics.nativeHeight} · {metrics.scale.toFixed(3)}×</span>
          </div>
        </header>

        <section className="target-strip" aria-label="Certification phone widths">
          {TARGET_PHONE_WIDTHS.map(width => <span key={width}>{width}</span>)}
        </section>

        <section className="aos-workspace" aria-busy={status === "loading"}>
          {status === "loading" ? (
            <div className="foundation-message">Loading real owned/private AOS machine…</div>
          ) : null}

          {status === "error" ? (
            <div className="foundation-message error" role="alert">
              <strong>AOS CERTIFICATION BLOCKED</strong>
              <span>{error}</span>
            </div>
          ) : null}

          {status === "ready" && listing ? (
            <div
              className="scaled-card-frame"
              data-mobile-card-family={CARD_FAMILY}
              data-native-geometry="300x475"
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
                  cardContext="inventory"
                  from="aos-work"
                  sellerMode
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
        :global(html), :global(body) {
          margin: 0;
          min-width: 0;
          overflow-x: hidden;
          background: #070707;
        }

        .mobile-aos-shell {
          box-sizing: border-box;
          min-height: 100dvh;
          width: 100%;
          max-width: 100vw;
          overflow-x: hidden;
          padding: max(8px, env(safe-area-inset-top)) 0 max(24px, env(safe-area-inset-bottom));
          background: radial-gradient(circle at 50% -10%, rgba(255,196,0,.08), transparent 28%), #070707;
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

        .certification-header > div:first-child { min-width: 0; display: grid; gap: 3px; }
        .certification-header strong { color: #ffc400; font-size: 11px; line-height: 1.1; letter-spacing: .8px; }
        .certification-header span { font-size: 9px; line-height: 1.2; letter-spacing: .45px; color: rgba(255,255,255,.68); }
        .runtime-readout { flex: 0 0 auto; display: grid; justify-items: end; gap: 2px; }
        .runtime-readout span:first-child { color: #7fe1ff; font-weight: 800; }

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
        .target-strip::-webkit-scrollbar { display: none; }
        .target-strip span { flex: 0 0 auto; font-size: 9px; color: rgba(255,255,255,.48); }

        .aos-workspace {
          box-sizing: border-box;
          width: 100%;
          min-height: 760px;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          overflow: visible;
        }

        .scaled-card-frame { flex: 0 0 auto; position: relative; overflow: visible; }
        .native-card-plane { position: absolute; top: 0; left: 0; transform-origin: top left; overflow: visible; }

        .foundation-message {
          margin: 70px 16px 0;
          padding: 18px;
          display: grid;
          gap: 8px;
          text-align: center;
          font-size: 12px;
          color: rgba(255,255,255,.7);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 10px;
          background: #111;
        }
        .foundation-message.error { color: #ff9b9b; border-color: rgba(255,80,80,.22); }
        .foundation-message strong { color: #ffc400; font-size: 11px; letter-spacing: .7px; }
      `}</style>
    </>
  );
}
