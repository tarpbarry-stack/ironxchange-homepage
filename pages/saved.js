import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ListingCard from "../components/ListingCard";

import { getListingId } from "../lib/listingFormatters";
import {
  fetchIxiMachineState
} from "../lib/ixiMachineStateClient";
import { captureIXEvent } from "../lib/posthog";

import IXSearchSurface from "../components/IXSearchSurface";

import {
  fetchCurrentUserWithSavedListings,
  getSavedListingIdsFromUser,
  filterSavedListings,
  toggleSavedListing
} from "../lib/savedListings";

export default function SavedListings() {
  const [listings, setListings] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [sdk, setSdk] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [workspaceFilters, setWorkspaceFilters] = useState({
  yearMin: "",
  yearMax: "",
  priceMin: "",
  priceMax: "",
  hoursMin: "",
  hoursMax: ""
});

  const [savedBoardMode, setSavedBoardMode] = useState("saved");
  const [savedBoardListings, setSavedBoardListings] = useState([]);

  const [draggingListingId, setDraggingListingId] = useState("");
  const [ghostListingId, setGhostListingId] = useState("");
  const [activeStacksOpen, setActiveStacksOpen] = useState({
  top: false,
  bottom: false
});

const [activeStacks, setActiveStacks] = useState({
  top: [],
  bottom: []
});
  
  const [ixiCardState, setIxiCardState] = useState({});
  const [ixiUserId, setIxiUserId] = useState("guest");
  const [ixiColorFilters, setIxiColorFilters] = useState([]);
  const [ixiOutlineFilter, setIxiOutlineFilter] = useState("all");

  useEffect(() => {
    captureIXEvent("saved_workspace_viewed", {
      page: "saved"
    });
  }, []);

  useEffect(() => {
    async function loadSavedPage() {
      try {
        const SharetribeSdk = await import("sharetribe-flex-sdk");

        const sdkInstance = SharetribeSdk.createInstance({
          clientId: process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
        });

        setSdk(sdkInstance);

        const currentUser =
          await fetchCurrentUserWithSavedListings(sdkInstance);

        const userId =
  currentUser?.id?.uuid ||
  currentUser?.id ||
  "guest";

setIxiUserId(String(userId));

const remoteIxiState =
  await fetchIxiMachineState(String(userId));

setIxiCardState(remoteIxiState);

        setSavedIds(
          getSavedListingIdsFromUser(currentUser)
        );

        const res = await fetch("/api/listings");
        const data = await res.json();

        if (Array.isArray(data)) {
          setListings(data);
        }
      } catch (err) {
        console.error("Saved page load failed:", err);
        setSavedIds([]);
      }
    }

    loadSavedPage();
  }, []);

  const savedListings = useMemo(() => {
    const activeListings = listings.filter(item => {
      const listingStatus =
        item.listingStatus ||
        item.publicData?.listingStatus ||
        item.attributes?.publicData?.listingStatus;

      return listingStatus !== "archived";
    });

    return filterSavedListings(activeListings, savedIds);
  }, [listings, savedIds]);

  const workspaceListings = useMemo(() => {
  const activeListings = listings.filter(item => {
    const listingStatus =
      item.listingStatus ||
      item.publicData?.listingStatus ||
      item.attributes?.publicData?.listingStatus;

    return listingStatus !== "archived";
  });

  const touchedIds = Object.keys(ixiCardState || {});

  return activeListings.filter(item =>
    touchedIds.includes(String(getListingId(item)))
  );
}, [listings, ixiCardState]);

  const visibleSavedListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const source =
      savedBoardMode === "custom" && savedBoardListings.length
        ? savedBoardListings
        : workspaceListings;

    return source.filter(item => {
      const id = String(getListingId(item));

      const searchableText = [
        item.title,
        item.type,
        item.category,
        item.make,
        item.model,
        item.location,
        item.hours,
        item.price,
        item.year,
        item.description,
        item.publicData?.description,
        item.publicData?.details
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const ixState = ixiCardState[id] || {
        color: "none",
        outline: 1
      };

      const matchesSearch =
        !q || searchableText.includes(q);

     const matchesIxiColor =
  ixiColorFilters.length === 0 ||
  ixiColorFilters.includes(ixState.color);

     const yearValue = Number(item.year || item.publicData?.year || 0);
const priceValue = Number(String(item.price || "").replace(/[^0-9]/g, ""));
const hoursValue = Number(String(item.hours || "").replace(/[^0-9]/g, ""));

const matchesWorkspaceRanges =
  (!workspaceFilters.yearMin || yearValue >= Number(workspaceFilters.yearMin)) &&
  (!workspaceFilters.yearMax || yearValue <= Number(workspaceFilters.yearMax)) &&
  (!workspaceFilters.priceMin || priceValue >= Number(workspaceFilters.priceMin)) &&
  (!workspaceFilters.priceMax || priceValue <= Number(workspaceFilters.priceMax)) &&
  (!workspaceFilters.hoursMin || hoursValue >= Number(workspaceFilters.hoursMin)) &&
  (!workspaceFilters.hoursMax || hoursValue <= Number(workspaceFilters.hoursMax));

const matchesIxiOutline =
  ixiOutlineFilter === "all" ||
  String(ixState.outline) === String(ixiOutlineFilter);

return (
  matchesSearch &&
  matchesWorkspaceRanges &&
  matchesIxiColor &&
  matchesIxiOutline
);
    });
  }, [
   searchQuery,
  savedListings,
  savedBoardMode,
  savedBoardListings,

  workspaceFilters,

  ixiCardState,
  ixiColorFilters,
  ixiOutlineFilter
  ]);

  function updateIxiCardState(listingId, patch) {
    setIxiCardState(current => ({
      ...current,
      [String(listingId)]: {
        color: "none",
        outline: 1,
        ...(current[String(listingId)] || {}),
        ...patch
      }
    }));
  }

 function toggleColorFilter(color) {
  setIxiColorFilters(current => {
    if (current.includes(color)) {
      return current.filter(item => item !== color);
    }

    return [...current, color];
  });
}

  function toggleOutlineFilter(outline) {
    setIxiOutlineFilter(current =>
      String(current) === String(outline)
        ? "all"
        : String(outline)
    );
  }

  function moveListingToSlot(dragId, targetId) {
    if (!dragId || !targetId || dragId === targetId) return;

    setSavedBoardMode("custom");

    setSavedBoardListings(current => {
      const source = current.length
  ? current
  : workspaceListings;

      const fromIndex = source.findIndex(
        item => String(getListingId(item)) === String(dragId)
      );

      const toIndex = source.findIndex(
        item => String(getListingId(item)) === String(targetId)
      );

      if (fromIndex === -1 || toIndex === -1) return source;

      const next = [...source];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);

      return next;
    });
  }

 function handleBoardDragStart(listing, event) {
  const id = String(getListingId(listing));

  setDraggingListingId(id);

  if (event?.dataTransfer) {
    event.dataTransfer.setData("text/plain", id);
  }
}

  function handleBoardDragOver(listing) {
    const targetId = String(getListingId(listing));

    if (!draggingListingId || draggingListingId === targetId) return;

    setGhostListingId(targetId);
  }

  function handleBoardDragEnd(event) {
  const dragId = draggingListingId;

  const dropTarget = event
    ? document.elementFromPoint(event.clientX, event.clientY)
    : null;

  const stackEl = dropTarget?.closest?.("[data-active-stack]");

  if (dragId && stackEl) {
    addListingToActiveStack(
      stackEl.getAttribute("data-active-stack"),
      dragId
    );

    setDraggingListingId("");
    setGhostListingId("");
    return;
  }

  const targetId = ghostListingId;

  if (dragId && targetId) {
    moveListingToSlot(dragId, targetId);
  }

  setDraggingListingId("");
  setGhostListingId("");
}

  function sendListingToFront(listing) {
    const listingId = getListingId(listing);

    setSavedBoardMode("custom");

    setSavedBoardListings(current => {
      const source = current.length
  ? current
  : workspaceListings;

      const target = source.find(
        item => String(getListingId(item)) === String(listingId)
      );

      const rest = source.filter(
        item => String(getListingId(item)) !== String(listingId)
      );

      return target ? [target, ...rest] : source;
    });
  }

  function sendListingToBack(listing) {
    const listingId = getListingId(listing);

    setSavedBoardMode("custom");

    setSavedBoardListings(current => {
     const source = current.length
  ? current
  : workspaceListings;
      
      const target = source.find(
        item => String(getListingId(item)) === String(listingId)
      );

      const rest = source.filter(
        item => String(getListingId(item)) !== String(listingId)
      );

      return target ? [...rest, target] : source;
    });
  }

  async function toggleSave(listing) {
    if (!sdk) {
      window.location.href = "/login";
      return;
    }

    try {
      const result = await toggleSavedListing({
        sdk,
        listing
      });

      setSavedIds(result.savedIds);

      setSavedBoardListings(current =>
        current.filter(
          item =>
            String(getListingId(item)) !==
            String(getListingId(listing))
        )
      );
    } catch (err) {
      console.error("Save failed", err);
    }
  }

