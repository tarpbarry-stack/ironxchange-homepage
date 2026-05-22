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

export default function MessagesPage() {
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    async function loadMessages() {
      try {
        const SharetribeSdk = await import("sharetribe-flex-sdk");

        const sdk = SharetribeSdk.createInstance({
          clientId: process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
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

        included.forEach(item => {
          const id = item.id?.uuid || item.id;

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

          const protectedData =
            tx.attributes?.protectedData || {};

          return {
            id: txId,

            createdAt: tx.attributes?.createdAt,

            title:
              listing?.attributes?.title ||
              "Equipment Listing",

            buyer:
              customer?.attributes?.profile?.displayName ||
              "Buyer",

            message:
              protectedData?.message ||
              "No message provided",

            phone:
              protectedData?.buyerPhone || "",

            email:
              protectedData?.buyerEmail || "",

           image:
  listing?.attributes?.publicData?.image ||
  listing?.attributes?.publicData?.imageUrl ||
  "/images/hero-equipment-yard.jpg"
          };
        });

        setThreads(formatted);

        if (formatted.length > 0) {
          setSelectedId(formatted[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadMessages();
  }, []);

  const activeThread = useMemo(() => {
    return threads.find(t => t.id === selectedId);
  }, [threads, selectedId]);

  return (
    <>
      <Head>
        <title>Messages | IronXchange</title>
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

            <a
              href="/account"
              className="login-icon logged-in"
            >
              <i className="fa-regular fa-user"></i>
            </a>
          </div>
        </nav>

        <section className="dashboard">
          <aside className="rail">
            <a href="/account">
              Dashboard
            </a>

            <a href="/account/my-listings">
              Listings
            </a>

            <a className="active" href="/account/messages">
              Inquiries
            </a>

            <a href="/saved">
              Saved
            </a>

            <a href="/account/profile">
              Profile
            </a>

            <a href="/account/settings">
              Settings
            </a>
          </aside>

          <section className="content">
            <div className="top">
              <div>
                <h1>Inquiries</h1>

                <p>
                  Buyer inquiries tied directly to your listings.
                </p>
              </div>

              <div className="top-stats">
                <div>
                  <strong>{threads.length}</strong>
                  <span>Leads</span>
                </div>

                <div>
                  <strong>
                    {threads.length}
                  </strong>
                  <span>Unread</span>
                </div>
              </div>
            </div>

            <div className="crm-layout">
              <section className="queue">
                {loading ? (
                  <div className="empty">
                    Loading inquiries...
                  </div>
                ) : threads.length === 0 ? (
                  <div className="empty">
                    No inquiries yet.
                  </div>
                ) : (
                  threads.map(thread => (
                    <button
                      key={thread.id}
                      className={`queue-card ${
                        selectedId === thread.id
                          ? "active"
                          : ""
                      }`}
                      onClick={() => setSelectedId(thread.id)}
                    >
                      <div>
                        <strong>
                          {thread.buyer}
                        </strong>

                        <span>
                          {cleanMachineTitle(thread.title)}
                        </span>
                      </div>

                      <small>
                        {formatTime(thread.createdAt)}
                      </small>

                      <p>
                        {thread.message}
                      </p>
                    </button>
                  ))
                )}
              </section>

              <section className="thread-panel">
                {activeThread ? (
                  <>
                    <div className="thread-top">
                      <div>
                        <h2>
                          {cleanMachineTitle(
                            activeThread.title
                          )}
                        </h2>

                        <span>
                          {activeThread.buyer}
                        </span>
                      </div>

                      <div className="thread-actions">
                        {activeThread.phone ? (
                          <a href={`tel:${activeThread.phone}`}>
                            Call
                          </a>
                        ) : null}

                        {activeThread.email ? (
                          <a href={`mailto:${activeThread.email}`}>
                            Email
                          </a>
                        ) : null}
                      </div>
                    </div>

                    <div className="message-card buyer">
                      <small>
                        {formatTime(activeThread.createdAt)}
                      </small>

                      <p>
                        {activeThread.message}
                      </p>
                    </div>

                    <div className="reply-box">
                      <textarea
                        placeholder="Reply tools coming next..."
                        rows={5}
                      />

                      <button>
                        SEND REPLY
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="empty">
                    Select an inquiry.
                  </div>
                )}
              </section>
            </div>
          </section>
        </section>
      </main>

      <style jsx>{`
        :global(body) {
          margin: 0;
          background: #0b0b0b;
          color: #f2f2f2;
          font-family: Arial, sans-serif;
        }

        * {
          box-sizing: border-box;
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
          border: 2px solid #38A169;
          color: #38A169 !important;
          border-radius: 50%;
          width: 26px;
          height: 26px;
          display: grid;
          place-items: center;
        }

        .dashboard {
          display: grid;
          grid-template-columns: 200px minmax(0,1fr);
          gap: 8px;
          padding: 10px 1.25%;
          height: calc(100vh - 64px);
        }

        .rail {
          background: #111;
          border: 1px solid #252525;
          border-radius: 12px;
          padding: 10px;
          display: grid;
          align-content: start;
          gap: 4px;
        }

        .rail a {
          color: #bdbdbd;
          text-decoration: none;
          padding: 10px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .rail a.active,
        .rail a:hover {
          background: #1b1b1b;
          color: #fff;
        }

        .content {
          min-width: 0;
          display: grid;
          grid-template-rows: auto minmax(0,1fr);
          gap: 8px;
        }

        .top {
          background: #151515;
          border: 1px solid #282828;
          border-radius: 12px;
          padding: 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        h1 {
          margin: 0;
          font-size: 28px;
        }

        .top p {
          margin: 8px 0 0;
          color: #888;
        }

        .top-stats {
          display: flex;
          gap: 14px;
        }

        .top-stats div {
          background: #101010;
          border: 1px solid #252525;
          border-radius: 10px;
          padding: 12px 16px;
          min-width: 90px;
        }

        .top-stats strong {
          display: block;
          font-size: 20px;
        }

        .top-stats span {
          color: #888;
          font-size: 10px;
          text-transform: uppercase;
        }

        .crm-layout {
          display: grid;
          grid-template-columns: 420px minmax(0,1fr);
          gap: 8px;
          min-height: 0;
        }

        .queue,
        .thread-panel {
          background: #151515;
          border: 1px solid #282828;
          border-radius: 12px;
          overflow-y: auto;
        }

        .queue {
          padding: 10px;
          display: grid;
          gap: 10px;
        }

        .queue-card {
          background: #101010;
          border: 1px solid #252525;
          border-radius: 12px;
          padding: 14px;
          text-align: left;
          cursor: pointer;
        }

        .queue-card.active {
          border-color: ${BRAND_YELLOW};
        }

        .queue-card strong {
          display: block;
          font-size: 14px;
        }

        .queue-card span {
          display: block;
          margin-top: 4px;
          color: #999;
          font-size: 12px;
        }

        .queue-card small {
          display: block;
          margin-top: 10px;
          color: #666;
        }

        .queue-card p {
          margin: 10px 0 0;
          color: #ccc;
          line-height: 1.5;
          font-size: 13px;
        }

        .thread-panel {
          padding: 20px;
          display: grid;
          grid-template-rows: auto auto 1fr;
          gap: 18px;
        }

        .thread-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .thread-top h2 {
          margin: 0;
          font-size: 22px;
        }

        .thread-top span {
          display: block;
          margin-top: 6px;
          color: #888;
        }

        .thread-actions {
          display: flex;
          gap: 10px;
        }

        .thread-actions a {
          background: #101010;
          border: 1px solid #333;
          border-radius: 999px;
          padding: 10px 16px;
          color: #fff;
          text-decoration: none;
          font-size: 12px;
          font-weight: 900;
        }

        .message-card {
          background: #101010;
          border: 1px solid #252525;
          border-radius: 12px;
          padding: 18px;
        }

        .message-card small {
          color: #777;
        }

        .message-card p {
          margin: 12px 0 0;
          line-height: 1.7;
          color: #ddd;
        }

        .reply-box {
          display: grid;
          gap: 14px;
          align-content: end;
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
          border: none;
          border-radius: 10px;
          background: ${BRAND_YELLOW};
          color: #050505;
          padding: 16px;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
        }

        .empty {
          color: #888;
          padding: 24px;
        }

        @media (max-width: 1100px) {
          .crm-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
