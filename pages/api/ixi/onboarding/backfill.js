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

function boundedInteger(value, fallback, min, max) {
  const number = Number(value);
  return Number.isInteger(number)
    ? Math.min(max, Math.max(min, number))
    : fallback;
}

function sendError(res, error) {
  const status = Number(error?.status || 500);
  return res.status(status >= 400 && status <= 599 ? status : 500).json({
    ok: false,
    error: {
      code: error?.code || "IXI_MACHINE_BACKFILL_FAILED",
      message: error?.message || "Machine identity backfill failed.",
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
    const page = boundedInteger(req.body?.page, 1, 1, 10000);
    const perPage = boundedInteger(req.body?.perPage, 20, 1, 25);
    const session = await resolveAosBrowserSession(req, res);
    const context = await resolveIxCoreAosContext({ session });
    const response = await session.sdk.ownListings.query({ page, perPage });
    const records = Array.isArray(response?.data?.data) ? response.data.data : [];

    const results = await Promise.allSettled(
      records.map(record => {
        const listing = normalizeOwnedMachineListing(record);
        return requestIxCoreMos({
          path: "/aos/machines/sharetribe-listing",
          method: "POST",
          principalId: context.userId,
          entityId: context.entityId,
          extraHeaders: {
            "Idempotency-Key": `sharetribe-listing:${listing.listingId}`
          },
          body: { listing }
        });
      })
    );

    const failures = results
      .map((result, index) => ({ result, listingId: normalizeOwnedMachineListing(records[index]).listingId }))
      .filter(item => item.result.status === "rejected")
      .map(item => ({
        listingId: item.listingId,
        code: item.result.reason?.code || "IXI_MACHINE_BACKFILL_ITEM_FAILED",
        message: item.result.reason?.message || "Machine backfill failed."
      }));

    const totalPages = Number(response?.data?.meta?.totalPages || page);

    return res.status(failures.length ? 207 : 200).json({
      ok: failures.length === 0,
      page,
      perPage,
      processed: records.length,
      succeeded: results.length - failures.length,
      failed: failures.length,
      failures,
      nextPage: page < totalPages ? page + 1 : null
    });
  } catch (error) {
    return sendError(res, error);
  }
}
