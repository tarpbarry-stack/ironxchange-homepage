import Head from "next/head";
import { useEffect, useState } from "react";

const BRAND_YELLOW = "#FFC400";
const STAGING = "https://staging.ironxchange.com";

function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getSavedListingIds(profile = {}) {
  const fromSharetribe = profile?.privateData?.savedListings;

  if (Array.isArray(fromSharetribe)) {
    return fromSharetribe.map(String);
  }

  try {
    const saved = JSON.parse(
      localStorage.getItem("ironxchangeSaved") || "[]"
    );

    return Array.isArray(saved)
      ? saved.map(item => String(item?.id || item))
      : [];
  } catch {
    return [];
  }
}

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [savedMachines, setSavedMachines] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

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

console.log("ACCOUNT SAVED IDS:", savedIds);
console.log("ACCOUNT ALL LISTINGS SAMPLE:", allListingsData?.[0]);

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

console.log("ACCOUNT MATCHED SAVED MACHINES:", saved);

setSavedMachines(saved);
      } catch {
        window.location.href = `/login?next=${encodeURIComponent("/account")}`;
      } finally {
        setLoading(false);
      }
    }

    loadAccount();
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
  const protectedData = profile?.protectedData || {};

  const displayName = profile?.displayName || "IronXchange User";
  const companyName = profile?.abbreviatedName || "";
  const phoneNumber = protectedData?.phoneNumber || "";

  const imageId = user?.relationships?.profileImage?.data?.id?.uuid || null;

  const profileImage = user?.included?.find(
    item => item?.type === "image" && item?.id?.uuid === imageId
  );

  const variants = profileImage?.attributes?.variants || {};

  const logoUrl =
    variants?.default?.url ||
    variants?.squareSmall?.url ||
    variants?.squareSmall2x?.url ||
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

            <a href={`${STAGING}/l/new`} className="yellow-link">
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

            <div className="stats">
              <div className="stat-card">
                <span>Active Listings</span>
                <strong>{myListings.length}</strong>
                <p>Live machines for sale</p>
              </div>

              <div className="stat-card">
                <span>New Inquiries</span>
                <strong>—</strong>
                <p>Buyer activity</p>
              </div>

              <div className="stat-card">
                <span>Saved Machines</span>
                <strong>{savedMachines.length}</strong>
                <p>Watchlist inventory</p>
              </div>

              <div className="stat-card">
                <span>Age</span>
                <strong className="green">18</strong>
                <p>Average listing age</p>
              </div>
            </div>

            <div className="main-grid">
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
                          <img
                            src={listing.imageUrl || listing.image}
                            alt={listing.title}
                          />
                          <span>
                            {String(listing.title || "").replace(
                              /\s\d{1,3}(,\d{3})*\sHrs/i,
                              ""
                            )}
                          </span>
                        </div>

                        <span>{listing.hours}</span>

                        <input
                          className="price-input"
                          defaultValue={Number(
                            String(listing.price || "")
                              .replace("$", "")
                              .replace(/,/g, "")
                          ).toLocaleString()}
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
                            } else {
                              input.classList.add("error");
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
                          <select className="action-select" defaultValue="">
                            <option value="" disabled>
                              ACTION
                            </option>
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

              <section className="panel side-panel">
                <div className="panel-head">
                  <h2>Saved Machines</h2>
                  <a href="/saved">VIEW ALL →</a>
                </div>

                <div className="activity-list">
                  {savedMachines.length > 0 ? (
                    savedMachines.slice(0, 4).map(machine => (
                      <a
                        key={machine.id || machine.title}
                        href={`/listing/${slugify(machine.title)}?from=account`}
                        className="saved-machine"
                      >
                        <img
                          src={
                            machine.imageUrl ||
                            machine.image ||
                            "/images/hero-equipment-yard.jpg"
                          }
                          alt={machine.title}
                        />

                        <div>
                          <strong>{machine.title}</strong>
                          <span>{machine.price || "Call for Price"}</span>
                        </div>
                      </a>
                    ))
                  ) : (
                    <div>
                      <span className="dot yellow"></span>
                      <p>Saved listings and watchlist machines will show here.</p>
                    </div>
                  )}
                </div>
              </section>

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
        :global(body) {
  margin: 0;
  background: #0b0b0b;
  color: #d6d6d6;
  font-family: Arial, sans-serif;
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
  width: auto;
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
  grid-template-columns: 180px 1fr;
  gap: 8px;
  padding: 10px 1.25% 40px;
  max-width: 1680px;
  margin: 0 auto;
}

.rail {
  background: #111;
  border: 1px solid #252525;
  border-radius: 12px;
  padding: 6px;
  height: fit-content;
}

.rail-top {
  text-align: center;
  padding: 6px 4px 8px;
  border-bottom: 1px solid #252525;
  margin-bottom: 6px;
}

.user-dot {
  width: 38px;
  height: 38px;
  border: 2px solid #38A169;
  color: #38A169;
  border-radius: 50%;
  display: grid;
  place-items: center;
  margin: 0 auto 8px;
  font-size: 18px;
  overflow: hidden;
}

.user-dot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
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
}

