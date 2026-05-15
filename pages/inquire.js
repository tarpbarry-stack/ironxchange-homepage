import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";

const BRAND_YELLOW = "#FFC400";

export default function InquirePage() {
  const router = useRouter();
  const { listingId } = router.query;

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

    if (!message.trim()) {
      setStatus("Please enter a message.");
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
      setStatus("Something went wrong sending the inquiry.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Message Seller | IronXchange</title>
      </Head>

      <main>
        <div className="card">
          <a href="javascript:history.back()" className="back">
            ← Back to Listing
          </a>

          <h1>Message Seller</h1>
          <p className="sub">
            Send the seller your contact information and message.
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
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
              />
            </label>

            <button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Message"}
            </button>

            {status && <p className="status">{status}</p>}
          </form>
        </div>
      </main>

      <style jsx>{`
        :global(body) {
          margin: 0;
          background: #0b0b0b;
          color: #f2f2f2;
          font-family: Arial, sans-serif;
        }

        main {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 30px;
        }

        .card {
          width: 100%;
          max-width: 560px;
          background: #151515;
          border: 1px solid #282828;
          border-radius: 18px;
          padding: 28px;
        }

        .back {
          color: #aaa;
          text-decoration: none;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
        }

        h1 {
          margin: 22px 0 8px;
          font-size: 32px;
        }

        .sub {
          margin: 0 0 24px;
          color: #aaa;
        }

        form {
          display: grid;
          gap: 16px;
        }

        label {
          display: grid;
          gap: 7px;
          color: #ddd;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.4px;
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

        button {
          margin-top: 8px;
          border: none;
          border-radius: 10px;
          background: ${BRAND_YELLOW};
          color: #050505;
          padding: 16px 20px;
          font-size: 14px;
          font-weight: 900;
          text-transform: uppercase;
          cursor: pointer;
        }

        button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .status {
          margin: 4px 0 0;
          color: #ddd;
          font-size: 14px;
        }
      `}</style>
    </>
  );
}
