import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

const BRAND_YELLOW = "#FFC400";
const STAGING = "https://staging.ironxchange.com";

function cleanText(value) {
  return value ? String(value).trim() : "";
}

export default function InquirePage() {
  const router = useRouter();
  const { listingId } = router.query;

  const [listings, setListings] = useState([]);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [message, setMessage] = useState("Is this machine still available?");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/listings")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setListings(data);
      })
      .catch(() => {});
  }, []);

  const listing = useMemo(() => {
    if (!listingId || listings.length === 0) return null;
    return listings.find((item) => item.id === listingId);
  }, [listingId, listings]);

  const title = cleanText(listing?.title) || "Equipment Listing";
  const price = cleanText(listing?.price) || "Call for Price";
  const hours = cleanText(listing?.hours) || "Hours not listed";
  const location = cleanText(listing?.location) || "Location not listed";
  const image =
    listing?.imageUrl ||
    listing?.image ||
    listing?.images?.[0] ||
    "/images/hero-equipment-yard.jpg";

async function handleSubmit(e) {
  e.preventDefault();

  if (!listingId) {
    setStatus("error");
    return;
  }

  setLoading(true);
  setStatus("");

  try {
    const SharetribeSdk = await import("sharetribe-flex-sdk");

    const sdk = SharetribeSdk.createInstance({
      clientId: process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
    });

    const result = await sdk.transactions.initiate({
      processAlias: "default-inquiry/release-1",
      transition: "transition/inquire-without-payment",
      params: {
        listingId,
        protectedData: {
          message,
          buyerName,
          buyerEmail,
          buyerPhone
        }
      }
    });

    console.log("INQUIRY SUCCESS:", result);
    setStatus("success");
  } catch (err) {
    console.error("INQUIRY ERROR:", err);
    alert(err?.message || "Inquiry failed.");
    setStatus("error");
  } finally {
    setLoading(false);
  }
}

return (
    <>
      <Head>
        <title>Message Seller | IronXchange</title>

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
            <a href={`${STAGING}/l/new`} className="yellow-link">
              POST FREE
            </a>

            <a href="/saved" className="login-icon" aria-label="Saved Listings">
              <i className="fa-regular fa-star"></i>
            </a>

            <a href={`${STAGING}/login`} className="login-icon" aria-label="Login">
              <i className="fa-regular fa-user"></i>
            </a>
          </div>
        </nav>

        <section className="wrapper">
          <div className="card">
            <button
              type="button"
              className="back-link"
              onClick={() => router.back()}
            >
              ← Back to Listing
            </button>

  <div className="listing-card">
  <div
    className="card-photo"
    style={{
      backgroundImage: `url(${image})`
    }}
  />

  <div className="card-body">
    <div className="title-row">
      <h3>
        {title.replace(hours, "").trim()}
      </h3>

     <h3 className="hours-top">
  {hours}
</h3>
    </div>

    <div className="price-row">
      <strong>{price}</strong>

      <div className="meta">
        <span>⌖ {location}</span>
      </div>
    </div>
  </div>
</div>
            <div className="divider" />

            <p className="intro">
              Send the seller your contact information and message through IronXchange.
            </p>

            <form onSubmit={handleSubmit}>
              <label>
                Name
                <input
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Your name"
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="Your email"
                />
              </label>

              <label>
                Phone
                <input
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="Your phone number"
                />
              </label>

              <label>
                Message
                <textarea
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </label>

              <button className="send-btn" type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send Message"}
              </button>

              {status === "success" ? (
  <div className="success-box">
    <strong>Message Sent</strong>
    <p>The seller has received your inquiry through IronXchange.</p>
  </div>
) : null}

{status === "error" ? (
  <div className="error-box">
    <strong>Message Not Sent</strong>
    <p>Something went wrong. Please check your information and try again.</p>
  </div>
) : null}
            </form>
          </div>
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

        main {
          min-height: 100vh;
          background: #0b0b0b;
        }

        .nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 5%;
          background: #050505;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .logo-img {
          height: 78px;
          width: auto;
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
          font-size: 13px;
          letter-spacing: 0.6px;
        }

        .yellow-link {
          color: ${BRAND_YELLOW} !important;
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

        .wrapper {
          padding: 40px 20px;
          display: flex;
          justify-content: center;
        }

        .card {
          width: 100%;
          max-width: 820px;
          background: #151515;
          border: 1px solid #282828;
          border-radius: 18px;
          padding: 28px;
        }

        .back-link {
          background: transparent;
          border: none;
          padding: 0;
          margin: 0;
          color: rgba(255, 255, 255, 0.58);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.55px;
          text-transform: uppercase;
          cursor: pointer;
          font-family: inherit;
        }

        .listing-card {
  margin-top: 22px;
  text-decoration: none;
  color: inherit;
  border: 1px solid #242424;
  border-radius: 16px;
  overflow: hidden;
  background: #151515;
}

.card-photo {
  height: 240px;
  background-size: cover;
  background-position: center;
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

.card-body h3 {
  margin: 0;
  color: #F2F2F2;
  font-size: 16px;
  letter-spacing: -0.2px;
}

.hours-top {
  color: #8A8A8A;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .3px;
  white-space: nowrap;
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.price-row strong {
  color: #F2F2F2;
  font-size: 18px;
}

.meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #9A9A9A;
  flex-wrap: wrap;
}

.price-row span {
  color: #9A9A9A;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .4px;
}

h1 {
  margin: 0;
  font-size: 30px;
  line-height: 1.1;
  color: #f2f2f2;
}

        .divider {
          height: 1px;
          background: #282828;
          margin: 26px 0;
        }

        .intro {
          color: #b7b7b7;
          line-height: 1.6;
          margin: 0 0 24px;
        }

        form {
          display: grid;
          gap: 16px;
        }

        label {
          display: grid;
          gap: 8px;
          color: #ddd;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        input,
        textarea {
          width: 100%;
          border: 1px solid #333;
          background: #0d0d0d;
          color: white;
          border-radius: 10px;
          padding: 14px;
          font-size: 15px;
          font-family: inherit;
        }

        textarea {
          resize: vertical;
        }

        .send-btn {
          margin-top: 8px;
          border: none;
          border-radius: 10px;
          background: ${BRAND_YELLOW};
          color: #050505;
          padding: 18px 20px;
          font-size: 13px;
          font-weight: 900;
          text-transform: uppercase;
          cursor: pointer;
          letter-spacing: 0.3px;
        }

        .send-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .status {
          margin: 4px 0 0;
          color: #d6d6d6;
        }

        .success-box,
.error-box {
  border-radius: 12px;
  padding: 16px;
  margin-top: 4px;
}

.success-box {
  background: rgba(47, 133, 90, 0.16);
  border: 1px solid rgba(47, 133, 90, 0.55);
}

.error-box {
  background: rgba(197, 48, 48, 0.16);
  border: 1px solid rgba(197, 48, 48, 0.55);
}

.success-box strong,
.error-box strong {
  display: block;
  color: #f2f2f2;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.success-box p,
.error-box p {
  margin: 6px 0 0;
  color: #cfcfcf;
  font-size: 14px;
}

        @media (max-width: 700px) {
          .listing-preview {
            grid-template-columns: 1fr;
          }

          .listing-image {
            height: 240px;
          }

          h1 {
            font-size: 23px;
          }

          .logo-img {
            height: 56px;
          }

          .nav-links {
            gap: 18px;
          }

          .yellow-link {
            font-size: 12px !important;
          }
        }
      `}</style>
    </>
  );
}
