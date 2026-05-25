import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import featureKeywords from "../../lib/featureKeywords";

import {
  getListingId,
  getCardImages,
  getListingHref,
  cleanMachineTitle as formatCleanMachineTitle
} from "../../lib/listingFormatters";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const BRAND_YELLOW = "#FFC400";

const categories = [
  "ALL CATEGORIES",
  "AERIAL EQUIPMENT",
  "AGGREGATE",
  "AGRICULTURE HARVESTERS",
  "AGRICULTURE TRACTORS",
  "ASPHALT EQUIPMENT",
  "BACKHOE LOADERS",
  "COMPACTION/ROLLERS",
  "CRANES",
  "CRAWLER CARRIERS / LOADER",
  "DOZERS",
  "DRILLS & PILING",
  "DUMP TRUCKS - ARTIC/RIGID",
  "EXCAVATORS",
  "FORKLIFTS",
  "MOTOR GRADERS",
  "SCRAPER",
  "SKID STEER/CTL",
  "TELEHANDLERS",
  "TRENCHERS/PLOWS",
  "TRAILERS",
  "TRUCKS",
  "WHEEL LOADERS",
  "ATTACHMENTS / PARTS",
  "OTHER SPECIALTY",
  "SUPPORT EQUIPMENT",
  "UTILITY CARTS"
];


function toNumber(value) {
  const raw = String(value || "").replace(/[^0-9]/g, "");
  return raw ? Number(raw) : null;
}

