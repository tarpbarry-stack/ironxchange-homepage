import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

import IXIMachineCard from "../components/ixi-machine-card/IXIMachineCard";
import { hydrateIXIListingMedia } from "../lib/listings/hydrateIXIListingMedia";
import {
  resolveIXIMobileSingleCardMetrics,
  resolveIXIViewportMode
} from "../lib/ixi-mobile/IXIMobileRuntime.mjs";

const TARGET_PHONE_WIDTHS = [320, 360, 375, 390, 412, 430];
const MAX_AUTHOR_PROBES = 12;

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

function isOwnedPrivateCandidate(listing = {}) {
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
    channel !== "auction" &&
    channel !== "auction-archive" &&
    ownershipRole !== "non-owner" &&
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

async function loadRealOwnedPrivateMachine() {
  const publicResponse = await fetch("/api/listings");
  const publicListings = await readJson(
    publicResponse,
    "Production listings could not be loaded."
  );

  if (!Array.isArray(publicListings) || publicListings.length === 0) {
    throw new Error("No production listings are available for private-card certification.");
  }

  const authorIds = Array.from(
    new Set(publicListings.map(getAuthorId).filter(Boolean))
  ).slice(0, MAX_AUTHOR_PROBES);

  for (const authorId of authorIds) {
    try {
      const response = await fetch(
        `/api/account-listings?authorId=${encodeURIComponent(authorId)}`
      );
      const inventory = await readJson(response, "Owner inventory could not be loaded.");
      if (!Array.isArray(inventory)) continue;
      const candidate = inventory.find(isOwnedPrivateCandidate);
      if (!candidate) continue;
      return hydrateIXIListingMedia(candidate, { dedupeRequests: true });
    } catch {
      // Continue to another real production owner. No synthetic machine is allowed.
    }
  }

  throw new Error("No real owned/private Passport machine is available for this certification surface.");
}

export default function MobileAosFace1Page() {
  const [viewportWidth, setViewportWidth] = useState(390);
  const [listing, setListing] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

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
    loadRealOwnedPrivateMachine()
      .then(machine => {
        if (cancelled) return;
        setListing(machine);
        setStatus("ready");
      })
      .catch(loadError => {
        if (cancelled) return;
        setError(loadError?.message || "Owned/private machine could not be loaded.");
        setStatus("error");
      });
    return () => { cancelled = true; };
  }, []);

  const viewportMode = useMemo(
    () => resolveIXIViewportMode(viewportWidth),
    [viewportWidth]
  );

  const metrics = useMemo(
    () => resolveIXIMobileSingleCardMetrics({ viewportWidth, family: "private" }),
    [viewportWidth]
  );

  return (
    <>
      <Head>
        <title>IXI Mobile Owned Private Face 1</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <main className="mobile-shell">
        <header className="header">
          <div>
            <strong>IXI MOBILE · AOS</strong>
            <span>OWNED PRIVATE FACE 1 · PRESENTATION ONLY</span>
          </div>
          <div className="runtime">
            <span>{viewportMode.toUpperCase()}</span>
            <span>{Math.round(viewportWidth)}px</span>
            <span>300×475 · {metrics.scale.toFixed(3)}×</span>
          </div>
        </header>

        <div className="targets">
          {TARGET_PHONE_WIDTHS.map(width => <span key={width}>{width}</span>)}
        </div>

        <section className="workspace">
          {status === "loading" ? <div className="message">Loading current owned/private card…</div> : null}
          {status === "error" ? (
            <div className="message error"><strong>CERTIFICATION BLOCKED</strong><span>{error}</span></div>
          ) : null}
          {status === "ready" && listing ? (
            <div
              className="scaled-frame"
              style={{ width: metrics.renderedWidth, height: metrics.renderedHeight }}
            >
              <div
                className="native-plane"
                style={{
                  width: metrics.nativeWidth,
                  height: metrics.nativeHeight,
                  transform: `scale(${metrics.scale})`
                }}
              >
                <IXIMachineCard
                  listing={listing}
                  cardContext="inventory"
                  presentation="seller"
                  sellerMode
                  machineFace={1}
                  showSave={false}
                  suppressFamilyLog
                  from="aos-work"
                />
              </div>
            </div>
          ) : null}
        </section>
      </main>

      <style jsx>{`
        :global(html),:global(body){margin:0;min-width:0;overflow-x:hidden;background:#070707}
        .mobile-shell{box-sizing:border-box;min-height:100dvh;width:100%;overflow-x:hidden;padding:max(8px,env(safe-area-inset-top)) 0 max(24px,env(safe-area-inset-bottom));background:radial-gradient(circle at 50% -10%,rgba(255,196,0,.08),transparent 28%),#070707;color:#f5f5f5;font-family:Inter,Arial,sans-serif}
        .header{box-sizing:border-box;width:calc(100% - 16px);margin:0 8px 8px;padding:10px 12px;display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid rgba(255,255,255,.08);border-radius:10px;background:rgba(15,15,15,.94)}
        .header>div:first-child{min-width:0;display:grid;gap:3px}.header strong{color:#ffc400;font-size:11px;line-height:1.1;letter-spacing:.8px}.header span{font-size:9px;line-height:1.2;letter-spacing:.45px;color:rgba(255,255,255,.68)}
        .runtime{flex:0 0 auto;display:grid;justify-items:end;gap:2px}.runtime span:first-child{color:#7fe1ff;font-weight:800}
        .targets{box-sizing:border-box;width:calc(100% - 16px);margin:0 8px 10px;padding:6px 8px;display:flex;gap:6px;overflow-x:auto;border-bottom:1px solid rgba(255,255,255,.06)}.targets span{font-size:9px;color:rgba(255,255,255,.48)}
        .workspace{box-sizing:border-box;width:100%;min-height:720px;display:flex;justify-content:center;align-items:flex-start;overflow:visible}
        .scaled-frame{position:relative;flex:0 0 auto;overflow:visible}.native-plane{position:absolute;top:0;left:0;transform-origin:top left;overflow:visible}
        .message{margin:70px 16px 0;padding:18px;display:grid;gap:8px;text-align:center;font-size:12px;color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.08);border-radius:10px;background:#111}.message.error{color:#ff9b9b;border-color:rgba(255,80,80,.22)}.message strong{color:#ffc400;font-size:11px;letter-spacing:.7px}
      `}</style>
    </>
  );
}
