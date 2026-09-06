import { types as sdkTypes } from "sharetribe-flex-sdk";

import {
  resolveAosBrowserSession
} from "../../../../lib/server/aos/resolveAosBrowserSession";

import {
  requestIxCoreMos,
  resolveIxCoreAosContext
} from "../../../../lib/server/aos/ixiMosInternalClient";

import {
  normalizeOwnedMachineListing
} from "../../../../lib/server/onboarding/normalizeOwnedMachineListing";

const { UUID } = sdkTypes;

function clean(value) {
  return String(value ?? "").trim();
}

function sendError(res, error) {
  const status = Number(error?.status || 500);
  return res.status(status >= 400 && status <= 599 ? status : 500).json({
    ok: false,
    error: {
      code: error?.code || "IXI_MACHINE_PROVISIONING_FAILED",
      message: error?.message || "Machine provisioning failed.",
      details: error?.details || null
    }
  });
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed." } });
  }

  try {
    const listingId = clean(req.body?.listingId);
    if (!listingId) {
      return res.status(400).json({
        ok: false,
        error: {
          code: "IXI_MACHINE_LISTING_ID_REQUIRED",
          message: "Sharetribe listing ID is required."
        }
      });
    }

    const session = await resolveAosBrowserSession(req, res);
    const owned = await session.sdk.ownListings.show({
      id: new UUID(listingId)
    });
    const listing = normalizeOwnedMachineListing(owned?.data?.data || {});

    if (listing.listingId !== listingId) {
      const error = new Error("The authenticated user does not own this listing.");
      error.code = "IXI_MACHINE_LISTING_OWNERSHIP_UNVERIFIED";
      error.status = 403;
      throw error;
    }

    const context = await resolveIxCoreAosContext({ session });
    const result = await requestIxCoreMos({
      path: "/aos/machines/sharetribe-listing",
      method: "POST",
      principalId: context.userId,
      entityId: context.entityId,
      extraHeaders: {
        "Idempotency-Key": `sharetribe-listing:${listingId}`
      },
      body: { listing }
    });

    return res.status(200).json({
      ...result,
      ok: true,
      passportUrl: result?.passport?.passportId
        ? `/p/${encodeURIComponent(result.passport.passportId)}`
        : ""
    });
  } catch (error) {
    return sendError(res, error);
  }
}