function formatPriceInput(value) {
  const num = toNumber(value);
  return num ? num.toLocaleString() : "";
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

function getListingKeywords(item = {}) {
  const raw =
    item?.keywords ||
    item?.tags ||
    item?.publicData?.keywords ||
    item?.attributes?.publicData?.keywords ||
    [];

  if (Array.isArray(raw)) return raw.filter(Boolean).map(String);

  if (typeof raw === "string") {
    return raw
      .split(",")
      .map(keyword => keyword.trim())
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
  const features = selectedKeywords.length > 0 ? selectedKeywords : inferFeatureLine(item);

  return [...new Set(features)].slice(0, 4).join(" • ");
}

function sortListings(listings, sortMode) {
  const sorted = [...listings];

  sorted.sort((a, b) => {
    if (sortMode === "price-low") return (toNumber(a.price) || 0) - (toNumber(b.price) || 0);
    if (sortMode === "price-high") return (toNumber(b.price) || 0) - (toNumber(a.price) || 0);
    if (sortMode === "hours-low") return (toNumber(a.hours) || 0) - (toNumber(b.hours) || 0);
    if (sortMode === "hours-high") return (toNumber(b.hours) || 0) - (toNumber(a.hours) || 0);
    if (sortMode === "year-new") return (getListingYear(b) || 0) - (getListingYear(a) || 0);
    if (sortMode === "year-old") return (getListingYear(a) || 0) - (getListingYear(b) || 0);
    return 0;
  });

  return sorted;
}
export default function MyListingsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("ALL CATEGORIES");
  const [sortMode, setSortMode] = useState("newest");
  const [myListings, setMyListings] = useState([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [cardPhotoIndex, setCardPhotoIndex] = useState({});
  const [savingPriceId, setSavingPriceId] = useState("");

  const [workflowFilter, setWorkflowFilter] = useState("all");
  
  const [listingWorkflows, setListingWorkflows] = useState({});
  

  const [filters, setFilters] = useState({
    yearMin: "",
    yearMax: "",
    priceMin: "",
    priceMax: "",
    hoursMin: "",
    hoursMax: ""
  });
  
useEffect(() => {
  async function loadCurrentUserAndListings() {
    try {
      const SharetribeSdk = await import("sharetribe-flex-sdk");

      const sdk = SharetribeSdk.createInstance({
        clientId: process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
      });

      const currentUser = await sdk.currentUser.show();
      const userId = currentUser.data.data.id.uuid;

      setCurrentUserId(userId);

      const response = await fetch(
        `/api/account-listings?authorId=${encodeURIComponent(userId)}`
      );

      const data = await response.json();

      if (Array.isArray(data)) {
        setMyListings(data);
      }
    } catch (error) {
      console.error("MY LISTINGS LOAD ERROR:", error);
      setMyListings([]);
    }
  }

  loadCurrentUserAndListings();
}, []);
  const filteredListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = myListings.filter(item => {
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

      const matchesSearch = !q || searchableText.includes(q);

      const matchesCategory =
        category === "ALL CATEGORIES" ||
        String(item.type || item.category || "").toUpperCase() === category;

      const listingStatus =
  item.listingStatus ||
  item.publicData?.listingStatus ||
  item.attributes?.publicData?.listingStatus ||
  "live";

const isArchived = listingStatus === "archived";

const workflowStatus = getWorkflowStatus(item);

const matchesWorkflow =
  workflowFilter === "all" ||
  (workflowFilter === "active" && !isArchived) ||
  (workflowFilter === "archived" && isArchived) ||
  (workflowFilter === "good-listing" && workflowStatus === "good-listing") ||
  (workflowFilter === "reprice" && workflowStatus === "reprice") ||
  (workflowFilter === "refresh-photos" && workflowStatus === "refresh-photos") ||
  (workflowFilter === "social-blast" && workflowStatus === "social-blast") ||
  (workflowFilter === "review" && workflowStatus === "review");
      
return (
  matchesSearch &&
  matchesCategory &&
  matchesWorkflow &&
  matchesRange(getListingYear(item), filters.yearMin, filters.yearMax) &&
  matchesRange(item.price, filters.priceMin, filters.priceMax) &&
  matchesRange(item.hours, filters.hoursMin, filters.hoursMax)
);
    });

    return sortListings(filtered, sortMode);
  }, [
  searchQuery,
  category,
  myListings,
  filters,
  sortMode,
  workflowFilter
]);

 function changeCardPhoto(e, item, direction) {
  e.preventDefault();
  e.stopPropagation();

  const listingId = getListingId(item);
  const images = getCardImages(item);

  if (!listingId || images.length < 2) return;

  setCardPhotoIndex(current => {
    const currentIndex = current[listingId] || 0;
    const nextIndex = (currentIndex + direction + images.length) % images.length;

    return {
      ...current,
      [listingId]: nextIndex
    };
  });
}

  async function savePrice(e, listing) {
    if (e.key !== "Enter") return;

    e.preventDefault();

    const input = e.currentTarget;
    const newPrice = input.value.replace(/,/g, "").trim();

    if (!listing?.id || !newPrice) return;

    setSavingPriceId(String(listing.id));
    input.classList.remove("saved", "error");

    try {
      const response = await fetch("/api/update-listing-price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          listingId: listing.id,
          price: newPrice
        })
      });

      if (!response.ok) throw new Error("Price update failed");

      input.value = Number(newPrice).toLocaleString();
      input.classList.add("saved");
    } catch {
      input.classList.add("error");
      alert("Price update failed.");
    } finally {
      setSavingPriceId("");
    }
  }

  async function confirmDelete(listing) {
  const ok = window.confirm(
   `Delete this listing?\n\n${formatCleanMachineTitle(listing.title)}\n\nThis cannot be undone.`
  );

  if (!ok) return;

  try {
    const response = await fetch("/api/delete-listing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        listingId: listing.id
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Delete failed");
    }

    setMyListings(current =>
      current.filter(
        item => String(item.id) !== String(listing.id)
      )
    );
  } catch (error) {
    alert(`Delete failed: ${error.message}`);
    console.error("Delete failed:", error);
  }
}

  async function archiveListing(listing) {
  
  const ok = window.confirm(
    `Archive this listing?\n\n${formatCleanMachineTitle(listing.title)}`
  );

  if (!ok) return;

  try {
    const response = await fetch("/api/archive-listing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        listingId: listing.id
      })
    });

    const data = await response.json();

