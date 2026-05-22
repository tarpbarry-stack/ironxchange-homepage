import Head from "next/head";
import { useEffect, useState } from "react";

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

export default function MessagesPage() {
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState([]);

  useEffect(() => {
    async function loadMessages() {
      try {
        const SharetribeSdk = await import("sharetribe-flex-sdk");

        const sdk = SharetribeSdk.createInstance({
          clientId: process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
        });

        const response = await sdk.transactions.query({
          only: "sale",
          include: ["listing", "customer"],
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

            email:
              protectedData?.buyerEmail || "",

            phone:
              protectedData?.buyerPhone || "",

            message:
              protectedData?.message ||
              "No message provided"
          };
        });

        setThreads(formatted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadMessages();
  }, []);

  return (
    <>
      <Head>
        <title>Messages | IronXchange</title>
      </Head>

      <main>
        <div className="page">
          <div className="top">
            <h1>Inquiries</h1>

            <a href="/account">
              ← Dashboard
            </a>
          </div>

          {loading ? (
            <div className="empty">
              Loading inquiries...
            </div>
          ) : threads.length === 0 ? (
            <div className="empty">
              No inquiries yet.
            </div>
          ) : (
            <div className="thread-list">
              {threads.map(thread => (
                <div className="thread" key={thread.id}>
                  <div className="thread-top">
                    <div>
                      <strong>{thread.title}</strong>

                      <span>
                        {thread.buyer}
                      </span>
                    </div>

                    <small>
                      {formatTime(thread.createdAt)}
                    </small>
                  </div>

                  <p>{thread.message}</p>

                  <div className="contact-row">
                    {thread.phone ? (
                      <span>{thread.phone}</span>
                    ) : null}

                    {thread.email ? (
                      <span>{thread.email}</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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

        .page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 3%;
        }

        .top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        h1 {
          margin: 0;
          font-size: 30px;
        }

        .top a {
          color: ${BRAND_YELLOW};
          text-decoration: none;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .empty {
          background: #151515;
          border: 1px solid #282828;
          border-radius: 14px;
          padding: 28px;
          color: #999;
        }

        .thread-list {
          display: grid;
          gap: 14px;
        }

        .thread {
          background: #151515;
          border: 1px solid #282828;
          border-radius: 14px;
          padding: 20px;
        }

        .thread-top {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 14px;
        }

        .thread-top strong {
          display: block;
          font-size: 16px;
          margin-bottom: 6px;
        }

        .thread-top span {
          color: #999;
          font-size: 13px;
        }

        .thread-top small {
          color: #777;
          white-space: nowrap;
        }

        .thread p {
          margin: 0;
          line-height: 1.6;
          color: #ddd;
        }

        .contact-row {
          display: flex;
          gap: 14px;
          margin-top: 16px;
          flex-wrap: wrap;
        }

        .contact-row span {
          background: #101010;
          border: 1px solid #333;
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 12px;
          color: #bbb;
        }
      `}</style>
    </>
  );
}
