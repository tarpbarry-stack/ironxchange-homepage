import Head from "next/head";
import { useEffect, useState } from "react";

const BRAND_YELLOW = "#FFC400";

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function loadAccount() {
      try {
        const SharetribeSdk = await import("sharetribe-flex-sdk");

        const sdk = SharetribeSdk.createInstance({
          clientId: process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
        });

        const response = await sdk.currentUser.show();

        setUser(response.data.data);
      } catch {
        window.location.href = `/login?next=${encodeURIComponent("/account")}`;
      } finally {
        setLoading(false);
      }
    }

    loadAccount();
  }, []);

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
  const email = user?.attributes?.email || "Email not available";

  if (loading) {
    return (
      <main className="loading">
        Loading account...
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
            <a href="https://staging.ironxchange.com/l/new" className="yellow-link">
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

        <section className="shell">
          <aside className="side">
            <div className="account-card">
              <div className="user-dot">
                <i className="fa-regular fa-user"></i>
              </div>

              <h2>{displayName}</h2>
              <p>{companyName}</p>
              <span>{email}</span>
            </div>

            <div className="side-menu">
              <a className="active" href="/account">Dashboard</a>
              <a href="/account/listings">My Listings</a>
              <a href="/saved">Saved Machines</a>
              <a href="/account/messages">Messages</a>
              <a href="/account/settings">Settings</a>
            </div>
          </aside>

          <section className="content">
            <div className="hero-row">
              <div>
                <h1>Account Console</h1>
                <p>Manage your listings, saved machines, inquiries, and account tools.</p>
              </div>

              <a href="https://staging.ironxchange.com/l/new" className="post-btn">
                POST FREE →
              </a>
            </div>

            <div className="stats">
              <div>
                <span>Active Listings</span>
                <strong>—</strong>
              </div>

              <div>
                <span>New Inquiries</span>
                <strong>—</strong>
              </div>

              <div>
                <span>Saved Machines</span>
                <strong>—</strong>
              </div>

              <div>
                <span>Account Status</span>
                <strong className="green">ACTIVE</strong>
              </div>
            </div>

            <div className="grid">
              <div className="panel wide">
                <div className="panel-head">
                  <h2>My Listings</h2>
                  <a href="/account/listings">View All</a>
                </div>

                <div className="placeholder-table">
                  <div className="row head">
                    <span>Machine</span>
                    <span>Price</span>
                    <span>Status</span>
                    <span>Inquiries</span>
                  </div>

                  <div className="empty-state">
                    Listing management comes next: inline price edits, mark sold, pause, duplicate, and inquiry counts.
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-head">
                  <h2>Messages</h2>
                  <a href="/account/messages">Open</a>
                </div>

                <p className="muted">
                  Email will stay primary. This area becomes your backup record for buyer/seller inquiries.
                </p>
              </div>

              <div className="panel">
                <div className="panel-head">
                  <h2>Saved Machines</h2>
                  <a href="/saved">Open</a>
                </div>

                <p className="muted">
                  Watch equipment, compare machines, and return to saved inventory quickly.
                </p>
              </div>
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
          width: auto;
          display: block;
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
          color: #9A9A9A;
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

        .shell {
          display: grid;
          grid-template-columns: 290px 1fr;
          gap: 22px;
          padding: 28px 5% 60px;
          max-width: 1500px;
          margin: 0 auto;
        }

        .side,
        .panel,
        .stats div {
          background: #151515;
          border: 1px solid #282828;
          border-radius: 16px;
        }

        .side {
          padding: 18px;
          height: fit-content;
        }

        .account-card {
          text-align: center;
          padding: 18px 12px 22px;
          border-bottom: 1px solid #282828;
        }

        .user-dot {
          width: 54px;
          height: 54px;
          border: 2px solid #38A169;
          color: #38A169;
          border-radius: 50%;
          display: grid;
          place-items: center;
          margin: 0 auto 14px;
          font-size: 24px;
        }

        .account-card h2 {
          margin: 0;
          color: #f2f2f2;
          font-size: 17px;
        }

        .account-card p {
          margin: 6px 0;
          color: #aaa;
          font-size: 14px;
        }

        .account-card span {
          color: #777;
          font-size: 12px;
        }

        .side-menu {
          display: grid;
          gap: 8px;
          padding-top: 18px;
        }

        .side-menu a {
          color: #bdbdbd;
          text-decoration: none;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .4px;
          padding: 13px 14px;
          border-radius: 10px;
        }

        .side-menu a.active,
        .side-menu a:hover {
          background: #202020;
          color: #f2f2f2;
        }

        .content {
          min-width: 0;
        }

        .hero-row {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: center;
          margin-bottom: 22px;
        }

        h1 {
          margin: 0;
          color: #f2f2f2;
          font-size: 30px;
          letter-spacing: -0.5px;
        }

        .hero-row p {
          margin: 8px 0 0;
          color: #9A9A9A;
        }

        .post-btn {
          background: ${BRAND_YELLOW};
          color: #050505;
          text-decoration: none;
          font-weight: 900;
          padding: 15px 24px;
          border-radius: 10px;
          font-size: 13px;
          white-space: nowrap;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 18px;
        }

        .stats div {
          padding: 18px;
        }

        .stats span {
          display: block;
          color: #8F8F8F;
          font-size: 12px;
          text-transform: uppercase;
          font-weight: 900;
          letter-spacing: .5px;
          margin-bottom: 10px;
        }

        .stats strong {
          color: #f2f2f2;
          font-size: 24px;
        }

        .stats .green {
          color: #38A169;
          font-size: 18px;
        }

        .grid {
          display: grid;
          grid-template-columns: 1.45fr 1fr;
          gap: 18px;
        }

        .panel {
          padding: 20px;
        }

        .wide {
          grid-row: span 2;
        }

        .panel-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .panel h2 {
          margin: 0;
          color: #f2f2f2;
          font-size: 16px;
          text-transform: uppercase;
          letter-spacing: .4px;
        }

        .panel-head a {
          color: ${BRAND_YELLOW};
          text-decoration: none;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .placeholder-table {
          border: 1px solid #252525;
          border-radius: 12px;
          overflow: hidden;
        }

        .row {
          display: grid;
          grid-template-columns: 1.6fr .8fr .7fr .7fr;
          gap: 12px;
          padding: 13px 14px;
          border-bottom: 1px solid #252525;
          font-size: 13px;
        }

        .row.head {
          color: #8F8F8F;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .4px;
          background: #101010;
        }

        .empty-state {
          color: #9A9A9A;
          line-height: 1.6;
          padding: 22px 14px;
          font-size: 14px;
        }

        .muted {
          color: #9A9A9A;
          line-height: 1.6;
          margin: 0;
          font-size: 14px;
        }

        @media (max-width: 950px) {
          .shell {
            grid-template-columns: 1fr;
          }

          .stats,
          .grid {
            grid-template-columns: 1fr;
          }

          .hero-row {
            align-items: flex-start;
            flex-direction: column;
          }

          .nav-links {
            gap: 12px;
          }

          .nav-links a:not(.yellow-link):not(.login-icon),
          .logout-btn {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
