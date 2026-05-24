import Head from "next/head";
import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const BRAND_YELLOW = "#FFC400";

function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getSavedListingIds(profile = {}) {
  const fromSharetribe = profile?.privateData?.savedListings;

  if (Array.isArray(fromSharetribe)) return fromSharetribe.map(String);
  if (typeof window === "undefined") return [];

  try {
    const saved = JSON.parse(localStorage.getItem("ironxchangeSaved") || "[]");

    return Array.isArray(saved)
      ? saved.map(item => String(item?.id || item))
      : [];
  } catch {
    return [];
  }
}

function cleanMachineTitle(title = "") {
  return String(title).replace(/\s\d{1,3}(,\d{3})*\sHrs/i, "");
}

function formatPriceInput(price = "") {
  const raw = String(price).replace("$", "").replace(/,/g, "").trim();
  const number = Number(raw);

  return Number.isFinite(number) && raw ? number.toLocaleString() : "";
}

function addActivity(type, message) {
  if (typeof window === "undefined") return;

  try {
    const event = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      message,
      createdAt: new Date().toISOString()
    };

    const current = JSON.parse(localStorage.getItem("ixActivityLog") || "[]");

    localStorage.setItem(
      "ixActivityLog",
      JSON.stringify([event, ...current].slice(0, 25))
    );

    window.dispatchEvent(new Event("ix-activity-updated"));
  } catch (err) {
    console.error("Activity log failed", err);
  }
}

function formatActivityTime(value) {
  try {
    return new Date(value).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });
  } catch {
    return "";
  }
}

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [savedMachines, setSavedMachines] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activityLog, setActivityLog] = useState([]);
  const [recentInquiries, setRecentInquiries] = useState([]);

  useEffect(() => {
    async function loadAccount() {
      try {
        const SharetribeSdk = await import("sharetribe-flex-sdk");

        const sdk = SharetribeSdk.createInstance({
          clientId: process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
        });

        const response = await sdk.currentUser.show({
          include: ["profileImage"]
        });

        const currentUser = response.data.data;

        setUser({
          ...currentUser,
          included: response.data.included || []
        });

        const userId = currentUser.id?.uuid || currentUser.id;

        const listingsRes = await fetch(
          `/api/account-listings?authorId=${userId}`
        );

        const listingsData = await listingsRes.json();
        setMyListings(Array.isArray(listingsData) ? listingsData : []);

        const allListingsRes = await fetch("/api/listings");
        const allListingsData = await allListingsRes.json();

        const savedIds = getSavedListingIds(
          currentUser.attributes?.profile || {}
        );

        const saved = Array.isArray(allListingsData)
          ? allListingsData.filter(item => {
              const itemSlug = slugify(item.title);

              return (
                savedIds.includes(String(item.id)) ||
                savedIds.includes(String(item.uuid)) ||
                savedIds.includes(String(item.listingId)) ||
                savedIds.includes(String(item.sharetribeId)) ||
                savedIds.includes(itemSlug)
              );
            })
          : [];

        setSavedMachines(saved);
      } catch {
        window.location.href = `/login?next=${encodeURIComponent("/account")}`;
      } finally {
        setLoading(false);
      }
    }

    loadAccount();
  }, []);

  useEffect(() => {
    function loadActivity() {
      try {
        const events = JSON.parse(localStorage.getItem("ixActivityLog") || "[]");
        setActivityLog(Array.isArray(events) ? events : []);
      } catch {
        setActivityLog([]);
      }
    }

    loadActivity();

    window.addEventListener("ix-activity-updated", loadActivity);

    return () => {
      window.removeEventListener("ix-activity-updated", loadActivity);
    };
  }, []);

  useEffect(() => {
  async function loadRecentInquiries() {
    try {
      const SharetribeSdk = await import("sharetribe-flex-sdk");

      const sdk = SharetribeSdk.createInstance({
        clientId: process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
      });

      const response = await sdk.transactions.query({
        only: "sale",
        include: ["listing", "customer"],
        perPage: 5
      });

      const transactions = response?.data?.data || [];
      const included = response?.data?.included || [];

      const listings = {};
      const users = {};

      included.forEach(item => {
        const id = item.id?.uuid || item.id;

        if (item.type === "listing") listings[id] = item;
        if (item.type === "user") users[id] = item;
      });

      const formatted = transactions.slice(0, 4).map(tx => {
        const listingId =
          tx.relationships?.listing?.data?.id?.uuid ||
          tx.relationships?.listing?.data?.id;

        const customerId =
          tx.relationships?.customer?.data?.id?.uuid ||
          tx.relationships?.customer?.data?.id;

        const listing = listings[listingId];
        const customer = users[customerId];
        const protectedData = tx.attributes?.protectedData || {};

        return {
          id: tx.id?.uuid || tx.id,
          title: listing?.attributes?.title || "Equipment Listing",
          buyer: customer?.attributes?.profile?.displayName || "Buyer",
          message: protectedData.message || "New inquiry",
          createdAt: tx.attributes?.createdAt
        };
      });

      setRecentInquiries(formatted);
    } catch (err) {
      console.error("Recent inquiries failed:", err);
    }
  }

  loadRecentInquiries();
}, []);

  function handleSearch() {
    const q = searchQuery.trim();

    window.location.href = q
      ? `/browse?keywords=${encodeURIComponent(q)}`
      : "/browse";
  }

  async function handleLogout() {
    try {
      const SharetribeSdk = await import("sharetribe-flex-sdk");

      const sdk = SharetribeSdk.createInstance({
        clientId: process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
      });

      await sdk.logout();
    } catch {}

    window.location.href = "/";
  }

  async function archiveListing(listing) {
  const ok = window.confirm(
    `Archive this listing?\n\n${cleanMachineTitle(listing.title)}`
  );

  if (!ok) return;

  try {
    const response = await fetch("/api/archive-listing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: listing.id })
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

    addActivity("success", `Archived — ${cleanMachineTitle(listing.title)}`);
  } catch (error) {
    alert(`Archive failed: ${error.message}`);
  }
}

async function confirmDelete(listing) {
  const ok = window.confirm(
    `Delete this listing?\n\n${cleanMachineTitle(listing.title)}\n\nThis cannot be undone.`
  );

  if (!ok) return;

  try {
    const response = await fetch("/api/delete-listing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: listing.id })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Delete failed");
    }

    setMyListings(current =>
      current.filter(item => String(item.id) !== String(listing.id))
    );

    addActivity("success", `Deleted — ${cleanMachineTitle(listing.title)}`);
  } catch (error) {
    alert(`Delete failed: ${error.message}`);
  }
}
  
  const profile = user?.attributes?.profile || {};
  const publicData = profile?.publicData || {};

