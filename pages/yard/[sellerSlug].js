import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import SellerLogoDecal from "../../components/SellerLogoDecal";

import ListingCard from "../../components/ListingCard";
import { getListingId } from "../../lib/listingFormatters";

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

function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function clean(value) {
  return value ? String(value).trim() : "";
}

function isInitials(value = "") {
  const v = clean(value);
  return /^[A-Z]{1,4}$/.test(v);
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

function normalizeUrl(url = "") {
  const value = clean(url);
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://${value}`;
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

function getFeatureLine(item = {}) {
  return [...new Set(getListingKeywords(item))]
    .slice(0, 4)
    .join(" • ");
}

function getCardImages(item = {}) {
  return [
    ...(Array.isArray(item.images) ? item.images : []),
    ...(Array.isArray(item.imageUrls) ? item.imageUrls : []),
    item.imageUrl,
    item.image
  ].filter(Boolean);
}

function matchesRange(value, min, max) {
  const num = toNumber(value);
  const low = toNumber(min);
  const high = toNumber(max);

  if (low !== null && (num === null || num < low)) return false;
  if (high !== null && (num === null || num > high)) return false;

  return true;
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

function getAuthorId(item) {
  const safeItem = item || {};

  return (
    safeItem.authorId ||
    safeItem.sellerId ||
    safeItem.author?.id?.uuid ||
    safeItem.author?.id ||
    ""
  );
}

function getSellerDisplay(item = {}) {
  const sellerName = clean(item.sellerName);
  const sellerCompany = clean(item.sellerCompany);
  const companyName = clean(item.companyName);
  const authorName = clean(item.authorName);

  const realCompany =
    [sellerCompany, companyName, sellerName, authorName]
      .find(value => value && !isInitials(value) && value !== "Seller Profile") ||
    sellerName ||
    sellerCompany ||
    companyName ||
    authorName ||
    "IronXchange Yard";

  const contactName =
    [sellerName, authorName, sellerCompany, companyName]
      .find(value => value && value !== realCompany) ||
    "";

  return {
    yardTitle: realCompany,
    contactName,
    sellerName,
    sellerCompany,
    companyName,
    authorName
  };
}

export default function SellerYardPage() {
  const router = useRouter();
  const { sellerSlug } = router.query;

  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [loggedIn, setLoggedIn] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("ALL CATEGORIES");
  const [sortMode, setSortMode] = useState("newest");

  const [filters, setFilters] = useState({
    yearMin: "",
    yearMax: "",
    priceMin: "",
    priceMax: "",
    hoursMin: "",
    hoursMax: ""
  });

  useEffect(() => {
    fetch("/api/listings")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setListings(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    async function checkAuth() {
      try {
        const SharetribeSdk = await import("sharetribe-flex-sdk");

        const sdk = SharetribeSdk.createInstance({
          clientId: process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
        });

        await sdk.currentUser.show();
        setLoggedIn(true);
      } catch {
        setLoggedIn(false);
      }
    }

    checkAuth();
  }, []);

  const sellerSeedListing = useMemo(() => {
    if (!sellerSlug || listings.length === 0) return null;

    const targetSlug = String(sellerSlug).toLowerCase();

    return listings.find(item => {
      const display = getSellerDisplay(item);

      const possibleValues = [
        getAuthorId(item),
        display.yardTitle,
        display.sellerName,
        display.sellerCompany,
        display.companyName,
        display.authorName
      ]
        .filter(Boolean)
        .map(value => slugify(String(value)));

      return possibleValues.includes(targetSlug);
    });
  }, [sellerSlug, listings]);

  const sellerAuthorId = sellerSeedListing ? getAuthorId(sellerSeedListing) : "";

  const sellerListings = useMemo(() => {
    if (!sellerAuthorId) return [];

    return listings.filter(item => {
      const listingStatus =
        item.listingStatus ||
        item.publicData?.listingStatus ||
        item.attributes?.publicData?.listingStatus ||
        "live";

      return (
        String(getAuthorId(item)) === String(sellerAuthorId) &&
        listingStatus !== "archived" &&
        listingStatus !== "deleted"
      );
    });
  }, [listings, sellerAuthorId]);

    const sellerDisplay = getSellerDisplay(sellerSeedListing || {});
  const yardTitle = sellerDisplay.yardTitle;
  const sellerName =
  sellerDisplay.contactName &&
  !isInitials(sellerDisplay.contactName)
    ? sellerDisplay.contactName
    : "";

  const sellerLocation =
    clean(sellerSeedListing?.sellerLocation) ||
    clean(sellerSeedListing?.location) ||
    "Location not listed";

  const sellerLogo =
    sellerSeedListing?.sellerLogo ||
    sellerSeedListing?.profileImage ||
    "";

  const website = normalizeUrl(sellerSeedListing?.sellerWebsite || "");
  const facebook = normalizeUrl(sellerSeedListing?.sellerFacebook || "");
  const instagram = normalizeUrl(sellerSeedListing?.sellerInstagram || "");
  const linkedin = normalizeUrl(sellerSeedListing?.sellerLinkedin || "");
  const youtube = normalizeUrl(sellerSeedListing?.sellerYoutube || "");
  const tiktok = normalizeUrl(sellerSeedListing?.sellerTiktok || "");

  const filteredListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = sellerListings.filter(item => {
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
        ...getListingKeywords(item)
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !q || searchableText.includes(q);

      const matchesCategory =
        category === "ALL CATEGORIES" ||
        String(item.type || item.category || "").toUpperCase() === category;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesRange(getListingYear(item), filters.yearMin, filters.yearMax) &&
        matchesRange(item.price, filters.priceMin, filters.priceMax) &&
        matchesRange(item.hours, filters.hoursMin, filters.hoursMax)
      );
    });

    return sortListings(filtered, sortMode);
  }, [sellerListings, searchQuery, category, filters, sortMode]);

  if (loading) {
    return (
      <main className="loading">
        Loading yard...
        <style jsx>{`
          .loading {
            min-height: 100vh;
            background: #0b0b0b;
            color: #d6d6d6;
            padding: 40px;
            font-family: Arial, sans-serif;
          }
        `}</style>
      </main>
    );
  }

  if (!sellerSeedListing) {
    return (
      <main className="loading">
        <div className="not-found-card">
          <img
            src="/images/ironxchange-logo.png"
            alt="IronXchange"
            className="not-found-logo"
          />

          <h1>Seller Yard Not Found</h1>

          <p>
            This seller yard may have moved, been removed, or does not have active listings.
          </p>

          <div className="not-found-actions">
            <a href="/browse">Browse Equipment</a>
            <a href="/">Back to IronXchange</a>
          </div>
        </div>

        <style jsx>{`
          .loading {
            min-height: 100vh;
            background: #0b0b0b;
            color: #d6d6d6;
            padding: 40px;
            font-family: Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .not-found-card {
            width: 100%;
            max-width: 520px;
            background: #151515;
            border: 1px solid #282828;
            border-radius: 16px;
            padding: 34px;
            text-align: center;
          }

          .not-found-logo {
            height: 42px;
            width: auto;
            margin-bottom: 24px;
          }

          h1 {
            margin: 0;
            color: #f2f2f2;
            font-size: 22px;
            text-transform: uppercase;
            letter-spacing: .4px;
          }

          p {
            margin: 12px 0 0;
            color: #999;
            font-size: 14px;
            line-height: 1.55;
          }

          .not-found-actions {
            display: flex;
            justify-content: center;
            gap: 10px;
            flex-wrap: wrap;
            margin-top: 24px;
          }

          .not-found-actions a {
            height: 36px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0 14px;
            background: #101010;
            border: 1px solid #2a2a2a;
            border-radius: 8px;
            color: #eaeaea;
            text-decoration: none;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: .45px;
            text-transform: uppercase;
          }

          .not-found-actions a:first-child {
            background: #1a1400;
            border-color: #3a2d00;
            color: #ffc400;
          }

          .not-found-actions a:hover {
            border-color: #ffc400;
            color: #ffc400;
          }
        `}</style>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>{yardTitle} Yard | IronXchange</title>
        <meta
          name="description"
          content={`${yardTitle} equipment yard on IronXchange.`}
        />

        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
          rel="stylesheet"
        />
      </Head>

      <main>

    <Navbar />

        <section className="yard-shell">
          <section className="yard-head">
            <div className="yard-identity">
              <SellerLogoDecal
  logo={sellerLogo}
  name={yardTitle}
  variant="slug"
/>

              <div className="yard-copy">
                <span className="eyebrow">IronXchange Yard</span>
                <h1>{yardTitle}</h1>

                <p>
                  {sellerLocation}
                  {sellerName ? ` · ${sellerName}` : ""}
                </p>

                <div className="yard-actions">
                  {website ? (
                    <a href={website} target="_blank" rel="noreferrer" aria-label="Website">
                      <i className="fa-solid fa-globe"></i>
                    </a>
                  ) : null}

                  {facebook ? (
                    <a href={facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
                      <i className="fa-brands fa-facebook-f"></i>
                    </a>
                  ) : null}

                  {instagram ? (
                    <a href={instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
                      <i className="fa-brands fa-instagram"></i>
                    </a>
                  ) : null}

                  {linkedin ? (
                    <a href={linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                      <i className="fa-brands fa-linkedin-in"></i>
                    </a>
                  ) : null}

                  {youtube ? (
                    <a href={youtube} target="_blank" rel="noreferrer" aria-label="YouTube">
                      <i className="fa-brands fa-youtube"></i>
                    </a>
                  ) : null}

                  {tiktok ? (
                    <a href={tiktok} target="_blank" rel="noreferrer" aria-label="TikTok">
                      <i className="fa-brands fa-tiktok"></i>
                    </a>
                  ) : null}

<a
  href={
    loggedIn
      ? `/inquire?listingId=${sellerListings?.[0]?.id || ""}`
      : `/login`
  }
  className="contact-btn"
>
  Message
</a>

{sellerSeedListing?.sellerPhone ? (
  <a
    href={`tel:${sellerSeedListing.sellerPhone}`}
    className="contact-btn"
  >
    Call
  </a>
) : null}

                 <a href="#" onClick={(e) => { e.preventDefault(); window.history.back(); }} className="browse-all-link">
                    Back to Machine
                  </a>
                </div>
              </div>
            </div>

            <div className="yard-count">
              <strong>{sellerListings.length}</strong>
              <span>Active Machines</span>
            </div>
          </section>
          <section className="search-section">
            <div className="search-top-row">
              <input
                type="text"
                className="browse-search"
                placeholder="Search this yard..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />

              <select value={category} onChange={e => setCategory(e.target.value)}>
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
          </section>

          <section className="inventory-head">
            <h2>Inventory</h2>
            <span>{filteredListings.length} Showing</span>
          </section>

  <section className="cards">
  {filteredListings.map(item => {
    const id = String(getListingId(item));

    return (
      <ListingCard
        key={id}
        listing={item}
        showSave={false}
        from="yard"
      />
    );
  })}
</section>

          {filteredListings.length === 0 ? (
            <div className="empty">
              <h3>No machines found.</h3>
              <p>Try another search or filter inside this yard.</p>
            </div>
          ) : null}
        </section>
      </main>

          <Footer />


<style jsx>{`
  :global(html),
  :global(body) {
    margin: 0;
    min-height: 100%;
    overflow-x: hidden;
    background: #0b0b0b;
    color: #d6d6d6;
    font-family: Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    text-rendering: geometricPrecision;
  }

  * {
    box-sizing: border-box;
  }

  main {
    min-height: 100vh;
    background:
      radial-gradient(circle at top center, rgba(255,196,0,.035), transparent 30%),
      radial-gradient(circle at 18% 12%, rgba(255,255,255,.018), transparent 22%),
      #0b0b0b;
  }

  .yard-shell {
    max-width: 1580px;
    margin: 0 auto;
    padding: 18px 3% 58px;
  }

  .yard-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;

    margin-bottom: 10px;
    padding: 16px 18px;

    background:
      linear-gradient(180deg, rgba(255,255,255,.028), rgba(255,255,255,0)),
      radial-gradient(circle at top, rgba(255,255,255,.014), transparent 72%),
      #111111;

    border: 1px solid rgba(255,255,255,.065);
    outline: 1px solid rgba(255,255,255,.018);
    border-radius: 14px;

    box-shadow:
      0 1px 0 rgba(255,255,255,.032) inset,
      0 16px 38px rgba(0,0,0,.22);
  }

  .yard-identity {
    display: flex;
    align-items: center;
    gap: 18px;
    min-width: 0;
  }

  .yard-copy {
    min-width: 0;
  }

  .eyebrow {
    display: block;
    margin-bottom: 6px;

    color: #FFC400;

    font-size: 9px;
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: .72px;
  }

  h1 {
    margin: 0;

    color: #f2f2f2;

    font-size: 26px;
    font-weight: 950;
    line-height: 1.02;
    letter-spacing: -.55px;
    text-transform: uppercase;
  }

  .yard-head p {
    margin: 6px 0 0;

    color: rgba(255,255,255,.42);

    font-size: 12px;
    font-weight: 800;
    letter-spacing: .18px;
  }

  .yard-actions {
    margin-top: 11px;

    display: flex;
    gap: 7px;
    flex-wrap: wrap;
  }

  .yard-actions a {
    width: 31px;
    height: 31px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    background:
      linear-gradient(180deg, rgba(255,255,255,.014), rgba(255,255,255,0)),
      #101010;

    border: 1px solid rgba(255,255,255,.075);
    border-radius: 9px;

    color: rgba(255,255,255,.44);
    text-decoration: none;

    font-size: 13px;

    box-shadow:
      0 1px 0 rgba(255,255,255,.022) inset;

    transition:
      color .14s ease,
      border-color .14s ease,
      background .14s ease,
      transform .14s ease,
      text-shadow .14s ease;
  }

  .yard-actions a:hover {
    transform: translateY(-1px);

    border-color: rgba(255,196,0,.32);
    color: #FFC400;

    background:
      linear-gradient(180deg, rgba(255,196,0,.045), rgba(255,196,0,0)),
      #151515;

    text-shadow: 0 0 14px rgba(255,196,0,.16);
  }

  .yard-actions a[aria-label="Facebook"]:hover {
    color: #1877F2;
    border-color: rgba(24,119,242,.42);
    text-shadow: 0 0 14px rgba(24,119,242,.28);
  }

  .yard-actions a[aria-label="Instagram"]:hover {
    color: #ff4fd8;
    border-color: rgba(255,79,216,.36);
    text-shadow: 0 0 14px rgba(255,79,216,.24);
  }

  .yard-actions a[aria-label="LinkedIn"]:hover {
    color: #f2f2f2;
    border-color: rgba(255,255,255,.25);
    text-shadow: 0 0 14px rgba(255,255,255,.18);
  }

  .yard-actions a[aria-label="YouTube"]:hover {
    color: #FF0000;
    border-color: rgba(255,0,0,.38);
    text-shadow: 0 0 14px rgba(255,0,0,.24);
  }

  .yard-actions a[aria-label="TikTok"]:hover {
    color: #b86cff;
    border-color: rgba(184,108,255,.38);
    text-shadow: 0 0 14px rgba(184,108,255,.26);
  }

  .yard-actions .browse-all-link,
  .contact-btn {
    width: auto !important;
    height: 31px;

    padding: 0 12px;

    background:
      linear-gradient(180deg, rgba(255,196,0,.075), rgba(255,196,0,0)),
      #151515 !important;

    border: 1px solid rgba(255,196,0,.24) !important;
    border-radius: 9px;

    color: #FFC400 !important;

    font-size: 9px !important;
    font-weight: 950;
    letter-spacing: .55px;
    text-transform: uppercase;
  }

  .yard-actions .browse-all-link:hover,
  .contact-btn:hover {
    background:
      linear-gradient(180deg, rgba(255,196,0,.14), rgba(255,196,0,0)),
      #1a1400 !important;

    border-color: rgba(255,196,0,.58) !important;
  }

  .yard-count {
    min-width: 118px;

    padding: 13px 12px;

    text-align: center;

    background:
      linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0)),
      #101010;

    border: 1px solid rgba(255,255,255,.06);
    border-radius: 12px;

    box-shadow:
      0 1px 0 rgba(255,255,255,.025) inset;
  }

  .yard-count strong {
    display: block;

    color: #f2f2f2;

    font-size: 26px;
    font-weight: 950;
    line-height: 1;
  }

  .yard-count span {
    display: block;

    margin-top: 6px;

    color: rgba(255,255,255,.36);

    font-size: 8.75px;
    font-weight: 950;

    text-transform: uppercase;
    letter-spacing: .52px;
  }

  .search-section {
    padding: 12px 0 14px;
  }

  .search-top-row {
    max-width: 1100px;
    margin: 0 auto 8px;

    display: grid;
    grid-template-columns: minmax(320px, 1fr) 230px 150px;

    background:
      linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0)),
      #111;

    border: 1px solid rgba(255,255,255,.065);
    border-radius: 12px;

    overflow: hidden;

    box-shadow:
      0 1px 0 rgba(255,255,255,.025) inset,
      0 16px 42px rgba(0,0,0,.28);
  }

  .browse-search,
  .search-top-row select {
    height: 36px;

    border: none;
    border-right: 1px solid rgba(255,255,255,.065);

    padding: 0 12px;

    background: transparent;
    color: rgba(255,255,255,.78);

    font-size: 11px;
    font-weight: 750;

    outline: none;
  }

  .browse-search::placeholder {
    color: rgba(255,255,255,.30);
  }

  .search-top-row select,
  .sort-select {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;

    color: rgba(255,255,255,.70);

    font-size: 9.5px;
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: .48px;

    background-image:
      linear-gradient(45deg, transparent 50%, #FFC400 50%),
      linear-gradient(135deg, #FFC400 50%, transparent 50%);
    background-position:
      calc(100% - 16px) 50%,
      calc(100% - 11px) 50%;
    background-size:
      5px 5px,
      5px 5px;
    background-repeat: no-repeat;

    padding-right: 34px;
  }

  .filter-strip {
    max-width: 1100px;
    margin: 0 auto;

    display: flex;
    justify-content: center;
    align-items: stretch;
  }

  .range-group {
    height: 30px;

    display: grid;
    grid-template-columns: 1fr 1px 1fr;
    align-items: center;

    margin-right: -1px;

    background:
      linear-gradient(180deg, rgba(255,255,255,.012), rgba(255,255,255,0)),
      #101010;

    border: 1px solid rgba(255,255,255,.075);

    overflow: hidden;
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
    color: rgba(255,255,255,.72);

    font-size: 10px;
    font-weight: 850;

    text-align: center;
    outline: none;
  }

  .range-group input::placeholder {
    color: rgba(255,255,255,.28);
  }

  .clear-btn {
    height: 30px;

    border: 1px solid rgba(255,255,255,.075);
    border-left: none;
    border-radius: 0 8px 8px 0;

    background:
      linear-gradient(180deg, rgba(255,255,255,.012), rgba(255,255,255,0)),
      #101010;

    color: rgba(255,255,255,.38);

    font-size: 9px;
    font-weight: 950;
    letter-spacing: .52px;
    text-transform: uppercase;

    cursor: pointer;

    padding: 0 14px;

    transition:
      color .14s ease,
      border-color .14s ease,
      background .14s ease;
  }

  .clear-btn:hover {
    color: #FFC400;
    border-color: rgba(255,196,0,.42);
    background: #151515;
  }

  .inventory-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;

    margin: 15px 0 16px;
    padding-top: 10px;

    border-top: 1px solid rgba(255,255,255,.055);
  }

  .inventory-head h2 {
    margin: 0;

    color: #f2f2f2;

    font-size: 18px;
    font-weight: 950;

    text-transform: uppercase;
    letter-spacing: .55px;
  }

  .inventory-head span {
    color: rgba(255,255,255,.38);

    font-size: 9px;
    font-weight: 950;

    text-transform: uppercase;
    letter-spacing: .52px;
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));

    gap: 22px;
  }

  .empty {
    margin-top: 24px;

    padding: 28px;

    text-align: center;

    background:
      linear-gradient(180deg, rgba(255,255,255,.022), rgba(255,255,255,0)),
      #101010;

    border: 1px solid rgba(255,255,255,.065);
    border-radius: 14px;

    box-shadow:
      0 1px 0 rgba(255,255,255,.025) inset,
      0 14px 34px rgba(0,0,0,.18);
  }

  .empty h3 {
    margin: 0;

    color: #f2f2f2;

    font-size: 15px;
    font-weight: 950;

    text-transform: uppercase;
    letter-spacing: .52px;
  }

  .empty p {
    margin: 8px 0 0;

    color: rgba(255,255,255,.42);

    font-size: 12px;
    line-height: 1.45;
  }

  @media (max-width: 850px) {
    .yard-head {
      display: grid;
      align-items: stretch;
    }

    .yard-identity {
      align-items: flex-start;
    }

    .yard-count {
      width: 100%;
    }

    .search-top-row {
      grid-template-columns: 1fr;
    }

    .browse-search,
    .search-top-row select {
      border-right: none;
      border-bottom: 1px solid rgba(255,255,255,.065);
    }

    .filter-strip {
      display: grid;
      gap: 8px;
    }

    .range-group,
    .range-group:first-child,
    .clear-btn {
      width: 100%;
      border-radius: 9px;
      margin-right: 0;
      border: 1px solid rgba(255,255,255,.075);
    }

    .clear-btn {
      width: 100%;
    }
  }

  @media (max-width: 600px) {
    .yard-shell {
      padding: 16px 4% 50px;
    }

    .yard-head {
      padding: 16px;
    }

    .yard-identity {
      display: grid;
      gap: 10px;
    }

    h1 {
      font-size: 25px;
    }

    .yard-actions {
      gap: 6px;
    }

    .cards {
      grid-template-columns: 1fr;
    }
  }
`}</style>
          
    </>
  );
}

