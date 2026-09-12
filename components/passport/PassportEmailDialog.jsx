import { useEffect, useRef, useState } from "react";
import {
  captureMarketplaceIntelligence
} from "../../lib/marketplace/cardIntelligence";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

function parseRecipients(value) {
  return Array.from(
    new Set(
      String(value || "")
        .split(/[;,\n]/u)
        .map(email => email.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

function createSendToken() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID().replace(/-/gu, "_");
  }
  return `passport_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}`;
}

export default function PassportEmailDialog({
  open,
  onClose,
  listingId,
  passportId,
  title
}) {
  const [recipientText, setRecipientText] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");
  const [feedback, setFeedback] = useState("");
  const [sendToken, setSendToken] = useState(createSendToken);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setStatus("idle");
    setFeedback("");
    setSendToken(createSendToken());
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    const onKeyDown = event => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    if (status === "sending") return;

    const recipients = parseRecipients(recipientText);
    if (
      recipients.length < 1 ||
      recipients.length > 5 ||
      recipients.some(email => !EMAIL_PATTERN.test(email))
    ) {
      setStatus("error");
      setFeedback("Enter one to five valid email addresses.");
      return;
    }

    setStatus("sending");
    setFeedback("");
    captureMarketplaceIntelligence("listing_share_email_requested", {
      listing_id: listingId,
      channel: "email",
      result: "requested"
    });

    try {
      const response = await fetch("/api/marketplace/share-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": sendToken
        },
        body: JSON.stringify({
          listingId,
          recipients,
          message,
          idempotencyKey: sendToken
        })
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || payload?.ok !== true) {
        const error = new Error(
          payload?.error ||
          "IXI Machine Passport email could not be delivered."
        );
        error.code = payload?.code;
        throw error;
      }

      setStatus("sent");
      setFeedback(
        `Passport sent to ${payload.recipientCount} ${payload.recipientCount === 1 ? "recipient" : "recipients"}.`
      );
      captureMarketplaceIntelligence("listing_share_completed", {
        listing_id: listingId,
        channel: "email",
        result: "email_delivered",
        replayed: Boolean(payload.replayed)
      });
    } catch (error) {
      setStatus("error");
      setFeedback(
        error?.message ||
        "IXI Machine Passport email could not be delivered."
      );
      setSendToken(createSendToken());
      captureMarketplaceIntelligence("listing_share_failed", {
        listing_id: listingId,
        channel: "email",
        result: "failed",
        error_code: error?.code || "email_send_failed"
      });
    }
  }

  return (
    <div
      className="backdrop"
      onMouseDown={event => {
        if (event.target === event.currentTarget && status !== "sending") {
          onClose?.();
        }
      }}
    >
      <section
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="passport-email-title"
      >
        <header>
          <div>
            <span>IXI MACHINE PASSPORT</span>
            <h2 id="passport-email-title">Email Passport</h2>
          </div>
          <button
            type="button"
            className="close"
            onClick={onClose}
            disabled={status === "sending"}
            aria-label="Close email Passport"
          >
            ×
          </button>
        </header>

        <div className="machine">
          <strong>{title}</strong>
          <span>{passportId}</span>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="passport-email-recipients">
            Recipient email
          </label>
          <textarea
            ref={inputRef}
            id="passport-email-recipients"
            value={recipientText}
            onChange={event => setRecipientText(event.target.value)}
            placeholder="buyer@example.com"
            rows={2}
            disabled={status === "sending" || status === "sent"}
            aria-describedby="passport-email-recipient-help"
          />
          <small id="passport-email-recipient-help">
            Up to five addresses, separated by commas.
          </small>

          <label htmlFor="passport-email-note">
            Personal note <em>optional</em>
          </label>
          <textarea
            id="passport-email-note"
            value={message}
            onChange={event => setMessage(event.target.value.slice(0, 500))}
            placeholder="Add a short note for the recipient."
            rows={4}
            disabled={status === "sending" || status === "sent"}
          />
          <small>{message.length}/500</small>

          {feedback ? (
            <p
              className={status === "sent" ? "feedback sent" : "feedback error"}
              role="status"
            >
              {feedback}
            </p>
          ) : null}

          <footer>
            <button
              type="button"
              className="cancel"
              onClick={onClose}
              disabled={status === "sending"}
            >
              {status === "sent" ? "Done" : "Cancel"}
            </button>
            {status !== "sent" ? (
              <button
                type="submit"
                className="send"
                disabled={status === "sending"}
              >
                {status === "sending" ? "Sending…" : "Send Passport"}
              </button>
            ) : null}
          </footer>
        </form>
      </section>

      <style jsx>{`
        .backdrop {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: grid;
          place-items: center;
          padding: 22px;
          background: rgba(0, 0, 0, 0.78);
          backdrop-filter: blur(5px);
        }
        .dialog {
          width: min(520px, 100%);
          overflow: hidden;
          color: #eeeeee;
          background: #111211;
          border: 1px solid #3b3d39;
          border-radius: 14px;
          box-shadow: 0 28px 90px rgba(0, 0, 0, 0.75);
        }
        header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 20px 22px;
          border-bottom: 1px solid #2a2b29;
        }
        header span,
        label {
          color: #ffc400;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        h2 {
          margin: 5px 0 0;
          font-size: 25px;
          text-transform: uppercase;
        }
        .close {
          width: 42px;
          height: 42px;
          color: #bdbdbd;
          background: #151615;
          border: 1px solid #343633;
          border-radius: 9px;
          font-size: 26px;
          cursor: pointer;
        }
        .machine {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          margin: 16px 22px 0;
          padding: 13px 14px;
          background: #0c0d0c;
          border: 1px solid #292b28;
          border-radius: 9px;
        }
        .machine strong {
          font-size: 13px;
        }
        .machine span {
          color: #8a8d88;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
        }
        form {
          padding: 18px 22px 22px;
        }
        label {
          display: flex;
          justify-content: space-between;
          margin: 14px 0 7px;
        }
        label:first-of-type {
          margin-top: 0;
        }
        label em {
          color: #777a75;
          font-style: normal;
        }
        textarea {
          width: 100%;
          padding: 12px;
          resize: vertical;
          color: #eeeeee;
          background: #080908;
          border: 1px solid #343633;
          border-radius: 9px;
          font: 14px/1.45 Arial, Helvetica, sans-serif;
          outline: none;
        }
        textarea:focus {
          border-color: #a98300;
          box-shadow: 0 0 0 2px rgba(255, 196, 0, 0.12);
        }
        small {
          display: block;
          margin-top: 5px;
          color: #72756f;
          font-size: 10px;
        }
        .feedback {
          margin: 14px 0 0;
          padding: 11px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 800;
        }
        .feedback.sent {
          color: #a4e7b3;
          background: rgba(46, 160, 67, 0.1);
          border: 1px solid rgba(46, 160, 67, 0.36);
        }
        .feedback.error {
          color: #ffaaaa;
          background: rgba(210, 56, 56, 0.1);
          border: 1px solid rgba(210, 56, 56, 0.36);
        }
        footer {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          margin-top: 18px;
        }
        footer button {
          min-width: 124px;
          min-height: 44px;
          border-radius: 9px;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          cursor: pointer;
        }
        .cancel {
          color: #a8aaa6;
          background: #151615;
          border: 1px solid #343633;
        }
        .send {
          color: #070807;
          background: #ffc400;
          border: 1px solid #ffc400;
        }
        button:disabled,
        textarea:disabled {
          opacity: 0.58;
          cursor: default;
        }
      `}</style>
    </div>
  );
}
