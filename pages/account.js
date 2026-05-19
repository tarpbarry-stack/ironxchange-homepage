import Head from "next/head";
import { useEffect, useState } from "react";

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

  const profile = user?.attributes?.profile || {};
  const publicData = profile?.publicData || {};

  const displayName =
    publicData.companyName || profile?.displayName || "IronXchange User";

  const companyName = publicData.sellerName || profile?.abbreviatedName || "";

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

            <button type="button" onClick={handleLogout} className="logout-btn">
              LOGOUT
            </button>

            <a href="/account" className="login-icon logged-in" aria-label="Account">
              <i className="fa-regular fa-user"></i>
            </a>
          </div>
        </nav>

        <section className="dashboard">
          <aside className="rail">
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

            <a href="/account/listings">
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

            <a href="/profile">
              <i className="fa-regular fa-id-card"></i>
              Profile
            </a>

            <a href="/account/settings">
              <i className="fa-solid fa-gear"></i>
              Settings
            </a>
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
                    <p>Average listing age</p>
                  </div>

                  <div className="stat-card">
                    <span>Saved Machines</span>
                    <strong>{savedMachines.length}</strong>
                    <p>Watchlist inventory</p>
                  </div>
                </div>

                <section className="panel listings-panel">
                  <div className="panel-head">
                    <h2>My Listings</h2>
                    <a href="/account/listings">MANAGE ALL →</a>
                  </div>

                  <div className="listing-table">
                    <div className="table-row table-head">
                      <span>Machine</span>
                      <span>Hours</span>
                      <span>Price</span>
                      <span>Age</span>
                      <span>Status</span>
                      <span>Actions</span>
                    </div>

                    {myListings.length > 0 ? (
                      myListings.map(listing => (
                        <div className="table-row" key={listing.id}>
                          <div className="machine-cell">
                            <a href={`/live?id=${listing.id}`} className="machine-link">
                              <img
                                src={
                                  listing.imageUrl ||
                                  listing.image ||
                                  "/images/hero-equipment-yard.jpg"
                                }
                                alt={listing.title}
                              />

                              <span>{cleanMachineTitle(listing.title)}</span>
                            </a>
                          </div>

                          <span>{listing.hours}</span>

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

                          <span className="listing-status active">ACTIVE</span>

                          <span>
                            <select
                              className="action-select"
                              defaultValue=""
                              onChange={e => {
                                const value = e.target.value;

                                if (value === "edit" || value === "promote") {
                                  window.location.href = `/live?id=${listing.id}`;
                                }
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
                    <div>
                      <span className="dot yellow"></span>
                      <p>New buyer inquiries will appear here.</p>
                    </div>

                    <div>
                      <span className="dot green"></span>
                      <p>Email remains primary. This keeps the record.</p>
                    </div>
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

      <style jsx>{`
  :global(html),
  :global(body) {
    margin: 0;
    height: 100%;
    overflow: hidden;
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
    width: 72px;
    height: 72px;
    border: 1px solid #F2F2F2;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 10px;
    overflow: hidden;
    background: #050505;
    flex-shrink: 0;
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
    grid-template-columns: 1fr 86px;
    background: #141414;
    border: 1px solid #282828;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0,0,0,.22);
  }

  .dashboard-search input {
    border: none;
    border-right: 1px solid #2A2A2A;
    padding: 10px 12px;
    font-size: 12px;
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
    background: ${BRAND_YELLOW};
    color: #050505;
    font-weight: 900;
    cursor: pointer;
    letter-spacing: .35px;
    font-size: 11px;
  }

  .status-pill {
    border: 1px solid #2f855a;
    color: #38A169;
    border-radius: 12px;
    padding: 0 8px;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: .35px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    min-width: 64px;
    background: #111;
  }

  .status-pill span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #38A169;
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
    grid-template-columns: repeat(3, 1fr);
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
    padding: 8px 10px;
  }

  .stat-card span {
    display: block;
    color: #8f8f8f;
    font-size: 9px;
    text-transform: uppercase;
    font-weight: 900;
    letter-spacing: .4px;
    margin-bottom: 3px;
  }

  .stat-card strong {
    display: block;
    color: #f2f2f2;
    font-size: 20px;
    margin-bottom: 1px;
  }

  .stat-card strong.green {
    color: #38A169;
    font-size: 16px;
  }

  .stat-card p {
    margin: 0;
    color: #777;
    font-size: 10px;
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
    margin-bottom: 6px;
    flex: 0 0 auto;
  }

  .panel-head h2 {
    margin: 0;
    color: #f2f2f2;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: .35px;
  }

  .panel-head a,
  .small-note {
    color: ${BRAND_YELLOW};
    text-decoration: none;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: .35px;
    text-transform: uppercase;
  }

  .listing-table {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    border: 1px solid #252525;
    border-radius: 10px;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 196, 0, .45) rgba(255,255,255,.04);
  }

  .listing-table::-webkit-scrollbar {
    width: 8px;
  }

  .listing-table::-webkit-scrollbar-track {
    background: rgba(255,255,255,.04);
    border-radius: 999px;
  }

  .listing-table::-webkit-scrollbar-thumb {
    background: rgba(255, 196, 0, .45);
    border-radius: 999px;
  }

  .listing-table::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 196, 0, .7);
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
    padding: 9px;
  }

  .activity-event p {
    margin: 0;
    color: #d6d6d6;
    font-size: 11px;
    line-height: 1.35;
  }

  .activity-event small {
    display: block;
    margin-top: 4px;
    color: #777;
    font-size: 9px;
    font-weight: 900;
    text-transform: uppercase;
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

  .activity-list,
  .saved-card-list {
    display: grid;
    gap: 8px;
  }

  .activity-list p {
    margin: 0;
  }

  .saved-card {
    display: grid;
    grid-template-columns: 86px 1fr;
    gap: 9px;
    text-decoration: none;
    color: inherit;
    background: #101010;
    border: 1px solid #252525;
    border-radius: 10px;
    overflow: hidden;
  }

  .saved-card:hover {
    background: #181818;
    border-color: #3a3a3a;
  }

  .saved-card img {
    width: 86px;
    height: 64px;
    object-fit: cover;
    background: #0b0b0b;
  }

  .saved-card-body {
    padding: 8px 8px 8px 0;
    min-width: 0;
  }

  .saved-card-body strong {
    display: block;
    color: #f2f2f2;
    font-size: 11px;
    line-height: 1.2;
    margin-bottom: 5px;
  }

  .saved-card-body span {
    display: block;
    color: #FFC400;
    font-size: 10px;
    font-weight: 900;
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
 

        @media (max-width: 1180px) {
          .main-grid {
            grid-template-columns: minmax(0, 1fr) 300px;
          }

          .dashboard-search {
            grid-template-columns: minmax(0, 1fr) 76px;
          }

          .table-row {
            grid-template-columns: minmax(150px, 1fr) 58px 70px 34px 56px 86px;
          }
        }

        @media (max-width: 700px) {
          .dashboard {
            grid-template-columns: 1fr;
            padding: 10px 3% 40px;
          }

          .main-grid,
          .stats,
          .perf-grid {
            grid-template-columns: 1fr;
          }

          .nav-links a:not(.yellow-link):not(.login-icon),
          .logout-btn {
            display: none;
          }

          .table-row {
            grid-template-columns: 1fr;
            gap: 6px;
          }

          .table-head {
            display: none;
          }

          .right-stack {
            grid-template-rows: auto auto auto;
          }

          .side-panel {
            min-height: auto;
          }

          .saved-card-list {
            display: flex;
            gap: 10px;
            overflow-x: auto;
            padding-bottom: 6px;
            -webkit-overflow-scrolling: touch;
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

          .saved-card-body {
            padding: 8px;
          }
        }

        @media (max-width: 650px) {
          .nav {
            height: 60px;
            padding: 8px 4%;
          }

          .logo-img {
            height: 34px;
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
            border-right: none;
            border-bottom: 1px solid #2A2A2A;
          }

          .dashboard-search button {
            padding: 10px;
          }
        }
      `}</style>
    </>
  );
}
