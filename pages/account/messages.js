import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

const BRAND_YELLOW = "#FFC400";

function formatTime(date) {
  try {
    return new Date(date).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  } catch {
    return "";
  }
}

function cleanMachineTitle(title = "") {
  return String(title).replace(/\s\d{1,3}(,\d{3})*\sHrs/i, "");
}

function getImageUrlFromVariants(variants = {}) {
  const nonSquareVariant = Object.entries(variants).find(([key, value]) => {
    return value?.url && !key.toLowerCase().includes("square");
  });

  return (
    variants?.default?.url ||
    variants?.["landscape-crop"]?.url ||
    variants?.["landscape-crop2x"]?.url ||
    variants?.["listing-card-2x"]?.url ||
    variants?.["listing-card"]?.url ||
    variants?.["scaled-large"]?.url ||
    variants?.["scaled-medium"]?.url ||
    variants?.["scaled-small"]?.url ||
    nonSquareVariant?.[1]?.url ||
    Object.values(variants).find(v => v?.url)?.url ||
    ""
  );
}

export default function MessagesPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [threads, setThreads] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadMessages() {
      try {
        const SharetribeSdk = await import("sharetribe-flex-sdk");

        const sdk = SharetribeSdk.createInstance({
          clientId: process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
        });

        const currentUserResponse = await sdk.currentUser.show({
          include: ["profileImage"]
        });

        const currentUser = currentUserResponse.data.data;

        setUser({
          ...currentUser,
          included: currentUserResponse.data.included || []
        });

        const response = await sdk.transactions.query({
          only: "sale",
          include: ["listing", "listing.images", "customer"],
          perPage: 50
        });

        const transactions = response?.data?.data || [];
        const included = response?.data?.included || [];

        const listings = {};
        const users = {};
        const images = {};

        included.forEach(item => {
          const id = item.id?.uuid || item.id;

          if (item.type === "image") {
            images[id] = getImageUrlFromVariants(item.attributes?.variants || {});
          }

          if (item.type === "listing") {
            listings[id] = item;
          }

          if (item.type === "user") {
            users[id] = item;
          }
        });

        const formatted = transactions.map(tx => {
          const txId = tx.id?.uuid || tx.id;

          const listingId =
            tx.relationships?.listing?.data?.id?.uuid ||
            tx.relationships?.listing?.data?.id;

          const customerId =
            tx.relationships?.customer?.data?.id?.uuid ||
            tx.relationships?.customer?.data?.id;

          const listing = listings[listingId];
          const customer = users[customerId];

          const protectedData = tx.attributes?.protectedData || {};

          const imageId =
            listing?.relationships?.images?.data?.[0]?.id?.uuid ||
            listing?.relationships?.images?.data?.[0]?.id;

          return {
            id: txId,
            createdAt: tx.attributes?.createdAt,
            title: listing?.attributes?.title || "Equipment Listing",
            buyer: customer?.attributes?.profile?.displayName || "Buyer",
            message: protectedData?.message || "No message provided",
            phone: protectedData?.buyerPhone || "",
            email: protectedData?.buyerEmail || "",
            image: images[imageId] || "/images/hero-equipment-yard.jpg"
          };
        });

        setThreads(formatted);

        if (formatted.length > 0) {
          setSelectedId(formatted[0].id);
        }
      } catch (err) {
        console.error(err);
        window.location.href = `/login?next=${encodeURIComponent("/account/messages")}`;
      } finally {
        setLoading(false);
      }
    }

    loadMessages();
  }, []);

  const activeThread = useMemo(() => {
    return threads.find(t => t.id === selectedId);
  }, [threads, selectedId]);

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

  const logoUrl = getImageUrlFromVariants(profileImage?.attributes?.variants || {}) || null;

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
        <title>Inquiries | IronXchange</title>
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

              <a href="/account">
                <i className="fa-solid fa-gauge-high"></i>
                Dashboard
              </a>

              <a href="/account/my-listings">
                <i className="fa-solid fa-list"></i>
                Listings
              </a>

              <a className="active" href="/account/messages">
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

            <div className="messages-header">
              <div>
                <h1>Inquiries</h1>
                <p>Buyer inquiries tied directly to your listings.</p>
              </div>

              <div className="top-stats">
                <div>
                  <strong>{threads.length}</strong>
                  <span>Leads</span>
                </div>

                <div>
                  <strong>{threads.length}</strong>
                  <span>Unread</span>
                </div>
              </div>
            </div>

            <div className="crm-layout">
              <section className="queue">
                {threads.length === 0 ? (
                  <div className="empty">No inquiries yet.</div>
                ) : (
                  threads.map(thread => (
                    <button
                      key={thread.id}
                      className={`queue-card ${selectedId === thread.id ? "active" : ""}`}
                      onClick={() => setSelectedId(thread.id)}
                    >
                      <img
                        src={thread.image}
                        alt={thread.title}
                        className="queue-photo"
                      />

                      <div className="queue-main">
                        <strong>{thread.buyer}</strong>
                        <span>{cleanMachineTitle(thread.title)}</span>
                        <small>{formatTime(thread.createdAt)}</small>
                        <p>{thread.message}</p>
                      </div>
                    </button>
                  ))
                )}
              </section>

              <section className="thread-panel">
                {activeThread ? (
                  <>
                    <div className="thread-top">
                      <div>
                        <h2>{cleanMachineTitle(activeThread.title)}</h2>
                        <span>{activeThread.buyer}</span>

                        <div className="buyer-contact-row">
                          {activeThread.phone ? <span>{activeThread.phone}</span> : null}
                          {activeThread.email ? <span>{activeThread.email}</span> : null}
                        </div>
                      </div>

                      <div className="thread-actions">
                        {activeThread.phone ? (
                          <a href={`tel:${activeThread.phone}`}>Call</a>
                        ) : null}

                        {activeThread.email ? (
                          <a href={`mailto:${activeThread.email}`}>Email</a>
                        ) : null}
                      </div>
                    </div>

                    <div className="machine-strip">
                      <img src={activeThread.image} alt={activeThread.title} />

                      <div>
                        <strong>{cleanMachineTitle(activeThread.title)}</strong>
                        <span>Inquiry opened {formatTime(activeThread.createdAt)}</span>
                      </div>
                    </div>

                    <div className="message-card buyer">
                      <small>{formatTime(activeThread.createdAt)}</small>
                      <p>{activeThread.message}</p>
                    </div>

                    <div className="reply-box">
                      <textarea
                        placeholder="Reply tools coming next..."
                        rows={5}
                      />

                      <button type="button">SEND REPLY</button>
                    </div>
                  </>
                ) : (
                  <div className="empty">Select an inquiry.</div>
                )}
              </section>
            </div>
          </section>
        </section>
      </main>

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
  grid-template-rows: auto auto minmax(0, 1fr);
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

