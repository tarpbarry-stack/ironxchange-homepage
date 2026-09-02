import { createHash, randomUUID } from "node:crypto";

import {
  SESv2Client,
  SendEmailCommand
} from "@aws-sdk/client-sesv2";

import {
  buildPassportPresentation
} from "../../../lib/passport/buildPassportPresentation";
import renderPassportEmailHtml
  from "../../../lib/passport/email/renderPassportEmailHtml";
import {
  consumeMarketplaceDistributionRate,
  hashDistributionValue,
  runMarketplaceDistributionIdempotently
} from "../../../lib/marketplace/emailControl.mjs";
import loadDistributionListing
  from "../../../lib/marketplace/loadDistributionListing.mjs";
import {
  getMarketplaceDistributionUrl
} from "../../../lib/marketplace/distributionLinks";

const MAX_RECIPIENTS = 5;
const MAX_MESSAGE_LENGTH = 500;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

function reject(res, status, requestId, code, message, extra = {}) {
  return res.status(status).json({
    ok: false,
    requestId,
    code,
    error: message,
    ...extra
  });
}

function getRequestOrigin(req) {
  const protocol = String(
    req.headers["x-forwarded-proto"] ||
      (req.socket?.encrypted ? "https" : "http")
  )
    .split(",")[0]
    .trim();
  const host = String(
    req.headers["x-forwarded-host"] || req.headers.host || ""
  )
    .split(",")[0]
    .trim();

  if (!host || !/^https?$/u.test(protocol)) return "";
  return `${protocol}://${host}`;
}

function assertSameOrigin(req) {
  const requestOrigin = getRequestOrigin(req);
  const suppliedOrigin = String(req.headers.origin || "")
    .trim()
    .replace(/\/+$/u, "");
  const configuredOrigins = String(
    process.env.EMAIL_ALLOWED_ORIGINS || ""
  )
    .split(",")
    .map(value => value.trim().replace(/\/+$/u, ""))
    .filter(Boolean);
  const allowed = new Set(
    [requestOrigin, ...configuredOrigins].filter(Boolean)
  );

  if (!suppliedOrigin || !allowed.has(suppliedOrigin)) {
    const error = new Error("The request origin could not be verified.");
    error.code = "ORIGIN_REJECTED";
    error.status = 403;
    throw error;
  }

  return requestOrigin;
}

function validateRecipients(value) {
  const raw = Array.isArray(value) ? value.join(",") : String(value || "");
  const recipients = Array.from(
    new Set(
      raw
        .split(/[;,\n]/u)
        .map(email => email.trim().toLowerCase())
        .filter(Boolean)
    )
  );

  if (
    recipients.length < 1 ||
    recipients.length > MAX_RECIPIENTS ||
    recipients.some(email => !EMAIL_PATTERN.test(email) || email.length > 254)
  ) {
    const error = new Error(
      "Enter one to five valid recipient email addresses."
    );
    error.code = "INVALID_RECIPIENTS";
    error.status = 400;
    throw error;
  }

  return recipients;
}

