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

  const [savedBoardMode, setSavedBoardMode] = useState("saved");
  const [savedBoardListings, setSavedBoardListings] = useState([]);

  const [draggingListingId, setDraggingListingId] = useState("");
  const [ghostListingId, setGhostListingId] = useState("");

  const [ixiCardState, setIxiCardState] = useState({});
  const [ixiUserId, setIxiUserId] = useState("guest");
  const [ixiColorFilter, setIxiColorFilter] = useState("all");
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
        ixiColorFilter === "all" ||
        ixState.color === ixiColorFilter;

      const matchesIxiOutline =
        ixiOutlineFilter === "all" ||
        String(ixState.outline) === String(ixiOutlineFilter);

      return (
        matchesSearch &&
        matchesIxiColor &&
        matchesIxiOutline
      );
    });
  }, [
    searchQuery,
    savedListings,
    savedBoardMode,
    savedBoardListings,
    ixiCardState,
    ixiColorFilter,
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
    setIxiColorFilter(current =>
      current === color ? "all" : color
    );
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
        : savedListings;

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

  function handleBoardDragStart(listing) {
    setDraggingListingId(String(getListingId(listing)));
  }

  function handleBoardDragOver(listing) {
    const targetId = String(getListingId(listing));

    if (!draggingListingId || draggingListingId === targetId) return;

    setGhostListingId(targetId);
  }

  function handleBoardDragEnd() {
    const dragId = draggingListingId;
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
        : savedListings;

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
        : savedListings;

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

            <h1>Saved Machines</h1>

            <p>
              Search, sort, color, move, and work your saved equipment board.
            </p>
          </div>

          <div className="count-pill">
            {visibleSavedListings.length} / {savedListings.length} SAVED
          </div>
        </section>

        <section className="workspace-controls">
          <input
            type="text"
            className="workspace-search"
            placeholder="Search saved machines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="ixi-toolbar">
            <button
              type="button"
              className={`ixi-color-filter color-none ${ixiColorFilter === "none" ? "active" : ""}`}
              onClick={() => toggleColorFilter("none")}
            />

            <button
              type="button"
              className={`ixi-color-filter color-green ${ixiColorFilter === "green" ? "active" : ""}`}
              onClick={() => toggleColorFilter("green")}
            />

            <button
              type="button"
              className={`ixi-color-filter color-yellow ${ixiColorFilter === "yellow" ? "active" : ""}`}
              onClick={() => toggleColorFilter("yellow")}
            />

            <button
              type="button"
              className={`ixi-color-filter color-red ${ixiColorFilter === "red" ? "active" : ""}`}
              onClick={() => toggleColorFilter("red")}
            />

            <button
              type="button"
              className={`ixi-color-filter color-cyan ${ixiColorFilter === "cyan" ? "active" : ""}`}
              onClick={() => toggleColorFilter("cyan")}
            />

            <button
              type="button"
              className={`ixi-color-filter color-white ${ixiColorFilter === "white" ? "active" : ""}`}
              onClick={() => toggleColorFilter("white")}
            />

            <button
              type="button"
              className={`ixi-color-filter color-blue ${ixiColorFilter === "blue" ? "active" : ""}`}
              onClick={() => toggleColorFilter("blue")}
            />

            <button
              type="button"
              className={`ixi-color-filter color-orange ${ixiColorFilter === "orange" ? "active" : ""}`}
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
          padding: 38px 5% 58px;
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
          max-width: 690px;
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

        .workspace-search {
          width: 100%;
          height: 36px;

          border: 1px solid rgba(255,255,255,.055);
          border-radius: 10px;

          background: #111;
          color: rgba(255,255,255,.76);

          padding: 0 12px;

          font-size: 11px;
          font-weight: 800;

          outline: none;
        }

        .workspace-search::placeholder {
          color: rgba(255,255,255,.32);
          font-weight: 700;
        }

        .workspace-search:focus {
          box-shadow: inset 0 0 0 1px rgba(255,196,0,.16);
        }

        .ixi-toolbar {
          margin: 7px auto 0;
          padding: 0 3px;

          display: grid;
          grid-template-columns:
            repeat(8, 1fr)
            repeat(3, 1fr);

          align-items: center;
          gap: 6px;
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
