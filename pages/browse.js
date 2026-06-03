import ListingCard from "../components/ListingCard";
import { getListingId } from "../lib/listingFormatters";
import { captureIXEvent } from "../lib/posthog";

import IXSearchSurface from "../components/IXSearchSurface";
import IXIRelationshipControls from "../components/IXIRelationshipControls";

import {
  fetchCurrentUserWithSavedListings,
  getSavedListingIdsFromUser,
  toggleSavedListing
} from "../lib/savedListings";

import {
  getV12CategoryNames,
  getV12Makes,
  getV12Models
} from "../lib/v12TaxonomyAdapter";

import IXIEnvironmentRail from "../components/IXIEnvironmentRail";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Head from "next/head";
import { useMemo, useState, useEffect } from "react";
import featureKeywords from "../lib/featureKeywords";

import {
  fetchIxiMachineState,
  saveIxiMachinePatch
} from "../lib/ixiMachineStateClient";
const BRAND_YELLOW = "#FFC400";

const categories = [
  "ALL CATEGORIES",
  ...getV12CategoryNames()
];

function taxonomyKey(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/&/g, "AND")
    .replace(/\//g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ");
}

function hasActiveIxiRelationship(state = {}) {
  return (
    (state?.color && state.color !== "none") ||
    Number(state?.outline) > 1 ||
    state?.saved === true ||
    state?.pinned === true ||
    state?.noted === true
  );
}

function formatKeywordLabel(keyword = "") {
  return String(keyword)
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
}

function getListingKeywords(item = {}) {
  const raw =
    item?.keywords ||
    item?.tags ||
    item?.publicData?.keywords ||
    item?.attributes?.publicData?.keywords ||
    [];

  if (Array.isArray(raw)) {
    return raw
      .filter(Boolean)
      .map(formatKeywordLabel);
  }

  if (typeof raw === "string") {
    return raw
      .split(",")
      .map(formatKeywordLabel)
      .filter(Boolean);
  }

  return [];
}