function sanitizeMessage(value) {
  const message = String(value || "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/gu, "")
    .trim();

  if (message.length > MAX_MESSAGE_LENGTH) {
    const error = new Error(
      `Personal note must be ${MAX_MESSAGE_LENGTH} characters or fewer.`
    );
    error.code = "INVALID_MESSAGE";
    error.status = 400;
    throw error;
  }

  return message;
}

function validateIdempotencyKey(value) {
  const key = String(value || "").trim();

  if (!/^[a-zA-Z0-9_-]{16,120}$/u.test(key)) {
    const error = new Error("A valid send token is required.");
    error.code = "INVALID_IDEMPOTENCY_KEY";
    error.status = 400;
    throw error;
  }

  return key;
}

function getClientFingerprint(req) {
  const address = String(req.headers["x-forwarded-for"] || "")
    .split(",")[0]
    .trim() || req.socket?.remoteAddress || "unknown";

  return hashDistributionValue(address).slice(0, 24);
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;")
    .replace(/"/gu, "&quot;")
    .replace(/'/gu, "&#039;");
}

function addPersonalNote(email, message) {
  if (!message) return email;

  const note = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0b0b0b;">
      <tr>
        <td align="center" style="padding:18px 16px 0;">
          <table role="presentation" width="728" cellspacing="0" cellpadding="0" border="0" style="width:728px;max-width:100%;background:#141414;border:1px solid #2d2d2d;border-radius:12px;">
            <tr>
              <td style="padding:14px 18px;color:#d8d8d8;font:14px/21px Arial,Helvetica,sans-serif;">
                <strong style="display:block;margin-bottom:5px;color:#ffc400;font-size:10px;letter-spacing:.8px;text-transform:uppercase;">Personal note</strong>
                ${escapeHtml(message).replace(/\n/gu, "<br />")}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
  const html = email.html.replace(
    /(<body[^>]*>)/iu,
    match => `${match}${note}`
  );

  return {
    ...email,
    html,
    text: `Personal note:\n${message}\n\n${email.text}`
  };
}

function createSesClient() {
  return new SESv2Client({
    region:
      process.env.SES_REGION || process.env.AWS_REGION || "us-east-2"
  });
}

export default async function handler(req, res) {
  const requestId = randomUUID();
  res.setHeader("X-Request-ID", requestId);
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return reject(
      res,
      405,
      requestId,
      "METHOD_NOT_ALLOWED",
      "Method not allowed."
    );
  }

  try {
    const baseUrl = assertSameOrigin(req);
    const recipients = validateRecipients(req.body?.recipients);
    const message = sanitizeMessage(req.body?.message);
    const idempotencyKey = validateIdempotencyKey(
      req.headers["idempotency-key"] || req.body?.idempotencyKey
    );
    const listingId = String(req.body?.listingId || "").trim();
    const clientFingerprint = getClientFingerprint(req);
    const fingerprint = createHash("sha256")
      .update(JSON.stringify({ listingId, recipients, message }))
      .digest("hex");

    const { value, replayed } =
      await runMarketplaceDistributionIdempotently({
        key: `marketplace-share:${clientFingerprint}:${idempotencyKey}`,
        fingerprint,
        task: async () => {
          consumeMarketplaceDistributionRate({
            key: `marketplace-share:${clientFingerprint}`,
            limit: 30,
            windowMs: 15 * 60 * 1000
          });

          const listing = await loadDistributionListing(listingId);
          const presentation = {
            ...buildPassportPresentation({
              listing,
              baseUrl
            }),
            passportUrl:
              listing.passportUrl ||
              getMarketplaceDistributionUrl(listing, baseUrl)
          };
          const email = addPersonalNote(
            renderPassportEmailHtml({ presentation, baseUrl }),
            message
          );
          const fromEmail = String(
            process.env.SES_FROM_EMAIL || "passport@ironxchange.com"
          ).trim();
          const replyTo = String(
            process.env.SES_REPLY_TO_EMAIL || fromEmail
          ).trim();
          const result = await createSesClient().send(
            new SendEmailCommand({
              FromEmailAddress: fromEmail,
              Destination: { ToAddresses: recipients },
              ReplyToAddresses: [replyTo],
              Content: {
                Simple: {
                  Subject: { Data: email.subject, Charset: "UTF-8" },
                  Body: {
                    Html: { Data: email.html, Charset: "UTF-8" },
                    Text: { Data: email.text, Charset: "UTF-8" }
                  }
                }
              }
            })
          );

          return {
            recipientCount: recipients.length,
            messageId: result.MessageId || ""
          };
        }
      });

    console.info({
      event: "marketplace_distribution_email_succeeded",
      requestId,
      listingId,
      recipientCount: value.recipientCount,
      replayed
    });

    return res.status(200).json({
      ok: true,
      requestId,
      recipientCount: value.recipientCount,
      replayed
    });
  } catch (error) {
    const status = Number(error?.status) || 500;
    const retryable = Boolean(
      error?.retryable || status === 429 || status >= 500
    );

    if (error?.retryAfterSeconds) {
      res.setHeader("Retry-After", String(error.retryAfterSeconds));
    }

    console.error({
      event: "marketplace_distribution_email_failed",
      requestId,
      code: error?.code || "EMAIL_SEND_FAILED",
      status,
      retryable
    });

    return reject(
      res,
      status,
      requestId,
      error?.code || "EMAIL_SEND_FAILED",
      status >= 500
        ? "The email could not be delivered. Try again."
        : error?.message || "The email request was rejected.",
      { retryable }
    );
  }
}
