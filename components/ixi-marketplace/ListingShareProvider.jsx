import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  buildMarketplaceDistributionText,
  buildMarketplaceSmsHref,
  buildMarketplaceWhatsAppHref,
  getMarketplaceDistributionListingId,
  getMarketplaceDistributionUrl
} from "../../lib/marketplace/distributionLinks";
import {
  captureMarketplaceIntelligence
} from "../../lib/marketplace/cardIntelligence";

function createIdempotencyKey() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `share_${crypto.randomUUID()}`;
  }

  return `share_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function snapshotListing(listing = {}) {
  const publicData =
    listing.publicData || listing.attributes?.publicData || {};

  return {
    id: getMarketplaceDistributionListingId(listing),
    title:
      listing.title || listing.attributes?.title || "Equipment listing",
    hours: listing.hours || publicData.hours || "",
    price: listing.price || publicData.price || "",
    location: listing.location || publicData.location || "",
    passportId: listing.passportId || publicData.passportId || "",
    publicData: {
      hours: publicData.hours || "",
      price: publicData.price || "",
      location: publicData.location || "",
      passportId: publicData.passportId || ""
    }
  };
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export default function ListingShareProvider({ children }) {
  const [composer, setComposer] = useState(null);
  const [channel, setChannel] = useState("email");
  const [recipients, setRecipients] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(
    createIdempotencyKey
  );
  const closeButtonRef = useRef(null);

  const openListingShare = useCallback(listing => {
    const snapshot = snapshotListing(listing);
    if (!snapshot.id) return;

    setComposer(snapshot);
    setChannel("email");
    setRecipients("");
    setMessage("");
    setStatus(null);
    setSending(false);
    setIdempotencyKey(createIdempotencyKey());

    captureMarketplaceIntelligence("listing_share_composer_opened", {
      listing_id: snapshot.id,
      channel: "email",
      result: "opened"
    });
  }, []);

  const closeComposer = useCallback(() => {
    if (sending) return;
    setComposer(null);
    setStatus(null);
  }, [sending]);

  useEffect(() => {
    function handleDistributionOpen(event) {
      openListingShare(event?.detail?.listing || {});
    }

    window.addEventListener(
      "ixi:marketplace-distribution-open",
      handleDistributionOpen
    );

    return () => {
      window.removeEventListener(
        "ixi:marketplace-distribution-open",
        handleDistributionOpen
      );
    };
  }, [openListingShare]);

  useEffect(() => {
    if (!composer) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function onKeyDown(event) {
      if (event.key === "Escape") closeComposer();
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeComposer, composer]);

  const shareUrl = useMemo(() => {
    if (!composer || typeof window === "undefined") return "";
    return getMarketplaceDistributionUrl(
      composer,
      process.env.NEXT_PUBLIC_MARKETPLACE_CANONICAL_ORIGIN ||
        "https://preview.ironxchange.com"
    );
  }, [composer]);

  const shareText = useMemo(
    () => buildMarketplaceDistributionText(composer, shareUrl),
    [composer, shareUrl]
  );

  function changeContent(setter, value) {
    if (status?.type === "success") {
      setIdempotencyKey(createIdempotencyKey());
    }
    setter(value);
    setStatus(null);
  }

  async function sendEmail(event) {
    event.preventDefault();
    if (!composer?.id || sending) return;

    setSending(true);
    setStatus(null);

    captureMarketplaceIntelligence("listing_share_email_requested", {
      listing_id: composer.id,
      channel: "email",
      result: "requested"
    });

    try {
      const response = await fetch("/api/marketplace/share-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey
        },
        body: JSON.stringify({
          listingId: composer.id,
          recipients,
          message,
          idempotencyKey
        })
      });
      const payload = await readJson(response);

      if (!response.ok || !payload.ok) {
        const error = new Error(
          payload.error || "Email could not be delivered."
        );
        error.requestId = payload.requestId || "";
        throw error;
      }

      setStatus({
        type: "success",
        message: payload.replayed
          ? "This email was already delivered. No duplicate was sent."
          : "Machine email delivered.",
        requestId: payload.requestId || ""
      });

      captureMarketplaceIntelligence("listing_share_completed", {
        listing_id: composer.id,
        channel: "email",
        result: "email_delivered",
        replayed: Boolean(payload.replayed)
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error?.message || "Email could not be delivered. Try again.",
        requestId: error?.requestId || ""
      });

      captureMarketplaceIntelligence("listing_share_failed", {
        listing_id: composer.id,
        channel: "email",
        result: "failed",
        error_code: "email_send_failed"
      });
    } finally {
      setSending(false);
    }
  }

  async function copyPreparedText() {
    try {
      await navigator.clipboard.writeText(shareText);
      setStatus({
        type: "success",
        message: "Machine summary and canonical link copied."
      });
      captureMarketplaceIntelligence("listing_share_content_copied", {
        listing_id: composer?.id || "",
        channel: "clipboard",
        result: "copied"
      });
    } catch {
      setStatus({
        type: "error",
        message: "Clipboard access is unavailable in this browser."
      });
    }
  }

  function openNativeChannel() {
    if (typeof window === "undefined") return;

    if (channel === "sms") {
      captureMarketplaceIntelligence("listing_share_handoff_opened", {
        listing_id: composer?.id || "",
        channel: "sms",
        result: "native_handoff"
      });
      window.location.href = buildMarketplaceSmsHref(shareText);
      return;
    }

    captureMarketplaceIntelligence("listing_share_handoff_opened", {
      listing_id: composer?.id || "",
      channel: "whatsapp",
      result: "native_handoff"
    });

    window.open(
      buildMarketplaceWhatsAppHref(shareText),
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <>
      {children}

      {composer ? (
        <div
          className="ixi-distribution-backdrop"
          role="presentation"
          onMouseDown={closeComposer}
        >
          <section
          className="ixi-distribution-composer ph-no-capture ph-mask"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ixi-distribution-title"
            onMouseDown={event => event.stopPropagation()}
          >
            <header>
              <div>
                <span>IXI DISTRIBUTION</span>
                <h2 id="ixi-distribution-title">Send This Machine</h2>
                <p>{composer.title}</p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                className="close-button"
                onClick={closeComposer}
                disabled={sending}
                aria-label="Close distribution composer"
              >
                ×
              </button>
            </header>

            <nav className="channel-tabs" aria-label="Distribution channel">
              {[
                ["email", "Email"],
                ["sms", "SMS"],
                ["whatsapp", "WhatsApp"]
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={channel === value ? "active" : ""}
                  aria-pressed={channel === value}
                  onClick={() => {
                    setChannel(value);
                    setStatus(null);
                    captureMarketplaceIntelligence(
                      "listing_share_channel_selected",
                      {
                        listing_id: composer.id,
                        channel: value,
                        result: "selected"
                      }
                    );
                  }}
                >
                  {label}
                </button>
              ))}
            </nav>

            {channel === "email" ? (
              <form onSubmit={sendEmail}>
                <label>
                  Recipient email
                  <input
                    data-ph-mask="true"
                    type="text"
                    inputMode="email"
                    autoComplete="email"
                    value={recipients}
                    onChange={event =>
                      changeContent(setRecipients, event.target.value)
                    }
                    placeholder="buyer@example.com"
                    disabled={sending}
                    required
                  />
                  <small>Up to five addresses, separated by commas.</small>
                </label>

                <label>
                  Personal note <em>optional</em>
                  <textarea
                    data-ph-mask="true"
                    rows={4}
                    maxLength={500}
                    value={message}
                    onChange={event =>
                      changeContent(setMessage, event.target.value)
                    }
                    placeholder="Why you are sending this machine."
                    disabled={sending}
                  />
                  <small>{message.length}/500 characters</small>
                </label>

                <div className="composer-actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={closeComposer}
                    disabled={sending}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary"
                    disabled={sending}
                  >
                    {sending
                      ? "Sending…"
                      : status?.type === "error"
                        ? "Retry send"
                        : "Send email"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="native-channel">
                <p>
                  This opens your device&apos;s {channel === "sms" ? "SMS" : "WhatsApp"} composer. IronXchange does not collect a phone number or send the message for you.
                </p>
                <textarea
                  readOnly
                  rows={5}
                  value={shareText}
                  aria-label="Prepared machine summary"
                />
                <div className="composer-actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={copyPreparedText}
                  >
                    Copy instead
                  </button>
                  <button
                    type="button"
                    className="primary"
                    onClick={openNativeChannel}
                  >
                    Open {channel === "sms" ? "SMS" : "WhatsApp"}
                  </button>
                </div>
              </div>
            )}

            {status ? (
              <div
                className={`distribution-status ${status.type}`}
                role="status"
                aria-live="polite"
              >
                {status.message}
                {status.requestId ? (
                  <small>Request {status.requestId}</small>
                ) : null}
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      <style jsx global>{`
        .ixi-distribution-backdrop {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: grid;
          place-items: center;
          padding: 18px;
          background: rgba(0, 0, 0, .8);
          backdrop-filter: blur(5px);
        }

        .ixi-distribution-composer {
          width: min(620px, 100%);
          max-height: calc(100vh - 36px);
          overflow: auto;
          color: #f2f2f2;
          background: #111;
          border: 1px solid #303030;
          border-radius: 16px;
          box-shadow: 0 28px 90px rgba(0, 0, 0, .66);
          font-family: Arial, Helvetica, sans-serif;
        }

        .ixi-distribution-composer > header {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          padding: 22px 24px 18px;
          border-bottom: 1px solid #292929;
        }

        .ixi-distribution-composer header span {
          color: #ffc400;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.4px;
        }

        .ixi-distribution-composer h2 {
          margin: 6px 0 4px;
          font-size: 24px;
          text-transform: uppercase;
        }

        .ixi-distribution-composer header p,
        .ixi-distribution-composer .native-channel > p {
          margin: 0;
          color: #999;
          font-size: 13px;
          line-height: 20px;
        }

        .ixi-distribution-composer .close-button {
          width: 34px;
          height: 34px;
          border: 1px solid #363636;
          border-radius: 50%;
          color: #bbb;
          background: #171717;
          font-size: 22px;
          cursor: pointer;
        }

        .ixi-distribution-composer .channel-tabs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          padding: 14px 24px 0;
        }

        .ixi-distribution-composer .channel-tabs button {
          min-height: 42px;
          border: 1px solid #303030;
          border-radius: 9px;
          color: #aaa;
          background: #171717;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
        }

        .ixi-distribution-composer .channel-tabs button.active {
          color: #111;
          background: #ffc400;
          border-color: #ffc400;
        }

        .ixi-distribution-composer form,
        .ixi-distribution-composer .native-channel {
          display: grid;
          gap: 18px;
          padding: 22px 24px 24px;
        }

        .ixi-distribution-composer label {
          display: grid;
          gap: 8px;
          color: #ddd;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .ixi-distribution-composer label em,
        .ixi-distribution-composer label small {
          color: #777;
          font-size: 10px;
          font-style: normal;
          font-weight: 600;
          text-transform: none;
        }

        .ixi-distribution-composer input,
        .ixi-distribution-composer textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 13px 14px;
          border: 1px solid #383838;
          border-radius: 9px;
          outline: none;
          color: #f2f2f2;
          background: #0c0c0c;
          font: 14px/20px Arial, Helvetica, sans-serif;
          resize: vertical;
        }

        .ixi-distribution-composer input:focus,
        .ixi-distribution-composer textarea:focus {
          border-color: #9a7910;
          box-shadow: 0 0 0 2px rgba(255, 196, 0, .1);
        }

        .ixi-distribution-composer .composer-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .ixi-distribution-composer .composer-actions button {
          min-height: 43px;
          padding: 0 18px;
          border-radius: 9px;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          cursor: pointer;
        }

        .ixi-distribution-composer .composer-actions button:disabled {
          opacity: .55;
          cursor: wait;
        }

        .ixi-distribution-composer .secondary {
          color: #bbb;
          background: #171717;
          border: 1px solid #353535;
        }

        .ixi-distribution-composer .primary {
          color: #111;
          background: #ffc400;
          border: 1px solid #ffc400;
        }

        .ixi-distribution-composer .distribution-status {
          margin: 0 24px 24px;
          padding: 12px 14px;
          border-radius: 9px;
          font-size: 13px;
          line-height: 19px;
        }

        .ixi-distribution-composer .distribution-status small {
          display: block;
          margin-top: 5px;
          opacity: .72;
        }

        .ixi-distribution-composer .distribution-status.success {
          color: #d7ebff;
          background: rgba(50, 130, 220, .16);
          border: 1px solid rgba(90, 165, 245, .34);
        }

        .ixi-distribution-composer .distribution-status.error {
          color: #ffd0d0;
          background: rgba(185, 45, 45, .14);
          border: 1px solid rgba(220, 80, 80, .3);
        }

        @media (max-width: 600px) {
          .ixi-distribution-backdrop {
            align-items: end;
            padding: 0;
          }

          .ixi-distribution-composer {
            width: 100%;
            max-height: 92vh;
            border-radius: 16px 16px 0 0;
          }

          .ixi-distribution-composer > header,
          .ixi-distribution-composer form,
          .ixi-distribution-composer .native-channel {
            padding-left: 16px;
            padding-right: 16px;
          }

          .ixi-distribution-composer .channel-tabs {
            padding-left: 16px;
            padding-right: 16px;
          }

          .ixi-distribution-composer .composer-actions {
            display: grid;
            grid-template-columns: 1fr 1.25fr;
          }
        }
      `}</style>
    </>
  );
}