.messages-header {
  background: #151515;
  border: 1px solid #282828;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.messages-header h1 {
  margin: 0;
  color: #f2f2f2;
  font-size: 24px;
  text-transform: uppercase;
}

.messages-header p {
  margin: 5px 0 0;
  color: #888;
  font-size: 12px;
}

.top-stats {
  display: flex;
  gap: 8px;
}

.top-stats div {
  background: #101010;
  border: 1px solid #252525;
  border-radius: 10px;
  padding: 10px 14px;
  min-width: 82px;
}

.crm-layout {
  display: grid;
  grid-template-columns: 420px minmax(0, 1fr);
  gap: 6px;
  min-height: 0;
  overflow: hidden;
}

.queue,
.thread-panel {
  background: #151515;
  border: 1px solid #282828;
  border-radius: 12px;
  min-height: 0;
  overflow-y: auto;
}

.queue {
  padding: 10px;
  display: grid;
  align-content: start;
  gap: 10px;
}

.queue-card {
  display: grid;
  grid-template-columns: 92px 1fr;
  gap: 12px;
  background: #101010;
  border: 1px solid #252525;
  border-radius: 12px;
  padding: 12px;
  text-align: left;
  cursor: pointer;
}

.queue-card.active {
  border-color: ${BRAND_YELLOW};
}