function inferFeatureLine(item = {}) {
  const text = [
    item.title,
    item.description,
    item.publicData?.description,
    item.publicData?.details
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return featureKeywords
    .filter(feature => feature.match.some(term => text.includes(term)))
    .map(feature => feature.label);
}

function getFeatureLine(item = {}) {
  const selectedKeywords = getListingKeywords(item);

  const features =
    selectedKeywords.length > 0
      ? selectedKeywords
      : inferFeatureLine(item);

  return [...new Set(features)].slice(0, 4).join(" • ");
}

function cleanMachineTitle(title = "") {
  return String(title)
    .replace(/\s*[-–]?\s*\d{1,5}(,\d{3})*\s*(HRS|Hrs|hrs|Hours|hours)\b/g, "")
    .replace(/\s*[-–]\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toNumber(value) {
  const raw = String(value || "").replace(/[^0-9]/g, "");
  return raw ? Number(raw) : null;
}

function formatHours(value) {
  const num = toNumber(value);

  return num
    ? `${num.toLocaleString()} hrs`
    : "";
}

function matchesRange(value, min, max) {
  const num = toNumber(value);
  const low = toNumber(min);
  const high = toNumber(max);

  if (low !== null && (num === null || num < low)) return false;
  if (high !== null && (num === null || num > high)) return false;

  return true;
}

function getListingYear(item = {}) {
  return toNumber(
    item.year ||
    item.quickFacts?.year ||
    item.facts?.year ||
    item.publicData?.year ||
    item.attributes?.publicData?.year
  );
}

function sortListings(listings, sortMode) {
  const sorted = [...listings];

  sorted.sort((a, b) => {
  if (sortMode === "price-low") return (toNumber(a.price) || 0) - (toNumber(b.price) || 0);
  if (sortMode === "price-high") return (toNumber(b.price) || 0) - (toNumber(a.price) || 0);
  if (sortMode === "hours-low") return (toNumber(a.hours) || 0) - (toNumber(b.hours) || 0);
  if (sortMode === "hours-high") return (toNumber(b.hours) || 0) - (toNumber(a.hours) || 0);

  if (sortMode === "newest") return (getListingYear(b) || 0) - (getListingYear(a) || 0);
  if (sortMode === "year-new") return (getListingYear(b) || 0) - (getListingYear(a) || 0);
  if (sortMode === "year-old") return (getListingYear(a) || 0) - (getListingYear(b) || 0);

  return 0;
});

  return sorted;
}

export default function Browse() {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("ALL CATEGORIES");
  const [make, setMake] = useState("ALL MAKES");
  const [model, setModel] = useState("ALL MODELS");
  const [liveListings, setLiveListings] = useState([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [sdk, setSdk] = useState(null);
  const [savedIds, setSavedIds] = useState([]);
  const [sortMode, setSortMode] = useState("newest");
  const [draggingListingId, setDraggingListingId] = useState("");
  const [ghostListingId, setGhostListingId] = useState("");

  const [ixiCardState, setIxiCardState] = useState({});
  const [ixiUserId, setIxiUserId] = useState("guest");
 const [activeColorStacks, setActiveColorStacks] = useState([]);
  const [ixiOutlineFilter, setIxiOutlineFilter] = useState("all");
  const [relationshipUnlocked, setRelationshipUnlocked] = useState(false);
  
  const [filters, setFilters] = useState({
  yearMin: "",
  yearMax: "",
  priceMin: "",
  priceMax: "",
  hoursMin: "",
  hoursMax: ""
});

const ixSearchFilters = {
  category,
  make,
  model,
  ...filters
};

function setIxSearchFilters(next) {
  setCategory(next.category || "ALL CATEGORIES");
  setMake(next.make || "ALL MAKES");
  setModel(next.model || "ALL MODELS");

  setFilters({
    yearMin: next.yearMin || "",
    yearMax: next.yearMax || "",
    priceMin: next.priceMin || "",
    priceMax: next.priceMax || "",
    hoursMin: next.hoursMin || "",
    hoursMax: next.hoursMax || ""
  });
}
  
  useEffect(() => {
  captureIXEvent("browse_viewed", {
    page: "browse"
  });
}, []);

useEffect(() => {
  if (typeof window === "undefined") return;

  const unlockUntil = Number(
    localStorage.getItem("ixiRelationshipUnlockUntil") || 0
  );

  if (unlockUntil > Date.now()) {
    setRelationshipUnlocked(true);
  }
}, []);  
  

  useEffect(() => {
    fetch("/api/listings")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLiveListings(data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
  async function checkAuth() {
    try {
      const SharetribeSdk = await import("sharetribe-flex-sdk");

      const sdkInstance = SharetribeSdk.createInstance({
  clientId: process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
});

setSdk(sdkInstance);

const currentUser = await fetchCurrentUserWithSavedListings(sdkInstance);

const userId =
  currentUser?.id?.uuid ||
  currentUser?.id ||
  "guest";

setIxiUserId(String(userId));

const remoteIxiState = await fetchIxiMachineState(String(userId));

setIxiCardState(remoteIxiState);

setSavedIds(
  getSavedListingIdsFromUser(currentUser)
);

setLoggedIn(true);
    } catch {
      setLoggedIn(false);
    }
  }

  checkAuth();
}, []);
  
const availableMakes = useMemo(() => {
  if (category === "ALL CATEGORIES") {
    const makes = liveListings
      .map(item => item.make)
      .filter(Boolean);

    return ["ALL MAKES", ...Array.from(new Set(makes)).sort()];
  }

  return ["ALL MAKES", ...getV12Makes(category)];
}, [liveListings, category]);

const availableModels = useMemo(() => {
  if (make === "ALL MAKES") {
    const models = liveListings
      .filter(item =>
        category === "ALL CATEGORIES" ||
        String(item.type || item.category || "").toUpperCase() === category
      )
      .map(item => item.model)
      .filter(Boolean);

    return ["ALL MODELS", ...Array.from(new Set(models)).sort()];
  }

  return ["ALL MODELS", ...getV12Models(category, make)];
}, [liveListings, category, make]);

  const filteredListings = useMemo(() => {
  const q = searchQuery.trim().toLowerCase();

  const filtered = liveListings.filter(item => {
    const listingStatus =
  item.listingStatus ||
  item.publicData?.listingStatus ||
  item.attributes?.publicData?.listingStatus;

const isArchived = listingStatus === "archived";
    
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
      ...(getListingKeywords(item) || [])
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !q || searchableText.includes(q);

  const listingCategory =
  item.category ||
  item.type ||
  item.publicData?.category ||
  item.attributes?.publicData?.category ||
  "";

const listingMake =
  item.make ||
  item.publicData?.make ||
  item.attributes?.publicData?.make ||
  "";

const listingModel =
  item.model ||
  item.publicData?.model ||
  item.attributes?.publicData?.model ||
  "";

const matchesCategory =
  category === "ALL CATEGORIES" ||
  taxonomyKey(listingCategory) ===
    (ixSearchFilters.categoryKey || taxonomyKey(category));
    
const matchesMake =
  make === "ALL MAKES" ||
  String(listingMake).trim().toUpperCase() ===
    String(make).trim().toUpperCase();

const matchesModel =
  model === "ALL MODELS" ||
  String(listingModel).trim().toUpperCase() ===
    String(model).trim().toUpperCase();

    const ixState = ixiCardState[String(getListingId(item))] || {
  color: "none",
  outline: 1
};

const matchesIxiOutline =
  ixiOutlineFilter === "all" ||
  String(ixState.outline) === String(ixiOutlineFilter);

return (
  !isArchived &&
  matchesSearch &&
  matchesCategory &&
  matchesMake &&
  matchesModel &&
  matchesIxiOutline &&
  matchesRange(getListingYear(item), filters.yearMin, filters.yearMax) &&
  matchesRange(item.price, filters.priceMin, filters.priceMax) &&
  matchesRange(item.hours, filters.hoursMin, filters.hoursMax)
);
  });

  if (sortMode === "custom") {
  return filtered;
}

return sortListings(filtered, sortMode);
}, [
  searchQuery,
  category,
  make,
  model,
  liveListings,
  filters,
  sortMode,

  ixiCardState,
  ixiOutlineFilter 
]);

function unlockIxiRelationship() {
  setRelationshipUnlocked(true);

  if (typeof window !== "undefined") {
    localStorage.setItem(
      "ixiRelationshipUnlockUntil",
      String(Date.now() + 5 * 60 * 1000)
    );
  }
}
  
function updateIxiCardState(listingId, patch) {
  if (hasActiveIxiRelationship(patch)) {
  unlockIxiRelationship();
}

  const id = String(listingId);

  setIxiCardState(current => {
    const nextRecord = {
      color: "none",
      outline: 1,

      ...(current[id] || {}),

      ...patch,

      touched: true,
      updatedAt: Date.now()
    };

    saveIxiMachinePatch({
      userId: ixiUserId,
      listingId: id,
      patch: nextRecord
    });

    return {
      ...current,
      [id]: nextRecord
    };
  });
}

  const raisedStackListings = useMemo(() => {
  if (activeColorStacks.length === 0) return [];

  return filteredListings.filter(item => {
    const id = String(getListingId(item));

    const ixState = ixiCardState[id] || {
      color: "none",
      outline: 1
    };

    return activeColorStacks.includes(ixState.color);
  });
}, [
  activeColorStacks,
  filteredListings,
  ixiCardState
]);

function toggleColorStack(color) {
  if (color === "none") {
    setActiveColorStacks([]);
    return;
  }

  setActiveColorStacks(current =>
    current.includes(color)
      ? current.filter(item => item !== color)
      : [...current, color]
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

  setSortMode("custom");

  setLiveListings(current => {
    const fromIndex = current.findIndex(
      item => String(getListingId(item)) === String(dragId)
    );

    const toIndex = current.findIndex(
      item => String(getListingId(item)) === String(targetId)
    );

    if (fromIndex === -1 || toIndex === -1) return current;

    const next = [...current];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);

    return next;
  });
}

function handleBoardDragStart(listing) {
  setDraggingListingId(String(getListingId(listing)));
}

function handleBoardDragOver(listing) {
  const targetId = String(getListingId(listing) || listing.id);

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

  setLiveListings(current => {
    const target = current.find(
      item => String(getListingId(item)) === String(listingId)
    );

    const rest = current.filter(
      item => String(getListingId(item)) !== String(listingId)
    );

    return target ? [target, ...rest] : current;
  });

  setSortMode("custom");
}

function sendListingToBack(listing) {
  const listingId = getListingId(listing);

  setLiveListings(current => {
    const target = current.find(
      item => String(getListingId(item)) === String(listingId)
    );

    const rest = current.filter(
      item => String(getListingId(item)) !== String(listingId)
    );

    return target ? [...rest, target] : current;
  });

  setSortMode("custom");
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
  } catch (err) {
    console.error("Save failed", err);
  }
}
  
  return (
    <>
  <Head>
  <title>Browse Equipment | IronXchange</title>

  <meta
    name="description"
    content="Browse heavy equipment for sale on IronXchange."
  />

  <link
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
    rel="stylesheet"
  />
</Head>
      
    <Navbar />
      
   <section className="search-section">
  <IXIEnvironmentRail
  activeEnvironment="IXI MARKETPLACE"
  hasAccount={loggedIn}
 hasRelationship={
  relationshipUnlocked ||
  Object.values(ixiCardState || {}).some(state =>
    (state?.color && state.color !== "none") ||
    Number(state?.outline) > 1
  )
}
  hasInventory={loggedIn}
/>

 <div className="browse-search-shell">

<IXSearchSurface
  searchQuery={searchQuery}
  setSearchQuery={setSearchQuery}
  filters={ixSearchFilters}
  setFilters={setIxSearchFilters}
  sortMode={sortMode}
  setSortMode={setSortMode}
  listings={liveListings}
  hasRelationship={relationshipUnlocked}
/>

<IXIRelationshipControls
  ixiCardState={ixiCardState}
  activeColors={activeColorStacks}
  onToggleColor={toggleColorStack}
  activeOutline={ixiOutlineFilter}
  onToggleOutline={toggleOutlineFilter}
/>

</div>


</section>

<section className="featured">
        <div className="section-head">
          <h2></h2>

          <span>
            {filteredListings.length} LISTINGS
          </span>
        </div>

{activeColorStacks.length > 0 && (
  <div className="raised-stack-section">
    <div className="raised-stack-head">
      <h3>
        ACTIVE STACK
      </h3>

      <span>
        {raisedStackListings.length} MACHINES
      </span>
    </div>

    <div className="raised-stack-grid">
      {raisedStackListings.map((item) => {
        const id = String(getListingId(item));

        return (
          <ListingCard
            key={`stack-${id}`}
            listing={item}
            saved={savedIds.includes(id)}
            onToggleSaved={() => toggleSave(item)}

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
    </div>
  </div>
)}
    
<div
  className={`browse-grid ${
    filteredListings.length === 1 ? "single-card" : ""
  }`}
>
  {filteredListings.map((item) => {
    const id = String(getListingId(item));

    return (
  <ListingCard
    key={id}
    listing={item}
    saved={savedIds.includes(id)}
    onToggleSaved={() => toggleSave(item)}

    ixiState={
      ixiCardState[String(id)] || {
        color: "none",
        outline: 1
      }
    }

    onIxiStateChange={
      updateIxiCardState
    }

    onSendFront={
      sendListingToFront
    }

    onSendBack={
      sendListingToBack
    }

    isBoardDraggingCard={
      String(id) ===
      String(draggingListingId)
    }

    isGhostTarget={
      String(id) ===
      String(ghostListingId)
    }

    onBoardDragStart={
      handleBoardDragStart
    }

    onBoardDragOver={
      handleBoardDragOver
    }

    onBoardDragEnd={
      handleBoardDragEnd
    }
  />
);
  })}

  {filteredListings.length === 0 && (
    <div className="empty">
      <h3>No listings found.</h3>
      <p>Try another category or search term.</p>
    </div>
  )}
</div>

</section>

        <Footer />

  <style jsx>{`
* {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #0B0B0B;
  color: #D6D6D6;
}

.browse-search-shell {
  max-width: 700px;
  margin: 24px auto 0;
  padding: 18px;
  background:
  
    linear-gradient(
      180deg,
      rgba(255,196,0,.035),
      rgba(255,196,0,0)
    ),
    rgba(8,8,8,.72);

  border: 1px solid rgba(255,255,255,.045);

  border-radius: 14px;

  box-shadow:
    0 12px 30px rgba(0,0,0,.24);
}

.search-section {
  padding: 30px 5% 26px;
  background:
    linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0)),
    #0b0b0b;
  text-align: center;
  border-bottom: 1px solid rgba(255,255,255,.045);
}

.search-section h1 {
  margin: 0 0 6px;
  color: rgba(255,255,255,.62);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: .45px;
  text-transform: uppercase;
}

.search-section p {
  color: rgba(255,255,255,.38);
  margin: 7px 0 0;
  font-size: 13px;
}

.search-top-row {
  margin: 0 0 6px;

  display: grid;

grid-template-columns:
  170px
  135px
  112px
  118px
  66px;

  background: #111;

  border: 1px solid rgba(255,255,255,.045);

  border-radius: 10px;

  overflow: hidden;

  min-height: 34px;
}

.browse-search,
.search-top-row select {
  height: 34px;

   overflow: visible;

  border: none;
  border-right: 1px solid rgba(255,255,255,.05);

  padding: 0 9px;

  background: #111;
  color: rgba(255,255,255,.74);

  font-size: 10.5px;
  font-weight: 700;

  outline: none;
}

.browse-search::placeholder {
  color: rgba(255,255,255,.32);
  font-weight: 600;
}

.search-top-row select,
.sort-select {
  background-color: #121006;
  border-color: rgba(255,196,0,.16);
  color: rgba(255,255,255,.72);

  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  background-image:
    linear-gradient(45deg, transparent 50%, #FFC400 50%),
    linear-gradient(135deg, #FFC400 50%, transparent 50%);

  background-position:
  calc(100% - 11px) 50%,
  calc(100% - 7px) 50%;

  background-size: 5px 5px, 5px 5px;
  background-repeat: no-repeat;

  padding-right: 22px;
}

.browse-search::placeholder {
  color: #777;
}

.search-btn {
  height: 34px;
  width: 100%;

  background: #151515;
  color: #FFC400;

  border: 1px solid #3a2d00;
  border-left: 1px solid #2a2a2a;

  border-radius: 7px;

  font-family: 'Montserrat', sans-serif;
  font-weight: 900;
  font-size: 9px;

  cursor: pointer;

  letter-spacing: .55px;
  text-transform: uppercase;

  box-shadow:
    0 1px 0 rgba(255,255,255,.035) inset;

    margin-left: 4px;
}

.search-btn:hover {
  background: #1a1400;
  border-color: #FFC400;
}

.filter-strip {
  max-width: none;
  margin: 0;
  width: 100%;

  display: flex;
  justify-content: center;
  align-items: stretch;
  gap: 0;
}

.range-group {
  display: grid;
  grid-template-columns: 1fr 1px 1fr;
  align-items: center;

  height: 30px;

  border: 1px solid rgba(255,255,255,.075);
  background: #101010;

  overflow: hidden;
  margin-right: -1px;
}

.range-group:first-child {
  border-radius: 8px 0 0 8px;
}


.range-group span {
  width: 1px;
  height: 58%;
  background: rgba(255,255,255,.08);
}

.range-group input {
  height: 100%;
  min-width: 0;

  border: none;
  padding: 0 10px;

  background: transparent;
  color: rgba(255,255,255,.70);

  font-size: 10px;
  font-weight: 850;
  text-align: center;

  outline: none;
}

.range-group input::placeholder {
  color: rgba(255,255,255,.30);
}

.sort-select {
  height: 28px;
  width: 64px;
  border: 1px solid rgba(255,196,0,.12);
  border-radius: 8px 0 0 8px;
  margin-left: 6px;
  background-color: #121006;
  color: rgba(255,255,255,.66);
  padding: 0 20px 0 7px;
  font-size: 8.5px;
  font-weight: 900;
  outline: none;
  margin-right: -1px;
}

.clear-btn {
  height: 28px;
  width: 64px;
  border: 1px solid rgba(255,196,0,.12);
  border-left: none;
  border-radius: 0 8px 8px 0;
  background: #121006;
  color: rgba(255,255,255,.40);
  font-size: 8.5px;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-top-row select:hover,
.browse-search:hover,
.range-group:hover {
  background-color: #151515;
}

.search-top-row select:focus,
.sort-select:focus,
.browse-search:focus,
.range-group input:focus {
  box-shadow: inset 0 0 0 1px rgba(255,196,0,.16);
}

.sort-select:hover,
.clear-btn:hover {
  background: #1a1400;
  border-color: rgba(255,196,0,.38);
  color: #FFC400;
}






.featured {
  padding: 34px 5% 54px;

  background:
    linear-gradient(180deg, rgba(255,255,255,.012), rgba(255,255,255,0)),
    #0B0B0B;

  color: #D6D6D6;

  border-top: 1px solid rgba(255,255,255,.045);
}

.section-head {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.section-head h2 {
  margin: 0;

  color: #F2F2F2;

  font-size: 18px;
  font-weight: 900;

  letter-spacing: -.25px;

  text-transform: uppercase;
}

.section-head span {
  color: rgba(255,255,255,.36);

  font-size: 10px;
  font-weight: 900;

  letter-spacing: .55px;
  text-transform: uppercase;
}

.browse-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 300px));
  gap: 22px;
  align-items: start;
  justify-content: center;
}

.browse-grid.single-card {
  grid-template-columns: minmax(250px, 300px);
  justify-content: center;
}

.raised-stack-section {
  margin: 0 0 34px;
  padding: 18px;

  border: 1px solid rgba(255,196,0,.10);
  border-radius: 16px;

  background:
    linear-gradient(180deg, rgba(255,196,0,.035), rgba(255,196,0,0)),
    rgba(10,10,10,.82);

  box-shadow:
    0 18px 40px rgba(0,0,0,.24);
}

.raised-stack-head {
  display: flex;
  align-items: center;
  justify-content: space-between;

  margin-bottom: 16px;
}

.raised-stack-head h3 {
  margin: 0;

  color: rgba(255,196,0,.76);

  font-size: 10px;
  font-weight: 950;

  letter-spacing: .75px;
  text-transform: uppercase;
}

.raised-stack-head span {
  color: rgba(255,255,255,.42);

  font-size: 10px;
  font-weight: 950;

  letter-spacing: .55px;
}

.raised-stack-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 300px));
  gap: 22px;
  align-items: start;
  justify-content: center;
}

.empty {
  padding: 46px 28px;

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

  color: #F2F2F2;

  font-size: 16px;
  font-weight: 900;
}

.empty p {
  margin: 0;

  color: rgba(255,255,255,.42);

  font-size: 12px;
}

@media (max-width: 1100px) {
  .browse-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 850px) {

.browse-search-shell {
  max-width: 520px;
}

.search-top-row {
  grid-template-columns: 1fr;
  overflow: hidden;
}

.browse-search,
.search-top-row select {
  width: 100%;
  border-right: none;
  border-bottom: 1px solid rgba(255,255,255,.06);
}

.search-btn {
  width: 100%;
  margin-left: 0;
  border-radius: 0 0 8px 8px;
}

.filter-strip {
  justify-content: flex-start;
  overflow-x: auto;
  padding-bottom: 6px;
}

.range-group,
.sort-select,
.clear-btn {
  flex: 0 0 auto;
}

    .browse-grid {
    grid-template-columns: 1fr;
  }
}
`}</style>
    </>
  );
}
