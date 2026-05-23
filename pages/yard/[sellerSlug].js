import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

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
  const [cardPhotoIndex, setCardPhotoIndex] = useState({});

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
  const sellerName = sellerDisplay.contactName;

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

  function changeCardPhoto(e, item, direction) {
    e.preventDefault();
    e.stopPropagation();

    const images = getCardImages(item);
    if (images.length < 2) return;

    setCardPhotoIndex(current => {
      const currentIndex = current[item.id] || 0;
      const nextIndex =
        (currentIndex + direction + images.length) % images.length;

      return {
        ...current,
        [item.id]: nextIndex
      };
    });
  }

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
        <nav className="nav">
          <a href="/" className="logo-wrap">
            <img
              src="/images/ironxchange-logo.png"
              className="logo-img"
              alt="IronXchange"
            />
          </a>

          <div className="nav-links">
            <a href="/browse">SEARCH</a>

            <a href="/post-free" className="yellow-link">
              POST FREE
            </a>

            <a href="/saved" className="login-icon" aria-label="Saved Listings">
              <i className="fa-regular fa-star"></i>
            </a>

            <a
              href={loggedIn ? "/account" : "/login"}
              className={`login-icon ${loggedIn ? "logged-in" : ""}`}
              aria-label="Account"
            >
              <i className="fa-regular fa-user"></i>
            </a>
          </div>
        </nav>

        <section className="yard-shell">
          <section className="yard-head">
            <div className="yard-identity">
              <div className="yard-logo">
                {sellerLogo ? (
                  <img src={sellerLogo} alt={yardTitle} />
                ) : (
                  <i className="fa-regular fa-user"></i>
                )}
              </div>

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

                  <a href="/browse" className="browse-all-link">
                    Browse All Iron
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
              const images = getCardImages(item);
              const currentPhoto = images[cardPhotoIndex[item.id] || 0];

              return (
                <a
                  href={`/listing/${slugify(item.title)}?from=yard`}
                  className="card"
                  key={item.id || item.link || item.title}
                >
                  <div
                    className="card-photo"
                    style={{
                      backgroundImage: `url(${
                        currentPhoto || "/images/hero-equipment-yard.jpg"
                      })`
                    }}
                  >
                    {images.length > 1 ? (
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
                          {(cardPhotoIndex[item.id] || 0) + 1}/{images.length}
                        </span>
                      </>
                    ) : null}
                  </div>

                  <div className="card-body">
                    <div className="title-row">
                      <h3>{cleanMachineTitle(item.title)}</h3>
                      <h3 className="hours-inline">{item.hours}</h3>
                    </div>

                    <p className="feature-line">{getFeatureLine(item)}</p>

                    <div className="price-row">
                      <strong>{item.price}</strong>

                      <div className="meta">
                        <span>⌖ {item.location}</span>
                      </div>
                    </div>
                  </div>
                </a>
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

      <style jsx>{`
        :global(body) {
          margin: 0;
          font-family: Arial, sans-serif;
          background: #0b0b0b;
          color: #d6d6d6;
        }

        * {
          box-sizing: border-box;
        }

        main {
          min-height: 100vh;
          background: #0b0b0b;
        }

        .nav {
          height: 64px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 2%;
          background: #050505;
          border-bottom: 1px solid rgba(255,255,255,.08);
        }

        .logo-img {
          height: 38px;
          display: block;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .nav-links a {
          color: white;
          text-decoration: none;
          font-weight: 900;
          text-transform: uppercase;
          font-size: 12px;
        }

        .yellow-link {
          color: ${BRAND_YELLOW} !important;
        }

        .login-icon {
          border: 2px solid white;
          border-radius: 50%;
          width: 26px;
          height: 26px;
          display: grid;
          place-items: center;
          font-size: 14px !important;
        }

        .login-icon.logged-in {
          border-color: #38A169;
          color: #38A169 !important;
        }

        .yard-shell {
          max-width: 1580px;
          margin: 0 auto;
          padding: 24px 3% 70px;
        }

        .yard-head {
          background: #151515;
          border: 1px solid #282828;
          border-radius: 16px;
          padding: 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 14px;
        }

        .yard-identity {
          display: flex;
          align-items: center;
          gap: 18px;
          min-width: 0;
        }

        .yard-logo {
          width: 170px;
          height: 88px;
          background: #080808;
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          padding: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex: 0 0 auto;
        }

        .yard-logo img {
          width: 150%;
          height: 150%;
          object-fit: contain;
          object-position: center;
          display: block;
        }

        .yard-logo i {
          color: #777;
          font-size: 28px;
        }

        .yard-copy {
          min-width: 0;
        }

        .eyebrow {
          display: block;
          color: ${BRAND_YELLOW};
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .65px;
          margin-bottom: 7px;
        }

        h1 {
          margin: 0;
          color: #f2f2f2;
          font-size: 32px;
          line-height: 1.05;
          letter-spacing: -0.5px;
          text-transform: uppercase;
        }

        .yard-head p {
          margin: 8px 0 0;
          color: #8a8a8a;
          font-size: 13px;
          font-weight: 700;
        }

        .yard-actions {
          margin-top: 14px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .yard-actions a {
          width: 34px;
          height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #101010;
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          color: #eaeaea;
          text-decoration: none;
          font-size: 14px;
          transition:
            border-color .15s ease,
            background .15s ease,
            color .15s ease;
        }

        .yard-actions a:hover {
          border-color: #FFC400;
          color: #FFC400;
          background: #161616;
        }

        .yard-actions .browse-all-link {
          width: auto;
          padding: 0 13px;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .45px;
          text-transform: uppercase;
        }

        .yard-count {
          min-width: 150px;
          background: #101010;
          border: 1px solid #252525;
          border-radius: 14px;
          padding: 18px;
          text-align: center;
        }

        .yard-count strong {
          display: block;
          color: #f2f2f2;
          font-size: 34px;
          line-height: 1;
        }

        .yard-count span {
          display: block;
          margin-top: 8px;
          color: #888;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .45px;
        }

        .search-section {
          padding: 18px 0 16px;
        }

        .search-top-row {
          max-width: 1080px;
          margin: 0 auto 10px;
          display: grid;
          grid-template-columns: minmax(320px, 1fr) 220px 150px;
          background: #141414;
          border: 1px solid #252525;
          border-radius: 11px;
          overflow: hidden;
          box-shadow: 0 18px 50px rgba(0,0,0,.35);
        }

        .browse-search,
        .search-top-row select {
          height: 36px;
          border: none;
          border-right: 1px solid #2a2a2a;
          padding: 0 13px;
          background: #141414;
          color: #d6d6d6;
          font-size: 13px;
          outline: none;
        }

        .search-top-row select,
        .sort-select {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
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
          max-width: 1080px;
          margin: 0 auto;
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
          border: 1px solid #343434;
          background: #101010;
          overflow: hidden;
          margin-right: -1px;
        }

        .range-group:first-child {
          border-radius: 6px 0 0 6px;
        }

        .range-group span {
          width: 1px;
          height: 58%;
          background: #2a2a2a;
        }

        .range-group input {
          height: 100%;
          min-width: 0;
          border: none;
          padding: 0 10px;
          background: transparent;
          color: #d6d6d6;
          font-size: 10px;
          font-weight: 800;
          text-align: center;
          outline: none;
        }

        .range-group input::placeholder {
          color: #666;
        }

        .clear-btn {
          height: 30px;
          border: 1px solid #343434;
          border-left: none;
          border-radius: 0 6px 6px 0;
          background: #101010;
          color: #777;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
        }

        .clear-btn:hover {
          color: ${BRAND_YELLOW};
          border-color: rgba(255,196,0,.45);
        }

        .inventory-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin: 18px 0 22px;
        }

        .inventory-head h2 {
          margin: 0;
          color: #f2f2f2;
          font-size: 22px;
          text-transform: uppercase;
          letter-spacing: .35px;
        }

        .inventory-head span {
          color: #888;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .45px;
        }

      .cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 320px));
  gap: 22px;
  justify-content: start;
}

        .card {
          position: relative;
          text-decoration: none;
          color: inherit;
          border: 1px solid #242424;
          border-radius: 16px;
          overflow: hidden;
          background: #151515;
          transition:
            transform .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .card:hover {
          transform: translateY(-3px);
          border-color: #3a3a3a;
          background: #181818;
        }

        .card-photo {
          position: relative;
          height: 190px;
          background-size: cover;
          background-position: center;
          border-bottom: 1px solid #202020;
        }

        .card-photo-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 26px;
          height: 80px;
          border: none;
          background: rgba(0,0,0,.14);
          color: rgba(255,255,255,.72);
          font-size: 28px;
          font-weight: 300;
          cursor: pointer;
          z-index: 3;
        }

        .card-photo-nav.left {
          left: 0;
        }

        .card-photo-nav.right {
          right: 0;
        }

        .card-photo-nav:hover {
          background: rgba(0,0,0,.34);
          color: white;
        }

        .photo-count {
          position: absolute;
          right: 8px;
          bottom: 8px;
          background: rgba(0,0,0,.62);
          color: rgba(255,255,255,.86);
          font-size: 10px;
          font-weight: 900;
          padding: 4px 7px;
          border-radius: 999px;
        }

        .card-body {
          padding: 16px;
        }

        .title-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 10px;
        }

        .card h3 {
          margin: 0;
          color: #f2f2f2;
          font-size: 16px;
          letter-spacing: -0.2px;
        }

        .hours-inline {
          color: #8a8a8a !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          letter-spacing: .3px;
          white-space: nowrap;
        }

        .feature-line {
          min-height: 38px;
          margin: 8px 0 18px;
          color: #8f8f8f;
          font-size: 13px;
          line-height: 1.4;
        }

        .price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
          gap: 12px;
        }

        .price-row strong {
          color: #f2f2f2;
          font-size: 18px;
          white-space: nowrap;
        }

        .meta {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #9a9a9a;
          flex-wrap: wrap;
          justify-content: flex-end;
          text-align: right;
        }

        .meta span {
          color: #9a9a9a;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .4px;
        }

        .empty {
          margin-top: 24px;
          background: #151515;
          border: 1px solid #282828;
          border-radius: 14px;
          padding: 28px;
          text-align: center;
        }

        .empty h3 {
          margin: 0;
          color: #f2f2f2;
          font-size: 16px;
          text-transform: uppercase;
        }

        .empty p {
          margin: 8px 0 0;
          color: #888;
          font-size: 13px;
        }

        @media (max-width: 850px) {
          .yard-head {
            align-items: flex-start;
            display: grid;
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
            border-bottom: 1px solid #2a2a2a;
          }

          .filter-strip {
            display: grid;
            gap: 8px;
          }

          .range-group,
          .range-group:first-child,
          .clear-btn {
            border-radius: 8px;
            margin-right: 0;
            border: 1px solid #343434;
          }

          .clear-btn {
            width: 100%;
          }
        }

        @media (max-width: 600px) {
          .nav {
            padding: 8px 4%;
          }

          .logo-img {
            height: 34px;
          }

          .nav-links a:not(.yellow-link):not(.login-icon) {
            display: none;
          }

          .yard-shell {
            padding: 18px 4% 50px;
          }

          .yard-head {
            padding: 16px;
          }

          .yard-identity {
            display: grid;
          }

          .yard-logo {
            width: 100%;
            height: 92px;
          }

          h1 {
            font-size: 25px;
          }

          .cards {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}