function toggleActiveStack(stackKey) {
  setActiveStacksOpen(current => ({
    ...current,
    [stackKey]: !current[stackKey]
  }));
}

function saveActiveStack(stackKey) {
  setActiveStacks(current => ({
    ...current,
    [stackKey]: []
  }));

  setActiveStacksOpen(current => ({
    ...current,
    [stackKey]: false
  }));
}

function addListingToActiveStack(stackKey, listingId) {
  if (!listingId) return;

  setActiveStacksOpen(current => ({
    ...current,
    [stackKey]: true
  }));

  setActiveStacks(current => {
    const existing = current[stackKey] || [];

    if (existing.includes(String(listingId))) {
      return current;
    }

    return {
      ...current,
      [stackKey]: [...existing, String(listingId)]
    };
  });
}
  
  
  return (
    <>
      <Head>
        <title>IXI Workspace | IronXchange</title>

        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
          rel="stylesheet"
        />
      </Head>

      <Navbar />

      <main>
        <section className="workspace-head">
          <div>
            <span className="eyebrow">IXI WORKSPACE</span>

           <h1></h1>
          </div>

          <div className="count-pill">
            {visibleSavedListings.length} / {workspaceListings.length}
          </div>
        </section>

        <section className="workspace-controls">
          <IXSearchSurface
  searchQuery={searchQuery}
  setSearchQuery={setSearchQuery}
  filters={workspaceFilters}
  setFilters={setWorkspaceFilters}
  sortMode={savedBoardMode}
  setSortMode={setSavedBoardMode}
/>

          <div className="ixi-toolbar">
            <button
              type="button"
              className={`ixi-color-filter color-none ${ixiColorFilters.includes("none") ? "active" : ""}`}
              onClick={() => toggleColorFilter("none")}
            />

            <button
              type="button"
              className={`ixi-color-filter color-green ${ixiColorFilters.includes("green") ? "active" : ""}`}
              onClick={() => toggleColorFilter("green")}
            />

            <button
              type="button"
             className={`ixi-color-filter color-yellow ${ixiColorFilters.includes("yellow") ? "active" : ""}`}
              onClick={() => toggleColorFilter("yellow")}
            />

            <button
              type="button"
              className={`ixi-color-filter color-red ${ixiColorFilters.includes("red") ? "active" : ""}`}
              onClick={() => toggleColorFilter("red")}
            />

            <button
              type="button"
              className={`ixi-color-filter color-cyan ${ixiColorFilters.includes("cyan") ? "active" : ""}`}
              onClick={() => toggleColorFilter("cyan")}
            />

            <button
              type="button"
              className={`ixi-color-filter color-white ${ixiColorFilters.includes("white") ? "active" : ""}`}
              onClick={() => toggleColorFilter("white")}
            />

            <button
              type="button"
              className={`ixi-color-filter color-blue ${ixiColorFilters.includes("blue") ? "active" : ""}`}
              onClick={() => toggleColorFilter("blue")}
            />

            <button
              type="button"
              className={`ixi-color-filter color-orange ${ixiColorFilters.includes("orange") ? "active" : ""}`}
              onClick={() => toggleColorFilter("orange")}
            />

            <button
              type="button"
              className={`ixi-thickness-filter thin ${String(ixiOutlineFilter) === "1" ? "active" : ""}`}
              onClick={() => toggleOutlineFilter(1)}
            />

            <button
              type="button"
              className={`ixi-thickness-filter medium ${String(ixiOutlineFilter) === "3" ? "active" : ""}`}
              onClick={() => toggleOutlineFilter(3)}
            />

            <button
              type="button"
              className={`ixi-thickness-filter thick ${String(ixiOutlineFilter) === "5" ? "active" : ""}`}
              onClick={() => toggleOutlineFilter(5)}
            />
          </div>
        </section>

<section className="active-stack-zone">
  {["top", "bottom"].map(stackKey => (
    <div
  key={stackKey}
  data-active-stack={stackKey}
  className={`active-stack ${activeStacksOpen[stackKey] ? "open" : ""}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();

        const droppedId =
          e.dataTransfer.getData("text/plain") ||
          draggingListingId;

        addListingToActiveStack(stackKey, droppedId);
      }}
    >
      <button
        type="button"
        className="active-stack-dash"
        onClick={() => toggleActiveStack(stackKey)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();

          const droppedId =
            e.dataTransfer.getData("text/plain") ||
            draggingListingId;

          addListingToActiveStack(stackKey, droppedId);
        }}
      />

      {activeStacksOpen[stackKey] && (
        <div
          className="active-stack-tray"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();

            const droppedId =
              e.dataTransfer.getData("text/plain") ||
              draggingListingId;

            addListingToActiveStack(stackKey, droppedId);
          }}
        >
          <div className="active-stack-dropzone">
            {(activeStacks[stackKey] || []).map(machineId => {
              const machine = workspaceListings.find(
                item => String(getListingId(item)) === String(machineId)
              );

              return (
                <div key={machineId} className="active-stack-chip">
                  {machine?.title || machineId}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="active-stack-save"
            onClick={() => saveActiveStack(stackKey)}
          />
        </div>
      )}
    </div>
  ))}
</section>
              
        <section
          className={`cards ${
            visibleSavedListings.length === 1 ? "single-card" : ""
          }`}
        >
          {visibleSavedListings.map(item => {
            const id = String(getListingId(item));

            return (
              <ListingCard
                key={id}
                listing={item}
                saved={savedIds.includes(id)}
                onToggleSaved={() => toggleSave(item)}
                from="saved"

                ixiState={
                  ixiCardState[id] || {
                    color: "none",
                    outline: 1
                  }
                }

                onIxiStateChange={updateIxiCardState}

                onSendFront={sendListingToFront}
                onSendBack={sendListingToBack}

                isBoardDraggingCard={
                  String(id) === String(draggingListingId)
                }

                isGhostTarget={
                  String(id) === String(ghostListingId)
                }

                onBoardDragStart={handleBoardDragStart}
                onBoardDragOver={handleBoardDragOver}
                onBoardDragEnd={handleBoardDragEnd}
              />
            );
          })}
        </section>

        {visibleSavedListings.length === 0 && (
          <div className="empty">
            <h3>No saved machines found.</h3>
            <p>
              Save machines from Browse, then work them here inside the IXI Workspace.
            </p>
          </div>
        )}
      </main>

      <Footer />

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        :global(body) {
          margin: 0;
          font-family: Arial, sans-serif;
          background: #0b0b0b;
          color: #d6d6d6;
        }

        main {
           min-height: 72vh;
  padding: 14px 5% 58px;
          background:
            radial-gradient(circle at 50% 0%, rgba(255,196,0,.05), transparent 34%),
            linear-gradient(180deg, rgba(255,255,255,.014), rgba(255,255,255,0)),
            #0b0b0b;
        }

        .workspace-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 18px;
          margin: 0 auto 18px;
          max-width: 1320px;
        }

        .eyebrow {
          display: inline-block;
          margin-bottom: 8px;
          color: rgba(255,196,0,.72);
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .9px;
        }

        .workspace-head h1 {
          margin: 0;
          color: #f2f2f2;
          font-size: 30px;
          font-weight: 950;
          letter-spacing: -.55px;
        }

        .workspace-head p {
          margin: 8px 0 0;
          color: rgba(255,255,255,.42);
          font-size: 13px;
        }

        .count-pill {
          min-width: 112px;
          height: 30px;
          padding: 0 12px;

          display: flex;
          align-items: center;
          justify-content: center;

          border: 1px solid rgba(255,196,0,.14);
          border-radius: 999px;

          background:
            linear-gradient(180deg, rgba(255,196,0,.045), rgba(255,196,0,0)),
            rgba(10,10,10,.86);

          color: rgba(255,255,255,.52);

          font-size: 10px;
          font-weight: 950;
          letter-spacing: .45px;
        }

        .workspace-controls {
          max-width: 640px;
          margin: 0 auto 30px;
          padding: 7px;

          border: 1px solid rgba(255,255,255,.045);
          border-radius: 14px;

          background:
            linear-gradient(180deg, rgba(255,196,0,.035), rgba(255,196,0,0)),
            rgba(8,8,8,.72);

          box-shadow:
            0 12px 30px rgba(0,0,0,.24);
        }

    .ixi-toolbar {
  width: 600px;
  max-width: 100%;

  margin: 18px auto 0;
  position: relative;
  left: 10px;
  
  padding: 0;

  display: grid;

  grid-template-columns:
    repeat(8, 1fr)
    repeat(3, 1fr);

  justify-content: center;
  align-items: center;

  gap: 4px;
}

        .ixi-toolbar button {
          border: none;
          background: transparent;
          padding: 0;
          cursor: pointer;
        }

        .ixi-toolbar button:hover {
          transform: translateY(-1px);

          box-shadow:
            0 0 0 1px rgba(255,255,255,.03),
            0 0 8px rgba(255,196,0,.10);
        }

        .ixi-color-filter.active,
        .ixi-thickness-filter.active {
          box-shadow:
            0 0 0 1px rgba(255,196,0,.08),
            0 0 12px rgba(255,196,0,.18);

          border-color: rgba(255,196,0,.24) !important;
        }

        .ixi-color-filter {
          width: 20px !important;
          height: 8px !important;
          border: 1px solid rgba(255,255,255,.055) !important;
          border-radius: 1px !important;
          padding: 0 !important;

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.025),
            inset 0 -1px 0 rgba(0,0,0,.32);
        }

        .ixi-color-filter.color-none {
          background: rgba(255,255,255,.035) !important;
        }

        .ixi-color-filter.color-green {
          background: rgba(56,161,105,.42) !important;
        }

        .ixi-color-filter.color-yellow {
          background: rgba(255,196,0,.42) !important;
        }

        .ixi-color-filter.color-red {
          background: rgba(229,62,62,.42) !important;
        }

        .ixi-color-filter.color-cyan {
          background: rgba(0,194,255,.42) !important;
        }

        .ixi-color-filter.color-white {
          background: rgba(255,255,255,.34) !important;
        }

        .ixi-color-filter.color-blue {
          background: rgba(49,130,206,.42) !important;
        }

        .ixi-color-filter.color-orange {
          background: rgba(249,133,18,.42) !important;
        }

        .ixi-thickness-filter {
  width: 24px;
  height: 14px;
  border: 1px solid rgba(255,255,255,.055) !important;
  border-radius: 3px;
  background: rgba(255,255,255,.018) !important;
  position: relative;

  margin-left: -2px;
  margin-right: -2px;
}
        .ixi-thickness-filter::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 15px;
  transform: translate(-50%, -50%);
  background: rgba(255,255,255,.28);
}

        .ixi-thickness-filter.thin::after {
          height: 1px;
        }

        .ixi-thickness-filter.medium::after {
          height: 3px;
        }

        .ixi-thickness-filter.thick::after {
          height: 5px;
        }

.active-stack-zone {
  max-width: 1320px;
  margin: -10px auto 22px;
  display: grid;
  gap: 6px;
  align-items: start;
}

.active-stack {
  width: 100%;
}

.active-stack-dash {
  width: 10px;
  height: 8px;

  display: block;

  border: 0;
  border-bottom: 3px solid rgba(255,255,255,.12);

  background: transparent;

  cursor: pointer;
  padding: 0;
  margin: 0;
}

.active-stack-dash:hover {
  border-bottom-color: rgba(255,196,0,.38);
  box-shadow: 0 3px 8px rgba(255,196,0,.10);
}

.active-stack.open .active-stack-dash {
  border-bottom-color: rgba(255,196,0,.26);
}

.active-stack-tray {
  width: 600px;
  min-height: 82px;

  margin: 8px 0 8px 0;
  padding: 10px 38px 10px 10px;

  border: 1px dashed rgba(255,255,255,.075);
  border-radius: 10px;

  background:
    linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0)),
    rgba(8,8,8,.72);

  position: relative;
}

.active-stack-dropzone {
  min-height: 60px;
}

.active-stack-save {
  position: absolute;
  right: 8px;
  top: 8px;

  width: 18px;
  height: 18px;

  border: 1px solid rgba(255,196,0,.26);
  border-radius: 50%;

  background: rgba(255,196,0,.045);
  color: rgba(255,196,0,.86);

  font-size: 14px;
  font-weight: 900;
  line-height: 14px;

  cursor: pointer;
  padding: 0;
}

        .cards {
          max-width: 1320px;
          margin: 0 auto;

          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 300px));
          gap: 22px;
          align-items: start;
          justify-content: center;
        }

        .cards.single-card {
          grid-template-columns: minmax(250px, 300px);
          justify-content: center;
        }

        .empty {
          max-width: 520px;
          margin: 38px auto 0;
          padding: 38px 28px;

          text-align: center;

          border: 1px solid rgba(255,255,255,.06);
          border-radius: 14px;

          background:
            linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0)),
            #111;

          box-shadow:
            0 14px 34px rgba(0,0,0,.18);
        }

        .empty h3 {
          margin: 0 0 8px;
          color: #f2f2f2;
          font-size: 16px;
          font-weight: 950;
        }

        .empty p {
          margin: 0;
          color: rgba(255,255,255,.42);
          font-size: 12px;
        }

        @media (max-width: 850px) {
          main {
            padding: 28px 4% 48px;
          }

          .workspace-head {
            align-items: flex-start;
            flex-direction: column;
          }

          .workspace-head h1 {
            font-size: 25px;
          }

          .count-pill {
            align-self: flex-start;
          }

          .cards {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
