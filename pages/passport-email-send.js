// /pages/passport-email-send.js

import { useState } from "react";

export default function PassportEmailSendPage() {
  const [to, setTo] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  async function handleSend(event) {
    event.preventDefault();

    const recipient = String(to || "").trim();

    if (!recipient || !recipient.includes("@")) {
      setResult({
        ok: false,
        error: "Enter a valid recipient email address."
      });

      return;
    }

    setSending(true);
    setResult(null);

    try {
      const response = await fetch("/api/passport/test-send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          to: recipient,
          passportId: "IXIWQMZWAE"
        })
      });

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.error ||
          "IXI Machine Passport email failed to send."
        );
      }

      setResult({
        ok: true,
        message:
          `IXI Machine Passport sent to ${recipient}.`
      });
    } catch (error) {
      setResult({
        ok: false,
        error:
          error?.message ||
          "IXI Machine Passport email failed to send."
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="page">
      <section className="composer">
        <header className="composer-head">
          <div>
            <span className="eyebrow">
              IXI MACHINE PASSPORT
            </span>

            <h1>Email Passport</h1>

            <p>
              Send the finished machine presentation directly
              to a buyer.
            </p>
          </div>

          <a
            href="/passport-email-preview"
            className="preview-link"
          >
            PREVIEW PASSPORT
          </a>
        </header>

        <form onSubmit={handleSend}>
          <section className="field-panel">
            <label htmlFor="passport-recipient">
              Recipient Email
            </label>

            <input
              id="passport-recipient"
              type="email"
              value={to}
              onChange={event => setTo(event.target.value)}
              placeholder="buyer@example.com"
              autoComplete="email"
              disabled={sending}
            />
          </section>

          <section className="subject-panel">
            <span>Subject</span>

            <strong>
              2020 DEERE 872GP | IXI Machine Passport
              IXIWQMZWAE
            </strong>
          </section>

          <section className="passport-panel">
            <iframe
              title="IXI Machine Passport Email Preview"
              src="/passport-email-preview"
            />
          </section>

          {result ? (
            <div
              className={
                result.ok
                  ? "status success"
                  : "status error"
              }
            >
              {result.ok
                ? result.message
                : result.error}
            </div>
          ) : null}

          <footer className="composer-actions">
            <a
              href="/passport-email-preview"
              className="secondary-button"
            >
              VIEW FULL PREVIEW
            </a>

            <button
              type="submit"
              disabled={sending}
            >
              {sending
                ? "SENDING..."
                : "SEND IXI MACHINE PASSPORT"}
            </button>
          </footer>
        </form>
      </section>

      <style jsx>{`
        :global(html),
        :global(body) {
          margin: 0;
          min-height: 100%;
          background: #080808;
          color: #f2f2f2;
          font-family: Arial, Helvetica, sans-serif;
        }

        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          padding: 28px;
          background:
            radial-gradient(
              circle at top,
              rgba(255, 196, 0, 0.035),
              transparent 30%
            ),
            #080808;
        }

        .composer {
          width: min(1040px, 100%);
          margin: 0 auto;
          background: #101010;
          border: 1px solid #252525;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 22px 70px rgba(0, 0, 0, 0.4);
        }

        .composer-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 22px 24px;
          border-bottom: 1px solid #252525;
        }

        .eyebrow {
          display: block;
          margin-bottom: 7px;
          color: #ffc400;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.14em;
        }

        h1 {
          margin: 0;
          color: #f2f2f2;
          font-size: 28px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .composer-head p {
          margin: 7px 0 0;
          color: #858585;
          font-size: 13px;
          line-height: 1.5;
        }

        .preview-link {
          flex: 0 0 auto;
          color: #a0a0a0;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-decoration: none;
        }

        .preview-link:hover {
          color: #ffc400;
        }

        form {
          padding: 18px;
        }

        .field-panel,
        .subject-panel {
          margin-bottom: 10px;
          padding: 14px 16px;
          background: #141414;
          border: 1px solid #262626;
          border-radius: 11px;
        }

        label,
        .subject-panel span {
          display: block;
          margin-bottom: 7px;
          color: #777777;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        input {
          width: 100%;
          height: 44px;
          padding: 0 13px;
          background: #0d0d0d;
          border: 1px solid #303030;
          border-radius: 9px;
          color: #f2f2f2;
          font-size: 15px;
          outline: none;
        }

        input:focus {
          border-color: rgba(255, 196, 0, 0.65);
          box-shadow: 0 0 0 1px rgba(255, 196, 0, 0.12);
        }

        input:disabled {
          opacity: 0.6;
        }

        .subject-panel strong {
          color: #e7e7e7;
          font-size: 14px;
          line-height: 1.4;
        }

        .passport-panel {
          height: 700px;
          overflow: hidden;
          background: #090909;
          border: 1px solid #262626;
          border-radius: 12px;
        }

        iframe {
          width: 100%;
          height: 100%;
          border: 0;
          background: #090909;
        }

        .status {
          margin-top: 10px;
          padding: 12px 14px;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 800;
        }

        .status.success {
          color: #9ce3ad;
          background: rgba(46, 160, 67, 0.09);
          border: 1px solid rgba(46, 160, 67, 0.3);
        }

        .status.error {
          color: #ff9a9a;
          background: rgba(210, 56, 56, 0.09);
          border: 1px solid rgba(210, 56, 56, 0.3);
        }

        .composer-actions {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          padding-top: 14px;
        }

        .secondary-button,
        button {
          min-height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 18px;
          border-radius: 9px;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 0.08em;
          text-decoration: none;
          text-transform: uppercase;
        }

        .secondary-button {
          color: #888888;
          background: #121212;
          border: 1px solid #2b2b2b;
        }

        button {
          color: #0a0a0a;
          background: #ffc400;
          border: 1px solid #ffc400;
          cursor: pointer;
        }

        button:disabled {
          opacity: 0.55;
          cursor: default;
        }

        @media (max-width: 700px) {
          .page {
            padding: 0;
          }

          .composer {
            border-left: 0;
            border-right: 0;
            border-radius: 0;
          }

          .composer-head {
            display: block;
            padding: 18px;
          }

          .preview-link {
            display: inline-block;
            margin-top: 12px;
          }

          form {
            padding: 10px;
          }

          .passport-panel {
            height: 620px;
          }

          .composer-actions {
            display: grid;
            grid-template-columns: 1fr;
          }

          .secondary-button,
          button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
