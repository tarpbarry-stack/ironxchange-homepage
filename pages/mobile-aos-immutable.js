import Head from "next/head";
import { useEffect, useState } from "react";

import IXIMachineCard from "../components/ixi-machine-card/IXIMachineCard";
import IXIImmutableScaledSurface from "../components/ixi-mobile/IXIImmutableScaledSurface";
import { hydrateIXIListingMedia } from "../lib/listings/hydrateIXIListingMedia";

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
    listing?.machineAccess || publicData?.machineAccess || metadata?.machineAccess || ""
  ).trim().toLowerCase();
  const channel = String(
    listing?.machineChannel || publicData?.machineChannel || metadata?.machineChannel || ""
  ).trim().toLowerCase();
  const ownershipRole = String(
    listing?.ownershipRole || publicData?.ownershipRole || metadata?.ownershipRole || ""
  ).trim().toLowerCase();
  const status = String(
    listing?.listingStatus || publicData?.listingStatus || metadata?.listingStatus || ""
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
  const publicListings = await readJson(publicResponse, "Production listings could not be loaded.");

  if (!Array.isArray(publicListings) || !publicListings.length) {
    throw new Error("No production listings are available for AOS certification.");
  }

  const authorIds = Array.from(new Set(publicListings.map(getAuthorId).filter(Boolean))).slice(0, MAX_AUTHOR_PROBES);

  for (const authorId of authorIds) {
    try {
      const response = await fetch(`/api/account-listings?authorId=${encodeURIComponent(authorId)}`);
      const inventory = await readJson(response, "Owner inventory could not be loaded.");
      if (!Array.isArray(inventory)) continue;
      const candidate = inventory.find(isOwnedPrivateCandidate);
      if (!candidate) continue;
      return hydrateIXIListingMedia(candidate, { dedupeRequests: true });
    } catch {
      // Try another real production owner. No synthetic fallback.
    }
  }

  throw new Error("No real owned/private Passport machine is available for this proof.");
}

export default function MobileAosImmutablePage() {
  const [listing, setListing] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

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

  return (
    <>
      <Head>
        <title>IXI Mobile AOS Immutable Surface</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <main className="mobile-shell">
        <header className="header">
          <div>
            <strong>IXI MOBILE · AOS</strong>
            <span>IMMUTABLE 300×475 DESKTOP SURFACE · FULL-WIDTH SCALE</span>
          </div>
          <div className="mode">
            <span>ONE SURFACE</span>
            <span>NO INNER REFLOW</span>
          </div>
        </header>

        <section className="workspace">
          {status === "loading" ? <div className="message">Loading production AOS machine…</div> : null}
          {status === "error" ? (
            <div className="message error"><strong>CERTIFICATION BLOCKED</strong><span>{error}</span></div>
          ) : null}
          {status === "ready" && listing ? (
            <IXIImmutableScaledSurface nativeWidth={300} nativeHeight={475} horizontalPadding={16}>
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
            </IXIImmutableScaledSurface>
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

        .mobile-shell {
          box-sizing: border-box;
          min-height: 100dvh;
          width: 100%;
          overflow-x: hidden;
          padding: max(8px, env(safe-area-inset-top)) 0 max(24px, env(safe-area-inset-bottom));
          background: #070707;
          color: #f5f5f5;
          font-family: Inter, Arial, sans-serif;
        }

        .header {
          box-sizing: border-box;
          width: calc(100% - 16px);
          margin: 0 8px 10px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 10px;
          background: rgba(15,15,15,.94);
        }

        .header > div:first-child { min-width: 0; display: grid; gap: 3px; }
        .header strong { color: #ffc400; font-size: 11px; line-height: 1.1; letter-spacing: .8px; }
        .header span { color: rgba(255,255,255,.68); font-size: 9px; line-height: 1.2; letter-spacing: .45px; }
        .mode { flex: 0 0 auto; display: grid; justify-items: end; gap: 2px; }
        .mode span:first-child { color: #7fe1ff; font-weight: 800; }

        .workspace {
          box-sizing: border-box;
          width: 100%;
          min-height: 720px;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          overflow: visible;
        }

        .message {
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

        .message.error { color: #ff9b9b; border-color: rgba(255,80,80,.22); }
        .message strong { color: #ffc400; font-size: 11px; letter-spacing: .7px; }
      `}</style>
    </>
  );
}