.queue-photo {
  width: 92px;
  height: 68px;
  object-fit: cover;
  border-radius: 9px;
  border: 1px solid #2A2A2A;
}

.queue-main strong {
  display: block;
  color: #f2f2f2;
  font-size: 14px;
}

.queue-main span {
  display: block;
  margin-top: 4px;
  color: ${BRAND_YELLOW};
  font-size: 12px;
  font-weight: 900;
}

.queue-main small {
  display: block;
  margin-top: 8px;
  color: #666;
  font-size: 10px;
}

.queue-main p {
  margin: 8px 0 0;
  color: #ccc;
  line-height: 1.45;
  font-size: 12px;
}

.thread-panel {
  padding: 16px;
  display: grid;
  grid-template-rows: auto auto auto minmax(0, 1fr);
  gap: 14px;
}

.thread-top {
  display: flex;
  justify-content: space-between;
  gap: 14px;
}

.thread-top h2 {
  margin: 0;
  color: #f2f2f2;
  font-size: 22px;
}

.buyer-contact-row {
  display: flex;
  gap: 10px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.buyer-contact-row span {
  background: #101010;
  border: 1px solid #333;
  border-radius: 999px;
  padding: 8px 12px;
  color: #bbb;
  font-size: 11px;
  font-weight: 800;
}

.thread-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}


.thread-actions a {
  height: 34px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  padding: 0 16px;

  background: #111111;
  border: 1px solid #2A2A2A;
  border-radius: 8px;

  color: #EAEAEA;
  text-decoration: none;

  font-size: 10px;
  font-weight: 900;
  letter-spacing: .45px;
  text-transform: uppercase;

  transition:
    border-color .15s ease,
    background .15s ease,
    color .15s ease;
}
.thread-actions a:hover {
  border-color: #FFC400;
  color: #FFC400;
  background: #161616;
}
.machine-strip {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 12px;
  background: #101010;
  border: 1px solid #252525;
  border-radius: 12px;
  padding: 10px;
}

.machine-strip img {
  width: 140px;
  height: 92px;
  object-fit: cover;
  border-radius: 9px;
}

.message-card {
  background: #101010;
  border: 1px solid #252525;
  border-radius: 12px;
  padding: 18px;
}

.reply-box {
  display: grid;
  gap: 12px;
}

.reply-box textarea {
  width: 100%;
  border: 1px solid #333;
  background: #0d0d0d;
  color: white;
  border-radius: 10px;
  padding: 14px;
  font-size: 15px;
  font-family: inherit;
}

.reply-box button {
  height: 38px;

  border: 1px solid #3A2D00;
  border-radius: 8px;

  background: #1A1400;
  color: #FFC400;

  padding: 0 18px;

  font-size: 11px;
  font-weight: 900;
  letter-spacing: .5px;
  text-transform: uppercase;

  cursor: pointer;

  transition:
    background .15s ease,
    border-color .15s ease,
    color .15s ease;
}

.reply-box button:hover {
  background: #241B00;
  border-color: #FFC400;
}

.mobile-rail-menu summary {
  display: none;
}

.mobile-rail-menu {
  display: block;
}

@media (max-width: 850px) {
  .crm-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .dashboard {
    grid-template-columns: 1fr;
    height: auto;
  }

  .mobile-rail-menu summary {
    display: flex;
  }

  .rail {
    background: transparent;
    border: none;
    padding: 0;
  }
}
`}</style>
    </>
  );
}