.top-tools {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  align-items: stretch;
  margin-bottom: 6px;
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

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-bottom: 6px;
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

.main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(300px, .8fr);
  gap: 6px;
}

.panel {
  padding: 8px 10px;
}

.listings-panel {
  grid-row: span 2;
}

.performance-panel {
  grid-column: 1 / -1;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
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
  border: 1px solid #252525;
  border-radius: 10px;
  overflow: hidden;
}

.table-row {
  display: grid;
  grid-template-columns: minmax(170px, 1fr) 64px 74px 36px 58px 90px;
  gap: 4px;
  align-items: center;
  padding: 6px 7px;
  border-bottom: 1px solid #252525;
  font-size: 12px;
}

.table-head {
  background: #101010;
  color: #8f8f8f;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: .35px;
}

.table-head span {
  display: flex;
  align-items: center;
  font-size: 10px;
}

.table-empty {
  padding: 14px 10px;
  color: #9a9a9a;
  line-height: 1.4;
  font-size: 12px;
}

.table-empty strong {
  display: block;
  color: #f2f2f2;
  margin-bottom: 4px;
}

.table-empty p {
  margin: 0;
}

.machine-cell {
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.machine-cell img {
  width: 42px;
  height: 34px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #2A2A2A;
  background: #0b0b0b;
}

.machine-cell span {
  font-weight: 800;
  color: #f2f2f2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.price-input {
  width: 72px;
  background: #101010;
  border: 1px solid #2A2A2A;
  border-radius: 6px;
  padding: 6px 8px;
  color: #f2f2f2;
  font-size: 12px;
  font-weight: 700;
  outline: none;
}

.price-input:focus {
  border-color: #FFC400;
}

.price-input.saved {
  border-color: #38A169;
  box-shadow: 0 0 0 1px rgba(56, 161, 105, .35);
}

.price-input.error {
  border-color: #E53E3E;
  box-shadow: 0 0 0 1px rgba(229, 62, 62, .35);
}

.age-green {
  color: #38A169;
  font-weight: 900;
}

.age-yellow {
  color: #D69E2E;
  font-weight: 900;
}

.age-red {
  color: #E53E3E;
  font-weight: 900;
}

.listing-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  justify-self: start;
  height: 24px;
  min-width: 52px;
  padding: 0 5px;
  border-radius: 999px;
  font-size: 8px;
  font-weight: 900;
  letter-spacing: .45px;
  white-space: nowrap;
}

.listing-status.active {
  border: 1px solid #2f855a;
  color: #38A169;
  background: rgba(56, 161, 105, .08);
}

.action-select {
  width: 86px;
  height: 26px;
  background: #101010;
  border: 1px solid #2A2A2A;
  border-radius: 6px;
  color: #f2f2f2;
  font-size: 8px;
  font-weight: 900;
  padding: 0 6px;
  outline: none;
  cursor: pointer;
}

.action-select:focus {
  border-color: #FFC400;
}

.activity-list {
  display: grid;
  gap: 8px;
}

.activity-list div {
  display: grid;
  grid-template-columns: 8px 1fr;
  gap: 8px;
  align-items: start;
  color: #aaa;
  font-size: 12px;
  line-height: 1.35;
}

.activity-list p {
  margin: 0;
}

.saved-machine {
  display: grid !important;
  grid-template-columns: 46px 1fr !important;
  gap: 8px !important;
  align-items: center !important;
  text-decoration: none;
  color: inherit;
  padding: 5px;
  border: 1px solid #252525;
  border-radius: 8px;
  background: #111;
}

.saved-machine:hover {
  border-color: #3a3a3a;
  background: #181818;
}

.saved-machine img {
  width: 46px;
  height: 36px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #2A2A2A;
}

.saved-machine strong {
  display: block;
  color: #f2f2f2;
  font-size: 11px;
  line-height: 1.15;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.saved-machine span {
  display: block;
  color: #FFC400;
  font-size: 10px;
  font-weight: 900;
  margin-top: 2px;
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
  .dashboard-search {
    grid-template-columns: minmax(0, 1fr) 76px;
  }

  .dashboard-search input {
    padding: 9px 10px;
    font-size: 11px;
  }

  .dashboard-search button {
    font-size: 10px;
  }

  .status-pill {
    min-width: 60px;
    font-size: 8px;
    padding: 0 7px;
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
