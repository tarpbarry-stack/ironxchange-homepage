import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

import IXIMachineCard from "../../components/ixi-machine-card/IXIMachineCard";
import IXIPrivateObjectConsole from "../../components/ixi-private-object/IXIPrivateObjectConsole";
import IXIImmutableScaledSurface from "../../components/ixi-mobile/IXIImmutableScaledSurface";
import { hydrateIXIListingMedia } from "../../lib/listings/hydrateIXIListingMedia";
import { getListingId } from "../../lib/listingFormatters";

function publicDataOf(listing = {}) {
  return listing?.publicData || listing?.attributes?.publicData || {};
}

function metadataOf(listing = {}) {
  return listing?.metadata || listing?.attributes?.metadata || {};
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
  const access = String(listing?.machineAccess || publicData?.machineAccess || metadata?.machineAccess || "").trim().toLowerCase();
  const channel = String(listing?.machineChannel || publicData?.machineChannel || metadata?.machineChannel || "").trim().toLowerCase();
  const ownershipRole = String(listing?.ownershipRole || publicData?.ownershipRole || metadata?.ownershipRole || "").trim().toLowerCase();
  const status = String(listing?.listingStatus || publicData?.listingStatus || metadata?.listingStatus || "").trim().toLowerCase();

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

export default function MobileConsoleLeftCertificationPage() {
  const [listing, setListing] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [ixiCardState, setIxiCardState] = useState({});

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUsersMachine() {
      try {
        const SharetribeSdk = await import("sharetribe-flex-sdk");
        const sdk = SharetribeSdk.createInstance({
          clientId: process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
        });
        const currentUserResponse = await sdk.currentUser.show();
        const currentUser = currentUserResponse?.data?.data;
        const userId = String(currentUser?.id?.uuid || currentUser?.id || "").trim();
        if (!userId) throw new Error("Authenticated IXI user session is required.");

        const response = await fetch(`/api/account-listings?authorId=${encodeURIComponent(userId)}`);
        const inventory = await response.json();
        if (!response.ok) throw new Error(inventory?.error || "Owner inventory could not be loaded.");

        const candidate = Array.isArray(inventory) ? inventory.find(isOwnedPrivateCandidate) : null;
        if (!candidate) throw new Error("No owned/private Passport machine is available for this account.");

        const hydrated = await hydrateIXIListingMedia(candidate, { dedupeRequests: true });
        if (cancelled) return;
        setListing(hydrated);
        setStatus("ready");
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError?.message || "Authenticated AOS machine could not be loaded.");
        setStatus("error");
      }
    }

    loadCurrentUsersMachine();
    return () => { cancelled = true; };
  }, []);

  const objectId = listing ? String(getListingId(listing)) : "";
  const consoleDepth = useMemo(() => {
    const slots = objectId ? ixiCardState?.[objectId]?.consoleSlots : null;
    return Array.isArray(slots) && slots.length > 1 ? 2 : 1;
  }, [ixiCardState, objectId]);
  const nativeWidth = consoleDepth === 2 ? 600 : 300;

  function updateIxiCardState(id, patch) {
    setIxiCardState(current => {
      const existing = current?.[id] || {};
      let nextPatch = { ...(patch || {}) };
      if (Array.isArray(nextPatch.consoleSlots) && nextPatch.consoleSlots.length > 2) {
        nextPatch = { ...nextPatch, consoleSlots: nextPatch.consoleSlots.slice(-2) };
      }
      return { ...current, [id]: { ...existing, ...nextPatch } };
    });
  }

  return (
    <>
      <Head>
        <title>IXI Mobile AOS Left Console Certification</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <main className="shell">
        <header className="header">
          <div><strong>IXI MOBILE · AOS · CONSOLE</strong><span>LEFT SIDE ONLY · EXISTING PRIVATE CONSOLE · IMMUTABLE SURFACE</span></div>
          <div className="mode"><span>{consoleDepth === 2 ? "CONSOLE + MACHINE" : "MACHINE"}</span><span>{nativeWidth}×475 NATIVE ROW</span></div>
        </header>

        <section className="workspace">
          {status === "loading" ? <div className="message">Loading your AOS machine…</div> : null}
          {status === "error" ? <div className="message error"><strong>AUTHENTICATED GATE BLOCKED</strong><span>{error}</span></div> : null}
          {status === "ready" && listing && objectId ? (
            <IXIImmutableScaledSurface nativeWidth={nativeWidth} nativeHeight={475} horizontalPadding={16} className="mobile-left-console-gate">
              <IXIPrivateObjectConsole
                objectId={objectId}
                item={listing}
                sellerCardProps={{}}
                ixiCardState={ixiCardState}
                updateIxiCardState={updateIxiCardState}
                enableCardScaling={false}
                renderParentCard={({
                  consoleDepth: activeConsoleDepth,
                  consoleLeftOpen,
                  consoleRightOpen,
                  onExpandConsoleLeft,
                  onExpandConsoleRight
                }) => (
                  <IXIMachineCard
                    listing={listing}
                    cardContext="inventory"
                    sellerMode
                    machineFace={1}
                    showSave={false}
                    suppressFamilyLog
                    from="aos-work"
                    consoleActuatorVariant="tall"
                    consoleDepth={activeConsoleDepth}
                    consoleLeftOpen={consoleLeftOpen}
                    consoleRightOpen={consoleRightOpen}
                    onExpandConsoleLeft={onExpandConsoleLeft}
                    onExpandConsoleRight={onExpandConsoleRight}
                  />
                )}
              />
            </IXIImmutableScaledSurface>
          ) : null}
        </section>
      </main>

      <style jsx>{`
        :global(html),:global(body){margin:0;min-width:0;overflow-x:hidden;background:#070707}
        .shell{box-sizing:border-box;min-height:100dvh;width:100%;padding:max(8px,env(safe-area-inset-top)) 0 max(24px,env(safe-area-inset-bottom));overflow-x:hidden;background:#070707;color:#f5f5f5;font-family:Inter,Arial,sans-serif}
        .header{box-sizing:border-box;width:calc(100% - 16px);margin:0 8px 10px;padding:10px 12px;display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid rgba(255,255,255,.08);border-radius:10px;background:rgba(15,15,15,.94)}
        .header>div:first-child{min-width:0;display:grid;gap:3px}.header strong{color:#ffc400;font-size:11px;line-height:1.1;letter-spacing:.8px}.header span{color:rgba(255,255,255,.68);font-size:9px;line-height:1.2;letter-spacing:.45px}.mode{flex:0 0 auto;display:grid;justify-items:end;gap:2px}.mode span:first-child{color:#7fe1ff;font-weight:800}
        .workspace{box-sizing:border-box;width:100%;min-height:720px;display:flex;justify-content:center;align-items:flex-start;overflow:visible}
        .message{margin:70px 16px 0;padding:18px;display:grid;gap:8px;text-align:center;font-size:12px;color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.08);border-radius:10px;background:#111}.message.error{color:#ff9b9b;border-color:rgba(255,80,80,.22)}.message strong{color:#ffc400;font-size:11px;letter-spacing:.7px}
      `}</style>

      <style jsx global>{`
        .mobile-left-console-gate .ixi-private-console-listing-slot .ixi-object-card-actuator.right{display:none!important}
        .mobile-left-console-gate .ixi-private-console-module-slot .ixi-object-card-actuator.left{display:none!important}
      `}</style>
    </>
  );
}