if (!response.ok) {
  throw new Error(data.error || "Archive failed");
}
    setMyListings(current =>
      current.map(item =>
        String(item.id) === String(listing.id)
          ? {
              ...item,
              publicData: {
                ...(item.publicData || {}),
                listingStatus: "archived"
              },
              listingStatus: "archived"
            }
          : item
      )
    );
  } catch (error) {
  alert(`Archive failed: ${error.message}`);
  console.error("Archive failed:", error);
  }
}

 async function reactivateListing(listing) {
  try {
    const response = await fetch("/api/reactivate-listing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        listingId: listing.id
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Reactivate failed");
    }

    setMyListings(current =>
      current.map(item =>
        String(item.id) === String(listing.id)
          ? {
              ...item,
              publicData: {
                ...(item.publicData || {}),
                listingStatus: "live"
              },
              listingStatus: "live"
            }
          : item
      )
    );
  } catch (error) {
    alert(`Reactivate failed: ${error.message}`);
    console.error("Reactivate failed:", error);
  }
} 

function getWorkflowStatus(listing) {
  const listingId = getListingId(listing);

  return (
    listingWorkflows[listingId] ||
    listing.workflowStatus ||
    listing.privateData?.workflowStatus ||
    listing.metadata?.workflowStatus ||
    "good-listing"
  );
}