const displayName =
  publicData.sellerName ||
  profile?.displayName ||
  "IronXchange User";

const companyName =
  publicData.companyName ||
  profile?.abbreviatedName ||
  "Seller Profile";
  
  const imageId = user?.relationships?.profileImage?.data?.id?.uuid || null;

  const profileImage = user?.included?.find(
    item => item?.type === "image" && item?.id?.uuid === imageId
  );

  const variants = profileImage?.attributes?.variants || {};

  const nonSquareVariant = Object.entries(variants).find(([key, value]) => {
  return value?.url && !key.toLowerCase().includes("square");
});

const logoUrl =
  variants?.default?.url ||
  variants?.["landscape-crop"]?.url ||
  variants?.["landscape-crop2x"]?.url ||
  variants?.["scaled-large"]?.url ||
  variants?.["scaled-medium"]?.url ||
  variants?.["scaled-small"]?.url ||
  nonSquareVariant?.[1]?.url ||
  Object.values(variants).find(v => v?.url)?.url ||
  null;

  if (loading) {
    return (
      <main className="loading">
        Loading...
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

  return (
    <>
      <Head>
        <title>Account | IronXchange</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
          rel="stylesheet"
        />
      </Head>

      <main>
            
     <Navbar />

        <section className="dashboard">   
         <aside className="rail">
  <details className="mobile-rail-menu" open>
    <summary>Account Menu</summary>
            <div className="rail-top">
              <div className="user-dot">
                {logoUrl ? (
                  <img src={logoUrl} alt={displayName} />
                ) : (
                  <i className="fa-regular fa-user"></i>
                )}
              </div>

              <strong>{displayName}</strong>
              <span>{companyName}</span>
            </div>

            <a className="active" href="/account">
              <i className="fa-solid fa-gauge-high"></i>
              Dashboard
            </a>

            <a href="/account/my-listings">
              <i className="fa-solid fa-list"></i>
              Listings
            </a>

            <a href="/account/messages">
              <i className="fa-regular fa-envelope"></i>
              Inquiries
            </a>

            <a href="/saved">
              <i className="fa-regular fa-star"></i>
              Saved
            </a>

            <a href="/account/profile">
              <i className="fa-regular fa-id-card"></i>
              Profile
            </a>

            <a href="/account/settings">
              <i className="fa-solid fa-gear"></i>
              Settings
            </a>
                  </details>
          </aside>

          <section className="content">
            <div className="top-tools">
              <div className="dashboard-search">
                <input
                  type="text"
                  placeholder="Quick search equipment..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                />

                <button type="button" onClick={handleSearch}>
                  SEARCH
                </button>
              </div>

              <div className="status-pill">
                <span></span>
                ACTIVE
              </div>
            </div>

            <div className="main-grid">
              <div className="left-column">
                <div className="stats">
  <div className="stat-card">
    <span>Active Listings</span>
    <strong>{myListings.length}</strong>
    <p>Live machines for sale</p>
  </div>

  <div className="stat-card">
    <span>Age</span>
    <strong className="green">18</strong>
    <p>Avg listing days</p>
  </div>

  <div className="stat-card">
    <span>Saved Machines</span>
    <strong>{savedMachines.length}</strong>
    <p>Watchlist inventory</p>
  </div>

  <div className="stat-card">
    <span>Total Views</span>
    <strong>1,248</strong>
    <p>Last 30 days</p>
  </div>

  <div className="stat-card">
    <span>New Inquiries</span>
    <strong>4</strong>
    <p>Unread messages</p>
  </div>
</div>

                <section className="panel listings-panel">
                  <div className="panel-head">
                    <h2>My Listings</h2>
                    <a href="/account/listings">MANAGE ALL →</a>
                  </div>

                  <div className="listing-table">
                   <div className="listing-op-head">
  <span>Machine</span>
  <span>Hours</span>
  <span>Price</span>
  <span>Age</span>
  <span>Status</span>
  <span>Actions</span>
  <span>Views</span>
  <span>Saves</span>
</div>

                    {myListings.length > 0 ? (
                      myListings.map(listing => (
                       <div className="table-row listing-op-row" key={listing.id}>
  <a href={`/live?id=${listing.id}`} className="machine-photo-link">
    <img
      src={
        listing.imageUrl ||
        listing.image ||
        "/images/hero-equipment-yard.jpg"
      }
      alt={listing.title}
    />
  </a>

  <a href={`/live?id=${listing.id}`} className="machine-title-line">
    {cleanMachineTitle(listing.title)}
  </a>

  <div className="listing-op-controls">
    <span className="listing-hours">{listing.hours}</span>

    <input
      className="price-input"
      defaultValue={formatPriceInput(listing.price)}
                            onKeyDown={async e => {
                              if (e.key !== "Enter") return;

                              e.preventDefault();

                              const input = e.currentTarget;
                              const newPrice = input.value.replace(/,/g, "").trim();

                              input.classList.remove("saved", "error");

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

                              if (response.ok) {
                                input.value = Number(newPrice).toLocaleString();
                                input.classList.add("saved");

                                addActivity(
                                  "success",
                                  `Price updated — ${cleanMachineTitle(listing.title)} — $${Number(newPrice).toLocaleString()}`
                                );
                              } else {
                                input.classList.add("error");

                                addActivity(
                                  "error",
                                  `Price update failed — ${cleanMachineTitle(listing.title)}`
                                );
                              }
                            }}
                          />

                          <span
                            className={
                              listing.age <= 30
                                ? "age-green"
                                : listing.age <= 45
                                ? "age-yellow"
                                : "age-red"
                            }
                          >
                            {listing.age ?? "—"}
                          </span>

<div className="listing-status-stack">
  <span
    className={`listing-status ${
      (
        listing.listingStatus ||
        listing.publicData?.listingStatus ||
        listing.attributes?.publicData?.listingStatus
      ) === "archived"
        ? "archived"
        : "active"
    }`}
  >
    {(
      listing.listingStatus ||
      listing.publicData?.listingStatus ||
      listing.attributes?.publicData?.listingStatus
    ) === "archived"
      ? "ARCHIVED"
      : "ACTIVE"}
  </span>

  <button
    type="button"
    className="listing-delete-btn"
    onClick={() => confirmDelete(listing)}
  >
    DELETE
  </button>
</div>

<span>
  <select
    className="action-select"
    defaultValue=""
    onChange={e => {
      const value = e.target.value;

      if (value === "edit" || value === "promote") {
        window.location.href = `/live?id=${listing.id}`;
      }

      if (value === "archive") {
        archiveListing(listing);
      }

      e.target.value = "";
    }}
  >
    <option value="" disabled>
      ACTION
    </option>

    <option value="edit">Edit</option>
    <option value="promote">Promote</option>
    <option value="pause">Pause</option>
    <option value="sold">Mark Sold</option>
    <option value="duplicate">Duplicate</option>
    <option value="relist">Relist</option>
    <option value="archive">Archive</option>
  </select>
</span>

  
<span className="listing-metric">
  {listing.views || "—"}
</span>

<span className="listing-metric">
  {listing.saves || "—"}
</span>

</div>
</div>
                      ))
                    ) : (
                      <div className="table-empty">
                        <strong>No active listings yet.</strong>
                        <p>Your machines will show here once they are listed.</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <div className="right-stack">
                <section className="panel side-panel">
                  <div className="panel-head">
                    <h2>Recent Inquiries</h2>
                    <a href="/account/messages">OPEN →</a>
                  </div>

             <div className="activity-list">
  {recentInquiries.length > 0 ? (
    recentInquiries.map(item => (
      <a
        href="/account/messages"
        className="inquiry-preview"
        key={item.id}
      >
        <strong>{item.buyer}</strong>
        <span>{cleanMachineTitle(item.title)}</span>
        <p>{item.message}</p>
      </a>
    ))
  ) : (
    <div>
      <span className="dot yellow"></span>
      <p>New buyer inquiries will appear here.</p>
    </div>
  )}
</div>
                </section>

                <section className="panel side-panel activity-panel">
                  <div className="panel-head">
                    <h2>Activity Log</h2>
                    <span className="small-note">LIVE</span>
                  </div>

                  <div className="activity-log">
                    {activityLog.length > 0 ? (
                      activityLog.slice(0, 8).map(event => (
                        <div className="activity-event" key={event.id}>
                          <span
                            className={
                              event.type === "error"
                                ? "event-dot red"
                                : "event-dot green"
                            }
                          ></span>

                          <div>
                            <p>{event.message}</p>
                            <small>{formatActivityTime(event.createdAt)}</small>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="activity-empty">
                        <span className="dot yellow"></span>
                        <p>Listing updates, price changes, and promotions will show here.</p>
                      </div>
                    )}
                  </div>
                </section>

                <section className="panel side-panel">
                  <div className="panel-head">
                    <h2>Saved Machines</h2>
                    <a href="/saved">VIEW ALL →</a>
                  </div>

                  <div className="saved-card-list">
                    {savedMachines.length > 0 ? (
                      savedMachines.slice(0, 6).map(machine => (
                        <a
                          key={machine.id || machine.title}
                          href={`/listing/${slugify(machine.title)}?from=account`}
                          className="saved-card"
                        >
                          <img
                            src={
                              machine.imageUrl ||
                              machine.image ||
                              "/images/hero-equipment-yard.jpg"
                            }
                            alt={machine.title}
                          />

                          <div className="saved-card-body">
                            <strong>{cleanMachineTitle(machine.title)}</strong>

                            <span>
                              {machine.price || "Call for Price"}
                              {machine.hours ? ` • ${machine.hours}` : ""}
                            </span>
                          </div>
                        </a>
                      ))
                    ) : (
                      <div className="saved-empty">
                        <span className="dot yellow"></span>
                        <p>Saved listings and watchlist machines will show here.</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <section className="panel performance-panel">
                <div className="panel-head">
                  <h2>Performance</h2>
                  <span className="small-note">COMING ONLINE</span>
                </div>

                <div className="perf-grid">
                  <div>
                    <span>Views</span>
                    <strong>—</strong>
                  </div>

                  <div>
                    <span>Saves</span>
                    <strong>—</strong>
                  </div>

                  <div>
                    <span>Messages</span>
                    <strong>—</strong>
                  </div>

                  <div>
                    <span>Sold / Closed</span>
                    <strong>—</strong>
                  </div>
                </div>
              </section>
            </div>
          </section>
        </section>
      </main>

<Footer />
                      
      <style jsx>{`
:global(html),
:global(body) {
  margin: 0;
  min-height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  background: #0b0b0b;
  color: #d6d6d6;
  font-family: Arial, sans-serif;
}

* {
  box-sizing: border-box;
}

main {
  height: 100vh;
  overflow: hidden;
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
  width: auto;
  display: block;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 14px;
}

.nav-links a,
.logout-btn {
  color: white;
  text-decoration: none;
  background: transparent;
  border: none;
  font-weight: 900;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: .5px;
  cursor: pointer;
}

.yellow-link {
  color: ${BRAND_YELLOW} !important;
}

.logout-btn {
  color: #9a9a9a;
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

.dashboard {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  gap: 8px;
  padding: 10px 1.25%;
  max-width: 1680px;
  height: calc(100vh - 64px);
  margin: 0 auto;
  overflow: hidden;
}

.rail {
  background: #111;
  border: 1px solid #252525;
  border-radius: 12px;
  padding: 6px;
  min-height: 0;
  overflow: hidden;
}

.rail-top {
  text-align: center;
  padding: 6px 4px 8px;
  border-bottom: 1px solid #252525;
  margin-bottom: 6px;
}

.user-dot {
  width: 140px;
  height: 72px;
  border: 1px solid #F2F2F2;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 10px;
  background: #050505;
  overflow: hidden;
  padding: 8px;
}

.user-dot img {
  width: 165%;
  height: 165%;
  object-fit: contain;
  object-position: center;
  display: block;
}

.rail-top strong {
  display: block;
  color: #f2f2f2;
  font-size: 12px;
}

.rail-top span {
  display: block;
  margin-top: 3px;
  color: #888;
  font-size: 10px;
}

.rail a {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #bdbdbd;
  text-decoration: none;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .35px;
  text-transform: uppercase;
  padding: 8px 7px;
  border-radius: 8px;
}

.rail a.active,
.rail a:hover {
  background: #1b1b1b;
  color: #f2f2f2;
}

.rail i {
  width: 16px;
  color: ${BRAND_YELLOW};
}

.content {
  min-width: 0;
  min-height: 0;
  height: 100%;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 6px;
  overflow: hidden;
}

.top-tools {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  align-items: stretch;
}

.dashboard-search {
  display: grid;
  grid-template-columns: 1fr 82px;

  background: #141414;

  border: 1px solid #252525;
  border-radius: 10px;

  overflow: hidden;

  box-shadow: 0 10px 26px rgba(0,0,0,.24);
}

.dashboard-search input {
  border: none;
  border-right: 1px solid #252525;

  padding: 0 12px;

  height: 36px;

  font-size: 11px;

  background: #141414;
  color: #D6D6D6;

  outline: none;

  min-width: 0;
}

.dashboard-search input::placeholder {
  color: #777;
}

.dashboard-search button {
  border: none;
  border-left: 1px solid #3a2d00;

  background: #151515;
  color: #FFC400;

  font-weight: 900;
  cursor: pointer;

  letter-spacing: .45px;
  font-size: 9px;

  text-transform: uppercase;
}

.dashboard-search button:hover {
  background: #1a1400;
}

.dashboard-search button:hover {
  background: #1a1400;
}

.status-pill {
  border: 1px solid rgba(56,161,105,.45);
  color: #38A169;

  border-radius: 10px;

  padding: 0 10px;

  font-size: 9px;
  font-weight: 900;
  letter-spacing: .45px;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  min-width: 72px;

  background: #101010;
  text-transform: uppercase;
}

.status-pill span {
  width: 6px;
  height: 6px;

  border-radius: 50%;
  background: #38A169;

  box-shadow: 0 0 10px rgba(56,161,105,.45);
}

.main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 6px;
  align-items: stretch;
  min-height: 0;
  overflow: hidden;
}

.left-column {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 6px;
  overflow: hidden;
}

.stats {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
  width: 100%;
}

.stat-card,
.panel {
  background: #151515;
  border: 1px solid #282828;
  border-radius: 12px;
}

.stat-card {
  padding: 10px 10px 9px;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  text-align: center;

  background: #121212;
  border: 1px solid #242424;
  border-radius: 10px;
}

.stat-card span {
  display: block;

  color: #7c7c7c;

  font-size: 9px;
  text-transform: uppercase;

  font-weight: 900;
  letter-spacing: .45px;

  margin-bottom: 3px;
}

.stat-card strong {
  display: block;

  color: #f2f2f2;

  font-size: 24px;
  line-height: 1;

  margin: 2px 0;
}

.stat-card strong.green {
  color: #38A169;
  font-size: 16px;
}

.stat-card p {
  margin: 2px 0 0;

  color: #666;

  font-size: 9px;
  line-height: 1.2;
}

.panel {
  padding: 8px 10px;
}

.listings-panel {
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;

  gap: 10px;

  margin-bottom: 8px;
  padding-bottom: 7px;

  border-bottom: 1px solid #202020;

  flex: 0 0 auto;
}

.panel-head h2 {
  margin: 0;

  color: #f2f2f2;

  font-size: 12px;
  font-weight: 900;

  text-transform: uppercase;
  letter-spacing: .55px;
}

.panel-head a,
.small-note {
  color: #FFC400;

  text-decoration: none;

  font-size: 9px;
  font-weight: 900;

  letter-spacing: .45px;
  text-transform: uppercase;
}

.listing-table {
  flex: 1 1 auto;
  min-height: 0;

  overflow-y: auto;

  border: 1px solid #252525;
  border-radius: 10px;

  background: #101010;

  scrollbar-width: thin;
  scrollbar-color: rgba(255,196,0,.45) rgba(255,255,255,.04);
}

.listing-table::-webkit-scrollbar,
.activity-list::-webkit-scrollbar,
.activity-log::-webkit-scrollbar,
.saved-card-list::-webkit-scrollbar {
  width: 8px;
}

.listing-table::-webkit-scrollbar-track,
.activity-list::-webkit-scrollbar-track,
.activity-log::-webkit-scrollbar-track,
.saved-card-list::-webkit-scrollbar-track {
  background: rgba(255,255,255,.04);
  border-radius: 999px;
}

.listing-table::-webkit-scrollbar-thumb,
.activity-list::-webkit-scrollbar-thumb,
.activity-log::-webkit-scrollbar-thumb,
.saved-card-list::-webkit-scrollbar-thumb {
  background: rgba(255,196,0,.45);
  border-radius: 999px;
}

.listing-table::-webkit-scrollbar-thumb:hover,
.activity-list::-webkit-scrollbar-thumb:hover,
.activity-log::-webkit-scrollbar-thumb:hover,
.saved-card-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255,196,0,.7);
}

/* MY LISTINGS — OPERATING ROW */

.listing-op-head {
  display: grid;
  grid-template-columns: 108px 98px 88px 64px 76px 74px 52px 52px;
  gap: 10px;
  align-items: center;
  padding: 8px 10px 8px 86px;
  border-bottom: 1px solid #252525;
  background: #0f0f0f;
  color: #888;
  font-size: 9px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: .4px;
}
.listing-op-head span:nth-child(3) {
  padding-left: 20px;
}
.listing-op-head span:nth-child(6) {
  padding-left: 18px;
}
.listing-op-head span:nth-child(7) {
  padding-left: 52px;
}
.listing-op-head span:nth-child(8) {
  padding-left: 65px;
}
.listing-op-row {
  display: grid;
 grid-template-columns: 148px 1fr;
  grid-template-rows: auto auto;
  grid-template-areas:
    "photo title"
    "photo controls";
  gap: 6px 12px;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #242424;
 background: #141414;
}

.listing-op-row:hover {
  background: #181818;
}

.machine-photo-link {
  grid-area: photo;
  display: block;

  overflow: hidden;
  border-radius: 10px 0 0 10px;
}

.machine-photo-link img {
  width: 148px;
  height: 92px;

  object-fit: cover;

  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;

  border-top-right-radius: 0;
  border-bottom-right-radius: 0;

  border: none;

  display: block;
}

.machine-title-line {
  grid-area: title;
  justify-self: start;
  align-self: end;
  width: 100%;
  color: #F2F2F2;
  font-size: 13px;
  font-weight: 900;
  line-height: 1.15;
  text-decoration: none;
  white-space: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}

.machine-title-line::-webkit-scrollbar {
  display: none;
}

.listing-op-controls {
  grid-area: controls;

  display: grid;

  grid-template-columns:
    128px
    74px
    58px
    74px
    78px
    56px
    56px;

  gap: 14px;

  align-items: center;
  justify-content: start;
}

.listing-hours {
  color: #7f7f7f;

  font-size: 12px;
  font-weight: 800;

  letter-spacing: .2px;

  padding-left: 22px;
}

.listing-metric {
  color: #8A8A8A;
  font-size: 11px;
  font-weight: 900;
  white-space: nowrap;
  padding-left: 64px;
}
.price-input {
  width: 74px;
  height: 28px;

  background: #0F0F0F;

  border: 1px solid #2F2F2F;
  border-radius: 8px;

  padding: 0 10px;

  color: #F2F2F2;

  font-size: 11px;
  font-weight: 900;

  outline: none;

  transition:
    border-color .15s ease,
    box-shadow .15s ease;
}

.price-input:hover {
  border-color: #444;
}

.price-input:focus {
  border-color: #FFC400;
  box-shadow: 0 0 0 1px rgba(255,196,0,.25);
}

.price-input.saved {
  border-color: #38A169;
  box-shadow: 0 0 0 1px rgba(56,161,105,.28);
}

.price-input.error {
  border-color: #E53E3E;
  box-shadow: 0 0 0 1px rgba(229,62,62,.28);
}

.age-green,
.age-yellow,
.age-red {
  font-size: 11px;
  font-weight: 900;
  white-space: nowrap;
  padding-left: 10px;
}

.age-green {
  color: #38A169;
}

.age-yellow {
  color: #FFC400;
}

.age-red {
  color: #E53E3E;
}

.listing-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 58px;
  min-width: 58px;
  height: 22px;

  padding: 0 8px;

  border-radius: 999px;

  font-size: 7px;
  font-weight: 900;

  letter-spacing: .5px;
  white-space: nowrap;

  text-transform: uppercase;
}

.listing-status.active {
  border: 1px solid rgba(56,161,105,.45);
  background: rgba(56,161,105,.10);
  color: #38A169;
}
.listing-status.archived {
  border: 1px solid rgba(160,160,160,.35);
  background: rgba(120,120,120,.10);
  color: #A0A0A0;
}

.listing-status-stack {
  display: grid;
  grid-template-rows: 22px 22px;

  gap: 3px;

  justify-items: center;
  align-items: center;

  width: 58px;

  margin-left: 0;
}

.listing-delete-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 58px;
  min-width: 58px;
  height: 22px;

  border-radius: 999px;

  font-size: 7px;
  font-weight: 900;

  letter-spacing: .5px;
  white-space: nowrap;

  text-transform: uppercase;

  border: 1px solid rgba(229,62,62,.35);

  background: rgba(229,62,62,.08);
  color: #E53E3E;

  cursor: pointer;

  transition:
    background .18s ease,
    border-color .18s ease;
}

.listing-delete-btn:hover {
  background: rgba(229,62,62,.18);
  border-color: rgba(229,62,62,.6);
}

.action-select {
  width: 78px;
  height: 28px;

  background: #0F0F0F;

  border: 1px solid #2F2F2F;
  border-radius: 8px;

  color: #F2F2F2;

  font-size: 8px;
  font-weight: 900;

  padding: 0 18px 0 10px;

  outline: none;
  cursor: pointer;

  text-transform: uppercase;

  margin-left: 10px;
}

.action-select:hover {
  border-color: #444;
}

.action-select:focus {
  border-color: #FFC400;
  box-shadow: 0 0 0 1px rgba(255,196,0,.25);
}

.right-stack {
  min-height: 0;
  overflow: hidden;
  display: grid;
  grid-template-rows: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.side-panel {
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.inquiry-preview {
  display: block;

  text-decoration: none;

  background: #101010;
  border: 1px solid #252525;
  border-radius: 10px;

  padding: 8px;

  transition:
    border-color .15s ease,
    background .15s ease;
}

.inquiry-preview:hover {
  border-color: #353535;
  background: #181818;
}

.inquiry-preview strong {
  display: block;

  color: #f2f2f2;

  font-size: 10px;
  font-weight: 900;

  margin-bottom: 4px;
}

.inquiry-preview span {
  display: block;

  color: #FFC400;

  font-size: 9px;
  font-weight: 900;

  margin-bottom: 4px;

  text-transform: uppercase;
  letter-spacing: .35px;
}

.inquiry-preview p {
  margin: 0;

  color: #9a9a9a;

  font-size: 10px;
  line-height: 1.35;
}

.activity-list,
.activity-log,
.saved-card-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.activity-log {
  display: grid;
  gap: 8px;
}

.activity-event {
  display: grid;
  grid-template-columns: 8px 1fr;

  gap: 8px;
  align-items: start;

  background: #101010;
  border: 1px solid #252525;
  border-radius: 10px;

  padding: 8px;

  transition:
    border-color .15s ease,
    background .15s ease;
}

.activity-event:hover {
  border-color: #353535;
  background: #181818;
}

.activity-event p {
  margin: 0;

  color: #d6d6d6;

  font-size: 10px;
  line-height: 1.35;
}

.activity-event small {
  display: block;

  margin-top: 4px;

  color: #777;

  font-size: 8px;
  font-weight: 900;

  text-transform: uppercase;
  letter-spacing: .35px;
}

.event-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-top: 4px;
}

.event-dot.green {
  background: #38A169;
}

.event-dot.red {
  background: #E53E3E;
}

.activity-empty,
.saved-empty,
.activity-list div {
  display: grid;
  grid-template-columns: 8px 1fr;
  gap: 8px;
  align-items: start;
  color: #aaa;
  font-size: 12px;
  line-height: 1.35;
}

.activity-list {
  display: grid;
  gap: 8px;
}

.saved-card-list {
  flex: 1 1 auto;
  min-height: 0;
  max-height: 100%;
  overflow-y: auto;
  padding-right: 4px;
  display: grid;
  gap: 8px;
}

.activity-list p {
  margin: 0;
}

.saved-card {
  display: grid;
  grid-template-columns: 148px 1fr;

  gap: 0;

  min-height: 92px;

  text-decoration: none;
  color: inherit;

  background: #101010;
  border: 1px solid #252525;
  border-radius: 10px;

  overflow: hidden;

  transition:
    border-color .15s ease,
    background .15s ease,
    transform .15s ease;
}

.saved-card:hover {
  background: #181818;
  border-color: #353535;

  transform: translateY(-1px);
}

.saved-card img {
  width: 148px;
  height: 92px;

  object-fit: cover;

  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;

  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.saved-card-body {
  padding: 8px 10px 8px 10px;

  min-width: 0;

  display: flex;
  flex-direction: column;
  justify-content: center;
}

.saved-card-body strong {
  display: block;

  color: #f2f2f2;

  font-size: 10px;
  font-weight: 900;

  line-height: 1.25;

  margin-bottom: 4px;
}

.saved-card-body span {
  display: block;

  color: #FFC400;

  font-size: 9px;
  font-weight: 900;

  letter-spacing: .25px;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-top: 4px;
}

.dot.yellow {
  background: ${BRAND_YELLOW};
}

.dot.green {
  background: #38A169;
}

.performance-panel {
  grid-column: 1 / -1;
  flex: 0 0 auto;
}

.perf-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.perf-grid div {
  background: #101010;
  border: 1px solid #252525;
  border-radius: 8px;
  padding: 10px;
}

.perf-grid span {
  display: block;
  color: #888;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: .35px;
  margin-bottom: 4px;
}

.perf-grid strong {
  color: #f2f2f2;
  font-size: 18px;
}

.mobile-rail-menu summary {
  display: none;
}

.mobile-rail-menu {
  display: block;
}

/* TABLET */

@media (max-width: 1180px) {
  .main-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    overflow: visible;
  }

  .dashboard {
    height: auto;
    min-height: calc(100vh - 64px);
    overflow: visible;
  }

  main {
    height: auto;
    min-height: 100vh;
    overflow-y: auto;
  }

  .right-stack {
    grid-template-rows: auto;
  }

  .stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .content,
  .main-grid,
  .left-column,
  .listings-panel,
  .right-stack,
  .side-panel {
    height: auto;
    min-height: 0;
    overflow: visible;
  }

  .listing-table,
  .activity-list,
  .activity-log,
  .saved-card-list {
    max-height: none;
  }
}

/* MOBILE */

@media (max-width: 700px) {
  .dashboard {
    grid-template-columns: 1fr;
    padding: 10px 3% 40px;
    gap: 10px;
  }

  .mobile-rail-menu summary {
    list-style: none;
    display: flex;
    align-items: center;
    justify-content: space-between;

    background: #101010;
    border: 1px solid #2A2A2A;
    border-radius: 12px;

    padding: 12px 14px;

    color: #F2F2F2;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
    cursor: pointer;
  }

  .mobile-rail-menu summary::-webkit-details-marker {
    display: none;
  }

  .mobile-rail-menu[open] summary {
    margin-bottom: 10px;
  }

  .rail {
    padding: 0;
    background: transparent;
    border: none;
  }

  .rail-top {
    background: #111;
    border: 1px solid #252525;
    border-radius: 12px;
    margin-bottom: 8px;
  }

  .rail a {
    min-height: 42px;
    background: #111;
    border: 1px solid #252525;
    margin-bottom: 6px;
  }

  .top-tools {
    grid-template-columns: 1fr;
  }

  .status-pill {
    height: 34px;
    width: 100%;
  }

  .dashboard-search {
    grid-template-columns: 1fr;
  }

  .dashboard-search input {
    height: 38px;
    border-right: none;
    border-bottom: 1px solid #2A2A2A;
  }

  .dashboard-search button {
    height: 36px;
  }

  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .main-grid {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .listing-op-head {
    display: none;
  }

  .listing-op-row {
    grid-template-columns: 112px minmax(0, 1fr);
    grid-template-areas:
      "photo title"
      "photo controls";

    gap: 8px 10px;

    border: 1px solid #2A2A2A;
    border-radius: 14px;
    background: #101010;

    margin-bottom: 10px;
    padding: 8px;
  }

  .machine-photo-link img {
    width: 112px;
    height: 88px;
    border-radius: 10px;
  }

  .machine-title-line {
    font-size: 13px;
    align-self: end;
  }

  .listing-op-controls {
    grid-template-columns: 1fr 1fr;
    gap: 7px;
  }

  .listing-hours,
  .listing-metric {
    padding-left: 0;
    font-size: 10px;
  }

  .price-input,
  .action-select {
    width: 100%;
    height: 34px;
  }

  .listing-status-stack {
    width: 100%;
    justify-items: stretch;
  }

  .listing-status,
  .listing-delete-btn {
    width: 100%;
    min-width: 0;
  }

  .saved-card-list {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding-bottom: 6px;
  }

  .saved-card {
    min-width: 220px;
    grid-template-columns: 1fr;
    flex: 0 0 220px;
  }

  .saved-card img {
    width: 100%;
    height: 120px;
  }

  .perf-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 650px) {
  .nav-links a:not(.yellow-link):not(.login-icon),
  .logout-btn {
    display: none;
  }

  .stats {
    grid-template-columns: 1fr 1fr;
  }
}
`}</style>
    </>
  );
}
