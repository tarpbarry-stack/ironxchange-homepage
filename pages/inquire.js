import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";

const BRAND_YELLOW = "#FFC400";
const STAGING = "https://staging.ironxchange.com";

export default function InquirePage() {
  const router = useRouter();

  const { listingId, title, price, location, image } = router.query;

  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [message, setMessage] = useState("Is this machine still available?");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!listingId) {
      setStatus("Missing listing ID.");
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      const response = await fetch("/api/sharetribe-inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          listingId,
          buyerName,
          buyerEmail,
          buyerPhone,
          message
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        setStatus(data?.error || "Inquiry failed.");
        return;
      }

      setStatus("Message sent successfully.");
    } catch (err) {
      console.error(err);
      setStatus("Something went wrong sending inquiry.");
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

            <div className="listing-preview">
              {image ? (
                <img
                  src={image}
                  alt={title || "Equipment Listing"}
                  className="listing-image"
                />
              ) : null}

              <div>
                <h1>{title || "Equipment Listing"}</h1>

                <div className="listing-meta">
                  <span>{price || "Call for Price"}</span>
                  <span>{location || "Location not listed"}</span>
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

              {status ? <p className="status">{status}</p> : null}
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
          max-width: 760px;
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

        .listing-preview {
          display: grid;
          grid-template-columns: 180px 1fr;
          gap: 18px;
          margin-top: 20px;
          align-items: center;
        }

        .listing-image {
          width: 100%;
          height: 130px;
          object-fit: cover;
          border-radius: 12px;
          background: #111;
        }

        h1 {
          margin: 0;
          font-size: 28px;
          line-height: 1.1;
          color: #f2f2f2;
        }

        .listing-meta {
          margin-top: 12px;
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          color: #a7a7a7;
          font-size: 15px;
        }

        .divider {
          height: 1px;
          background: #282828;
          margin: 24px 0;
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

        @media (max-width: 700px) {
          .listing-preview {
            grid-template-columns: 1fr;
          }

          .listing-image {
            height: 220px;
          }

          h1 {
            font-size: 22px;
          }

          .logo-img {
            height: 56px;
          }
        }
      `}</style>
    </>
  );
}
