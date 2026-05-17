import Head from "next/head";
import { useEffect, useState } from "react";

const BRAND_YELLOW = "#FFC400";
const STAGING = "https://staging.ironxchange.com";

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
const [user, setUser] = useState(null);
const [myListings, setMyListings] = useState([]);
const [searchQuery, setSearchQuery] = useState("");
  
  useEffect(() => {
    async function loadAccount() {
      try {
        const SharetribeSdk = await import("sharetribe-flex-sdk");

        const sdk = SharetribeSdk.createInstance({
          clientId: process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
        });

       const response = await sdk.currentUser.show();

const currentUser = response.data.data;

setUser(currentUser);

const userId = currentUser.id?.uuid || currentUser.id;

const listingsRes = await fetch(
  `/api/account-listings?authorId=${userId}`
);

const listingsData = await listingsRes.json();

setMyListings(Array.isArray(listingsData) ? listingsData : []);
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
  const displayName = profile.displayName || "IronXchange User";
  const companyName = profile.publicData?.companyName || "Company not added";

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
                <i className="fa-regular fa-user"></i>
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
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
                <strong>—</strong>
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
                    <span>Price</span>
                    <span>Age</span>
                    <span>Status</span>
                    <span>Inquiries</span>
                    <span>Actions</span>
                  </div>

                  {myListings.length > 0 ? (
  myListings.map((listing) => (
    <div className="table-row" key={listing.id}>
      <span>{listing.title}</span>
     <input
  <input
  className="price-input"
  defaultValue={Number(
    listing.price.replace("$", "").replace(/,/g, "")
  ).toLocaleString()}
  onKeyDown={async (e) => {
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
      <span>{listing.age ?? "—"}</span>
      <span>Active</span>
      <span>—</span>
      <span>
        <a href={listing.link}>View</a>
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

              <section className="panel side-panel">
                <div className="panel-head">
                  <h2>Saved Machines</h2>
                  <a href="/saved">VIEW →</a>
                </div>

                <div className="activity-list">
                  <div>
                    <span className="dot yellow"></span>
                    <p>Saved listings and watchlist machines will show here.</p>
                  </div>

                  <div>
                    <span className="dot green"></span>
                    <p>Price alerts and status changes later.</p>
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
          height: 76px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 5%;
          background: #050505;
          border-bottom: 1px solid rgba(255,255,255,.08);
        }

        .logo-img {
          height: 42px;
          display: block;
          width: auto;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .nav-links a,
        .logout-btn {
          color: white;
          text-decoration: none;
          background: transparent;
          border: none;
          font-weight: 900;
          text-transform: uppercase;
          font-size: 13px;
          letter-spacing: .6px;
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
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          font-size: 15px !important;
        }

        .login-icon.logged-in {
          border-color: #38A169;
          color: #38A169 !important;
        }

        .dashboard {
          display: grid;
          grid-template-columns: 230px 1fr;
          gap: 22px;
          padding: 24px 4% 60px;
          max-width: 1600px;
          margin: 0 auto;
        }

        .rail {
          background: #111;
          border: 1px solid #252525;
          border-radius: 18px;
          padding: 16px;
          height: fit-content;
        }

        .rail-top {
          text-align: center;
          padding: 12px 8px 18px;
          border-bottom: 1px solid #252525;
          margin-bottom: 14px;
        }

        .user-dot {
          width: 50px;
          height: 50px;
          border: 2px solid #38A169;
          color: #38A169;
          border-radius: 50%;
          display: grid;
          place-items: center;
          margin: 0 auto 12px;
          font-size: 22px;
        }

        .rail-top strong {
          display: block;
          color: #f2f2f2;
          font-size: 14px;
        }

        .rail-top span {
          display: block;
          margin-top: 5px;
          color: #888;
          font-size: 12px;
        }

        .rail a {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #bdbdbd;
          text-decoration: none;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .45px;
          text-transform: uppercase;
          padding: 13px 12px;
          border-radius: 10px;
        }

        .rail a.active,
        .rail a:hover {
          background: #1b1b1b;
          color: #f2f2f2;
        }

        .rail i {
          width: 18px;
          color: ${BRAND_YELLOW};
        }

        .content {
          min-width: 0;
        }

        .top-tools {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 14px;
          align-items: stretch;
          margin-bottom: 18px;
        }

        .dashboard-search {
          display: grid;
          grid-template-columns: 1fr 96px;
          background: #141414;
          border: 1px solid #282828;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 16px 45px rgba(0,0,0,.25);
        }

        .dashboard-search input {
          border: none;
          border-right: 1px solid #2A2A2A;
          padding: 15px 14px;
          font-size: 13px;
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
          letter-spacing: .4px;
        }

        .status-pill {
          border: 1px solid #2f855a;
          color: #38A169;
          border-radius: 14px;
          padding: 0 10px;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .4px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-width: 74px;
          background: #111;
        }

        .status-pill span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #38A169;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 18px;
        }

        .stat-card,
        .panel {
          background: #151515;
          border: 1px solid #282828;
          border-radius: 16px;
        }

        .stat-card {
          padding: 18px;
        }

        .stat-card span {
          display: block;
          color: #8f8f8f;
          font-size: 11px;
          text-transform: uppercase;
          font-weight: 900;
          letter-spacing: .5px;
          margin-bottom: 8px;
        }

        .stat-card strong {
          display: block;
          color: #f2f2f2;
          font-size: 26px;
          margin-bottom: 6px;
        }

        .stat-card strong.green {
          color: #38A169;
          font-size: 20px;
        }

        .stat-card p {
          margin: 0;
          color: #777;
          font-size: 12px;
        }

        .main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.55fr) minmax(320px, .85fr);
          gap: 18px;
        }

        .panel {
          padding: 20px;
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
          gap: 14px;
          margin-bottom: 16px;
        }

        .panel-head h2 {
          margin: 0;
          color: #f2f2f2;
          font-size: 15px;
          text-transform: uppercase;
          letter-spacing: .45px;
        }

        .panel-head a,
        .small-note {
          color: ${BRAND_YELLOW};
          text-decoration: none;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .4px;
          text-transform: uppercase;
        }

        .listing-table {
          border: 1px solid #252525;
          border-radius: 12px;
          overflow: hidden;
        }

        .table-row {
          display: grid;
          grid-template-columns: 1.5fr .75fr .45fr .7fr .7fr .75fr;
          gap: 10px;
          padding: 13px 14px;
          border-bottom: 1px solid #252525;
          font-size: 13px;
        }

        .table-head {
          background: #101010;
          color: #8f8f8f;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .45px;
        }

        .table-empty {
          padding: 22px 14px;
          color: #9a9a9a;
          line-height: 1.6;
          font-size: 14px;
        }

        .table-empty strong {
          display: block;
          color: #f2f2f2;
          margin-bottom: 6px;
        }

        .table-empty p {
          margin: 0;
        }

        .price-input {
  width: 100%;
  background: #101010;
  border: 1px solid #2A2A2A;
  border-radius: 8px;
  padding: 8px 10px;
  color: #f2f2f2;
  font-size: 13px;
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
        .activity-list {
          display: grid;
          gap: 14px;
        }

        .activity-list div {
          display: grid;
          grid-template-columns: 10px 1fr;
          gap: 12px;
          align-items: start;
          color: #aaa;
          font-size: 14px;
          line-height: 1.5;
        }

        .activity-list p {
          margin: 0;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-top: 6px;
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
          gap: 12px;
        }

        .perf-grid div {
          background: #101010;
          border: 1px solid #252525;
          border-radius: 12px;
          padding: 16px;
        }

        .perf-grid span {
          display: block;
          color: #888;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .4px;
          margin-bottom: 8px;
        }

        .perf-grid strong {
          color: #f2f2f2;
          font-size: 22px;
        }
        
@media (max-width: 1180px) {
  .dashboard-search {
    grid-template-columns: minmax(0, 1fr) 82px;
  }

  .dashboard-search input {
    padding: 13px 12px;
    font-size: 12px;
  }

  .dashboard-search button {
    font-size: 11px;
  }

  .status-pill {
    min-width: 68px;
    font-size: 9px;
    padding: 0 8px;
  }
}

   @media (max-width: 700px) {
  .dashboard {
    grid-template-columns: 1fr;
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
}
        
        @media (max-width: 650px) {
  .top-tools {
    grid-template-columns: 1fr;
  }

  .status-pill {
    height: 42px;
    width: 100%;
  }
}

        @media (max-width: 650px) {
          .dashboard-search {
            grid-template-columns: 1fr;
          }

          .dashboard-search input {
            border-right: none;
            border-bottom: 1px solid #2A2A2A;
          }

          .dashboard-search button {
            padding: 15px;
          }
        }
      `}</style>
    </>
  );
}