function updateWorkflowStatus(listing, status) {
  const listingId = getListingId(listing);
  if (!listingId) return;

  setListingWorkflows(current => ({
    ...current,
    [listingId]: status
  }));

  // FUTURE: POSTHOG EVENT
  // posthog.capture("seller_workflow_status_updated", {
  //   listingId,
  //   workflowStatus: status
  // });

  // FUTURE: PERSIST SELLER WORKFLOW
  // Save workflowStatus to seller-private listing workflow storage.
}

  
  return (
    <>
      <Head>
  <title>My Listings | IronXchange</title>

  <link
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
    rel="stylesheet"
  />
</Head>

     <Navbar />

      <section className="search-section">
        <h1>My Listings</h1>

        <p>
          Manage your active IronXchange inventory.
        </p>

       <div className="browse-search-shell">
  <div className="search-top-row">
          <input
            type="text"
            className="browse-search"
            placeholder="Search my inventory..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />

          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            {categories.map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <select
            className="sort-select top-sort"
            value={sortMode}
            onChange={e => setSortMode(e.target.value)}
          >
            <option value="newest">Sort</option>
            <option value="price-low">Price Low → High</option>
            <option value="price-high">Price High → Low</option>
            <option value="hours-low">Hours Low → High</option>
            <option value="hours-high">Hours High → Low</option>
            <option value="year-new">Year Newest</option>
            <option value="year-old">Year Oldest</option>
          </select>

          <a href="/post-free" className="search-btn post-btn">
            SEARCH
          </a>
        </div>

         

              
        <div className="filter-strip">
          <div className="range-group">
            <input
              placeholder="Year Min"
              value={filters.yearMin}
              onChange={e => setFilters({ ...filters, yearMin: e.target.value })}
            />
            <span></span>
            <input
              placeholder="Year Max"
              value={filters.yearMax}
              onChange={e => setFilters({ ...filters, yearMax: e.target.value })}
            />
          </div>

          <div className="range-group">
            <input
              placeholder="Price Min"
              value={filters.priceMin}
              onChange={e => setFilters({ ...filters, priceMin: e.target.value })}
            />
            <span></span>
            <input
              placeholder="Price Max"
              value={filters.priceMax}
              onChange={e => setFilters({ ...filters, priceMax: e.target.value })}
            />
          </div>

          <div className="range-group">
            <input
              placeholder="Hours Min"
              value={filters.hoursMin}
              onChange={e => setFilters({ ...filters, hoursMin: e.target.value })}
            />
            <span></span>
            <input
              placeholder="Hours Max"
              value={filters.hoursMax}
              onChange={e => setFilters({ ...filters, hoursMax: e.target.value })}
            />
          </div>

          <button
            type="button"
            className="clear-btn"
            onClick={() =>
              setFilters({
                yearMin: "",
                yearMax: "",
                priceMin: "",
                priceMax: "",
                hoursMin: "",
                hoursMax: ""
              })
            }
          >
            CLEAR
          </button>
        </div>
              </div>
      </section>


<section className="workflow-filter-shell">
  <button
    type="button"
    className={workflowFilter === "all" ? "active" : ""}
    onClick={() => setWorkflowFilter("all")}
  >
    All
  </button>

  <button
    type="button"
    className={workflowFilter === "good-listing" ? "active" : ""}
    onClick={() => setWorkflowFilter("good-listing")}
  >
    Good Listing
  </button>

  <button
    type="button"
    className={workflowFilter === "reprice" ? "active" : ""}
    onClick={() => setWorkflowFilter("reprice")}
  >
    Reprice
  </button>

  <button
    type="button"
    className={workflowFilter === "refresh-photos" ? "active" : ""}
    onClick={() => setWorkflowFilter("refresh-photos")}
  >
    Refresh Photos
  </button>

  <button
    type="button"
    className={workflowFilter === "social-blast" ? "active" : ""}
    onClick={() => setWorkflowFilter("social-blast")}
  >
    Social Blast
  </button>

  <button
    type="button"
    className={workflowFilter === "review" ? "active" : ""}
    onClick={() => setWorkflowFilter("review")}
  >
    Review
  </button>
</section>

              
      <section className="featured">
        <div className="section-head">
          <h2>MY INVENTORY</h2>
          <span>{filteredListings.length} LISTINGS</span>
        </div>

   <div
  className={`cards ${
    filteredListings.length === 1 ? "single-card" : ""
  }`}
>
  {filteredListings.map(item => {
    const listingId = getListingId(item);
    const cardImages = getCardImages(item);
    const listingHref = getListingHref(item);
    const cleanTitle = formatCleanMachineTitle(item.title);

    const listingStatus =
      item.listingStatus ||
      item.publicData?.listingStatus ||
      item.attributes?.publicData?.listingStatus ||
      "live";

    const isArchived = listingStatus === "archived";
    const currentPhotoIndex = cardPhotoIndex[listingId] || 0;

    return (
      <div
        className={`card seller-card ${isArchived ? "archived-card" : ""}`}
        key={listingId || item.link || item.title}
      >
        <div
          className="card-photo"
          style={{
            backgroundImage: `url(${
              cardImages[currentPhotoIndex] ||
              "/images/hero-equipment-yard.jpg"
            })`
          }}
        />

<div className="workflow-photo-pill">
  <select
    value={getWorkflowStatus(item)}
    onChange={e => updateWorkflowStatus(item, e.target.value)}
  >
    <option value="good-listing">Good Listing</option>
    <option value="reprice">Reprice</option>
    <option value="refresh-photos">Refresh Photos</option>
    <option value="social-blast">Social Blast</option>
    <option value="review">Review</option>
  </select>
</div>

        {cardImages.length > 1 && (
          <>
            <button
              type="button"
              className="card-photo-nav left"
              onClick={e => changeCardPhoto(e, item, -1)}
            >
              ‹
            </button>

            <button
              type="button"
              className="card-photo-nav right"
              onClick={e => changeCardPhoto(e, item, 1)}
            >
              ›
            </button>

            <span className="photo-count">
              {currentPhotoIndex + 1}/{cardImages.length}
            </span>
          </>
        )}

        <div className="card-body">
          <div className="title-row">
            <h3>{cleanTitle}</h3>
            <h3 className="hours-inline">{item.hours}</h3>
          </div>

          <p className="feature-line">{getFeatureLine(item)}</p>

          <div className="seller-price-row">
            <input
              className="price-input"
              defaultValue={formatPriceInput(item.price)}
              onKeyDown={e => savePrice(e, item)}
              disabled={savingPriceId === String(listingId)}
            />

            <span className={`status-pill ${isArchived ? "archived" : ""}`}>
              {isArchived ? "ARCHIVED" : "ACTIVE"}
            </span>
          </div>

          <div className="seller-meta">
            <span>Age: {item.age ?? "—"}</span>
            <span>Views: {item.views || "—"}</span>
            <span>Saves: {item.saves || "—"}</span>
          </div>

          <div className="seller-actions">
            <a href={`/live?id=${listingId}`}>EDIT</a>

            <a href={`${listingHref}?from=account`}>
              VIEW
            </a>

            {isArchived ? (
              <button
                type="button"
                onClick={() => reactivateListing(item)}
              >
                REACTIVATE
              </button>
            ) : (
              <button
                type="button"
                onClick={() => archiveListing(item)}
              >
                ARCHIVE
              </button>
            )}

            <button
              type="button"
              className="danger-action"
              onClick={() => confirmDelete(item)}
            >
              DELETE
            </button>
          </div>
        </div>
      </div>
    );
  })}
</div>

        {filteredListings.length === 0 && (
          <div className="empty">
            <h3>No listings found.</h3>
            <p>Try another search or filter.</p>
          </div>
        )}
      </section>

<Footer />
        
<style jsx>{`
.search-section *,
.featured * {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #0B0B0B;
  color: #D6D6D6;
}

.browse-search-shell {
  max-width: 690px;
  margin: 12px auto 0;
  padding: 7px;
  background:
    linear-gradient(
      180deg,
      rgba(255,196,0,.035),
      rgba(255,196,0,0)
    ),
    rgba(8,8,8,.72);
  border: 1px solid rgba(255,255,255,.045);
  border-radius: 14px;
  box-shadow: 0 12px 30px rgba(0,0,0,.24);
}

.search-section {
    padding: 22px 5% 16px;
  background: #0B0B0B;
  text-align: center;
}

.search-section h1 {
  margin: 0 0 6px;
  color: #9A9A9A;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: .2px;
}

.search-section p {
  color: #9A9A9A;
  margin: 8px 0 0;
  font-size: 15px;
}

.search-top-row {
  margin: 0 0 8px;
  display: grid;
  grid-template-columns: 260px 165px 110px 150px;
  background: #111;
  border: 1px solid rgba(255,255,255,.045);
  border-radius: 10px;
  overflow: hidden;
  min-height: 38px;
}

.browse-search,
.search-top-row select {
  height: 38px;
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

.search-btn {
  height: 38px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  margin-left: -10px;

  background: #151515;
  color: #FFC400;

  border: 1px solid #3a2d00;
  border-left: 1px solid #2a2a2a;
  border-radius: 0;

  font-family: 'Montserrat', sans-serif;
  font-weight: 900;
  font-size: 10px;

  cursor: pointer;

  letter-spacing: .55px;
  text-transform: uppercase;

  box-shadow:
    0 1px 0 rgba(255,255,255,.035) inset;
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

.clear-btn {
  height: 30px;
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

.sort-select {
  height: 38px;
  width: 92px;
  border: 1px solid rgba(255,196,0,.12);
 border-radius: 0;
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
  width: 46px;
  border-left: none;
  border-radius: 0 6px 6px 0;
  color: #777;
  cursor: pointer;
}

.clear-btn:hover {
  color: #FFC400;
  border-color: rgba(255,196,0,.45);
}

.workflow-filter-shell {
   max-width: 500px;
  margin: -6px auto 10px;
  padding: 7px;

  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 7px;

  background:
    linear-gradient(180deg, rgba(255,255,255,.022), rgba(255,255,255,0)),
    rgba(8,8,8,.72);

  border: 1px solid rgba(255,255,255,.045);
  border-radius: 14px;

  box-shadow:
    0 1px 0 rgba(255,255,255,.03) inset,
    0 12px 30px rgba(0,0,0,.20);
}

.workflow-filter-shell button {
  height: 27px;
  padding: 0 10px;

  border: 1px solid rgba(255,255,255,.07);
  border-radius: 999px;

  background: #101010;
  color: rgba(255,255,255,.48);

  font-size: 9px;
  font-weight: 900;
  letter-spacing: .55px;
  text-transform: uppercase;

  cursor: pointer;
}

.workflow-filter-shell button:hover,
.workflow-filter-shell button.active {
  border-color: rgba(255,196,0,.38);
  background: #1a1400;
  color: #FFC400;
}



.featured {
  padding: 8px 5% 60px;
  background: #0B0B0B;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 14px;
}

.section-head h2 {
  margin: 0;
  color: #F2F2F2;
  font-size: 22px;
}

.section-head span {
  color: #888;
  font-size: 13px;
  font-weight: 700;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 22px;
}

.cards.single-card {
  grid-template-columns: minmax(250px, 300px);
  justify-content: center;
}

.card {
  position: relative;
  border: 1px solid #242424;
  border-radius: 16px;
  overflow: hidden;
  background: #151515;
  transition: transform .18s ease, border-color .18s ease, background .18s ease;
}

.card:hover {
  transform: translateY(-3px);
  border-color: #3A3A3A;
  background: #181818;
}

.card-photo {
  position: relative;
  height: 190px;
  background-size: cover;
  background-position: center;
}

.card-photo-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 26px;
  height: 80px;
  border: none;
  background: rgba(0,0,0,.12);
  color: rgba(255,255,255,.72);
  font-size: 28px;
  font-weight: 300;
  cursor: pointer;
  z-index: 5;
  opacity: 0;
}

.card:hover .card-photo-nav {
  opacity: 1;
}

.card-photo-nav.left {
  left: 0;
  border-radius: 0 10px 10px 0;
}

.card-photo-nav.right {
  right: 0;
  border-radius: 10px 0 0 10px;
}

.photo-count {
  position: absolute;
  right: 10px;
  top: 10px;
  background: rgba(0,0,0,.72);
  color: #f2f2f2;
  border: 1px solid rgba(255,255,255,.18);
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 10px;
  font-weight: 900;
  z-index: 5;
}

.workflow-photo-pill {
  position: absolute;
  left: 10px;
  top: 10px;
  z-index: 6;
}

.workflow-photo-pill select {
  height: 24px;
  max-width: 132px;
  border: 1px solid rgba(255,255,255,.18);
  border-radius: 999px;
  background:
    linear-gradient(45deg, transparent 50%, #FFC400 50%),
    linear-gradient(135deg, #FFC400 50%, transparent 50%),
    rgba(0,0,0,.72);
  background-position:
    calc(100% - 13px) 50%,
    calc(100% - 8px) 50%;
  background-size: 5px 5px, 5px 5px;
  background-repeat: no-repeat;
  color: #f2f2f2;
  padding: 0 24px 0 9px;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: .35px;
  text-transform: uppercase;
  outline: none;
  appearance: none;
  cursor: pointer;
}

.workflow-photo-pill select:hover,
.workflow-photo-pill select:focus {
  border-color: rgba(255,196,0,.45);
  color: #FFC400;
}

.card-body {
  padding: 16px;
}

.title-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.card h3 {
  margin: 0;
  color: #F2F2F2;
  font-size: 16px;
}

.hours-inline {
  color: #8A8A8A;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.feature-line {
  min-height: 38px;
  margin: 8px 0 14px;
  color: #8F8F8F;
  font-size: 13px;
}

.seller-price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.price-input {
  width: 110px;
  height: 34px;
  border: 1px solid #343434;
  border-radius: 8px;
  background: #101010;
  color: #F2F2F2;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 900;
  outline: none;
}

.price-input.saved {
  border-color: #38A169;
}

.price-input.error {
  border-color: #E53E3E;
}

.status-pill {
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(56,161,105,.12);
  border: 1px solid rgba(56,161,105,.35);
  color: #38A169;
  font-size: 10px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-pill.archived {
  background: rgba(120,120,120,.14);
  border-color: rgba(160,160,160,.35);
  color: #A0A0A0;
}

.archived-card {
  opacity: .55;
  filter: grayscale(.45);
}

.seller-meta {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 14px;
  color: #8A8A8A;
  font-size: 11px;
  font-weight: 700;
}

.seller-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.seller-actions a,
.seller-actions button {
  height: 32px;
  border-radius: 8px;
  border: 1px solid #343434;
  background: #101010;
  color: #D6D6D6;
  font-size: 10px;
  font-weight: 900;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.seller-actions a:hover,
.seller-actions button:hover {
  border-color: rgba(255,196,0,.45);
  color: #FFC400;
}

.danger-action:hover {
  border-color: rgba(229,62,62,.45) !important;
  color: #E53E3E !important;
}

.empty {
  padding: 40px;
  text-align: center;
}

@media (max-width: 850px) {
  .search-top-row {
    grid-template-columns: 1fr;
  
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

  .browse-search,
  .search-top-row select {
    border-right: none;
    border-bottom: 1px solid #2A2A2A;
  }

  .filter-strip {
    justify-content: flex-start;
    overflow-x: auto;
    padding-bottom: 6px;
  }

  .cards {
    grid-template-columns: 1fr;
  }

  .seller-actions {
    grid-template-columns: 1fr 1fr;
  }
}
`}</style>
    </>
  );
}
