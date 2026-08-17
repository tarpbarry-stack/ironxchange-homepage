import crypto from "crypto";

import {
  IXI_AOS_OBJECT_COMMIT_VERSION
} from "../../../lib/mos/ixiAosObjectCommit";

import {
  commitTrustedAosObject
} from "../../../lib/server/aos/commitTrustedAosObject";


export const config = {
  api: {
    bodyParser: false
  }
};


const MAX_BODY_BYTES =
  1024 * 1024;

const MAX_CLOCK_SKEW_SECONDS =
  300;


function clean(value) {
  return String(value ?? "").trim();
}


async function readRawBody(req) {
  const chunks = [];
  let length = 0;

  for await (const chunk of req) {
    const buffer =
      Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(chunk);

    length += buffer.length;

    if (length > MAX_BODY_BYTES) {
      const error = new Error(
        "AOS Object commit request exceeds the 1 MB limit."
      );
      error.status = 413;
      error.code = "AOS_COMMIT_BODY_TOO_LARGE";
      throw error;
    }

    chunks.push(buffer);
  }

  return Buffer.concat(chunks);
}


function parseTimestamp(value) {
  const timestamp =
    Number(clean(value));

  if (!Number.isFinite(timestamp)) {
    return null;
  }

  return timestamp;
}


function normalizeSignature(value) {
  const signature =
    clean(value).toLowerCase();

  return signature.startsWith("sha256=")
    ? signature.slice(7)
    : signature;
}


function verifySignature({
  secret,
  timestamp,
  rawBody,
  suppliedSignature
}) {
  const expected =
    crypto
      .createHmac(
        "sha256",
        secret
      )
      .update(
        `${timestamp}.`
      )
      .update(rawBody)
      .digest("hex");

  const supplied =
    normalizeSignature(
      suppliedSignature
    );

  if (
    !/^[a-f0-9]{64}$/.test(supplied)
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(supplied, "hex")
  );
}


function sendError(
  res,
  error
) {
  const status =
    Number(error?.status) ||
    Number(error?.statusCode) ||
    500;

  return res.status(status).json({
    ok: false,
    error: {
      code:
        clean(error?.code) ||
        "AOS_OBJECT_COMMIT_FAILED",
      message:
        clean(error?.message) ||
        "AOS Object commit failed.",
      details:
        error?.details ||
        null
    }
  });
}


export default async function handler(
  req,
  res
) {
  if (req.method !== "POST") {
    res.setHeader(
      "Allow",
      "POST"
    );

    return res.status(405).json({
      ok: false,
      error: {
        code:
          "METHOD_NOT_ALLOWED",
        message:
          "Use POST for AOS Object commit."
      }
    });
  }

  try {
    const secret =
      clean(
        process.env
          .IXI_AOS_COMMIT_SECRET
      );

    if (!secret) {
      const error = new Error(
        "Trusted AOS Object commit integration is not configured."
      );
      error.status = 503;
      error.code =
        "AOS_COMMIT_INTEGRATION_DISABLED";
      throw error;
    }

    const rawBody =
      await readRawBody(req);

    const timestamp =
      parseTimestamp(
        req.headers[
          "x-ixi-timestamp"
        ]
      );

    const now =
      Math.floor(Date.now() / 1000);

    if (
      timestamp === null ||
      Math.abs(now - timestamp) >
        MAX_CLOCK_SKEW_SECONDS
    ) {
      const error = new Error(
        "AOS Object commit signature timestamp is missing or expired."
      );
      error.status = 401;
      error.code =
        "AOS_COMMIT_TIMESTAMP_INVALID";
      throw error;
    }

    const signature =
      req.headers[
        "x-ixi-signature"
      ];

    if (
      !verifySignature({
        secret,
        timestamp,
        rawBody,
        suppliedSignature:
          signature
      })
    ) {
      const error = new Error(
        "AOS Object commit signature is invalid."
      );
      error.status = 401;
      error.code =
        "AOS_COMMIT_SIGNATURE_INVALID";
      throw error;
    }

    let body;

    try {
      body = JSON.parse(
        rawBody.toString("utf8")
      );
    } catch {
      const error = new Error(
        "AOS Object commit body must be valid JSON."
      );
      error.status = 400;
      error.code =
        "AOS_COMMIT_JSON_INVALID";
      throw error;
    }

    if (
      clean(body?.contractVersion) !==
        IXI_AOS_OBJECT_COMMIT_VERSION
    ) {
      const error = new Error(
        "Unsupported AOS Object commit contract."
      );
      error.status = 400;
      error.code =
        "AOS_COMMIT_CONTRACT_INVALID";
      throw error;
    }

    const result =
      await commitTrustedAosObject(
        body
      );

    res.setHeader(
      "Cache-Control",
      "no-store"
    );

    return res.status(
      result?.replayed
        ? 200
        : 201
    ).json(result);

  } catch (error) {
    return sendError(
      res,
      error
    );
  }
}
